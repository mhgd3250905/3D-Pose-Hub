import numpy as np, json, sys
exec(open('fit.py').read().split('from scipy.optimize import minimize')[0])
from scipy.optimize import minimize
from scipy.spatial import cKDTree
cj = json.load(open('close.json')); angF = np.radians(np.array(cj['ang'])); C = np.array(cj['C']); dC = np.array(cj['d']); RR = cj['R']
QF = Q.copy(); QF[moving] = curl(angF, moving)
# thumb chain (hand frame)
CMC = np.array([0.022, -0.036, -0.012]); MCPt = np.array([0.064, -0.056, -0.016]); IPt = np.array([0.094, -0.071, -0.018]); TIP = np.array([0.125, -0.088, -0.02])
tdir = TIP - CMC; tdir /= np.linalg.norm(tdir)
# thumbness weight: thenar fades in across the palm
thumbW = smooth((-Q[:, 1] - 0.022) / 0.020) * smooth((Q[:, 0] - 0.0) / 0.02) * smooth((0.135 - Q[:, 0]) / 0.01 + 1)
thumbW[Wf.sum(1) > 0.5] *= smooth((-Q[Wf.sum(1) > 0.5, 1] - 0.03) / 0.01)
tid = np.where(thumbW > 1e-3)[0]
sT = (Q[tid] - CMC) @ tdir
def rotp(p, c, A, a):
    A = A / np.linalg.norm(A); v = p - c; ca, sa = np.cos(a)[:, None], np.sin(a)[:, None]
    return c + v * ca + np.cross(A, v) * sa + np.outer(v @ A, A) * (1 - ca)
LMCP = (MCPt - CMC) @ tdir; LIP = (IPt - CMC) @ tdir
def thumbCurl(x, ids=None):
    al, be, ga, de = np.radians(x)
    p = Q[tid].copy(); s = sT
    p = rotp(p, IPt, PAL, de * frac(s, LIP, (0.005, 0.005)))
    p = rotp(p, MCPt, PAL, ga * frac(s, LMCP, (0.006, 0.006)))
    wc = smooth((s + 0.01) / 0.025)
    p = rotp(p, CMC, PAL, be * wc)                       # adduct toward the fingers
    p = rotp(p, CMC, np.array([1.0, 0, 0]), -al * wc)    # palmar swing (opposition)
    return Q[tid] + (p - Q[tid]) * thumbW[tid, None]
fingerTree = cKDTree(QF[np.where((Wf.sum(1) > 0.5) & (thumbW < 0.05))[0]])
def dax(p): v = p - C; return np.linalg.norm(v - np.outer(v @ dC, dC), axis=1)
distal = sT > LMCP + 0.004
def cost(x, verbose=False):
    P = thumbCurl(x); dd = dax(P)
    pen = np.clip(RR + CL - dd, 0, None)
    fd, _ = fingerTree.query(P[thumbW[tid] > 0.5]); fpen = np.clip(0.0025 - fd, 0, None)
    snug = dd[distal].min() - (RR + CL + 0.0005)
    e = 1e8 * (pen ** 2).sum() + 1e7 * (fpen ** 2).sum() + 1e6 * snug ** 2 + 1e3 * (np.clip(dd[distal] - (RR + 0.012), 0, None) ** 2).mean()
    e += 0.01 * sum(max(0, abs(v) - l) ** 2 for v, l in zip(x, [90, 60, 70, 80]))
    if verbose: print('pen', round(pen.max() * 1000, 2), 'fpen', round(fpen.max() * 1000, 2), 'snug', round(snug * 1000, 2), 'meanGap', round((dd[distal] - RR).mean() * 1000, 1))
    return e
best = None
for st in ([40, 0, 20, 20], [60, 10, 30, 30], [30, -10, 40, 40], [70, 20, 40, 50], [50, 0, 0, 60]):
    for sg in (1, -1):
        st2 = [st[0] * sg, st[1], st[2], st[3]]
        r = minimize(cost, st2, method='Nelder-Mead', options={'xatol': 0.1, 'fatol': 1e-6, 'maxiter': 2000})
        if best is None or r.fun < best.fun: best = r
print('thumb', best.x.round(1).tolist(), best.fun); cost(best.x, True)
cj['thumb'] = dict(x=best.x.tolist(), CMC=CMC.tolist(), MCP=MCPt.tolist(), IP=IPt.tolist(), TIP=TIP.tolist())
json.dump(cj, open('close.json', 'w'))
