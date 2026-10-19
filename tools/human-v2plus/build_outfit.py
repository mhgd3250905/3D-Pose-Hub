# training-human-v2plus: opt-in "compression" outfit = the v2 tee + shorts shrink-wrapped by smooth displacement fields.
#   python3 build_outfit.py <rest.json from probe.mjs> <out.json>
# There is no skin under the v2 tee/shorts (Coach_Body has arms from the sleeve cuff down and legs from the shorts hem down,
# and no torso), so the garments themselves are tightened:
#  - torso (tee): radial scale around a vertical axis per (angle, height); the waist/abdomen tapers from the chest section
#    (y 1.20, unchanged) to the shorts' waist section, and below the shorts' waistband the tee hem lies on the shorts with
#    a small clearance (a compression top over tights). Chest, shoulders, neck and the V-neck/collar zone (y >= 1.24) are
#    untouched, so training-collar.js is not affected.
#  - sleeves (tee + sleeve trim): scaled toward the upper-arm axis so the cuff sits on the arm skin + clearance.
#  - shorts legs: scaled toward the thigh axis so the hem sits on the thigh skin + clearance (no step into the tights).
# Fields are smooth functions of the rest position, so the solidified inner/outer shells and UV-seam duplicates move together.
# The tee hem copies the shorts' skin weights (nearest shorts vertex) so the two layers bend together in deep poses.
# Output: rest-world displacements (1e-5 m) + target normals per moved vertex, new hem weights, sleeve-cuff planes (for the short-sleeve paint).
import json, sys, numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter1d

rest = json.load(open(sys.argv[1])); OUT = sys.argv[2]
M = rest['meshes']
def arr(k, f, c=3): return np.array(M[k][f], dtype=np.float64).reshape(-1, c)
TEE, TRIM, SH, BODY = 'Mesh005', 'Mesh005_1', 'Coach_Training_Shorts', 'Coach_Body'
P = {k: arr(k, 'P') for k in (TEE, TRIM, SH, BODY)}
Nrm = {k: arr(k, 'N') for k in (TEE, TRIM, SH)}
def sstep(a, b, x): u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)
def bone_mass(k, pat):
    J = arr(k, 'J', 4).astype(int); W = arr(k, 'W', 4); names = M[k]['bones']
    hit = np.array([any(p in n for p in pat) for n in names]); return (W * hit[J]).sum(1)

GAP_TEE = 0.0065     # tee outer surface above the shorts' outer surface (tee hem fold ~5 mm thick -> ~1.5 mm inner clearance)
GAP_SLEEVE = 0.0020  # sleeve cuff above arm skin (single-sheet trim)
GAP_LEG = 0.0020     # shorts outer surface above thigh skin at the hem; the 3 mm inner shell/rim tucks inside the open skin tube

# ---------------- torso field ----------------
NA = 72; YS = np.round(np.arange(0.84, 1.30001, 0.005), 4)
def zc_of(y): return np.interp(y, [0.84, 0.90, 0.98, 1.06, 1.20, 1.30], [0.010, 0.012, 0.030, 0.045, 0.035, 0.020])
def polar(Pt): zc = zc_of(Pt[:, 1]); return np.arctan2(Pt[:, 0], Pt[:, 2] - zc), np.hypot(Pt[:, 0], Pt[:, 2] - zc)
def envelope(Pt, mask):
    th, r = polar(Pt); E = np.full((len(YS), NA), np.nan)
    ai = ((th + np.pi) / (2 * np.pi) * NA).astype(int) % NA
    for j, y in enumerate(YS):
        s = mask & (np.abs(Pt[:, 1] - y) < 0.004)
        for a in range(NA):
            q = s & (ai == a)
            if q.any(): E[j, a] = r[q].max()
    # fill gaps around the circle, then smooth (circular in angle)
    for j in range(len(YS)):
        row = E[j]; ok = ~np.isnan(row)
        if ok.sum() >= 3: x = np.arange(NA); E[j] = np.interp(x, x[ok], row[ok], period=NA)
    E = gaussian_filter1d(E, 1.2, axis=1, mode='wrap')
    return E
teeTorso = (np.abs(P[TEE][:, 0]) < 0.20) & ~((np.abs(P[TEE][:, 0]) > 0.135) & (P[TEE][:, 1] > 1.17))
envT = envelope(P[TEE], teeTorso)
shTorso = P[SH][:, 1] > 0.86
envS = envelope(P[SH], shTorso)
jy = lambda y: int(np.argmin(np.abs(YS - y)))
design = envT.copy()
top, low = jy(1.20), jy(0.955)
for j, y in enumerate(YS):
    if y >= 1.20: continue
    if y < 0.975:
        if not np.isnan(envS[j]).all(): design[j] = envS[j] + GAP_TEE
        continue
    u = (1.20 - y) / (1.20 - 0.955); e = 1 - (1 - min(u, 1.0)) ** 1.5      # drops a bit faster under the pecs
    taper = (1 - e) * envT[top] + e * (envS[low] + GAP_TEE)
    w = 1 - 0.6 * np.exp(-((y - 1.065) / 0.05) ** 2) * 0.006 / np.maximum(taper, 1e-3)   # -3.6 mm extra at the waist line
    design[j] = np.minimum(envT[j], taper * w)
valid = ~np.isnan(envT)
S = np.where(valid, design / np.where(valid, envT, 1), 1.0)
S = np.nan_to_num(S, nan=1.0)
S[YS >= 1.24] = 1.0
S = np.clip(S, 0.78, 1.03)
S = gaussian_filter1d(S, 1.5, axis=1, mode='wrap'); S = gaussian_filter1d(S, 2.0, axis=0, mode='nearest')
S[YS >= 1.24] = 1.0
blendTop = 1 - sstep(1.20, 1.24, YS)                     # identity at the chest/collar
S = 1 + (S - 1) * blendTop[:, None]
def torso_scale(Pt):
    th, _ = polar(Pt); a = (th + np.pi) / (2 * np.pi) * NA - 0.5
    a0 = np.floor(a).astype(int); fa = a - a0; yj = np.clip((Pt[:, 1] - YS[0]) / 0.005, 0, len(YS) - 1.001); y0 = np.floor(yj).astype(int); fy = yj - y0
    g = lambda yy, aa: S[yy, aa % NA]
    s = (1 - fy) * ((1 - fa) * g(y0, a0) + fa * g(y0, a0 + 1)) + fy * ((1 - fa) * g(y0 + 1, a0) + fa * g(y0 + 1, a0 + 1))
    return np.where(Pt[:, 1] < 1.24, s, 1.0)
def apply_torso(Pt, s):
    zc = zc_of(Pt[:, 1]); Q = Pt.copy(); Q[:, 0] = Pt[:, 0] * s; Q[:, 2] = zc + (Pt[:, 2] - zc) * s; return Q

# ---------------- limb tube fields (sleeve, thigh) ----------------
def tube(A, E, ref):
    A = np.array(A); E = np.array(E); u = (E - A) / np.linalg.norm(E - A); e0 = np.array(ref, float); e0 -= u * (e0 @ u); e0 /= np.linalg.norm(e0); e1 = np.cross(u, e0)
    def f(Pt): d = Pt - A; t = d @ u; rr = d - np.outer(t, u); return t, np.arctan2(rr @ e1, rr @ e0), np.linalg.norm(rr, axis=1), rr
    return f, u
NB = 36
def ring_max(phi, rho, mask):
    ai = ((phi + np.pi) / (2 * np.pi) * NB).astype(int) % NB; out = np.full(NB, np.nan)
    for a in range(NB):
        q = mask & (ai == a)
        if q.any(): out[a] = rho[q].max()
    ok = ~np.isnan(out); x = np.arange(NB); out = np.interp(x, x[ok], out[ok], period=NB); return gaussian_filter1d(out, 1.0, mode='wrap')
def ring_eval(R, phi):
    a = (phi + np.pi) / (2 * np.pi) * NB - 0.5; a0 = np.floor(a).astype(int); fa = a - a0; return (1 - fa) * R[a0 % NB] + fa * R[(a0 + 1) % NB]

new = {k: P[k].copy() for k in (TEE, TRIM, SH)}
report = {}
# shorts legs first (the tee hem conforms to the shorts' torso part, which the leg field does not touch above y 0.76)
for sgn in (1, -1):
    f, u = tube([0.082 * sgn, 0.852, 0.006], [0.082 * sgn, 0.499, 0.007], [sgn, 0, 0])
    t, ph, rho, rr = f(P[SH]); side = (P[SH][:, 0] * sgn > 0.01) & (P[SH][:, 1] < 0.78)
    tb, pb, rb, _ = f(P[BODY]); skin = ring_max(pb, rb, (P[BODY][:, 0] * sgn > 0.0) & (np.abs(P[BODY][:, 1] - 0.620) < 0.013) & (rb < 0.12))
    hem = ring_max(ph, rho, side & (P[SH][:, 1] < 0.640))
    k_hem = (skin + GAP_LEG) / hem
    s = 1 + (ring_eval(k_hem, ph) - 1) * (1 - sstep(0.635, 0.735, P[SH][:, 1]))
    s = np.where(side, np.minimum(s, 1.025), 1.0)
    Q = P[SH] - rr + rr * s[:, None]
    new[SH] = np.where(side[:, None], Q, new[SH])
    report['shorts_hem_scale_' + ('L' if sgn > 0 else 'R')] = [round(float(k_hem.min()), 3), round(float(k_hem.max()), 3)]
# re-measure the shorts waist section after the leg change (unchanged above 0.76, but keep it honest)
envS = envelope(new[SH], new[SH][:, 1] > 0.86)
# tee torso
s = torso_scale(P[TEE]); armT = bone_mass(TEE, ['UpperArm'])
torsoW = 1 - np.clip(armT * 2.5, 0, 1)                     # sleeves take the sleeve field instead
s_t = 1 + (s - 1) * torsoW
new[TEE] = apply_torso(P[TEE], s_t)
report['torso_scale_range'] = [round(float(s_t.min()), 3), round(float(s_t.max()), 3)]
# sleeves (tee sleeve + trim) toward the upper-arm axis
cuffPlanes = {}
for sgn, nm in ((1, 'left'), (-1, 'right')):
    f, u = tube([0.188 * sgn, 1.370, -0.004], [0.234 * sgn, 1.118, 0.011], [sgn, 0, 0])
    tb, pb, rb, _ = f(P[BODY]); armSkin = (P[BODY][:, 0] * sgn > 0.12) & (rb < 0.1)
    tt, pt, rt, _ = f(P[TRIM]); trimSide = P[TRIM][:, 0] * sgn > 0
    tc = float(np.median(tt[trimSide]))
    skin = ring_max(pb, rb, armSkin & (np.abs(tb - (tc + 0.004)) < 0.012))
    cuff = ring_max(pt, rt, trimSide)
    k_cuff = np.minimum((skin + GAP_SLEEVE) / cuff, 1.03)
    for K in (TEE, TRIM):
        t, ph, rho, rr = f(P[K]); sideK = (P[K][:, 0] * sgn > 0.10)
        armw = np.clip(bone_mass(K, ['UpperArm']) * 2.0, 0, 1) if K == TEE else np.ones(len(t))
        g = sstep(0.045, tc - 0.01, t) * armw
        sk = 1 + (ring_eval(k_cuff, ph) - 1) * g
        Q = new[K] + (rr * sk[:, None] - rr)   # added on top of the torso field (tee); trim has no torso part
        new[K] = np.where(sideK[:, None], Q, new[K])
    report['sleeve_cuff_scale_' + nm] = [round(float(k_cuff.min()), 3), round(float(k_cuff.max()), 3)]
    # cuff plane (rest pose, after the shrink): points with dot(p - c, n) > 0 are below the cuff (toward the elbow)
    R = new[TRIM][trimSide]; c = R.mean(0); _, _, vt = np.linalg.svd(R - c); n = vt[2]
    if n @ u < 0: n = -n
    cuffPlanes[nm] = [round(float(x), 5) for x in (*n, float(n @ c))]

# ---------------- fold removal: masked Taubin smoothing (welded across UV seams) ----------------
def weld(Pt):
    key = np.round(Pt / 2e-5).astype(np.int64); u, inv = np.unique(key, axis=0, return_inverse=True); return inv.ravel(), len(u)
def taubin(K, mask, iters):
    Pt = new[K]; inv, nu = weld(P[K]); F = np.array(M[K]['index']).reshape(-1, 3)
    E = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]); E = inv[E]; E = E[E[:, 0] != E[:, 1]]; E = np.unique(np.sort(E, 1), axis=0)
    X = np.zeros((nu, 3)); cnt = np.zeros(nu); np.add.at(X, inv, Pt); np.add.at(cnt, inv, 1); X /= cnt[:, None]
    m = np.zeros(nu); np.maximum.at(m, inv, mask)
    deg = np.zeros(nu); np.add.at(deg, E[:, 0], 1); np.add.at(deg, E[:, 1], 1)
    def lap(X):
        S = np.zeros_like(X); np.add.at(S, E[:, 0], X[E[:, 1]]); np.add.at(S, E[:, 1], X[E[:, 0]]); return S / np.maximum(deg, 1)[:, None] - X
    for _ in range(iters):
        X = X + 0.50 * m[:, None] * lap(X); X = X - 0.53 * m[:, None] * lap(X)
    new[K] = np.where((mask > 0)[:, None], X[inv], Pt)
yS = P[SH][:, 1]
taubin(SH, sstep(0.645, 0.690, yS) * (1 - sstep(0.875, 0.915, yS)), 40)            # leg tubes + crotch/gusset, not the hem or waistband
yT = P[TEE][:, 1]; armT2 = np.clip(bone_mass(TEE, ['UpperArm']) * 2.5, 0, 1)
taubin(TEE, sstep(0.955, 0.995, yT) * (1 - sstep(1.15, 1.20, yT)) * (1 - armT2), 25)   # abdomen/waist folds; hem fold and chest untouched

# ---------------- limb hems follow the skin they sit on (weights) ----------------
Jb = arr(BODY, 'J', 4).astype(int); Wb = arr(BODY, 'W', 4); bb = M[BODY]['bones']
def copy_weights(K, ids, blend, src_idx, srcJ, srcW, srcB):
    J = arr(K, 'J', 4).astype(int); W = arr(K, 'W', 4); bk = M[K]['bones']; out = {}
    for i, b, s in zip(ids, blend, src_idx):
        acc = {}
        for k in range(4): acc[bk[J[i, k]]] = acc.get(bk[J[i, k]], 0) + (1 - b) * W[i, k]
        for k in range(4): acc[srcB[srcJ[s, k]]] = acc.get(srcB[srcJ[s, k]], 0) + b * srcW[s, k]
        out[int(i)] = acc
    return out
def pack(dct):
    WJ = {'idx': [], 'bones': [], 'w': []}
    for i in sorted(dct):
        top = sorted([(n, w) for n, w in dct[i].items() if w > 1e-6], key=lambda x: -x[1])[:4]; sm = sum(w for _, w in top)
        q = [round(w / sm * 255) for _, w in top]; q[0] += 255 - sum(q); WJ['idx'].append(i); WJ['bones'].append([n for n, _ in top]); WJ['w'].append(q)
    return WJ
legSkin = (np.abs(P[BODY][:, 0]) < 0.17) & (P[BODY][:, 1] > 0.45) & (P[BODY][:, 1] < 0.70)
treeLeg = cKDTree(P[BODY][legSkin]); legIdx = np.where(legSkin)[0]
bS = 1 - sstep(0.640, 0.700, yS); idsS = np.where(bS > 1e-3)[0]
_, nn = treeLeg.query(new[SH][idsS]); shortsW = copy_weights(SH, idsS, bS[idsS], legIdx[nn], Jb, Wb, bb)
armSkinAll = (np.abs(P[BODY][:, 0]) > 0.12) & (P[BODY][:, 1] > 1.0); treeArm = cKDTree(P[BODY][armSkinAll]); armIdx = np.where(armSkinAll)[0]
sleeveW = {}
for K in (TEE, TRIM):
    yk = P[K][:, 1]; bk_ = (np.clip(bone_mass(K, ['UpperArm']) * 2.0, 0, 1) if K == TEE else np.ones(len(yk))) * sstep(1.320, 1.285, yk) * (np.abs(P[K][:, 0]) > 0.14)
    ids = np.where(bk_ > 1e-3)[0]; _, nn = treeArm.query(new[K][ids]); sleeveW[K] = copy_weights(K, ids, bk_[ids] * 0.85, armIdx[nn], Jb, Wb, bb)

# ---------------- clearance checks (rest pose) ----------------
def signed(A, B, NB):   # signed distance of points A to the surface sampled by B (normals NB): + = outside
    d, j = cKDTree(B).query(A); return np.einsum('ij,ij->i', A - B[j], NB[j]), d
# ---------------- normals: authored normal + (new face normal - old face normal), welded across UV seams ----------------
def vnormals(Pt, idx):
    key = np.round(Pt / 2e-5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    F = idx.reshape(-1, 3); fn = np.cross(Pt[F[:, 1]] - Pt[F[:, 0]], Pt[F[:, 2]] - Pt[F[:, 0]])
    acc = np.zeros((inv.max() + 1, 3))
    for c in range(3): np.add.at(acc, inv[F[:, c]], fn)
    n = acc[inv]; return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
out = {'version': 1, 'gaps_m': {'teeOverShorts': GAP_TEE, 'sleeveOverSkin': GAP_SLEEVE, 'shortsOverThigh': GAP_LEG}, 'meshes': {}, 'cuffPlanes': cuffPlanes}
for K in (TEE, TRIM, SH):
    idx = np.array(M[K]['index']); d = np.linalg.norm(new[K] - P[K], axis=1); mv = d > 2e-5
    n0, n1 = vnormals(P[K], idx), vnormals(new[K], idx); nn = Nrm[K] + (n1 - n0); nn /= np.maximum(np.linalg.norm(nn, axis=1, keepdims=True), 1e-9)
    ids = np.where(mv)[0]
    out['meshes'][K] = {'idx': ids.tolist(), 'd': np.round((new[K][ids] - P[K][ids]) * 1e5).astype(int).ravel().tolist(), 'n': np.round(nn[ids] * 1e4).astype(int).ravel().tolist()}
    report[K] = {'moved': int(mv.sum()), 'maxMoveMm': round(float(d.max() * 1000), 2), 'p95MoveMm': round(float(np.percentile(d[mv], 95) * 1000), 2) if mv.any() else 0}

# ---------------- tee hem weights follow the shorts ----------------
Jt = arr(TEE, 'J', 4).astype(int); Wt = arr(TEE, 'W', 4); bt = M[TEE]['bones']
Js = arr(SH, 'J', 4).astype(int); Ws = arr(SH, 'W', 4); bs = M[SH]['bones']
_, near = cKDTree(new[SH]).query(new[TEE])
b = 1 - sstep(0.955, 1.010, P[TEE][:, 1]); hemIds = np.where(b > 1e-3)[0]; WJ = {'idx': [], 'bones': [], 'w': []}
for i in hemIds:
    acc = {}
    for k in range(4): acc[bt[Jt[i, k]]] = acc.get(bt[Jt[i, k]], 0) + (1 - b[i]) * Wt[i, k]
    for k in range(4): acc[bs[Js[near[i], k]]] = acc.get(bs[Js[near[i], k]], 0) + b[i] * Ws[near[i], k]
    top = sorted([(n, w) for n, w in acc.items() if w > 1e-6], key=lambda x: -x[1])[:4]; sm = sum(w for _, w in top)
    q = [round(w / sm * 255) for _, w in top]; q[0] += 255 - sum(q)
    WJ['idx'].append(int(i)); WJ['bones'].append([n for n, _ in top]); WJ['w'].append(q)
teeW = {}
for i, bn_, w_ in zip(WJ['idx'], WJ['bones'], WJ['w']): teeW[i] = {n: x / 255 for n, x in zip(bn_, w_)}
for i, acc in sleeveW[TEE].items(): teeW.setdefault(i, acc)
out['weights'] = {TEE: pack(teeW), TRIM: pack(sleeveW[TRIM]), SH: pack(shortsW)}
report['weightVerts'] = {k: len(v['idx']) for k, v in out['weights'].items()}
# clearances: tee hem over the shorts, shorts hem / sleeve cuff over the skin
def outward(Pt, Nn, axisA=None, axisB=None):
    if axisA is None: rad = np.stack([Pt[:, 0], np.zeros(len(Pt)), Pt[:, 2] - zc_of(Pt[:, 1])], 1)
    else:
        A_ = np.array(axisA); u_ = np.array(axisB) - A_; u_ /= np.linalg.norm(u_); d_ = Pt - A_; rad = d_ - np.outer(d_ @ u_, u_)
    return np.einsum('ij,ij->i', rad / np.maximum(np.linalg.norm(rad, axis=1, keepdims=True), 1e-9), Nn) > 0.3
nSH = vnormals(new[SH], np.array(M[SH]['index'])); nTE = vnormals(new[TEE], np.array(M[TEE]['index']))
oS = outward(new[SH], nSH) & (P[SH][:, 1] > 0.86); oT = outward(new[TEE], nTE) & (P[TEE][:, 1] < 0.985) & (P[TEE][:, 1] > 0.88)
sd, dd = signed(new[TEE][oT], new[SH][oS], nSH[oS]); c = dd < 0.03
report['teeOuterOverShortsOuterMm_min_p1_p50'] = [round(float(x * 1000), 2) for x in (sd[c].min(), np.percentile(sd[c], 1), np.percentile(sd[c], 50))]
nB = arr(BODY, 'N')
for sgn in (1, -1):
    selB = (P[BODY][:, 1] > 0.60) & (P[BODY][:, 1] < 0.632) & (P[BODY][:, 0] * sgn > 0)
    o = outward(new[SH], nSH, [0.082 * sgn, 0.852, 0.006], [0.082 * sgn, 0.499, 0.007]) & (P[SH][:, 1] < 0.66) & (P[SH][:, 0] * sgn > 0)
    sdB, dB = signed(new[SH][o], P[BODY][selB], nB[selB]); c = dB < 0.02
    report['shortsHemOuterOverSkinMm_' + ('L' if sgn > 0 else 'R')] = [round(float(x * 1000), 2) for x in (sdB[c].min(), np.percentile(sdB[c], 50))]
    selA = (P[BODY][:, 1] > 1.18) & (P[BODY][:, 1] < 1.31) & (P[BODY][:, 0] * sgn > 0.12)
    rT = P[TRIM][:, 0] * sgn > 0
    sdA, dA = signed(new[TRIM][rT], P[BODY][selA], nB[selA]); c = dA < 0.02
    report['cuffTrimOverSkinMm_' + ('L' if sgn > 0 else 'R')] = [round(float(x * 1000), 2) for x in (sdA[c].min(), np.percentile(sdA[c], 50))] if c.any() else None
out['report'] = report
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(json.dumps(report, indent=1))
