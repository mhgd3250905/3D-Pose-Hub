"""multi-start per-frame refit of a frame window: pelvis yawed about the ground normal by K angles, then DP."""
import sys, pickle, time, numpy as np
from stageA import obs, w
from rig import Rig, kp_points, proj, NP, LOCB, rodr, logm
from fit import Fitter
from load import FR

def bake(R0, x):
    rg = Rig(R0); W, P = rg.fk(x); loc = rg.loc; Rn = {'pelvis': W['pelvis'], 'spine': R0['spine'] + x[:, 6:9], 'nh': R0['nh'] + x[:, 9:12]}
    for b in LOCB: Rn[b] = loc[b]
    xn = np.zeros_like(x); xn[:, 0:3] = x[:, 0:3]; return Rn, xn

def sub(R0, idx): return {k: v[idx] for k, v in R0.items()}

if __name__ == '__main__':
    src, dst, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    d = pickle.load(open(src, 'rb')); g = d['g']; n_, d_ = d['ground']
    Rb, xb = bake(d['R0'], d['x'])
    idx = np.arange(a - FR[0], b - FR[0] + 1)
    ANG = np.radians([0, 60, 120, 180, 240, 300, 1000 + 90, 1000 + 180, 1000 + 270, 2000 + 180])   # >=1000: about spine axis, >=2000: about the view axis
    rows = np.repeat(idx, len(ANG)); angs = np.tile(ANG, len(idx))
    R = sub(Rb, rows); x0 = xb[rows].copy()
    for k in range(len(rows)):
        ad = np.degrees(angs[k])
        if ad < 999: ax = n_; an = angs[k]
        elif ad < 1999: ax = R['pelvis'][k] @ np.array([0, 1.0, 0]); an = np.radians(ad - 1000)
        else: ax = np.array([0, 0, 1.0]); an = np.radians(ad - 2000)
        R['pelvis'][k] = rodr(ax * an) @ R['pelvis'][k]
    # keep hip centre (approx pelvis) in place: root unchanged
    f = Fitter(R, obs[rows], w[rows], {'g': g}); t = time.time(); x, r = f.solve(x0, iters=80, span=0)
    W, P = f.rig.fk(x); e = np.linalg.norm(proj(kp_points(W, P, g)) - obs[rows], axis=2)
    lim = f.limits(W, P, f.rig.loc); lc = (lim ** 2).sum(1)
    print('time', round(time.time() - t), file=sys.stderr)
    Rn, xn = bake(R, x)
    pickle.dump({'rows': rows, 'angs': angs, 'R': Rn, 'x': xn, 'e': e, 'lim': lc, 'W': W, 'P': P}, open(dst, 'wb'))
