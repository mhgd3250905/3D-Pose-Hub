# Step 1: MakeHuman/MPFB2 (CC0) base mesh -> male young, mannequin head, smoothed feet, kept 102-bone rig, 4-influence weights,
# garment fields. Output: out/rest.npz  (units m, Y up, +Z front, body left +X, feet on y=0)
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, json, trimesh, scipy.sparse as sp
import mh
OUT = WORK + '/out/rest.npz'
DROP = ['breast', 'eye', 'jaw', 'levator', 'oculi', 'orbicularis', 'oris', 'risorius', 'special', 'temporalis', 'tongue']
keep = lambda n: not any(n.startswith(p) for p in DROP)
V, F, G = mh.build_base(muscle=0.35)
rig = json.load(open(mh.SRC + '/rig.default.json'))
P = mh.rig_points(V, F, G, rig)
NB = 13380
body = np.array([f for f, g in zip(F, G) if g == 'body'])
T = np.concatenate([body[:, [0, 1, 2]], body[:, [0, 2, 3]]])
X = V[:NB] * 0.1
ymin = X[:, 1].min(); X[:, 1] -= ymin
heads = {k: v[0] * 0.1 - [0, ymin, 0] for k, v in P.items()}
tails = {k: v[1] * 0.1 - [0, ymin, 0] for k, v in P.items()}
# bone order: parents first
names = []
def add(n):
    if n in names: return
    p = rig[n]['parent']
    if p: add(p)
    names.append(n)
for n in rig:
    if keep(n): add(n)
idx = {n: i for i, n in enumerate(names)}
parent = [idx[rig[n]['parent']] if rig[n]['parent'] else -1 for n in names]
# weights: dropped bones fold into their nearest kept ancestor
W = np.zeros((NB, len(names)))
wj = json.load(open(mh.SRC + '/weights.default.json'))['weights']
for b, lst in wj.items():
    t = b
    while not keep(t): t = rig[t]['parent']
    j = idx[t]
    for vi, w in lst:
        if vi < NB: W[vi, j] += w
W /= np.maximum(W.sum(1, keepdims=True), 1e-9)
# mesh adjacency (uniform Laplacian)
m0 = trimesh.Trimesh(X, T, process=False)
E = m0.edges_unique
A = sp.coo_matrix((np.ones(len(E) * 2), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(NB, NB)).tocsr()
deg = np.asarray(A.sum(1)).ravel()
def lap(p): return (A @ p) / deg[:, None] - p
def taubin(p, s, it, lam=0.5, mu=-0.53):
    p = p.copy()
    for _ in range(it):
        p += s[:, None] * lam * lap(p); p += s[:, None] * mu * lap(p)
    return p
# mannequin head: a clean egg-shaped head (icosphere radially fitted to the convex hull of the original head, smoothed),
# rigid on the head bone; the original face faces are removed. Built here, appended as extra vertices/faces below.
wh = W[:, idx['head']]
hc = (heads['head'] + tails['head']) / 2 + [0, -0.012, 0.004]
hv = X[wh > 0.6]
hull = trimesh.convex.convex_hull(hv)
ico = trimesh.creation.icosphere(subdivisions=4)
dirs = ico.vertices
loc, ri, ti = hull.ray.intersects_location(np.repeat(hc[None], len(dirs), 0), dirs, multiple_hits=False)
rad = np.full(len(dirs), np.nan); rad[ri] = np.linalg.norm(loc - hc, axis=1)
rad = np.nan_to_num(rad, nan=np.nanmean(rad))
Ei = ico.edges_unique; Ai = sp.coo_matrix((np.ones(len(Ei)*2),(np.r_[Ei[:,0],Ei[:,1]],np.r_[Ei[:,1],Ei[:,0]])),shape=(len(dirs),)*2).tocsr(); di=np.asarray(Ai.sum(1)).ravel()
for _ in range(40): rad = rad + 0.5 * ((Ai @ rad) / di - rad)
rad *= 1.0
HX = hc + dirs * rad[:, None]
keepf = np.ones(len(ico.faces), bool)
HT = ico.faces[keepf]
used = np.unique(HT); remap = -np.ones(len(HX), int); remap[used] = np.arange(len(used))
HX = HX[used]; HT = remap[HT]
# drop original faces fully inside the new head
inside = wh > 0.85
# (no faces removed: everything head-weighted is tucked inside the new head)
# tuck the remaining head-weighted skin (neck top, behind the ears) inside the new head
from scipy.spatial import cKDTree
kd = cKDTree(dirs)
for i in np.where(wh > 0.2)[0]:
    d = X[i] - hc; r = np.linalg.norm(d); R = rad[kd.query(d / r)[1]]
    if r > 0.96 * R: X[i] = hc + d * (0.96 * R / r)

# feet: shoe-like volume (smooth toes, slight inflate) on foot/toe weighted verts
wf = sum(W[:, idx[n]] for n in names if n.startswith('toe') or n.startswith('foot'))
sf = np.clip((wf - 0.2) / 0.6, 0, 1) * (X[:, 1] < 0.16)
X = taubin(X, sf * 0.9, 25)
nrm = trimesh.Trimesh(X, T, process=False).vertex_normals
X = X + nrm * (0.006 * sf)[:, None]
# re-ground (soles at y=0)
dy = X[:, 1].min(); X[:, 1] -= dy
for d in (heads, tails):
    for k in d: d[k] = d[k] - [0, dy, 0]
# append head (rigid on head bone)
nH = len(HX); HX = HX - [0, dy, 0] + [0, 0, 0]
X = np.vstack([X, HX]); T = np.vstack([T, HT + NB])
Wh = np.zeros((nH, len(names))); Wh[:, idx['head']] = 1; W = np.vstack([W, Wh])
isHead = np.r_[np.zeros(NB, bool), np.ones(nH, bool)]
# top-4 influences
o = np.argsort(-W, axis=1)[:, :4]
w4 = np.take_along_axis(W, o, 1); w4 /= w4.sum(1, keepdims=True)
H = np.array([heads[n] for n in names]); TL = np.array([tails[n] for n in names])
np.savez(OUT, isHead=isHead, X=X, T=T, W=W, J4=o, W4=w4, names=np.array(names), parent=np.array(parent), H=H, TL=TL)
print('verts', len(X), 'tris', len(T), 'bones', len(names), 'height', X[:, 1].max(), 'head ok')
