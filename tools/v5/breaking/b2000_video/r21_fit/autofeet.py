"""foot contacts from 2D in the stepping phase: ankle+heel+bigtoe (drift-corrected) nearly still and the lower foot."""
import numpy as np
from cfg import FR
from load import kp2d, drift
K, C, _, _, _ = kp2d(); M = drift()
Kr = np.einsum('nij,nkj->nki', M[:, :, :2], K) + M[:, None, :, 2]
ids = {'leftFoot': [15, 17, 19], 'rightFoot': [16, 20, 22]}
import sys
a, b = int(sys.argv[1]) - FR[0], int(sys.argv[2]) - FR[0]
low = np.maximum(Kr[:, 15, 1], Kr[:, 16, 1])
out = {}
for nm, js in ids.items():
    p = Kr[:, js].mean(1); v = np.zeros(len(p)); v[1:-1] = 0.5 * np.linalg.norm(p[2:] - p[:-2], axis=1)
    c = (v < 3.0) & (Kr[:, js[0], 1] > low - 18)
    runs = []; i = a
    while i <= b:
        if c[i]:
            j = i
            while j + 1 <= b and c[j + 1]: j += 1
            if j - i >= 2: runs.append((FR[i], FR[j]))
            i = j + 1
        else: i += 1
    out[nm] = runs
    print(nm, runs, ' '.join('%d:%.0f' % (FR[k], v[k]) for k in range(a, b + 1, 2)))
