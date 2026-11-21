#!/usr/bin/env python3
"""Breaking 2000 r10 = r9 re-keyed (free arm out to the side, hips driven forward over the first hand, wide split before the
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
# ---- r9 entry: generalised from two reference videos (upload5 side-ish camera; YouTube GYJ-mjdkFT0 front camera) ----
# Common flow: stand facing the camera, wide stance, arms spread -> turn ~90 deg toward the travel side (+X, the dancer's
# left) while the front (left) foot steps along the line -> hip hinge along the line, the right arm reaches down straight and
# plants on the line ~0.3 m ahead of the front foot -> the back (right) leg kicks up behind, the front foot pushes off: the body
# pitches over the planted hand and twists back toward the camera side (yaw 90 -> 0) like a tipped-forward cartwheel -> the
# free left arm, straight out sideways, comes down beside the head and lands just ahead of the first hand (0.18 m, head side)
# -> straddle handstand, the shoulder line levels, legs close/bend -> right hand stacks onto the left wrist -> spin (the spin
# continues the twist direction, i.e. th decreases).
SX = float(os.environ.get('SX', '0'))   # r10b: whole entry (feet, pelvis, first hand) shifted along the line, away from the axis hand
PL_R = V(-0.18 + SX, 0.045, 0.05)       # first (right) hand plant: on the travel line, ~0.28 m ahead of the front foot
PL_L = V(0.0, 0.045, 0.02)         # axis (left) hand: lands 0.18 m further along the line (head side)
FING_R = n(V(-0.2, 0, 1))          # planted right hand: fingers out to the right-hand side
LR = (rig.l_ua + rig.l_fa)
def solved(k):
    return rig.solve(reach_fix(interp([(0, k), (1, k)], 0)))
def armdir(k, sd, d, frac=0.985):
    _W, _P = solved(k); k[sd + 'Wrist'] = _P[sd + 'UpperArm'] + n(V(*d)) * frac * LR; return k
def ori(yaw, pitch, side=0.0):
    """facing +Z turned left by `yaw` deg (90 = facing +X, the travel direction), hinged forward by `pitch` (180 = inverted),
    head side-tilted toward model-left by `side` (cartwheel roll; raises the left shoulder when inverted)."""
    a = math.radians(pitch); up = V(0, math.cos(a), math.sin(a)); fw = V(0, -math.sin(a), math.cos(a))
    up = axang(fw, -math.radians(side)) @ up
    return ry(math.radians(yaw)) @ F(up, fw)
def ori2(yaw, pitch, side=0.0, twist=0.0):
    """r10: ori() plus a turn of the trunk about its own spine by `twist` deg (+ = left shoulder up / chest opens to model-left
    while hinged: the cartwheel shape of both videos, planting-side shoulder down, free-arm side up)."""
    Rr = ori(yaw, pitch, side); up = Rr @ Y
    return axang(up, math.radians(TW_SIGN * twist)) @ Rr
TW_SIGN = 1.0
def body_leg(k, R, sd, off, fwd_body=(0, 0, 1)):
    """ankle at pelvis + R @ off (body frame: X model-left, Y toward head, Z chest); pointed foot along the leg."""
    k[sd + 'Ankle'] = k['pelvis'] + R @ V(*off); fw = R @ V(*fwd_body)
    lg = legdir(k['pelvis'], k[sd + 'Ankle'], fw); k[sd + 'Toe'] = lg['toe']; k[sd + 'Sole'] = lg['sole']; k[sd + 'Knee'] = fw
    return k
def bodydir(R, d): return R @ n(V(*d))
# ---- r10 entry parameters (authoring side = r9 side; output is mirrored) ----
_e = lambda k, d: tuple(float(x) for x in os.environ.get(k, d).split(','))
FA0b = _e('FA0B', '0.90,0.42,0.08'); FA1 = _e('FA1', '0.86,0.48,0.10'); FA1B = _e('FA1B', '0.86,0.46,0.12')   # free arm, body frame
FA2 = _e('FA2', '0.90,0.40,-0.05'); FA2B = _e('FA2B', '0.94,0.32,-0.05')
TW1, TW1B, TW2, TW2B = _e('TW', '0,22,26,18')          # cartwheel turn of the trunk: planting shoulder down, free shoulder up
P1B = _e('P1B', '92')[0]
PEL1B = _e('PEL1B', '-0.68,0.84,0.02'); PEL2 = _e('PEL2', '-0.51,0.85,0.03'); PEL2B = _e('PEL2B', '-0.40,0.90,0.04'); PEL3 = _e('PEL3', '-0.30,0.98,0.03')
PEL1B, PEL2, PEL2B, PEL3 = [(v[0] + f * SX,) + tuple(v[1:]) for v, f in ((PEL1B, 1), (PEL2, 1), (PEL2B, 0.8), (PEL3, 0.5))]
LEG2 = _e('LEG2', '-0.14,-0.66,-0.42'); LEG2B = _e('LEG2B', '-0.22,-0.58,-0.52')   # back leg: kicked high behind -> wide split before the drive
SIDE3, SIDE3B, SIDE4 = _e('SIDE', '22,26,22')
FB0, FB1 = _e('FB', '0.60,0.601'); UX = _e('UX', '0.55,0.35'); HOV = _e('HOV', '0.035')[0]; SUPW = os.environ.get('SUPW', '0') == '1'
SHTX = _e('SHTX', '-0.15')[0]   # second (axis) hand landing: where its shoulder sits over the plant along x (r9 -0.15)            # second-hand side raised higher before it lands (r9: 22, 26, 22)
FL0 = V(SX + -0.96, 0.09, -0.04); FL = V(SX + -0.76, 0.09, -0.07)      # left (front) foot: start, after the step
FR = V(SX + -1.40, 0.09, 0.07)                                      # right (back) foot
# 0.00 stand facing the camera (+Z), slight forward lean, arms spread sideways (left about level, right lower)
R0 = ori(0, 10)
K0 = key(base, R0, pelvis=V(SX + -1.18, 0.92, 0.0), spine=rvd(6, 0, 0), neck=rvd(-4, 0, 0),
         leftAnkle=FL0, rightAnkle=FR, leftToe=n(V(0.35, 0, 1)), rightToe=n(V(-0.35, 0, 1)), leftSole=V(0, -1, 0), rightSole=V(0, -1, 0),
         leftKnee=n(V(0.3, 0, 1)), rightKnee=n(V(-0.3, 0, 1)), leftElbow=V(0, -0.4, -1), rightElbow=V(0, -0.4, -1), leftLegLen=0.0, rightLegLen=0.0)
armdir(K0, 'left', (0.95, 0.12, 0.08)); armdir(K0, 'right', (-0.80, -0.55, 0.12))
K.append((0.00, K0)); K.append((0.08, K0))
# 0.22 turning left toward the line, left foot in the air stepping forward along it, trunk starts to hinge
R0b = ori(40, 24)
K0b = key(K0, R0b, pelvis=V(SX + -1.12, 0.90, 0.0), spine=rvd(10, 0, 0), neck=rvd(-6, 0, 0),
          leftAnkle=V(SX + -0.86, 0.20, -0.06), leftToe=n(V(0.8, -0.35, 0.4)), leftKnee=n(V(0.8, 0.2, 0.5)),
          rightToe=n(V(0.5, 0, 0.85)), rightKnee=n(V(0.5, 0, 0.85)))
armdir(K0b, 'left', tuple(bodydir(R0b, FA0b))); armdir(K0b, 'right', (0.30, -0.90, 0.30))   # r10: free arm out to the side, ~25 deg up (r9: nearly vertical)
K.append((0.22, K0b))
# 0.34 facing the line (+X), lunge onto the front foot, hinge ~50, right arm reaching forward-down straight, left arm up
R1 = ori2(82, 50, 0, TW1)
K1 = key(K0b, R1, pelvis=V(SX + -0.96, 0.86, 0.0), spine=rvd(14, 0, 0), neck=rvd(-8, 0, 0),
         leftAnkle=FL, leftToe=V(1, 0, -0.1), leftSole=V(0, -1, 0), leftKnee=V(1, 0.3, -0.1),
         rightToe=n(V(0.75, 0, 0.65)), rightKnee=n(V(0.8, 0, 0.6)))
armdir(K1, 'left', tuple(bodydir(R1, FA1))); armdir(K1, 'right', (0.55, -0.83, 0.05))
K.append((0.34, K1))
# 0.46 deep hinge along the line, right hand just above its spot, left arm straight up; back heel lifts
R1b = ori2(88, P1B, 0, TW1B)
K1b = key(K1, R1b, pelvis=V(*PEL1B), spine=rvd(10, 0, 0), neck=rvd(-6, 0, 0),
          rightWrist=PL_R + V(0.0, 0.10, 0.0), rightFing=FING_R, rightPalm=V(0, -1, 0), rightElbow=V(-1, 0, 0),
          rightAnkle=V(SX + -1.36, 0.17, 0.07), rightToe=n(V(0.8, -0.45, 0.1)), rightSole=n(V(-0.55, -0.8, 0)))
armdir(K1b, 'left', tuple(bodydir(R1b, FA1B)))
K.append((0.46, K1b))
# 0.58 right hand planted; back (right) leg kicks up behind, front foot is the support; head goes down past the hand
R2 = ori2(88, 122, 4, TW2)
K2 = key(K1b, R2, pelvis=V(*PEL2), spine=rvd(6, 0, 0), neck=rvd(-10, 0, 0),
         rightWrist=PL_R, rightFing=FING_R, rightPalm=V(0, -1, 0), rightLegLen=0.8)
body_leg(K2, R2, 'right', LEG2)
armdir(K2, 'left', tuple(bodydir(R2, FA2)))
K.append((0.58, K2))
TIP_L = FL + V(0, -1, 0) * 0.035 + n(K1['leftToe']) * 0.15
# 0.68 right leg high behind (big split), front heel up; trunk past horizontal, starting to twist back toward the camera
R2b = ori2(78, 140, 12, TW2B)
K2b = key(K2, R2b, pelvis=V(*PEL2B), spine=rvd(2, 0, 0), neck=rvd(-14, 0, 0), rightLegLen=1.0)
body_leg(K2b, R2b, 'right', LEG2B)
armdir(K2b, 'left', tuple(bodydir(R2b, FA2B)))
K.append((0.68, K2b))
# 0.80 front foot has left the floor; legs split, body rolling over the right hand; left arm straight out sideways
R3 = ori(42, 154, SIDE3)
K3 = key(K2b, R3, pelvis=V(*PEL3), spine=rvd(0, 0, 0), neck=rvd(-20, 0, 0), leftLegLen=0.7)
body_leg(K3, R3, 'right', (-0.30, -0.66, -0.30)); body_leg(K3, R3, 'left', (0.08, -0.70, 0.40))
armdir(K3, 'left', tuple(bodydir(R3, (0.96, 0.28, 0.0))))
K.append((0.80, K3))
# 0.90 legs turning into a side straddle, left arm on its way down (left_swing)
R3b = ori(28, 164, SIDE3B)
K3b = key(K3, R3b, pelvis=V(-0.38, 0.86, 0.02), neck=rvd(-24, 0, 0), leftLegLen=1.0)
body_leg(K3b, R3b, 'right', (-0.38, -0.55, -0.42)); body_leg(K3b, R3b, 'left', (0.30, -0.66, 0.25))
K.append((0.90, K3b))
# 1.00 left hand down on its spot; straddle, left shoulder still a bit high (body tilted toward the head side)
R4 = ori(15, 170, SIDE4)
K4 = key(K3b, R4, pelvis=V(-0.32, 0.86, 0.02), spine=rvd(-2, 0, 0), neck=rvd(-28, 0, 0), head=rvd(-5, 0, 0),
         leftWrist=PL_L, leftElbow=V(0.3, 0, 1), leftPalm=V(0, -1, 0))
body_leg(K4, R4, 'right', (-0.48, -0.62, -0.12)); body_leg(K4, R4, 'left', (0.42, -0.64, 0.08))
K.append((1.00, K4))
# 1.10 straddle handstand on both hands, shoulders level, right hand about to lift; legs start to close
K5 = key(K4, INV, pelvis=V(-0.12, 0.90, 0.03), spine=rvd(), neck=rvd(-24, 0, 0), head=rvd(-5, 0, 0), leftLegLen=0.0, rightLegLen=0.0)
body_leg(K5, INV, 'right', (-0.28, -0.76, 0.06)); body_leg(K5, INV, 'left', (0.28, -0.76, 0.06))
K.append((1.12, K5))
# 1.19 right hand in the air on its way over; knees bending (tuck)
K5b = key(K5, INV, pelvis=V(-0.04, 0.90, 0.05), rightWrist=V(-0.10, 0.22, 0.03), rightElbow=V(-1, 0.2, 0.4), rightFing=None,
          leftAnkle=V(0.08, 1.36, 0.32), rightAnkle=V(-0.16, 1.36, 0.32), leftKnee=V(0, 0, -1), rightKnee=V(0, 0, -1))
feet = lambda k_, f_: [k_.__setitem__(sd + 'Toe', legdir(k_['pelvis'], k_[sd + 'Ankle'], f_)['toe']) or k_.__setitem__(sd + 'Sole', legdir(k_['pelvis'], k_[sd + 'Ankle'], f_)['sole']) for sd in ('left', 'right')]
feet(K5b, (0, 0, -1))
K.append((1.19, K5b))
# 1.27 right hand on the left wrist, elbows out, legs tucked together
K6 = key(K5b, INV, pelvis=V(-0.02, 0.88, 0.05), rightWrist=V(0.0, 0.11, 0.035), rightFing=V(1, 0, -0.25), rightElbow=V(-1, 0, 0.1),
         leftElbow=V(1, 0, 0.1), neck=rvd(-18, 0, 0), head=rvd(-5, 0, 0),
         leftAnkle=V(0.06, 1.30, 0.36), rightAnkle=V(-0.06, 1.30, 0.36))
feet(K6, (0, 0, -1))
K.append((1.27, K6))
SPIN_T = key(K6, INV, pelvis=V(0.0, 0.85, 0.06), leftShrug=math.radians(8), rightShrug=math.radians(8),
             rightWrist=V(0.0, 0.11, 0.035), rightFing=V(1, 0, -0.25), rightPalm=V(0, -1, 0), leftElbow=V(1, 0, 0.05), rightElbow=V(-1, 0, 0.05),
             neck=rvd(-18, 0, 0), head=rvd(-6, 0, 0),
             leftAnkle=V(0.05, 1.32, 0.34), rightAnkle=V(-0.05, 1.32, 0.34), leftKnee=V(0.05, 0, -1), rightKnee=V(-0.05, 0, -1))
feet(SPIN_T, (0, 0, -1))
SPIN = key(SPIN_T, INV, pelvis=V(0.0, 0.83, 0.06), leftLegLen=1.0, rightLegLen=1.0,
           leftAnkle=V(0.035, 1.66, 0.035), rightAnkle=V(-0.035, 1.66, -0.035), leftToe=V(0.05, 1, 0.05), rightToe=V(-0.05, 1, -0.05),
           leftSole=V(0, 0, 1), rightSole=V(0, 0, 1), leftKnee=V(0.05, 0, -1), rightKnee=V(-0.05, 0, -1))
# hands with no explicit finger direction: relaxed (in line with the forearm), written into the key so blends never pop
for t_, k_ in K:
    for sd in ('left', 'right'):
        if k_[sd + 'Fing'] is None:
            _W, _P = rig.solve(reach_fix(interp([(0, k_), (1, k_)], 0))); sg_ = 1 if sd == 'left' else -1
            k_[sd + 'Fing'] = _W[sd + 'Hand'] @ (sg_ * X); k_[sd + 'Palm'] = _W[sd + 'Hand'] @ -Y
# axis-hand fingers point away from the elbow (keeps wrist extension under 90 deg); the same direction from the moment it lands
_W, _P = rig.solve(reach_fix(interp([(0, SPIN), (1, SPIN)], 0)))
_h = _P['leftHand'] - _P['leftForearm']; _h[1] = 0; FING_L = n(_h)
for k_ in (K4, K5, K5b, K6, SPIN_T, SPIN): k_['leftFing'] = FING_L
print('FING_L', FING_L.round(3), file=sys.stderr)
NK = float(os.environ.get('NK', '-15'))   # r8: extra neck flexion (deg) once inverted, tucks the head up between the arms
if NK:
    for k_ in (K4, K5, K5b, K6, SPIN_T, SPIN): k_['neck'] = k_['neck'] + V(*D(NK, 0, 0))
T_SPIN0, T_SPIN1 = 1.40, 3.30
K.append((T_SPIN0, SPIN_T)); K.append((1.80, SPIN))   # r9: legs tucked into the spin, then extended (video 1.3-1.7 s)
# spin body: identical pose, th driven by an angular-speed curve below (keys only carry the pose)
K.append((T_SPIN1 + T_SPIN0 - 1.80, SPIN)); K.append((T_SPIN1, SPIN_T))
# exit = entry reversed in time (same local poses), back to the start stance
entry = [(t, k) for t, k in K if t <= 1.27]
T_END = T_SPIN1 + (T_SPIN0 - 0.0) + 0.0
for t, k in reversed(entry): K.append((T_SPIN1 + (T_SPIN0 - t), k))
T_END = K[-1][0]
# th(t): 0 before K5; accelerates on the kick, ~2 rev/s at the stack, slows to ~1.3 rev/s, stops at the reversed K5; total = revs turns
ts = [k[0] for k in K]; tA = 0.98;   # r9: the spin starts as the axis hand lands (the entry twist before that is in the keys)
tB = T_SPIN1 + (T_SPIN0 - 1.30)
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
    if 0.58 <= te <= 0.80:   # r9: the front (left, support) heel rises over the fixed toe 0.58-0.72, the toe leaves 0.72-0.80
        w = 1.0 if te <= 0.72 else 1 - (te - 0.72) / 0.08; w = w * w * (3 - 2 * w)
        h = _ss((te - 0.58) / 0.14); t0 = n(K1['leftToe']); toe = n(t0 + V(0, -1.0, 0) * h); sole = n(V(0, -1, 0) - t0 * h)
        k['leftToe'] = w * toe + (1 - w) * k['leftToe']; k['leftSole'] = w * sole + (1 - w) * k['leftSole']
        k['leftAnkle'] = w * (TIP_L - sole * 0.035 - toe * 0.15) + (1 - w) * k['leftAnkle']
    return k
TH_LOCK = [None]
def lock_right(k, th, t):
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if te < 0.56 or te > 1.25: return k
    if TH_LOCK[0] is None: TH_LOCK[0] = th
    w = 1.0 if te <= 1.16 else 1 - (te - 1.16) / 0.09; w = w * w * (3 - 2 * w)
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
    wf = _ss((min(k['leftAnkle'][1], k['rightAnkle'][1]) - 0.18) / 0.25)
    if wf <= 0: SUPX[0] = np.zeros(5); return k
    L = rig.l_ua + rig.l_fa; W, P = rig.solve(k); hs = []; ha = []
    for sd in ('left', 'right'):
        t = k[sd + 'Wrist']; wp = _ss((0.095 - t[1]) / 0.045)   # floor hands only (the top hand of the stack sits ~0.11 up)
        if wp > 0: hs.append((wp, P[sd + 'UpperArm'], t))
        wt = 0.5 * _ss((t[1] - 0.075) / 0.02) * _ss((0.24 - t[1]) / 0.12)   # top hand of the stack: keep that arm long-ish too
        if wt > 0: ha.append((wt, P[sd + 'UpperArm'], t))
    te_ = t_now[0] if t_now[0] <= T_SPIN0 else T_SPIN0 - (t_now[0] - T_SPIN1)
    if LS0 < te_ < LS1:   # left hand swinging down to its plant: pre-place the body so that arm lands straight
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
LS0, LS1 = 0.80, 1.00
LW_LS0 = [None]
D_OUT = n(V(0.96, 0.28, 0.0))   # r9: free left arm straight out sideways (body frame: model-left, a little toward the head), as both videos show
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
PLY = float(os.environ.get('PLY', '0.085'))   # r8: only real floor hands use the floor-hand rules (the stack's top hand is a gripping hand)
LFIX = [os.environ.get('LFIX', '1') == '1']   # r8: axis hand keeps its key finger direction (local frame: it pivots with the spin)
RFIX = [float(x) for x in os.environ.get('RFIX', '9,9').split(',')]
def frame(k, th, t=0.0):
    t_now[0] = t; k['_lw0'] = k['leftWrist'].copy()
    k = straighten(arms_long(reach_fix(left_swing(support(reach_fix(left_swing(lock_right(toe_pivot(k, t), th, t), t))), t)))); W, P = rig.solve(k)
    te_ = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    AF.dbg = bool(os.environ.get('BF')) and abs(t - float(os.environ.get('BF', '0'))) < 1e-3; AF.dbgl = []
    dg = AF.apply(k, W, P, planted_y={'left': 0.12, 'right': PLY}, fixed={'left': LFIX[0], 'right': RFIX[0] <= te_ <= RFIX[1]},
                   contact={'left': 0.80 <= te_ <= 1.05, 'right': 0.40 <= te_ <= 0.60 or 1.08 <= te_ <= 1.24}); W, P = rig.solve(k); Ry = ry(th)
    if AF.dbg: print('BFT', t, AF.prevp, file=sys.stderr); [print('BF', x, file=sys.stderr) for x in AF.dbgl[-72:]]
    if __import__('os').environ.get('DBG') and 0.55 < t < 1.1: print(round(t, 3), dg['left'], dg['right'], file=sys.stderr)
    loc = {b: (np.eye(3) if b == 'pelvis' else W[PAR[b]]).T @ W[b] for b in JOINTS}
    q = {b: [round(float(x), 6) for x in m2q(loc[b])] for b in JOINTS}; q['pelvis'] = [round(float(x), 6) for x in m2q(Ry @ W['pelvis'])]
    if A.dump: DUMP.append(({b: Ry @ P[b] for b in P}, {b: Ry @ W[b] for b in W}))
    return {'p': [round(float(x), 5) for x in Ry @ k['pelvis']], 'q': q}, P
LW_LS0[0] = interp(K, LS0)['leftWrist'].copy()
if LFIX[0]: AF.land = {'left': FING_L}; AF.prspeed = 1000.0; AF.prland = 90.0
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
CAM_P = [-2.92, 1.928, 4.293]; CAM_T = [-0.80, 0.90, 0.0]   # r10: re-framed (r9 cut the start arm): whole loop inside +-0.87 NDC
anim = {'cams': {'v0': {'p': CAM_P, 't': CAM_T, 'f': 30}}, 'id': 'breaking-2000', 'name': '2000（面向镜头起势→左手撑地侧翻→叠手旋转→原路落地）r10',
        'model': 'v3', 'fps': A.fps, 'count': len(frames),
        'source': 'tools/v5/breaking/move_2000_r10.py + kf.py + armfix.py + mirror.py（关键帧 + 逐帧 IK + 手臂解剖解算，按 r9 一侧编写后整套镜像；60fps 求解后帧数翻倍）',
        'note': f'{A.revs} 圈；r10 = r9 整套左右镜像：左手先撑（前脚前方），右手为轴手，左手扣在右手腕上；起势空手侧平略上举；顶髋过撑地手、大劈叉后蹬地发力；出场为入场倒放', 'phases': [
            {'n': '面向镜头展臂、右脚外迈', 'f': 0}, {'n': '顶髋俯身、左手直臂下探', 'f': int(0.34 * A.fps)}, {'n': '左手撑地、右腿后摆大劈叉', 'f': int(0.58 * A.fps)},
            {'n': '前脚蹬地发力、右臂侧平落到左手旁', 'f': int(0.80 * A.fps)}, {'n': '左手叠上、屈腿进旋转', 'f': int(1.08 * A.fps)}, {'n': '并腿伸直旋转', 'f': int(1.80 * A.fps)},
            {'n': '减速、原路落地', 'f': int(T_SPIN1 * A.fps)}], 'frames': frames}
if not A.nomirror: anim = mirror_anim(anim)   # authoring-side camera is mirrored with the move
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
print('frames', len(frames), 'T', T_END, file=sys.stderr)
