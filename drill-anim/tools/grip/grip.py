"""Procedural power-grip for the coach's RIGHT hand (rest pose, world coords), fitted around a cylinder.
Outputs a small parameter set (hand frame, per-finger joints/axes/angles, thumb) that page code re-applies to the mesh.
"""
import json, sys, numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree
from scipy.optimize import minimize

d = json.load(open('hand2.json')); V = np.array(d['V'], float); F = np.array(d['F'])
P = V[:, 1:4]; WGT = V[:, 4]
WR = np.array([-0.2525385, 0.8915833, 0.0295049])          # rest right wrist (hand bone origin)
ax = np.load('ax.npy'); Q0 = (P - WR) @ ax.T

def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def rot(axis, ang):
    a = axis / np.linalg.norm(axis); K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K

# ---- finger components (cut beyond the webs)
t = cKDTree(P); pairs = t.query_pairs(1e-4, output_type='ndarray'); n = len(P)
rows = np.concatenate([F[:, 0], F[:, 1], F[:, 2], pairs[:, 0]]); cols = np.concatenate([F[:, 1], F[:, 2], F[:, 0], pairs[:, 1]])
cutm = Q0[:, 0] < -0.13; sel = cutm[rows] & cutm[cols]
A = coo_matrix((np.ones(sel.sum()), (rows[sel], cols[sel])), shape=(n, n)); _, lab = connected_components(A, directed=False)
u, c = np.unique(lab[cutm], return_counts=True); big = sorted(u[c > 30], key=lambda b: -Q0[lab == b, 1].mean())  # index..pinky
dirs = []
for b in big:
    S = P[lab == b]; cen = S.mean(0); _, _, Vt = np.linalg.svd(S - cen); dv = Vt[0]
    if dv @ ax[0] > 0: dv = -dv
    dirs.append(dv)
# hand frame: f = mean finger direction (toward tips), p = palmar (from ax[2]) orthogonalised, w = p x f
f = np.mean(dirs, 0); f /= np.linalg.norm(f)
pal = ax[2] - ax[2] @ f * f; pal /= np.linalg.norm(pal)
w = np.cross(pal, f); w /= np.linalg.norm(w)
if w @ ax[1] < 0: w = -w            # w points toward the thumb side
H = np.stack([f, w, pal])            # rows: finger, thumbward width, palmar
Q = (P - WR) @ H.T                   # q[0] along fingers (tips +), q[1] toward thumb, q[2] palmar (+)

fingers = []
for k, b in enumerate(big):
    S = Q[lab == b]; cen = S.mean(0); _, _, Vt = np.linalg.svd(S - cen); dv = Vt[0] * np.sign(Vt[0][0])
    tip = cen + dv * ((S - cen) @ dv).max()
    fingers.append(dict(cen=cen, dir=dv, tip=tip, ids=np.where(lab == b)[0]))
print('fingers (hand frame): tip', [fi['tip'].round(4).tolist() for fi in fingers])
print('dirs', [fi['dir'].round(3).tolist() for fi in fingers])
json.dump(dict(H=H.tolist(), WR=WR.tolist()), open('frame.json', 'w'))
np.save('Q.npy', Q); np.save('lab.npy', lab); json.dump([int(b) for b in big], open('big.json', 'w'))

# ---- per-finger joints (hand frame)
for fi in fingers:
    S = Q[fi['ids']]; dv = fi['dir']; base = fi['cen']
    s = (S - base) @ dv
    fi['web'] = s.min(); fi['tipS'] = s.max()
    def centre(sv, fi=fi):
        S = Q[fi['ids']]; s = (S - fi['cen']) @ fi['dir']; m = np.abs(s - sv) < 0.004
        if m.sum() < 10: return fi['cen'] + fi['dir'] * sv
        c = S[m].mean(0); return c
    fi['centre'] = centre
for k, fi in enumerate(fingers):
    print(k, 'web s', round(fi['web'], 4), 'tip s', round(fi['tipS'], 4), 'web q0', round((fi['cen'] + fi['dir'] * fi['web'])[0], 4))

PAL = np.array([0, 0, 1.0])
MCPQ0 = [0.091, 0.100, 0.109, 0.118]          # knuckle arc, pinky..index (q0)
for k, fi in enumerate(fingers):
    dv = fi['dir']; s0 = (MCPQ0[k] - fi['cen'][0]) / dv[0]   # s of the MCP along this finger's line
    L = fi['tipS'] - s0
    fi['sJ'] = [s0, s0 + 0.45 * L, s0 + 0.74 * L]
    ax_ = np.cross(dv, PAL); ax_ /= np.linalg.norm(ax_); fi['axis'] = ax_
    cj = []
    for j, sj in enumerate(fi['sJ']):
        c = fi['cen'] + dv * sj if j == 0 else fi['centre'](sj)
        cj.append(c + PAL * 0.002)
    fi['cj'] = cj
# soft assignment of the distal-palm + finger vertices to fingers
allS = np.stack([(Q - fi['cen']) @ fi['dir'] for fi in fingers], 1)              # s along each finger line
lat = np.stack([np.abs((Q - fi['cen']) @ fi['axis']) for fi in fingers], 1)
# hard membership for real finger vertices
Wf = np.exp(-(lat / 0.008) ** 2)
for k, fi in enumerate(fingers): Wf[fi['ids']] = 0; 
for k, fi in enumerate(fingers): Wf[fi['ids'], k] = 1
Wf /= np.maximum(Wf.sum(1, keepdims=True), 1e-9)
thumbMask = (Q[:, 1] < -0.032) & (Q[:, 0] > 0.0) & (Q[:, 0] < 0.17)
# exclude the thumb from finger motion
Wf[thumbMask] = 0
BL = [(0.014, 0.006), (0.005, 0.005), (0.004, 0.004)]   # blend zone (before, after) per joint

def frac(s, sj, b):
    return smooth((s - (sj - b[0])) / (b[0] + b[1]))

def curl(angles, idx=None):
    """angles: (4,3) radians. returns deformed Q for idx (default all)."""
    ids = np.arange(len(Q)) if idx is None else idx
    out = Q[ids].copy(); disp = np.zeros_like(out)
    for k, fi in enumerate(fingers):
        wk = Wf[ids, k]; m = wk > 1e-4
        if not m.any(): continue
        p = Q[ids][m].copy(); s = allS[ids][m, k]
        for j in (2, 1, 0):
            a = angles[k][j] * frac(s, fi['sJ'][j], BL[j])
            c = fi['cj'][j]; A = fi['axis']
            # rotate each point about axis A through c by angle a (vectorised Rodrigues)
            v = p - c; ca, sa = np.cos(a)[:, None], np.sin(a)[:, None]
            p = c + v * ca + np.cross(A, v) * sa + np.outer(v @ A, A) * (1 - ca)
        disp[m] += wk[m, None] * (p - Q[ids][m])
    return out + disp
