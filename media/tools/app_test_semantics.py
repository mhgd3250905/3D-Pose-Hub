#!/usr/bin/env python3
"""Attach evidenced training definitions to the unreviewed App test catalog.

The video loop never supplies a training dose. Unknown prescription values stay
null. Rendering inputs and source media are not changed by this module.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
import os
import uuid


FIELDS = (
    'purpose', 'category', 'muscles', 'position', 'unilateral', 'level', 'scenes',
    'defaultDose', 'doseRange', 'cues', 'primaryCue', 'commonErrors', 'cautions',
    'contraindications', 'alternative', 'countingSemantics', 'demonstratedSide', 'cautionNotes',
)
SEMANTIC_UPDATE_FIELDS = set(FIELDS) | {
    'trainingSemantics', 'trainingDefinitionComplete', 'equipment', 'equipmentZh',
    'renderPropTypes',
}
CORE_FIELDS = ('category', 'level', 'position', 'unilateral', 'scenes', 'cues.zh')
BATCH_FILES = ('semantics-pr14-r1.json', 'semantics-latest-r1.json')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def fingerprint(path):
    data = Path(path).read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def canonical_hash(value):
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'),
                      allow_nan=False).encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def missing_definition(row):
    missing = []
    for field in CORE_FIELDS:
        value = row
        for key in field.split('.'):
            value = value.get(key) if isinstance(value, dict) else None
        if value is None or value == '' or value == []:
            missing.append(field)
    dose = row.get('defaultDose') or {}
    mode = dose.get('mode')
    if mode not in ('time', 'reps'):
        missing.append('defaultDose.mode')
    for key in ('sets', 'restSeconds') + (('seconds',) if mode == 'time' else ('reps',) if mode == 'reps' else ()):
        value = dose.get(key)
        if type(value) not in (int, float) or value < (0 if key == 'restSeconds' else 1):
            missing.append('defaultDose.' + key)
    if row.get('level') is not None and (type(row['level']) is not int or row['level'] not in (1, 2, 3)):
        missing.append('level')
    if type(row.get('unilateral')) is not bool and 'unilateral' not in missing:
        missing.append('unilateral')
    return sorted(set(missing))


def evidence_refs(repo, evidence):
    refs = []
    for item in evidence:
        relative = item['path']
        path = (repo / relative).resolve(strict=True)
        require(path.is_relative_to(repo.resolve()), 'Evidence outside repository: ' + relative)
        actual = fingerprint(path)
        for key in ('bytes', 'sha256'):
            require(key not in item or item[key] == actual[key], 'Semantic evidence changed: ' + relative)
        refs.append({**copy.deepcopy(item), **actual})
    require(refs, 'A semantic draft must cite source evidence')
    return refs


def validate_draft(draft, row):
    aid = row['id']
    require(draft['revision'] == row['revision'], 'Semantic draft revision mismatch: ' + aid)
    dose = draft.get('defaultDose') or {}
    require(dose.get('mode') in ('time', 'reps'), 'Missing explicit training mode: ' + aid)
    wrong_unit = 'reps' if dose['mode'] == 'time' else 'seconds'
    require(dose.get(wrong_unit) is None, 'Mixed dose units: ' + aid)
    for key, value in dose.items():
        if key != 'mode' and value is not None:
            require(type(value) in (int, float) and value >= (0 if key == 'restSeconds' else 1),
                    'Invalid dose value: ' + aid + '/' + key)
    evidence_fields = {field for item in draft.get('evidence', []) for field in item.get('fields', [])}
    for key, value in dose.items():
        if key != 'mode' and value is not None:
            require('defaultDose.' + key in evidence_fields or 'defaultDose' in evidence_fields,
                    'Numeric dose lacks a specific source reference: ' + aid + '/' + key)
    if draft.get('level') is not None:
        require('level' in evidence_fields, 'Difficulty lacks source evidence: ' + aid)
    if draft.get('doseRange'):
        require('doseRange' in evidence_fields or any(f.startswith('doseRange.') for f in evidence_fields),
                'Dose range lacks source evidence: ' + aid)
    if aid in ('h-straight-arm-hang-native', 'h-bilateral-farmer-hold-native'):
        require(dose['mode'] == 'time' and 'reps' not in dose, 'Static hold cannot prescribe reps: ' + aid)
    cues = draft.get('cues', {}).get('zh', [])
    require(1 <= len(cues) <= 3 and all(isinstance(x, str) and x.strip() for x in cues),
            'Expected one to three evidenced Chinese cues: ' + aid)


def enrich(catalog, repo):
    repo = Path(repo).resolve()
    result = copy.deepcopy(catalog)
    rows = {r['id']: r for r in result['actions']}
    require(len(rows) == len(result['actions']), 'Duplicate semantic catalog ID')
    base_path = repo / 'catalog/catalog.json'
    original = read(base_path)
    declared = result['semanticCatalog']
    require(fingerprint(base_path) == {key: declared[key] for key in ('bytes', 'sha256')},
            'Pinned 142-action semantic source changed')
    originals = {r['id']: r for r in original['drills']}
    taxonomy = read(repo / 'catalog/taxonomy.json')
    source_ref = {'path': 'catalog/catalog.json', **fingerprint(base_path)}
    attachments = [source_ref]
    updated = set()
    batches = []
    drafts = {}
    for filename in BATCH_FILES:
        path = repo / 'catalog/test' / filename
        if not path.exists():
            continue
        batch = read(path)
        require(batch.get('format') == 'pose-hub-test-semantics@1' and
                batch.get('reviewed') is False and batch.get('releaseEligible') is False,
                'Semantic batch must remain test/unreviewed: ' + filename)
        ref = {'path': path.relative_to(repo).as_posix(), **fingerprint(path)}
        ids = []
        for draft in batch['actions']:
            aid = draft['id']
            require(aid in rows and aid not in drafts and aid not in originals,
                    'Unexpected or duplicate new-definition ID: ' + aid)
            validate_draft(draft, rows[aid])
            require(all(tag in taxonomy.get('cautions', []) for tag in draft.get('cautions', [])),
                    'cautions must contain body-region tags, not free text: ' + aid)
            drafts[aid] = (draft, ref, batch['batchId'])
            ids.append(aid)
        require(len(set(ids)) == len(ids), 'Duplicate batch ID')
        batches.append({'batchId': batch['batchId'], 'source': ref,
                        'updatedActionIds': sorted(ids), 'actionCount': len(ids)})
        attachments.append(ref)
        updated.update(ids)

    for aid, row in rows.items():
        for key in FIELDS:
            row.pop(key, None)
        if aid in originals:
            source = originals[aid]
            for key in FIELDS:
                if key in source:
                    row[key] = copy.deepcopy(source[key])
            refs = [{**source_ref, 'actionId': aid, 'note': 'Exact-ID inherited definition; historical approval is not transferred.'}]
            batch_id = 'inherited-142'
            unknown = []
        elif aid in drafts:
            draft, ref, batch_id = drafts[aid]
            for key in FIELDS:
                if key in draft:
                    row[key] = copy.deepcopy(draft[key])
            if 'equipment' in draft and draft['equipment'] != row['equipment']:
                row.setdefault('renderPropTypes', copy.deepcopy(row['equipment']))
                row['equipment'] = copy.deepcopy(draft['equipment'])
                # The draft supplies real equipment IDs. Preserve the visual source list separately.
                equipment_taxonomy = taxonomy.get('equipment', {})
                if isinstance(equipment_taxonomy, dict):
                    row['equipmentZh'] = '、'.join(
                        (equipment_taxonomy.get(e, {}).get('zh', e)
                         if isinstance(equipment_taxonomy.get(e, {}), dict) else e)
                        for e in row['equipment']) or '无额外器械'
            refs = [{**ref, 'actionId': aid}, *evidence_refs(repo, draft['evidence'])]
            unknown = copy.deepcopy(draft.get('unknownFields', []))
        else:
            batch_id = None
            refs = []
            unknown = [{'field': field, 'reason': 'Training definition has not yet been supplied.'}
                       for field in (*CORE_FIELDS, 'defaultDose')]
        missing = missing_definition(row)
        unknown_by_field = {entry['field']: entry for entry in unknown}
        for field in missing:
            unknown_by_field.setdefault(field, {'field': field, 'reason': 'No explicit value in the available source; left empty.'})
        row['trainingDefinitionComplete'] = not missing
        row['trainingSemantics'] = {
            'status': 'complete-unreviewed' if not missing else 'partial-unreviewed',
            'reviewed': False, 'releaseEligible': False, 'batchId': batch_id,
            'definitionComplete': not missing, 'missingRequiredFields': missing,
            'unknownFields': sorted(unknown_by_field.values(), key=lambda x: x['field']),
            'evidence': refs, 'videoLoopIsTrainingDose': False,
        }

    complete = sorted(aid for aid, row in rows.items() if row['trainingDefinitionComplete'])
    for batch in batches:
        batch['definitionCompleteIds'] = sorted(set(batch['updatedActionIds']) & set(complete))
        batch['incompleteActionIds'] = sorted(set(batch['updatedActionIds']) - set(complete))
    unresolved = {aid: row['trainingSemantics']['unknownFields'] for aid, row in sorted(rows.items())
                  if row['trainingSemantics']['unknownFields']}
    summary = {
        'format': 'pose-hub-test-semantics-summary@1', 'status': 'test-unreviewed',
        'reviewed': False, 'releaseEligible': False,
        'inheritedActionCount': len(set(rows) & originals.keys()),
        'updatedActionIds': sorted(updated), 'updatedActionCount': len(updated),
        'pendingAuthoringIds': sorted(set(rows) - originals.keys() - drafts.keys()),
        'definitionCompleteIds': complete, 'definitionCompleteCount': len(complete),
        'incompleteActionIds': sorted(set(rows) - set(complete)),
        'unresolvedById': unresolved, 'batches': batches, 'sourceFiles': attachments,
        'requiredForPlanning': list(CORE_FIELDS) + ['defaultDose.mode', 'defaultDose.sets',
                               'defaultDose.reps|seconds', 'defaultDose.restSeconds'],
        'videoLoopIsTrainingDose': False,
    }
    summary['revisionSha256'] = canonical_hash(summary)
    result['trainingSemantics'] = summary
    return result


def media_identity(row):
    return {key: value for key, value in row.items() if key not in SEMANTIC_UPDATE_FIELDS}


def validate_semantics_refresh(before, after):
    previous = {r['id']: r for r in before['actions']}
    current = {r['id']: r for r in after['actions']}
    require(previous.keys() == current.keys() and len(current) == len(after['actions']),
            'A live semantic refresh cannot add/remove media IDs')
    for aid in previous:
        require(media_identity(previous[aid]) == media_identity(current[aid]),
                'A live semantic refresh changed rendering/source identity: ' + aid)
        require(current[aid].get('reviewed') is False and current[aid].get('releaseEligible') is False,
                'A semantic refresh cannot approve media: ' + aid)
    for key in before.keys() | after.keys():
        if key not in ('actions', 'trainingSemantics'):
            require(before.get(key) == after.get(key), 'Unexpected catalog change during semantic refresh: ' + key)


def write_atomic(path, value):
    path = Path(path)
    temporary = path.with_name('.' + path.name + '.' + uuid.uuid4().hex + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n',
                         encoding='utf-8', newline='\n')
    os.replace(temporary, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--catalog', type=Path, required=True)
    args = parser.parse_args()
    before = read(args.catalog)
    after = enrich(before, args.repo)
    validate_semantics_refresh(before, after)
    write_atomic(args.catalog, after)
    info = after['trainingSemantics']
    print(json.dumps({**{key: info[key] for key in ('updatedActionCount', 'definitionCompleteCount',
                                                  'revisionSha256')},
                      'pendingAuthoringCount': len(info['pendingAuthoringIds'])}))


if __name__ == '__main__':
    main()
