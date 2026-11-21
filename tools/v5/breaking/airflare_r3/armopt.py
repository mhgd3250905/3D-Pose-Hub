"""vectorised arm twist metrics (same definitions as armfix / check_move) over a grid of
b = elbow swing about the shoulder->wrist line (wrist fixed) and g = forearm roll about its own axis."""
import math, numpy as np
X3, Y3, Z3 = np.eye(3)


def rotv(ax, ang):
    """ax (...,3) unit, ang (...) rad -> (...,3,3)"""
    K = np.zeros(ax.shape[:-1] + (3, 3)); x, y, z = ax[..., 0], ax[..., 1], ax[..., 2]
    K[..., 0, 1] = -z; K[..., 0, 2] = y; K[..., 1, 0] = z; K[..., 1, 2] = -x; K[..., 2, 0] = -y; K[..., 2, 1] = x
    s = np.sin(ang)[..., None, None]; c = np.cos(ang)[..., None, None]
    return np.eye(3) + s * K + (1 - c) * (K @ K)


def nrm(v): return v / np.linalg.norm(v, axis=-1, keepdims=True)


def swingm(a, b):
    ax = np.cross(a, b); s = np.linalg.norm(ax, axis=-1); c = np.sum(a * b, -1)
    axn = ax / np.maximum(s, 1e-9)[..., None]; return rotv(axn, np.arctan2(s, c))


def metrics(T, sg, S, E, H, U0, F0, Hw, B, G):
    """B, G: 1-D arrays (deg). returns hw, pr, ht, wr arrays (len(B), len(G)) and elbow displacement (len(B))"""
    ax = (H - S) / np.linalg.norm(H - S)
    Rb = rotv(np.broadcast_to(ax, (len(B), 3)), np.radians(B))            # (nb,3,3)
    U = Rb @ U0; F1 = Rb @ F0; e = nrm(np.einsum('bij,j->bi', Rb, E - S)); f = nrm(np.einsum('bij,j->bi', Rb, H - E))
    # humerus twist (torso frame)
    el = e @ T; cl = U[:, :, 2] @ T
    c0 = np.einsum('bij,j->bi', swingm(np.broadcast_to(sg * X3, el.shape), el), Z3)
    c0 = nrm(c0 - el * np.sum(c0 * el, -1, keepdims=True)); ci = nrm(cl - el * np.sum(cl * el, -1, keepdims=True))
    hw = np.degrees(np.arctan2(np.sum(np.cross(c0, ci) * el, -1), np.sum(c0 * ci, -1)))   # (nb,)
    # forearm roll
    Rg = rotv(np.broadcast_to(f[:, None, :], (len(B), len(G), 3)), np.radians(G)[None, :].repeat(len(B), 0))
    F = Rg @ F1[:, None]                                                    # (nb,ng,3,3)
    R = swingm(e, f)                                                        # (nb,3,3)
    r0 = np.einsum('bij,bj->bi', R, -U[:, :, 1]); r0 = nrm(r0 - f * np.sum(r0 * f, -1, keepdims=True))
    r = -F[..., :, 1]; r = nrm(r - f[:, None] * np.sum(r * f[:, None], -1, keepdims=True))
    pr = np.degrees(np.arctan2(np.sum(np.cross(r0[:, None], r) * f[:, None], -1), np.sum(r0[:, None] * r, -1)))
    # hand vs forearm twist about the forearm bone's long axis (sg*X)
    M = np.swapaxes(F, -1, -2) @ Hw
    w_ = np.sqrt(np.maximum(0, 1 + M[..., 0, 0] + M[..., 1, 1] + M[..., 2, 2])) / 2
    v_ = np.stack([M[..., 2, 1] - M[..., 1, 2], M[..., 0, 2] - M[..., 2, 0], M[..., 1, 0] - M[..., 0, 1]], -1) / (4 * w_[..., None] + 1e-12)
    ht = np.degrees(2 * np.arctan2(v_ @ (sg * X3), w_)); ht = (ht + 180) % 360 - 180
    wr = np.degrees(np.arccos(np.clip(np.sum(f[:, None] * (Hw @ (sg * X3)), -1), -1, 1))) * np.ones_like(ht)
    rr = np.linalg.norm((E - S) - ax * ((E - S) @ ax)); disp = rr * np.abs(np.radians(B))
    return np.broadcast_to(hw[:, None], ht.shape), pr, ht, wr, disp, U, F
