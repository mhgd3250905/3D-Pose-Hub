#!/usr/bin/env python3
"""Breaking 2000 r20 = driven directly by real-video 3D pose data (GVHMR/HMR2 SMPL estimate of Kaige's clip
'11月19日 (5)(1).mp4', 177 frames @ 30 fps), retargeted onto the v3 rig. No hand-authored key poses.

Pipeline
 1. SMPL global joint rotations by FK of the axis-angle data (world, gravity Y-up), rotated into the scene frame
    (camera at +Z looking -Z, image right = +X, same as the Pose Studio v0 camera).
 2. Monocular front/back ambiguity repair (the only place the data is rewritten): during the stacked-hand spin the
    estimator never sees the back (chest yaw oscillates within +-70 deg) and the 2D label stabilizer flipped L/R from
    frame 138 on. Frames that the video shows from the back are depth-mirrored + L/R swapped (the exact ambiguity
    pair), and the spin heading is replaced by a monotone curve through the front/back crossings read off the video
    frames (front 78, 93.5, 110.5, 131; back 87.5, 102, 119.5, 141).
 3. Light temporal smoothing (Gaussian sigma 0.8 frame on rotations, 1 frame on root).
 4. Whole move mirrored left<->right (video: right hand plants first, left leg kicks; Kaige wants LEFT hand first,
    RIGHT hand = axis, clockwise spin).
 5. Retarget by bone direction: W_v3 = G_smpl @ C_b (C_b maps the v3 rest bone direction onto the SMPL rest one).
    Root = SMPL pelvis * leg-length ratio.
 6. 30 -> 120 fps: slerp of local rotations, Catmull-Rom of the root.
 7. Contacts only: root re-anchored so planted hands/feet stay locked (weighted, smoothed), two-bone IK of the
    contact limbs onto the lock targets (bend plane kept from the data), planted palm/sole laid flat, top hand
    stacked on the axis hand during the spin."""
import sys, os, json, math, argparse
import numpy as np
from scipy.spatial.transform import Rotation as Rot, Slerp
from scipy.interpolate import PchipInterpolator
sys.path.insert(0, os.path.dirname(__file__))
from kf import PAR, JOINTS, n, X, Y, Z, ry, aim, m2q
from armfix import pronation, humerus_twist

ap = argparse.ArgumentParser()
ap.add_argument('rest'); ap.add_argument('out')
ap.add_argument('--ref', default='/workspace/work/airflare/ref/airflare-video/clip01')
ap.add_argument('--dump'); ap.add_argument('--fps', type=int, default=120)
ap.add_argument('--mirror', action='store_true'); ap.add_argument('--nocontact', action='store_true')
ap.add_argument('--debug')
A = ap.parse_args()
log = lambda *a: print(*a, file=sys.stderr)

# ---------------- 1. data ----------------
Zp = np.load(os.path.join(A.ref, 'pose_parameters.npz'))
N = Zp['world_global_orient'].shape[0]; FPS0 = float(Zp['fps'])
PA = [-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19, 20, 21]   # SMPL24 parents
Lr = Rot.from_rotvec(Zp['world_body_pose'].reshape(-1, 3)).as_matrix().reshape(N, 21, 3, 3)
G = np.zeros((N, 24, 3, 3)); G[:, 0] = Rot.from_rotvec(Zp['world_global_orient']).as_matrix()
for j in range(1, 22): G[:, j] = G[:, PA[j]] @ Lr[:, j - 1]
G[:, 22] = G[:, 20]; G[:, 23] = G[:, 21]
J = np.load(os.path.join(A.ref, 'skeleton_motion.npz'))['joints_3d'].astype(float)
OFF = np.zeros((24, 3))
for c in range(1, 24): OFF[c] = np.einsum('nji,nj->ni', G[:, PA[c]], J[:, c] - J[:, PA[c]]).mean(0)   # SMPL rest offsets

# scene frame: camera forward -> -Z, image right -> +X
Rc = Rot.from_rotvec(Zp['camera_global_orient']).as_matrix(); Rw = G[:, 0]
Ccw = Rc[0] @ Rw[0].T                                 # world -> camera (static camera)
fw = Ccw.T @ np.array([0, 0, 1.0]); a0 = math.atan2(fw[0], fw[2])
AS = ry(math.pi - a0)                                  # rotate world so that fw_h -> -Z
G = np.einsum('ij,nmjl->nmil', AS, G); J = np.einsum('ij,nkj->nki', AS, J)
log('camera fwd scene', (AS @ fw).round(3), 'right', (AS @ (Ccw.T @ np.array([1, 0, 0.]))).round(3))

SW = list(range(24))
for a_, b_ in ((1, 2), (4, 5), (7, 8), (10, 11), (13, 14), (16, 17), (18, 19), (20, 21), (22, 23)): SW[a_], SW[b_] = b_, a_
S_ = np.diag([-1.0, 1, 1])

def heading(Gf): d = Gf[0] @ Z; return math.degrees(math.atan2(d[0], d[2]))

def depth_flip(f):
    c = J[f, 0].copy(); M = np.diag([1.0, 1, -1])
    G[f] = np.array([M @ G[f, SW[j]] @ S_ for j in range(24)]); J[f] = np.array([M @ (J[f, SW[j]] - c) + c for j in range(24)])

def yaw_about(f, d):
    c = J[f, 0].copy(); R_ = ry(math.radians(d)); G[f] = np.einsum('ij,njk->nik', R_, G[f]); J[f] = (J[f] - c) @ R_.T + c

# ---------------- 2. front/back repair of the flare rotation ----------------
# Monocular ambiguity: each frame has two bodies with the same 2D picture (data, and its depth mirror with L/R swapped).
# Dynamic programming picks one per frame so the heading (horizontal angle of the hip axis) turns smoothly in one
# direction (the flare never reverses). No yaw is invented: the chosen body keeps the video's 2D picture exactly.
def hhead(f): v = J[f, 1] - J[f, 2]; return math.degrees(math.atan2(v[0], v[2]))
S0, S1 = int(os.environ.get('AF_S0', '18')), int(os.environ.get('AF_S1', '152'))
DIR = float(os.environ.get('AF_DIR', '1'))
cand = []
for f in range(N):
    Gs, Js = G[f].copy(), J[f].copy(); h0 = hhead(f); depth_flip(f); h1 = hhead(f); G[f], J[f] = Gs, Js
    cand.append((h0, h1))
def wd(a, b): return (b - a + 180) % 360 - 180
INF = 1e18; cost = np.full((N, 2), INF); bp = np.zeros((N, 2), int); cost[0] = [0, INF]
for f in range(1, N):
    for k in (0, 1):
        if k == 1 and not (S0 <= f <= S1): continue
        for j in (0, 1):
            if cost[f - 1, j] >= INF: continue
            d = DIR * wd(cand[f - 1][j], cand[f][k])
            c = cost[f - 1, j] + (abs(d) if d >= -5 else 6 * abs(d)) + (8 if k != j else 0)
            if c < cost[f, k]: cost[f, k] = c; bp[f, k] = j
k = int(np.argmin(cost[-1])); ch = [0] * N
for f in range(N - 1, -1, -1): ch[f] = k; k = bp[f, k]
FL = [f for f in range(N) if ch[f] == 1]
for f in FL: depth_flip(f)
log('depth-flipped', FL)
th_fix = np.degrees(np.unwrap(np.radians([hhead(f) for f in range(N)])))
log('heading after repair:', ' '.join(f'{f}:{th_fix[f]:.0f}' for f in range(0, N, 4)))

# ---------------- 3. smoothing ----------------
def gsmooth_q(Q, sig):
    out = Q.copy(); r = int(math.ceil(3 * sig)); w = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2)
    for i in range(len(Q)):
        acc = np.zeros(4)
        for k, wk in zip(range(-r, r + 1), w):
            j = min(len(Q) - 1, max(0, i + k)); q = Q[j] if Q[j] @ Q[i] >= 0 else -Q[j]; acc += wk * q
        out[i] = acc / np.linalg.norm(acc)
    return out
def gsmooth(V, sig):
    r = int(math.ceil(3 * sig)); w = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2); w /= w.sum()
    P = np.concatenate([V[:1].repeat(r, 0), V, V[-1:].repeat(r, 0)]); return sum(w[k] * P[k:k + len(V)] for k in range(2 * r + 1))
# smooth LOCAL rotations (keeps the spin heading which is now continuous), then rebuild globals
Lq = np.zeros((N, 24, 4))
for j in range(24):
    Lm = G[:, j] if j == 0 else np.einsum('nji,njk->nik', G[:, PA[j]], G[:, j])
    Lq[:, j] = gsmooth_q(Rot.from_matrix(Lm).as_quat(), 0.8)
root = gsmooth(J[:, 0], 1.0)
def rebuild(Lq, root):
    Gs = np.zeros((N, 24, 3, 3)); Js = np.zeros((N, 24, 3)); Gs[:, 0] = Rot.from_quat(Lq[:, 0]).as_matrix(); Js[:, 0] = root
    for j in range(1, 24):
        Gs[:, j] = Gs[:, PA[j]] @ Rot.from_quat(Lq[:, j]).as_matrix(); Js[:, j] = Js[:, PA[j]] + np.einsum('nij,j->ni', Gs[:, PA[j]], OFF[j])
    return Gs, Js
G, J = rebuild(Lq, root)

# ---------------- 4. left/right mirror ----------------
MIR = A.mirror
if MIR:
    Mx = np.diag([-1.0, 1, 1])
    G = np.stack([np.einsum('ij,njk,kl->nil', Mx, G[:, SW[j]], S_) for j in range(24)], 1)
    J = np.stack([J[:, SW[j]] @ Mx.T for j in range(24)], 1)

if os.environ.get('R20_PRINT'):
    for f in range(N):
        sp = lambda j: np.linalg.norm((J[min(N-1,f+1), j] - J[max(0,f-1), j])[[0, 2]]) * FPS0 / 2
        log(f, ' '.join(f'{nm} y{J[f,j][1]:+.2f} v{sp(j):.2f}' for nm, j in (('LA', 7), ('RA', 8), ('LW', 20), ('RW', 21))), 'dW', round(float(np.linalg.norm(J[f,20]-J[f,21])),2))
# ---------------- 5. retarget ----------------
REST = json.load(open(A.rest))['out']; LP = {k: np.array(v['lp'], float) for k, v in REST.items()}
def swing(a, b):
    a = n(a); b = n(b); ax = np.cross(a, b); s = np.linalg.norm(ax)
    if s < 1e-9: return np.eye(3)
    return Rot.from_rotvec(ax / s * math.atan2(s, a @ b)).as_matrix()
MAP = {'pelvis': (0, None, None), 'spineLower': (3, 6, 'spineUpper'), 'spineUpper': (6, 9, 'torso'), 'torso': (9, 12, 'neck'),
       'neck': (12, 15, 'head'), 'head': (15, None, None)}
for sd, o in (('left', 0), ('right', 1)):
    MAP.update({sd + 'Scapula': (None, None, None), sd + 'UpperArm': (16 + o, 18 + o, sd + 'Forearm'), sd + 'Forearm': (18 + o, 20 + o, sd + 'Hand'),
                sd + 'Hand': (20 + o, None, None), sd + 'Thigh': (1 + o, 4 + o, sd + 'Shin'), sd + 'Shin': (4 + o, 7 + o, sd + 'Foot'),
                sd + 'Foot': (7 + o, None, None)})
CB = {b: (swing(LP[vc], OFF[c]) if c is not None else np.eye(3)) for b, (j, c, vc) in MAP.items()}
LEG_S = np.linalg.norm(OFF[4]) + np.linalg.norm(OFF[7]); LEG_V = np.linalg.norm(LP['leftShin']) + np.linalg.norm(LP['leftFoot'])
SC = LEG_V / LEG_S; log('scale', round(SC, 4))
W30 = {}
for b in JOINTS:
    j = MAP[b][0]
    W30[b] = (G[:, j] @ CB[b]) if j is not None else None
for sd in ('left', 'right'): W30[sd + 'Scapula'] = W30['torso'].copy()
root30 = J[:, 0] * SC
# pelvis joint vs v3 pelvis origin: both at the hip centre; keep the SMPL pelvis-joint height offset scaled
loc30 = {b: (W30[b] if b == 'pelvis' else np.einsum('nji,njk->nik', W30[PAR[b]], W30[b])) for b in JOINTS}

# ---------------- 6. resample ----------------
FPS = A.fps; T_END = (N - 1) / FPS0; NF = int(round(T_END * FPS)) + 1
tt = np.arange(NF) / FPS; t30 = np.arange(N) / FPS0
LOC = {}
for b in JOINTS:
    q = Rot.from_matrix(loc30[b]).as_quat()
    for i in range(1, N):
        if q[i] @ q[i - 1] < 0: q[i] = -q[i]
    LOC[b] = Slerp(t30, Rot.from_quat(q))(np.clip(tt, 0, t30[-1])).as_matrix()
from scipy.interpolate import CubicSpline
ROOT = CubicSpline(t30, root30)(tt)
SHY = CubicSpline(t30, SC * 0.5 * (J[:, 16, 1] + J[:, 17, 1]))(tt)   # data shoulder height (scaled) -> keeps the video's head/shoulder clearance

def fk(i, root=None, loc=None):
    loc = loc or {b: LOC[b][i] for b in JOINTS}; W = {}; P = {}
    W['pelvis'] = loc['pelvis']; P['pelvis'] = ROOT[i] if root is None else root
    for b in JOINTS[1:]:
        p = PAR[b]; W[b] = W[p] @ loc[b]; P[b] = P[p] + W[p] @ LP[b]
    return W, P

# ---------------- 7. contacts ----------------
L_UA = np.linalg.norm(LP['leftForearm']); L_FA = np.linalg.norm(LP['leftHand'])
L_TH = np.linalg.norm(LP['leftShin']); L_SH = np.linalg.norm(LP['leftFoot'])
HAND_Y, FOOT_Y = 0.045, 0.085      # wrist / ankle height when palm / sole lies flat on the floor (v3 rig)
# contact windows in source frames (30 fps), after the L/R mirror; read from the data (wrist/ankle height + speed)
CW = json.loads(os.environ.get('R20_CW', 'null')) or {
    'leftFoot': [[0, 47], [160, 176]], 'rightFoot': [[8, 38], [160, 176]],
    'leftHand': [[42, 77]], 'rightHand': [[67, 160]], 'leftTop': [[83, 157]]}
RAMP = 0.10
TOPR = 0.25
def wgt(name, t, RAMP=None):
    RAMP = RAMP if RAMP is not None else (0.25 if 'Hand' in name else 0.10)
    w = 0.0
    for a, b in CW.get(name, []):
        ta, tb = a / FPS0, b / FPS0
        if ta - 1e-9 <= t <= tb:
            u = min(1.0, (t - ta) / RAMP if a > 0 else 1.0, (tb - t) / RAMP if b < N - 1 else 1.0)
            w = max(w, u * u * (3 - 2 * u))
    return w
def clr(name, t):
    a0 = 0.07 if ('Hand' in name or 'Top' in name) else 0.06; v = 0.0
    for a, b in CW.get(name, []):
        ta, tb = a / FPS0, b / FPS0
        if ta - 0.35 <= t < ta: u = min(1, (t - (ta - 0.35)) / 0.15); v = max(v, a0 * u * u * (3 - 2 * u))
        elif ta <= t <= tb: v = max(v, a0 * (1 - wgt(name, t)))
        elif tb < t <= tb + 0.35: u = min(1, (tb + 0.35 - t) / 0.15); v = max(v, a0 * u * u * (3 - 2 * u))

    return v
JNT = {'leftFoot': 'leftFoot', 'rightFoot': 'rightFoot', 'leftHand': 'leftHand', 'rightHand': 'rightHand'}
FLOORY = {'leftFoot': FOOT_Y, 'rightFoot': FOOT_Y, 'leftHand': HAND_Y, 'rightHand': HAND_Y}

def two_bone(W, P, loc, root_b, mid_b, end_b, T, l1, l2, pole_hint=None, hint_w=0.0):
    S = P[root_b]; E = P[mid_b]; H = P[end_b]
    d = T - S; dl = np.linalg.norm(d); dn = d / dl; dl = min(dl, (l1 + l2) * 0.9995)
    pole = E - S - dn * ((E - S) @ dn)
    if pole_hint is not None and hint_w > 0:
        ph = pole_hint - dn * (pole_hint @ dn)
        if np.linalg.norm(ph) > 1e-4 and np.linalg.norm(pole) > 1e-5: pole = n(pole) * (1 - hint_w) + n(ph) * hint_w
    pole = n(pole) if np.linalg.norm(pole) > 1e-5 else n(np.cross(dn, X))
    ca = (l1 * l1 + dl * dl - l2 * l2) / (2 * l1 * dl); a_ = math.acos(max(-1, min(1, ca)))
    E2 = S + (dn * math.cos(a_) + pole * math.sin(a_)) * l1; H2 = S + dn * dl
    R1 = swing(E - S, E2 - S); W1 = R1 @ W[root_b]
    R2 = swing(W1.T @ (H - E) if False else (R1 @ (H - E)), H2 - E2); W2 = R2 @ R1 @ W[mid_b]
    return W1, W2

def set_world(loc, W, b, Wb):
    loc[b] = W[PAR[b]].T @ Wb

out_frames = []; DUMP = {}; LOCKS = []; GPREV = {'left': (0, 0), 'right': (0, 0)}
locks = {}
# pass A: root anchoring offsets. A new contact locks where it lands in the already-anchored body (no jump);
# the root weight of a contact fades in after it lands and out before it lifts (0.6 s), so hand-overs are gradual.
RR = 0.6
LOCKAT = []
def segw(name, t):
    for a, b in CW.get(name, []):
        ta, tb = a / FPS0, b / FPS0
        if ta <= t <= tb:
            u = min(1.0, (t - ta) / RR if a > 0 else 1.0, (tb - t) / RR if b < N - 1 else 1.0)
            return max(0.02, u * u * (3 - 2 * u))
    return 0.0
off = np.zeros((NF, 3)); prev = np.zeros(3)
for i in range(NF):
    t = tt[i]; W, P = fk(i); acc = np.zeros(3); ws = 0.0; X_ = {}
    for c in JNT:
        if segw(c, t) <= 0: locks.pop(c, None); continue
        x = P[JNT[c]].copy()
        if c == 'rightHand':   # stacked spin: the stacked hands sit under the midpoint of the data's two hands
            s_ = wgt('leftTop', t, 0.25); x = x + s_ * (0.5 * (P['leftHand'] + P['rightHand']) - x)
        X_[c] = x
        if c not in locks:
            p0 = x + prev; p0[1] = FLOORY[c]; locks[c] = p0
    for c, x in X_.items():
        w = segw(c, t); d = locks[c] - x
        if 'Hand' in c:
            # vertical: body height from the data (scaled pelvis)
            dy = max(0.0, d[1])   # keep the data's body height; rise only if the hand would sink, lower only as the arm needs to reach
            Sx = P[c.replace('Hand', 'UpperArm')] + np.array([d[0], dy, d[2]]); T_ = locks[c]
            hz = np.linalg.norm((T_ - Sx)[[0, 2]]); Lm = 0.985 * (L_UA + L_FA)
            if np.hypot(hz, Sx[1] - T_[1]) > Lm and hz < Lm: dy -= (Sx[1] - T_[1]) - math.sqrt(Lm * Lm - hz * hz)
            st = wgt('leftTop', t, 0.25)
            if c == 'rightHand' and st > 0:   # the top (left) hand must reach the back of the axis hand too
                Sl = P['leftUpperArm'] + np.array([d[0], dy, d[2]]); Tl = T_ + np.array([0, 0.075, 0])
                hz = np.linalg.norm((Tl - Sl)[[0, 2]])
                if np.hypot(hz, Sl[1] - Tl[1]) > Lm and hz < Lm: dy -= st * ((Sl[1] - Tl[1]) - math.sqrt(Lm * Lm - hz * hz))
            d = np.array([d[0], dy, d[2]])
        acc += w * d; ws += w
    LOCKAT.append({k: v.copy() for k, v in locks.items()})
    if ws > 0: off[i] = acc / ws
    else:   # airborne: no planted limb, so the accumulated contact drift can bleed back toward the data's own root path
        dv = -prev.copy(); dv[1] = 0; m_ = np.linalg.norm(dv); DK = float(os.environ.get('AF_DECAY', '0.012'))
        off[i] = prev + (dv if m_ <= DK else dv / m_ * DK)
    prev = off[i]
    if os.environ.get('R20_DBG') and i % 16 == 0: log('A', i / 4, 'SHY', round(SHY[i], 2), 'sh', round(0.5 * (P['leftUpperArm'][1] + P['rightUpperArm'][1]), 2), 'off', off[i].round(2), {c: round(segw(c, t), 2) for c in X_})
off = gsmooth(off, 0.06 * FPS)
if A.nocontact: off[:] = 0
for _pass in range(2):
  # reach pass: planted limbs must be reachable -> minimal root push, smoothed so it never pops
  push = np.zeros((NF, 3))
  for i in range(NF):
      t = tt[i]; W, P = fk(i, ROOT[i] + off[i]); pv = np.zeros(3)
      cons = []
      for c, rb in (('leftHand', 'leftUpperArm'), ('rightHand', 'rightUpperArm'), ('leftFoot', 'leftThigh'), ('rightFoot', 'rightThigh')):
          w = wgt(c, t)
          if w <= 0 or c not in LOCKAT[i]: continue
          cons.append((w, P[rb], LOCKAT[i][c], ((L_UA + L_FA) if 'Hand' in c else (L_TH + L_SH)) * 0.985))
          if c == 'rightHand' and wgt('leftTop', t, TOPR) > 0:
              cons.append((wgt('leftTop', t, TOPR), P['leftUpperArm'], LOCKAT[i][c] + np.array([0, 0.075, 0]), (L_UA + L_FA) * 0.97))
      # hands: lower the body (vertical only, always helps when the shoulders are above the hands); feet: projection
      for w, S, T, L in cons:
          if T[1] > 0.3 or S[1] < T[1]: continue
          hz = np.linalg.norm((T - S)[[0, 2]])
          if L > 0.6 or hz >= L: continue
          dy = (S[1] - T[1]) - math.sqrt(L * L - hz * hz)
          if dy > 0: pv[1] = min(pv[1], -w * dy)
      for _ in range(12):
          mv = False
          for w, S, T, L in cons:
              d = T - (S + pv); ex = np.linalg.norm(d) - L
              if ex > 1e-4: pv = pv + w * n(d) * ex; mv = True
          if not mv: break
      push[i] = pv
  pmin = push[:, 1].copy()
  for k in range(-6, 7): pmin = np.minimum(pmin, np.roll(push[:, 1], k))
  push[:, 1] = pmin
  if not A.nocontact: off = off + gsmooth(push, 0.04 * FPS) * 1.1
  if os.environ.get('R20_DBG'): log('push', ' '.join(f'{i/4:.0f}:{push[i].round(2)}' for i in range(160, 340, 16)))
lift = np.zeros(NF)
for i in range(NF):
    W, P = fk(i, ROOT[i] + off[i])
    low = min(P['head'][1] - 0.11, P['neck'][1] - 0.08, P['torso'][1] - 0.10, P['pelvis'][1] - 0.10)
    lift[i] = max(0.0, 0.02 - low)
lm = lift.copy()
for k in range(-12, 13): lm = np.maximum(lm, np.roll(lift, k))
if not A.nocontact: off[:, 1] += gsmooth(lm[:, None], 0.05 * FPS)[:, 0]
log('body lift max', round(float(lift.max()), 3))
log('root offset range', off.min(0).round(3), off.max(0).round(3))

locks = {}
for i in range(NF):
    t = tt[i]; rootp = ROOT[i] + off[i]
    loc = {b: LOC[b][i].copy() for b in JOINTS}
    W, P = fk(i, rootp, loc)
    lk = [False, False]
    if not A.nocontact:
        for sd in ('right', 'left'):   # axis (right) hand first, so the top hand stacks on its locked position
            sg = 1 if sd == 'left' else -1
            # legs: planted foot locked (lifted while it ramps in/out so it steps rather than slides), sole laid flat
            c = sd + 'Foot'; w = wgt(c, t)
            if w > 0:
                Lk = LOCKAT[i][c]
                wh = min(1.0, w * 1.6); wh = wh * wh * (3 - 2 * wh)
                T = P[c] + wh * (Lk - P[c]); T[1] = max(P[c][1] + w * (FOOT_Y - P[c][1]), FOOT_Y + clr(c, t))
                W1, W2 = two_bone(W, P, loc, sd + 'Thigh', sd + 'Shin', sd + 'Foot', T, L_TH, L_SH)
                set_world(loc, W, sd + 'Thigh', W1); W, P = fk(i, rootp, loc); set_world(loc, W, sd + 'Shin', W2); W, P = fk(i, rootp, loc)
                toe = W[c] @ Z; toe_h = n(np.array([toe[0], 0, toe[2]]))
                Wf = aim(Z, -Y, n(toe + w * (toe_h - toe)), n(W[c] @ -Y + w * (-Y - W[c] @ -Y)))
                set_world(loc, W, c, Wf); W, P = fk(i, rootp, loc)
            # arms
            c = sd + 'Hand'; w = wgt(c, t); wt = wgt('leftTop', t, TOPR) if sd == 'left' else 0.0
            if w > 0 or wt > 0:
                hint = None; hw = 0.0
                if wt > 0:   # top hand rides on the back of the axis hand, elbow kept out to the side
                    ax = LOCKAT[i]['rightHand'] if 'rightHand' in LOCKAT[i] else P['rightHand']; T0 = ax + np.array([0, 0.075, 0]) + n(np.array([(W['torso'] @ X)[0], 0, (W['torso'] @ X)[2]])) * 0.035
                    T = P[c] + wt * (T0 - P[c]); w = wt; hint = W['torso'] @ X; hw = 0.6 * wt
                    if os.environ.get('R20_DBG2') and 466 <= i <= 482: log('top', i, 'T0', T0.round(3), 'T', T.round(3), 'S', P['leftUpperArm'].round(3), 'dist', round(float(np.linalg.norm(T - P['leftUpperArm'])), 3), 'ax', ax.round(3))
                else:
                    Lk = LOCKAT[i][c]
                    wh = min(1.0, w * 1.6); wh = wh * wh * (3 - 2 * wh)
                    T = P[c] + wh * (Lk - P[c]); T[1] = max(P[c][1] + w * (HAND_Y - P[c][1]), HAND_Y + clr(c, t))
                W1, W2 = two_bone(W, P, loc, sd + 'UpperArm', sd + 'Forearm', sd + 'Hand', T, L_UA, L_FA, hint, hw)
                set_world(loc, W, sd + 'UpperArm', W1); W, P = fk(i, rootp, loc); set_world(loc, W, sd + 'Forearm', W2); W, P = fk(i, rootp, loc)
                # palm flat; fingers point along the forearm's horizontal lean (least wrist extension), data heading as tie-break
                fing = W[c] @ (sg * X); fd = P[c] - P[sd + 'Forearm']
                fh = np.array([fd[0], 0, fd[2]]) * 4.0 + np.array([fing[0], 0, fing[2]]) * 0.25
                fh = n(fh) if np.linalg.norm(fh) > 1e-4 else n(np.array([fing[0], 0, fing[2]]) + 1e-6)
                palm = W[c] @ -Y
                Wh = aim(sg * X, -Y, n(fing + w * (fh - fing)), n(palm + w * (-Y - palm)))
                set_world(loc, W, c, Wh); W, P = fk(i, rootp, loc)
                if wt <= 0 and w >= 0.99: lk[0 if sd == 'left' else 1] = True
        # free hands / feet never go through the floor: lift the limb end (IK) just onto the floor
        for sd in ('left', 'right'):
            sg = 1 if sd == 'left' else -1
            for c, rb, mb, l1, l2 in ((sd + 'Hand', sd + 'UpperArm', sd + 'Forearm', L_UA, L_FA), (sd + 'Foot', sd + 'Thigh', sd + 'Shin', L_TH, L_SH)):
                for _it in range(5):
                    if 'Hand' in c:
                        fg = W[c] @ (sg * X); low = min(P[c][1], (P[c] + fg * 0.15)[1]) - 0.025
                    else:
                        sole = W[c] @ -Y; toe = W[c] @ Z; low = min((P[c] + sole * 0.035 + toe * a_)[1] for a_ in (-0.04, 0.15)) - 0.035
                    cl = 0.06 if (c == 'leftHand' and wgt('leftTop', t, TOPR) > 0) else max(clr(c, t), clr('leftTop', t) if c == 'leftHand' else 0.0)
                    if low >= cl - 0.003: break
                    T = P[c] + np.array([0, cl - low + 0.004, 0])
                    W1, W2 = two_bone(W, P, loc, rb, mb, c, T, l1, l2)
                    set_world(loc, W, rb, W1); W, P = fk(i, rootp, loc); set_world(loc, W, mb, W2); W, P = fk(i, rootp, loc)
        # arm twist budget (contact arms only): swing the elbow about the shoulder->wrist line (wrist stays put) and roll
        # the forearm about its own axis so humerus rotation, pronation and hand-vs-forearm twist stay in human range
        for sd in ('left', 'right'):
            sg = 1 if sd == 'left' else -1
            if wgt(sd + 'Hand', t) <= 0 and not (sd == 'left' and wgt('leftTop', t, TOPR) > 0) and GPREV[sd] == (0, 0): continue
            S0 = P[sd + 'UpperArm']; H0 = P[sd + 'Hand']; ax_ = n(H0 - S0); U0 = W[sd + 'UpperArm']; F0 = W[sd + 'Forearm']; Hw = W[sd + 'Hand']; T0_ = W['torso']
            def ev(b, g):
                Rb = Rot.from_rotvec(ax_ * math.radians(b)).as_matrix(); U = Rb @ U0; F = Rb @ F0
                e_ = n(U @ LP[sd + 'Forearm']); f_ = n(F @ LP[sd + 'Hand'])
                F = Rot.from_rotvec(f_ * math.radians(g)).as_matrix() @ F
                hw = humerus_twist(T0_, sg, e_, U[:, 2]); pr_ = pronation(U, F, e_, f_)
                q_ = Rot.from_matrix(F.T @ Hw).as_quat(); v_ = q_[:3] @ (sg * X); ht = (math.degrees(2 * math.atan2(v_, q_[3])) + 180) % 360 - 180
                return max(abs(hw), abs(pr_), abs(ht)), U, F
            b0, g0 = (int(v) for v in GPREV[sd]); STP = 6
            active = wgt(sd + 'Hand', t) > 0 or (sd == 'left' and wgt('leftTop', t, TOPR) > 0)
            if not active:
                b = int(b0 - math.copysign(min(abs(b0), STP), b0)); g = int(g0 - math.copysign(min(abs(g0), STP), g0))
            else:
                def cost(b, g): m, _, _ = ev(b, g); return max(0.0, m - 60) + 0.004 * (abs(b) + abs(g))
                cands = [(cost(bb, gg), bb, gg) for bb in range(b0 - STP, b0 + STP + 1, 2) for gg in range(g0 - STP, g0 + STP + 1, 2)
                         if abs(bb) <= 100 and abs(gg) <= 110]
                _, b, g = min(cands)
            GPREV[sd] = (b, g)
            if b == 0 and g == 0: continue
            _, U, F = ev(b, g)
            set_world(loc, W, sd + 'UpperArm', U); W, P = fk(i, rootp, loc); set_world(loc, W, sd + 'Forearm', F); W, P = fk(i, rootp, loc)
            set_world(loc, W, sd + 'Hand', Hw); W, P = fk(i, rootp, loc)
    LOCKS.append(lk)
    q = {b: [round(float(x), 6) for x in m2q(loc[b])] for b in JOINTS}
    out_frames.append({'p': [round(float(x), 5) for x in rootp], 'q': q, 'lock': lk})
    for b in JOINTS:
        DUMP.setdefault('P_' + b, []).append(P[b]); DUMP.setdefault('W_' + b, []).append(W[b])

if A.dump:
    np.savez_compressed(A.dump, fps=np.array(float(FPS)), **{k: np.array(v) for k, v in DUMP.items()})
if A.debug:
    np.savez_compressed(A.debug, th_raw=th_raw, th_fix=th_fix, off=off, root=ROOT)

fr = lambda f30: int(round(f30 / FPS0 * FPS))
CAM_P = [0.0, 1.85, 4.75]; CAM_T = [-0.08, 0.90, 0.0]
anim = {'cams': {'v0': {'p': CAM_P, 't': CAM_T, 'f': 30}}, 'id': 'breaking-2000',
        'name': '2000（真人视频 3D 姿态驱动：站立→折腰左手先撑→右手落轴Y字倒立→叠手纵向旋转→落地站起）r20',
        'model': 'v3', 'fps': FPS, 'count': len(out_frames), 'source': 'move_2000_r20.py (GVHMR clip01 11月19日 (5)(1).mp4, 镜像)',
        'phases': [
            {'n': '站立起势、上步（视频原样）', 'f': 0},
            {'n': '折腰下探、顺时针转身', 'f': fr(20)},
            {'n': '左手先撑地、右腿踢起', 'f': fr(42)},
            {'n': '右手落地（轴手）、Y 字分腿倒立', 'f': fr(67)},
            {'n': '左手离地叠到右手上', 'f': fr(77)},
            {'n': '叠手纵向顺时针旋转（约 3.5 圈）', 'f': fr(83)},
            {'n': '开腿下落', 'f': fr(141)},
            {'n': '双脚落地、起身', 'f': fr(160)}],
        'frames': out_frames}
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
log('frames', len(out_frames), 'T', T_END, 'mirror', MIR)
