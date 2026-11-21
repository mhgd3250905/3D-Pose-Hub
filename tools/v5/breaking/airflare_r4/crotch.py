"""Crotch weight fix + metrics. """
import numpy as np, scipy.sparse as sp, scipy.sparse.linalg as spl
from model import Model
def weld(P, tol=1e-5):
    k = np.round(P / tol).astype(np.int64); _, inv = np.unique(k, axis=0, return_inverse=True); return inv.ravel()
def lap(I, n):
    e = np.r_[I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]]; e = np.r_[e, e[:, ::-1]]
    A = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr(); A.data[:] = 1
    return sp.diags(np.asarray(A.sum(1)).ravel()) - A
def dense_w(m, p):
    W = np.zeros((len(p['P']), len(m.jn))); J = p['J'].astype(int); w = p['W'] / 255.0
    for k in range(4): np.add.at(W, (np.arange(len(J)), J[:, k]), w[:, k])
    return W
def to4(W):
    J = np.argsort(-W, 1)[:, :4]; w = np.take_along_axis(W, J, 1); w = w / w.sum(1, keepdims=True)
    q = np.round(w * 255).astype(int); q[:, 0] += 255 - q.sum(1)  # exact sum 255
    J = np.where(q > 0, J, 0); return J.astype(np.uint8), q.astype(np.uint8)
def fix(m, pi=2, R=0.15, mid_pelvis=0.7, mid_w=0.012, center=(0, 0.83, 0.005), sy=1.0, radii=None, ymax=0.95, rzb=None):
    p = m.prims[pi]; P = m.skin(None, pi); W0 = dense_w(m, p)
    wid = weld(P); nU = wid.max() + 1
    PU = np.zeros((nU, 3)); PU[wid] = P; WU = np.zeros((nU, W0.shape[1])); WU[wid] = W0
    IU = wid[p['I']]; L = lap(IU, nU)
    c = np.array(center); d = (PU - c) * np.array([1, sy, 1]); r = np.linalg.norm(d, axis=1)
    if radii is not None: r = np.linalg.norm((PU - c) / np.array(radii), axis=1) * R
    if rzb is not None:
        dd = PU - c; dd[:, 2] = np.where(dd[:, 2] < 0, dd[:, 2] * R / rzb, dd[:, 2]); r = np.linalg.norm(dd, axis=1)
    inner = (r < R) & (PU[:, 1] < ymax)
    mid = inner & (np.abs(PU[:, 0]) < mid_w) & (PU[:, 1] < 0.90) & (mid_w > 0)
    free = inner & ~mid
    T = WU.copy(); jp, jl, jr = m.jn.index('pelvis'), m.jn.index('leftThigh'), m.jn.index('rightThigh')
    T[mid] = 0; T[mid, jp] = mid_pelvis; T[mid, jl] = T[mid, jr] = (1 - mid_pelvis) / 2
    fi = np.where(free)[0]; ci = np.where(~free)[0]
    Lff = L[fi][:, fi].tocsc(); Lfc = L[fi][:, ci]
    X = spl.splu(Lff).solve(-(Lfc @ T[ci]))
    T[fi] = np.clip(X, 0, None); T /= T.sum(1, keepdims=True)
    Wn = T[wid]; return Wn, inner[wid], W0
def apply(m, pi, Wn):
    p = m.prims[pi]; J, q = to4(Wn); p['J'][:] = J; p['W'][:] = q
def metrics(m, fr, pi=2, region=None, W=None):
    """crease: max dihedral (deg) between adjacent welded tris inside region minus rest; flips: tris with normal reversed vs rest local frame"""
    p = m.prims[pi]; P0 = m.skin(None, pi); P1 = m.skin(fr, pi, W)
    I = p['I']; wid = weld(P0); IU = wid[I]
    keep = region[I].all(1) if region is not None else np.ones(len(I), bool)
    def nrm(P):
        n = np.cross(P[I[:, 1]] - P[I[:, 0]], P[I[:, 2]] - P[I[:, 0]]); a = np.linalg.norm(n, axis=1); return n / np.maximum(a, 1e-12)[:, None], a
    n0, a0 = nrm(P0); n1, a1 = nrm(P1)
    # adjacency via welded edges
    from collections import defaultdict
    E = defaultdict(list)
    for t in np.where(keep)[0]:
        a, b, c = IU[t]
        for e in ((a, b), (b, c), (c, a)): E[(min(e), max(e))].append(t)
    pr = np.array([v[:2] for v in E.values() if len(v) >= 2])
    d0 = np.degrees(np.arccos(np.clip((n0[pr[:, 0]] * n0[pr[:, 1]]).sum(1), -1, 1)))
    d1 = np.degrees(np.arccos(np.clip((n1[pr[:, 0]] * n1[pr[:, 1]]).sum(1), -1, 1)))
    ex = d1 - d0
    st = a1[keep] / np.maximum(a0[keep], 1e-12)
    return dict(crease_p99=float(np.percentile(ex, 99)), crease_max=float(ex.max()), n_sharp=int((ex > 60).sum()),
                squash=int((st < 0.3).sum()), stretch=int((st > 3).sum()))
def bumpiness(m, fr, W, region_r=0.2, pi=2, center=(0, 0.83, 0.005)):
    """umbrella-Laplacian magnitude (normalised by local edge length) in deformed pose minus rest; p99 / max inside crotch sphere"""
    p = m.prims[pi]; P0 = m.skin(None, pi); wid = weld(P0); nU = wid.max() + 1
    P1 = m.skin(fr, pi, W); A = np.zeros((nU, 3)); A[wid] = P0; B = np.zeros((nU, 3)); B[wid] = P1
    L = lap(wid[p['I']], nU); deg = np.asarray(L.diagonal())
    def k(X):
        lx = (L @ X) / deg[:, None]
        # mean neighbour edge length
        Ad = (L != 0).astype(float); e = Ad.multiply(0)
        return np.linalg.norm(lx, axis=1)
    I = wid[p['I']]; el = np.zeros(nU); cnt = np.zeros(nU)
    for a, b in ((0, 1), (1, 2), (2, 0)):
        d = np.linalg.norm(A[I[:, a]] - A[I[:, b]], axis=1); np.add.at(el, I[:, a], d); np.add.at(cnt, I[:, a], 1)
    el = el / np.maximum(cnt, 1)
    reg = np.linalg.norm(A - np.array(center), axis=1) < region_r
    dk = (k(B) - k(A)) / np.maximum(el, 1e-6)
    v = dk[reg]; return float(np.percentile(v, 99)), float(np.percentile(v, 99.9)), float(v.max())
