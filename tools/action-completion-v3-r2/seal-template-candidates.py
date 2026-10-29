"""Seal 32 reproducible candidates only after current evidence agrees.

This never grants user acceptance or production/release approval.
"""
import argparse
import hashlib
import importlib.util
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
OUT = Path('F:/PoseHub-v2-production/template-finalization-20261029')
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def collect():
    module = importlib.util.spec_from_file_location('status_builder', HERE/'finalization-status.py')
    status = importlib.util.module_from_spec(module)
    module.loader.exec_module(status)
    status.build()
    rows = read(OUT/'status.json')['actions']
    recipes = {read(p)['id']: p for p in (REPO/'catalog/production/remaining32-r3/groups').glob('*/*.json')}
    if len(rows) != 32 or set(recipes) != {r['id'] for r in rows}:
        raise ValueError('Exactly the same 32 stable IDs are required')
    bad = [(r['id'], r['status']) for r in rows if r['status'] != 'candidate-reviewed']
    if bad:
        raise ValueError('Unfinished candidates: '+json.dumps(bad))
    issue_file = OUT/'qa/known-issues.json'
    for issue in read(issue_file)['issues']:
        evidence = issue.get('closureEvidence', {})
        path = Path(evidence.get('path', ''))
        if issue['status'] != 'resolved' or not path.is_file() or sha(path) != evidence.get('sha256'):
            raise ValueError('Known issue lacks a current closure receipt: '+issue['id']+' / '+issue['key'])
    subprocess.run(['node', str(HERE/'audit-source-straight-r1.mjs')], cwd=REPO, check=True)
    straight_audit = read(OUT/'qa/source-straight-current.json')
    if not straight_audit['pass']:
        raise ValueError('Original straight-limb constraints have not passed')
    entries, hashes = [], {}
    for row in rows:
        folder = Path(row['capture']).parent
        capture = read(folder/'capture.json')
        receipt = read(folder/'visual-review.json')
        preview = read(folder/'review/review.json')
        recipe_path = recipes[row['id']]
        recipe = read(recipe_path)
        if sha(recipe_path) != capture['recipeSha256']:
            raise ValueError('Recipe changed: '+row['id'])
        if capture['plan']['fps'] != 30 or len(capture['metrics']) != capture['plan']['frameCount']+1:
            raise ValueError('Incomplete actual frame sequence: '+row['id'])
        for source in read(folder/'source-manifest.json')['sources']:
            name = source['path']
            if name not in hashes:
                hashes[name] = sha(REPO/name)
            if hashes[name] != source['sha256']:
                raise ValueError('Captured source changed: '+row['id']+' / '+name)
        if receipt.get('userAccepted') is not False or receipt.get('releaseEligible') is not False:
            raise ValueError('Candidate receipt must retain pending user acceptance')
        if preview['captureSha256'] != sha(folder/'capture.json'):
            raise ValueError('Preview does not match capture: '+row['id'])
        for name, record in preview['files'].items():
            if sha(folder/'review'/name) != record['sha256']:
                raise ValueError('Preview artifact changed: '+row['id']+' / '+name)
        entries.append({
            'id': row['id'], 'nameZh': recipe['nameZh'],
            'recipe': recipe_path.relative_to(REPO).as_posix(), 'recipeSha256': sha(recipe_path),
            'spec': recipe['spec'], 'specSha256Lf': recipe['specSha256Lf'],
            'model': recipe['model'], 'camera': recipe['camera'],
            'resolvedCamera': capture['camera'],
            'previewContentRect': preview['sampledAlphaContentRect'],
            'contentRectScope': preview['contentRectScope'],
            'hands': recipe['hands'], 'jointCorrections': recipe.get('jointCorrections', []),
            'appearance': recipe.get('appearance'),
            'evidence': {name: {'path': str(folder/name), 'sha256': sha(folder/name)}
                         for name in ['capture.json', 'source-manifest.json', 'triage.json', 'visual-review.json', 'technical-review.json', 'review/review.json']
                         if (folder/name).exists()},
            'rawFlags': row.get('rawFlags', []),
            'resolvedRotationAdvisories': row.get('resolvedRotationAdvisories', []),
            'acceptedLimitationsZh': row.get('acceptedLimitationsZh', []),
            'preview': str(folder/'review/preview.mp4'),
            'previewSha256': preview['files']['preview.mp4']['sha256'],
            'candidateReviewed': True, 'userReviewed': False, 'releaseEligible': False,
        })
    return {'format': 'pose-hub-template-candidate-snapshot@1',
            'scope': '32 low-resolution reviewed candidates; user acceptance and final production pending',
            'counts': {'candidates': 32, 'userAccepted': 0},
            'sourceHashes': hashes, 'actions': entries,
            'knownIssueClosures': {'path': str(issue_file), 'sha256': sha(issue_file)},
            'originalStraightAudit': straight_audit,
            'limitations': ['Sampled images and technical checks do not prove every possible collision is absent.',
                            'A different compatible body still requires a new contact/framing regression preview.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    snapshot = collect()
    snapshot['id'] = args.output.stem if args.output else 'unsealed-preview'
    snapshot['baselineCommit'] = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    snapshot['workspace'] = str(REPO)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open('x', encoding='utf-8', newline='\n') as stream:
            json.dump(snapshot, stream, ensure_ascii=False, indent=2)
            stream.write('\n')
    print(json.dumps({'candidates': len(snapshot['actions']), 'sources': len(snapshot['sourceHashes']),
                      'output': str(args.output) if args.output else None}))
