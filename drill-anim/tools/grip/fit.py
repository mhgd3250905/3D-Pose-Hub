import numpy as np, json
exec(open('grip.py').read())
R = 0.016                       # handle radius (32 mm D-handle grip)
CL = 0.0008                     # skin clearance
def cyl(x):
    cx, cz, tilt = x
    d = np.array([np.sin(tilt), np.cos(tilt), 0.0])      # mostly along +w (q1)
    return np.array([cx, 0, cz]), d
def dist_axis(p, C, d):
    v = p - C; return np.linalg.norm(v - np.outer(v @ d, d), axis=1)
fingerIds = np.where(Wf.sum(1) > 0.5)[0]
moving = fingerIds[np.array([any(allS[i, k] > fingers[k]['sJ'][0] - BL[0][0] for k in range(4)) for i in fingerIds])]
palmIds = np.where((Q[:, 0] > 0.03) & (Q[:, 0] < 0.13) & ~thumbMask)[0]
seg = {}
for k, fi in enumerate(fingers):
    ids = fi['ids']; s = allS[ids, k]
    seg[k] = [ids[(s > fi['sJ'][0] + 0.004) & (s < fi['sJ'][1] - 0.003)], ids[(s > fi['sJ'][1] + 0.003) & (s < fi['sJ'][2] - 0.003)], ids[s > fi['sJ'][2] + 0.003]]
def unpack(x):
    return np.radians(np.array(x[:12]).reshape(4, 3)), x[12:15]
def cost(x, verbose=False):
    ang, cp = unpack(x); C, d = cyl(cp)
    Qd = curl(ang, moving); Qall = Q.copy(); Qall[moving] = Qd
    e = 0.0
    dm = dist_axis(Qall[np.concatenate([moving, palmIds])], C, d)
    pen = np.clip(R + CL - dm, 0, None); e += 1e7 * (pen ** 2).sum()
    terms = []
    for k in range(4):
        for j in range(3):
            if len(seg[k][j]) == 0: continue
            mn = dist_axis(Qall[seg[k][j]], C, d).min(); t = (mn - (R + CL + 0.0005)); e += 1e6 * t * t; terms.append(round(mn * 1000, 1))
    mp = dist_axis(Qall[palmIds], C, d).min(); e += 1e6 * (mp - (R + CL + 0.0005)) ** 2
    e += 1e-1 * ((np.degrees(ang) - np.array([70, 90, 50])) ** 2).sum() * 1e-3
    if verbose: print('finger segment min dists mm', terms, 'palm', round(mp * 1000, 1), 'pen max mm', round(pen.max() * 1000, 2))
    return e
from scipy.optimize import minimize
x0 = [70, 90, 50] * 4 + [0.10, 0.03, 0.0]
b = [(10, 110), (10, 115), (5, 80)] * 4 + [(0.07, 0.13), (0.0, 0.07), (-0.6, 0.6)]
best = None
for cz0 in (0.025, 0.035, 0.045):
    x0[13] = cz0
    r = minimize(cost, x0, method='Powell', bounds=b, options={'maxiter': 20000, 'xtol': 1e-4, 'ftol': 1e-6})
    print('cz0', cz0, 'cost', r.fun)
    if best is None or r.fun < best.fun: best = r
x = best.x; cost(x, True)
ang, cp = unpack(x); print('angles', np.degrees(ang).round(1).tolist(), 'cyl', np.round(cp, 4).tolist())
json.dump(dict(x=list(map(float, x))), open('fit.json', 'w'))
