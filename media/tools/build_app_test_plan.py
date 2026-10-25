#!/usr/bin/env python3
"""Prepare immutable test-only export plans; never render or upgrade approval.

The explicit PR15 list is the owner-authorized latest revision selection.
Superseded complete media is excluded even while its replacement is pending.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

from prepare_smartfit_alpha import (PlanError, check_file, fingerprint, indexed,
                                    only, read_json, reference, relative_file,
                                    require, sha256)
from app_test_semantics import enrich


FULL = (
    'h-wall-palm-lift-rr5', 'h-bent-knee-calf-raise-rr7',
    'h-chair-single-leg-hip-thrust-rr8', 'h-fixed-bar-vertical-pull-rr7',
    'h-db-overhead-triceps-extension-rr4', 'h-kneeling-instep-stretch-rr6',
    'h-kneeling-thread-needle-rr1',
)
SPARSE = (
    'h-forward-lunge', 'h-lateral-step-lunge', 'h-overhead-triceps-stretch-rr1',
    'h-supine-heel-slide-rr1', 'h-kneeling-pushup-rr1', 'h-short-side-plank-rr2',
    'h-goblet-squat-rr1', 'h-db-floor-fly-rr1', 'h-quadruped-open-rr1',
    'h-sleeper-stretch-rr1', 'o-seated-sidebend-rr2', 'h-quadruped-rockback-rr1',
    'o-seated-calf-raise-rr1', 'o-chair-knee-extension-rr1',
    'h-towel-isometric-curl-rr1', 'h-band-face-pull-rr1',
    'h-bilateral-upper-back-hug-rr3', 'h-supine-bilateral-leg-raise-rr3',
    'h-floor-nordic-hand-reset-rr3',
)
OVERLAPS = {'o-seated-sidebend', 'o-seated-calf-raise', 'o-chair-knee-extension'}


def family(spec_id):
    # Used only for the explicit, reviewed selection above, never directory guessing.
    require(spec_id in FULL + SPARSE, 'Revision is outside the explicit latest-selection table')
    return re.sub(r'-rr\d+$', '', spec_id)


def selection(existing_ids):
    require(len(existing_ids) == len(set(existing_ids)) == 189, 'Expected 189 unique existing actions')
    overrides = {family(s): s for s in FULL + SPARSE}
    require(len(overrides) == 26, 'Duplicate latest-revision family')
    require(set(existing_ids) & overrides.keys() == OVERLAPS, 'Unexpected PR15/base overlap')
    ready = sorted(set(existing_ids) - overrides.keys())
    all_ids = sorted(set(existing_ids) | overrides.keys())
    require(len(ready) == 186 and len(all_ids) == 212, 'Unexpected test-scope count')
    return ready, all_ids, overrides


def json_hash(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode('utf-8')).hexdigest()


def add_execution_rhythm(catalog, repo):
    """Keep training execution semantics distinct from the encoded video loop."""
    source_path = relative_file(repo, 'catalog/catalog.json')
    source = read_json(source_path)
    original = indexed(source['drills'], 'stable semantic catalog')
    catalog['semanticCatalog'] = {'path': 'catalog/catalog.json',
                                  'version': source['version'], **fingerprint(source_path)}
    for row in catalog['actions']:
        rhythm = row['rhythm']
        record = original.get(row['id'], {})
        execution = record.get('rhythm')
        rhythm['execution'] = json.loads(json.dumps(execution, ensure_ascii=False))
        rhythm['executionStatus'] = 'inherited-unreviewed' if execution is not None else 'unknown-unreviewed'
        rhythm['executionSource'] = {'path': 'catalog/catalog.json', 'actionId': row['id'],
                                     'sha256': catalog['semanticCatalog']['sha256']}
        rhythm['videoLoopIsTrainingDose'] = False
    return catalog


def load_spec_metadata(repo, spec_ids=FULL + SPARSE):
    # Imports trusted local spec modules only. No renderer, browser or 3D runtime.
    script = r'''
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const rows=[];
for (const id of JSON.parse(process.argv[2])) {
  const s=(await import(pathToFileURL(path.join(process.argv[1],'drill-anim/specs',id+'.js')).href)).default;
  rows.push({id:s.id,nameZh:s.name,muscleGroups:s.highlight?.groups??[],
    equipment:[...new Set((s.props??[]).map(p=>p.type))],fps:s.fps??30,
    durationSeconds:s.timeline.duration,tracks:s.timeline.tracks??{},stillAt:s.stillAt??null,
    modelProfile:s.modelProfile??null,semantics:s.semantics??s.notes??null});
}
console.log(JSON.stringify(rows));
'''
    result = subprocess.run(['node', '--input-type=module', '-e', script, str(repo),
                             json.dumps(spec_ids)], check=True, capture_output=True, text=True,
                            encoding='utf-8')
    return indexed(json.loads(result.stdout), 'latest spec metadata')


def reuse_action(aid, snapshot_action, media_set, parent_roots, release_action, derivative_cache):
    alias, parent = media_set['id'], media_set['binding']
    dpath = check_file(parent_roots[parent], media_set['derivativeManifest'])
    batch = dpath.parent.parent
    require(dpath == relative_file(parent_roots[parent], media_set['relativeRoot'] + '/manifests/derivatives.json'),
            'Derivative root mismatch')
    if alias not in derivative_cache:
        derivative_cache[alias] = read_json(dpath)
    variants = {theme: only([v for v in derivative_cache[alias]['variants'] if
                            (v['actionId'], v['skin'], v['theme']) == (aid, 'realistic', theme)],
                           f'{aid}/{theme} derivative') for theme in ('dark', 'light')}
    layer_name = f'masters/realistic/{aid}/layer-manifest.json'
    layer_path = relative_file(batch, layer_name)
    layer = read_json(layer_path)
    require(layer['actionId'] == aid and layer['complete'] is True and layer['diagnosticOnly'] is False,
            f'Incomplete layer master: {aid}')
    require(layer['sourceSha256'] == snapshot_action['sourceFingerprint'], f'Source differs: {aid}')
    check_file(parent_roots[parent], snapshot_action['sourceManifest'])
    dark, light = variants.values()
    require(dark['framing'] == light['framing'] and dark['highlight'] == light['highlight'],
            f'Theme-dependent crop/highlight: {aid}')
    framing_path = check_file(batch, dark['framing'])
    baselines, peaks = {}, []
    for theme, variant in variants.items():
        v = release_action['files']['skins']['realistic'][theme]['video']
        require((v['bytes'], v['sha256']) == (variant['video']['bytes'], variant['video']['sha256']),
                f'Release/derivative mismatch: {aid}/{theme}')
        check_file(parent_roots['release'], v)
        check_file(batch, variant['video'])
        require((v['fps'], v['frames'], v['durationSeconds']) ==
                (layer['fps'], layer['frameCount'], layer['durationSeconds']), f'Timing mismatch: {aid}')
        peaks.append(only([k['asset']['frame'] for k in variant['keyframes'] if k['phase'] == 'peak'], 'peak frame'))
        baselines[theme] = {'root': 'release', **v}
    require(peaks[0] == peaks[1], f'Peak frame differs by theme: {aid}')
    row = {'id': aid, 'nameZh': release_action['nameZh'], 'fps': layer['fps'],
           'frames': layer['frameCount'], 'durationSeconds': layer['durationSeconds'],
           'coverFrame': peaks[0], 'coverSize': [720, 720], 'thumbnailSize': [240, 240],
           'sourceRoot': alias, 'layerManifest': reference(alias, layer_name, layer_path),
           'framing': reference(alias, dark['framing']['path'], framing_path),
           'highlight': dark['highlight'], 'baselineVideos': baselines,
           'derivativeManifest': reference(alias, 'manifests/derivatives.json', dpath)}
    return row, layer


def build(args):
    for output in (args.output, args.catalog_output):
        require(not output.exists(), f'Refusing to overwrite output: {output}')
    repo = args.repo.resolve(strict=True)
    roots = {'pilot': args.pilot.resolve(strict=True), 'production': args.production.resolve(strict=True),
             'release': args.release_root.resolve(strict=True)}
    snapshot = read_json(args.snapshot)
    release_path = relative_file(roots['release'], 'manifest.json')
    release = read_json(release_path)
    require(release['version'] == '0.3.0', 'Expected pinned media 0.3.0')
    existing = indexed(snapshot['actions'], 'snapshot actions')
    released = indexed(release['actions'], 'release actions')
    require(existing.keys() == released.keys(), 'Snapshot/release action sets differ')
    ready, eligible, overrides = selection(list(existing))
    dot = read_json(args.dot_selection) if args.dot_selection else None
    dot_rows = dot['actions'] if dot else []
    if dot:
        require(len(dot_rows) == 7, 'Expected exactly seven explicitly selected Dot-v4 actions')
        dot_ids = [row['stableId'] for row in dot_rows]
        dot_families = [row['family'] for row in dot_rows]
        require(len(set(dot_ids)) == 7 and not set(dot_ids) & set(eligible),
                'Dot-v4 stable families overlap or duplicate existing selections')
        require(len(set(dot_families)) == 7 and not set(dot_families) & set(eligible),
                'Dot-v4 semantic families overlap or duplicate existing selections')
        eligible = sorted(eligible + dot_ids)
    sets = indexed(snapshot['mediaSets'], 'media sets')
    source_branch = 'codex/action-library-v2-production'
    source_commit = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()
    pins = {'snapshotSha256': sha256(args.snapshot), 'releaseManifestSha256': sha256(release_path)}
    plan = {'format': 'pose-hub-stacked-alpha-plan@1', 'id': 'app-test-pack-r1',
            'status': 'test-unreviewed', 'reviewed': False, 'releaseEligible': False,
            'consumer': {'name': 'app-test-pack-r1', 'commit': source_commit, 'eligibleActionIds': eligible},
            'sourceMediaVersion': '0.3.0', 'skin': 'realistic', **pins, 'bindings': {}, 'actions': []}
    catalog = {'format': 'pose-hub-app-test-catalog@1', 'id': 'app-test-pack-r1',
               'status': 'test-unreviewed', 'reviewed': False, 'releaseEligible': False,
               'sourceCommit': source_commit, **pins,
               'scope': {'existing': 189, 'latestPr15Families': 26, 'overlaps': sorted(OVERLAPS),
                         'total': len(eligible), 'readyFromExistingLayers': 186,
                         'pendingLatestLayers': 26 + len(dot_rows),
                         'dotV4': len(dot_rows) if dot else 'pending-authoritative-source-mapping'},
               'latestOverrides': overrides, 'actions': []}
    cache = {}
    for aid in ready:
        source = existing[aid]
        media_set = sets[source['mediaSet']]
        action, layer = reuse_action(aid, source, media_set, roots, released[aid], cache)
        plan['actions'].append(action)
        alias = media_set['id']
        plan['bindings'][alias] = {'parentBinding': media_set['binding'], 'relativeRoot': media_set['relativeRoot']}
        catalog['actions'].append({
            'id': aid, 'nameZh': action['nameZh'], 'muscleGroups': released[aid]['muscleGroups'],
            'equipment': released[aid]['equipment'],
            'rhythm': {'fps': action['fps'], 'frames': action['frames'],
                       'durationSeconds': action['durationSeconds'], 'coverFrame': action['coverFrame'],
                       'policy': 'unchanged-frozen-source-motion'},
            'source': {'branch': source_branch, 'commit': snapshot['sourceCommit'],
                       'spec': layer['spec'], 'mediaSet': alias, 'model': layer['model']},
            'revision': Path(layer['spec']['path']).stem,
            'state': 'existing-full-layers-ready-to-encode', 'reviewed': False, 'releaseEligible': False})
    metadata = load_spec_metadata(repo)
    registered_path = relative_file(repo, 'drill-anim/data/home-pr-candidates.json')
    registered = read_json(registered_path)['specs']
    review_path = relative_file(roots['pilot'], 'pr15-final-review-20261024/review-manifest.json')
    full_evidence = indexed(read_json(review_path)['actions'], 'seven complete PR15 reviews')
    require(set(full_evidence) == set(FULL), 'Seven full review identities changed')
    catalog['pr15ReviewManifest'] = reference('pilot', 'pr15-final-review-20261024/review-manifest.json', review_path)
    catalog['pr15RegistrationSha256'] = sha256(registered_path)
    # Human labels are already reviewed documentation, separate from machine tags.
    labels = {}
    for line in (repo / 'docs/drill-catalog.md').read_text(encoding='utf-8').splitlines():
        columns = [c.strip() for c in line.split('|')]
        if len(columns) > 5 and columns[1].startswith('`'):
            labels[columns[1].strip('`')] = {'muscleGroupsZh': columns[3], 'equipmentZh': columns[4]}
    for stable_id, revision in overrides.items():
        m = metadata[revision]
        relative_spec = f'drill-anim/specs/{revision}.js'
        path = relative_file(repo, relative_spec)
        normalized = hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest()
        require(registered[revision + '.js']['sha256'] == normalized, f'Unregistered source: {revision}')
        name = '跪姿低位穿针（小范围修订）' if revision == 'h-kneeling-thread-needle-rr1' else m['nameZh']
        evidence = None
        if revision in FULL:
            old = full_evidence[revision]
            check_file(review_path.parent, old['video'])
            evidence = {'kind': 'complete-review-video-only', 'video': {
                'root': 'pilot', **old['video'], 'path': 'pr15-final-review-20261024/' + old['video']['path']},
                'notes': old.get('notes'), 'transparentLayersAvailable': False}
        catalog['actions'].append({
            'id': stable_id, 'nameZh': name, 'muscleGroups': m['muscleGroups'], 'equipment': m['equipment'],
            'rhythm': {'sourceFps': m['fps'], 'durationSeconds': m['durationSeconds'],
                       'sourceFrames': round(m['fps'] * m['durationSeconds']), 'stillAt': m['stillAt'],
                       'trackNames': sorted(m['tracks']), 'tracksSha256': json_hash(m['tracks']),
                       'policy': 'preserve-latest-spec-motion-no-time-stretch', 'semantics': m['semantics']},
            'source': {'branch': 'codex/pr15-contact-repair', 'commit': source_commit,
                       'spec': {'path': relative_spec, **fingerprint(path), 'lfSha256': normalized},
                       'modelProfile': m['modelProfile'], 'registration': registered[revision + '.js']},
            'revision': revision, 'replacesExisting': stable_id in OVERLAPS,
            'family': stable_id,
            'state': 'pending-latest-transparent-full-layers',
            'existingEvidence': evidence or {'kind': 'sparse-source-check-only', 'fullGpu': 'pending'},
            'boundary': '低位小范围；未恢复原高位起点' if revision == 'h-kneeling-thread-needle-rr1' else None,
            'reviewed': False, 'releaseEligible': False})
        catalog['actions'][-1].update(labels.get(revision, {}))
    if dot:
        catalog['dotV4SelectionSha256'] = sha256(args.dot_selection)
        dot_metadata = load_spec_metadata(repo, tuple(row['id'] for row in dot_rows))
        for row in dot_rows:
            spec_path = relative_file(repo, row['spec'])
            require(sha256(spec_path) == row['specSha256'], 'Dot-v4 spec bytes changed: ' + row['id'])
            m = dot_metadata[row['id']]
            catalog['actions'].append({
                'id': row['stableId'], 'family': row['family'], 'nameZh': row['nameZh'],
                'muscleGroups': m['muscleGroups'], 'equipment': m['equipment'],
                'semanticMetadata': row.get('metadata', {}),
                'rhythm': {'sourceFps': m['fps'], 'durationSeconds': m['durationSeconds'],
                           'sourceFrames': round(m['fps'] * m['durationSeconds']),
                           'trackNames': sorted(m['tracks']), 'tracksSha256': json_hash(m['tracks']),
                           'policy': 'preserve-latest-spec-motion-no-time-stretch', 'semantics': m['semantics']},
                'revision': row['id'], 'source': {'branch': row['branch'], 'commit': row['commit'],
                    'spec': {'path': row['spec'], **fingerprint(spec_path)},
                    'selectionFamily': row['family'], 'modelProfile': m['modelProfile']},
                'state': 'pending-latest-transparent-full-layers',
                'existingEvidence': {'kind': 'sparse-source-check-only', 'fullGpu': 'pending'},
                'reviewed': False, 'releaseEligible': False})
    for entry in catalog['actions']:
        entry.setdefault('family', entry['id'])
        entry.setdefault('muscleGroupsZh', '、'.join(release['taxonomy']['muscleGroups'].get(g, {}).get('zh', g)
                                                  for g in entry['muscleGroups']))
        entry.setdefault('equipmentZh', '、'.join(release['taxonomy']['equipment'].get(g, {}).get('zh', g)
                                               for g in entry['equipment']) or '无额外器械')
        if entry['id'] == 'h-towel-isometric-curl':
            entry['renderPropTypes'] = entry['equipment']
            entry['equipment'] = ['nonelastic-towel']
            entry['equipmentZh'] = '非弹性毛巾（卷束示意，不是弹力带）'
    add_execution_rhythm(catalog, repo)
    catalog = enrich(catalog, repo)
    catalog['actions'].sort(key=lambda row: row['id'])
    require([r['id'] for r in catalog['actions']] == eligible, 'Final catalog lost or duplicated a family')
    require(not OVERLAPS & {a['id'] for a in plan['actions']}, 'Old overlapping videos must not ship as latest')
    for output, value in ((args.output, plan), (args.catalog_output, catalog)):
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open('x', encoding='utf-8', newline='\n') as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
            stream.write('\n')
    return plan, catalog


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('repo', 'snapshot', 'release-root', 'pilot', 'production', 'output', 'catalog-output'):
        p.add_argument('--' + name, type=Path, required=True)
    p.add_argument('--dot-selection', type=Path)
    args = p.parse_args()
    try:
        plan, catalog = build(args)
    except (ValueError, OSError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1
    print(json.dumps({'ready': len(plan['actions']), 'catalog': len(catalog['actions']),
                      'pendingLatest': catalog['scope']['pendingLatestLayers'],
                      'reviewed': False, 'releaseEligible': False,
                      'planSha256': sha256(args.output), 'catalogSha256': sha256(args.catalog_output)}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
