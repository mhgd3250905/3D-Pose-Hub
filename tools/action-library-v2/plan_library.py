"""Create a complete stable-ID production queue from a read-only source audit.

Existing plans are never overwritten. This creates authoring work, not render approval.
"""
import argparse
import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ORDER = ['standing', 'floor', 'chair', 'portable-equipment', 'wall', 'floor-support', 'apparatus', 'native-eight-second-rewrite']


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def group(action):
    if action['durationClass'] != 'native-eight-seconds':
        return 'native-eight-second-rewrite'
    equipment = set(action['equipment'])
    position = action['position']
    if position in {'support', 'hanging'} or equipment & {'cable', 'landmine', 'swiss-ball', 'ghd', 'reverse-hyper', 'roman-chair', 'rings', 'dip-bars', 'parallettes', 'pullup-bar', 'hip-abductor-machine', 'leg-extension-machine'}:
        return 'apparatus'
    if position in {'quadruped', 'prone', 'kneeling'}:
        return 'floor-support'
    if 'chair' in equipment:
        return 'chair'
    if 'wall' in equipment:
        return 'wall'
    if equipment - {'mat'}:
        return 'portable-equipment'
    if position == 'standing':
        return 'standing'
    return 'floor'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory', required=True, type=Path)
    parser.add_argument('--first-batch', type=Path, default=REPO/'catalog/v2/batches/b001.json')
    parser.add_argument('--output', type=Path, default=REPO/'catalog/v2/production-plan.json')
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Existing production plan is authored state; refusing to overwrite')
    audit, first = read(args.inventory), read(args.first_batch)
    actions = {a['id']: a for a in audit['catalogActions']}
    assert len(actions) == len(audit['catalogActions'])
    reuse = [aid for aid, a in actions.items() if a['existingV2Pilot']]
    first_ids = [a['id'] for a in first['actions']]
    assert set(first_ids) <= actions.keys() and not set(first_ids) & set(reuse)
    assert all(actions[aid]['durationClass'] == 'native-eight-seconds' for aid in first_ids)
    batches = [{'id': 'b001', 'group': 'first-production-batch', 'actions': first_ids,
                'manifest': 'catalog/v2/batches/b001.json', 'state': 'authoring',
                'root': {'alias': 'production', 'relativePath': 'batches/b001'}}]
    assigned = set(reuse+first_ids)
    for category in ORDER:
        remaining = [aid for aid, a in actions.items() if aid not in assigned and group(a) == category]
        remaining.sort(key=lambda aid: ('hiplab' not in actions[aid]['apps'], 'flarelab' not in actions[aid]['apps'], aid))
        for offset in range(0, len(remaining), 8):
            ids = remaining[offset:offset+8]
            bid = f'b{len(batches)+1:03d}'
            batches.append({'id': bid, 'group': category, 'actions': ids, 'manifest': None,
                            'state': 'source-authoring-required',
                            'root': {'alias': 'production', 'relativePath': 'batches/'+bid}})
            assigned.update(ids)
    assert assigned == actions.keys(), 'Every stable catalog ID must be accounted for'
    batch_by_id = {aid: b['id'] for b in batches for aid in b['actions']}
    rows = []
    for aid, a in actions.items():
        seed = a['productionMotionSeed']
        rows.append({'id': aid, 'name': a['name'], 'apps': a['apps'], 'batchId': batch_by_id.get(aid),
            'state': 'reused-technical-accepted' if aid in reuse else 'planned',
            'legacySpec': a['catalogBoundSpec'], 'proposedMotionSeed': seed['path'],
            'seedSha256Lf': seed['sha256'], 'durationSeconds': seed['durationSeconds'],
            'selectionState': a['selectionState'], 'specialHandling': a['specialHandling'],
            'knownSourceIssues': a['knownSourceIssues'], 'releaseApproved': False})
    result = {'format': 'pose-hub-v2-library-production@1', 'baselineCommit': audit['snapshot']['head'],
        'authorization': 'User requested a full-library plan and production after accepting r2 pilot samples.',
        'auditSha256': hashlib.sha256(args.inventory.read_bytes()).hexdigest(), 'auditCounts': audit['counts'],
        'primaryTarget': len(actions), 'reused': len(reuse), 'newActions': len(actions)-len(reuse),
        'model': {'id': 'training-human-v2plus', 'version': '1.0.0-rc2'},
        'skins': ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram'],
        'rootBindings': {'production': 'CLI --production-root', 'pilot': 'CLI --pilot-root'},
        'reusedPilot': {'root': {'alias': 'pilot', 'relativePath': '.'}, 'actions': reuse,
                        'approvedContentCommit': '5b2becb572f06a310be0cb5bdea61f47834dc5c7'},
        'limits': {'renderWorkers': 2, 'jobsPerRenderWorker': 1, 'compositeWorkers': 2,
                   'minimumFreeGiB': 50, 'automaticPublish': False, 'automaticCloudSync': False},
        'batches': batches, 'actions': rows,
        'additionalFamilies': [{'id': a['id'], 'name': a['name'], 'classification': a['classification'],
            'state': 'identity-content-review-required', 'handling': a['recommendedHandling'],
            'sourceFiles': [s['path'] for s in a['sourceVersions']]} for a in audit['specOnlyFamilies']],
        'rules': ['No automatic adoption of a newer -rN source.',
                  'Preview and actual visual review precede complete production.',
                  'Non-eight-second sources require a new authored eight-second loop, not global time scaling.',
                  'Each batch has its own immutable output root, source recipe and media binding.',
                  'Retries retain failed output and use a new revision root.',
                  'Editorial/content/listening/user release approvals are never inferred from production progress.']}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as stream:
        json.dump(result, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    print(json.dumps({'target': len(actions), 'reuse': len(reuse), 'new': len(actions)-len(reuse),
                     'batches': len(batches), 'groups': {g: sum(len(b['actions']) for b in batches if b['group'] == g) for g in ['first-production-batch', *ORDER]}}))


if __name__ == '__main__':
    main()
