"""r22 two-view lower-body/torso refit around the plant (clipA01 view kept, mirrored clipB view constrains depth).
Shared body pose (all local joint rotations) for both clips; each clip has its own rigid placement in its own camera.
usage: fit2v.py in.json out_deltas.npz [iters]"""
import json, sys, pickle, time, numpy as np
from scipy.optimize import least_squares
from scipy.sparse import lil_matrix
from scipy.interpolate import interp1d
from common import *
SRC, OUT = sys.argv[1], sys.argv[2]; IT = int(sys.argv[3]) if len(sys.argv) > 3 else 30
F = json.load(open(SRC))['frames']
import os
A0, A1 = int(os.environ.get('A0', 440)), int(os.environ.get('A1', 490)); KNEE = [tuple(map(int, r.split('-'))) for r in os.environ.get('KNEE', '').split(',') if r]
PINL, PINR = int(os.environ.get('PINL', 4)), int(os.environ.get('PINR', 6)); KA = np.arange(A0, A1 + 1); NK = len(KA)
JI = lambda a: int(round((a - 384) / FPSA * 120))
KJ = np.array([JI(a) for a in KA])
# phase anchors A <-> B (mirrored B): stance, hip hinge, left palm contact, both feet off / kick, second (pivot) hand
ANCH = [(440, 0), (452, 8), (465, 17), (472, 22), (484, 35), (490, 41)]
TB = np.clip(np.interp(KA, *zip(*ANCH)), 0, 91)
oB = np.load('obs_B.npz'); KB, CB, FLB, fwB = oB['K'], oB['C'], oB['FL'], oB['fw']
def obsB(t):
    j = int(np.floor(t)); u = t - j; j1 = min(j + 1, len(KB) - 1)
    k = KB[j] * (1 - u) + KB[j1] * u; c = np.minimum(CB[j], CB[j1]); w = np.clip(c / 5, 0, 1.2) * np.minimum(FLB[j], FLB[j1]) * fwB[j]
    return k[KP_IDS], w[KP_IDS]
OB = [obsB(t) for t in TB]
FB, CXB, CYB = 1527.35, 540.0, 540.0
gB = pickle.load(open('/workspace/work/b2000/r21/wB/C1.pkl', 'rb')); nB, dB = gB['ground']; nB = nB * np.array([-1, 1, 1])  # mirrored scene
BONES = ['leftThigh', 'leftShin', 'leftFoot', 'rightThigh', 'rightShin', 'rightFoot', 'leftUpperArm', 'leftForearm']
SPW = (0.5, 0.9, 1.6)
NV = 6 + 3 + 3 * len(BONES) + 6   # A root/pelvis, spine, bones, B rigid
def rodr(v): return Rot.from_rotvec(v).as_matrix()
def pose(k, v):
    fr = F[KJ[k]]; q = {b: fr['q'][b] for b in J}; Wd = {'pelvis': rodr(v[3:6]) @ Q(q['pelvis'])}; Pd = {'pelvis': np.array(fr['p']) + v[0:3]}
    loc = {b: Q(q[b]) for b in J[1:]}
    for s, b in enumerate(('spineLower', 'spineUpper', 'torso')): loc[b] = loc[b] @ rodr(v[6:9] * SPW[s] / 3)
    for m, b in enumerate(BONES): loc[b] = loc[b] @ rodr(v[9 + 3 * m:12 + 3 * m])
    for b in J[1:]:
        p = PAR[b]; Pd[b] = Pd[p] + Wd[p] @ LP[b]; Wd[b] = Wd[p] @ loc[b]
    return Wd, Pd, loc
# reference (r21) quantities
REF = []
for k in range(NK):
    W, P, _ = pose(k, np.zeros(NV)); REF.append((W, P, kp_world(W, P)))
UVA = [projA(r[2]) for r in REF]
LFLOCK = np.array([REF[k][1]['leftFoot'][1] < 0.09 for k in range(NK)]); RFLOCK = np.array([REF[k][1]['rightFoot'][1] < 0.09 for k in range(NK)])
LHLOCK = np.array([F[KJ[k]]['lock'][0] for k in range(NK)]); RHLOCK = np.array([F[KJ[k]]['lock'][1] for k in range(NK)])
print('locks LF', LFLOCK.sum(), 'RF', RFLOCK.sum(), 'LH', LHLOCK.sum(), 'RH', RHLOCK.sum(), file=sys.stderr)
# B rigid init: Kabsch of B's own (mirrored) fit onto the r21 pose at the mapped B time
sys.path.insert(0, '/workspace/work/b2000/r21/fit')
from rig import Rig
Wb, Pb = Rig(gB['R0']).fk(gB['x'])
SWP = {'left': 'right', 'right': 'left'}
def bfit_kp(t):
    j = int(round(t)); W = {}; P = {}
    for b in J:
        sb = b.replace('left', 'TMP').replace('right', 'left').replace('TMP', 'right')
        M = np.diag([-1, 1, 1]); W[b] = M @ Wb[sb][j] @ M; P[b] = Pb[sb][j] * np.array([-1, 1, 1])
    return kp_world(W, P, gB['g'])
def kabsch(X, Y):
    mx, my = X.mean(0), Y.mean(0); U, S, Vt = np.linalg.svd((X - mx).T @ (Y - my)); D = np.diag([1, 1, np.sign(np.linalg.det(Vt.T @ U.T))])
    R = Vt.T @ D @ U.T; return R, my - R @ mx
x0 = np.zeros((NK, NV))
for k in range(NK):
    R, t = kabsch(REF[k][2], bfit_kp(TB[k])); x0[k, -6:-3] = Rot.from_matrix(R).as_rotvec(); x0[k, -3:] = t
WBT = np.interp(KA, [436, 440, 472, 476], [0, 1, 1, 0])   # B is the second view for stance -> plant -> kick; different performer after
UP = np.array([0, 1, 0.]); D2R = np.pi / 180
EDGE = np.array([max(0.0, (1 - k / PINL) if PINL else 0, (1 - (NK - 1 - k) / PINR) if PINR else 0) for k in range(NK)])   # deltas pinned to 0 at the window edges
def res(xf, detail=False):
    x = xf.reshape(NK, NV); r = []; parts = {}; FT = []
    for k in range(NK):
        v = x[k]; W, P, loc = pose(k, v); X = kp_world(W, P); FT.append({'left': P['leftFoot'], 'right': P['rightFoot']})
        ea = (projA(X) - UVA[k]) / 2.5; r.append(ea.ravel())                       # A view kept (r21 = clipA fit), 3 px
        RB = rodr(v[-6:-3]); Xc = X @ RB.T + v[-3:]; ob, wb = OB[k]
        eb = (projC(Xc, FB, CXB, CYB) - ob) / 8.0 * np.sqrt(wb * WBT[k])[:, None]; r.append(eb.ravel())   # mirrored clipB view, 8 px
        r.append([(np.degrees(np.arccos(np.clip(RB @ UP @ nB, -1, 1)))) / 3.0, (nB @ v[-3:] - dB) / 0.03])   # B floor = world floor
        if LFLOCK[k]: r.append([(P['leftFoot'][1] - 0.085) / 0.005]); r.append((W['leftFoot'] @ UP - REF[k][0]['leftFoot'] @ UP) / 0.05)
        if RFLOCK[k]: r.append([(P['rightFoot'][1] - 0.085) / 0.005]); r.append((W['rightFoot'] @ UP - REF[k][0]['rightFoot'] @ UP) / 0.05)
        if LHLOCK[k]: r.append((P['leftHand'] - REF[k][1]['leftHand']) / 0.004)
        if RHLOCK[k]: r.append((P['rightHand'] - REF[k][1]['rightHand']) / 0.006)
        r.append(np.minimum(0, X[:, 1] + 0.0) / 0.01)
        r.append(v[-6:] * 1e-3)
        if any(a <= KA[k] <= b for a, b in KNEE):   # stance / landing: clipA shows near-straight legs; knees bent toward camera A = depth error
            for s in ('left', 'right'):
                if (LFLOCK if s == 'left' else RFLOCK)[k]:
                    t_ = P[s + 'Shin'] - P[s + 'Thigh']; h_ = P[s + 'Foot'] - P[s + 'Shin']
                    r.append([max(0, np.degrees(np.arccos(np.clip(t_ @ h_ / np.linalg.norm(t_) / np.linalg.norm(h_), -1, 1))) - 25) / 8.0])                               # no point below the floor
        # anatomy: knee is a hinge about local x (no knee twist/varus), foot not twisted against the shin
        for s in ('left', 'right'):
            rv = Rot.from_matrix(loc[s + 'Shin']).as_rotvec(); r.append(np.degrees(rv[1:]) / 8.0)
            fv = Rot.from_matrix(loc[s + 'Foot']).as_rotvec(); r.append([np.degrees(fv[1]) / 20.0])
        # left arm straight from the plant approach on (elbow flex, measured), r22 req.
        if KJ[k] >= 296:
            u = P['leftForearm'] - P['leftUpperArm']; f = P['leftHand'] - P['leftForearm']
            r.append([max(0, np.degrees(np.arccos(np.clip(u @ f / np.linalg.norm(u) / np.linalg.norm(f), -1, 1))) - 6) / 0.5])
        r.append(np.degrees(v[:-6][3:]) / 25.0); r.append(v[:3] / 0.15)              # weak prior toward r21
        r.append(np.concatenate([np.degrees(v[3:-6]), v[:3] * 100]) * EDGE[k] / 0.3)  # edge pin
        if detail: parts.setdefault('A', []).append(np.linalg.norm(ea * 3, axis=1)); parts.setdefault('B', []).append((np.linalg.norm(eb * 8, axis=1), wb))
    for s, LK in (('left', LFLOCK), ('right', RFLOCK)):   # locked feet do not slide
        for k in range(1, NK):
            if LK[k] and LK[k - 1]: r.append((FT[k][s] - FT[k - 1][s])[[0, 2]] / 0.004)
    # temporal smoothness (2nd difference) of all deltas and of the B placement
    dd = x[2:] - 2 * x[1:-1] + x[:-2]
    sc = np.concatenate([np.full(3, 0.01), np.full(NV - 9, 1.5 * D2R), np.full(3, 3 * D2R), np.full(3, 0.02)])
    r.append((dd / sc).ravel())
    out = np.concatenate([np.ravel(a) for a in r])
    return (out, parts) if detail else out
r0 = res(x0.ravel()); print('nres', len(r0), 'nvar', x0.size, 'cost0 %.0f' % (0.5 * (r0 ** 2).sum()), file=sys.stderr)
# sparsity: residual blocks per knot depend on that knot; smoothness on 3 knots
blk = []; 
for k in range(NK):
    xx = x0.copy(); n0 = 0
sz = []
for k in range(NK):   # size of each knot's block (constant layout given locks)
    pass
# build sparsity by perturbation of one knot (exact block structure)
base = r0; S = lil_matrix((len(r0), x0.size), dtype=int)
for k in range(NK):
    xx = x0.copy(); xx[k] += 1e-3; dif = np.nonzero(np.abs(res(xx.ravel()) - base) > 0)[0]
    for c in range(k * NV, (k + 1) * NV): S[dif, c] = 1
t = time.time()
sol = least_squares(res, x0.ravel(), jac_sparsity=S, loss='soft_l1', f_scale=3.0, max_nfev=IT, x_scale='jac', verbose=0)
x = sol.x.reshape(NK, NV); print('time %.0fs nfev %d cost %.0f -> %.0f' % (time.time() - t, sol.nfev, 0.5 * (r0 ** 2).sum(), sol.cost), file=sys.stderr)
_, p0 = res(x0.ravel(), True); _, p1 = res(sol.x, True)
def bstat(p):
    e = np.array([a for a, w in p['B']]); w = np.array([w for a, w in p['B']]); m = w > 0.2; return np.median(e[m]), np.percentile(e[m], 90)
print('A reproj change med %.1f p90 %.1f px' % (np.median(np.array(p1['A'])), np.percentile(np.array(p1['A']), 90)), file=sys.stderr)
print('B reproj before med %.1f p90 %.1f -> after med %.1f p90 %.1f px' % (*bstat(p0), *bstat(p1)), file=sys.stderr)
np.savez(OUT, x=x, x0=x0, KA=KA, KJ=KJ, TB=TB, BONES=np.array(BONES))
