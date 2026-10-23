"""Audit actual posed hand/forearm triangles, with exact live-seam topology welding.

Input: {pose_name: {hands: mesh, limbs: mesh}}, or {poses: same}.
Each mesh contains flat pos, index, weights, joints and bone-name arrays.
Positions must already be CPU-skinned in one common coordinate system. This
does not substitute finger-only animation for the actual arm/wrist transform.
Shared live seam vertices are identified by (source mesh, source vertex id),
never by proximity. Positions are not altered; seam gaps remain measurable.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
from check import hits, decode


def matrices(values):
    # Three.js Matrix4.elements uses column-major order.
    return np.asarray(values, dtype=float).reshape(-1, 4, 4).transpose(0, 2, 1)


def weighted_matrices(bones, joints, weights):
    return (bones[joints] * weights[:, :, None, None]).sum(1)


def runtime_poses(data, hand_asset, baseline=False, frame_filter=None, runtime_hand_asset=None):
    """Skin a candidate using captured real arm/wrist/finger matrices, not rest assumptions."""
    if baseline:
        # Audit the actual CPU geometry, including custom skinning such as DQS.
        # Reconstructing it with LBS would replace the implementation under test.
        result = {}
        for action, frames in data['actions'].items():
            for frame in frames:
                label = f'{action}/frame-{frame["frame"]}'
                if frame_filter and frame_filter not in label:
                    continue
                result[label] = {
                    name: {'pos': frame['pieces'][name]['world'],
                           'index': frame['pieces'][name].get('index', rest['index']),
                           'bones': rest['bones'], 'weights': rest['weights'], 'joints': rest['joints']}
                    for name, rest in data['rest'].items()
                }
        return result
    hrest = data['rest']['hands']
    p, faces, weights, joints = decode(hand_asset)
    names = hrest['bones']
    remap = np.array([names.index(name) for name in hand_asset['bones']])
    joints = remap[joints]
    # buildPiece replaces seam geometry and weights with the live Coach_Body ring.
    first = hand_asset['seam']['first']
    runtime_seam = (runtime_hand_asset or hand_asset)['seam']
    runtime_lookup = {(mesh, vid): runtime_seam['first'] + i for i, (mesh, vid) in enumerate(zip(runtime_seam['mesh'], runtime_seam['vid']))}
    live_ids = [runtime_lookup[(mesh, vid)] for mesh, vid in zip(hand_asset['seam']['mesh'], hand_asset['seam']['vid'])]
    assert max(live_ids) < len(hrest['world']) // 3
    p[first:] = np.asarray(hrest['world']).reshape(-1, 3)[live_ids]
    joints[first:] = np.asarray(hrest['joints']).reshape(-1, 4)[live_ids]
    weights[first:] = np.asarray(hrest['weights']).reshape(-1, 4)[live_ids]
    rest_m = weighted_matrices(matrices(hrest['matrices']), joints, weights)
    bind = np.linalg.solve(rest_m, np.column_stack([p, np.ones(len(p))])[:, :, None])[:, :, 0]
    poses = {}
    max_cpu_error = 0.
    for action, frames in data['actions'].items():
        for frame in frames:
            label = f'{action}/frame-{frame["frame"]}'
            if frame_filter and frame_filter not in label:
                continue
            hp = frame['pieces']['hands']
            posed_m = weighted_matrices(matrices(hp['matrices']), joints, weights)
            posed = np.einsum('nij,nj->ni', posed_m, bind)[:, :3]
            meshes = {}
            for name in ['hands', 'limbs']:
                rest = data['rest'][name]
                original_weights = np.asarray(rest['weights']).reshape(-1, 4)
                original_joints = np.asarray(rest['joints']).reshape(-1, 4)
                original_bind = np.column_stack([np.asarray(rest['bindPositions']).reshape(-1, 3), np.ones(len(original_weights))])
                original_pose_m = weighted_matrices(matrices(frame['pieces'][name]['matrices']), original_joints, original_weights)
                reconstructed = np.einsum('nij,nj->ni', original_pose_m, original_bind)[:, :3]
                cpu = np.asarray(frame['pieces'][name]['world']).reshape(-1, 3)
                error = float(np.abs(reconstructed - cpu).max())
                max_cpu_error = max(max_cpu_error, error)
                assert error <= 1e-6, f'{label} {name}: CPU LBS mismatch {error} m'
                meshes[name] = {'pos': frame['pieces'][name]['world'], 'index': frame['pieces'][name].get('index', rest['index']),
                                'weights': rest['weights'], 'joints': rest['joints'], 'bones': rest['bones']}
            if not baseline:
                meshes['hands'] = {'pos': posed.ravel().tolist(), 'index': faces.ravel().tolist(),
                                   'weights': weights.ravel().tolist(), 'joints': joints.ravel().tolist(), 'bones': names}
            poses[label] = meshes
    data['_qaCpuMaxErrorM'] = max_cpu_error
    return poses


def mesh_arrays(mesh):
    p = np.asarray(mesh['pos'], dtype=float).reshape(-1, 3)
    f = np.asarray(mesh['index'], dtype=int).reshape(-1, 3)
    w = np.asarray(mesh['weights'], dtype=float).reshape(-1, 4)
    j = np.asarray(mesh['joints'], dtype=int).reshape(-1, 4)
    assert np.isfinite(p).all() and f.max() < len(p)
    assert len(w) == len(p) and np.allclose(w.sum(1), 1, atol=1e-5)
    names = np.asarray(mesh['bones'])[j]
    sides = {}
    for side, short in [('left', 'L'), ('right', 'R')]:
        relevant = np.vectorize(lambda n: n.startswith('v2p_' + short + '_') or n in (side + 'Hand', side + 'Forearm'))(names)
        sides[side] = (w * relevant).sum(1)
    return p, f, sides


def weld_ids(hp, lp, hand_asset, limb_asset):
    ids = np.arange(len(hp) + len(lp))
    keys = {}
    gaps = []
    for offset, positions, asset in [(0, hp, hand_asset), (len(hp), lp, limb_asset)]:
        seam = asset['seam']
        for i, (mesh, vertex) in enumerate(zip(seam['mesh'], seam['vid'])):
            local = seam['first'] + i
            key = (mesh, vertex)
            if key in keys:
                canonical, first_position = keys[key]
                ids[offset + local] = canonical
                gaps.append(float(np.linalg.norm(positions[local] - first_position)))
            else:
                keys[key] = (offset + local, positions[local])
    return ids, {'weldedAliases': len(gaps), 'maxGapM': max(gaps, default=0)}


def collisions(p, faces, canonical, labels, original_face_ids):
    tri = p[faces]
    center = tri.mean(1)
    radius = np.linalg.norm(tri - center[:, None], axis=2).max(1)
    tree = cKDTree(center)
    topological = canonical[faces]
    pairs = []
    for i, near in enumerate(tree.query_ball_point(center, radius + radius.max())):
        other = np.asarray([j for j in near if j > i and not (labels[i] == labels[j] == 'limbs')], dtype=int)
        if not len(other):
            continue
        other = other[(tri[other].min(1) <= tri[i].max(0)).all(1) & (tri[other].max(1) >= tri[i].min(0)).all(1)]
        other = other[~(topological[other, :, None] == topological[i][None, None, :]).any((1, 2))]
        pairs.extend((i, int(j)) for j in other)
    pair_array = np.asarray(pairs, dtype=int).reshape(-1, 2)
    witnesses = {'handSelf': [], 'handForearm': []}
    if len(pair_array):
        a, b = tri[pair_array[:, 0]], tri[pair_array[:, 1]]
        for i, j in pair_array[hits(a, b) | hits(b, a)]:
            category = 'handSelf' if labels[i] == labels[j] == 'hands' else 'handForearm'
            witnesses[category].append([{'mesh': labels[k], 'face': int(original_face_ids[k])} for k in (i, j)])
    return {key: {'pairs': len(value), 'witnesses': value} for key, value in witnesses.items()}


def audit_pose(geometry, hand_asset, limb_asset):
    hp, hf, hs = mesh_arrays(geometry['hands'])
    lp, lf, ls = mesh_arrays(geometry['limbs'])
    canonical, seam = weld_ids(hp, lp, hand_asset, limb_asset)
    p = np.concatenate([hp, lp])
    report = {'seam': seam, 'sides': {}}
    for side in ['left', 'right']:
        hi = np.where((hs[side][hf] > .01).any(1))[0]
        li = np.where((ls[side][lf] > .01).any(1))[0]
        faces = np.concatenate([hf[hi], lf[li] + len(hp)])
        labels = ['hands'] * len(hi) + ['limbs'] * len(li)
        ids = np.concatenate([hi, li])
        result = {'handFaces': len(hi), 'forearmFaces': len(li), 'covered': bool(len(hi) and len(li))}
        if len(faces):
            result.update(collisions(p, faces, canonical, labels, ids))
        report['sides'][side] = result
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--geometry', type=Path, required=True)
    parser.add_argument('--hands', type=Path, required=True)
    parser.add_argument('--limbs', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--require-zero', action='store_true')
    parser.add_argument('--baseline', action='store_true', help='Use captured actual CPU positions instead of candidate LBS for runtime exports')
    parser.add_argument('--frame-filter', help='Only audit pose labels containing this substring, e.g. frame-120')
    parser.add_argument('--runtime-hands', type=Path, help='Original captured hand asset, required if candidate seam indexing changed')
    args = parser.parse_args()
    data = json.loads(args.geometry.read_bytes())
    hands, limbs = json.loads(args.hands.read_bytes()), json.loads(args.limbs.read_bytes())
    original_hands = json.loads(args.runtime_hands.read_bytes()) if args.runtime_hands else None
    poses = runtime_poses(data, hands, args.baseline, args.frame_filter, original_hands) if data.get('format') == 'pose-hub-wrist-runtime-matrices@1' else data.get('poses', data)
    report = {'inputs': {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in [args.geometry, args.hands, args.limbs]},
              'geometryMode': 'actual-captured-CPU' if args.baseline else 'candidate-LBS' if 'actions' in data else 'provided-geometry',
              'limitations': 'Strict interior noncoplanar intersections only. Seam topology welded by source mesh/vid; geometry never moved. Adjacent welded faces excluded. Forearm faces selected by >1% Hand/Forearm influences. No visual acceptance implied.',
              'poses': {}}
    if '_qaCpuMaxErrorM' in data:
        report['baselineCpuMaxErrorM'] = data['_qaCpuMaxErrorM']
    for name, geometry in poses.items():
        if not isinstance(geometry, dict) or not {'hands', 'limbs'} <= geometry.keys():
            continue
        report['poses'][name] = audit_pose(geometry, hands, limbs)
    assert report['poses'], 'No actual posed hands/limbs geometry found'
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    summary = {name: {side: {k: (v.get('pairs') if isinstance(v, dict) else v) for k, v in r.items()} for side, r in pose['sides'].items()} for name, pose in report['poses'].items()}
    print(json.dumps(summary))
    if args.require_zero:
        for pose in report['poses'].values():
            if pose['seam']['maxGapM'] > 1e-5:
                raise SystemExit('Live seam mismatch exceeds 0.01 mm')
            for side in pose['sides'].values():
                if not side['covered'] or side['handSelf']['pairs'] or side['handForearm']['pairs']:
                    raise SystemExit(1)


if __name__ == '__main__':
    main()
