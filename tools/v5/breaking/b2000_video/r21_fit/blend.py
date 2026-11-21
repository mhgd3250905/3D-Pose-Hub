"""r21 combine: clip A (mirrored, right pivot, clockwise) is the backbone; in its stacked spin the leg/trunk posture is blended
with clip B's stacked-spin posture. Clip B is right pivot but spins the other way, so it is used TIME-REVERSED (posture only),
phase-matched by the turn angle accumulated since the spin start.
usage (CLIP=A): blend.py A.pkl B.pkl out.pkl"""
import sys, pickle, numpy as np
from scipy.spatial.transform import Rotation as Rot, Slerp
from rig import Rig, LOCB
from multistart import bake
from cfg import FR, SPIN
A = pickle.load(open(sys.argv[1], 'rb')); B = pickle.load(open(sys.argv[2], 'rb'))
Ra, xa = bake(A['R0'], A['x']); Rb, xb = bake(B['R0'], B['x'])
def heading(R, n_):
    zc = np.array([0, 0, 1.0]); zc = zc - n_ * (zc @ n_); zc /= np.linalg.norm(zc); xw = np.cross(n_, zc)
    W, P = Rig(R).fk(np.zeros((len(R['pelvis']), 42)))
    fz = W['torso'] @ np.array([0, 0, 1.0]); return np.degrees(np.unwrap(np.arctan2(fz @ xw, fz @ zc)))
hA = heading(Ra, A['ground'][0]); hB = heading(Rb, B['ground'][0])
a0, a1 = SPIN[0] - FR[0], SPIN[1] - FR[0]; b0, b1 = 47, 59      # clip B stacked window (labels 00047-00059, ~1 turn)
cumB = hB[b1] - hB[b0:b1 + 1][::-1]                               # time-reversed: accumulated turn from B's end backwards
jB = np.arange(b0, b1 + 1)[::-1]; turnB = cumB[-1]
print('clip B turn in stacked window %.0f deg; clip A spin turn %.0f deg' % (turnB, hA[a0] - hA[a1]))
WT = {'leftThigh': 0.4, 'rightThigh': 0.4, 'leftShin': 0.25, 'rightShin': 0.25, 'leftFoot': 0.2, 'rightFoot': 0.2, 'spine': 0.4}
out = {k: v.copy() for k, v in Ra.items()}; ED = 4
for i in range(a0, a1 + 1):
    u = abs(hA[i] - hA[a0]) % turnB
    j = np.interp(u, cumB, jB); j0 = int(np.floor(j)); j1 = min(j0 + 1, b1); fj = j - j0
    e = min(i - a0, a1 - i) / ED; tp = 1.0 if e >= 1 else e * e * (3 - 2 * e)
    for b, wt in WT.items():
        if b == 'spine':
            vb = (1 - fj) * Rb['spine'][j0] + fj * Rb['spine'][j1]; out['spine'][i] = (1 - wt * tp) * Ra['spine'][i] + wt * tp * vb; continue
        qb = Slerp([0, 1], Rot.from_matrix(np.stack([Rb[b][j0], Rb[b][j1]])))([fj])
        out[b][i] = Slerp([0, 1], Rot.concatenate([Rot.from_matrix(Ra[b][i:i + 1]), qb]))([wt * tp]).as_matrix()[0]
d = dict(A); d['R0'] = out; d['x'] = xa
pickle.dump(d, open(sys.argv[3], 'wb'))
