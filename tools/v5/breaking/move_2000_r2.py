#!/usr/bin/env python3
"""Breaking 2000 r2: stand -> power-kick entry (wide stance wind-up, hands plant, kick up through a straddled handstand)
-> legs close + top hand grabs the axis wrist + head tucked, elbows out in a diamond -> stacked-hands spin with legs together
-> spin slows, exit = the entry in reverse, back to the start stance (seamless loop).
Reference: bboy阿求 2000s教学 (bilibili BV158411X7kX, demo 97-100 s), Coach Sambo / The Ruggeds 2000 tutorials.
Local frame: origin C = palm centre of the axis (left) hand; facing +Z at th=0, model-left +X. Usage: move_2000_r2.py <rest.json> <out.json> [--only-keys]"""
import sys, json, math, copy, argparse
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
from kf import *
ap = argparse.ArgumentParser(); ap.add_argument('rest'); ap.add_argument('out'); ap.add_argument('--keys', action='store_true', help='one frame per key (preview)')
ap.add_argument('--dump'); ap.add_argument('--fps', type=int, default=120); ap.add_argument('--revs', type=float, default=4)
A = ap.parse_args(); rig = Rig(A.rest)
V = lambda *a: np.array(a, float)
def O(roll=0, yaw=0, pitch=0): return rz(math.radians(roll)) @ ry(math.radians(yaw)) @ rx(math.radians(pitch))
def rvd(x=0, y=0, z=0): return V(*D(x, y, z))
INV = O(-180, 180)   # handstand: head down, chest -Z, model-left +X
base = dict(th=0.0, leftShrug=0.0, rightShrug=0.0, pelvis=V(-0.55, 0.95, 0), pelvisQ=m2q(np.eye(3)), spine=rvd(), neck=rvd(), head=rvd(),
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
K = []
K0 = base; K.append((0.00, K0)); K.append((0.15, K0))
K1 = key(K0, O(0, -25, 12), pelvis=V(-0.52, 0.84, 0.02), spine=rvd(15, -25, 0), neck=rvd(-5, 10, 0),
         leftAnkle=V(-0.05, 0.09, 0.06), rightAnkle=V(-1.02, 0.09, -0.02), leftToe=V(0.55, 0, 0.84), rightToe=V(-0.5, 0, 0.86),
         leftWrist=V(-0.80, 1.05, 0.30), rightWrist=V(-1.05, 0.95, -0.25), leftElbow=V(0, -1, 0.3), rightElbow=V(0, -1, -0.3),
         leftKnee=V(0.4, 0, 1), rightKnee=V(-0.4, 0, 1))
K.append((0.50, K1))
K2 = key(K1, O(-35, 25, 35), pelvis=V(-0.45, 0.80, 0.02), spine=rvd(40, 15, -25), neck=rvd(-15, 0, 0),
         rightWrist=V(-0.20, 0.22, 0.10), leftWrist=V(0.25, 0.75, -0.05), rightElbow=V(-0.5, 0.2, -1), leftElbow=V(0, -1, -0.5),
         rightFing=V(0.2, 0, -1), rightPalm=V(0, -1, 0))
K.append((0.80, K2))
K3 = key(K2, O(-95, 70, 25), pelvis=V(-0.28, 0.88, 0.04), spine=rvd(30, 15, -20), neck=rvd(-25, 0, 0),
         rightWrist=WR_R2, leftWrist=V(0.06, 0.16, 0.05), leftElbow=V(1, 0.3, -0.3), rightElbow=V(-1, 0.3, -0.3), leftFing=V(0, 0, -1),
         rightAnkle=V(-0.85, 1.15, 0.05), rightKnee=V(-0.3, 0.3, 1), rightToe=V(-0.4, 0.9, 0.2), rightSole=V(0.6, 0.3, -0.5),
         leftKnee=V(0.6, 0, 1))
K.append((0.98, K3))
K4 = key(K3, O(-140, 135, 10), pelvis=V(-0.14, 0.76, 0.04), spine=rvd(10, 0, -10), neck=rvd(-20, 0, 0),
         leftWrist=WR_L, leftElbow=V(1, 0, 0), rightElbow=V(-1, 0, 0),
         rightAnkle=V(-0.60, 1.45, 0.10), rightToe=V(-0.3, 1, 0), rightSole=V(0, 0, 1), rightKnee=V(0, 0, -1),
         leftAnkle=V(0.30, 0.35, 0.10), leftKnee=V(0.5, -0.3, -1), leftToe=V(0.6, -0.3, -0.4), leftSole=V(0.3, -0.8, 0.5))
K.append((1.14, K4))
K5 = key(K4, INV, pelvis=V(-0.13, 0.94, 0.0), spine=rvd(), neck=rvd(-10, 0, 0), head=rvd(-5, 0, 0),
         leftAnkle=V(0.55, 1.50, 0.05), rightAnkle=V(-0.72, 1.50, 0.05), leftKnee=V(0, 0, -1), rightKnee=V(0, 0, -1),
         leftToe=V(0.35, 1, 0), rightToe=V(-0.35, 1, 0), leftSole=V(0, 0, 1), rightSole=V(0, 0, 1))
K.append((1.30, K5))
K6 = key(K5, INV, pelvis=V(-0.03, 0.88, 0.0), rightWrist=V(-0.14, 0.17, 0.03), rightFing=V(1, 0, -0.2), rightElbow=V(-1, 0, -0.2),
         leftElbow=V(1, 0, -0.2), neck=rvd(0, 0, 0), head=rvd(0, 0, 0),
         leftAnkle=V(0.18, 1.60, 0.03), rightAnkle=V(-0.22, 1.60, 0.0), leftToe=V(0.1, 1, 0), rightToe=V(-0.1, 1, 0), th=0.10)
K.append((1.42, K6))
SPIN = key(K6, INV, pelvis=V(0.0, 0.835, 0.01), leftShrug=math.radians(8), rightShrug=math.radians(8),
           rightWrist=V(0.0, 0.10, 0.045), rightFing=V(1, 0, -0.25), rightPalm=V(0, -1, 0), leftElbow=V(1, 0, -0.15), rightElbow=V(-1, 0, -0.15),
           neck=rvd(8, 0, 0), head=rvd(6, 0, 0),
           leftAnkle=V(0.035, 1.645, 0.035), rightAnkle=V(-0.035, 1.645, -0.035), leftToe=V(0.05, 1, 0.05), rightToe=V(-0.05, 1, -0.05),
           leftKnee=V(0.05, 0, -1), rightKnee=V(-0.05, 0, -1), th=0.25)
T_SPIN0, T_SPIN1 = 1.52, 3.40
K.append((T_SPIN0, SPIN))
# spin body: identical pose, th driven by an angular-speed curve below (keys only carry the pose)
K.append((T_SPIN1, SPIN))
# exit = entry reversed in time (same local poses), back to the start stance
entry = [(t, k) for t, k in K if t <= 1.42]
T_END = T_SPIN1 + (T_SPIN0 - 0.0) + 0.0
for t, k in reversed(entry): K.append((T_SPIN1 + (T_SPIN0 - t), k))
T_END = K[-1][0]
# th(t): 0 before K5; accelerates on the kick, ~2 rev/s at the stack, slows to ~1.3 rev/s, stops at the reversed K5; total = revs turns
ts = [k[0] for k in K]; tA = 1.30; tB = T_SPIN1 + (T_SPIN0 - 1.30)
def omega(t):
    if t <= tA or t >= tB: return 0.0
    u = (t - tA) / (tB - tA)
    up = min(1, (t - tA) / 0.22); dn = min(1, (tB - t) / 0.22)
    s = lambda x: x * x * (3 - 2 * x)
    return s(up) * s(dn) * (1.0 - 0.38 * u)
def th_curve(fps):
    N = int(round(T_END * fps)); dt = 1 / fps; w = np.array([omega(i * dt) for i in range(N)]); acc = np.concatenate([[0], np.cumsum(w[:-1]) * dt])
    return acc / acc[-1] * (2 * math.pi * A.revs) if acc[-1] > 0 else acc
def reach_fix(k):
    """planted hands (wrist target y < 0.07) must be reachable: move the pelvis toward them until both are within 99% of arm length."""
    L = (rig.l_ua + rig.l_fa) * 0.99
    for _ in range(12):
        W, P = rig.solve(k); worst = None
        for sd in ('left', 'right'):
            t = k[sd + 'Wrist']
            if t[1] < 0.07:
                d = t - P[sd + 'UpperArm']; ex = np.linalg.norm(d) - L
                if ex > 1e-4 and (worst is None or ex > worst[0]): worst = (ex, d / np.linalg.norm(d))
        if worst is None: break
        k['pelvis'] = k['pelvis'] + worst[1] * worst[0]
    return k
def frame(k, th):
    k = reach_fix(k); W, P = rig.solve(k); Ry = ry(th)
    loc = {b: (np.eye(3) if b == 'pelvis' else W[PAR[b]]).T @ W[b] for b in JOINTS}
    q = {b: [round(float(x), 6) for x in m2q(loc[b])] for b in JOINTS}; q['pelvis'] = [round(float(x), 6) for x in m2q(Ry @ W['pelvis'])]
    if A.dump: DUMP.append(({b: Ry @ P[b] for b in P}, {b: Ry @ W[b] for b in W}))
    return {'p': [round(float(x), 5) for x in Ry @ k['pelvis']], 'q': q}, P
frames, info = [], []; DUMP = []
if A.keys:
    for t, k in K[:9]:
        kk = interp(K, t); fr, P = frame(kk, 0.0); frames.append(fr); info.append({'t': t, 'lw': P['leftHand'].round(3).tolist(), 'rw': P['rightHand'].round(3).tolist(), 'head': P['head'].round(3).tolist(), 'la': P['leftFoot'].round(3).tolist(), 'ra': P['rightFoot'].round(3).tolist()})
else:
    TH = th_curve(A.fps)
    for i in range(len(TH)):
        t = i / A.fps; kk = interp(K, t); fr, P = frame(kk, TH[i]); frames.append(fr)
        if i % 12 == 0: info.append({'t': round(t, 2), 'th': round(math.degrees(TH[i]), 1), 'lw': P['leftHand'].round(3).tolist(), 'rw': P['rightHand'].round(3).tolist(), 'la': P['leftFoot'][1].round(3), 'ra': P['rightFoot'][1].round(3)})
for x in info: print(x, file=sys.stderr)
if A.dump:
    d = {'fps': A.fps}
    for b in DUMP[0][0]: d['P_' + b] = np.array([x[0][b] for x in DUMP])
    for b in DUMP[0][1]: d['W_' + b] = np.array([x[1][b] for x in DUMP])
    np.savez_compressed(A.dump, **d)
anim = {'cams': {'v0': {'p': [-2.45, 1.85, 4.05], 't': [-0.3, 0.88, 0.0], 'f': 30}}, 'id': 'breaking-2000', 'name': '2000（站立起势→上倒立→叠手并腿旋转→原路落地）r2',
        'model': 'v3', 'fps': A.fps, 'count': len(frames),
        'source': 'tools/v5/breaking/move_2000_r2.py + kf.py（关键帧 + 逐帧 IK；参考 bboy阿求 2000s教学 BV158411X7kX 示范段、Coach Sambo / The Ruggeds 2000 教学）',
        'note': f'{A.revs} 圈；左手为轴手（在下），右手扣在左手腕上；并腿交叉绷脚尖；两肘外张成菱形夹头；出场为入场倒放', 'phases': [
            {'n': '站立', 'f': 0}, {'n': '宽站拧腰蓄力', 'f': int(0.5 * A.fps)}, {'n': '右手撑地', 'f': int(0.98 * A.fps)}, {'n': '分腿倒立（双手）', 'f': int(1.30 * A.fps)},
            {'n': '叠手并腿夹头开转', 'f': int(1.52 * A.fps)}, {'n': '减速、原路落地', 'f': int(T_SPIN1 * A.fps)}], 'frames': frames}
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
print('frames', len(frames), 'T', T_END, file=sys.stderr)
