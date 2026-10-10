import numpy as np, json, sys
exec(open('fit.py').read().split('from scipy.optimize import minimize')[0])
from scipy.optimize import minimize
R = float(sys.argv[1]) if len(sys.argv) > 1 else 0.016
dprox = float(sys.argv[2]) if len(sys.argv) > 2 else 0.006      # bar axis this far proximal of the knuckle arc
# knuckle arc line through MCP centres (index & pinky) -> bar direction
M = np.array([fi['cj'][0] for fi in fingers]); dline = M[3] - M[0]; dline[2] = 0; d = dline / np.linalg.norm(dline)
prox = np.cross(PAL, d); prox = prox if prox[0] < 0 else -prox          # in-plane direction toward the wrist
# palmar half-thickness of each phalanx (centreline -> palmar skin)
def halfth(k, sv):
    fi = fingers[k]; S = Q[fi['ids']]; s = (S - fi['cen']) @ fi['dir']; m = np.abs(s - sv) < 0.003
    c = fi['centre'](sv); return (S[m, 2] - c[2]).max() if m.sum() > 5 else 0.008
# palm surface height near the bar
Pm = M.mean(0) + prox * dprox
v = Q[palmIds] - Pm; along = v @ d; across = v @ prox
near = (np.abs(across) < 0.008) & (np.abs(along) < 0.04)
palmTop = Q[palmIds][near, 2].max()
C0 = np.array([Pm[0], Pm[1], palmTop + R + CL])
ang = np.zeros((4, 3)); info = []
for k, fi in enumerate(fingers):
    u = fi['dir'] - fi['dir'] @ fi['axis'] * fi['axis']; u /= np.linalg.norm(u); n = np.cross(fi['axis'], u)
    if n @ PAL < 0: n = -n
    Mk = fi['cj'][0]
    # bar axis crossing this finger's plane
    t = ((Mk - C0) @ fi['axis']) / (d @ fi['axis']); Ck = C0 + d * t
    c2 = np.array([(Ck - Mk) @ u, (Ck - Mk) @ n])
    L = [np.linalg.norm(fi['cj'][1] - fi['cj'][0]), np.linalg.norm(fi['cj'][2] - fi['cj'][1]), (fi['tipS'] - fi['sJ'][2]) * 0.75]
    h = [0.0095, 0.0085, 0.0075]
    def segs(a):
        p = np.zeros(2); th = 0; out = []
        for j in range(3):
            th += np.radians(a[j]); dv = np.array([np.cos(th), np.sin(th)]); q = p + dv * L[j]; out.append((p, q)); p = q
        return out
    def dseg(p, q):
        w = q - p; s = np.clip((c2 - p) @ w / (w @ w), 0, 1); return np.linalg.norm(p + w * s - c2)
    def cost(a):
        e = 0
        for j, (p, q) in enumerate(segs(a)):
            dd = dseg(p, q) - (R + h[j] + CL); e += (1e4 if dd < 0 else 1.0) * dd * dd * 1e6
        e += 10 * sum(max(0, x - lim) ** 2 + max(0, lo - x) ** 2 for x, lim, lo in zip(a, [95, 110, 90], [15, 40, 25]))
        return e
    best = min((minimize(cost, st, method='Nelder-Mead', options={'xatol': 0.05, 'fatol': 1e-9, 'maxiter': 3000}) for st in ([40, 70, 50], [60, 90, 60], [20, 60, 60])), key=lambda r: r.fun)
    ang[k] = best.x
    info.append(dict(c2=c2.round(4).tolist(), h=np.round(h, 4).tolist(), gaps=[round((dseg(p, q) - (R + h[j] + CL)) * 1000, 2) for j, (p, q) in enumerate(segs(best.x))]))
print('angles', ang.round(1).tolist()); [print(i) for i in info]
json.dump(dict(ang=ang.tolist(), C=C0.tolist(), d=d.tolist(), R=R), open('close.json', 'w'))
