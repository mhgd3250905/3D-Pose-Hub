import sys, time, numpy as np, pickle
from load import kp2d, drift, N, FR
from init_gv import gv_init
from rig import KP_IDS, NP, kp_points, proj
from fit import Fitter

K, C, SIDE, Q, FL = kp2d(); M = drift()
Kr = np.einsum('nij,nkj->nki', M[:, :, :2], K) + M[:, None, :, 2]
obs = Kr[:, KP_IDS]; w = np.clip(C[:, KP_IDS] / 5.0, 0.0, 1.2) * FL[:, KP_IDS]
w[:, 1:3] *= 0.5   # ears: rough
w[:, -2:] *= 0.5   # r21 palm centres (rig point is approximate)
FW = np.array([0.75 if sd[1] == 'uncertain' else 1.0 for sd in SIDE]); w = w * FW[:, None]   # r21: uncertain frames down-weighted
import channels
CH = channels.build(K, C)
Minv = np.zeros((N, 2, 3))
for i in range(N): A3 = np.vstack([M[i], [0, 0, 1]]); Minv[i] = np.linalg.inv(A3)[:2]
CH['Minv'] = Minv
R0, x0, SC = gv_init()


def run(R0, x0, tag, iters=60, cfg=None, g=None, span=0):
    cfg = dict(cfg or {}); 
    if g is not None: cfg['ng'] = len(g); xin = np.concatenate([x0.reshape(-1), g])
    else: xin = x0.reshape(-1)
    f = Fitter(R0, obs, w, cfg); t = time.time(); x, r = f.solve(xin, iters=iters, span=span)
    if g is not None: x, g = x
    else: g = cfg.get('g')
    W, P = f.rig.fk(x); e = np.linalg.norm(proj(kp_points(W, P, g)) - obs, axis=2)
    run.g = g; run.f = f
    print(tag, 'time %.0fs' % (time.time() - t), 'nfev', r.nfev, 'median err %.1f px' % np.median(e), file=sys.stderr)
    return x, e

if __name__ == '__main__':
    x, e = run(R0, x0, 'A0')
    pickle.dump({'R0': R0, 'x': x, 'e': e, 'obs': obs, 'w': w}, open('stageA0.pkl', 'wb'))
    for i in range(0, N, 3): print(FR[i], 'mean %.0f max %.0f' % ((e[i] * (w[i] > 0.3)).sum() / max(1, (w[i] > 0.3).sum()), e[i].max()))
