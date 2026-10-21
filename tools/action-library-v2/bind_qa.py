"""Bind externally attested full-sample review to verified batch metadata.

This tool never authors actual-review approvals, scans master pixels or edits
catalog packages. Actual viewing is explicitly attested by the external reviewer;
metadata cannot independently establish that a person viewed an image.
"""
from __future__ import annotations
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path, PurePosixPath

from media import REPO, SKINS, load_batch, read

CHECKS = ('intersections', 'handsFeet', 'propFlicker', 'loopSeam')
LAYERS = {'body': 'bodyProps', 'highlight': 'highlightMask', 'shadow': 'shadow'}
REPORTS = ('qa/full-integrity-qa.json', 'qa/masters-layer-pixels.json',
           'qa/full-sequences.json', 'qa/measured-production.json',
           'qa/review-sheets/index.json', 'previews/mosaic.json')


def need(condition, message):
    if not condition:
        raise ValueError(message)


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode('utf-8')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_ref(root, path):
    raw = path.read_bytes()
    return {'root': 'media', 'path': path.relative_to(root).as_posix(),
            'sha256': sha(raw), 'bytes': len(raw)}


def verified(root, ref):
    need(isinstance(ref, dict), 'Missing evidence reference')
    relative = ref.get('path')
    need(ref.get('root') == 'media' and isinstance(relative, str) and relative
         and ':' not in relative and '\\' not in relative
         and not PurePosixPath(relative).is_absolute()
         and '..' not in PurePosixPath(relative).parts, 'Unsafe evidence path')
    path = (root/relative).resolve()
    need(path.is_relative_to(root) and path.is_file(), 'Missing/escaped evidence: '+relative)
    need(file_ref(root, path) == {key: ref.get(key) for key in ('root', 'path', 'sha256', 'bytes')},
         'Evidence SHA/bytes changed: '+relative)
    return path


def rows_by(rows, keys, expected, label):
    need(isinstance(rows, list), label+': missing rows')
    values = {}
    for row in rows:
        identity = tuple(row.get(k) for k in keys)
        need(identity not in values, label+': duplicate row')
        values[identity] = row
    need(set(values) == expected, label+': incomplete or foreign action/skin matrix')
    return values


def required_frames(action):
    return sorted({0, 30, 60, 90, 120, 150, 180, 210, 239, 240, action['peakFrame']})


def prepare(batch_path, root, review_path):
    """Return all new-only payloads after complete validation; performs no writes."""
    root = Path(root).resolve()
    batch_path, review_path = Path(batch_path).resolve(), Path(review_path).resolve()
    need(batch_path.is_relative_to(REPO), 'Batch must be a repository JSON file')
    batch = load_batch(batch_path)
    ids = [a['id'] for a in batch['actions']]
    matrix = {(aid, skin) for aid in ids for skin in SKINS}
    recipe_path = root/'manifests/batch-source.json'
    recipe, review = read(recipe_path), read(review_path)
    need(recipe.get('batchId') == batch['id'] and recipe.get('batchSha256') == sha(batch_path.read_bytes()),
         'Frozen batch source identity/SHA differs')
    need(review.get('format') == 'pose-hub-v2-full-actual-review@1'
         and review.get('actualReview') is True and review.get('approved') is True,
         'External explicit actual full-sample approval is required')
    reviewer, reviewed_at = review.get('reviewedBy'), review.get('reviewedAt')
    need(isinstance(reviewer, str) and reviewer.strip(), 'Actual reviewer is required')
    try:
        stamp = datetime.fromisoformat(reviewed_at.replace('Z', '+00:00'))
        need(stamp.tzinfo is not None, 'Review timestamp must include its time zone')
    except (AttributeError, TypeError, ValueError):
        raise ValueError('Valid actual review timestamp is required') from None
    for key, value in [('batchId', batch['id']), ('batchSha256', recipe['batchSha256']),
                       ('recipeSha256', recipe['sha256'])]:
        need(review.get(key) == value, 'Actual review '+key+' differs')
    sources = rows_by(recipe.get('actions'), ('id',), {(aid,) for aid in ids}, 'recipe')
    reviewed = rows_by(review.get('actions'), ('id',), {(aid,) for aid in ids}, 'actual review')
    runtime = recipe.get('runtime')
    need(isinstance(runtime, dict) and runtime.get('sha256'), 'Frozen actual GPU runtime is required')
    guard = next((f for f in recipe.get('runnerFiles', []) if f['path'].endswith('/runtime-guard.mjs')), None)
    need(guard is not None, 'Frozen runtime guard is missing')
    reports = {relative: read(root/relative) for relative in REPORTS}
    report_refs = [file_ref(root, root/relative) for relative in REPORTS]
    integrity = reports[REPORTS[0]]
    need(integrity.get('format') == 'pose-hub-v2-batch-integrity@1'
         and integrity.get('batchId') == batch['id']
         and integrity.get('recipeSha256') == recipe['sha256']
         and integrity.get('issues') == [], 'Full integrity report is missing, stale or failed')
    ir = rows_by(integrity.get('renders'), ('actionId', 'skin'), matrix, 'integrity')
    px = rows_by(reports[REPORTS[1]].get('renders'), ('actionId', 'skin'), matrix, 'layer pixels')
    seq = rows_by(reports[REPORTS[2]].get('renders'), ('actionId', 'skin'), matrix, 'sequence anomalies')
    measured = rows_by(reports[REPORTS[3]].get('actions'), ('actionId',), {(aid,) for aid in ids}, 'measured geometry')
    sheets = rows_by(reports[REPORTS[4]].get('sheets'), ('actionId',), {(aid,) for aid in ids}, 'review sheets')
    mosaic = reports[REPORTS[5]]
    need(mosaic.get('schema') == 'pose-hub-mosaic@2' and mosaic.get('status') == 'complete'
         and mosaic.get('missing') == [] and mosaic.get('actions') == ids
         and mosaic.get('skins') == SKINS and set(mosaic.get('themes', [])) == {'dark', 'light'}
         and len(mosaic.get('themes', [])) == 2
         and mosaic.get('highlightStates') == [False, True], 'Incomplete action/skin/theme/highlight mosaic')
    need(review.get('mosaic') == mosaic.get('asset'), 'Actual review must attest the exact complete mosaic')
    verified(root, review['mosaic'])
    payloads = {}
    actual_ref = {'path': str(review_path), 'sha256': sha(review_path.read_bytes()), 'bytes': review_path.stat().st_size}
    for action in batch['actions']:
        aid = action['id']; source = sources[(aid,)]; attestation = reviewed[(aid,)]; frames = required_frames(action)
        package = read(REPO/'catalog/v2/actions'/f'{aid}.json')
        spec_ref = package['source']['spec']; spec_raw = (REPO/action['spec']).read_bytes()
        need(package.get('id') == aid and spec_ref['path'] == action['spec']
             and source['spec'] == action['spec'] and source['specSha256'] == sha(spec_raw)
             and spec_ref['sha256'] == sha(spec_raw.replace(b'\r\n', b'\n')),
             aid+': current catalog/spec differs from render recipe')
        need(attestation.get('specSha256') == spec_ref['sha256']
             and attestation.get('sourceSha256') == source['sourceSha256'], aid+': actual review source differs')
        viewed = attestation.get('actualFullVisualFrames')
        need(isinstance(viewed, dict) and set(viewed) == set(SKINS)
             and all(viewed[skin] == frames for skin in SKINS), aid+': actual full visual frames must cover all five skins')
        sheet = sheets[(aid,)]
        need(sheet.get('skins') == SKINS and sheet.get('frames') == frames, aid+': full temporal sheet coverage differs')
        sheet_ref = sheet['asset']; verified(root, sheet_ref)
        viewed_sheets = attestation.get('viewedSheets')
        need(isinstance(viewed_sheets, list) and sheet_ref in viewed_sheets,
             aid+': exact temporal sheet must be explicitly attested as viewed')
        for ref in viewed_sheets:
            verified(root, ref)
        measurement = measured[(aid,)]
        need(measurement.get('sourceSha256') == source['sourceSha256']
             and measurement.get('specSha256') == spec_ref['sha256']
             and measurement.get('productionFramesMeasured') == 240
             and measurement.get('warnings') == [], aid+': incomplete/stale/failed measured geometry')
        receipt_path = root/'manifests/completed'/f'full-{aid}.json'
        receipt = read(receipt_path)
        need(receipt.get('actionId') == aid and receipt.get('stage') == 'full'
             and receipt.get('recipeSha256') == recipe['sha256']
             and receipt.get('sourceSha256') == source['sourceSha256']
             and receipt.get('runtimeSha256') == runtime['sha256'] and receipt.get('reviewSha256'),
             aid+': no reviewed complete render receipt')
        proof_ref = receipt.get('runtimeProof'); proof = read(verified(root, proof_ref))
        need(proof.get('actionId') == aid and proof.get('stage') == 'full'
             and proof.get('runtimeSha256') == runtime['sha256']
             and proof.get('guardSha256') == guard['sha256']
             and proof.get('browserVersion') == runtime['browserVersion']
             and proof.get('args') == runtime['chromiumArgs'] and proof.get('channel') == runtime['chromiumChannel']
             and proof.get('actualWebGL', {}).get('unmaskedRenderer') == runtime['actualWebGLRenderer']
             and proof.get('actualWebGL', {}).get('contextLost') is False and proof.get('browserCount') == 1,
             aid+': actual GPU runtime proof differs')
        need(set(receipt.get('manifests', {})) == set(SKINS), aid+': incomplete full manifest skin matrix')
        full_sequences, manifest_refs = [], []
        for skin in SKINS:
            key = (aid, skin); i, p, s = ir[key], px[key], seq[key]
            need(all(row.get('sourceSha256') == source['sourceSha256'] for row in (i, p, s)), aid+'/'+skin+': stale numeric source')
            need(i.get('counts') == {'body': 240, 'highlight': 240, 'shadow': 240}
                 and i.get('poseQaFrames') == 241 and i.get('warningFrames') == [], aid+'/'+skin+': incomplete or warned integrity')
            pixel_frames = p.get('frames', [])
            need(p.get('numericIssues') == [] and [f.get('frame') for f in pixel_frames] == list(range(240)),
                 aid+'/'+skin+': incomplete/failed layer pixels')
            need(all(f.get('size') == [1080, 1080] and f.get('bodyAlphaPixels', 0) > 0
                     and f.get('maskColorError') == 0 and f.get('maskOutsideBodyPixels') == 0
                     and f.get('maskPixels', 0) > 0 and f.get('shadowAlphaPixels', 0) > 0 for f in pixel_frames),
                 aid+'/'+skin+': invalid numeric pixel samples')
            need(s.get('specSha256') == spec_ref['sha256'] and s.get('frames') == 240
                 and all(s.get(k) == [] for k in ('emptyFrames', 'canvasEdgeFrames', 'suddenAreaChangeFrames')),
                 aid+'/'+skin+': incomplete/failed sequence anomaly report')
            manifest_ref = receipt['manifests'][skin]; manifest = read(verified(root, manifest_ref)); manifest_refs.append(manifest_ref)
            need(manifest.get('actionId') == aid and manifest.get('skin') == skin
                 and manifest.get('sourceSha256') == source['sourceSha256']
                 and manifest.get('spec', {}).get('sha256') == spec_ref['sha256']
                 and manifest.get('complete') is True and manifest.get('reviewed') is True
                 and not manifest.get('diagnosticOnly') and manifest.get('frameCount') == 240
                 and manifest.get('model', {}).get('id') == batch['model']['id']
                 and manifest.get('model', {}).get('version') == batch['model']['version'], aid+'/'+skin+': invalid full manifest')
            for layer, kind in LAYERS.items():
                sequence_ref = manifest.get('sequences', {}).get(layer)
                sequence = read(verified(root, sequence_ref)); ff = sequence.get('frames', [])
                need([f.get('frame') for f in ff] == list(range(240))
                     and len({f.get('path') for f in ff}) == 240, aid+'/'+skin+'/'+layer+': missing continuous source sequence')
                endpoint = manifest.get('qaEndpoint', {}).get(layer, {})
                need(endpoint.get('frame') == 240 and endpoint.get('path', '').startswith('qa/endpoints/'),
                     aid+'/'+skin+'/'+layer+': independent endpoint missing')
                verified(root, endpoint)
                # Full integrity already reads every PNG. Do not repeat the full
                # PNG scan here; pin the exact sequence and endpoint references.
                full_sequences.append({'skin': skin, 'kind': kind, 'sha256': sequence_ref['sha256']})
        evidence = {'format': 'pose-hub-source-qa-evidence@2', 'id': aid,
            'specSha256': spec_ref['sha256'], 'sourceSha256': source['sourceSha256'],
            'modelVersion': batch['model']['version'], 'skins': SKINS,
            'checks': {key: {'status': 'pass', 'framesReviewed': frames} for key in CHECKS},
            'fullSequences': full_sequences, 'reviewer': reviewer, 'reviewedAt': reviewed_at,
            'method': 'Externally attested actual five-skin full temporal samples and complete light/dark highlight on/off mosaic, supplemented by all-frame numeric QA and receipt-bound GPU/source metadata.',
            'limitations': 'Sampled visual review is not human all-frame viewing or exhaustive mesh collision testing. No editorial, medical, voice-listening, user-release, merge or upload approval is granted.',
            'knownIssues': [], 'actualReview': actual_ref, 'batchId': batch['id'],
            'batchSha256': recipe['batchSha256'], 'recipeSha256': recipe['sha256'],
            'runtimeSha256': runtime['sha256'], 'runtimeProof': proof_ref,
            'evidence': [*report_refs, file_ref(root, recipe_path), file_ref(root, receipt_path),
                         proof_ref, *manifest_refs, *viewed_sheets, review['mosaic']]}
        evidence_path = root/'qa/reviews'/f'{aid}-evidence.json'; raw = encoded(evidence)
        evidence_ref = {'root': 'media', 'path': evidence_path.relative_to(root).as_posix(), 'sha256': sha(raw), 'bytes': len(raw)}
        qa = {key: {'status': 'pass', 'reviewer': reviewer, 'reviewedAt': reviewed_at,
                    'evidence': [evidence_ref], 'framesReviewed': frames} for key in CHECKS}
        payloads[evidence_path] = raw
        payloads[root/'qa/reviews'/f'{aid}.json'] = encoded({'id': aid, 'specSha256': spec_ref['sha256'],
            'sourceQa': qa, 'loopReview': {'status': 'pass', 'reviewer': reviewer,
                'reviewedAt': reviewed_at, 'evidence': [evidence_ref]}})
    need(all(not path.exists() for path in payloads), 'Existing QA evidence is preserved; select a new revision/root')
    return payloads


def bind(batch_path, root, review_path):
    payloads = prepare(batch_path, root, review_path)
    # All actions and all destination names were checked before any pass is
    # written. Exclusive creation also refuses a concurrent existing target.
    for path, raw in payloads.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('xb') as stream:
            stream.write(raw)
    return list(payloads)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', required=True, type=Path)
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--actual-review', required=True, type=Path)
    args = parser.parse_args()
    files = bind(args.batch, args.root, args.actual_review)
    print(json.dumps({'newQaFiles': len(files), 'catalogChanged': False, 'actualReviewAuthored': False}))


if __name__ == '__main__':
    main()
