"""CPU prediction from actual captures, never a substitute for a new GPU capture.

Only the new bridge interior receives the kernel delta. Frozen endpoints, body,
hand and dumbbell captures remain unchanged. The independent checker is reused
without changing its geometry thresholds. No input file is modified.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as Rot

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('wrist_qa', HERE / 'check.py')
Q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(Q)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x*x*(3-2*x)


def kernel(points, q, max_shift):
    """The original circular sweep plus a smooth, inner-side local relief."""
    y = np.array([0., 1., 0.])
    end = q.apply(y)
    angle = np.arccos(np.clip(end[1], -1, 1))
    axis = np.cross(y, end)
    axis = axis / np.linalg.norm(axis) if np.linalg.norm(axis) > 1e-10 else np.array([1., 0., 0.])
    swing = Rot.from_rotvec(axis*angle)
    tq = (swing.inv()*q).as_quat()
    twist = (2*np.arctan2(tq[1], tq[3])+np.pi) % (2*np.pi)-np.pi
    out = points.copy()
    mask = (points[:, 1] > -.02) & (points[:, 1] < .02)
    t = (points[mask, 1]+.02)/.04
    section = points[mask].copy()
    section[:, 1] = 0
    section = Rot.from_rotvec(np.outer(smooth(t)*twist, y)).apply(section)
    if angle > 1e-8:
        direction = end-end[1]*y
        direction /= np.linalg.norm(direction)
        radius = .02/np.tan(angle/2)
        # Relief is zero through Y=0 and at Y=+20mm, with zero derivatives.
        # Only cross-section points approaching the inner curvature radius move.
        longitudinal = np.clip(2*t-1, 0, 1)
        window = np.sin(np.pi*longitudinal)**2
        inner = section@direction
        influence = smooth((inner/radius-.45)/.55)
        amount = max_shift*window*influence*smooth(angle/(np.pi/3))
        section -= np.outer(amount, direction)
        center = np.outer(-.02+radius*np.sin(angle*t), y)+np.outer(radius*(1-np.cos(angle*t)), direction)
    else:
        center = np.outer(points[mask, 1], y)
    out[mask] = Rot.from_rotvec(np.outer(angle*t, axis)).apply(section)+center
    hand = points[:, 1] >= .02
    out[hand] = q.apply(points[hand])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('capture', type=Path)
    ap.add_argument('--recipe', required=True, type=Path)
    ap.add_argument('--output', required=True, type=Path)
    ap.add_argument('--max-shift-mm', type=float, default=4)
    args = ap.parse_args()
    recipe = Q.load(args.recipe)
    report = Q.load(args.capture/'report.json')
    refs = {s: Q.load(args.capture/p) for s, p in report['references'].items()}
    state = {}
    for side, ref in refs.items():
        weld, _ = Q.weld(ref)
        _, edges, faces = Q.topology(ref, weld)
        state[side] = weld, edges, faces
    rows = []
    for meta in report['rows']:
        if abs(meta['command']['flexDeg']) > 60:
            continue
        sample = Q.load(args.capture/meta['file'])
        for side, ref in refs.items():
            s = sample['sides'][side]
            nf = recipe['neutralFrames'][side]
            hand, forearm = Q.matrix(s['handMatrixWorld']), Q.matrix(s['forearmMatrixWorld'])
            nc = np.asarray(nf['canonicalToWorldRowMajor']).reshape(4, 4)
            basis = Rot.from_matrix(forearm[:3, :3])*Rot.from_quat(nf['forearmWorldQuaternion']).inv()*Rot.from_matrix(nc[:3, :3])
            mapping = np.asarray(nf['webCanonicalToHandLocalRowMajor']).reshape(4, 4)
            q = basis.inv()*Rot.from_matrix((hand@mapping)[:3, :3])
            br = recipe['bridge'][side]
            canonical = np.array([v['canonicalRest'] for v in br['vertices']])
            delta = basis.apply(kernel(canonical, q, args.max_shift_mm/1000)-kernel(canonical, q, 0))
            positions = Q.points(s['positions']).copy()
            band_ids = np.array(ref['regions']['bandVertexIds'])
            positions[band_ids] += delta
            # Endpoint override in runtime must remain exact, including captures.
            endpoints = np.array([v['t'] == 0 or v['t'] == 1 for v in br['vertices']])
            assert np.max(np.abs(delta[endpoints])) == 0
            weld, edges, faces = state[side]
            ratio = Q.ratios(positions, Q.points(ref['positions']), faces, edges)
            crossing = Q.crossing_pairs(positions, faces, weld)
            row = {'name': meta['name'], 'side': side, 'areaMin': ratio['minimumAreaRatio'],
                   'edgeMin': ratio['minimumEdgeRatio'], 'collapsedFaces': ratio['collapsedFaceIds'],
                   'crossings': crossing['properCount']+crossing['coplanarCount'], 'pairs': crossing['pairs'],
                   'maximumBridgeDisplacementMm': float(np.linalg.norm(delta, axis=1).max()*1000)}
            rows.append(row)
    out = {'mode': 'CPU prediction using exact actual-capture matrices and bridge-only delta',
           'renderTime': False, 'prediction': True, 'normalContinuity': 'requires new capture',
           'restoration': 'requires runtime CPU lifecycle test and new capture',
           'sourceCapture': str(args.capture), 'sourceRecipeSha256': hashlib.sha256(args.recipe.read_bytes()).hexdigest(),
           'sourceRuntimeSha256': hashlib.sha256((args.capture/'source-runtime.js').read_bytes()).hexdigest(),
           'candidate': {'maxShiftMm': args.max_shift_mm, 'window': 'sin(pi*clamp(2*t-1,0,1))^2',
                         'innerWeight': 'smooth((inner/radius-.45)/.55)', 'angleWeight': 'smooth(swing/(pi/3))'},
           'rows': rows, 'allPrimaryGeometryPass': all(r['areaMin'] >= .1 and r['edgeMin'] >= .1 and r['crossings'] == 0 for r in rows)}
    with args.output.open('x', encoding='utf-8') as f:
        json.dump(out, f, indent=2)
    print(json.dumps({'pass': out['allPrimaryGeometryPass'], 'samples': len(rows),
                      'minArea': min(r['areaMin'] for r in rows), 'minEdge': min(r['edgeMin'] for r in rows),
                      'maxShiftMm': max(r['maximumBridgeDisplacementMm'] for r in rows),
                      'failures': [r for r in rows if r['areaMin'] < .1 or r['edgeMin'] < .1 or r['crossings']]}))


if __name__ == '__main__':
    main()
