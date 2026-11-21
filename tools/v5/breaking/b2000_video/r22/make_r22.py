"""r22 = r21c + left-hand plant fix (开哥 k2 @ f296): wrist dorsiflexed palm-down from 296, straight arm lever swings to the plant."""
import json, sys, numpy as np
from scipy.spatial.transform import Rotation as Rot, RotationSpline
from fkj import fk, elbow, LP, Q
SRC = sys.argv[3] if len(sys.argv) > 3 else '/workspace/work/b2000/r21/anim-2000-r21c.json'
d = json.load(open(SRC)); F = d['frames']; F0 = json.loads(json.dumps(F))
KQ = [0, 0, 0.611, 0.7917]          # 开哥's leftHand at f296
A, K, B = int(sys.argv[1]) if len(sys.argv) > 1 else 266, 296, int(sys.argv[2]) if len(sys.argv) > 2 else 328
U, FA, H = 'leftUpperArm', 'leftForearm', 'leftHand'
nrm = lambda v: v / np.linalg.norm(v)
def swing(a, b):
    a = nrm(a); b = nrm(b); ax = np.cross(a, b); s = np.linalg.norm(ax)
    return np.eye(3) if s < 1e-9 else Rot.from_rotvec(ax / s * np.arctan2(s, a @ b)).as_matrix()
# K0: forearm = the planted (straight) forearm of r21 at B, upper arm re-aimed so the hand sits where r21 had it at f296
Fp = Q(F[B]['q'][FA]); Au = Q(F[K]['q'][U])
v_new = LP['leftForearm'] + Fp @ LP['leftHand']; v_old = LP['leftForearm'] + Q(F[K]['q'][FA]) @ LP['leftHand']
A0 = swing(Au @ v_new, Au @ v_old) @ Au
keys_t = [A - 8, A - 4, A, K, B, B + 4, B + 8]
def key(b, t):
    if t == K: return {U: A0, FA: Fp, H: Q(KQ)}[b]
    return Q(F[t]['q'][b])
for b in (U, FA, H):
    R = [key(b, t) for t in keys_t]
    if b == H:   # hand: hold r21 relaxed until A, then go to 开哥's dorsiflexed palm-down pose
        pass
    q = Rot.from_matrix(np.stack(R)).as_quat()
    for j in range(1, len(q)):
        if q[j] @ q[j - 1] < 0: q[j] = -q[j]
    sp = RotationSpline(keys_t, Rot.from_quat(q))
    for i in range(A, B + 1):
        F[i]['q'][b] = [round(float(x), 6) for x in sp(i).as_quat()]
# landing: near the floor the palm comes straight down onto the plant spot (no skate): re-aim the straight arm (upper arm only)
from fkj import PAR
Pl = fk(F[B])[1][H]
for it in range(3):
    for i in range(K, B):
        W, P = fk(F[i]); Hp = P[H]; S = P[U]
        w = np.clip((i - K) / (B - 8 - K), 0, 1); w = w * w * (3 - 2 * w)
        if w <= 0: continue
        T = Hp.copy(); T[[0, 2]] += w * (Pl[[0, 2]] - Hp[[0, 2]])
        Wu = swing(Hp - S, T - S) @ W[U]; F[i]['q'][U] = [round(float(x), 6) for x in Rot.from_matrix(W[PAR[U]].T @ Wu).as_quat()]
json.dump(d, open('anim-2000-r22.json', 'w'), ensure_ascii=False)
# report
mx = 0
for i in range(A - 10, 420, 2):
    W, P = fk(F[i]); e = elbow(W, P); tip = P[H] + W[H] @ np.array([0.17, 0, 0]); palm = W[H] @ np.array([0, -1, 0])
    if 296 <= i <= 400: mx = max(mx, e)
    if (i % 4 == 0 or 312<=i<=330) and i <= 344: print(i, 'elb %.1f' % e, 'H', np.round(P[H], 3), 'tip %.3f' % tip[1], 'palm', np.round(palm, 2))
print('max elbow 296-400: %.1f' % max(elbow(*fk(F[i])) for i in range(296, 401)))
