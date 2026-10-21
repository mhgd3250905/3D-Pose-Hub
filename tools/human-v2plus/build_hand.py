# training-human-v2plus: finger rig on the UNCHANGED v2 hand geometry.
#   python3 build_hand.py <rest.json from probe.mjs> <out.json> [relax-left.json from probe-relax.mjs]
# - finds the four fingers (connected components distal of the finger webs) and the thumb on the left hand,
#   in the left hand bone's local frame (the right hand is its exact mirror in local x);
# - places 3 joints per finger + thumb on slice centroids (mid thickness);
# - splits ONLY the hand-bone share of each hand vertex's weights among hand + finger bones (forearm share untouched,
#   every vertex outside the hand untouched); coincident (seam) vertices get identical weights (pure function of position);
# - fits the grip-bar pose to the accepted v2 baked power grip (assets/grip-left.json targets) and writes named poses.
# Bones get identity rest rotation relative to the hand and their inverse bind is taken from the hand at reset, so with
# every finger at rest the skinning matrices equal the hand's: the rest mesh is bit-for-bit the v2 shape.
import json, sys, os, numpy as np
from scipy.spatial.transform import Rotation as Rot
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.optimize import least_squares
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '../..'))
R = json.load(open(sys.argv[1])); OUT = sys.argv[2]
m = R['meshes']['Coach_Body']; bn = m['bones']
P = np.array(m['P']).reshape(-1, 3); J = np.array(m['J']).reshape(-1, 4); W = np.array(m['W']).reshape(-1, 4); I = np.array(m['index']).reshape(-1, 3)
key = np.round(P * 1e5).astype(np.int64); _, wid = np.unique(key, axis=0, return_inverse=True); wid = wid.ravel()
sm = lambda e0, e1, v: (lambda t: t * t * (3 - 2 * t))(np.clip((v - e0) / (e1 - e0), 0, 1))
FN = ['thumb', 'index', 'middle', 'ring', 'pinky']

def frame(side):
    hb = R['bones'][side + 'Hand']; return np.array(hb['p']), Rot.from_quat(hb['q']).as_matrix()
def hand_share(side):
    hi = bn.index(side + 'Hand'); return sum(W[:, k] * (J[:, k] == hi) for k in range(4))
def comps(mask):
    e = np.r_[I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]]; e = wid[e]; mw = np.zeros(wid.max() + 1, bool); mw[wid[mask]] = True
    e = e[mw[e[:, 0]] & mw[e[:, 1]]]; n = wid.max() + 1
    A = coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)); _, lab = connected_components(A, directed=False)
    ids = np.where(mask)[0]; lw = lab[wid[ids]]; return [ids[lw == l] for l in np.unique(lw)]

# ---------------- left hand analysis (local frame: +x toward fingertips, -y palmar, +z toward the thumb) ----------------
oL, RL = frame('left'); hsL = hand_share('left'); LOC = (P - oL) @ RL
inhand = hsL > 0.001
WEB = 0.125
mask = inhand & (LOC[:, 0] > WEB + 0.005)
F4 = sorted([c for c in comps(mask) if len(c) > 200], key=lambda s: -LOC[s][:, 2].mean())   # index, middle, ring, pinky
assert len(F4) == 4, len(F4)
mask = inhand & (LOC[:, 2] > 0.06)
TH = sorted(comps(mask), key=len)[-1]
PALMAR = np.array([0, -1.0, 0])

def centreline(pts, d0):
    d = d0 / np.linalg.norm(d0); s = pts @ d; o = pts.mean(0)
    return d, s
fingers = {}
for k, comp in zip(FN[1:], F4):
    pts = LOC[comp]
    c = pts.mean(0); _, _, Vt = np.linalg.svd(pts - c); d = Vt[0] * np.sign(Vt[0][0])
    s = (pts - c) @ d; tip_s = s.max()
    # finger root: web line projected on the axis, MCP joint 14 mm proximal of the web
    web_s = (np.array([WEB, 0, 0]) - c) @ d + (c[0] - WEB) * 0 ; web_s = (WEB - c[0]) / d[0]
    mcp_s = web_s - 0.014
    L = tip_s - mcp_s
    js = [mcp_s, mcp_s + 0.45 * L, mcp_s + 0.73 * L, tip_s]
    def cen(sv):   # slice centroid (mid thickness); for the MCP extrapolate the finger centreline into the palm
        sel = np.abs(s - sv) < 0.004
        if sel.sum() < 20 or sv < (WEB + 0.006 - c[0]) / d[0]:
            q = pts[(s > web_s + 0.01) & (s < web_s + 0.03)]; q0 = q.mean(0); return q0 + d * (sv - ((q0 - c) @ d))
        return pts[sel].mean(0)
    jp = [cen(v) for v in js[:3]] + [c + d * tip_s]
    jp[3] = jp[2] + (jp[2] - jp[1]) / np.linalg.norm(jp[2] - jp[1]) * (tip_s - js[2])
    fingers[k] = dict(d=d, joints=np.array(jp), comp=comp)
# thumb: axis from the component; CMC at the thumb base inside the thenar
pts = LOC[TH]; c = pts.mean(0); _, _, Vt = np.linalg.svd(pts - c); d = Vt[0] * np.sign(Vt[0][0]); s = (pts - c) @ d
tip_s = s.max(); base_s = s.min()
Lt = tip_s - base_s
cmc_s = base_s - 0.012; js = [cmc_s, base_s + 0.40 * Lt, base_s + 0.70 * Lt, tip_s]
def cen_t(sv):
    sel = np.abs(s - sv) < 0.004
    if sel.sum() < 20: q0 = pts[s < base_s + 0.015].mean(0); return q0 + d * (sv - ((q0 - c) @ d))
    return pts[sel].mean(0)
jp = [cen_t(v) for v in js[:3]]; jp.append(jp[2] + (jp[2] - jp[1]) / np.linalg.norm(jp[2] - jp[1]) * (tip_s - js[2]))
fingers['thumb'] = dict(d=d, joints=np.array(jp), comp=TH)
for k in FN: print(k, np.round(fingers[k]['joints'], 4).tolist())

# ---------------- weights (computed per hand from local coords; right = mirror) ----------------
def seg_param(X, jp):
    """distance-along-chain parameter of points X on the joint polyline jp (4 points) + distance to it"""
    best = np.full(len(X), 1e9); sp = np.zeros(len(X)); acc = 0.0
    for a, b in zip(jp[:-1], jp[1:]):
        ab = b - a; L = np.linalg.norm(ab); t = np.clip(((X - a) @ ab) / (L * L), -0.6 if acc == 0 else 0, 1 if b is not jp[-1] else 1.6)
        q = a + t[:, None] * ab; dist = np.linalg.norm(X - q, axis=1); better = dist < best
        best[better] = dist[better]; sp[better] = acc + t[better] * L; acc += L
    return sp, best
def finger_weights(X, hs, lab=None):
    """X: local coords (left-hand convention) of hand vertices, hs: their hand share, lab: finger index per vertex for the
    separate finger / thumb components (-1 elsewhere). -> dict bone -> weight (subset of hs)"""
    n = len(X); out = {}
    # membership of each long finger: lateral (z) distance to its axis in the knuckle zone, components distal of the web
    memb = np.zeros((5, n)); sps = np.zeros((5, n))
    for fi, k in enumerate(FN):
        jp = fingers[k]['joints']; sp, dist = seg_param(X, jp); sps[fi] = sp
        if k == 'thumb':
            # thumb chain: full inside ~13 mm of the thumb axis, fading by 30 mm (thenar follows the metacarpal partly)
            memb[fi] = 1 - sm(0.012, 0.040, dist)
        else:
            memb[fi] = np.exp(-(dist / 0.0095) ** 2)
    # long fingers: normalise lateral memberships among the four (smooth web), thumb kept apart
    lf = memb[1:]; tot = lf.sum(0) + 1e-9; lf = lf / tot
    memb[1:] = lf
    # inside a separate finger (distal of the webs) or the thumb, a vertex belongs to that finger only
    if lab is not None:
        for fi in range(5):
            s_ = lab == fi
            if s_.any():
                keep = memb[fi, s_].copy() if fi == 0 else np.ones(s_.sum())
                memb[:, s_] = 0; memb[fi, s_] = keep
        # long-finger vertices never take thumb weight and vice versa
        memb[0, (lab >= 1)] = 0
    res = {}
    for fi, k in enumerate(FN):
        jp = fingers[k]['joints']; L01 = np.linalg.norm(jp[1] - jp[0]); L12 = np.linalg.norm(jp[2] - jp[1])
        sp = sps[fi]
        if k == 'thumb':
            on = sm(-0.016, 0.012, sp) * memb[fi] * sm(0.030, 0.052, X[:, 2])
            b = 0.010
        else:
            on = sm(-0.010, 0.008, sp) * memb[fi] * sm(WEB - 0.035, WEB - 0.02, X[:, 0])
            b = 0.008
        w1 = 1 - sm(L01 - b, L01 + b, sp); w2 = sm(L01 - b, L01 + b, sp) * (1 - sm(L01 + L12 - b, L01 + L12 + b, sp)); w3 = sm(L01 + L12 - b, L01 + L12 + b, sp)
        for j, wj in enumerate([w1, w2, w3]): res[f'{k}{j+1}'] = on * wj
    tot = sum(res.values())
    # thumb and long fingers cannot both claim one vertex beyond 1
    scale = np.where(tot > 1, 1 / np.maximum(tot, 1e-9), 1)
    for k in res: res[k] = res[k] * scale * hs
    return res
def labels(ids, X):
    lab = np.full(len(ids), -1); pos = np.full(len(P), -1); pos[ids] = np.arange(len(ids))
    m = np.zeros(len(P), bool); m[ids[X[:, 0] > WEB + 0.005]] = True
    F = sorted([c for c in comps(m) if len(c) > 200], key=lambda c: -X[pos[c]][:, 2].mean()); assert len(F) == 4, len(F)
    m = np.zeros(len(P), bool); m[ids[X[:, 2] > 0.06]] = True; th = sorted(comps(m), key=len)[-1]
    lab[pos[th]] = 0
    for fi, c in enumerate(F, 1): lab[pos[c]] = fi
    return lab
def smooth_fw(ids, fw, hs, it=6):
    pos = np.full(len(P), -1); pos[ids] = np.arange(len(ids))
    e = np.r_[I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]]
    # weld seams: coincident vertices are one node
    e = np.r_[e, np.stack([np.arange(len(P)), np.arange(len(P))], 1)]
    w = wid; first = np.full(w.max() + 1, -1);
    for i in ids[::-1]: first[w[i]] = i
    node = pos[first[w[ids]]]                          # welded node index per id
    ee = e[(pos[e[:, 0]] >= 0) & (pos[e[:, 1]] >= 0)]; a, b = node[pos[ee[:, 0]]], node[pos[ee[:, 1]]]
    n = len(ids); A = coo_matrix((np.ones(len(a) * 2), (np.r_[a, b], np.r_[b, a])), shape=(n, n)).tocsr(); deg = np.asarray(A.sum(1)).ravel()
    names = list(fw.keys()); M = np.stack([fw[k] for k in names], 1)
    Mn = np.zeros((n, M.shape[1])); np.add.at(Mn, node, M); cnt = np.bincount(node, minlength=n)[:, None]; Mn = Mn / np.maximum(cnt, 1)
    hsn = np.zeros(n); np.add.at(hsn, node, hs); hsn = hsn / np.maximum(cnt[:, 0], 1)
    for _ in range(it):
        Mn = 0.5 * Mn + 0.5 * (A @ Mn) / np.maximum(deg, 1)[:, None]
        tot = Mn.sum(1); sc = np.where(tot > hsn, hsn / np.maximum(tot, 1e-9), 1); Mn = Mn * sc[:, None]
    M = Mn[node]
    return {k: M[:, j] for j, k in enumerate(names)}
def assign(side):
    o, Rm = frame(side); hs = hand_share(side); ids = np.where(hs > 0.001)[0]
    X = (P[ids] - o) @ Rm
    if side == 'right': X[:, 0] *= -1
    fw = smooth_fw(ids, finger_weights(X, hs[ids], labels(ids, X)), hs[ids])
    hi = bn.index(side + 'Hand')
    rows = []
    names = list(fw.keys())
    FWm = np.stack([fw[k] for k in names], 1)
    changed = FWm.sum(1) > 1e-4
    out_idx, out_b, out_w = [], [], []
    for r, i in enumerate(ids):
        if not changed[r]: continue
        inf = {}
        for k in range(4):
            if W[i, k] <= 0: continue
            b = bn[J[i, k]]; inf[b] = inf.get(b, 0) + W[i, k]
        inf[side + 'Hand'] = inf.get(side + 'Hand', 0) - FWm[r].sum()
        for k, nm in enumerate(names):
            if FWm[r, k] > 1e-5: inf[side[0] + '_' + nm] = FWm[r, k]
        top = sorted(inf.items(), key=lambda t: -t[1])[:4]; s = sum(w for _, w in top)
        # skinWeight is normalised Uint8 in the GLB: quantise to 1/255 with an exact integer sum of 255 (largest remainder),
        # otherwise a 1-2/255 deficit pulls vertices ~4-8 mm toward the world origin (spikes)
        ws = np.array([w / s for _, w in top]); q = np.floor(ws * 255).astype(int); rem = 255 - q.sum()
        for j in np.argsort(-(ws * 255 - q))[:rem]: q[j] += 1
        top = [(b, int(qq)) for (b, _), qq in zip(top, q) if qq > 0]
        out_idx.append(int(i)); out_b.append([b for b, _ in top]); out_w.append([qq for _, qq in top])
    return dict(idx=out_idx, bones=out_b, w=out_w)
WT = {s: assign(s) for s in ('left', 'right')}
print('weighted verts', {s: len(WT[s]['idx']) for s in WT})

# ---------------- forward kinematics (left local) for pose fitting ----------------
BONES = [f'{k}{j}' for k in FN for j in (1, 2, 3)]
lid = np.where(hsL > 0.001)[0]; XL = LOC[lid]; FWL = smooth_fw(lid, finger_weights(XL, hsL[lid], labels(lid, XL)), hsL[lid])
FW = np.stack([FWL[b] for b in BONES], 1)                 # n x 15 absolute weights
HW = 1 - FW.sum(1)                                        # everything else stays rigid with the hand (rest)
def fk(qs):
    """qs: dict bone -> rotvec (local, identity rest). returns per-bone (R, t) mapping rest-local -> posed-local."""
    M = {}
    for k in FN:
        jp = fingers[k]['joints']; Rp = np.eye(3); tp = np.zeros(3)
        for j in range(3):
            b = f'{k}{j+1}'; Rl = Rot.from_rotvec(qs.get(b, np.zeros(3))).as_matrix()
            pivot = jp[j]
            # world(local hand) transform: x -> Rp(Rl(x - pivot) + pivot) + tp ... accumulate
            Rn = Rp @ Rl; tn = Rp @ (pivot - Rl @ pivot) + tp
            M[b] = (Rn, tn); Rp, tp = Rn, tn
    return M
def skin(qs, X=XL, FWm=FW, HWm=HW):
    M = fk(qs); Y = X * HWm[:, None]
    for i, b in enumerate(BONES):
        Rb, tb = M[b]; Y = Y + FWm[:, i:i+1] * (X @ Rb.T + tb)
    return Y
def flex_axis(k):
    d = fingers[k]['d']; a = np.cross(d, PALMAR); return a / np.linalg.norm(a)
# ---------------- grip-bar: fit to the accepted v2 baked grip ----------------
G = json.load(open(os.path.join(REPO, 'drill-anim/assets/grip-left.json')))
gi = np.array(G['idx']); TT = (np.array(G['T']) - oL) @ RL
pos = {int(v): r for r, v in enumerate(lid)}
sel = [(pos[int(v)], r) for r, v in enumerate(gi) if int(v) in pos]
rows = np.array([a for a, _ in sel]); trows = np.array([b for _, b in sel])
fing = FW[rows].sum(1) > 0.3
rows, trows = rows[fing], trows[fing]
print('grip fit vertices', len(rows))
def unpack(x):
    qs = {}; i = 0
    for k in FN:
        for j in range(3):
            if k == 'thumb' and j == 0: qs['thumb1'] = x[i:i+3]; i += 3
            elif j == 0: qs[f'{k}1'] = flex_axis(k) * x[i] + PALMAR * x[i+1]; i += 2
            else: qs[f'{k}{j+1}'] = (flex_axis(k) * x[i]); i += 1
    return qs
BC = np.array([0.095838, -0.02992, -0.001002]); BA = np.array([0.132415, -0.166409, 0.977126]); BA /= np.linalg.norm(BA)   # lib/grip.mjs G.left
frows = np.where(FW.sum(1) > 0.05)[0]
def resid(x):
    qs = unpack(x); Y = skin(qs, XL[rows], FW[rows], HW[rows])
    Z = skin(qs, XL[frows], FW[frows], HW[frows]); d = Z - BC; rad = np.linalg.norm(d - np.outer(d @ BA, BA), axis=1)
    pen = np.maximum(0, 0.0175 - rad) * 6.0          # keep skin 1.5 mm outside the 16 mm bar
    return np.r_[(Y - TT[trows]).ravel(), pen]
nx = 3 + 1 + 1 + 4 * 4
x0 = np.zeros(nx); fit = least_squares(resid, x0, loss='soft_l1', f_scale=0.004, max_nfev=400)
err = np.linalg.norm(resid(fit.x)[:len(rows)*3].reshape(-1, 3), axis=1)
print('grip fit mm: mean %.2f median %.2f p95 %.2f' % (err.mean() * 1000, np.median(err) * 1000, np.percentile(err, 95) * 1000))
grip = unpack(fit.x)
def deg_pose(curl, thumb, spread, thumb_rv=None):
    qs = {}
    for fi, k in enumerate(FN[1:]):
        a = flex_axis(k); sp = (fi - 1.4) * spread
        qs[f'{k}1'] = a * np.radians(curl[0]) - PALMAR * np.radians(sp)
        qs[f'{k}2'] = a * np.radians(curl[1]); qs[f'{k}3'] = a * np.radians(curl[2])
    a = flex_axis('thumb')
    qs['thumb1'] = thumb_rv if thumb_rv is not None else a * np.radians(thumb[0])
    qs['thumb2'] = a * np.radians(thumb[1]); qs['thumb3'] = a * np.radians(thumb[2])
    return qs
# relaxed: fit to the accepted v2 relaxed hand (v7 relax morph at weight 1, dumped by probe-relax.mjs) when available
relaxed = deg_pose([16, 26, 14], [6, 10, 10], 1.2, thumb_rv=grip['thumb1'] * 0.25); relax_err = None
RELAX = sys.argv[3] if len(sys.argv) > 3 else None
if RELAX and os.path.exists(RELAX):
    ra = np.array(json.load(open(RELAX))).reshape(-1, 4); rid = ra[:, 0].astype(int); RT = ra[:, 1:]
    ok = np.array([int(v) in pos for v in rid]); rr = np.array([pos[int(v)] for v in rid[ok]]); RT = RT[ok]
    f2 = FW[rr].sum(1) > 0.3; rr, RT = rr[f2], RT[f2]
    def resid_r(x): return (skin(unpack(x), XL[rr], FW[rr], HW[rr]) - RT).ravel()
    best = None
    for x0 in (np.zeros(nx), fit.x * 0.3, fit.x * 0.6):
        f_ = least_squares(resid_r, x0, loss='soft_l1', f_scale=0.003, max_nfev=300)
        if best is None or f_.cost < best.cost: best = f_
    fr = best
    if os.environ.get('HV2P_DIAG'):
        E_ = np.linalg.norm(resid_r(fr.x).reshape(-1, 3), axis=1)
        for i_, b_ in enumerate(BONES):
            s_ = FW[rr][:, i_] > 0.5
            if s_.sum(): print('  relax fit', b_, 'mean mm %.1f' % (E_[s_].mean() * 1000))
    e2 = np.linalg.norm(resid_r(fr.x).reshape(-1, 3), axis=1); relax_err = (float(e2.mean() * 1000), float(np.percentile(e2, 95) * 1000), int(len(rr)))
    print('relaxed fit mm: mean %.2f p95 %.2f (%d verts)' % relax_err); relaxed = unpack(fr.x)
    # the v7 relax morph does not move the thumb: keep it at the authored rest (no targets -> the fit leaves it arbitrary)
    for b_ in ('thumb1', 'thumb2', 'thumb3'): relaxed[b_] = np.zeros(3)
POSES = {
    'open': deg_pose([-4, 0, 0], [0, 0, 0], 4),
    'relaxed': relaxed,
    'palm-floor': deg_pose([-3, 2, 1], [0, 2, 2], 3),
    'grip-bar': grip,
    # band handle / thinner grip: the fitted bar grip closed a little further
    'band-grip': {b: v * (1.12 if not b.startswith('thumb1') else 1.0) for b, v in grip.items()},
}
def q_of(rv): return [round(float(x), 6) for x in Rot.from_rotvec(rv).as_quat()]
out = {
    'doc': 'Weights are integers /255 (exact sum 255, matches the GLB normalised Uint8 skinWeight). training-human-v2plus finger rig for the unchanged v2 Coach_Body hands. Coordinates are LEFT hand-bone local (metres); the right hand mirrors local x (quaternion (x,-y,-z,w)). Bones are children of <side>Hand with identity rest rotation.',
    'mesh': 'Coach_Body', 'vertexCount': int(len(P)),
    'fingers': {k: {'joints': np.round(fingers[k]['joints'], 6).tolist(), 'flexAxis': np.round(flex_axis(k), 6).tolist()} for k in FN},
    'bones': BONES, 'palmar': PALMAR.tolist(),
    'poses': {n: {b: q_of(rv) for b, rv in qs.items()} for n, qs in POSES.items()},
    'relaxedFitMm': None if relax_err is None else {'mean': round(relax_err[0], 2), 'p95': round(relax_err[1], 2), 'vertices': relax_err[2]},
    'gripFitMm': {'mean': round(float(err.mean() * 1000), 2), 'p95': round(float(np.percentile(err, 95) * 1000), 2), 'vertices': int(len(rows))},
    'weights': WT,
}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print('wrote', OUT, os.path.getsize(OUT))
if os.environ.get('HV2P_DIAG'):
    E = resid(fit.x)[:len(rows)*3].reshape(-1, 3); e = np.linalg.norm(E, axis=1)
    for i, b in enumerate(BONES):
        s = FW[rows][:, i] > 0.5
        if s.sum(): print('  fit', b, s.sum(), 'mean mm %.1f' % (e[s].mean() * 1000))
    c = np.array([0.095838, -0.02992, -0.001002]); a = np.array([0.132415, -0.166409, 0.977126]); a /= np.linalg.norm(a)
    for nm in ('grip-bar', 'band-grip'):
        Y = skin(POSES[nm]); d = Y - c; rad = np.linalg.norm(d - np.outer(d @ a, a), axis=1)
        ins = rad < 0.016; print(nm, 'verts inside bar', ins.sum(), 'min radius mm %.1f' % (rad.min() * 1000))
    Y = skin(dict()); print('rest identity max err', np.abs(Y - XL).max())
if os.environ.get('HV2P_DIAG'):
    # edge stretch in the grip pose: find spikes
    Y = skin(POSES['grip-bar']); posv = np.full(len(P), -1); posv[lid] = np.arange(len(lid))
    e = np.r_[I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]]; e = e[(posv[e[:, 0]] >= 0) & (posv[e[:, 1]] >= 0)]
    a, b = posv[e[:, 0]], posv[e[:, 1]]; L0 = np.linalg.norm(XL[a] - XL[b], axis=1); L1 = np.linalg.norm(Y[a] - Y[b], axis=1)
    r = L1 / np.maximum(L0, 1e-6); bad = np.argsort(-r)[:12]
    for k in bad:
        va = a[k]; print('stretch %.1f  L0 %.4f' % (r[k], L0[k]), np.round(XL[va], 4), {BONES[j]: round(float(FW[va, j]), 2) for j in np.where(FW[va] > 0.02)[0]}, 'other', {BONES[j]: round(float(FW[b[k], j]), 2) for j in np.where(FW[b[k]] > 0.02)[0]})
    print('edges stretched >2x', (r > 2).sum(), ' >1.5x', (r > 1.5).sum())
if os.environ.get('HV2P_DIAG'):
    from scipy.sparse import coo_matrix as _coo
    n = len(lid); A = _coo((np.ones(len(a) * 2), (np.r_[a, b], np.r_[b, a])), shape=(n, n)).tocsr(); deg = np.asarray(A.sum(1)).ravel()
    lap0 = XL - (A @ XL) / np.maximum(deg, 1)[:, None]; lap1 = Y - (A @ Y) / np.maximum(deg, 1)[:, None]
    dl = np.linalg.norm(lap1, axis=1) - np.linalg.norm(lap0, axis=1); o = np.argsort(-dl)[:10]
    for k in o: print('lap +%.1fmm' % (dl[k] * 1000), np.round(XL[k], 4), 'deg', deg[k], {BONES[j]: round(float(FW[k, j]), 2) for j in np.where(FW[k] > 0.02)[0]})
    # also: vertices with seam duplicates whose neighbours differ? check coincident groups in lid
    print('isolated (deg 0)', (deg == 0).sum())
if os.environ.get('HV2P_DIAG'):
    # runtime-equivalent check: final top-4 weights of the left hand
    Wl = WT['left']; M = fk(POSES['grip-bar']); ids = np.array(Wl['idx']); X = LOC[ids]; Y = np.zeros_like(X)
    for r in range(len(ids)):
        for b, w in zip(Wl['bones'][r], [x / 255 for x in Wl['w'][r]]):
            if b.startswith('l_'): Rb, tb = M[b[2:]]; Y[r] += w * (X[r] @ Rb.T + tb)
            elif b == 'leftHand': Y[r] += w * X[r]
            else: Y[r] += w * X[r]   # forearm: rigid at rest-local for this test
    d = np.linalg.norm(Y - skin(POSES['grip-bar'], X, *[np.stack([FWL[bb][np.searchsorted(lid, ids)] for bb in BONES], 1), 1 - np.stack([FWL[bb][np.searchsorted(lid, ids)] for bb in BONES], 1).sum(1)]), axis=1)
    print('top4 vs full: max mm %.2f  >2mm: %d' % (d.max() * 1000, (d > 0.002).sum()))
    o = np.argsort(-d)[:5]
    for k in o: print('  ', round(d[k] * 1000, 1), Wl['bones'][k], Wl['w'][k])
if os.environ.get('HV2P_RT'):
    rt = json.load(open(os.environ['HV2P_RT'])); a = np.array(rt['out']).reshape(-1, 4); ids = a[:, 0].astype(int); Yr = a[:, 1:]
    sel = np.isin(ids, lid); ids, Yr = ids[sel], Yr[sel]; rows_ = np.searchsorted(lid, ids); fsel = FW[rows_].sum(1) > 0.5; ids, Yr, rows_ = ids[fsel], Yr[fsel], rows_[fsel]
    Yp = skin(POSES['grip-bar'], XL[rows_], FW[rows_], HW[rows_]); d = np.linalg.norm(Yp - Yr, axis=1)
    print('runtime vs python: mean %.2fmm max %.1fmm  >3mm %d / %d' % (d.mean() * 1000, d.max() * 1000, (d > 0.003).sum(), len(d)))
    o = np.argsort(-d)[:6]
    for k in o: print('  %.1fmm' % (d[k] * 1000), ids[k], np.round(XL[rows_[k]], 4), 'rt', np.round(Yr[k], 4), 'py', np.round(Yp[k], 4), {BONES[j]: round(float(FW[rows_[k], j]), 2) for j in np.where(FW[rows_[k]] > 0.02)[0]})
if os.environ.get('HV2P_RT2'):
    rt = json.load(open(os.environ['HV2P_RT2'])); a = np.array(rt['out']).reshape(-1, 4); ids = a[:, 0].astype(int); Yr = a[:, 1:]
    keep = np.isin(ids, WT['left']['idx']); ids, Yr = ids[keep], Yr[keep]
    pos = np.full(len(P), -1); pos[ids] = np.arange(len(ids))
    e = np.r_[I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]]; e = e[(pos[e[:, 0]] >= 0) & (pos[e[:, 1]] >= 0)]
    A_, B_ = pos[e[:, 0]], pos[e[:, 1]]; L0 = np.linalg.norm(LOC[ids][A_] - LOC[ids][B_], axis=1); L1 = np.linalg.norm(Yr[A_] - Yr[B_], axis=1)
    r = (L1 - L0) * 1000; print('runtime edges +3mm', (r > 3).sum(), '+6mm', (r > 6).sum()); r = np.where(L0 > 0, r, 0); print('runtime edges >2x', (r > 2).sum(), '>4x', (r > 4).sum(), 'max %.1f' % r.max())
    for k in np.argsort(-r)[:6]:
        i = ids[A_[k]]; j = ids[B_[k]]; Wl = WT['left']; ii = Wl['idx'].index(i) if i in Wl['idx'] else -1; jj = Wl['idx'].index(j) if j in Wl['idx'] else -1
        print('  %.1fx L0 %.4f' % (r[k], L0[k]), i, Wl['bones'][ii] if ii >= 0 else 'orig', Wl['w'][ii] if ii >= 0 else '', '|', j, Wl['bones'][jj] if jj >= 0 else 'orig', Wl['w'][jj] if jj >= 0 else '')
