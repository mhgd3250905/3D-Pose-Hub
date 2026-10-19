# Step 3: clean the projected labels (abs / lats geometric fill where BodyParts3D has no mesh), smooth, mirror L->R.
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, trimesh, scipy.sparse as sp, json
from scipy.spatial import cKDTree
D = np.load(WORK + '/out/rest.npz'); Y = np.load(WORK + '/out/posed_bp.npy'); NB = len(Y)
L = np.load(WORK + '/out/labels_raw.npz'); SUP = L['SUP'].copy(); DP = L['DP'].copy()
X = D['X'][:NB]; T = D['T']; T = T[(T < NB).all(1)]
N = trimesh.Trimesh(Y, T, process=False).vertex_normals
PUB, XIPH, CREST, SCAP = 0.885, 1.25, 1.036, 1.262
def absHW(y):  # repo muscle-map rectus outline, remapped from the old body (0.832..1.24) to BodyParts3D landmarks
    u = 0.832 + (y - PUB) / (XIPH - PUB) * (1.24 - 0.832)
    t = np.clip((1.03 - u) / 0.20, 0, 1); v = np.clip((u - 1.08) / 0.14, 0, 1)
    return 0.090 - 0.064 * t ** 1.6 - 0.014 * v * v * (3 - 2 * v)
x, y, z = Y[:, 0], Y[:, 1], Y[:, 2]
left = x > -0.004
absm = left & (y > PUB) & (y < XIPH) & (np.abs(x) < absHW(y) * 0.95) & (N[:, 2] > 0.35) & np.isin(SUP, [0, 13])
SUP[absm] = 12
latm = left & (y > CREST - 0.03) & (y < SCAP + 0.02) & (N[:, 2] < 0.1) & (x > 0.05) & ((SUP == 0) | ((SUP == 17) & (x > 0.075)) | ((SUP == 13) & (z < -0.03)) | ((SUP == 15) & (y < SCAP - 0.04) & (x > 0.07)))
SUP[latm] = 16
erm = left & (y > CREST - 0.06) & (y < 1.22) & (np.abs(x) < 0.062) & (N[:, 2] < -0.3) & (np.isin(SUP, [0, 16]) | ((SUP == 15) & (y < 1.16)))
SUP[erm] = 17
# shoes: no muscle IDs on the feet (painted shoe)
W = D['W'][:NB]; nm = list(D['names'])
wf = sum(W[:, i] for i, n in enumerate(nm) if n.startswith('foot') or n.startswith('toe'))
SUP[(wf > 0.5)] = 0; DP[(wf > 0.5)] = 0
# mesh adjacency
E = trimesh.Trimesh(Y, T, process=False).edges_unique
A = sp.coo_matrix((np.ones(len(E) * 2), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(NB, NB)).tocsr()
def modefilter(lab, it, keep0=True):
    lab = lab.copy()
    for _ in range(it):
        new = lab.copy()
        for i in np.where(left)[0]:
            nb = A.indices[A.indptr[i]:A.indptr[i + 1]]
            c = np.bincount(np.r_[lab[nb], lab[i]], minlength=64)
            if keep0 and lab[i] == 0 and c[0] >= 2: continue
            m = c.argmax()
            if c[m] > c[lab[i]]: new[i] = m
        lab = new
    return lab
SUP = modefilter(SUP, 3); DP = modefilter(DP, 2)
# remove islands < 12 verts
for _ in range(2):
    for g in np.unique(SUP[left]):
        if g == 0: continue
        m = (SUP == g) & left
        sub = A[m][:, m]; nc, cl = sp.csgraph.connected_components(sub)
        ids = np.where(m)[0]
        for c in range(nc):
            vs = ids[cl == c]
            if len(vs) < 12:
                nb = np.unique(A[vs].indices); nb = nb[(SUP[nb] != g)]
                SUP[vs] = np.bincount(SUP[nb]).argmax() if len(nb) else 0
# mirror L -> R using the rest mesh symmetry
kd = cKDTree(X); d, j = kd.query(X * [-1, 1, 1])
print('mirror max err mm', round(d.max() * 1000, 2))
right = X[:, 0] < -0.004
SUP[right] = SUP[j[right]]; DP[right] = DP[j[right]]
np.savez(WORK + '/out/labels.npz', SUP=SUP, DP=DP)
print('groups', {int(g): int(c) for g, c in zip(*np.unique(SUP, return_counts=True))})
