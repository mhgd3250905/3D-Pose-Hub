"""r21 extra data channels for the fit (precomputed once, cached):
 - depth: VDA relative inverse depth (de-normalised per depth/README.md) sampled at the 2D keypoints -> ordinal front/back
   constraints for left/right limb pairs (shoulder, elbow, wrist, hip, knee, ankle) when the depth difference is >= 3 % of the
   person's median inverse depth and both points lie inside the person mask.
 - mask: outside-distance transform of the person mask (half resolution, px) -> silhouette consistency of projected rig points.
 - frame weight: side_review == 'uncertain' frames get 0.75 on the 2D term (labels.txt uncertain spans are carried by the
   per-keypoint flags, see load.py)."""
import os, json, numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
from cfg import P as PR, FR, N, MIRROR, CLIP
from rig import KP_IDS
DEN = {'A': 0.00034155545504258527, 'B': 0.00013642363847689033}[CLIP]   # raw model relative inverse depth per uint16 step
PAIRS = [(5, 6), (7, 8), (9, 10), (11, 12), (13, 14), (15, 16)]
CACHE = f'/workspace/work/b2000/r21/w{CLIP}/channels.npz'


def build(K, C):
    if os.path.exists(CACHE):
        z = np.load(CACHE); return {k: z[k] for k in z.files}
    DT = []; DP = np.zeros((N, len(PAIRS), 4))   # ia, ib, sign, weight
    for i, f in enumerate(FR):
        m = np.array(Image.open(PR + f'mask/{f:05d}.png').convert('L')) > 127
        d = np.array(Image.open(PR + f'depth/{f:05d}.png')).astype(np.float64) * DEN
        if MIRROR: m = m[:, ::-1]; d = d[:, ::-1]
        dt = distance_transform_edt(~m); DT.append(dt[::2, ::2].astype(np.float16))
        med = np.median(d[m]) if m.any() else 1.0
        def smp(j):
            x, y = int(round(K[i, j, 0])), int(round(K[i, j, 1]))
            if C[i, j] <= 0 or not (0 <= x < m.shape[1] and 0 <= y < m.shape[0]) or not m[y, x]: return None
            win = d[max(0, y - 2):y + 3, max(0, x - 2):x + 3]; mw = m[max(0, y - 2):y + 3, max(0, x - 2):x + 3]
            return float(np.median(win[mw]))
        for k, (a, b) in enumerate(PAIRS):
            da, db = smp(a), smp(b)
            DP[i, k, :2] = KP_IDS.index(a), KP_IDS.index(b)
            if da is None or db is None: continue
            rel = (da - db) / med
            if abs(rel) >= 0.03: DP[i, k, 2] = np.sign(rel); DP[i, k, 3] = min(1.0, abs(rel) / 0.08)
    out = {'DT': np.stack(DT), 'DP': DP}
    np.savez_compressed(CACHE, **out); return out


def sample_dt(DT, uv):
    """bilinear outside-distance (px, full res) at (N,K,2) frame pixels"""
    n = np.arange(uv.shape[0])[:, None]; x = np.clip(uv[..., 0] / 2, 0, DT.shape[2] - 1.001); y = np.clip(uv[..., 1] / 2, 0, DT.shape[1] - 1.001)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = x - x0; fy = y - y0
    g = lambda yy, xx: DT[n, yy, xx].astype(np.float64)
    v = (g(y0, x0) * (1 - fx) + g(y0, x0 + 1) * fx) * (1 - fy) + (g(y0 + 1, x0) * (1 - fx) + g(y0 + 1, x0 + 1) * fx) * fy
    return 2 * v
