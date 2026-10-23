"""Create an independent wrist refinement candidate from hands-native-r1.

The input asset and rig are never changed. Geometry/weights beyond --protect-x,
topology, and all wrist seam position/weight bytes remain exactly unchanged.
"""
import argparse
import base64
import copy
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
from scipy.spatial.transform import Rotation

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools/human-v2plus/torso-base'))
from meshops import vnormals

def unpack(s, dtype, width):
    return np.frombuffer(base64.b64decode(s), dtype=dtype).reshape(-1, width).copy()

def b64(a):
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()

def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * x * (10 + x * (-15 + 6 * x))

def raw_normals(p, f):
    n = np.zeros_like(p)
    nf = np.cross(p[f[:, 1]] - p[f[:, 0]], p[f[:, 2]] - p[f[:, 0]])
    for i in range(3):
        np.add.at(n, f[:, i], nf)
    return n

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', type=Path, required=True)
    ap.add_argument('--rig', type=Path, required=True)
    ap.add_argument('--rest', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--shape-reduction', type=float, default=.10)
    ap.add_argument('--shape-peak', type=float, default=-.005)
    ap.add_argument('--weight-end', type=float, default=.025)
    ap.add_argument('--weight-curve', choices=['quintic', 'cubic', 'linear'], default='quintic')
    ap.add_argument('--protect-x', type=float, default=.035)
    args = ap.parse_args()
    if not 0 <= args.shape_reduction <= .25 or not args.shape_peak < args.weight_end <= args.protect_x:
        raise SystemExit('Invalid bounded wrist parameters')
    paths = [args.out / name for name in ['hands-base.json', 'hands-rig.json', 'refine-report.json']]
    if any(path.exists() for path in paths):
        raise SystemExit('Choose a fresh candidate directory; existing candidates are retained.')
    raw = args.input.read_bytes()
    original = json.loads(raw)
    model = copy.deepcopy(original)
    rest = json.loads(args.rest.read_text())
    pq0 = unpack(model['pos']['u16'], '<u2', 3)
    lo, scale = np.array(model['pos']['lo']), np.array(model['pos']['scale'])
    p0 = pq0 * scale + lo
    p = p0.copy()
    f = unpack(model['index']['u16'], '<u2', 3).astype(int)
    j0 = unpack(model['joints']['u8'], 'u1', 4)
    w0 = unpack(model['weights']['u8'], 'u1', 4)
    normals0 = unpack(model['nrm']['i8'], 'i1', 3)
    jnew, wnew = j0.copy(), w0.copy()
    bones = model['bones']; bmap = {name: i for i, name in enumerate(bones)}
    dense0 = np.zeros((len(p), len(bones)))
    for k in range(4):
        np.add.at(dense0, (np.arange(len(p)), j0[:, k]), w0[:, k] / 255.)
    dense = dense0.copy()
    seamStart = model['seam']['first']
    protected = np.zeros(len(p), bool)
    modified = np.zeros(len(p), bool)
    report = {'parameters': vars(args).copy(), 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sides': {},
              'handFrames': {s: copy.deepcopy(rest['bones'][s + 'Hand']) for s in ['left', 'right']},
              'protectionRule': 'Mirror right hand-local x; preserve every vertex with local x >= protect_x, and preserve all seam position/weight bytes.'}
    for k in ['input', 'rig', 'rest', 'out']:
        report['parameters'][k] = str(report['parameters'][k])
    for side, sign in [('left', 1), ('right', -1)]:
        hand = rest['bones'][side + 'Hand']
        R = Rotation.from_quat(hand['q']).as_matrix()
        origin = np.array(hand['p'])
        # Mirror into one left-hand local frame; +z is the thumb side.
        local = ((p0 - origin) @ R) * [sign, 1, 1]
        seam = np.array([seamStart + i for i, name in enumerate(model['seam']['ring']) if name == 'wrist_' + side])
        s = local[seam]
        center = s[:, 1:].mean(0)
        angles = np.arctan2(s[:, 2] - center[1], s[:, 1] - center[0])
        order = np.argsort(angles)
        theta = np.arctan2(local[:, 2] - center[1], local[:, 1] - center[0])
        seamX = np.interp(theta, angles[order], s[order, 0], period=2 * np.pi)
        own = p0[:, 0] * sign > 0
        active = own & (np.arange(len(p)) < seamStart) & (local[:, 0] < args.protect_x)
        protected |= own & (local[:, 0] >= args.protect_x)
        modified |= active
        # Width reduction rises smoothly after the exact seam and vanishes before
        # the protected palm. No global smoothing of palm/finger geometry.
        rise = smooth((local[:, 0] - seamX) / (args.shape_peak - seamX))
        fall = 1 - smooth((local[:, 0] - args.shape_peak) / (args.protect_x - args.shape_peak))
        reduction = args.shape_reduction * rise * fall
        new = local.copy()
        new[active, 1:] = center + (local[active, 1:] - center) * (1 - reduction[active, None])
        p[active] = (new[active] * [sign, 1, 1]) @ R.T + origin
        # Coordinate-based continuous forearm -> hand influence spans the wrist,
        # replacing the old five-edge-ring-only transition. Preserve finger share.
        t = (local[:, 0] - seamX) / (args.weight_end - seamX)
        ih, iff = bmap[side + 'Hand'], bmap[side + 'Forearm']
        seamPalm = dense0[seam, ih] + dense0[seam, iff]
        seamShare = dense0[seam, iff] / np.maximum(seamPalm, 1e-12)
        boundaryShare = np.interp(theta, angles[order], seamShare[order], period=2 * np.pi)
        u = np.clip(t, 0, 1)
        weightCurve = u if args.weight_curve == 'linear' else u * u * (3 - 2 * u) if args.weight_curve == 'cubic' else smooth(u)
        forearmShare = boundaryShare * (1 - weightCurve)
        palmShare = dense0[:, ih] + dense0[:, iff]
        dense[active, iff] = palmShare[active] * forearmShare[active]
        dense[active, ih] = palmShare[active] * (1 - forearmShare[active])
        report['sides'][side] = {'editedVertices': int(active.sum()), 'seamVertices': len(seam),
                                'maxShapeMoveMm': float(np.linalg.norm(p[active] - p0[active], axis=1).max() * 1000),
                                'maxForearmWeightChange': float(abs(dense[active, iff] - dense0[active, iff]).max())}
    pq = np.round((p - lo) / scale)
    assert ((pq >= 0) & (pq <= 65535)).all(), 'Refinement outside original quantization range'
    pq = pq.astype('<u2')
    pq[~modified] = pq0[~modified]
    p = pq * scale + lo
    selected = np.where(modified)[0]
    order = np.argsort(-dense[selected], axis=1)[:, :4]
    weight = np.take_along_axis(dense[selected], order, axis=1)
    weight /= weight.sum(1)[:, None]
    quant = np.round(weight * 255).astype(int)
    quant[:, 0] += 255 - quant.sum(1)
    jnew[selected] = order
    wnew[selected] = quant
    # Quantized seam position and weights remain byte-identical. Runtime replaces
    # seam positions from the same Coach_Body owners, retaining exact welding.
    assert np.array_equal(pq[seamStart:], pq0[seamStart:])
    assert np.array_equal(wnew[seamStart:], w0[seamStart:])
    assert np.array_equal(jnew[seamStart:], j0[seamStart:])
    assert np.array_equal(pq[protected], pq0[protected])
    assert np.array_equal(wnew[protected], w0[protected])
    assert np.array_equal(jnew[protected], j0[protected])
    normal = vnormals(p, f)
    nbytes = np.round(normal * 127).astype('i1')
    nbytes[protected] = normals0[protected]
    # Shared wrist normals include the frozen limb surface at the same owners.
    limb = json.loads((ROOT / 'drill-anim/models/training-human-v2plus-limbs-base.json').read_text())
    lp = unpack(limb['pos']['u16'], '<u2', 3) * limb['pos']['scale'] + limb['pos']['lo']
    lf = unpack(limb['index']['u16'], '<u2', 3).astype(int)
    body = np.array(rest['meshes']['Coach_Body']['P']).reshape(-1, 3)
    owner = {}
    for i, (mesh, vid) in enumerate(zip(limb['seam']['mesh'], limb['seam']['vid'])):
        li = limb['seam']['first'] + i
        owner[(mesh, vid)] = li
        if mesh == 'Coach_Body': lp[li] = body[vid]
    handNormal, limbNormal = raw_normals(p, f), raw_normals(lp, lf)
    limbIds, limbNormals = [], []
    for i, (mesh, vid) in enumerate(zip(model['seam']['mesh'], model['seam']['vid'])):
        li, hi = owner[(mesh, vid)], seamStart + i
        n = handNormal[hi] + limbNormal[li]
        n /= np.linalg.norm(n)
        nbytes[hi] = np.round(n * 127).astype('i1')
        limbIds.append(li); limbNormals.append(n)
    model['pos']['u16'] = b64(pq)
    model['joints']['u8'] = b64(jnew)
    model['weights']['u8'] = b64(wnew)
    model['nrm']['i8'] = b64(nbytes)
    model['limbsNrm'] = {'idx': limbIds, 'i8': b64(np.round(np.array(limbNormals) * 127).astype('i1'))}
    report['protectedVertices'] = int(protected.sum())
    report['seamPositionWeightsUnchanged'] = True
    report['protectedPositionWeightsNormalsUnchanged'] = True
    report['rigUnchanged'] = True
    report['minTriangleAreaMm2'] = float(np.linalg.norm(np.cross(p[f[:, 1]] - p[f[:, 0]], p[f[:, 2]] - p[f[:, 0]]), axis=1).min() * 500000)
    report['status'] = 'candidate; requires rest and actual-pose surface collision validation'
    model['source'] += ' Independent wrist refinement; native palm/fingers protected.'
    model['report'] = {'wristRefinement': report}
    args.out.mkdir(parents=True, exist_ok=True)
    paths[0].write_text(json.dumps(model, separators=(',', ':')), encoding='utf-8')
    paths[1].write_bytes(args.rig.read_bytes())
    paths[2].write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'parameters'}))

if __name__ == '__main__':
    main()
