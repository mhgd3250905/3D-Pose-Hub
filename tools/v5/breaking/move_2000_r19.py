#!/usr/bin/env python3
"""Breaking 2000 r18 = Built directly on r17's pure CW entry with two targeted upgrades:
1. Vertical axis-arm alignment: RIGHT (axis) hand lands directly underneath the right shoulder/body
   centerline (tighter hand spacing 0.36 m + explicit right-shoulder vertical alignment at TL/TS/TSH),
   so the right arm and torso share a near-vertical line and the stacked-hand transition snaps cleanly
   into a vertical spinning axis.
2. Silky, inertial right-leg lift (NO teleport!): replaces the abrupt 0.42s->0.54s right-foot jump
   with a smooth 4-keyframe diagonal clockwise arc (0.28s heel peel -> 0.38s gentle lift-off ->
   0.46s mid diagonal sweep -> 0.54s full momentum whip into Y-straddle).
"""
import sys, os, json, math, copy, argparse
os.environ.setdefault("GR", "150"); os.environ.setdefault("OUTF", "2")
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from kf import *
from armfix import ArmFix
import scipy.optimize as _so

ap = argparse.ArgumentParser()
ap.add_argument('rest'); ap.add_argument('out')
ap.add_argument('--keys', action='store_true')
ap.add_argument('--dump'); ap.add_argument('--fps', type=int, default=120)
ap.add_argument('--revs', type=float, default=4.0); ap.add_argument('--tmax', type=float, default=99)
A = ap.parse_args()

rig = Rig(A.rest); AF = ArmFix(rig, A.fps)
import kf as _kf; _kf.WRIST_SWING[0] = True; AF.prcont = True
LR = rig.l_ua + rig.l_fa

V = lambda *a: np.array(a, float)
def O(roll=0, yaw=0, pitch=0): return rz(math.radians(roll)) @ ry(math.radians(yaw)) @ rx(math.radians(pitch))
def rvd(x=0, y=0, z=0): return V(*D(x, y, z))

def ori_cw(yaw_deg, pitch_deg, roll_deg=0.0):
    """Pure world-axis CW rotation: yaw_deg <= 0 is strictly clockwise from above.
    At yaw_deg=-180, pitch_deg=180, roll_deg=0 -> EXACTLY INV_12 (chest +Z, head -Y, left -X)."""
    return ry(math.radians(yaw_deg)) @ rx(math.radians(pitch_deg)) @ rz(math.radians(roll_deg))

INV_12 = ori_cw(-180, 180, 0)

base = dict(
    th=0.0, leftLegLen=0.0, rightLegLen=0.0, leftShrug=0.0, rightShrug=0.0,
    pelvis=V(0.0, 0.90, 0.0), pelvisQ=m2q(np.eye(3)), spine=rvd(), neck=rvd(), head=rvd(),
    leftWrist=V(0.55, 0.90, 0.05), rightWrist=V(-0.55, 0.90, 0.05),
    leftElbow=V(0.2, -0.3, -1), rightElbow=V(-0.2, -0.3, -1),
    leftAnkle=V(0.32, 0.09, 0.0), rightAnkle=V(-0.32, 0.09, 0.0),
    leftKnee=V(0.3, 0, 1), rightKnee=V(-0.3, 0, 1),
    leftToe=V(0.3, 0, 1), rightToe=V(-0.3, 0, 1),
    leftSole=V(0, -1, 0), rightSole=V(0, -1, 0),
    leftFing=None, rightFing=None, leftPalm=V(0, -1, 0), rightPalm=V(0, -1, 0)
)

def key(prev, R=None, **kw):
    k = copy.deepcopy(prev)
    for a, b in kw.items():
        k[a] = np.array(b, float) if isinstance(b, (list, tuple)) else b
    if R is not None:
        k['pelvisQ'] = m2q(R)
    return k

def legdir(hip, ank, fwd):
    d = n(ank - hip); s = -n(V(*fwd)); s = n(s - d * (s @ d))
    return dict(toe=d, sole=s)

def footdir(k, sd, toe):
    t = n(V(*toe)); s_ = V(0, -1, 0) - t * (t @ V(0, -1, 0))
    s_ = n(s_) if np.linalg.norm(s_) > 0.2 else n(V(-t[0], 0.0, -t[2]) + V(0, -0.2, 0))
    k[sd + 'Toe'] = t; k[sd + 'Sole'] = s_; return k

def reach_fix(k):
    L = LR * 0.99
    for _ in range(12):
        W, P = rig.solve(k); worst = None
        for sd in ('left', 'right'):
            t = k[sd + 'Wrist']
            if t[1] < 0.20:
                d = t - P[sd + 'UpperArm']; ex = np.linalg.norm(d) - L
                if ex > 1e-4 and (worst is None or ex > worst[0]):
                    worst = (ex, d / np.linalg.norm(d))
        if worst is None: break
        k['pelvis'] = k['pelvis'] + worst[1] * worst[0]
    return k

def raw(k): return rig.solve(interp([(0, k), (1, k)], 0))
def solved(k): return rig.solve(reach_fix(interp([(0, k), (1, k)], 0)))

def armdir(k, sd, d, frac=0.96):
    _W, _P = solved(k); k[sd + 'Wrist'] = _P[sd + 'UpperArm'] + n(V(*d)) * frac * LR; return k

def armbody(k, sd, d, frac=0.97):
    _W, _P = solved(k); k[sd + 'Wrist'] = _P[sd + 'UpperArm'] + (_W['torso'] @ n(V(*d))) * frac * LR; return k

def place(k, terms, reg=0.0, rot=False):
    p0 = k['pelvis'].copy(); R0_ = q2m(k['pelvisQ']); _W, _P = raw(k)
    def sh(o, sd):
        Rz_ = rz(o[3]) if rot else np.eye(3); return p0 + Rz_ @ (_P[sd + 'UpperArm'] - p0) + o[:3]
    def res(o):
        r = []
        for t in terms:
            S = sh(o, t[1])
            if t[0] == 'arm': r.append((np.linalg.norm(S - t[2]) - t[3] * LR) / 0.01)
            elif t[0] == 'x': r.append((S[0] - t[2]) / 0.015)
            elif t[0] == 'z': r.append((S[2] - t[2]) / 0.02)
            elif t[0] == 'lean': r.extend(list((S - (t[2] + n(V(t[3][0], 1.0, t[3][1])) * t[4] * LR)) / 0.01))
        r.extend(list(o[:3] * reg)); r.append(o[3] * 57.3 / 8.0); return np.array(r)
    o = _so.least_squares(res, np.zeros(4)).x; k['pelvis'] = p0 + o[:3]
    if rot: k['pelvisQ'] = m2q(rz(o[3]) @ R0_)
    return k

def leg_local(k, sd, flex_deg, abd_deg, L=0.80):
    _W, _P = raw(k); hp = _P[sd + 'Thigh']; sg = 1.0 if sd == 'left' else -1.0
    fl = math.radians(flex_deg); ab = math.radians(abd_deg)
    dl = V(sg * math.sin(ab), -math.cos(ab) * math.cos(fl), math.cos(ab) * math.sin(fl))
    dw = n(_W['pelvis'] @ dl)
    k[sd + 'Ankle'] = hp + dw * L
    fwd = n(_W['pelvis'] @ Z)
    lg = legdir(hp, k[sd + 'Ankle'], fwd)
    k[sd + 'Toe'] = lg['toe']; k[sd + 'Sole'] = lg['sole']
    k[sd + 'Knee'] = fwd; k[sd + 'LegLen'] = 1.0
    return k

# Tighter centered hand spacing (0.36 m) so RIGHT axis arm lands nearly VERTICAL under the torso!
PL_R = V(0.0, 0.045, 0.015)       # axis hand (right) at spin origin
PL_L = V(-0.36, 0.045, 0.05)      # first hand (left) closer to center for vertical transfer
FING_L = n(V(-0.75, 0.0, 0.66))

# ---- r19 ENTRY (only 0-0.46 s changed vs r18): upright T stance -> pike fold (hips high, head low), LEFT hand reaches down
# and plants flat near the RIGHT foot's starting spot (PL_L) by 0.35 s; left leg is the support leg; RIGHT leg straight,
# sweeps clockwise up and back in an arc (pose at 0.35 s follows Kaige's Pose Studio key k1 = frame 42).
K1_Q = {"pelvis": [0.7042, -0.308, 0.1624, 0.6187], "spineLower": [0.0567, -0.0407, 0, 0.9976], "neck": [-0.0842, 0.0561, 0, 0.9949],
        "rightUpperArm": [-0.261, -0.0957, -0.1029, 0.9551], "rightForearm": [-0.3845, 0.1465, 0.1062, 0.9052],
        "rightThigh": [-0.4181, 0.1124, -0.2932, 0.8524], "rightShin": [0.0169, 0, 0.0005, 0.9999], "rightFoot": [0.0138, -0.0601, 0.068, 0.9958]}
K1_P = rig.LP['pelvis'] + V(-0.1677, -0.0279, 0.0055)
def _logm(R):
    q = m2q(R); q = q if q[3] >= 0 else -q; s = np.linalg.norm(q[:3])
    return V(0, 0, 0) if s < 1e-9 else q[:3] / s * 2 * math.atan2(s, q[3])
def _k1fk():
    Wk = {'pelvis': q2m(np.array(K1_Q['pelvis']))}; Pk = {'pelvis': K1_P}
    for b in JOINTS[1:]:
        pa = PAR[b]; Pk[b] = Pk[pa] + Wk[pa] @ rig.LP[b]
        qq = K1_Q.get('spineLower') if b in ('spineUpper', 'torso') else K1_Q.get(b)
        Wk[b] = Wk[pa] @ (q2m(np.array(qq)) if qq is not None else np.eye(3))
    return Wk, Pk
WK1, PK1 = _k1fk()
R_K1 = WK1['pelvis']
K1_LEG_R = R_K1.T @ n(PK1['rightFoot'] - PK1['rightThigh'])        # right leg direction in pelvis frame (nearly straight)
K1_TOE_R = R_K1.T @ (WK1['rightFoot'] @ Z); K1_SOLE_R = R_K1.T @ (WK1['rightFoot'] @ -Y)
K1_KNEE_R = R_K1.T @ (WK1['rightThigh'] @ Z)
K1_ARM_R = WK1['torso'].T @ (PK1['rightHand'] - PK1['rightUpperArm']); K1_EL_R = WK1['torso'].T @ (PK1['rightForearm'] - PK1['rightUpperArm'])
R19_RY46 = float(os.environ.get('R19_RY46', '0.52'))
R19_B46 = float(os.environ.get('R19_B46', '0.5')); R19_LLAND = int(os.environ.get('R19_LLAND', '1'))
R19_LLEG = float(os.environ.get('R19_LLEG', '0.822')); R19_PW = float(os.environ.get('R19_PW', '0.02'))
R19_RY27 = float(os.environ.get('R19_RY27', '0.22')); R19_PY46 = float(os.environ.get('R19_PY46', '0.72'))
K1_HEAD_Y = (PK1['head'] + WK1['head'] @ Y * 0.10)[1]

F_RIGHT_3 = V(-0.44, 0.09, -0.04)
F_LEFT_9  = V(0.36, 0.09, -0.04)
TP, TPO, TL, TS, TSH, T_LIFT, TST = 0.56, 0.88, 1.08, 1.24, 1.36, 1.44, 1.68
T_TOUCH = 0.35   # left palm flat on the floor (frame 42 @120 fps)

K = []

# 0.00 Upright front stance (Kaige's screenshot): feet wider than shoulders, toes slightly out, arms straight out in a T
K0 = key(base, np.eye(3), pelvis=V(-0.04, 0.89, -0.04), spine=rvd(), neck=rvd(), head=rvd(),
         rightAnkle=F_RIGHT_3, leftAnkle=F_LEFT_9,
         rightToe=n(V(-0.25, 0, 1)), leftToe=n(V(0.25, 0, 1)),
         rightSole=V(0, -1, 0), leftSole=V(0, -1, 0),
         rightKnee=n(V(-0.25, 0, 1)), leftKnee=n(V(0.25, 0, 1)))
armdir(K0, 'left', (1, 0.0, 0.0), 0.97); armdir(K0, 'right', (-1, 0.0, 0.0), 0.97)
K.append((0.00, K0))

def k1_right_leg(k, L=0.824, ymin=None):
    # Kaige's right leg kept in WORLD (straight, back & up), not carried by the extra fold of the pelvis
    _W, _P = raw(k); R_ = R_K1; hp = _P['rightThigh']
    k['rightAnkle'] = hp + R_ @ K1_LEG_R * L
    if ymin is not None and k['rightAnkle'][1] < ymin: k['rightAnkle'][1] = ymin
    k['rightToe'] = R_ @ K1_TOE_R; k['rightSole'] = R_ @ K1_SOLE_R; k['rightKnee'] = R_ @ K1_KNEE_R; k['rightLegLen'] = 0.0
    return k

# 0.35 Frame 42 = Kaige's key k1 (pelvis orientation/spine/neck/right arm/right leg) with the left palm REALLY on the floor:
# the hips stay high, so the fold deepens (extra pitch solved below) until the left shoulder is within reach of PL_L,
# while the left (support) foot stays planted at its starting spot.
def _solve_k42():
    sp0 = 3 * _logm(q2m(np.array(K1_Q['spineLower']))); nk0 = _logm(q2m(np.array(K1_Q['neck'])))
    def mk(x):
        R_ = axang(V(*x[3:6]) / (np.linalg.norm(x[3:6]) + 1e-12), np.linalg.norm(x[3:6])) if np.linalg.norm(x[3:6]) > 1e-9 else np.eye(3)
        k = key(K0, R_ @ R_K1, pelvis=K1_P + x[:3], spine=sp0 + V(math.radians(x[6]), 0, 0), neck=nk0, head=rvd(),
                leftWrist=PL_L.copy(), leftFing=FING_L, leftPalm=V(0, -1, 0), leftElbow=V(0.6, 0.2, 0.7),
                leftAnkle=F_LEFT_9, leftLegLen=0.0)
        return k
    def res(x):
        k = mk(x); _W, _P = raw(k); r = []
        r.append((np.linalg.norm(_P['leftUpperArm'] - PL_L) - 0.955 * LR) / 0.006)
        r.append(max(0.0, np.linalg.norm(_P['leftThigh'] - F_LEFT_9) - R19_LLEG) / 0.004)
        r.append((_P['pelvis'][1] - K1_P[1]) / R19_PW)
        hy = (_P['head'] + _W['head'] @ Y * 0.10)[1]; r.append(max(0.0, hy - K1_HEAD_Y) / 0.03)
        r.append(max(0.0, 0.30 - hy) / 0.02)
        r.extend(list(np.degrees(x[3:6]) / 12.0)); r.append(x[6] / 15.0); r.extend(list(x[:3] / 0.25))
        return np.array(r)
    x = _so.least_squares(res, np.zeros(7)).x
    return mk(x), x
K42, _x42 = _solve_k42(); print('x42', np.round(_x42, 3), file=sys.stderr)
k1_right_leg(K42)
_W, _P = raw(K42); _S = _P['rightUpperArm']
K42['rightWrist'] = _S + _W['torso'] @ K1_ARM_R; K42['rightElbow'] = _W['torso'] @ K1_EL_R
_W, _P = raw(K42); _R42 = q2m(K42['pelvisQ'])

# 0.17 Folding starts: hips hinge, torso tips forward and turns CW, left arm swings down in FRONT of the body,
# right foot still planted (held exactly 0 -> 0.17 s, then peels off with zero start velocity)
def _slerpR(Ra, Rb, u):
    rvv = _logm(Ra.T @ Rb); return Ra @ (axang(rvv, u * np.linalg.norm(rvv)) if np.linalg.norm(rvv) > 1e-9 else np.eye(3))
KM = key(K0, _slerpR(np.eye(3), _R42, 0.40), pelvis=K0['pelvis'] + (K42['pelvis'] - K0['pelvis']) * 0.40,
         spine=K42['spine'] * 0.40, neck=K42['neck'] * 0.3)
armbody(KM, 'left', (0.45, -0.45, 0.77), 0.95); armbody(KM, 'right', (-0.98, 0.12, -0.10), 0.96)
K.append((0.17, KM))

# 0.27 Left hand closing in on the floor spot from above-front; right leg already straight, sweeping CW (back & up) in an arc
KR = key(K0, _slerpR(np.eye(3), _R42, 0.80), pelvis=K0['pelvis'] + (K42['pelvis'] - K0['pelvis']) * 0.80,
         spine=K42['spine'] * 0.85, neck=K42['neck'] * 0.8,
         leftWrist=PL_L + V(0.015, 0.17, 0.025), leftElbow=V(0.6, 0.2, 0.7))
_W, _P = raw(KR); _R_ = q2m(KR['pelvisQ'])
_d0 = n(F_RIGHT_3 - _P['rightThigh']); _d1 = _R_ @ K1_LEG_R
KR['rightAnkle'] = _P['rightThigh'] + n(_d0 * 0.55 + _d1 * 0.45) * 0.82; KR['rightAnkle'][1] = max(KR['rightAnkle'][1], R19_RY27)
KR['rightToe'] = n(K0['rightToe'] * 0.4 + _R_ @ K1_TOE_R * 0.6); KR['rightSole'] = n(K0['rightSole'] * 0.4 + _R_ @ K1_SOLE_R * 0.6)
KR['rightKnee'] = _R_ @ K1_KNEE_R; KR['rightLegLen'] = 0.0
_S = _P['rightUpperArm']; KR['rightWrist'] = _S + _W['torso'] @ n(K1_ARM_R * 0.7 + V(-1, 0.1, -0.1) * 0.3) * 0.96 * LR
KR['rightElbow'] = _W['torso'] @ K1_EL_R
K.append((0.27, KR))
K.append((T_TOUCH, K42))

# 0.46 Left palm stays planted at PL_L (held exactly from 0.35 s); right leg keeps rising along the same CW arc
K1b = key(K42, _slerpR(_R42, ori_cw(-98, 114, -18), R19_B46), spine=K42['spine'] * (1 - R19_B46) + rvd(20, -10, 0) * R19_B46, neck=K42['neck'] * (1 - R19_B46) + rvd(-14, 4, 0) * R19_B46,
          leftWrist=PL_L.copy(), leftFing=FING_L, leftPalm=V(0, -1, 0), leftElbow=V(0.6, 0.2, 0.7),
          leftAnkle=F_LEFT_9)
place(K1b, [('lean', 'left', PL_L, (0.06, 0.02), 0.975)])
K1b['pelvis'][1] = max(K1b['pelvis'][1], R19_PY46)
leg_local(K1b, 'right', flex_deg=10, abd_deg=40, L=0.82); K1b['rightLegLen'] = 0.0
_W, _P = raw(K1b); _hp = _P['rightThigh']; _tg = V(0.15, R19_RY46, -1.0)
K1b['rightAnkle'] = _hp + n(_tg - _hp) * 0.822
_lg = legdir(_hp, K1b['rightAnkle'], _W['pelvis'] @ Z); K1b['rightToe'] = _lg['toe']; K1b['rightSole'] = _lg['sole']
armbody(K1b, 'right', (-0.98, 0.10, -0.04))
K.append((0.46, K1b))

# TP (0.56s) LEFT hand plants firmly at 3 o'clock; right leg continues smooth inertial diagonal sweep (ZERO jump!)
K2 = key(K1b, ori_cw(-98, 114, -18), spine=rvd(20, -10, 0), neck=rvd(-14, 4, 0),
         leftWrist=PL_L, leftFing=FING_L, leftPalm=V(0, -1, 0),
         leftAnkle=F_LEFT_9)
place(K2, [('lean', 'left', PL_L, (0.06, 0.0), 0.98)])
leg_local(K2, 'right', flex_deg=40, abd_deg=44, L=0.80); K2['rightLegLen'] = 0.9
armbody(K2, 'right', (-0.99, 0.06, 0.0))
K.append((TP, K2))

# TP+0.16 (0.72s) Pure CW continuation (-132 deg): right leg sweeping high & wide, left leg peeling off smoothly
K2b = key(K2, ori_cw(-132, 140, -12), spine=rvd(14, -6, 0), neck=rvd(-18, 0, 0))
place(K2b, [('lean', 'left', PL_L, (0.12, 0.0), 0.98)])
leg_local(K2b, 'right', flex_deg=26, abd_deg=48, L=0.80)
leg_local(K2b, 'left',  flex_deg=12, abd_deg=40, L=0.78); K2b['leftLegLen'] = 0.0
armbody(K2b, 'right', (-0.96, 0.18, 0.0))
K.append((TP + 0.16, K2b))

# TPO (0.88s) Pure CW continuation (-160 deg): high Y-straddle, body already shifting toward the vertical right-hand axis!
K3 = key(K2b, ori_cw(-160, 162, -6), spine=rvd(6, 0, 0), neck=rvd(-20, 0, 0))
place(K3, [('lean', 'left', PL_L, (0.20, 0.0), 0.98)])
leg_local(K3, 'right', flex_deg=12, abd_deg=44, L=0.80)
leg_local(K3, 'left',  flex_deg=-4, abd_deg=40, L=0.80)
armbody(K3, 'right', (-0.94, 0.25, 0.0))
K.append((TPO, K3))

# TL (1.08s) RIGHT (axis) hand catches NEARLY VERTICAL directly under the right shoulder/torso line!
K4 = key(K3, ori_cw(-176, 176, 0), spine=rvd(2, 0, 0), neck=rvd(-22, 0, 0), head=rvd(-4, 0, 0),
         rightWrist=PL_R, rightElbow=V(0.3, 0, 1), rightPalm=V(0, -1, 0))
place(K4, [('arm', 'left', PL_L, 0.975), ('arm', 'right', PL_R, 0.980), ('x', 'right', PL_R[0] + 0.01)], reg=8.0, rot=True)
leg_local(K4, 'right', flex_deg=4, abd_deg=34, L=0.80)
leg_local(K4, 'left',  flex_deg=-4, abd_deg=34, L=0.80)
K.append((TL, K4))

# TS (1.24s) RIGHT arm DEAD-VERTICAL aligned with body axis (x_right = PL_R[0]), Y-straddle ready to snap!
K5 = key(K4, INV_12, spine=rvd(), neck=rvd(-20, 0, 0), head=rvd(-5, 0, 0))
place(K5, [('arm', 'left', PL_L, 0.980), ('arm', 'right', PL_R, 0.985), ('x', 'right', PL_R[0] + 0.005), ('z', 'right', PL_R[2])], reg=10.0)
leg_local(K5, 'right', flex_deg=2, abd_deg=26, L=0.80)
leg_local(K5, 'left',  flex_deg=-2, abd_deg=26, L=0.80)
K.append((TS, K5))

# TSH (1.36s) Body stacked vertically straight over RIGHT axis arm; minimal lateral shift needed!
K5s = key(K5, INV_12, spine=rvd(), neck=rvd(-18, 0, 0))
place(K5s, [('arm', 'left', PL_L, 0.985), ('arm', 'right', PL_R, 0.985), ('x', 'right', PL_R[0]), ('z', 'right', PL_R[2])], reg=12.0)
leg_local(K5s, 'right', flex_deg=0, abd_deg=16, L=0.80)
leg_local(K5s, 'left',  flex_deg=0, abd_deg=16, L=0.80)
K.append((TSH, K5s))

# T_LIFT+0.05 (1.49s) LEFT hand peels straight up cleanly off floor (zero floor dip)
K5l = key(K5s, INV_12, leftWrist=PL_L + V(0.0, 0.16, 0.0))
K5l['leftFing'] = n(FING_L + V(0, 0.05, 0))
_pm = V(0, -1, 0) - K5l['leftFing'] * (K5l['leftFing'] @ V(0, -1, 0))
K5l['leftPalm'] = n(_pm)
place(K5l, [('arm', 'right', PL_R, 0.985), ('x', 'right', PL_R[0] - 0.015), ('z', 'right', PL_R[2])], reg=15.0)
leg_local(K5l, 'right', flex_deg=0, abd_deg=10, L=0.80)
leg_local(K5l, 'left',  flex_deg=0, abd_deg=10, L=0.80)
K.append((T_LIFT + 0.05, K5l))

# T_LIFT+0.13 (1.57s) LEFT hand snaps to right wrist; torso already locked on vertical line!
K5b = key(K5l, INV_12, leftWrist=V(-0.20, 0.28, 0.12), leftElbow=V(-1, 0.1, 0.4), leftFing=None,
          rightAnkle=V(0.12, 1.60, 0.03), leftAnkle=V(-0.12, 1.60, -0.03),
          rightKnee=V(0.06, 0, 1), leftKnee=V(-0.06, 0, 1), leftLegLen=0.96, rightLegLen=0.96)
place(K5b, [('arm', 'right', PL_R, 0.985), ('x', 'right', PL_R[0] - 0.03)], reg=18.0)
feet = lambda k_, f_: [k_.__setitem__(sd + 'Toe', legdir(k_['pelvis'], k_[sd + 'Ankle'], f_)['toe']) or k_.__setitem__(sd + 'Sole', legdir(k_['pelvis'], k_[sd + 'Ankle'], f_)['sole']) for sd in ('left', 'right')]
feet(K5b, (0, 0, 1))
K.append((T_LIFT + 0.13, K5b))

# TST (1.68s) LEFT hand stacked cleanly on RIGHT wrist, vertical body axis, legs snapping shut!
K6 = key(K5b, INV_12, pelvis=V(0.0, 0.85, -0.045),
         leftWrist=V(-0.025, 0.155, 0.040), leftFing=V(1, 0, 0.25),
         leftElbow=V(-1, 0.05, 0.25), rightElbow=V(1, 0.05, 0.25),
         neck=rvd(-18, 0, 0), head=rvd(-5, 0, 0),
         rightAnkle=V(0.08, 1.64, 0.03), leftAnkle=V(-0.08, 1.64, -0.03),
         leftLegLen=0.99, rightLegLen=0.99)
feet(K6, (0, 0, 1))
K.append((TST, K6))

SPIN_T = key(K6, INV_12, pelvis=V(0.0, 0.84, -0.05), leftShrug=math.radians(8), rightShrug=math.radians(8),
             leftWrist=V(-0.025, 0.155, 0.040), leftFing=V(1, 0, 0.25), leftPalm=V(0, -1, 0),
             leftElbow=V(-1, 0.05, 0.25), rightElbow=V(1, 0.05, 0.25),
             neck=rvd(-18, 0, 0), head=rvd(-6, 0, 0),
             rightAnkle=V(0.065, 1.66, 0.02), leftAnkle=V(-0.065, 1.66, -0.02),
             rightKnee=V(0.05, 0, 1), leftKnee=V(-0.05, 0, 1),
             leftLegLen=1.0, rightLegLen=1.0)
feet(SPIN_T, (0, 0, 1))

SPIN = key(SPIN_T, INV_12, pelvis=V(0.0, 0.83, -0.05), leftLegLen=1.0, rightLegLen=1.0,
           rightAnkle=V(0.060, 1.66, 0.02), leftAnkle=V(-0.060, 1.66, -0.02),
           rightToe=V(0.05, 1, 0.02), leftToe=V(-0.05, 1, -0.02),
           rightSole=V(0, 0, -1), leftSole=V(0, 0, -1),
           rightKnee=V(0.06, 0, 1), leftKnee=V(-0.06, 0, 1))

for t_, k_ in K:
    for sd in ('left', 'right'):
        if k_[sd + 'Fing'] is None:
            _W, _P = rig.solve(reach_fix(interp([(0, k_), (1, k_)], 0)))
            sg_ = 1 if sd == 'left' else -1
            k_[sd + 'Fing'] = _W[sd + 'Hand'] @ (sg_ * X); k_[sd + 'Palm'] = _W[sd + 'Hand'] @ -Y

_W, _P = rig.solve(reach_fix(interp([(0, SPIN), (1, SPIN)], 0)))
_h = _P['rightHand'] - _P['rightForearm']; _h[1] = 0; FING_R = n(_h)
for k_ in (K4, K5, K5s, K5l, K5b, K6, SPIN_T, SPIN):
    k_['rightFing'] = FING_R

for k_ in (K4, K5, K5s, K5l, K5b, K6, SPIN_T, SPIN):
    k_['neck'] = k_['neck'] + V(*D(-15, 0, 0))

T_SPIN0 = 1.78; T_SPIN1 = T_SPIN0 + 1.90; T_EXT = T_SPIN0 + 0.16
K.append((T_SPIN0, SPIN_T)); K.append((T_EXT, SPIN))
K.append((T_SPIN1 + T_SPIN0 - T_EXT, SPIN)); K.append((T_SPIN1, SPIN_T))

entry = [(t, k) for t, k in K if t <= TST + 1e-6]
for t, k in reversed(entry):
    K.append((T_SPIN1 + (T_SPIN0 - t), k))
T_END = K[-1][0]

tA = TL
tB = T_SPIN1 + (T_SPIN0 - TL)

def omega(t):
    if t <= tA or t >= tB: return 0.0
    u = (t - tA) / (tB - tA)
    up = min(1, (t - tA) / 0.28); dn = min(1, (tB - t) / 0.28)
    s = lambda x: x * x * (3 - 2 * x)
    snap = 0.75 * s(min(1, max(0, (t - T_LIFT) / 0.28))) * s(min(1, max(0, (T_SPIN1 - t) / 0.28)))
    return s(up) * s(dn) * (0.45 + snap) * (1.0 - 0.22 * u)

def th_curve(fps):
    N = int(round(T_END * fps)); dt = 1 / fps
    w = np.array([omega(i * dt) for i in range(N)])
    acc = np.concatenate([[0], np.cumsum(w[:-1]) * dt])
    return -acc / acc[-1] * (2 * math.pi * A.revs) if acc[-1] > 0 else acc

def _ss(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def straighten(k):
    if k['leftLegLen'] <= 0 and k['rightLegLen'] <= 0: return k
    W, P = rig.solve(k)
    for sd in ('left', 'right'):
        w = float(k[sd + 'LegLen'])
        if w <= 0: continue
        d = k[sd + 'Ankle'] - P[sd + 'Thigh']; L = np.linalg.norm(d); L2 = w * 0.80 + (1 - w) * L
        k[sd + 'Ankle'] = P[sd + 'Thigh'] + d / L * L2
    return k

TH_LOCK = [None]
def lock_left(k, th, t):
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if te < TP - 0.02 or te > T_LIFT + 0.09: return k
    if TH_LOCK[0] is None: TH_LOCK[0] = th
    w = 1.0 if te <= T_LIFT else 1 - (te - T_LIFT) / 0.09; w = w * w * (3 - 2 * w)
    dth = (TH_LOCK[0] - th + math.pi) % (2 * math.pi) - math.pi
    Rl = ry(w * dth); k['leftWrist'] = Rl @ k['leftWrist']
    if k['leftFing'] is not None: k['leftFing'] = Rl @ k['leftFing']
    return k

RS0, RS1 = TPO - 0.06, TL
D_OUT_R = n(V(-0.94, 0.25, 0.0))
def right_swing(k, t):
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if not (RS0 < te < RS1): return k
    W, P = rig.solve(k); S = P['rightUpperArm']
    pf = (te - RS0) / (RS1 - RS0); u = _ss(pf)
    B = PL_R + V(0, 0.06, 0); d1 = n(B - S)
    def slerp(a_, b_, u_):
        om = math.acos(max(-1, min(1, a_ @ b_)))
        return a_ if om < 1e-4 else (math.sin((1 - u_) * om) * a_ + math.sin(u_ * om) * b_) / math.sin(om)
    d0 = n(W['torso'] @ D_OUT_R); d = n(slerp(d0, d1, u)); w = S + d * 0.98 * LR
    ux = _ss((pf - 0.40) / 0.42); w[0] += (PL_R[0] - w[0]) * ux; w[2] += (PL_R[2] - w[2]) * ux
    # Higher clearance before final vertical set-down -> eliminates floor rightHand dip!
    w[1] = max(w[1], PL_R[1] + 0.065 * (1 - _ss((pf - 0.85) / 0.15)))
    if pf > 0.97: w = w + (PL_R - w) * ((pf - 0.97) / 0.03)
    k['rightWrist'] = w
    u2 = _ss((pf - 0.45) / 0.40)
    if u2 > 0:
        k['rightFing'] = n((1 - u2) * k['rightFing'] + u2 * FING_R)
        k['rightPalm'] = n((1 - u2) * k['rightPalm'] + u2 * V(0, -1, 0))
    return k

t_now = [0.0]; SUPX = [np.zeros(5)]
def _apply_sup(k, wf, x):
    x = wf * x; R_ = axang(V(1, 0, 0), x[3]) @ axang(V(0, 0, 1), x[4])
    k['pelvis'] = k['pelvis'] + x[:3]; k['pelvisR'] = R_ @ k['pelvisR']; k['pelvisQ'] = m2q(k['pelvisR']); return k

HEAD_CLR = 0.12
def support(k):
    te0 = t_now[0] if t_now[0] <= T_SPIN0 else T_SPIN0 - (t_now[0] - T_SPIN1)
    wf = _ss((te0 - (TPO - 0.10)) / 0.22)
    if wf <= 0: SUPX[0] = np.zeros(5); return k
    W, P = rig.solve(k); hs = []; ha = []
    for sd in ('left', 'right'):
        t = k[sd + 'Wrist']; wp = _ss((0.095 - t[1]) / 0.045)
        if wp > 0: hs.append((wp, P[sd + 'UpperArm'], t))
        wt = 0.5 * _ss((t[1] - 0.075) / 0.02) * _ss((0.24 - t[1]) / 0.12)
        if wt > 0: ha.append((wt, P[sd + 'UpperArm'], t))
    if not hs and not ha: SUPX[0] = SUPX[0] * 0.8; return _apply_sup(k, wf, SUPX[0])
    HCt = P['head'] + W['head'] @ Y * 0.10; pc = P['pelvis']
    def cost(x):
        R_ = axang(V(1, 0, 0), x[3]) @ axang(V(0, 0, 1), x[4]); o = x[:3]
        c = (o[0] ** 2 + o[2] ** 2) / 0.03 ** 2 + 0.02 * (o[1] / 0.01) ** 2 + (math.degrees(x[3]) ** 2 + math.degrees(x[4]) ** 2) / 8.0 ** 2
        for wp, S, t in hs:
            dd = np.linalg.norm(pc + R_ @ (S - pc) + o - t)
            c += wp * (((dd - 0.990 * LR) / 0.01) ** 2 + 50 * (max(0.0, dd - 0.998 * LR) / 0.01) ** 2)
        for wa, S, t in ha:
            dd = np.linalg.norm(pc + R_ @ (S - pc) + o - t)
            c += wa * (max(0.0, 0.94 * LR - dd) / 0.01) ** 2
        hb = (pc + R_ @ (HCt - pc) + o)[1] - 0.105
        c += 5 * (max(0.0, HEAD_CLR - hb) / 0.01) ** 2
        dx = x - SUPX[0]
        c += 0.2 * ((dx[0] ** 2 + dx[1] ** 2 + dx[2] ** 2) / (0.006 * 60 / A.fps) ** 2 + (math.degrees(dx[3]) ** 2 + math.degrees(dx[4]) ** 2) / (1.5 * 60 / A.fps) ** 2)
        return c
    x = SUPX[0].copy(); e = 1e-4; I5 = np.eye(5); c0 = cost(x); lam = 1.0
    for _ in range(20):
        g = np.zeros(5); H = np.zeros((5, 5))
        for i in range(5):
            g[i] = (cost(x + I5[i] * e) - cost(x - I5[i] * e)) / (2 * e)
            for j in range(i, 5):
                H[i, j] = H[j, i] = (cost(x + (I5[i] + I5[j]) * e) - cost(x + (I5[i] - I5[j]) * e) - cost(x - (I5[i] - I5[j]) * e) + cost(x - (I5[i] + I5[j]) * e)) / (4 * e * e)
        ok = False
        for _t in range(8):
            try: step = np.linalg.solve(H + np.eye(5) * lam, g)
            except np.linalg.LinAlgError: lam *= 4; continue
            c1 = cost(x - step)
            if c1 < c0: x = x - step; c0 = c1; lam = max(1e-3, lam / 3); ok = True; break
            lam *= 4
        if not ok or np.linalg.norm(step) < 1e-6: break
    x[0:3] = np.clip(x[0:3], [-0.20, -0.05, -0.10], [0.20, 0.32, 0.10])
    x[3:] = np.clip(x[3:], -math.radians(25), math.radians(25))
    SUPX[0] = x; return _apply_sup(k, wf, x)

def arms_long(k):
    W, P = rig.solve(k)
    for sd in ('left', 'right'):
        t = k[sd + 'Wrist']; S = P[sd + 'UpperArm']; wa = _ss((t[1] - 0.08) / 0.10)
        if wa <= 0: continue
        d = t - S; dd = np.linalg.norm(d)
        if dd < 0.94 * LR:
            t2 = S + d / dd * 0.94 * LR
            t2[1] = max(t2[1], min(t[1], 0.10))
            k[sd + 'Wrist'] = t + wa * (t2 - t)
    return k

AF.land = {'right': FING_R, 'left': FING_L} if R19_LLAND else {'right': FING_R}; AF.prspeed = 1000.0; AF.prland = 90.0
AF.prtarget = {'right': 65.0}

def frame(k, th, t=0.0):
    t_now[0] = t
    k = straighten(arms_long(reach_fix(right_swing(support(reach_fix(right_swing(lock_left(k, th, t), t))), t))))
    W, P = rig.solve(k); te_ = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    AF.apply(k, W, P, planted_y={'right': 0.052, 'left': 0.068}, fixed={'right': True, 'left': False},
             contact={'right': RS0 <= te_ <= TL + 0.06, 'left': 0.15 <= te_ <= TP + 0.02})
    W, P = rig.solve(k); Ry = ry(th)
    loc = {b: (np.eye(3) if b == 'pelvis' else W[PAR[b]]).T @ W[b] for b in JOINTS}
    q = {b: [round(float(x), 6) for x in m2q(loc[b])] for b in JOINTS}
    q['pelvis'] = [round(float(x), 6) for x in m2q(Ry @ W['pelvis'])]
    if A.dump: DUMP.append(({b: Ry @ P[b] for b in P}, {b: Ry @ W[b] for b in W}))
    return {'p': [round(float(x), 5) for x in Ry @ k['pelvis']], 'q': q}, P

frames, DUMP = [], []
TH = th_curve(A.fps); NF = min(len(TH), int(A.tmax * A.fps) + 1); MID = int(round(0.5 * (T_SPIN0 + T_SPIN1) * A.fps))
order = list(range(min(NF, MID + 1))) + list(range(NF - 1, MID, -1)); byi = {}; dby = {}
for j, i in enumerate(order):
    if j == MID + 1:
        for a_ in ('prev', 'prevf', 'prevp', 'prevtw'): setattr(AF, a_, {'left': None, 'right': None})
        SUPX[0] = np.zeros(5); TH_LOCK[0] = None
    t = i / A.fps; kk = interp(K, t); fr, P = frame(kk, TH[i], t); byi[i] = fr
    if A.dump: dby[i] = DUMP.pop()
frames = [byi[i] for i in range(NF)]
if A.dump:
    DUMP = [dby[i] for i in range(NF)]
    d = {'fps': A.fps}
    for b in DUMP[0][0]: d['P_' + b] = np.array([x[0][b] for x in DUMP])
    for b in DUMP[0][1]: d['W_' + b] = np.array([x[1][b] for x in DUMP])
    np.savez_compressed(A.dump, **d)

CAM_P = [0.0, 1.85, 4.75]; CAM_T = [-0.08, 0.90, 0.0]
anim = {'cams': {'v0': {'p': CAM_P, 't': CAM_T, 'f': 30}}, 'id': 'breaking-2000',
        'name': '2000（T字站→折腰左手摸地、右腿伸直顺时针弧形扫起→右臂竖直落轴倒立→纵向4圈旋转）r19',
        'model': 'v3', 'fps': A.fps, 'count': len(frames), 'source': 'move_2000_r19.py', 'phases': [
            {'n': '面向12点宽站、两臂侧平举（T字）', 'f': 0},
            {'n': '折腰下探、右腿伸直顺时针弧形扫起', 'f': int(0.17 * A.fps)},
            {'n': '左手贴地撑在右脚起始位附近', 'f': int(T_TOUCH * A.fps)},
            {'n': '左手3点撑地、右腿斜向惯性扫起', 'f': int(TP * A.fps)},
            {'n': '身体与右手继续顺时针画弧翻上', 'f': int(TPO * A.fps)},
            {'n': '右臂竖直落轴贴近身体中轴、Y字倒立', 'f': int(TL * A.fps)},
            {'n': '左手抓右手腕快速拧成纵向旋转', 'f': int(TSH * A.fps)},
            {'n': '并腿伸直高速顺时针旋转', 'f': int(T_EXT * A.fps)},
            {'n': '减速、原路落地', 'f': int(T_SPIN1 * A.fps)}],
        'frames': frames}
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
print('frames', len(frames), 'T', T_END, file=sys.stderr)
