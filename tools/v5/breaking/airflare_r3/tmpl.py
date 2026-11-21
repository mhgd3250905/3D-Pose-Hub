"""re-initialise a window of round 1 from round 2 (time-mapped by the labelled phases), seen from the other side (180 deg about the
ground normal), then per-frame refit to round 1's own 2D."""
import sys, pickle, time, numpy as np
from stageA import obs, w
from rig import Rig, kp_points, proj, rodr
from fit import Fitter
from multistart import bake, sub
from load import FR
RD = {1: [10160, 10166, 10168, 10179, 10181, 10183, 10193, 10196], 2: [10193, 10197, 10198, 10209, 10210, 10212, 10222, 10226],
      3: [10222, 10227, 10229, 10239, 10241, 10243, 10254, 10257]}
src, dst = sys.argv[1], sys.argv[2]; a, b = int(sys.argv[3]), int(sys.argv[4]); yaw = float(sys.argv[5]); tr, sr = int(sys.argv[6]), int(sys.argv[7])
d = pickle.load(open(src, 'rb')); g = d['g']; n_, d_ = d['ground']
Rb, xb = bake(d['R0'], d['x'])
A1 = RD[tr]; A2 = RD[sr]
idx = np.arange(a, b + 1) - FR[0]; src_f = np.round(np.interp(np.arange(a, b + 1), A1, A2)).astype(int) - FR[0]
R = sub(Rb, src_f); x0 = xb[src_f].copy()
hipT = lambda P: 0.5 * (P['leftThigh'] + P['rightThigh'])
W2, P2 = Rig(Rb).fk(xb); 
Ry = rodr(n_ * np.radians(yaw))
for k, (i, j) in enumerate(zip(idx, src_f)):
    R['pelvis'][k] = Ry @ R['pelvis'][k]; x0[k, 0:3] = xb[i, 0:3]
f = Fitter(R, obs[idx], w[idx], {'g': g}); t = time.time(); x, r = f.solve(x0, iters=100, span=0)
W, P = f.rig.fk(x); e = np.linalg.norm(proj(kp_points(W, P, g)) - obs[idx], axis=2)
Wb, Pb = Rig(Rb).fk(xb); eb = np.linalg.norm(proj(kp_points(Wb, Pb, g)) - obs, axis=2)
chest = np.einsum('nij,j->ni', W['torso'], [0, 0, 1.0]) @ n_
lim = (f.limits(W, P, f.rig.loc) ** 2).sum(1)
for k, i in enumerate(idx): print(FR[i], 'src', FR[src_f[k]], 'err %.1f (B %.1f) chest %+.2f lim %.1f' % (np.mean(np.minimum(e[k], 60)), np.mean(np.minimum(eb[i], 60)), chest[k], lim[k]))
Rn, xn = bake(R, x)
for kk in Rb: Rb[kk][idx] = Rn[kk]
xb[idx] = xn
pickle.dump({'R0': Rb, 'x': xb, 'g': g, 'ground': d['ground']}, open(dst, 'wb'))
