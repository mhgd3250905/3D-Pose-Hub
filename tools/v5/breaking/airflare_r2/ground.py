import numpy as np
from contacts import WIN, mask
HOFF = {'rightHand': 0.05, 'leftHand': 0.05, 'rightFoot': 0.08, 'leftFoot': 0.08}
def fit_ground(P, verbose=True):
    pts = []; hs = []; tags = []
    for b in WIN:
        m = mask(b); pts.append(P[b][m]); hs += [HOFF[b]] * m.sum(); tags += [b] * m.sum()
    X = np.concatenate(pts); hs = np.array(hs); n = np.array([0, 1.0, 0]); d = 0
    for it in range(20):
        Y = X - hs[:, None] * n; c = Y.mean(0); U, S, Vt = np.linalg.svd(Y - c); n = Vt[2] * np.sign(Vt[2][1]); d = n @ c
        r = Y @ n - d; keep = np.abs(r) < max(0.05, 2.5 * np.std(r))
        Y2 = Y[keep]; c = Y2.mean(0); U, S, Vt = np.linalg.svd(Y2 - c); n = Vt[2] * np.sign(Vt[2][1]); d = n @ c
    r = (X - hs[:, None] * n) @ n - d
    if verbose:
        tags = np.array(tags)
        for b in WIN: print(b, 'resid mean %.3f sd %.3f' % (r[tags == b].mean(), r[tags == b].std()))
        print('n', n.round(3), 'd %.3f' % d, 'camera height %.2f' % (-d), 'pitch deg %.1f' % np.degrees(np.arcsin(n[2])))
    return n, d
