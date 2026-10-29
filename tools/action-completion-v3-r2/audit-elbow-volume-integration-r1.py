"""Compare captured pose/recipe invariants when enabling existing elbow DQS."""
import argparse
import hashlib
import json
import math
from pathlib import Path

read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def audit(old_folder, new_folder):
    old, new = [read(p/'capture.json') for p in [old_folder, new_folder]]
    assert old['complete'] and new['complete']
    assert old['stableId'] == new['stableId']
    assert old['camera'] == new['camera'], 'Camera changed'
    assert len(old['metrics']) == len(new['metrics']) == new['plan']['frameCount']+1
    recipes = [read(p/'recipe.snapshot.json') for p in [old_folder, new_folder]]
    corrections = [r.pop('jointCorrections') for r in recipes]
    recipes[1].pop('elbowVolumeRevision')
    assert recipes[0] == recipes[1], 'Unexpected recipe change'
    assert corrections[0] == [c for c in corrections[1] if c['profile'] != 'elbow-dqs-r1']
    assert sum(c == {'profile': 'elbow-dqs-r1', 'version': '0.1.0-r1'} for c in corrections[1]) == 1
    maximum = 0.0
    vertex_counts, movement = [], []
    for before, after in zip(old['metrics'], new['metrics']):
        assert before['frame'] == after['frame'] and before['time'] == after['time']
        assert set(before['joints']) == set(after['joints'])
        for joint, point in before['joints'].items():
            maximum = max(maximum, math.dist(point, after['joints'][joint])*1000)
        corrective = after['jointCorrections']['elbow']
        assert corrective['mode'] == 'dqs' and corrective['vertices'] > 0
        vertex_counts.append(corrective['vertices'])
        movement.append(corrective['maxMoveMm'])
    assert maximum < 1e-5, 'Actual skeleton or support anchors moved'
    flags = read(new_folder/'triage.json')['flags']
    assert not flags, flags
    return {'format': 'pose-hub-elbow-volume-integration@1', 'id': new['stableId'],
            'oldCapture': str(old_folder/'capture.json'), 'oldCaptureSha256': sha(old_folder/'capture.json'),
            'captureSha256': sha(new_folder/'capture.json'), 'samples': len(new['metrics']),
            'allJointPositionsMaxDeltaMm': maximum, 'cameraUnchanged': True,
            'onlyRecipeChange': 'Existing elbow-dqs-r1 plus provenance',
            'correctiveAppliedEveryFrame': True, 'correctedVerticesRange': [min(vertex_counts), max(vertex_counts)],
            'elbowMaxMoveMm': max(movement), 'rawFlags': flags, 'passed': True,
            'limits': ['Pose invariants and component application do not replace visual review.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('old', type=Path)
    parser.add_argument('new', type=Path)
    args = parser.parse_args()
    result = audit(args.old, args.new)
    with (args.new/'elbow-integration-audit.json').open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(result, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    print(json.dumps(result))
