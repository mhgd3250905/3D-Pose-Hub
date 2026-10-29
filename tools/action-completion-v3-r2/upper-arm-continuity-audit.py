"""Measure actual-render r2/r3 geometry and preserve a bounded review receipt."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sections', HERE/'upper-arm-dimensions.py')
sections = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sections)


def run(before, after):
    report = {'diagnosticOnly': True, 'userReviewed': False, 'sources': {}, 'sides': {}}
    source = []
    for folder in (before, after):
        probe = sections.read(folder/'probe.json')
        assert probe['complete'] and not probe['pageErrors']
        g = sections.read(folder/'frame-0060-geometry.json')
        source.append((probe['rest'], g))
        report['sources'][str(folder)] = {name: hashlib.sha256((folder/name).read_bytes()).hexdigest()
                                         for name in ('probe.json','frame-0060-geometry.json')}
    a, b = source[0][1], source[1][1]
    assert a['bones'] == b['bones'], 'Bone changes are outside this geometry correction'
    report['bonesIdentical'] = True
    report['actualSeam'] = b['upperArmCorrective']
    assert report['actualSeam']['seamPairs'] == 56 and report['actualSeam']['maxSeamGapMm'] <= .01
    report['meshChanges'] = {}
    for name, mesh in a['meshes'].items():
        other = b['meshes'][name]
        assert mesh['facesOriginalIndices'] == other['facesOriginalIndices']
        assert len(mesh['vertices']) == len(other['vertices'])
        deltas = []
        for v, w in zip(mesh['vertices'], other['vertices']):
            assert v['id'] == w['id'] and v['weights'] == w['weights']
            deltas.append(float(np.linalg.norm(np.array(v['world'])-w['world'])*1000))
        report['meshChanges'][name] = {'maxDisplacementMm': max(deltas, default=0), 'changedVertices': sum(d>1e-5 for d in deltas)}
        if name not in (sections.SHARED, sections.LIMBS):
            assert max(deltas, default=0) < 1e-5, 'Non-target mesh changed: '+name
    torso_count = sections.read(HERE.parents[1]/'drill-anim/models/training-human-v2plus-torso-base.json')['n']
    for side in ('left','right'):
        records = {}
        for label, (rest, g) in zip(('r2','r3'), source):
            s, axis, u, v, length = sections.frame(g, rest, side)
            xyz, weights = sections.triangles(g, torso_count, side)
            records[label] = [dict(distanceMm=float(d), **sections.section(xyz,weights,s,axis,u,v,d/1000))
                              for d in np.arange(75,166,5)]
        report['sides'][side] = records
    target = after/'continuity-audit.json'
    with target.open('x', encoding='utf-8') as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    print(json.dumps({'report': str(target), 'bonesIdentical': True, 'seam': report['actualSeam']}))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--before', required=True, type=Path)
    p.add_argument('--after', required=True, type=Path)
    args = p.parse_args()
    run(args.before, args.after)
