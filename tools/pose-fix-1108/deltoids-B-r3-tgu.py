# tgu.py : offline kinematic design for deltoids-B-r3 (half Turkish get-up). Writes tgu.json (per-frame pelvis/roll/pitch at 30 fps)
import sys, json, math
sys.path.insert(0, '/workspace/work/pylib')
import numpy as np
from scipy.optimize import least_squares
# v3 rest offsets from pelvis (measured on db0 t=0, rest axes x=body left, y=up, z=front)
RS = {'shL': [0.1879, 0.4067, -0.0124], 'shR': [-0.1879, 0.4067, -0.0124], 'hipL': [0.0815, -0.0476, -0.0045], 'hipR': [-0.0815, -0.0476, -0.0045],
      'shC': [0, 0.4067, -0.0124], 'head': [0, 0.5787, 0.0026], 'waist': [0, 0.122, -0.0037]}
AR_R = 0.4845
AR = 0.4840          # shoulder->wrist for a ~172 deg arm (UA .2568 + FA .228)
LEG = 0.8245          # hip->ankle straight-ish (TH .4098 + SH .4167 = .8265)
W = np.array([-0.05, 0.0503, -0.50])     # left wrist on the mat (floor hand at x -0.05, z -0.50)
AL = np.array([0.86, 0.07, -0.36])       # left ankle (heel down)
AR_ = np.array([0.52, 0.084, 0.14])      # right ankle (foot flat)
def rotm(k, d):
    k = np.array(k, float); k /= np.linalg.norm(k); a = math.radians(d); K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + math.sin(a) * K + (1 - math.cos(a)) * K @ K
B0 = np.array([[0, 0, -1], [-1, 0, 0], [0, 1, 0]], float).T   # columns: rest x->-Z, y->-X, z->+Y
def pts(q):
    px, py, pz, r, p = q; R = rotm([0, 0, 1], p) @ rotm([1, 0, 0], r) @ B0; P = np.array([px, py, pz])
    return {k: P + R @ np.array(v) for k, v in RS.items()}
def res_key(q, kind, prior):
    J = pts(q); o = []
    dL = np.linalg.norm(J['hipL'] - AL); dR = np.linalg.norm(J['hipR'] - AR_)
    o += [8 * (dL - LEG)]                         # left leg straight, heel planted
    o += [8 * max(0, dR - 0.70)]                  # right foot reachable with a bent knee
    s = J['shL']
    if kind == 'S': o += [6 * (q[1] - 0.136), 3 * q[3], 3 * q[4]]
    if kind == 'E':
        o += [6 * (s[1] - 0.28), 6 * (np.linalg.norm(s - W) - 0.355), 10 * (q[1] - 0.162)]
    if kind == 'H':
        o += [10 * (np.linalg.norm(s - W) - AR), 10 * (q[1] - 0.165), 2 * max(0, np.linalg.norm((s - W)[[0, 2]]) - 0.15)]
    if kind == 'B':
        o += [10 * (np.linalg.norm(s - W) - AR), 3 * (dR - 0.60), 2*(q[1]-0.38), 3 * max(0, np.linalg.norm((s - W)[[0, 2]]) - 0.20)]
        # trunk in line: shoulders-centre, pelvis and mid knee roughly colinear -> pelvis height vs shoulder height
        o += [2 * (J['shC'][1] - J['waist'][1] - 0.05 * 0)]
    o += [w * (a - b) for w, a, b in zip(PW[kind], q, prior)]
    return o
PW = {'S':[0.5,0,3,0,0],'E':[3,0,3,0.01,0.01],'H':[3,0,3,0.01,0.01],'B':[1,0,1,0.01,0.01]}
priors = {'S': [0.05, 0.136, 0.06, 0, 0], 'E': [0.05, 0.162, -0.03, -40, -35], 'H': [0.05, 0.14, -0.03, -25, -55], 'B': [0.12, 0.36, -0.05, -20, -15]}
K = {}
for kind, pr in priors.items():
    s = least_squares(res_key, pr, args=(kind, pr), x_scale=[0.1, 0.1, 0.1, 20, 20]); K[kind] = s.x.tolist()
    J = pts(s.x); print(kind, np.round(s.x, 4), 'shL', np.round(J['shL'], 3), 'armD', round(np.linalg.norm(J['shL'] - W), 4),
                       'legL', round(np.linalg.norm(J['hipL'] - AL), 4), 'legR', round(np.linalg.norm(J['hipR'] - AR_), 4), 'shC', np.round(J['shC'], 3), 'head', np.round(J['head'], 3))
K['E'][1] = max(K['E'][1], 0.160)
json.dump(K, open('/workspace/work/pose-batch-1108/tgu-keys.json', 'w'))

# ---- per-frame trajectory: eased keys S-E-H-B-B-H-E-S, then a small per-frame correction (warm-started, strongly tied to the eased prior)
DUR, FPS = 8.0, 30
SEQ = [(0.0, 'S'), (0.3, 'S'), (1.5, 'E'), (2.6, 'H'), (3.7, 'B'), (4.3, 'B'), (5.4, 'H'), (6.5, 'E'), (7.7, 'S'), (8.0, 'S')]
def prior(t):
    for (ta, a), (tb, b) in zip(SEQ, SEQ[1:]):
        if ta <= t <= tb:
            u = 0 if tb == ta else (t - ta) / (tb - ta); e = (1 - math.cos(math.pi * u)) / 2
            v = np.array(K[a]) * (1 - e) + np.array(K[b]) * e
            if {a, b} == {'S', 'E'}: v[1] += 0.012 * math.sin(math.pi * u)
            return v, (a, b)
def seg_straight(ab): return set(ab) <= {'H', 'B'}
def res_f(q, pr, ab):
    J = pts(q); o = [w * (x - y) for w, x, y in zip([5, 20, 20, 0.5, 0.5], q, pr)]
    d = np.linalg.norm(J['shL'] - W); dL = np.linalg.norm(J['hipL'] - AL); dR = np.linalg.norm(J['hipR'] - AR_)
    o += [400 * (d - AR)] if seg_straight(ab) else [400 * max(0, d - AR)]
    o += [400 * (dL - LEG), 400 * max(0, dR - 0.70)]
    return o
rows = []; q = None
for i in range(int(DUR * FPS)):
    t = i / FPS; pr, ab = prior(t); q0 = pr if q is None else q
    q = least_squares(res_f, q0, args=(pr, ab), x_scale=[0.1, 0.1, 0.1, 20, 20]).x
    J = pts(q); tl = math.radians(5) * max(0.0, 1 - abs(q[3]) / 12); wr = J['shR'] + AR_R * np.array([0, math.cos(tl), -math.sin(tl)])
    rows.append(dict(t=round(t, 4), q=[round(x, 5) for x in q], wr=[round(x, 5) for x in wr], armD=round(float(np.linalg.norm(J['shL'] - W)), 4),
                     legL=round(float(np.linalg.norm(J['hipL'] - AL)), 4), legR=round(float(np.linalg.norm(J['hipR'] - AR_)), 4)))
json.dump(rows, open('/workspace/work/pose-batch-1108/tgu.json', 'w'))
qs = np.array([r['q'] for r in rows]); dq = np.abs(np.diff(qs, axis=0)).max(axis=0); print('max per-frame step px,py,pz,roll,pitch', np.round(dq, 4))
print("armD", min(r["armD"] for r in rows), max(r["armD"] for r in rows), "legL", min(r["legL"] for r in rows), max(r["legL"] for r in rows), "legR max", max(r["legR"] for r in rows))
for r in rows[60:120:6]: print(r["t"], r["q"], r["armD"], r["legL"])
