"""Summarize measured production geometry and seams; never grants visual approval."""
import argparse
import json
from pathlib import Path

from composite import IDS, SKINS, ref, write_json


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    root = args.root
    results = []
    for action in IDS:
        manifests = [read(root/'masters'/skin/action/'layer-manifest.json') for skin in SKINS]
        if any(not m.get('complete') or m.get('frameCount') != 240 for m in manifests):
            raise ValueError(f'{action}: full 240-frame masters required')
        base = root/'masters/realistic'/action
        metrics = read(base/'metrics.json')
        if not set(range(240)) <= {f['frame'] for f in metrics}:
            raise ValueError(f'{action}: measured metrics must cover every production frame')
        hands = {}
        for side in ('left', 'right'):
            samples = [m.get('visibleSurface', {}).get('hands', {}).get(side) for m in metrics]
            if any(not s or s.get('vertices', 0) <= 0 for s in samples):
                raise ValueError(f'{action}: no complete new hand/finger mesh samples')
            hands[side] = {'minYMillimetres': min(s['minY']*1000 for s in samples),
                           'maxOfFrameMinimumYMillimetres': max(s['minY']*1000 for s in samples),
                           'verticesPerFrame': sorted({s['vertices'] for s in samples}),
                           'minimumElbowDegrees': min(m['elbow'][side] for m in metrics),
                           'supportLockedEveryFrame': all(m.get('locked', {}).get(side) for m in metrics)}
        seams = {skin: read(root/'masters'/skin/action/'seam-qa.json') for skin in SKINS}
        results.append({'actionId': action, 'specSha256': manifests[0]['spec']['sha256'],
            'sourceSha256': manifests[0]['sourceSha256'], 'productionFramesMeasured': 240,
            'geometrySha256': manifests[0]['geometrySha256'],
            'sameGeometryAllSkins': len({m['geometrySha256'] for m in manifests}) == 1,
            'sameOcclusionAllSkins': len({m['occlusionSha256'] for m in manifests}) == 1,
            'hands': hands,
            'minimumVisibleVertexYMillimetres': min(m['visibleSurface']['minY']*1000 for m in metrics),
            'warnings': [{'frame': m['frame'], 'warn': m.get('warn', []), 'solverWarn': m.get('solverWarn', [])}
                         for m in metrics if m.get('warn') or m.get('solverWarn')],
            'seams': seams,
            'evidence': [ref(root, base/'metrics.json')]+[ref(root, root/'masters'/skin/action/'layer-manifest.json') for skin in SKINS]})
    out = root/'qa/measured-production.json'
    write_json(out, {'format': 'pose-hub-measured-production-qa@2', 'actions': results,
                    'automaticApproval': False,
                    'limits': 'CPU skinning includes all visible indexed hand/finger vertices. Shader cloth/breathing effects are separately represented in shadow depth audits. Mesh minima are not exhaustive mesh-mesh collision tests.'})
    print(json.dumps({'report': str(out), 'actions': len(results),
                      'warnings': sum(len(r['warnings']) for r in results)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
