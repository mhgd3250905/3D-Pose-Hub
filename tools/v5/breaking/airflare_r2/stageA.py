import sys, time, numpy as np, pickle
from load import kp2d, drift, N, FR
from init_gv import gv_init
from rig import KP_IDS, NP, kp_points, proj
from fit import Fitter

K, C, SIDE, Q = kp2d(); M = drift()
Kr = np.einsum('nij,nkj->nki', M[:, :, :2], K) + M[:, None, :, 2]
FL = np.ones_like(C)
for i, a in enumerate(Q):
    for k in a['keypoints']:
        if k['id'] < 133 and k['quality'] == 'flagged_estimate': FL[i, k['id']] = 0.6
obs = Kr[:, KP_IDS]; w = np.clip(C[:, KP_IDS] / 5.0, 0.0, 1.2) * FL[:, KP_IDS]
w[:, 1:3] *= 0.5   # ears: rough
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
