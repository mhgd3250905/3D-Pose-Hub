"""Build a separately versioned native-shape hand; never overwrite frozen assets.

Inputs are the licensed source after limb re-pose, a live rest dump, and the
frozen wrist boundaries. Finger geometry is uniformly scaled, not retargeted
onto the old v2 finger locations. Only the wrist joining band is deformed.
"""
import argparse
import base64
import copy
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import dijkstra
from scipy.sparse.linalg import spsolve
from scipy.spatial.transform import Rotation

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'tools/human-v2plus/torso-base'))
from meshops import adjacency, edges_of, compact, components, boundary_loops_F, zipper, bilaplace_fair, vnormals

FN = ['thumb', 'index', 'middle', 'ring', 'pinky']
FB = [f + str(j) for f in FN for j in (1, 2, 3)]

def smooth(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)

def unpack(s, dtype, width):
    return np.frombuffer(base64.b64decode(s), dtype=dtype).reshape(-1, width)

def decode(data):
    p = unpack(data['pos']['u16'], '<u2', 3) * data['pos']['scale'] + data['pos']['lo']
    f = unpack(data['index']['u16'], '<u2', 3).astype(int)
    return p, f

def b64(a):
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()

def distances(vertices, faces):
    edges = edges_of(faces)
    w = np.linalg.norm(vertices[edges[:, 0]] - vertices[edges[:, 1]], axis=1)
    n = len(vertices)
    return sp.coo_matrix((np.r_[w, w], (np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]])), shape=(n, n)).tocsr()

def graph_rings(n, faces, seeds, depth):
    A = adjacency(n, edges_of(faces)).tocsr()
    rings = np.full(n, 999)
    rings[seeds] = 0
    frontier = rings == 0
    for k in range(1, depth + 1):
        new = ((A @ frontier.astype(float)) > 0) & (rings == 999)
        rings[new] = k
        frontier = new
    return A, rings

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', type=Path, required=True)
    ap.add_argument('--rest', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--debug-fit', type=Path, help='Optional local intermediate NPZ, outside the model directory')
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    outputs = [args.out / 'hands-base.json', args.out / 'hands-rig.json', args.out / 'build-report.json']
    if any(f.exists() for f in outputs) or (args.debug_fit and args.debug_fit.exists()):
        raise SystemExit('Use a fresh output directory; existing candidate assets are immutable.')
    rest = json.loads(args.rest.read_text())
    source = np.load(args.source)
    old = json.loads((REPO / 'drill-anim/models/training-human-v2plus-hands-base.json').read_text())
    limb = json.loads((REPO / 'drill-anim/models/training-human-v2plus-limbs-base.json').read_text())
    rig = json.loads((REPO / 'drill-anim/models/training-human-v2plus-hands.json').read_text())
    # Old fit statistics refer to a different mesh, joint layout and pose set.
    rig.pop('relaxedFitMm', None)
    rig.pop('gripFitMm', None)
    rig['doc'] = 'Native-shape hand rig, independently versioned. Finger joints follow the source hand. Coordinates are LEFT hand-bone local metres; right mirrors local x. Coach_Body weights remain solely for the hidden legacy hand. No inherited grip-fit claim.'
    hb = rest['bones']['leftHand']
    RH = Rotation.from_quat(hb['q']).as_matrix()
    hp = np.array(hb['p'])
    V, F, part = source['V'], source['F'], source['part']
    X = (V - hp) @ RH
    selected = (part == 1) & (V[:, 0] > 0) & (X[:, 0] > -.065) & (np.linalg.norm(X - [.07, 0, .02], axis=1) < .17)
    X, F, _ = compact(X, F, selected[F].all(1))
    labels = components(len(X), F)
    X, F, _ = compact(X, F, labels[F[:, 0]] == np.argmax(np.bincount(labels)))
    G = distances(X, F)
    seeds = np.where(X[:, 0] < X[:, 0].min() + .004)[0]
    dg = dijkstra(G, indices=seeds, min_only=True)
    taken = np.zeros(len(X), bool)
    tips = []
    for i in np.argsort(-dg):
        if taken[i]:
            continue
        radius = dijkstra(G, indices=i, limit=.05)
        near = np.isfinite(radius)
        taken[near] = True
        if dg[near & (radius < .015)].max() > dg[i] + 1e-9:
            continue
        tips.append(i)
        if len(tips) == 5:
            break
    assert len(tips) == 5
    thumb = int(np.argmin(dg[tips]))
    others = sorted([i for i in range(5) if i != thumb], key=lambda i: -X[tips[i], 2])
    tip = dict(zip(FN, [tips[thumb]] + [tips[i] for i in others]))
    oldJ = {f: np.array(rig['fingers'][f]['joints']) for f in FN}
    scale = np.linalg.norm(X[tip['middle']]) / np.linalg.norm(oldJ['middle'][3])
    J = {}
    for finger in FN:
        lengths = np.linalg.norm(np.diff(oldJ[finger], axis=0), axis=1) * scale
        total = lengths.sum()
        dt = dijkstra(G, indices=tip[finger])
        center, samples = [X[tip[finger]]], [0.]
        for d in np.arange(.004, total * (.62 if finger == 'thumb' else .55), .003):
            mask = abs(dt - d) < .0015
            if mask.sum() > 8:
                center.append(X[mask].mean(0))
                samples.append(d)
        center, samples = np.array(center), np.array(samples)
        k = max(3, len(center) // 3)
        direction = center[-1] - center[-k]
        direction /= np.linalg.norm(direction)
        def at(distance):
            if distance <= samples[-1]:
                return np.array([np.interp(distance, samples, center[:, c]) for c in range(3)])
            return center[-1] + direction * (distance - samples[-1])
        # Keep the source extrapolated thumb base; never substitute the old CMC.
        J[finger] = np.array([at(total), at(total - lengths[0]), at(lengths[2]), at(0.)])
    n = len(X)
    W = np.zeros((n, 16)); W[:, 0] = 1
    proximity = np.full((n, 5), np.inf)
    along = np.zeros((n, 5))
    for fi, finger in enumerate(FN):
        chain = J[finger]
        for a, b in zip(chain[:-1], chain[1:]):
            u = b - a; length = np.linalg.norm(u); u /= length
            t = np.clip((X - a) @ u, 0, length)
            proximity[:, fi] = np.minimum(proximity[:, fi], np.linalg.norm(X - a - t[:, None] * u, axis=1))
        along[:, fi] = (X - chain[0]) @ ((chain[1] - chain[0]) / np.linalg.norm(chain[1] - chain[0]))
    nearest = np.argmin(proximity, axis=1)
    for fi, finger in enumerate(FN):
        mask = nearest == fi
        chain = J[finger]
        share = smooth(-.01, .008, along[mask, fi]) * (1 - smooth(.016, .024, proximity[mask, fi]))
        directions = np.diff(chain, axis=0)
        directions /= np.linalg.norm(directions, axis=1)[:, None]
        def bend(j):
            u = directions[j - 1] + directions[j]
            u /= np.linalg.norm(u)
            return smooth(-.005, .005, (X[mask] - chain[j]) @ u)
        a, b = bend(1), bend(2)
        W[mask, 0] = 1 - share
        W[mask, 1 + fi * 3:4 + fi * 3] = np.c_[share * (1 - a), share * a * (1 - b), share * a * b]
    A = adjacency(n, edges_of(F)).tocsr()
    degree = np.asarray(A.sum(1)).ravel()
    for _ in range(12):
        W = .5 * W + .5 * (A @ W) / degree[:, None]
    # Native hand shape: one scale; no per-finger retarget or thenar displacement.
    X *= (1 + (1 / scale - 1) * smooth(-.031, 0., X[:, 0]))[:, None]
    J = {f: joints / scale for f, joints in J.items()}
    for finger in FN:
        # +y is dorsal in left hand-local coordinates: flex toward the palm (-y).
        axis = np.cross([0., 1., 0.], J[finger][1] - J[finger][0])
        axis /= np.linalg.norm(axis)
        rig['fingers'][finger]['joints'] = J[finger].tolist()
        rig['fingers'][finger]['flexAxis'] = axis.tolist()
    # The independent profile uses explicit identity open and conservative curl.
    for pose, degrees in [('open', [0, 0, 0]), ('relaxed', [7, 10, 5]), ('palm-floor', [0, 0, 0]), ('grip-bar', [35, 50, 35]), ('band-grip', [25, 35, 20])]:
        rig['poses'][pose] = {}
        for finger in FN:
            axis = np.array(rig['fingers'][finger]['flexAxis'])
            for joint, deg in enumerate(degrees, 1):
                rig['poses'][pose][finger + str(joint)] = Rotation.from_rotvec(axis * np.radians(deg * (.5 if finger == 'thumb' else 1))).as_quat().tolist()
    rig['sourceNative'] = {'scale': float(scale), 'openIsIdentity': True, 'noOldJointRetarget': True}
    oldP, oldF = decode(old)
    oldJoints = unpack(old['joints']['u8'], 'u1', 4)
    oldWeights = unpack(old['weights']['u8'], 'u1', 4) / 255
    LP, LF = decode(limb)
    body = np.array(rest['meshes']['Coach_Body']['P']).reshape(-1, 3)
    for i, vid in enumerate(limb['seam']['vid']):
        if limb['seam']['mesh'][i] == 'Coach_Body':
            LP[limb['seam']['first'] + i] = body[vid]
    limbsAdj = adjacency(len(LP), edges_of(LF)).tocsr()
    boneNames = old['bones']
    bidx = {name: i for i, name in enumerate(boneNames)}
    parts, diagnostics = [], {}
    for side, sign, letter in [('left', 1, 'L'), ('right', -1, 'R')]:
        transform = Rotation.from_quat(rest['bones'][side + 'Hand']['q']).as_matrix()
        palm = np.array(rest['bones'][side + 'Hand']['p'])
        v = (X * [sign, 1, 1]) @ transform.T + palm
        f = F.copy() if sign == 1 else F[:, [0, 2, 1]]
        seamIds = np.array([i for i, ring in enumerate(old['seam']['ring']) if ring == 'wrist_' + side])
        vids = np.array(old['seam']['vid'])[seamIds]
        boundary = body[vids]
        elbow, wrist = [np.array(rest['landmarks'][side + name]) for name in ['Elbow', 'Wrist']]
        axis = wrist - elbow; axis /= np.linalg.norm(axis)
        ref = np.array([sign, 0., 0.]); ref -= axis * (ref @ axis); ref /= np.linalg.norm(ref)
        cross = np.cross(axis, ref)
        def coord(points):
            d = points - elbow
            return d @ axis, np.arctan2(d @ cross, d @ ref)
        bt, bp = coord(boundary)
        vt, vp = coord(v)
        order = np.argsort(bp)
        cut = np.interp(vp, bp[order], bt[order], period=2 * np.pi)
        v, f, keep = compact(v, f, (vt > cut + .004)[f].all(1))
        weights = W[keep]
        loops = boundary_loops_F(f)
        assert len(loops) == 1, [len(loop) for loop in loops]
        loop = np.array(loops[0])
        center = boundary.mean(0)
        def winding(points):
            d = points - center
            return np.sign(np.cross(d, np.roll(d, -1, axis=0)).sum(0) @ axis)
        if winding(v[loop]) != winding(boundary):
            boundary, seamIds, vids = boundary[::-1], seamIds[::-1], vids[::-1]
        # Monotone perimeter mapping, avoiding angular folds in a jagged source cut.
        start = int(np.argmin(np.linalg.norm(boundary - v[loop[0]], axis=1)))
        boundary, seamIds, vids = np.roll(boundary, -start, axis=0), np.roll(seamIds, -start), np.roll(vids, -start)
        def arc(points):
            d = np.linalg.norm(np.roll(points, -1, axis=0) - points, axis=1)
            return np.r_[0., np.cumsum(d)] / d.sum()
        t = arc(v[loop])[:-1]
        bt = arc(boundary)
        closed = np.vstack([boundary, boundary[0]])
        target = np.stack([np.interp(t, bt, closed[:, c]) for c in range(3)], axis=1) + .004 * axis
        Adj, rings = graph_rings(len(v), f, loop, 12)
        degree = np.asarray(Adj.sum(1)).ravel()
        L = sp.diags(1 / degree) @ Adj - sp.eye(len(v))
        Q = (L.T @ L).tocsr()
        fixed = (rings == 0) | (rings >= 12)
        free = np.where(~fixed)[0]; locked = np.where(fixed)[0]
        delta = np.zeros_like(v); delta[loop] = target - v[loop]
        delta[free] = spsolve(Q[free][:, free].tocsc(), -Q[free][:, locked] @ delta[locked])
        v += delta
        count = len(v)
        stitch = zipper(v[loop], boundary)
        stitched = np.where(stitch < len(loop), loop[np.minimum(stitch, len(loop) - 1)], count + stitch - len(loop))
        vf = np.vstack([v, boundary]); ff = np.vstack([f, stitched[:, [0, 2, 1]]])
        _, joinRings = graph_rings(len(vf), ff, np.arange(count, len(vf)), 6)
        ghost, links, lookup = [], [], {}
        limbLookup = {(m, vid): limb['seam']['first'] + i for i, (m, vid) in enumerate(zip(limb['seam']['mesh'], limb['seam']['vid']))}
        for i, vid in enumerate(vids):
            li = limbLookup[('Coach_Body', int(vid))]
            for neighbor in limbsAdj.indices[limbsAdj.indptr[li]:limbsAdj.indptr[li + 1]]:
                if neighbor >= limb['seam']['first']:
                    continue
                if neighbor not in lookup:
                    lookup[neighbor] = len(ghost); ghost.append(LP[neighbor])
                links.append((count + i, lookup[neighbor]))
        vf = bilaplace_fair(vf, ff, (joinRings >= 1) & (joinRings <= 5), np.array(ghost), np.array(links))
        dense = np.zeros((len(vf), len(boneNames)))
        dense[:count, bidx[side + 'Hand']] = weights[:, 0]
        for i, bone in enumerate(FB):
            dense[:count, bidx['v2p_' + letter + '_' + bone]] = weights[:, i + 1]
        for i, si in enumerate(seamIds):
            row = old['seam']['first'] + si
            for bone, weight in zip(oldJoints[row], oldWeights[row]):
                dense[count + i, bone] += weight
        # Blend only the wrist transition into its exact frozen seam weights.
        for _ in range(12):
            DA = adjacency(len(vf), edges_of(ff)).tocsr()
            avg = DA @ dense / np.asarray(DA.sum(1)).ravel()[:, None]
            band = (joinRings >= 1) & (joinRings <= 5)
            dense[band] = .5 * dense[band] + .5 * avg[band]
        parts.append((vf, ff, dense, count, vids, side))
        diagnostics[side] = {'vertices': len(vf), 'faces': len(ff), 'wristSnapMaxMm': float(np.linalg.norm(delta, axis=1).max() * 1000)}
    totalInterior = sum(part[3] for part in parts)
    vv = np.vstack([p[0][:p[3]] for p in parts] + [p[0][p[3]:] for p in parts])
    ww = np.vstack([p[2][:p[3]] for p in parts] + [p[2][p[3]:] for p in parts])
    ff, vids, rings = [], [], []
    base, seamBase = 0, totalInterior
    for v, f, w, count, ids, side in parts:
        mapping = np.r_[base + np.arange(count), seamBase + np.arange(len(ids))]
        ff.append(mapping[f]); base += count; seamBase += len(ids)
        vids.extend(map(int, ids)); rings.extend(['wrist_' + side] * len(ids))
    ff = np.vstack(ff)
    normals = vnormals(vv, ff)
    # A shared seam normal computed from both pieces; only these limb vertices change.
    def area_normals(v, f):
        normal = np.zeros_like(v)
        faceNormal = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
        for k in range(3): np.add.at(normal, f[:, k], faceNormal)
        return normal
    hn, ln = area_normals(vv, ff), area_normals(LP, LF)
    limbIds, limbNormals = [], []
    for k, vid in enumerate(vids):
        li = limbLookup[('Coach_Body', vid)]
        normal = hn[totalInterior + k] + ln[li]; normal /= np.linalg.norm(normal)
        normals[totalInterior + k] = normal
        limbIds.append(li); limbNormals.append(normal)
    index = np.argsort(-ww, axis=1)[:, :4]
    weight = np.take_along_axis(ww, index, axis=1)
    weight /= weight.sum(1)[:, None]
    quant = np.round(weight * 255).astype(int); quant[:, 0] += 255 - quant.sum(1)
    lo = vv.min(0) - .001; step = (vv.max(0) + .001 - lo) / 65535
    pq = np.round((vv - lo) / step).astype('<u2')
    assert len(vv) < 65536
    model = {'version': 1, 'n': len(vv), 'bones': boneNames,
             'pos': {'lo': lo.tolist(), 'scale': step.tolist(), 'u16': b64(pq)},
             'nrm': {'i8': b64(np.round(normals * 127).astype('i1'))},
             'index': {'u16': b64(ff.astype('<u2'))}, 'joints': {'u8': b64(index.astype('u1'))},
             'weights': {'u8': b64(quant.astype('u1'))},
             'seam': {'first': totalInterior, 'mesh': ['Coach_Body'] * len(vids), 'vid': vids, 'ring': rings, 'ownNormals': True},
             'keepFaces': copy.deepcopy(old['keepFaces']), 'hideFaces': copy.deepcopy(old['hideFaces']),
             'hideMeshes': copy.deepcopy(old['hideMeshes']), 'requires': 'limbs', 'skin': 'Coach_Body',
             'paint': copy.deepcopy(old['paint']),
             'source': 'Blender Human Base Meshes v1.4.1 CC0: native hand shape, source-fitted finger rig; independent candidate.',
             'limbsNrm': {'idx': limbIds, 'i8': b64(np.round(np.array(limbNormals) * 127).astype('i1'))}, 'report': diagnostics}
    report = {'nativeScale': float(scale), 'vertices': len(vv), 'faces': len(ff), 'parts': diagnostics,
              'inputs': {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in [args.source, args.rest]},
              'status': 'candidate; pending rest and posed collision checks and visual review'}
    for file, data in zip(outputs, [model, rig, report]):
        file.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    if args.debug_fit:
        if args.debug_fit.exists():
            raise SystemExit('Refusing to replace existing debug fit.')
        np.savez(args.debug_fit, X=X, F=F, W=W, **{'J_' + f: J[f] for f in FN})
    print(json.dumps(report, ensure_ascii=False))

if __name__ == '__main__':
    main()
