
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
def shade(X, T, cols=None, views=('front', 'side', 'back'), out='p.png', size=5, crop=None, extra=None):
    fig, axs = plt.subplots(1, len(views), figsize=(size * len(views), size * 1.6), facecolor='#202020')
    if len(views) == 1: axs = [axs]
    for ax, v in zip(axs, views):
        if v == 'front': R = np.eye(3)
        elif v == 'back': R = np.diag([-1, 1, -1])
        elif v == 'side': R = np.array([[0, 0, 1], [0, 1, 0], [-1, 0, 0]])  # looking from +X (body left)
        elif v == 'rside': R = np.array([[0, 0, -1], [0, 1, 0], [1, 0, 0]])
        P = X @ R.T
        tri = P[T]; n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-12
        vis = n[:, 2] > 0; L = np.array([-0.4, 0.6, 0.7]); L /= np.linalg.norm(L)
        b = np.clip(n @ L, 0, 1) * 0.7 + 0.3
        c = np.ones((len(T), 3)) * 0.75 if cols is None else cols
        fc = c * b[:, None]
        o = np.argsort(tri[:, :, 2].mean(1)); o = o[vis[o]]
        ax.add_collection(PolyCollection(tri[o][:, :, :2], facecolors=fc[o], edgecolors='none'))
        if extra is not None:
            for pts, col in extra: q = pts @ R.T; ax.scatter(q[:, 0], q[:, 1], s=4, c=col, zorder=5)
        if crop: ax.set_xlim(crop[0], crop[1]); ax.set_ylim(crop[2], crop[3])
        else: ax.set_xlim(P[:, 0].min() - .05, P[:, 0].max() + .05); ax.set_ylim(P[:, 1].min() - .05, P[:, 1].max() + .05)
        ax.set_aspect('equal'); ax.axis('off')
    plt.tight_layout(); plt.savefig(out, dpi=60, facecolor='#202020'); plt.close()
