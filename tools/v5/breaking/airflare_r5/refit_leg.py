"""r5: local refit of the right (bent) leg 10139-10155 against the clip01 2D keypoints + depth/orientation priors
(foot on the camera side, sole toward the camera). Everything else in stageR3.pkl is kept.  usage: refit_leg.py in.pkl out.pkl"""
import sys, pickle, json, numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation as Rot
from stageA import obs as OBS, w as WOBS, M
from rig import Rig, kp_points, proj, KP_IDS, LOCB
from fit import Fitter, hinge
src, dst = sys.argv[1], sys.argv[2]
d = pickle.load(open(src, 'rb')); X = d['x'].copy(); g = d['g']; F0 = 10118
A, Bf = 10139 - F0, 10155 - F0          # free frames (inclusive)
S0, S1 = A - 3, Bf + 3                   # sub-sequence incl. fixed neighbours
sub = slice(S0, S1 + 1); n = S1 - S0 + 1; free = np.arange(A - S0, Bf - S0 + 1)
C0 = 12 + 3 * LOCB.index('rightThigh'); COLS = np.arange(C0, C0 + 9)   # rightThigh, rightShin, rightFoot
R0s = {k: v[sub] for k, v in d['R0'].items()}
obs = OBS[sub].copy(); w = WOBS[sub].copy()
# 10145: the detector put the right ankle/heel on the support hand and the toe on the heel (foot is in front of the face);
# hand-read positions from the source frame (full-res px)
FIX = {10145: {16: (932, 612), 22: (942, 622), 20: (832, 686)}}
for f, kk in FIX.items():
    i = f - F0 - S0
    for j, (u, v) in kk.items():
        k = KP_IDS.index(j); obs[i, k] = M[f - F0, :, :2] @ np.array([u, v]) + M[f - F0, :, 2]; w[i, k] = 1.0
LEG = [KP_IDS.index(j) for j in (14, 16, 20, 22)]
cfg = {'g': g, 'r3': {"flex": 50, "ext": 28, "lat": 28, "tw": 38, "tot": 55, "neck": 58, "w": 20, "reg": 0.2, "sacc": 0.05},
       'hip': {"ext": 30, "flex": 128, "abd": 64, "swing": 132, "w": 45}}
fitr = Fitter(R0s, obs, w, cfg); rig = fitr.rig
x0 = X[sub].copy(); p0 = x0[free][:, COLS].copy()
fr = lambda f: f - F0 - S0
SOLE = {fr(f): (0.45 if 10144 <= f <= 10150 else 0.0) for f in range(10143, 10152)}
ANK_NEAR_KNEE = [fr(f) for f in (10145, 10146, 10147)]
ANK_NEAR_HIP = {fr(f): 0.15 for f in range(10142, 10148)}; ANK_NEAR_HIP[fr(10148)] = 0.05
Y = np.array([0, 1.0, 0]); Z3 = np.array([0, 0, 1.0])

def unpack(p):
    x = x0.copy(); x[free[:, None], COLS[None]] = p.reshape(len(free), 9); return x

def res(p, verbose=False):
    x = unpack(p); fitr.x = x; W, P = rig.fk(x); loc = rig.loc
    K = kp_points(W, P, g); uv = proj(K)
    out = []
    e2 = (uv[:, LEG] - obs[:, LEG]) * np.minimum(1.0, w[:, LEG, None]) / 6.0; out.append(e2.reshape(n, -1))
    lim = fitr.limits(W, P, loc); out.append(lim)
    dist = lambda p_: np.linalg.norm(p_, axis=-1)
    ank, kn, hip = P['rightFoot'], P['rightShin'], P['rightThigh']
    toe = K[:, KP_IDS.index(20)]; heel = K[:, KP_IDS.index(22)]
    r = np.zeros((n, 6))
    for i, t in SOLE.items():
        sole = W['rightFoot'][i] @ -Y; tc = -ank[i] / dist(ank[i]); r[i, 0] = hinge(t - sole @ tc, 0) * 20
    for i in ANK_NEAR_KNEE: r[i, 1] = hinge(dist(ank[i]) - dist(kn[i]) + 0.05, 0) * 40
    for i, m in ANK_NEAR_HIP.items(): r[i, 2] = hinge(dist(ank[i]) - dist(hip[i]) + m, 0) * 40
    # no body/face penetration: foot points and mid shin vs trunk capsule (pelvis-neck) and head sphere
    a_, b_ = P['pelvis'], P['neck']; hc = P['head'] + np.einsum('nij,j->ni', W['head'], [0, 0.10, 0])
    for k, q in enumerate((ank, toe, heel, 0.5 * (ank + kn))):
        ab = b_ - a_; tt = np.clip(((q - a_) * ab).sum(1) / (ab * ab).sum(1), 0, 1); c = a_ + ab * tt[:, None]
        pen = hinge(0.20 - dist(q - c), 0) + hinge(0.19 - dist(q - hc), 0)
        r[:, 3] += pen * 60 if k < 3 else 0; r[:, 4] += pen * 60 if k == 3 else 0
    out.append(r)
    pts = np.stack([kn, ank, toe, heel], 1); acc = pts[2:] - 2 * pts[1:-1] + pts[:-2]; out.append(np.pad(acc.reshape(n - 2, -1) / 0.03, ((0, 2), (0, 0))))
    for b in ('rightThigh', 'rightShin', 'rightFoot'):
        Rl = loc[b]; v = Rot.from_matrix(np.einsum('nji,njk->nik', Rl[:-1], Rl[1:])).as_rotvec(); a2 = v[1:] - v[:-1]
        out.append(np.pad(a2 / 0.12, ((0, 2), (0, 0))))
    reg = np.zeros((n, 9)); reg[free] = (p.reshape(len(free), 9) - p0) * 0.05; out.append(reg)
    R = np.concatenate([o.reshape(n, -1) for o in out], 1)
    if verbose: return W, P, K, uv
    return R.reshape(-1)

def report(p, tag):
    W, P, K, uv = res(p, True); e = np.linalg.norm(uv - obs, axis=2)
    print(tag)
    for i in range(A - S0, Bf - S0 + 1):
        f = S0 + i + F0; ank, kn, hip = P['rightFoot'][i], P['rightShin'][i], P['rightThigh'][i]
        sole = W['rightFoot'][i] @ -Y; tc = -ank / np.linalg.norm(ank)
        print(f, 'err knee/ank/toe/heel %3.0f %3.0f %3.0f %3.0f' % tuple(e[i, LEG]), 'sole·cam %+.2f' % (sole @ tc),
              'ank-hip %+.2f ank-knee %+.2f m (+ = nearer cam)' % (np.linalg.norm(hip) - np.linalg.norm(ank), np.linalg.norm(kn) - np.linalg.norm(ank)))
    return e

sys.path.insert(0, '/workspace/work/pose-hub/tools/v5/breaking')
from kf import aim
from rig import LP, F_PX, CX, CY
L_TH = np.linalg.norm(LP['rightShin']); L_SH = np.linalg.norm(LP['rightFoot'])
def ray(uv): v = np.array([(uv[0] - CX) / F_PX, -(uv[1] - CY) / F_PX, -1.0]); return v / np.linalg.norm(v)
def on_ray(r, C, L, near=True):
    b = r @ C; c = C @ C - L * L; disc = b * b - c
    t = b - np.sqrt(disc) if disc > 0 and near else (b + np.sqrt(max(disc, 0)) if disc > 0 else b)
    return r * t
def construct(p, frames):
    x = unpack(p); W, P = rig.fk(x); pp = p.reshape(len(free), 9).copy(); nrm = lambda v: v / np.linalg.norm(v)
    for f in frames:
        i = fr(f); H = P['rightThigh'][i]; ik = KP_IDS.index
        Kn = on_ray(ray(obs[i, ik(14)]), H, L_TH); A_ = on_ray(ray(obs[i, ik(16)]), Kn, L_SH)
        sh = nrm(A_ - Kn); best = None
        for near in (True, False):
            T_ = on_ray(ray(obs[i, ik(20)]), A_, 0.165, near); t = nrm(T_ - A_); sc = abs(t @ sh)
            if best is None or sc < best[0]: best = (sc, t)
        t = nrm(best[1] - sh * (best[1] @ sh))
        Ws = aim(-Y, Z3, sh, t); Wf = aim(Z3, -Y, t, sh); Wt = aim(-Y, np.array([1.0, 0, 0]), nrm(Kn - H), Ws @ np.array([1.0, 0, 0]))
        Lt = W['pelvis'][i].T @ Wt; Ls = Wt.T @ Ws; Lf = Ws.T @ Wf
        for k, (b, L) in enumerate((('rightThigh', Lt), ('rightShin', Ls), ('rightFoot', Lf))):
            pp[i - free[0], 3 * k:3 * k + 3] = Rot.from_matrix(R0s[b][i].T @ L).as_rotvec()
    return pp.reshape(-1)

if __name__ == '__main__':
    e0 = report(p0, 'BEFORE')
    best = None
    import os
    PS = os.environ.get('START'); pst = pickle.load(open(PS, 'rb'))['x'][sub][free][:, COLS] if PS else p0
    if os.environ.get('INIT'): pst = construct(pst.reshape(-1), range(10144, 10151)).reshape(pst.shape); report(pst, 'CONSTRUCTED')
    seeds = [pst] + [pst + np.random.default_rng(s_).normal(0, 0.35, p0.shape) for s_ in map(int, os.environ.get('SEEDS', '1').split(','))]
    for k, seed in enumerate(seeds):
        r = least_squares(res, seed.reshape(-1), method='trf', max_nfev=300, x_scale=1.0)
        print('start', k, 'cost %.1f' % r.cost)
        if best is None or r.cost < best.cost: best = r
    e1 = report(best.x, 'AFTER')
    X[sub] = unpack(best.x)
    W, P = Rig(d['R0']).fk(X); eall = np.linalg.norm(proj(kp_points(W, P, g)) - OBS, axis=2)
    d2 = dict(d); d2['x'] = X; d2['e'] = eall; pickle.dump(d2, open(dst, 'wb'))
    fi = slice(A - S0, Bf - S0 + 1)
    print('leg 2D median before %.1f after %.1f px; whole-body all-joint median (fit) %.1f' % (np.median(e0[fi][:, LEG]), np.median(e1[fi][:, LEG]), np.median(eall[WOBS > 0.3])))
