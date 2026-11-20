"""stage B: whole-sequence fit with temporal smoothness, floor, and hand/foot locks on the fitted ground plane.
usage: stageB.py in.pkl out.pkl iters [init]"""
import sys, time, pickle, numpy as np
from stageA import R0, obs, w, K, M
from rig import Rig, kp_points, proj, NP, F_PX, CX, CY
from fit import Fitter
from ground import fit_ground, HOFF
from contacts import segs, WIN
from load import N, FR

src, dst, iters = sys.argv[1], sys.argv[2], int(sys.argv[3])
d = pickle.load(open(src, 'rb')); x0 = d['x']; g = d['g']; R0 = d.get('R0', R0)
if 'ground' in d: n_, d_ = d['ground']
else:
    W, P = Rig(R0).fk(x0); n_, d_ = fit_ground(P)
locks = {}
for b in WIN:
    wt = np.zeros(N)
    for a, c in segs(b): wt[a:c + 1] = 1.0
    locks[b] = wt
cfg = {'g': g, 'temporal': {'acc': 0.04, 'racc': 0.15, 'ground': (n_, d_), 'contact': locks, 'hoff': HOFF, 'chestup': [10179 - FR[0], 10209 - FR[0], 10239 - FR[0]]}}
if len(sys.argv) > 4 and sys.argv[4] == 'anchor':
    from rig import kp_points as _kp
    W0, P0 = Rig(R0).fk(x0); K0 = _kp(W0, P0, g)
if len(sys.argv) > 4 and sys.argv[4] == 'anchor' and d.get('anchor') is not None: cfg['temporal']['anchor'] = d['anchor']
elif len(sys.argv) > 4 and sys.argv[4] == 'anchor':
    pts0 = np.concatenate([K0, np.stack([P0['pelvis'], P0['torso'], P0['leftForearm'], P0['rightForearm']], 1)], 1)
    cfg['temporal']['anchor'] = pts0 - 0.5 * (P0['leftThigh'] + P0['rightThigh'])[:, None]
import os, json
if os.environ.get('R3'):
    _r3 = json.loads(os.environ['R3']); asig = _r3.pop('asig', None); cfg.update(_r3)
    if asig: cfg['temporal']['asig'] = asig
f = Fitter(R0, obs, w, cfg)
t = time.time()
if os.environ.get('FITG'):
    cfg['ng'] = len(g); (x, g), r = f.solve(np.concatenate([x0.reshape(-1), g]), iters=iters, span=1); cfg['g'] = g; print('g', np.round(g, 3))
else: x, r = f.solve(x0, iters=iters, span=1)
W, P = f.rig.fk(x); e = np.linalg.norm(proj(kp_points(W, P, g)) - obs, axis=2)
print('B time %.0fs nfev %d cost %.1f median err %.1f px, p90 %.1f' % (time.time() - t, r.nfev, r.cost, np.median(e), np.percentile(e, 90)))
pickle.dump({'R0': R0, 'x': x, 'g': g, 'e': e, 'ground': (n_, d_), 'locks': locks, 'anchor': cfg['temporal'].get('anchor')}, open(dst, 'wb'))
