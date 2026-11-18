#!/usr/bin/env python3
"""Body-sanity checks + orthographic multi-view skeleton sheets for a breaking move.
Input: npz written by a move script with --dump (arrays P_<joint> [N,3], W_<joint> [N,3,3], plus 'fps', 'planted' flags optional).
Checks per frame: floor penetration (capsules), limb-limb / limb-torso / limb-head interpenetration, joint ranges
(elbow, knee, hip flexion/extension/abduction, spine/neck bend, wrist dorsiflexion, hand-vs-forearm twist), planted-contact sliding.
Usage: check_move.py dump.npz [--sheet out.png --t0 0 --t1 1.6 --step 0.08] [--views front,side,top]"""
import sys, math, argparse
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
def n3(v): return v / np.linalg.norm(v)
from PIL import Image, ImageDraw
ap = argparse.ArgumentParser(); ap.add_argument('npz'); ap.add_argument('--sheet'); ap.add_argument('--t0', type=float, default=0)
ap.add_argument('--t1', type=float, default=99); ap.add_argument('--step', type=float, default=0.08); ap.add_argument('--views', default='front,side,top')
ap.add_argument('--quiet', action='store_true'); ap.add_argument('--cx', type=float, default=0.0)
A = ap.parse_args(); Z = np.load(A.npz); fps = float(Z['fps']); N = Z['P_pelvis'].shape[0]
P = lambda j: Z['P_' + j]; W = lambda j: Z['W_' + j]
X3, Y3, Z3 = np.eye(3)
def caps():
    """list of (name, a[N,3], b[N,3], r)"""
    C = []
    hd = P('head') + np.einsum('nij,j->ni', W('head'), Y3) * 0.10
    C.append(('torso', P('pelvis') + np.einsum('nij,j->ni', W('pelvis'), Y3) * 0.05, P('neck') - np.einsum('nij,j->ni', W('torso'), Y3) * 0.06, 0.115))
    C.append(('head', hd, hd, 0.105))
    for s, sg in (('left', 1), ('right', -1)):
        fing = np.einsum('nij,j->ni', W(s + 'Hand'), sg * X3)
        sole = np.einsum('nij,j->ni', W(s + 'Foot'), -Y3); toe = np.einsum('nij,j->ni', W(s + 'Foot'), Z3)
        C += [(s + 'UA', P(s + 'UpperArm'), P(s + 'Forearm'), 0.048), (s + 'FA', P(s + 'Forearm'), P(s + 'Hand'), 0.040),
              (s + 'Hand', P(s + 'Hand') + fing * 0.03, P(s + 'Hand') + fing * 0.15, 0.025),
              (s + 'Thigh', P(s + 'Thigh'), P(s + 'Shin'), 0.072), (s + 'Shin', P(s + 'Shin'), P(s + 'Foot'), 0.050),
              (s + 'Foot', P(s + 'Foot') + sole * 0.035 - toe * 0.04, P(s + 'Foot') + sole * 0.035 + toe * 0.15, 0.035)]
    return C
def segdist(a, b, c, d):
    """closest distance between segments ab and cd, vectorised over N."""
    u, v, w = b - a, d - c, a - c
    A_ = (u * u).sum(1); B = (u * v).sum(1); C_ = (v * v).sum(1); D_ = (u * w).sum(1); E = (v * w).sum(1)
    den = A_ * C_ - B * B; eps = 1e-9
    s = np.where(den > eps, (B * E - C_ * D_) / np.maximum(den, eps), 0.0); s = np.clip(s, 0, 1)
    t = np.where(C_ > eps, (B * s + E) / np.maximum(C_, eps), 0.0); t = np.clip(t, 0, 1)
    s = np.where(A_ > eps, np.clip((B * t - D_) / np.maximum(A_, eps), 0, 1), 0.0)
    return np.linalg.norm(w + u * s[:, None] - v * t[:, None], axis=1)
CA = caps(); CD = {c[0]: c for c in CA}
issues = []
def add(kind, mask, val, name):
    idx = np.nonzero(mask)[0]
    if len(idx): issues.append((kind, name, idx, val[idx]))
# floor: everything above floor; the bottom of planted hands/feet may touch (y >= -0.005)
for nm, a, b, r in CA:
    lo = np.minimum(a[:, 1], b[:, 1]) - r; add('floor', lo < -0.008, lo, nm)
# head must stay off the floor (2000: weight on the hands only)
add('head-floor', CD['head'][1][:, 1] - 0.105 < 0.03, CD['head'][1][:, 1] - 0.105, 'head')
# self-collision pairs (allowed: torso-UA (shoulder), adjacent segments)
pairs = []
for s in ('left', 'right'):
    o = 'right' if s == 'left' else 'left'
    pairs += [(s + 'FA', 'torso', 1.0), (s + 'Hand', 'torso', 1.0), (s + 'FA', 'head', 0.75), (s + 'UA', 'head', 0.70), (s + 'Hand', 'head', 0.8)]
    for leg in ('Thigh', 'Shin', 'Foot'):
        for arm in ('UA', 'FA', 'Hand'): pairs.append((s + leg, s + arm, 1.0)); pairs.append((s + leg, o + arm, 1.0))
        pairs.append((s + leg, 'head', 1.0))
    pairs += [(s + 'Shin', 'torso', 1.0), (s + 'Foot', 'torso', 1.0)]
pairs += [('leftShin', 'rightShin', 0.80), ('leftFoot', 'rightFoot', 0.75), ('leftThigh', 'rightThigh', 0.85), ('leftShin', 'rightFoot', 0.8), ('rightShin', 'leftFoot', 0.8),
          ('leftThigh', 'rightShin', 0.9), ('rightThigh', 'leftShin', 0.9), ('leftFA', 'rightFA', 0.55), ('leftUA', 'rightFA', 0.9), ('rightUA', 'leftFA', 0.9)]
seen = set()
for p, q, tol in pairs:
    if (q, p) in seen: continue
    seen.add((p, q)); a, b = CD[p], CD[q]
    d = segdist(a[1], a[2], b[1], b[2]); lim = (a[3] + b[3]) * tol
    add('clip', d < lim, d - lim, p + '/' + q)
# joint ranges
def ang(u, v): return np.degrees(np.arccos(np.clip((u * v).sum(1) / np.linalg.norm(u, axis=1) / np.linalg.norm(v, axis=1), -1, 1)))
for s, sg in (('left', 1), ('right', -1)):
    ua = P(s + 'Forearm') - P(s + 'UpperArm'); fa = P(s + 'Hand') - P(s + 'Forearm'); el = ang(ua, fa); add('elbow>150', el > 150, el, s)
    th = P(s + 'Shin') - P(s + 'Thigh'); sh = P(s + 'Foot') - P(s + 'Shin'); kn = ang(th, sh); add('knee>150', kn > 150, kn, s)
    # hip: thigh direction in pelvis frame (rest thigh points -Y; +Z forward; sg*X outward)
    tl = np.einsum('nji,nj->ni', W('pelvis'), th); tl /= np.linalg.norm(tl, axis=1)[:, None]
    flex = np.degrees(np.arctan2(tl[:, 2], -tl[:, 1]))         # + = thigh forward
    abd = np.degrees(np.arcsin(np.clip(sg * tl[:, 0], -1, 1)))  # + = outward
    add('hip-ext>35', flex < -35, flex, s); add('hip-flex>135', flex > 135, flex, s); add('hip-abd>75', abd > 75, abd, s); add('hip-add>30', abd < -30, abd, s)
    # wrist: angle between forearm axis and the hand's finger axis; dorsiflexion limit ~95
    fing = np.einsum('nij,j->ni', W(s + 'Hand'), sg * X3); wb = ang(fa, fing); add('wrist>95', wb > 95, wb, s)
    # hand twist about the forearm axis vs the forearm bone's own frame (twist bones carry up to ~90)
    Rr = np.einsum('nji,njk->nik', W(s + 'Forearm'), W(s + 'Hand'))
    # swing-twist about the forearm's own long axis (local +-X): twist part of the hand relative to the forearm bone
    ax_ = sg * X3; tw = np.zeros(N)
    for i in range(N):
        M = Rr[i]; w_ = math.sqrt(max(0, 1 + M[0,0] + M[1,1] + M[2,2])) / 2
        v_ = np.array([M[2,1]-M[1,2], M[0,2]-M[2,0], M[1,0]-M[0,1]]) / (4 * w_ + 1e-12) if w_ > 1e-6 else np.array([1., 0, 0])
        tw[i] = math.degrees(2 * math.atan2(v_ @ ax_, w_)); tw[i] = (tw[i] + 180) % 360 - 180
    add('hand-twist>90', np.abs(tw) > 90, tw, s)
    # shoulder: humerus axial rotation (0 = T-pose frame swung to the arm direction, crease = upper-arm local +Z) and
    # forearm pronation (0 = palm normal perpendicular to the elbow crease); each about +-85 deg in a real arm
    from armfix import humerus_twist, pronation
    hw = np.zeros(N); pr = np.zeros(N); ejump = np.zeros(N)
    U_ = W(s + 'UpperArm'); F_ = W(s + 'Forearm'); T_ = W('torso')
    for i in range(N):
        e_ = n3(P(s + 'Forearm')[i] - P(s + 'UpperArm')[i]); f_ = n3(P(s + 'Hand')[i] - P(s + 'Forearm')[i])
        hw[i] = humerus_twist(T_[i], sg, e_, U_[i][:, 2]); pr[i] = pronation(U_[i], F_[i], e_, f_)
    add('humerus-rot>85', np.abs(hw) > 85, hw, s); add('pronation>85', np.abs(pr) > 85, pr, s)
    # arm pops: twist or pronation changing faster than 1500 deg/s, or the upper arm swinging faster than 1800 deg/s (a thrown arm)
    dh = np.abs((np.diff(hw) + 180) % 360 - 180) * fps; dp = np.abs((np.diff(pr) + 180) % 360 - 180) * fps
    add('arm-twist-pop', np.concatenate([[False], (dh > 1500) | (dp > 1500)]), np.concatenate([[0], np.maximum(dh, dp)]), s)
    eu = P(s + 'Forearm') - P(s + 'UpperArm'); eu /= np.linalg.norm(eu, axis=1)[:, None]
    de = np.degrees(np.arccos(np.clip((eu[1:] * eu[:-1]).sum(1), -1, 1))) * fps
    add('elbow-pop', np.concatenate([[False], de > 1800]), np.concatenate([[0], de]), s)
    # knee pointing: knee front must face roughly the toe direction (no reversed knees): shin x thigh plane consistent
for j in ('spineLower', 'neck'):
    pass
sp = ang(np.einsum('nij,j->ni', W('pelvis'), Y3), np.einsum('nij,j->ni', W('torso'), Y3)); add('spine>70', sp > 70, sp, 'spine')
nk = ang(np.einsum('nij,j->ni', W('torso'), Y3), np.einsum('nij,j->ni', W('head'), Y3)); add('neck>60', nk > 60, nk, 'neck')
# sliding of planted contacts (hand palm or foot ankle near floor, moving > 1.5 cm/frame-at-30fps equivalent)
for s in ('left', 'right'):
    for j, h in ((s + 'Hand', 0.07), (s + 'Foot', 0.11)):
        p = P(j); low = p[:, 1] < h; vel = np.zeros(N); vel[1:] = np.linalg.norm(np.diff(p[:, [0, 2]], axis=0), axis=1) * fps
        both = low & np.concatenate([[False], low[:-1]])
        if 'Hand' in j and 'th' in Z.files:   # during the spin the axis hand pivots in place; sliding = radial drift only
            pass
        add('slide>0.25m/s', both & (vel > 0.25), vel, j)
def report():
    out = []
    for kind, name, idx, val in issues:
        t = idx / fps; segs = []; st = idx[0]; pv = idx[0]
        for i in idx[1:]:
            if i != pv + 1: segs.append((st, pv)); st = i
            pv = i
        segs.append((st, pv))
        worst = val[np.argmax(np.abs(val))]
        out.append(f'{kind:14s} {name:22s} worst {worst:+.3f}  frames ' + ', '.join(f'{a/fps:.2f}-{b/fps:.2f}s' for a, b in segs[:6]) + (' …' if len(segs) > 6 else ''))
    return out
R = report(); print(f'{N} frames @ {fps:g} fps: {len(R)} issue groups'); [print(' ', r) for r in R]
if A.sheet:
    views = A.views.split(',')
    VIEW = {'front': (np.array([-1., 0, 0]), np.array([0, 1., 0]), np.array([0, 0, 1.])),   # camera at -Z (chest side of the spin pose)
            'side': (np.array([0, 0, -1.]), np.array([0, 1., 0]), np.array([-1., 0, 0])),   # camera at +X
            'diag': (np.array([-0.707, 0, -0.707]), np.array([0, 1., 0]), np.array([-0.707, 0, 0.707])),  # camera at (+X,-Z)
            'top': (np.array([-1., 0, 0]), np.array([0, 0, 1.]), np.array([0, -1., 0]))}
    COL = {'left': (40, 90, 230), 'right': (220, 60, 40), 'torso': (40, 40, 40), 'head': (60, 60, 60)}
    cell = 230; S = 105.0
    frames = [int(round(t * fps)) for t in np.arange(A.t0, min(A.t1, (N - 1) / fps) + 1e-6, A.step)]
    img = Image.new('RGB', (cell * len(frames), cell * len(views) + 18), 'white'); dr = ImageDraw.Draw(img)
    bad = set()
    for kind, name, idx, val in issues: bad.update(idx.tolist())
    for ci, f in enumerate(frames):
        dr.text((ci * cell + 4, 2), f'{f / fps:.2f}s' + (' !' if f in bad else ''), fill=(200, 0, 0) if f in bad else (0, 0, 0))
        for vi, v in enumerate(views):
            ax, ay, fw = VIEW[v]; ox, oy = ci * cell + cell / 2, 18 + vi * cell + (cell - 22 if v != 'top' else cell / 2)
            pr = lambda p: (ox + float((p - np.array([A.cx, 0, 0])) @ ax) * S, oy - float((p - np.array([A.cx, 0, 0])) @ ay) * S)
            if v != 'top': dr.line([(ci * cell + 4, oy), (ci * cell + cell - 4, oy)], fill=(170, 170, 170))
            else: dr.ellipse([ox - 3, oy - 3, ox + 3, oy + 3], outline=(150, 150, 150))
            order = sorted(CA, key=lambda c: -float(((c[1][f] + c[2][f]) / 2) @ fw))
            for nm, a, b, r in order:
                c = COL['left'] if nm.startswith('left') else COL['right'] if nm.startswith('right') else COL.get(nm, (0, 0, 0))
                pa, pb = pr(a[f]), pr(b[f]); w = max(2, int(r * S * 2))
                dr.line([pa, pb], fill=c, width=w); dr.ellipse([pa[0] - w / 2, pa[1] - w / 2, pa[0] + w / 2, pa[1] + w / 2], fill=c); dr.ellipse([pb[0] - w / 2, pb[1] - w / 2, pb[0] + w / 2, pb[1] + w / 2], fill=c)
            dr.text((ci * cell + 4, 18 + vi * cell + 2), v, fill=(120, 120, 120))
    img.save(A.sheet); print('sheet', A.sheet, len(frames), 'cols')
