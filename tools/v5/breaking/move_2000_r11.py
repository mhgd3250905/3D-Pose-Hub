#!/usr/bin/env python3
"""Breaking 2000 r11 = r10 with the entry re-keyed from both reference videos + HMR2 skeleton data (see the r11 entry block below:
legs together at the plant, kick after the plant, support foot on the first-hand side, slower flip, 0.5 m hand spacing, trunk side lean,
straight-arm second hand, walk-over before the stack). r10 header: Breaking 2000 r10 = r9 re-keyed (free arm out to the side, hips driven forward over the first hand, wide split before the
drive, higher shoulder for the second-hand landing) and then MIRRORED (mirror.py): authored below on the r9 side (right hand plants
first, left = axis hand) and written out mirrored, so the final move plants the LEFT hand first and spins on the RIGHT hand.
r9 header: Breaking 2000 r9 (entry re-keyed from the reference video upload5.mp4; was r5 (r4 + anatomical arm solver): stand -> power-kick entry (wide stance wind-up, hands plant, kick up through a straddled handstand)
-> legs close + top hand grabs the axis wrist + head tucked, elbows out in a diamond -> stacked-hands spin with legs together
-> spin slows, exit = the entry in reverse, back to the start stance (seamless loop).
Reference: bboy阿求 2000s教学 (bilibili BV158411X7kX, demo 97-100 s), Coach Sambo / The Ruggeds 2000 tutorials.
Local frame: origin C = palm centre of the axis (left) hand; facing +Z at th=0, model-left +X. Usage: move_2000_r3.py <rest.json> <out.json> [--only-keys]"""
import sys, os, json, math, copy, argparse
os.environ.setdefault("GR", "150"); os.environ.setdefault("OUTF", "2")   # r7 settings baked in: right hand fingers +Z, floor fingers point out
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
from kf import *
from armfix import ArmFix
from mirror import mirror_anim, mirror_npz
ap = argparse.ArgumentParser(); ap.add_argument('rest'); ap.add_argument('out'); ap.add_argument('--keys', action='store_true', help='one frame per key (preview)')
ap.add_argument('--dump'); ap.add_argument('--fps', type=int, default=120); ap.add_argument('--revs', type=float, default=4); ap.add_argument('--tmax', type=float, default=99)
ap.add_argument('--nomirror', action='store_true', help='r10: write the authoring side (r9 side) instead of the mirrored move')
A = ap.parse_args(); rig = Rig(A.rest); AF = ArmFix(rig, A.fps)
import kf as _kf; _kf.WRIST_SWING[0] = True; AF.prcont = True   # r8: twist-free wrist + pronation continuity in the elbow choice
V = lambda *a: np.array(a, float)
def O(roll=0, yaw=0, pitch=0): return rz(math.radians(roll)) @ ry(math.radians(yaw)) @ rx(math.radians(pitch))
def rvd(x=0, y=0, z=0): return V(*D(x, y, z))
INV = O(-180, 180)   # handstand: head down, chest -Z, model-left +X
base = dict(th=0.0, leftLegLen=0.0, rightLegLen=0.0, leftShrug=0.0, rightShrug=0.0, pelvis=V(-0.55, 0.95, 0), pelvisQ=m2q(np.eye(3)), spine=rvd(), neck=rvd(), head=rvd(),
            leftWrist=V(-0.31, 0.86, 0.02), rightWrist=V(-0.79, 0.86, 0.02), leftElbow=V(0.3, 0, -1), rightElbow=V(-0.3, 0, -1),
            leftAnkle=V(-0.45, 0.09, -0.02), rightAnkle=V(-0.65, 0.09, -0.02), leftKnee=V(0, 0, 1), rightKnee=V(0, 0, 1),
            leftToe=V(0.1, 0, 1), rightToe=V(-0.1, 0, 1), leftSole=V(0, -1, 0), rightSole=V(0, -1, 0),
            leftFing=None, rightFing=None, leftPalm=V(0, -1, 0), rightPalm=V(0, -1, 0))
def key(prev, R=None, **kw):
    k = copy.deepcopy(prev)
    for a, b in kw.items(): k[a] = np.array(b, float) if isinstance(b, (list, tuple)) else b
    if R is not None: k['pelvisQ'] = m2q(R)
    return k
WR_L = V(0, 0.045, 0.05)              # axis (left) wrist: palm flat at C, fingers -Z (chest side), heel under the wrist
WR_R2 = V(-0.30, 0.045, 0.04)         # right hand's own plant (two-hand phase)
def F(up, fwd):
    """pelvis orientation from where the spine points (up = R.Y) and where the chest faces (fwd = R.Z)."""
    u = n(V(*up)); f = V(*fwd); f = n(f - u * (f @ u)); return np.stack([np.cross(u, f), u, f], 1)
def legdir(hip, ank, fwd):
    """pointed foot along the leg; sole faces the back of the leg (-fwd); knee front faces fwd."""
    d = n(ank - hip); s = -n(V(*fwd)); s = n(s - d * (s @ d)); return dict(toe=d, sole=s)
def reach_fix(k):
    """planted hands (wrist target y < 0.07) must be reachable: move the pelvis toward them until both are within 99% of arm length."""
    L = (rig.l_ua + rig.l_fa) * 0.99
    for _ in range(12):
        W, P = rig.solve(k); worst = None
        for sd in ('left', 'right'):
            t = k[sd + 'Wrist']
            if t[1] < 0.20:
                d = t - P[sd + 'UpperArm']; ex = np.linalg.norm(d) - L
                if ex > 1e-4 and (worst is None or ex > worst[0]): worst = (ex, d / np.linalg.norm(d))
        if worst is None: break
        k['pelvis'] = k['pelvis'] + worst[1] * worst[0]
    return k
K = []
def pitchF(a, twist=0.0):
    """dive orientation: facing -X, bent forward by a degrees (90 = torso horizontal, 180 = inverted), then turned by
    `twist` degrees about the spine toward the final inverted facing (chest -Z). Returns (R, up, fwd)."""
    r = math.radians(a); up = V(-math.sin(r), math.cos(r), 0); fw = V(-math.cos(r), -math.sin(r), 0)
    t = math.radians(twist)
    # turning about the spine axis by +twist maps the chest from fw toward -Z
    Rt = axang(up, t if (np.cross(fw, V(0, 0, -1)) @ up) >= 0 else -t)
    fw2 = Rt @ fw
    return F(up, fw2), up, fw2
# ---- r11 entry (authoring side = r9 side; output is mirrored). Re-keyed from the HMR2 skeleton data of both reference clips
# (clip01, clip02 = upload5) + the two videos: legs nearly together at the plant, the back leg kicks up only after the plant,
# slower flip (~150 deg/s peak), hands ~0.5 m apart, trunk turned about its spine (cartwheel side lean: planting shoulder low,
# free shoulder high, free arm straight out sideways relative to the trunk), hips driven forward over the planted hand, the
# second hand reaches straight down sideways, then the body walks over the pivot hand and the first hand travels to the stack.
# Trunk: pelvis follows ori2(yaw 90, pitch, 0, twist_pelvis); the rest of the cartwheel twist is carried by the spine (<= ~40 deg),
# so the hanging legs are not thrown into extreme ab/adduction. pitch 50 -> 180, total twist 22 -> 90 (= INV).
import scipy.optimize as _so
SX = 0.0
_e = lambda k, d: tuple(float(x) for x in os.environ.get(k, d).split(','))
TP, TPO, TL, TS, TSH, T_LIFT, TST = _e('TIMES', '0.72,1.04,1.19,1.33,1.40,1.44,1.66')   # plant, push-off, 2nd hand, straddle, shift, lift, stacked
PL_R = V(-0.50, 0.045, 0.05)       # first (right) hand plant: 0.5 m from the axis hand (refs 0.54-0.57 m)
PL_L = V(0.0, 0.045, 0.02)         # axis (left) hand = spin centre
FING_R = n(V(*_e('FINGR', '-0.45,0,1')))   # planted right hand: fingers out (+Z = the right side while facing the line), a little back
LR = (rig.l_ua + rig.l_fa)
def solved(k):
    return rig.solve(reach_fix(interp([(0, k), (1, k)], 0)))
def raw(k): return rig.solve(interp([(0, k), (1, k)], 0))
def ori(yaw, pitch, side=0.0):
    a = math.radians(pitch); up = V(0, math.cos(a), math.sin(a)); fw = V(0, -math.sin(a), math.cos(a))
    up = axang(fw, -math.radians(side)) @ up
    return ry(math.radians(yaw)) @ F(up, fw)
TW_SIGN = 1.0
def ori2(yaw, pitch, side=0.0, twist=0.0):
    """ori() plus a turn about the spine by `twist` deg (+ = left shoulder up)."""
    Rr = ori(yaw, pitch, side); up = Rr @ Y
    return axang(up, math.radians(TW_SIGN * twist)) @ Rr
def armdir(k, sd, d, frac=0.985):
    _W, _P = solved(k); k[sd + 'Wrist'] = _P[sd + 'UpperArm'] + n(V(*d)) * frac * LR; return k
def armbody(k, sd, d, frac=0.985):
    """free arm straight, direction given in the TORSO frame (X model-left, Y toward the head, Z chest)."""
    _W, _P = solved(k); k[sd + 'Wrist'] = _P[sd + 'UpperArm'] + (_W['torso'] @ n(V(*d))) * frac * LR; return k
def trunk(k, pitch, tw, twp, bend=0.0, flex=0.0):
    """pelvis = ori2(90, pitch, 0, twp); spine carries the remaining twist (tw - twp), a forward flexion and a side bend."""
    k['pelvisQ'] = m2q(ori2(90, pitch - flex, 0, twp)); k['spine'] = rvd(flex, tw - twp, bend); return k   # the pelvis lags the torso by the lumbar flexion (keeps hip flexion <= ~125)
def leg_world(k, sd, a, z=0.0, L=0.80):
    """leg straight from the hip at angle `a` deg from straight down, swung backward (-X) and up (a=180: straight up); pointed foot."""
    _W, _P = raw(k); hp = _P[sd + 'Thigh']; ra = math.radians(a); d = n(V(-math.sin(ra), -math.cos(ra), z))
    k[sd + 'Ankle'] = hp + d * L; fw = V(-math.cos(ra), math.sin(ra), 0)   # knee/shin front: perpendicular to the leg, toward +X side of the swing
    lg = legdir(hp, k[sd + 'Ankle'], fw); k[sd + 'Toe'] = lg['toe']; k[sd + 'Sole'] = lg['sole']
    k[sd + 'Knee'] = n(_W['pelvis'] @ Z); k[sd + 'LegLen'] = 1.0
    return k
def footdir(k, sd, toe):
    t = n(V(*toe)); s_ = V(0, -1, 0) - t * (t @ V(0, -1, 0))
    s_ = n(s_) if np.linalg.norm(s_) > 0.2 else n(V(-t[0], 0.0, -t[2]) + V(0, -0.2, 0))
    k[sd + 'Toe'] = t; k[sd + 'Sole'] = s_; return k
def place(k, terms, reg=0.0, rot=False):
    """move the pelvis (x, y, z) [and, rot=True, tilt the whole body about world z through the pelvis] to satisfy shoulder terms:
    ('arm', sd, hand, frac) = shoulder at frac*L from hand; ('x', sd, value) = shoulder x;
    ('lean', sd, hand, (lx, lz), frac) = shoulder at hand + n(lx,1,lz)*frac*L."""
    p0 = k['pelvis'].copy(); R0_ = q2m(k['pelvisQ']); _W, _P = raw(k)
    def sh(o, sd):
        Rz_ = rz(o[3]) if rot else np.eye(3); return p0 + Rz_ @ (_P[sd + 'UpperArm'] - p0) + o[:3]
    def res(o):
        r = []
        for t in terms:
            S = sh(o, t[1])
            if t[0] == 'arm': r.append((np.linalg.norm(S - t[2]) - t[3] * LR) / 0.01)
            elif t[0] == 'x': r.append((S[0] - t[2]) / 0.02)
            elif t[0] == 'lean': r.extend(list((S - (t[2] + n(V(t[3][0], 1.0, t[3][1])) * t[4] * LR)) / 0.01))
        r.extend(list(o[:3] * reg)); r.append(o[3] * 57.3 / 8.0); return np.array(r)
    o = _so.least_squares(res, np.zeros(4)).x; k['pelvis'] = p0 + o[:3]
    if rot: k['pelvisQ'] = m2q(rz(o[3]) @ R0_)
    if os.environ.get('DBGP'): print('PLACE', [t[:2] for t in terms], 'o', o.round(3), 'res', res(o)[:len(terms) + 2].round(2), 'shL', sh(o, 'left').round(3), 'shR', sh(o, 'right').round(3), 'pel', k['pelvis'].round(3), file=sys.stderr)
    return k
def level(k, target=0.0):
    """side-bend the spine so that (left shoulder y - right shoulder y) = target."""
    def f(b):
        k2 = dict(k); k2['spine'] = V(k['spine'][0], k['spine'][1], math.radians(b)); _W, _P = raw(k2)
        return (_P['leftUpperArm'][1] - _P['rightUpperArm'][1] - target) ** 2
    b = _so.minimize_scalar(f, bounds=(-40, 40), method='bounded').x; k['spine'] = V(k['spine'][0], k['spine'][1], math.radians(b)); return b
PT = _e('PT', '76,104,128,134,140,148,118,166')    # trunk pitch at K1, K1b, plant, TP+0.12, TP+0.24, push-off, 2nd hand, straddle
TWS = _e('TWS', '25,46,58,64,70,78,88,90')        # total cartwheel twist at the same keys
TWP = _e('TWP', '10,14,16,20,24,30,66,90')
FLX = _e('FLX', '14,32,45,44,40,32,0,0')           # lumbar (spine) forward flexion carried at the same keys         # part of it in the pelvis
LEAN = _e('LEAN', '-0.12,-0.05,0.03,0.08')        # planting arm lean (world x) at plant, +0.12, +0.24, push-off: the shoulder travels over the hand
KICK = _e('KICK', '55,78,105,140,165')            # kick (right) leg angle from straight down at TP+0.12, +0.24, push-off, 2nd hand, straddle
SUPL = _e('SUPL', '50,60,110')                    # support (left) leg angle after push-off: push-off, 2nd hand, straddle
LSHT = _e('LSHT', '0.03')[0]
LV = _e('LV', '0.30,0.22,0.12')   # free (left) shoulder height above the planting one at TP+0.12, +0.24, push-off: it comes down steadily (refs 0.27 -> 0.11 -> 0.05 m)                      # 2nd hand landing: left shoulder this much higher than the right (support levels the rest)
LEAN4 = _e('LEAN4', '0.10')[0]   # 2nd hand landing: right shoulder this far past the first hand (x)
FB0, FB1 = _e('FB', '0.45,0.85'); UX = _e('UX', '0.45,0.40'); HOV = _e('HOV', '0.03')[0]; SUPW = os.environ.get('SUPW', '0') == '1'
SUPLS = os.environ.get('SUPLS', '0') == '1'
SHTX = _e('SHTX', '-0.10')[0]   # second (axis) hand landing: its shoulder sits this far inside the plant along x
# r11 leg roles (both HMR2 clips agree): the SUPPORT foot is on the first-hand side (right), the KICK leg is the other one (left):
# the right foot steps forward across the left while turning to the line, the right hand plants ahead of it, the left leg kicks up
# over the top (on its own, upper side of the turned body), the right foot drives off and trails on the right/low side.
FS0 = V(-1.62, 0.09, 0.06); FS = V(-1.02, 0.09, 0.09)   # support foot a bit outside the planting arm (knee passes outside it)    # right (support) foot: start; after the step (front foot)
FK = V(-1.20, 0.09, -0.06)                                # left (kick) foot: stays (pivots), ends just behind the front foot
# 0.00 stand facing the camera (+Z), slight forward lean, arms spread sideways
R0 = ori(0, 10)
K0 = key(base, R0, pelvis=V(-1.38, 0.92, 0.0), spine=rvd(6, 0, 0), neck=rvd(-4, 0, 0),
         leftAnkle=FK, rightAnkle=FS0, leftToe=n(V(0.35, 0, 1)), rightToe=n(V(-0.35, 0, 1)), leftSole=V(0, -1, 0), rightSole=V(0, -1, 0),
         leftKnee=n(V(0.3, 0, 1)), rightKnee=n(V(-0.3, 0, 1)), leftElbow=V(0, -0.4, -1), rightElbow=V(0, -0.4, -1), leftLegLen=0.0, rightLegLen=0.0)
armdir(K0, 'left', (0.95, 0.12, 0.08)); armdir(K0, 'right', (-0.80, -0.55, 0.12))
K.append((0.00, K0)); K.append((0.10, K0))
# 0.20 weight onto the left foot, turning; right heel peels (foot lifts up first: no skid)
R0a = ori(25, 18)
K0a = key(K0, R0a, pelvis=V(-1.32, 0.91, 0.0), spine=rvd(8, 0, 0), rightAnkle=FS0 + V(0.04, 0.11, 0.0), rightKnee=n(V(0.4, 0, 1)))
footdir(K0a, 'right', (0.3, -0.3, 0.9)); armbody(K0a, 'left', (0.92, 0.36, 0.06)); armdir(K0a, 'right', (-0.2, -0.95, 0.25))
K.append((0.20, K0a))
# 0.32 facing the line, right foot swinging forward past the left (in the air), trunk starts to hinge
R0b = ori(70, 36)
K0b = key(K0a, R0b, pelvis=V(-1.20, 0.88, 0.01), spine=rvd(10, 0, 0), neck=rvd(-6, 0, 0),
          leftToe=n(V(0.9, 0, 0.4)), leftKnee=n(V(0.9, 0.2, 0.4)), rightAnkle=V(-1.16, 0.20, 0.09), rightKnee=n(V(1, 0.3, 0.2)))
footdir(K0b, 'right', (0.9, -0.3, 0.2)); armbody(K0b, 'left', (0.92, 0.36, 0.06)); armdir(K0b, 'right', (0.40, -0.88, 0.25))
K.append((0.32, K0b))
# 0.40 right foot just above its spot ahead of the left (sets down from above)
K0c = key(K0b, None, rightAnkle=FS + V(0, 0.05, 0), rightKnee=n(V(1, 0.3, 0.1))); footdir(K0c, 'right', (1, -0.12, 0.05))
K.append((0.40, K0c))
# 0.48 facing the line (+X), right foot down ahead, left foot just behind (legs nearly together), hinge, right arm reaching forward-down
K1 = key(K0c, None, pelvis=V(-1.10, 0.84, 0.0), neck=rvd(-8, 0, 0),
         rightAnkle=FS, rightToe=n(V(1, 0, 0.25)), rightSole=V(0, -1, 0), rightKnee=n(V(0.7, 0.2, 0.7)),
         leftAnkle=FK, leftToe=n(V(1, 0, -0.2)), leftSole=V(0, -1, 0), leftKnee=n(V(1, 0.2, -0.2)))
trunk(K1, PT[0], TWS[0], TWP[0], flex=FLX[0]); armbody(K1, 'left', (0.94, 0.30, 0.06)); armdir(K1, 'right', (0.55, -0.83, 0.05))
K.append((0.48, K1))
for ch in ('pelvis', 'spine', 'neck', 'leftWrist', 'rightWrist'): K0c[ch] = 0.5 * (K0b[ch] + K1[ch])   # no hold-then-rush in the hinge
_q = K0b['pelvisQ'] + (K1['pelvisQ'] if K0b['pelvisQ'] @ K1['pelvisQ'] >= 0 else -K1['pelvisQ']); K0c['pelvisQ'] = _q / np.linalg.norm(_q)
# 0.62 deep hinge, trunk turned (right shoulder down, left up), right hand just above its spot, left arm straight out sideways
K1b = key(K1, None, neck=rvd(-6, 0, 0), rightWrist=PL_R + V(0.0, 0.08, 0.0), rightFing=FING_R, rightPalm=V(0, -1, 0), rightElbow=V(-1, 0, 0))
trunk(K1b, PT[1], TWS[1], TWP[1], flex=FLX[1]); place(K1b, [('lean', 'right', PL_R + V(0, 0.08, 0), (LEAN[0] - 0.04, 0.0), 0.975)])
armbody(K1b, 'left', (0.99, 0.05, 0.04))
K.append((0.62, K1b))
# TP right hand planted; legs still nearly together (both feet down), hips well behind the hand
K2 = key(K1b, None, neck=rvd(-10, 0, 0), rightWrist=PL_R)
trunk(K2, PT[2], TWS[2], TWP[2], flex=FLX[2]); place(K2, [('lean', 'right', PL_R, (LEAN[0], 0.0), 0.975)]); armbody(K2, 'left', (0.99, -0.05, 0.0))
K.append((TP, K2))
# TP+0.06 left (kick) foot peels: knee bends, foot rises behind (no skid)
K2k = key(K2, None, leftLegLen=0.0, leftKnee=n(V(1, -0.3, 0)))
footdir(K2k, 'left', (0.45, -0.88, 0.0)); K2k['leftAnkle'] = FK + V(0, -0.035, 0) + n(K1['leftToe']) * 0.15 - K2k['leftSole'] * 0.035 - K2k['leftToe'] * 0.15   # heel up about the toe tip K.append((TP + 0.05, K2k))   # heel up first, toe last
TIP_S = FS + V(0, -1, 0) * 0.035 + n(K1['rightToe']) * 0.15
TIP_K = FK + V(0, -1, 0) * 0.035 + n(K1['leftToe']) * 0.15
# TP+0.12 the left leg swings up behind; hips moving forward over the hand
K2b = key(K2k, None, neck=rvd(-12, 0, 0))
trunk(K2b, PT[3], TWS[3], TWP[3], flex=FLX[3]); level(K2b, LV[0]); place(K2b, [('lean', 'right', PL_R, (LEAN[1], 0.0), 0.975)]); leg_world(K2b, 'left', KICK[0], -0.06); K2b['leftLegLen'] = 0.0   # no straighten() pull toward the floor while the foot peels
armbody(K2b, 'left', (0.99, -0.02, 0.0))
K.append((TP + 0.12, K2b))
for ch in ('pelvis', 'spine', 'neck', 'leftWrist'): K2k[ch] = 0.5 * (K2[ch] + K2b[ch])
_q = K2['pelvisQ'] + (K2b['pelvisQ'] if K2['pelvisQ'] @ K2b['pelvisQ'] >= 0 else -K2b['pelvisQ']); K2k['pelvisQ'] = _q / np.linalg.norm(_q)
# TP+0.24 hips over the hand, kick leg high behind, front heel up
K3 = key(K2b, None, neck=rvd(-16, 0, 0))
_t0 = n(K1['rightToe']); _to = n(_t0 + V(0, -1, 0)); _so_ = n(V(0, -1, 0) - _t0)
for _k in (K2k, K2b, K3): _k['rightAnkle'] = TIP_S - _so_ * 0.035 - _to * 0.15; _k['rightToe'] = _to; _k['rightSole'] = _so_   # keyed path = toe-pivot path (no spline dip at the fade-out)
trunk(K3, PT[4], TWS[4], TWP[4], flex=FLX[4]); level(K3, LV[1]); place(K3, [('lean', 'right', PL_R, (LEAN[2], 0.0), 0.975)]); leg_world(K3, 'left', KICK[1], -0.06)
armbody(K3, 'left', (0.98, 0.10, 0.0))
K.append((TP + 0.24, K3))
# TPO front (right) foot drives off through the toe; legs open ~95 deg; free arm still straight out sideways
K3b = key(K3, None, neck=rvd(-20, 0, 0))
trunk(K3b, PT[5], TWS[5], TWP[5], flex=FLX[5]); level(K3b, LV[2]); place(K3b, [('lean', 'right', PL_R, (LEAN[3], 0.0), 0.975)])
leg_world(K3b, 'left', KICK[2], -0.06); leg_world(K3b, 'right', SUPL[0], 0.06); K3b['rightLegLen'] = 0.0; armbody(K3b, 'left', (0.96, 0.25, 0.0))
K.append((TPO, K3b))
# TL left hand down on its spot: shoulders nearly level (side bend), both arms long; kick leg over the top, support leg trailing low on its side
K4 = key(K3b, None, neck=rvd(-26, 0, 0), head=rvd(-5, 0, 0), leftWrist=PL_L, leftElbow=V(0.3, 0, 1), leftPalm=V(0, -1, 0))
trunk(K4, PT[6], TWS[6], TWP[6], flex=FLX[6]); LB4 = level(K4, LSHT)
place(K4, [('lean', 'right', PL_R, (LEAN4, 0.0), 0.975), ('arm', 'left', PL_L, 0.975)], reg=20.0, rot=True)
leg_world(K4, 'left', KICK[3], -0.06); leg_world(K4, 'right', SUPL[1], 0.06)
K.append((TL, K4))
# TS straddle handstand on both hands (0.5 m apart)
K5 = key(K4, None, neck=rvd(-24, 0, 0), head=rvd(-5, 0, 0))
trunk(K5, PT[7], TWS[7], TWP[7], flex=FLX[7]); level(K5, 0.0)
place(K5, [('arm', 'right', PL_R, 0.975), ('arm', 'left', PL_L, 0.975), ('x', 'left', PL_L[0] - 0.07)], reg=20.0, rot=True)
leg_world(K5, 'left', KICK[4], -0.08); leg_world(K5, 'right', SUPL[2], 0.08)
K.append((TS, K5))
# TSH weight walked over the pivot (left) hand: shoulders shift toward it, right hand still down; legs closing up
K5s = key(K5, INV, spine=rvd(), neck=rvd(-22, 0, 0))
place(K5s, [('arm', 'right', PL_R, 0.985), ('arm', 'left', PL_L, 0.975), ('x', 'left', PL_L[0] - 0.03)], reg=20.0)
leg_world(K5s, 'left', 192, -0.10); leg_world(K5s, 'right', 168, 0.10)
K.append((TSH, K5s))
# right hand peels straight up first (no skid), then travels to the stack in front of the face; knees bending (tuck)
K5l = key(K5s, INV, rightWrist=PL_R + V(0.01, 0.09, -0.01))
K5l['rightFing'] = n(FING_R + V(0, -0.7, 0)); _pm = V(0, -1, 0) - K5l['rightFing'] * (K5l['rightFing'] @ V(0, -1, 0)); K5l['rightPalm'] = n(_pm)   # heel peels first, fingers last (wrist flexes, not over-extends)
place(K5l, [('arm', 'left', PL_L, 0.975), ('x', 'left', PL_L[0] - 0.01)], reg=20.0)
K.append((T_LIFT + 0.05, K5l))
K5b = key(K5l, INV, rightWrist=V(-0.24, 0.24, -0.06), rightElbow=V(-1, 0.2, 0.4), rightFing=None,
          leftAnkle=V(0.04, 1.40, 0.30), rightAnkle=V(-0.20, 1.40, 0.30), leftKnee=V(0, 0, -1), rightKnee=V(0, 0, -1), leftLegLen=0.0, rightLegLen=0.0)
place(K5b, [('arm', 'left', PL_L, 0.975), ('x', 'left', PL_L[0] + 0.0)], reg=20.0)
feet = lambda k_, f_: [k_.__setitem__(sd + 'Toe', legdir(k_['pelvis'], k_[sd + 'Ankle'], f_)['toe']) or k_.__setitem__(sd + 'Sole', legdir(k_['pelvis'], k_[sd + 'Ankle'], f_)['sole']) for sd in ('left', 'right')]
feet(K5b, (0, 0, -1))
K.append((T_LIFT + 0.13, K5b))
# TST right hand on the left wrist, elbows out, legs tucked together
K6 = key(K5b, INV, pelvis=V(-0.02, 0.88, 0.05), rightWrist=V(0.0, 0.11, 0.035), rightFing=V(1, 0, -0.25), rightElbow=V(-1, 0, 0.1),
         leftElbow=V(1, 0, 0.1), neck=rvd(-18, 0, 0), head=rvd(-5, 0, 0),
         leftAnkle=V(0.06, 1.30, 0.36), rightAnkle=V(-0.06, 1.30, 0.36))
feet(K6, (0, 0, -1))
K.append((TST, K6))
SPIN_T = key(K6, INV, pelvis=V(0.0, 0.85, 0.06), leftShrug=math.radians(8), rightShrug=math.radians(8),
             rightWrist=V(0.0, 0.11, 0.035), rightFing=V(1, 0, -0.25), rightPalm=V(0, -1, 0), leftElbow=V(1, 0, 0.05), rightElbow=V(-1, 0, 0.05),
             neck=rvd(-18, 0, 0), head=rvd(-6, 0, 0),
             leftAnkle=V(0.05, 1.32, 0.34), rightAnkle=V(-0.05, 1.32, 0.34), leftKnee=V(0.05, 0, -1), rightKnee=V(-0.05, 0, -1))
feet(SPIN_T, (0, 0, -1))
SPIN = key(SPIN_T, INV, pelvis=V(0.0, 0.83, 0.06), leftLegLen=1.0, rightLegLen=1.0,
           leftAnkle=V(0.035, 1.66, 0.035), rightAnkle=V(-0.035, 1.66, -0.035), leftToe=V(0.05, 1, 0.05), rightToe=V(-0.05, 1, -0.05),
           leftSole=V(0, 0, 1), rightSole=V(0, 0, 1), leftKnee=V(0.05, 0, -1), rightKnee=V(-0.05, 0, -1))
print('KEYS', [(t, k_['pelvis'].round(3).tolist()) for t, k_ in K], 'LB4', round(LB4, 1), file=sys.stderr)
# hands with no explicit finger direction: relaxed (in line with the forearm), written into the key so blends never pop
for t_, k_ in K:
    for sd in ('left', 'right'):
        if k_[sd + 'Fing'] is None:
            _W, _P = rig.solve(reach_fix(interp([(0, k_), (1, k_)], 0))); sg_ = 1 if sd == 'left' else -1
            k_[sd + 'Fing'] = _W[sd + 'Hand'] @ (sg_ * X); k_[sd + 'Palm'] = _W[sd + 'Hand'] @ -Y
# axis-hand fingers point away from the elbow (keeps wrist extension under 90 deg); the same direction from the moment it lands
_W, _P = rig.solve(reach_fix(interp([(0, SPIN), (1, SPIN)], 0)))
_h = _P['leftHand'] - _P['leftForearm']; _h[1] = 0; FING_L = n(_h)
for k_ in (K4, K5, K5s, K5l, K5b, K6, SPIN_T, SPIN): k_['leftFing'] = FING_L
print('FING_L', FING_L.round(3), file=sys.stderr)
NK = float(os.environ.get('NK', '-15'))   # r8: extra neck flexion (deg) once inverted, tucks the head up between the arms
if NK:
    for k_ in (K4, K5, K5s, K5l, K5b, K6, SPIN_T, SPIN): k_['neck'] = k_['neck'] + V(*D(NK, 0, 0))
T_SPIN0 = 1.80; T_SPIN1 = T_SPIN0 + 1.90; T_EXT = T_SPIN0 + 0.40
K.append((T_SPIN0, SPIN_T)); K.append((T_EXT, SPIN))   # r9: legs tucked into the spin, then extended (video 1.3-1.7 s)
# spin body: identical pose, th driven by an angular-speed curve below (keys only carry the pose)
K.append((T_SPIN1 + T_SPIN0 - T_EXT, SPIN)); K.append((T_SPIN1, SPIN_T))
# exit = entry reversed in time (same local poses), back to the start stance
entry = [(t, k) for t, k in K if t <= TST + 1e-6]
T_END = T_SPIN1 + (T_SPIN0 - 0.0) + 0.0
for t, k in reversed(entry): K.append((T_SPIN1 + (T_SPIN0 - t), k))
T_END = K[-1][0]
# th(t): 0 before K5; accelerates on the kick, ~2 rev/s at the stack, slows to ~1.3 rev/s, stops at the reversed K5; total = revs turns
ts = [k[0] for k in K]; tA = T_LIFT - 0.06;   # r9: the spin starts as the axis hand lands (the entry twist before that is in the keys)
tB = T_SPIN1 + (T_SPIN0 - (T_LIFT - 0.06))
def omega(t):
    if t <= tA or t >= tB: return 0.0
    u = (t - tA) / (tB - tA)
    up = min(1, (t - tA) / 0.30); dn = min(1, (tB - t) / 0.30)
    s = lambda x: x * x * (3 - 2 * x)
    return s(up) * s(dn) * (1.0 - 0.38 * u)
def th_curve(fps):
    N = int(round(T_END * fps)); dt = 1 / fps; w = np.array([omega(i * dt) for i in range(N)]); acc = np.concatenate([[0], np.cumsum(w[:-1]) * dt])
    return -acc / acc[-1] * (2 * math.pi * A.revs) if acc[-1] > 0 else acc   # r9: spins in the direction the entry twist turns (th decreasing)
def straighten(k):
    """legs with a LegLen weight w>0: put the ankle at w*0.80 m + (1-w)*current distance from the hip, same direction (keeps kicked/inverted legs straight)."""
    if k['leftLegLen'] <= 0 and k['rightLegLen'] <= 0: return k
    W, P = rig.solve(k)
    for sd in ('left', 'right'):
        w = float(k[sd + 'LegLen'])
        if w <= 0: continue
        d = k[sd + 'Ankle'] - P[sd + 'Thigh']; L = np.linalg.norm(d); L2 = w * 0.80 + (1 - w) * L
        k[sd + 'Ankle'] = P[sd + 'Thigh'] + d / L * L2
    return k
def toe_pivot(k, t):
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)     # exit replays the entry backwards
    if TP <= te <= TPO:   # r9: the front (left, support) heel rises over the fixed toe 0.58-0.72, the toe leaves 0.72-0.80
        w = 1.0 if te <= TPO - 0.08 else 1 - (te - (TPO - 0.08)) / 0.08; w = w * w * (3 - 2 * w)
        h = _ss((te - TP) / (TPO - 0.08 - TP)); t0 = n(K1['rightToe']); toe = n(t0 + V(0, -1.0, 0) * h); sole = n(V(0, -1, 0) - t0 * h)
        k['rightToe'] = w * toe + (1 - w) * k['rightToe']; k['rightSole'] = w * sole + (1 - w) * k['rightSole']
        k['rightAnkle'] = w * (TIP_S - sole * 0.035 - toe * 0.15) + (1 - w) * k['rightAnkle']   # r11: support foot = right (first-hand side)
    return k
def kick_peel(k, t):
    """r11: the kick (left) foot peels heel-first about its fixed toe tip (TP .. TP+0.05), then hands over to the keys (fade by TP+0.09)."""
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if not (TP <= te <= TP + 0.09): return k
    w = 1.0 if te <= TP + 0.05 else 1 - (te - TP - 0.05) / 0.04; w = w * w * (3 - 2 * w)
    h = _ss((te - TP) / 0.05); t0 = n(K1['leftToe']); t1 = K2k['leftToe']; toe = n((1 - h) * t0 + h * t1)
    sole = V(0, -1, 0) - toe * (toe @ V(0, -1, 0)); sole = n(sole)
    k['leftToe'] = w * toe + (1 - w) * k['leftToe']; k['leftSole'] = w * sole + (1 - w) * k['leftSole']
    k['leftAnkle'] = w * (TIP_K - sole * 0.035 - toe * 0.15) + (1 - w) * k['leftAnkle']
    return k
TH_LOCK = [None]
def lock_right(k, th, t):
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if te < TP - 0.02 or te > T_LIFT + 0.09: return k
    if TH_LOCK[0] is None: TH_LOCK[0] = th
    w = 1.0 if te <= T_LIFT else 1 - (te - T_LIFT) / 0.09; w = w * w * (3 - 2 * w)
    dth = (TH_LOCK[0] - th + math.pi) % (2 * math.pi) - math.pi
    Rl = ry(w * dth); k['rightWrist'] = Rl @ k['rightWrist']
    if k['rightFing'] is not None: k['rightFing'] = Rl @ k['rightFing']
    return k
def _ss(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
SUP = []; t_now = [0.0]; SUPX = [np.zeros(5)]; SHT = [None]
def _apply_sup(k, wf, x):
    x = wf * x; R_ = axang(V(1, 0, 0), x[3]) @ axang(V(0, 0, 1), x[4])
    k['pelvis'] = k['pelvis'] + x[:3]; k['pelvisR'] = R_ @ k['pelvisR']; k['pelvisQ'] = m2q(k['pelvisR']); return k
HEAD_CLR = 0.12   # head sphere bottom (skull, hair adds ~5 cm) stays at least this far off the floor
def support(k):
    """r8: while the feet are off the floor, place the body over the planted hands so every planted arm is ~straight
    (shoulder-wrist 0.985 L, never past 0.997 L) and the head keeps HEAD_CLR off the floor. Small damped-Newton
    solve over a pelvis offset (x, y, z), smooth in its inputs so it never pops between frames."""
    te0 = t_now[0] if t_now[0] <= T_SPIN0 else T_SPIN0 - (t_now[0] - T_SPIN1)
    wf = _ss((te0 - (TPO - 0.10)) / 0.22)   # r11: time-based ramp (r10's ankle-height ramp switched on in ~3 frames at the push-off: trunk pop)
    if wf <= 0: SUPX[0] = np.zeros(5); return k
    L = rig.l_ua + rig.l_fa; W, P = rig.solve(k); hs = []; ha = []
    for sd in ('left', 'right'):
        t = k[sd + 'Wrist']; wp = _ss((0.095 - t[1]) / 0.045)   # floor hands only (the top hand of the stack sits ~0.11 up)
        if wp > 0: hs.append((wp, P[sd + 'UpperArm'], t))
        wt = 0.5 * _ss((t[1] - 0.075) / 0.02) * _ss((0.24 - t[1]) / 0.12)   # top hand of the stack: keep that arm long-ish too
        if wt > 0: ha.append((wt, P[sd + 'UpperArm'], t))
    te_ = t_now[0] if t_now[0] <= T_SPIN0 else T_SPIN0 - (t_now[0] - T_SPIN1)
    if SUPLS and LS0 < te_ < LS1:   # r11: off by default (the TL key is already placed for a straight-arm landing; pre-placing here tilted the body 25 deg)   # left hand swinging down to its plant: pre-place the body so that arm lands straight
        hs = [h for h, sd in zip(hs, [s_ for s_ in ('left', 'right') if _ss((0.095 - k[s_ + 'Wrist'][1]) / 0.045) > 0]) if sd != 'left']
        wl = _ss(((te_ - LS0) / (LS1 - LS0) - 0.4) / 0.6)
        if wl > 0: hs.append((wl, P['leftUpperArm'], k['leftWrist'] if SUPW else PL_L));   # r10: reach the hand where it actually is (it hovers before set-down)
        SHT[0] = (wl, P['leftUpperArm'])
    if not (LS0 < te_ < LS1): SHT[0] = None
    if not hs and not ha: SUPX[0] = SUPX[0] * 0.8; k = _apply_sup(k, wf, SUPX[0]); return k
    HCt = P['head'] + W['head'] @ Y * 0.10; pc = P['pelvis']
    def place(x):   # x = (ox, oy, oz, rx, rz): offset + small tilt of the whole body about the pelvis (world x / z axes)
        R_ = axang(V(1, 0, 0), x[3]) @ axang(V(0, 0, 1), x[4]); return R_, x[:3]
    def cost(x):
        R_, o = place(x)
        c = (o[0] ** 2 + o[2] ** 2) / 0.03 ** 2 + 0.02 * (o[1] / 0.01) ** 2 + (math.degrees(x[3]) ** 2 + math.degrees(x[4]) ** 2) / 8.0 ** 2
        for wp, S, t in hs:
            dd = np.linalg.norm(pc + R_ @ (S - pc) + o - t); c += wp * (((dd - 0.993 * L) / 0.01) ** 2 + 50 * (max(0.0, dd - 0.999 * L) / 0.01) ** 2)
        for wa, S, t in ha:
            dd = np.linalg.norm(pc + R_ @ (S - pc) + o - t); c += wa * (max(0.0, 0.95 * L - dd) / 0.01) ** 2
        if SHT[0] is not None:   # r9: left shoulder ~0.15 m inside the plant, on the right-hand side, at landing
            Sl = pc + R_ @ (SHT[0][1] - pc) + o; tg = PL_L + V(SHTX, 0, 0)
            c += SHT[0][0] * (((Sl[0] - tg[0]) / 0.02) ** 2 + ((Sl[2] - tg[2]) / 0.03) ** 2)
        hb = (pc + R_ @ (HCt - pc) + o)[1] - 0.105
        c += 5 * (max(0.0, HEAD_CLR - hb) / 0.01) ** 2
        dx = x - SUPX[0]; c += 0.2 * ((dx[0] ** 2 + dx[1] ** 2 + dx[2] ** 2) / (0.006 * 60 / A.fps) ** 2 + (math.degrees(dx[3]) ** 2 + math.degrees(dx[4]) ** 2) / (1.5 * 60 / A.fps) ** 2)
        return c
    x = SUPX[0].copy(); e = 1e-4; I5 = np.eye(5); c0 = cost(x); lam = 1.0
    for _ in range(25):
        g = np.zeros(5); H = np.zeros((5, 5))
        for i in range(5):
            g[i] = (cost(x + I5[i] * e) - cost(x - I5[i] * e)) / (2 * e)
            for j in range(i, 5):
                H[i, j] = H[j, i] = (cost(x + (I5[i] + I5[j]) * e) - cost(x + (I5[i] - I5[j]) * e) - cost(x - (I5[i] - I5[j]) * e) + cost(x - (I5[i] + I5[j]) * e)) / (4 * e * e)
        ok = False
        for _t in range(8):   # Levenberg-Marquardt: only accept steps that lower the cost
            try: step = np.linalg.solve(H + np.eye(5) * lam, g)
            except np.linalg.LinAlgError: lam *= 4; continue
            c1 = cost(x - step)
            if c1 < c0: x = x - step; c0 = c1; lam = max(1e-3, lam / 3); ok = True; break
            lam *= 4
        if not ok or np.linalg.norm(step) < 1e-6: break
    x[0:3] = np.clip(x[0:3], [-0.20, -0.05, -0.10], [0.10, 0.32, 0.10]); x[3:] = np.clip(x[3:], -math.radians(25), math.radians(25))
    SUPX[0] = x; k = _apply_sup(k, wf, x)
    SUP.append((round(t_now[0], 3), [round(float(v), 3) for v in x[:3]], round(math.degrees(x[3]), 1), round(math.degrees(x[4]), 1), round(wf, 2)))
    return k
LS0, LS1 = TPO - 0.08, TL
LW_LS0 = [None]
D_OUT = n(V(0.96, 0.25, 0.0))   # r9: free left arm straight out sideways (body frame: model-left, a little toward the head), as both videos show
def left_swing(k, t):
    """r9: the left (axis) hand comes down from straight-out-sideways (D_OUT, the K3 key) in one long-arm swing about the
    shoulder in the vertical plane, beside the head, onto its spot 0.18 m from the first hand; lands with ~zero speed at 0.97 s."""
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if not (LS0 < te < LS1): return k
    L = rig.l_ua + rig.l_fa; W, P = rig.solve(k); S = P['leftUpperArm']
    pf = (te - LS0) / (LS1 - LS0); u = _ss(pf)
    B = PL_L + V(0, 0.05, 0); d1 = n(B - S)
    def slerp(a_, b_, u_):
        om = math.acos(max(-1, min(1, a_ @ b_)))
        return a_ if om < 1e-4 else (math.sin((1 - u_) * om) * a_ + math.sin(u_ * om) * b_) / math.sin(om)
    d0 = n(W['torso'] @ D_OUT); d = n(slerp(d0, d1, u)); w = S + d * 0.985 * L                          # long arm the whole way
    ux = _ss((pf - UX[0]) / UX[1]); w[0] += (PL_L[0] - w[0]) * ux; w[2] += (PL_L[2] - w[2]) * ux   # over the spot before it touches (no skid)
    w[1] = max(w[1], PL_L[1] + HOV * (1 - _ss((pf - 0.85) / 0.15)))                         # then set down from ~3 cm
    if pf > 0.97: w = w + (PL_L - w) * ((pf - 0.97) / 0.03)
    k['leftWrist'] = w
    if LFIX[0]:   # r10: turns into its planted orientation gradually (r9 snapped it at pf 0.6 while the hand was still 0.2 m out: wrist 109 deg)
        u2 = _ss((pf - FB0) / (FB1 - FB0))
        if u2 > 0: k['leftFing'] = n((1 - u2) * k['leftFing'] + u2 * FING_L); k['leftPalm'] = n((1 - u2) * k['leftPalm'] + u2 * V(0, -1, 0))
    return k
def arms_long(k):
    """real 2000: the arms stay long. (1) while the feet are off the floor, lift the body until every planted arm is ~straight
    (shoulder-wrist 0.95 L); (2) every airborne arm keeps at least 0.95 L of reach (elbow <= ~35 deg), hand never below the floor."""
    L = rig.l_ua + rig.l_fa; W, P = rig.solve(k)
    wf = _ss((min(k['leftAnkle'][1], k['rightAnkle'][1]) - 0.18) / 0.25)
    dy = 0.0
    for sd in ('left', 'right'):
        t = k[sd + 'Wrist']; S = P[sd + 'UpperArm']; wp = _ss((0.25 - t[1]) / 0.15)
        h = np.hypot(S[0] - t[0], S[2] - t[2]); want = 0.95 * L
        if wp > 0 and h < want:
            need = t[1] + math.sqrt(want * want - h * h) - S[1]
            dy = max(dy, wp * max(0.0, need))
    dy = 0.0   # r8: lifting is done by support()
    if dy > 0: k['pelvis'] = k['pelvis'] + V(0, dy, 0); W, P = rig.solve(k)
    for sd in ('left', 'right'):
        t = k[sd + 'Wrist']; S = P[sd + 'UpperArm']; wa = _ss((t[1] - 0.08) / 0.10)
        if wa <= 0: continue
        d = t - S; dd = np.linalg.norm(d)
        if dd < 0.95 * L:
            t2 = S + d / dd * 0.95 * L
            t2[1] = max(t2[1], min(t[1], 0.10))   # an airborne hand never dives to the floor
            k[sd + 'Wrist'] = t + wa * (t2 - t)
    return k
AF_LAND = None
PLYL = float(os.environ.get('PLYL', '0.065'))   # r11: the axis hand is 'planted' (floor-hand solve) only once it is really down (0.12 switched solves while it hovered: pronation flip)
PLY = float(os.environ.get('PLY', '0.085'))   # r8: only real floor hands use the floor-hand rules (the stack's top hand is a gripping hand)
LFIX = [os.environ.get('LFIX', '1') == '1']   # r8: axis hand keeps its key finger direction (local frame: it pivots with the spin)
RFIX = [float(x) for x in os.environ.get('RFIX', '9,9').split(',')]
def frame(k, th, t=0.0):
    t_now[0] = t; k['_lw0'] = k['leftWrist'].copy()
    k = straighten(arms_long(reach_fix(left_swing(support(reach_fix(left_swing(lock_right(kick_peel(toe_pivot(k, t), t), th, t), t))), t)))); W, P = rig.solve(k)
    te_ = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    AF.dbg = bool(os.environ.get('BF')) and abs(t - float(os.environ.get('BF', '0'))) < 1e-3; AF.dbgl = []
    dg = AF.apply(k, W, P, planted_y={'left': PLYL, 'right': PLY}, fixed={'left': LFIX[0], 'right': RFIX[0] <= te_ <= RFIX[1]},
                   contact={'left': LS0 <= te_ <= TL + 0.06, 'right': TP - 0.18 <= te_ <= TP + 0.02 or T_LIFT - 0.02 <= te_ <= TST - 0.02}); W, P = rig.solve(k); Ry = ry(th)
    if AF.dbg: print('BFT', t, AF.prevp, file=sys.stderr); [print('BF', x, file=sys.stderr) for x in AF.dbgl[-72:]]
    if __import__('os').environ.get('DBG') and 0.55 < t < 1.1: print(round(t, 3), dg['left'], dg['right'], file=sys.stderr)
    loc = {b: (np.eye(3) if b == 'pelvis' else W[PAR[b]]).T @ W[b] for b in JOINTS}
    q = {b: [round(float(x), 6) for x in m2q(loc[b])] for b in JOINTS}; q['pelvis'] = [round(float(x), 6) for x in m2q(Ry @ W['pelvis'])]
    if A.dump: DUMP.append(({b: Ry @ P[b] for b in P}, {b: Ry @ W[b] for b in W}))
    return {'p': [round(float(x), 5) for x in Ry @ k['pelvis']], 'q': q}, P
LW_LS0[0] = interp(K, LS0)['leftWrist'].copy()
if LFIX[0]: AF.land = {'left': FING_L}; AF.prspeed = 1000.0; AF.prland = 90.0
if os.environ.get('LANDPOS', '0') == '1': AF.landpos = {'left': PL_L}
AF.prtarget = {'left': _e('PRT', '-32')[0]}   # r11: the axis hand keeps ~the pronation it will have once planted (the planted solve picks ~-30): no twist at touchdown
frames, info = [], []; DUMP = []
if A.keys:
    for t, k in K[:11]:
        kk = interp(K, t); fr, P = frame(kk, 0.0); frames.append(fr); info.append({'t': t, 'lw': P['leftHand'].round(3).tolist(), 'rw': P['rightHand'].round(3).tolist(), 'head': P['head'].round(3).tolist(), 'la': P['leftFoot'].round(3).tolist(), 'ra': P['rightFoot'].round(3).tolist()})
else:
    TH = th_curve(A.fps); NF = min(len(TH), int(A.tmax * A.fps) + 1); MID = int(round(0.5 * (T_SPIN0 + T_SPIN1) * A.fps))
    # r8: the exit is the entry played backwards, so solve it backwards too (from the final stance to mid-spin): the arm
    # solver's frame-to-frame continuity then runs the same way as in the entry and picks the same arm branches
    order = list(range(min(NF, MID + 1))) + list(range(NF - 1, MID, -1)); byi = {}; dby = {}
    for j, i in enumerate(order):
        if j == MID + 1:
            for a_ in ('prev', 'prevf', 'prevp', 'prevtw'): setattr(AF, a_, {'left': None, 'right': None})
            SUPX[0] = np.zeros(5)
        t = i / A.fps; kk = interp(K, t); fr, P = frame(kk, TH[i], t); byi[i] = fr
        if A.dump: dby[i] = DUMP.pop()
        if i % 12 == 0: info.append({'t': round(t, 2), 'th': round(math.degrees(TH[i]), 1), 'lw': P['leftHand'].round(3).tolist(), 'rw': P['rightHand'].round(3).tolist(), 'la': P['leftFoot'][1].round(3), 'ra': P['rightFoot'][1].round(3)})
if not A.keys:
    frames = [byi[i] for i in range(NF)]
    if A.dump: DUMP = [dby[i] for i in range(NF)]
    info.sort(key=lambda x: x['t'])
for x in info: print(x, file=sys.stderr)
if os.environ.get('SUPDBG'):
    for x in SUP: print('SUP', x, file=sys.stderr)
if A.dump:
    d = {'fps': A.fps}
    for b in DUMP[0][0]: d['P_' + b] = np.array([x[0][b] for x in DUMP])
    for b in DUMP[0][1]: d['W_' + b] = np.array([x[1][b] for x in DUMP])
    np.savez_compressed(A.dump, **(d if A.nomirror else mirror_npz(d)))
CAM_P = [-3.158, 2.0, 4.594]; CAM_T = [-0.89, 0.90, 0.0]   # r11: re-framed for the longer approach (start stance further back): whole loop inside +-0.93 NDC
anim = {'cams': {'v0': {'p': CAM_P, 't': CAM_T, 'f': 30}}, 'id': 'breaking-2000', 'name': '2000（面向镜头起势→左手撑地侧翻→叠手旋转→原路落地）r11',
        'model': 'v3', 'fps': A.fps, 'count': len(frames),
        'source': 'tools/v5/breaking/move_2000_r11.py + kf.py + armfix.py + mirror.py（关键帧 + 逐帧 IK + 手臂解剖解算，按 r9 一侧编写后整套镜像；60fps 求解后帧数翻倍）',
        'note': f'{A.revs} 圈；r11 按两条参考视频 + HMR2 骨骼数据重排起势：左手先撑、左脚（同侧）为支撑脚、右腿撑地后才后摆；撑地时两腿基本并拢，躯干绕脊柱侧转（撑地肩低、空手侧肩高，空手相对躯干侧平）；起势放慢；两手间距 0.5 m，第二只手直臂侧落；分腿倒立后身体移到右手（轴手）上方，左手抬起叠到右手腕；出场为入场倒放', 'phases': [
            {'n': '面向镜头展臂、转身左脚上步', 'f': 0}, {'n': '屈髋侧转、左手直臂下探', 'f': int(0.48 * A.fps)}, {'n': '左手撑地（两腿并拢）', 'f': int(TP * A.fps)},
            {'n': '右腿后摆、髋顶过撑地手', 'f': int((TP + 0.05) * A.fps)}, {'n': '左脚蹬离、右臂侧平落下', 'f': int(TPO * A.fps)}, {'n': '右手落地、分腿倒立', 'f': int(TL * A.fps)},
            {'n': '移到右手上方、左手叠上、屈腿进旋转', 'f': int(TSH * A.fps)}, {'n': '并腿伸直旋转', 'f': int(T_EXT * A.fps)},
            {'n': '减速、原路落地', 'f': int(T_SPIN1 * A.fps)}], 'frames': frames}
if not A.nomirror: anim = mirror_anim(anim)   # authoring-side camera is mirrored with the move
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
print('frames', len(frames), 'T', T_END, file=sys.stderr)
