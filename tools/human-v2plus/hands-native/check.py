"""Read-only baked hand triangle QA, optionally with runtime-equivalent finger LBS.

python check.py --asset hands-base.json --rig hands-rig.json --rest REST.json --out REPORT.json
REST.json must contain bones.leftHand/rightHand.{p,q} in rest world space.
The identity pose is exact decoded geometry; relaxed-0.2 applies the runtime's
identity-to-pose quaternion slerp and mirrored right-hand joint chain.
Noncoplanar strict-interior hits are witnesses, not a complete collision oracle.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation


def decode(data):
    unpack = lambda value, dtype: np.frombuffer(base64.b64decode(value), dtype=dtype)
    p = unpack(data['pos']['u16'], '<u2').reshape(-1, 3) * data['pos']['scale'] + data['pos']['lo']
    f = unpack(data['index']['u16'], '<u2').reshape(-1, 3)
    w = unpack(data['weights']['u8'], 'u1').reshape(-1, 4) / 255
    bi = unpack(data['joints']['u8'], 'u1').reshape(-1, 4)
    assert np.isfinite(p).all() and f.max() < len(p)
    assert np.allclose(w.sum(1), 1), 'Non-normalized skin weights'
    return p, f, w, bi


def hits(a, b):
    result = np.zeros(len(a), bool)
    e1, e2 = b[:, 1] - b[:, 0], b[:, 2] - b[:, 0]
    for k in range(3):
        origin, direction = a[:, k], a[:, (k + 1) % 3] - a[:, k]
        h = np.cross(direction, e2)
        det = (e1 * h).sum(1)
        ok = abs(det) > 1e-14
        inv = np.divide(1., det, out=np.zeros_like(det), where=ok)
        s = origin - b[:, 0]
        u = inv * (s * h).sum(1)
        q = np.cross(s, e1)
        v, t = inv * (direction * q).sum(1), inv * (e2 * q).sum(1)
        result |= ok & (u > 1e-7) & (v > 1e-7) & (u + v < 1 - 1e-7) & (t > 1e-7) & (t < 1 - 1e-7)
    return result


def audit(p, faces, side_ids):
    results = {}
    for side, ids in side_ids.items():
        f, tri = faces[ids], p[faces[ids]]
        center = tri.mean(1)
        radius = np.linalg.norm(tri - center[:, None], axis=2).max(1)
        tree = cKDTree(center)
        pairs = []
        for i, near in enumerate(tree.query_ball_point(center, radius + radius.max())):
            other = np.array([j for j in near if j > i], dtype=int)
            if not len(other):
                continue
            other = other[(tri[other].min(1) <= tri[i].max(0)).all(1) & (tri[other].max(1) >= tri[i].min(0)).all(1)]
            other = other[~(f[other, :, None] == f[i][None, None, :]).any((1, 2))]
            pairs.extend((i, int(j)) for j in other)
        pairs = np.asarray(pairs, dtype=int).reshape(-1, 2)
        actual = np.empty((0, 2), dtype=int)
        if len(pairs):
            a, b = tri[pairs[:, 0]], tri[pairs[:, 1]]
            actual = ids[pairs[hits(a, b) | hits(b, a)]]
        results[side] = {'pairs': len(actual), 'witnessFaces': actual.tolist()}
    return results


def skin(p, weights, joints, names, rig, rest, amount):
    transforms = {name: np.eye(4) for name in names}
    for side in ['left', 'right']:
        hand = rest['bones'][side + 'Hand']
        h = np.eye(4)
        h[:3, :3] = Rotation.from_quat(hand['q']).as_matrix()
        h[:3, 3] = hand['p']
        for finger, definition in rig['fingers'].items():
            parent = h.copy()
            last = np.zeros(3)
            for j in range(3):
                at = np.array(definition['joints'][j], dtype=float)
                if side == 'right':
                    at[0] *= -1
                q = np.array(rig['poses']['relaxed'].get(finger + str(j + 1), [0, 0, 0, 1]), dtype=float)
                if side == 'right':
                    q[[1, 2]] *= -1
                local = np.eye(4)
                local[:3, 3] = at - last
                local[:3, :3] = Rotation.from_rotvec(Rotation.from_quat(q).as_rotvec() * amount).as_matrix()
                parent = parent @ local
                bind = h.copy()
                bind[:3, 3] = (h @ np.r_[at, 1])[:3]
                name = f'v2p_{side[0].upper()}_{finger}{j + 1}'
                assert name in transforms, name
                transforms[name] = parent @ np.linalg.inv(bind)
                last = at
    matrices = np.array([transforms[n] for n in names])
    ph = np.column_stack([p, np.ones(len(p))])
    result = np.zeros_like(ph)
    for k in range(4):
        result += np.einsum('nij,nj->ni', matrices[joints[:, k]], ph) * weights[:, k, None]
    return result[:, :3]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset', type=Path, required=True)
    parser.add_argument('--rig', type=Path)
    parser.add_argument('--rest', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--require-zero', action='store_true')
    args = parser.parse_args()
    if bool(args.rig) != bool(args.rest):
        parser.error('--rig and --rest must be provided together')
    raw = args.asset.read_bytes()
    data = json.loads(raw)
    p, faces, weights, joints = decode(data)
    side_ids = {side: np.where((p[faces, 0] * sign > 0).all(1))[0] for side, sign in [('left', 1), ('right', -1)]}
    report = {'source': str(args.asset), 'sha256': hashlib.sha256(raw).hexdigest(),
              'limitations': 'Strict interior noncoplanar intersections; shared-vertex pairs excluded. Counts do not prove visual acceptance.',
              'poses': {'identity': audit(p, faces, side_ids)}}
    if args.rig:
        rig, rest = json.loads(args.rig.read_bytes()), json.loads(args.rest.read_bytes())
        identity = skin(p, weights, joints, data['bones'], rig, rest, 0)
        report['identitySkinMaxErrorM'] = float(np.abs(identity - p).max())
        assert np.allclose(identity, p, atol=1e-10), 'Bind-space transform mismatch'
        report['rigSha256'] = hashlib.sha256(args.rig.read_bytes()).hexdigest()
        report['restSha256'] = hashlib.sha256(args.rest.read_bytes()).hexdigest()
        posed = skin(p, weights, joints, data['bones'], rig, rest, .2)
        report['poses']['relaxed-0.2'] = audit(posed, faces, side_ids)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    summary = {pose: {side: result['pairs'] for side, result in sides.items()} for pose, sides in report['poses'].items()}
    print(json.dumps(summary))
    if args.require_zero and any(count for sides in summary.values() for count in sides.values()):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
