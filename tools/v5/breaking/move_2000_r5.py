#!/usr/bin/env python3
"""Breaking 2000 r5 (r4 + anatomical arm solver): stand -> power-kick entry (wide stance wind-up, hands plant, kick up through a straddled handstand)
-> legs close + top hand grabs the axis wrist + head tucked, elbows out in a diamond -> stacked-hands spin with legs together
-> spin slows, exit = the entry in reverse, back to the start stance (seamless loop).
Reference: bboy阿求 2000s教学 (bilibili BV158411X7kX, demo 97-100 s), Coach Sambo / The Ruggeds 2000 tutorials.
Local frame: origin C = palm centre of the axis (left) hand; facing +Z at th=0, model-left +X. Usage: move_2000_r3.py <rest.json> <out.json> [--only-keys]"""
import sys, json, math, copy, argparse
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
from kf import *
from armfix import ArmFix
ap = argparse.ArgumentParser(); ap.add_argument('rest'); ap.add_argument('out'); ap.add_argument('--keys', action='store_true', help='one frame per key (preview)')
ap.add_argument('--dump'); ap.add_argument('--fps', type=int, default=120); ap.add_argument('--revs', type=float, default=4)
A = ap.parse_args(); rig = Rig(A.rest); AF = ArmFix(rig, A.fps)
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
PL_R = V(-0.30, 0.045, -0.04)      # first (right) hand plant, far end of the line
PL_L = V(0.0, 0.045, 0.02)         # axis (left) hand: heel of the palm sits on the spin axis
FING_R = ry(math.radians(float(__import__("os").environ.get("GR", "0")))) @ n(V(-0.5, 0, -0.87))      # planted right hand fingers
K0 = key(base, F((0, 1, 0), (-1, 0, 0)), pelvis=V(1.12, 0.95, 0.0), spine=rvd(), neck=rvd(),
         leftAnkle=V(1.12, 0.09, 0.10), rightAnkle=V(1.12, 0.09, -0.10), leftToe=V(-1, 0, 0.15), rightToe=V(-1, 0, -0.15),
         leftKnee=V(-1, 0, 0.1), rightKnee=V(-1, 0, -0.1), leftWrist=V(1.14, 0.87, 0.25), rightWrist=V(1.14, 0.87, -0.25),
         leftElbow=V(1, 0, 0.2), rightElbow=V(1, 0, -0.2))
K.append((0.00, K0)); K.append((0.10, K0))
# step: left foot lifts and travels forward (right foot stays, pivots out); arms start the swing
K0b = key(K0, F((-0.1, 1, 0), (-1, -0.1, 0.05)), pelvis=V(0.98, 0.90, 0.0), spine=rvd(8, -8, 0),
          leftAnkle=V(1.00, 0.30, 0.13), leftKnee=V(-1, 0.3, 0.2), leftToe=V(-1, -0.2, 0.15), rightToe=V(-0.8, 0, -0.6),
          rightWrist=V(1.25, 0.95, -0.35), leftWrist=V(0.92, 0.85, 0.35))
K.append((0.24, K0b))
# wind-up: wide side lunge toward the plant line (-X), right arm back, left arm forward-out (outside the left knee), torso coils
K1 = key(K0b, F((-0.30, 0.95, 0.05), (-0.95, -0.30, 0.12)), pelvis=V(0.78, 0.82, 0.0), spine=rvd(22, -18, 0), neck=rvd(-12, 8, 0),
         leftAnkle=V(0.48, 0.09, 0.13), leftToe=V(-0.8, 0, 0.6), leftKnee=V(-0.8, 0, 0.5), rightToe=V(-0.6, 0, -0.8), rightKnee=V(-0.6, 0, -0.5),
         rightWrist=V(1.18, 1.05, -0.40), rightElbow=V(0.3, -1, 0), leftWrist=V(0.42, 0.80, 0.45), leftElbow=V(1, -0.3, 0.6))
K0c = interp(K + [(0.40, K1)], 0.32); K0c = {c: K0c[c] for c in K1}; K0c['leftAnkle'] = V(0.52, 0.17, 0.13)
K.append((0.32, K0c)); K.append((0.40, K1))
# reach: right hand plants far ahead on the line, torso dives (pelvis ~95 deg + spine 25), left arm flung up, back leg starts to lift
R2, UP2, FW2 = pitchF(120)
K2 = key(K1, R2, pelvis=V(0.14, 0.84, 0.0), spine=rvd(38, 0, -6), neck=rvd(-30, 0, 0),
         rightWrist=PL_R, rightFing=FING_R, rightPalm=V(0, -1, 0), rightElbow=V(1, 0.4, 0),
         leftWrist=V(0.15, 1.15, 0.35), leftElbow=V(0.6, -0.5, 0.6),
         leftAnkle=V(0.48, 0.09, 0.13), leftToe=V(-0.7, 0, 0.7), leftKnee=V(-0.9, -0.3, 0.3), rightLegLen=1.0,
         rightAnkle=V(0.78, 0.58, -0.10), rightKnee=V(-0.2, -1, 0), rightToe=V(0.86, -0.5, 0), rightSole=V(0.5, 0.86, 0))
K.append((0.64, K2))
# the reaching hand comes down onto its spot from above (not skidding in)
K1a = interp(K, 0.48); K1a = {c: K1a[c] for c in K2}; K1a['rightWrist'] = V(0.30, 0.42, -0.42); K1a['rightAnkle'] = V(1.08, 0.22, -0.11); K1a['rightElbow'] = V(0.5, 0.3, -1)
_W, _P = rig.solve(reach_fix(interp([(0, K1a), (1, K1a)], 0))); K1a['rightFing'] = _W['rightHand'] @ -X; K1a['rightPalm'] = _W['rightHand'] @ -Y
K1b = interp(K, 0.56); K1b = {c: K1b[c] for c in K2}; K1b['rightWrist'] = PL_R + V(0.04, 0.17, 0.0); K1b['rightFing'] = FING_R; K1b['rightPalm'] = V(0, -1, 0)
K.insert(len(K) - 1, (0.48, K1a)); K.insert(len(K) - 1, (0.56, K1b))
# kick: back (right) leg whips up, hips rise over the planted hand, left heel comes up (pushing off the toes)
R2b, UP2b, FW2b = pitchF(140, 14)
K2b = key(K2, R2b, pelvis=V(0.08, 0.88, 0.05), spine=rvd(25, 0, -4), neck=rvd(-15, 0, 0), rightLegLen=1.0,
          leftWrist=V(-0.28, 0.62, 0.42), leftElbow=V(-0.2, 0.6, 0.6),
          leftAnkle=V(0.35, 0.20, 0.13), leftToe=V(-0.55, -0.83, 0), leftSole=V(0.83, -0.55, 0), leftKnee=V(-1, 0.1, 0.3),
          rightAnkle=V(0.30, 1.60, -0.10), rightKnee=V(*FW2b))
TIP_L = K2['leftAnkle'] + V(0, -1, 0) * 0.035 + n(K2['leftToe']) * 0.15
K2b['leftAnkle'] = V(0.58, 0.26, 0.17); K2b['leftToe'] = n(V(0.3, -0.95, 0.1)); K2b['leftSole'] = n(V(0.95, 0.3, 0)); K2b['leftKnee'] = V(-0.9, -0.3, 0.3)
lg = legdir(K2b['pelvis'], K2b['rightAnkle'], FW2b); K2b['rightToe'] = lg['toe']; K2b['rightSole'] = lg['sole']
_W, _P = rig.solve(reach_fix(interp([(0, K2b), (1, K2b)], 0)))
K2b['leftFing'] = _W['leftHand'] @ X; K2b['leftPalm'] = _W['leftHand'] @ -Y   # airborne hand: relaxed, in line with the forearm
K.append((0.75, K2b))
# push-off: left foot leaves the floor, right leg passes over the top, the body turns, left hand reaches the floor beside the right
R3, UP3, FW3 = pitchF(163, 44)
K3 = key(K2b, R3, pelvis=V(-0.06, 0.90, 0.08), spine=rvd(14, 0, -3), leftLegLen=0.8, rightLegLen=1.0, neck=rvd(-18, 0, 0),
         leftPalm=V(0, -1, 0), leftElbow=V(0.4, 0.2, 1),
         rightElbow=V(0.3, 0.2, 1),
         leftAnkle=V(0.55, 1.00, 0.16), leftKnee=V(*FW3), rightAnkle=V(-0.10, 1.58, -0.08), rightKnee=V(*FW3))
for sd in ('left', 'right'):
    lg = legdir(K3['pelvis'], K3[sd + 'Ankle'], FW3); K3[sd + 'Toe'] = lg['toe']; K3[sd + 'Sole'] = lg['sole']
_W, _P = rig.solve(reach_fix(interp([(0, K3), (1, K3)], 0)))
_sh = _P['leftUpperArm']; K3['leftWrist'] = PL_L + V(0, 0.16, 0.20)   # reaching down toward its spot (arms_long keeps it long)   # reaching down toward its spot, arm nearly long
K.append((0.85, K3))
# straddle handstand on both hands, still turning, head looks at the floor between the hands
R4, UP4, FW4 = pitchF(178, 72)
K4 = key(K3, R4, pelvis=V(-0.15, 0.93, 0.02), leftLegLen=1.0, rightLegLen=1.0, spine=rvd(-6, 0, 0), neck=rvd(-30, 0, 0), head=rvd(-5, 0, 0),
         leftWrist=PL_L, leftElbow=V(0.3, 0, 1), rightElbow=V(-0.4, 0, 1),
         leftAnkle=V(0.52, 1.30, 0.06), rightAnkle=V(-0.82, 1.28, 0.02), leftKnee=V(*FW4), rightKnee=V(*FW4))
for sd in ('left', 'right'):
    lg = legdir(K4['pelvis'], K4[sd + 'Ankle'], FW4); K4[sd + 'Toe'] = lg['toe']; K4[sd + 'Sole'] = lg['sole']
K3b = interp(K + [(0.97, K4)], 0.91); K3b = {c: K3b[c] for c in K4}; K3b['leftWrist'] = PL_L + V(0.0, 0.07, 0.0)
K.append((0.91, K3b)); K.append((0.97, K4))
K5 = key(K4, INV, pelvis=V(-0.13, 0.93, 0.03), spine=rvd(), neck=rvd(-22, 0, 0), head=rvd(-5, 0, 0),
         leftAnkle=V(0.28, 1.56, 0.04), rightAnkle=V(-0.40, 1.55, 0.02), leftKnee=V(0, 0, -1), rightKnee=V(0, 0, -1))
for sd in ('left', 'right'):
    lg = legdir(K5['pelvis'], K5[sd + 'Ankle'], (0, 0, -1)); K5[sd + 'Toe'] = lg['toe']; K5[sd + 'Sole'] = lg['sole']
# right hand releases as soon as the axis hand is down and travels over to the left wrist while the body already turns
K5['rightWrist'] = V(-0.24, 0.30, 0.02); K5['rightElbow'] = V(-1, 0.2, 0.4); K5['rightFing'] = None
K4r = interp(K + [(1.14, K5)], 1.02); K4r = {c: K4r[c] for c in K5}; K4r['rightWrist'] = PL_R + V(0.02, 0.10, 0.0); K4r['rightFing'] = FING_R
K.append((1.02, K4r)); K.append((1.14, K5))
# lock: right hand comes over onto the left wrist, elbows flare into the diamond, legs come together, head stays off the floor
K6 = key(K5, INV, pelvis=V(-0.04, 0.89, 0.05), rightWrist=V(-0.25, 0.22, 0.0), rightFing=V(1, 0, -0.2), rightElbow=V(-1, 0, 0.1),
         leftElbow=V(1, 0, 0.1), neck=rvd(-18, 0, 0), head=rvd(-5, 0, 0),
         leftAnkle=V(0.16, 1.60, 0.04), rightAnkle=V(-0.20, 1.60, 0.02))
for sd in ('left', 'right'):
    lg = legdir(K6['pelvis'], K6[sd + 'Ankle'], (0, 0, -1)); K6[sd + 'Toe'] = lg['toe']; K6[sd + 'Sole'] = lg['sole']
K.append((1.27, K6))
SPIN = key(K6, INV, pelvis=V(0.0, 0.83, 0.06), leftShrug=math.radians(8), rightShrug=math.radians(8),
           rightWrist=V(0.0, 0.11, 0.035), rightFing=V(1, 0, -0.25), rightPalm=V(0, -1, 0), leftElbow=V(1, 0, 0.05), rightElbow=V(-1, 0, 0.05),
           neck=rvd(-18, 0, 0), head=rvd(-6, 0, 0),
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
for k_ in (K3, K4, K5, K6, SPIN): k_['leftFing'] = FING_L
T_SPIN0, T_SPIN1 = 1.40, 3.30
K.append((T_SPIN0, SPIN))
# spin body: identical pose, th driven by an angular-speed curve below (keys only carry the pose)
K.append((T_SPIN1, SPIN))
# exit = entry reversed in time (same local poses), back to the start stance
entry = [(t, k) for t, k in K if t <= 1.27]
T_END = T_SPIN1 + (T_SPIN0 - 0.0) + 0.0
for t, k in reversed(entry): K.append((T_SPIN1 + (T_SPIN0 - t), k))
T_END = K[-1][0]
# th(t): 0 before K5; accelerates on the kick, ~2 rev/s at the stack, slows to ~1.3 rev/s, stops at the reversed K5; total = revs turns
ts = [k[0] for k in K]; tA = 0.80; tB = T_SPIN1 + (T_SPIN0 - 1.30)
def omega(t):
    if t <= tA or t >= tB: return 0.0
    u = (t - tA) / (tB - tA)
    up = min(1, (t - tA) / 0.30); dn = min(1, (tB - t) / 0.30)
    s = lambda x: x * x * (3 - 2 * x)
    return s(up) * s(dn) * (1.0 - 0.38 * u)
def th_curve(fps):
    N = int(round(T_END * fps)); dt = 1 / fps; w = np.array([omega(i * dt) for i in range(N)]); acc = np.concatenate([[0], np.cumsum(w[:-1]) * dt])
    return acc / acc[-1] * (2 * math.pi * A.revs) if acc[-1] > 0 else acc
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
    if 0.64 <= te <= 0.75:   # heel rises over the fixed toe, then the toe leaves (blend out 0.75-0.82)
        w = 1.0 if te <= 0.69 else 1 - (te - 0.69) / 0.06; w = w * w * (3 - 2 * w)
        k['leftAnkle'] = w * (TIP_L - n(k['leftSole']) * 0.035 - n(k['leftToe']) * 0.15) + (1 - w) * k['leftAnkle']
    return k
TH_LOCK = [None]
def lock_right(k, th, t):
    te = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    if te < 0.60 or te > 1.14: return k
    if TH_LOCK[0] is None: TH_LOCK[0] = th
    w = 1.0 if te <= 1.00 else 1 - (te - 1.00) / 0.14; w = w * w * (3 - 2 * w)
    dth = (TH_LOCK[0] - th + math.pi) % (2 * math.pi) - math.pi
    Rl = ry(w * dth); k['rightWrist'] = Rl @ k['rightWrist']
    if k['rightFing'] is not None: k['rightFing'] = Rl @ k['rightFing']
    return k
def _ss(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
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
    dy = min(dy, 0.30) * wf
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
def frame(k, th, t=0.0):
    k = straighten(arms_long(reach_fix(lock_right(toe_pivot(k, t), th, t)))); W, P = rig.solve(k)
    te_ = t if t <= T_SPIN0 else T_SPIN0 - (t - T_SPIN1)
    dg = AF.apply(k, W, P, fixed={'left': False, 'right': 0.55 <= te_ <= 0.72},
                   contact={'left': 0.60 <= te_ <= 0.93, 'right': 0.45 <= te_ <= 0.60 or 0.96 <= te_ <= 1.12}); W, P = rig.solve(k); Ry = ry(th)
    if __import__('os').environ.get('DBG') and 0.55 < t < 1.1: print(round(t, 3), dg['right'], file=sys.stderr)
    loc = {b: (np.eye(3) if b == 'pelvis' else W[PAR[b]]).T @ W[b] for b in JOINTS}
    q = {b: [round(float(x), 6) for x in m2q(loc[b])] for b in JOINTS}; q['pelvis'] = [round(float(x), 6) for x in m2q(Ry @ W['pelvis'])]
    if A.dump: DUMP.append(({b: Ry @ P[b] for b in P}, {b: Ry @ W[b] for b in W}))
    return {'p': [round(float(x), 5) for x in Ry @ k['pelvis']], 'q': q}, P
frames, info = [], []; DUMP = []
if A.keys:
    for t, k in K[:11]:
        kk = interp(K, t); fr, P = frame(kk, 0.0); frames.append(fr); info.append({'t': t, 'lw': P['leftHand'].round(3).tolist(), 'rw': P['rightHand'].round(3).tolist(), 'head': P['head'].round(3).tolist(), 'la': P['leftFoot'].round(3).tolist(), 'ra': P['rightFoot'].round(3).tolist()})
else:
    TH = th_curve(A.fps)
    for i in range(len(TH)):
        t = i / A.fps; kk = interp(K, t); fr, P = frame(kk, TH[i], t); frames.append(fr)
        if i % 12 == 0: info.append({'t': round(t, 2), 'th': round(math.degrees(TH[i]), 1), 'lw': P['leftHand'].round(3).tolist(), 'rw': P['rightHand'].round(3).tolist(), 'la': P['leftFoot'][1].round(3), 'ra': P['rightFoot'][1].round(3)})
for x in info: print(x, file=sys.stderr)
if A.dump:
    d = {'fps': A.fps}
    for b in DUMP[0][0]: d['P_' + b] = np.array([x[0][b] for x in DUMP])
    for b in DUMP[0][1]: d['W_' + b] = np.array([x[1][b] for x in DUMP])
    np.savez_compressed(A.dump, **d)
anim = {'cams': {'v0': {'p': [-2.45, 1.85, 4.05], 't': [-0.3, 0.88, 0.0], 'f': 30}}, 'id': 'breaking-2000', 'name': '2000（站立起势→旋转撑地过渡→叠手并腿旋转→原路落地）r5',
        'model': 'v3', 'fps': A.fps, 'count': len(frames),
        'source': 'tools/v5/breaking/move_2000_r5.py + kf.py（关键帧 + 逐帧 IK；参考 bboy阿求 2000s教学 BV158411X7kX 示范段、Coach Sambo / The Ruggeds 2000 教学）',
        'note': f'{A.revs} 圈；左手为轴手（在下），右手扣在左手腕上；并腿交叉绷脚尖；两肘外张成菱形夹头；出场为入场倒放', 'phases': [
            {'n': '站立', 'f': 0}, {'n': '宽站拧腰蓄力', 'f': int(0.32 * A.fps)}, {'n': '右手撑地、后腿抡圈', 'f': int(0.56 * A.fps)}, {'n': '左手落地、带转上倒立', 'f': int(0.91 * A.fps)},
            {'n': '叠手并腿夹头', 'f': int(1.27 * A.fps)}, {'n': '减速、原路落地', 'f': int(T_SPIN1 * A.fps)}], 'frames': frames}
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
print('frames', len(frames), 'T', T_END, file=sys.stderr)
