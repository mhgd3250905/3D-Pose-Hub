import numpy as np
import scipy.sparse as sp

def vertex_normals(p, f):
    fn = np.cross(p[f[:, 1]] - p[f[:, 0]], p[f[:, 2]] - p[f[:, 0]])  # area weighted
    n = np.zeros_like(p)
    for k in range(3): np.add.at(n, f[:, k], fn)
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)

def adjacency(n, f):
    r = np.concatenate([f[:, 0], f[:, 1], f[:, 2], f[:, 1], f[:, 2], f[:, 0]])
    c = np.concatenate([f[:, 1], f[:, 2], f[:, 0], f[:, 0], f[:, 1], f[:, 2]])
    A = sp.coo_matrix((np.ones(len(r)), (r, c)), shape=(n, n)).tocsr()
    A.data[:] = 1.0
    return A

def umbrella(A):
    d = np.asarray(A.sum(1)).ravel()
    return sp.diags(1.0 / np.maximum(d, 1)) @ A

def smooth(p, W, weight, iters=10, lam=0.5, mu=-0.53):
    """Taubin smoothing; weight (n,) in 0..1 scales the step per vertex."""
    w = weight[:, None]
    for _ in range(iters):
        p = p + lam * w * (W @ p - p)
        p = p + mu * w * (W @ p - p)
    return p

def laplace(p, W, weight, iters=10, lam=0.5):
    w = weight[:, None]
    for _ in range(iters): p = p + lam * w * (W @ p - p)
    return p

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
