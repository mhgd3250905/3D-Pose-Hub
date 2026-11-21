"""fitted 30 fps rig (scene coords) -> Pose Studio anim (v3, 120 fps, ground y=0) + check_move dump.
usage: export.py fit.pkl anim.json dump.npz"""
import sys, json, math, pickle, numpy as np
from scipy.spatial.transform import Rotation as Rot, Slerp
from scipy.interpolate import CubicSpline
from rig import Rig, LP, PAR, JOINTS, F_PX, CX, CY, L_UA, L_FA, L_TH, L_SH
from contacts import segs, WIN
from load import FR, N
from stageA import K, C, M
sys.path.insert(0, '/workspace/work/pose-hub/tools/v5/breaking')
from kf import aim, m2q
from armfix import pronation, humerus_twist

src, out, dump = sys.argv[1], sys.argv[2], sys.argv[3]
d = pickle.load(open(src, 'rb')); n_, d_ = d['ground']
rg = Rig(d['R0']); W, P = rg.fk(d['x']); loc = rg.loc
X3, Y3, Z3 = np.eye(3); nrm = lambda v: v / np.linalg.norm(v)
# ---------------- world frame: ground = y 0, x = image right on the ground, z = toward the camera ----------------
zc = Z3 - n_ * n_[2]; zc /= np.linalg.norm(zc); xw = np.cross(n_, zc); B = np.stack([xw, n_, zc])
hip = 0.5 * (P['leftThigh'] + P['rightThigh']); hm = hip[42:140].mean(0); o = hm - n_ * (hm @ n_ - d_)
toW = lambda p: (p - o) @ B.T
Wg = {b: np.einsum('ij,njk->nik', B, W[b]) for b in JOINTS}
root30 = toW(P['pelvis'])
# local rotations at 30 fps (scapula / hand = identity relative to parent from the fit)
L30 = {}
for b in JOINTS:
    L30[b] = Wg[b] if b == 'pelvis' else np.einsum('nji,njk->nik', Wg[PAR[b]], Wg[b])
# ---------------- 30 -> 120 fps ----------------
FPS0, FPS = 30.0, 120; T_END = (N - 1) / FPS0; NF = int(round(T_END * FPS)) + 1; tt = np.arange(NF) / FPS; t30 = np.arange(N) / FPS0
LOC = {}
for b in JOINTS:
    q = Rot.from_matrix(L30[b]).as_quat()
    for i in range(1, N):
        if q[i] @ q[i - 1] < 0: q[i] = -q[i]
    LOC[b] = Slerp(t30, Rot.from_quat(q))(tt).as_matrix()
ROOT = CubicSpline(t30, root30)(tt)


def fk(i, loc):
    Wd = {'pelvis': loc['pelvis']}; Pd = {'pelvis': ROOT[i].copy()}
    for b in JOINTS[1:]:
        p = PAR[b]; Pd[b] = Pd[p] + Wd[p] @ LP[b]; Wd[b] = Wd[p] @ loc[b]
    return Wd, Pd


def swing(a, b):
    a = nrm(a); b = nrm(b); ax = np.cross(a, b); s = np.linalg.norm(ax)
    if s < 1e-9: return np.eye(3)
    return Rot.from_rotvec(ax / s * math.atan2(s, a @ b)).as_matrix()


def two_bone(Wd, Pd, rb, mb, eb, T, l1, l2):
    S = Pd[rb]; E = Pd[mb]; d_ = T - S; dl = np.linalg.norm(d_); dn = d_ / dl; dl = min(dl, (l1 + l2) * 0.9995)
    pole = E - S - dn * ((E - S) @ dn)
    fb = Wd[rb] @ (-Z3 if 'Arm' in rb else Z3); fb = fb - dn * (fb @ dn)   # elbow sits opposite its crease, knee in front
    if np.linalg.norm(pole) < 0.03 and np.linalg.norm(fb) > 1e-3: pole = nrm(pole + 0.03 * nrm(fb) * (1 - np.linalg.norm(pole) / 0.03))
    pole = nrm(pole) if np.linalg.norm(pole) > 1e-6 else nrm(np.cross(dn, X3))
    ca = (l1 * l1 + dl * dl - l2 * l2) / (2 * l1 * dl); a_ = math.acos(max(-1, min(1, ca)))
    E2 = S + (dn * math.cos(a_) + pole * math.sin(a_)) * l1; H2 = S + dn * dl
    R1 = swing(E - S, E2 - S); R2 = swing(R1 @ (Pd[eb] - E), H2 - E2)
    return R1 @ Wd[rb], R2 @ R1 @ Wd[mb]


def setw(loc, Wd, b, Wb): loc[b] = Wd[PAR[b]].T @ Wb

# ---------------- contact targets ----------------
FRT = lambda f30: f30 / FPS0
HAND_Y, FOOT_Y = 0.045, 0.085
KPW = {'rightHand': (112, 121), 'leftHand': (91, 100)}
CT = {}
for b in WIN:
    for a, c in segs(b):
        tgt = toW(P[b][a:c + 1]).mean(0); tgt[1] = HAND_Y if 'Hand' in b else max(FOOT_Y, tgt[1])
        fing = None
        if 'Hand' in b:   # finger direction on the ground from the 2D wrist->middle-knuckle vector (horizontal image component is metric)
            r, m = KPW[b]; v = np.median(K[a:c + 1, m] - K[a:c + 1, r], 0); z = -P[b][a:c + 1, 2].mean()
            dx = v[0] * z / F_PX; Lf = 0.09; dz = math.copysign(math.sqrt(max(0.0, Lf * Lf - min(Lf, abs(dx)) ** 2)), v[1]) * 0.5
            fing = nrm(np.array([dx, 0, dz]))
        CT.setdefault(b, []).append((FRT(a), FRT(c), tgt, fing))
RAMP = 0.12
def cw(b, t):
    w = 0.0; best = None
    for ta, tb, tgt, fg in CT.get(b, []):
        lo = ta if ta > 0 else -1; hi = tb if tb < T_END - 1e-6 else T_END + 1
        if lo - RAMP <= t <= hi + RAMP:
            u = 1.0 if lo <= t <= hi else max(0.0, 1 - min(abs(t - lo), abs(t - hi)) / RAMP)
            u = u * u * (3 - 2 * u)
            if u >= w: w = u; best = (tgt, fg, lo <= t <= hi)
    return w, best

# ---------------- pass 1: contacts (feet, hands), planted palm orientation ----------------
from armopt import metrics
BG = np.arange(-90, 90.1, 10.0); GG = np.arange(-120, 120.1, 10.0)

def over(v, s): return np.maximum(0.0, np.abs(v) - s)

def ik_arm(i, loc, sd, tgt, w=1.0):
    Wd, Pd = fk(i, loc); c = sd + 'Hand'; T = Pd[c] + (tgt - Pd[c]) * w
    W1, W2 = two_bone(Wd, Pd, sd + 'UpperArm', sd + 'Forearm', c, T, L_UA, L_FA)
    setw(loc, Wd, sd + 'UpperArm', W1); Wd, Pd = fk(i, loc); setw(loc, Wd, sd + 'Forearm', W2); return fk(i, loc)

def bref(Wd, Pd, sd, sg):
    """near-straight arm: the humerus roll is free (elbow does not move), so the swing grid is centred on the roll that makes the
    humerus twist zero; a bent arm keeps the video's elbow (grid centred on 0)"""
    S, E, H = Pd[sd + 'UpperArm'], Pd[sd + 'Forearm'], Pd[sd + 'Hand']; ax = nrm(H - S)
    rr = np.linalg.norm((E - S) - ax * ((E - S) @ ax)); s_ = float(np.clip(1 - rr / 0.035, 0, 1))
    h0 = metrics(Wd['torso'], sg, S, E, H, Wd[sd + 'UpperArm'], Wd[sd + 'Forearm'], Wd[sd + 'Hand'], np.zeros(1), np.zeros(1))[0][0, 0]
    return s_, float(h0)

def node_cost(Wd, Pd, sd, sg, Hw, wh, br=0.0):
    hw, pr, ht, wr, disp, U, F = metrics(Wd['torso'], sg, Pd[sd + 'UpperArm'], Pd[sd + 'Forearm'], Pd[sd + 'Hand'], Wd[sd + 'UpperArm'], Wd[sd + 'Forearm'], Hw, BG + br, GG)
    c = over(hw, 70) ** 2 + over(pr, 70) ** 2 + over(wh * ht, 60) ** 2 + 20 * (disp[:, None] / 0.03) ** 2 + 0.3 * (np.abs(BG)[:, None] / 30) ** 2 + 0.3 * (np.abs(GG)[None, :] / 30) ** 2
    return c

# planted finger direction per window: anatomy first (best reachable twist over the window), the 2D finger direction as a prior
import os
WRW = float(os.environ.get('WRW', 20)); KSIG = float(os.environ.get('KSIG', 5))
FING = {}
PIV = float(os.environ.get('PIV', 45)); PIVW = float(os.environ.get('PIVW', 1.5))   # r3: the planted palm may pivot (yaw on the floor) by up to PIV deg over a window
def hd(phi): return np.array([math.cos(math.radians(phi)), 0, math.sin(math.radians(phi))])
for bnm in ('leftHand', 'rightHand'):
    sd = bnm[:-4]; sg = 1 if sd == 'left' else -1
    for k, (ta, tb, tgt, fg2d) in enumerate(CT[bnm]):
        us = np.linspace(0, 1, 7); t0_, t1_ = max(0, ta), min(T_END, tb)
        idx = [int(round((t0_ + u * (t1_ - t0_)) * FPS)) for u in us]
        states = []
        for i in idx:
            loc = {bb: LOC[bb][i].copy() for bb in JOINTS}; Wd, Pd = ik_arm(i, loc, sd, tgt); states.append((Wd, Pd))
        best = None
        for phi in range(0, 360, 15):
            pv = max(PIV, min(120.0, 110.0 * (t1_ - t0_)))   # long windows (the 1 s entry plant) may pivot further
            for dphi in np.arange(-pv, pv + 1, 15):
                cst = PIVW * (dphi / 15) ** 2 * (0.5 / max(0.5, t1_ - t0_)); tots = []
                for j, (Wd, Pd) in enumerate(states):
                    Wfl = aim(sg * X3, -Y3, hd(phi + dphi * us[j]), -Y3)
                    cst += float(node_cost(Wd, Pd, sd, sg, Wfl, 1.0).min()) * 5 / 7
                    h0, p0, t0, wr2, _, _, _ = metrics(Wd['torso'], sg, Pd[sd + 'UpperArm'], Pd[sd + 'Forearm'], Pd[bnm], Wd[sd + 'UpperArm'], Wd[sd + 'Forearm'], Wfl, BG[:1] * 0, GG[:1] * 0)
                    cst += WRW * float(over(wr2[0, 0], 88) ** 2)
                    if j in (0, len(states) - 1):   # total arm twist at touch-down / lift-off reachable from a relaxed airborne arm
                        tot = (float(h0[0, 0] + p0[0, 0] + t0[0, 0]) + 180) % 360 - 180; cst += 0.2 * float(over(tot, 90)) ** 2
                    tots.append(float(h0[0, 0] + p0[0, 0] + t0[0, 0]))
                # r3: the twist the planted hand asks of the arm, followed continuously through the window (no 360 wrap)
                tu = np.degrees(np.unwrap(np.radians(tots))); tu = tu - 360 * round(tu[0] / 360); cst += 0.3 * float(np.sum(over(tu, 110) ** 2))
                if fg2d is not None: cst += 30 * (math.degrees(math.acos(max(-1, min(1, hd(phi + dphi / 2) @ fg2d)))) / 45) ** 2
                if best is None or cst < best[0]: best = (cst, phi, dphi)
        FING[(bnm, k)] = (best[1], best[2], t0_, t1_)
        print('finger', bnm, k, 'phi', best[1], 'pivot', best[2], 'cost %.0f' % best[0], file=sys.stderr)

def fing_at(key, t):
    if key not in FING: return None
    phi, dphi, t0_, t1_ = FING[key]; u = min(1.0, max(0.0, (t - t0_) / max(1e-6, t1_ - t0_))); return hd(phi + dphi * u)

def cw(bn, t):
    w = 0.0; best = None
    for k, (ta, tb, tgt, fg) in enumerate(CT.get(bn, [])):
        lo = ta if ta > 0 else -1; hi = tb if tb < T_END - 1e-6 else T_END + 1
        if lo - RAMP <= t <= hi + RAMP:
            u = 1.0 if lo <= t <= hi else max(0.0, 1 - min(abs(t - lo), abs(t - hi)) / RAMP)
            u = u * u * (3 - 2 * u)
            if u >= w: w = u; best = (tgt, fing_at((bn, k), t), lo <= t <= hi)
    return w, best

# r3: soft hip clamp (abduction <= ~72 deg, extension <= ~35 deg in the pelvis frame) before the contact IK; the crotch mesh
# pinches past these, and the fit's soft limits still leave a few fast-swing frames (1.73-1.76 s) beyond them
def soft(v, a, b): return v if v <= a else a + b * math.tanh((v - a) / b)
HCL = 0
for i in range(NF):
    for sd, sg in (('left', 1), ('right', -1)):
        th = sd + 'Thigh'; L_ = {bb: LOC[bb][i] for bb in JOINTS}; Wd, Pd = fk(i, L_)
        tl = Wd['pelvis'].T @ nrm(Pd[sd + 'Shin'] - Pd[th]); ab = math.degrees(math.asin(max(-1, min(1, sg * tl[0]))))
        fl = math.degrees(math.atan2(tl[2], -tl[1])); ab2 = soft(ab, 64, 8)
        t2 = tl.copy()
        if ab2 < ab - 1e-6:
            yz = np.array([tl[1], tl[2]]); n_yz = np.linalg.norm(yz)
            yz = yz / n_yz if n_yz > 0.05 else np.array([-math.cos(math.radians(fl)), math.sin(math.radians(fl))])
            c_ = math.cos(math.radians(ab2)); t2 = np.array([sg * math.sin(math.radians(ab2)), c_ * yz[0], c_ * yz[1]])
        fl2 = math.degrees(math.atan2(t2[2], -t2[1]))
        if fl2 < -30 and abs(fl2) < 90:   # extension
            e2 = -soft(-fl2, 30, 6); r_ = math.hypot(t2[1], t2[2]); t2 = np.array([t2[0], -r_ * math.cos(math.radians(e2)), r_ * math.sin(math.radians(e2))])
        if np.linalg.norm(t2 - tl) > 1e-5:
            Rw = Wd['pelvis'] @ swing(tl, t2) @ Wd['pelvis'].T; LOC[th][i] = Wd['pelvis'].T @ Rw @ Wd['pelvis'] @ LOC[th][i]; HCL += 1
print('hip clamp frames', HCL, file=sys.stderr)

LOCS = []; HW = {'left': [], 'right': []}; WH = {'left': np.zeros(NF), 'right': np.zeros(NF)}; LK = []
for i in range(NF):
    t = tt[i]; loc = {b: LOC[b][i].copy() for b in JOINTS}; Wd, Pd = fk(i, loc); lk = [False, False]
    for sd, sg in (('left', 1), ('right', -1)):
        c = sd + 'Foot'; w, bt = cw(c, t)
        if w > 0:
            T = Pd[c] + w * (bt[0] - Pd[c])
            W1, W2 = two_bone(Wd, Pd, sd + 'Thigh', sd + 'Shin', c, T, L_TH, L_SH); setw(loc, Wd, sd + 'Thigh', W1); Wd, Pd = fk(i, loc)
            setw(loc, Wd, sd + 'Shin', W2); Wd, Pd = fk(i, loc)
            toe = Wd[c] @ Z3; th = np.array([toe[0], 0, toe[2]]); th = nrm(th) if np.linalg.norm(th) > 1e-3 else toe
            Wf = aim(Z3, -Y3, nrm(toe + w * (th - toe)), nrm(Wd[c] @ -Y3 + w * (-Y3 - Wd[c] @ -Y3))); setw(loc, Wd, c, Wf); Wd, Pd = fk(i, loc)
        c = sd + 'Hand'; w, bt = cw(c, t)
        if w > 0:
            Wd, Pd = ik_arm(i, loc, sd, bt[0], w)
            lk[0 if sd == 'left' else 1] = bool(bt[2] and w >= 0.99)
            Hw = aim(sg * X3, -Y3, bt[1], -Y3)   # planted palm (blended with the forearm after the twist pass)
        else:
            Hw = None   # airborne: hand follows the forearm (relaxed wrist) after the twist pass
        HW[sd].append(Hw); WH[sd][i] = w
    LOCS.append(loc); LK.append(lk)

# ---------------- pass 2: arm twist (elbow swing b, forearm roll g) by dynamic programming over the whole clip ----------------
SOL = {}; BR = {'left': [], 'right': []}; PH = {}
for sd, sg in (('left', 1), ('right', -1)):
    nb, ng = len(BG), len(GG); INF = 1e18
    brs = []
    for i in range(NF):
        Wd, Pd = fk(i, LOCS[i]); s_, h0 = bref(Wd, Pd, sd, sg); brs.append(-s_ * h0)   # straight arm: grid centred on zero humerus twist
    brs = np.array(brs); BR[sd] = list(brs)
    cost = np.zeros((nb, ng)); bp = []
    for i in range(NF):
        Wd, Pd = fk(i, LOCS[i]); Hw = HW[sd][i]
        if Hw is None: Hw = Wd[sd + 'Forearm']
        br = brs[i]
        nc = node_cost(Wd, Pd, sd, sg, Hw, WH[sd][i], br)
        if i == 0: cost = nc + 0.0; bp.append(None); continue
        # transitions: at most one grid step (10 deg) in b and g per 1/120 s
        best = np.full((nb, ng), INF); arg = np.zeros((nb, ng, 2), int)
        for db in (-1, 0, 1):
            for dg in (-1, 0, 1):
                sh = np.full((nb, ng), INF)
                sb = slice(max(0, db), nb + min(0, db)); tb_ = slice(max(0, -db), nb + min(0, -db))
                sg_ = slice(max(0, dg), ng + min(0, dg)); tg_ = slice(max(0, -dg), ng + min(0, -dg))
                sh[tb_, tg_] = cost[sb, sg_] + 0.4 * (abs(db) + abs(dg))
                m = sh < best; best[m] = sh[m]; arg[m] = (db, dg)
        cost = best + nc; bp.append(arg)
    kb, kg = np.unravel_index(np.argmin(cost), cost.shape); path = [None] * NF
    for i in range(NF - 1, -1, -1):
        path[i] = (kb, kg)
        if i > 0: db, dg = bp[i][kb, kg]; kb, kg = kb + db, kg + dg
    SOL[sd] = path
    print('arm', sd, 'final cost %.0f' % cost.min(), file=sys.stderr)

BT = {}; GT = {}
for sd in ('left', 'right'):
    bt_ = np.degrees(np.unwrap(np.radians([BR[sd][i] + BG[SOL[sd][i][0]] for i in range(NF)])))
    gt_ = np.array([GG[SOL[sd][i][1]] for i in range(NF)])
    k_ = np.exp(-0.5 * (np.arange(-15, 16) / KSIG) ** 2); k_ /= k_.sum(); pad = lambda v: np.concatenate([v[:1].repeat(15), v, v[-1:].repeat(15)])
    BT[sd] = np.convolve(pad(bt_), k_, 'valid'); GT[sd] = np.convolve(pad(gt_), k_, 'valid')
frames = []; DUMP = {}
for i in range(NF):
    loc = LOCS[i]; Wd, Pd = fk(i, loc)
    for sd, sg in (('left', 1), ('right', -1)):
        kb, kg = SOL[sd][i]; c = sd + 'Hand'
        Hw = HW[sd][i]; Hrel = loc[c]
        _, _, _, _, _, U, F = metrics(Wd['torso'], sg, Pd[sd + 'UpperArm'], Pd[sd + 'Forearm'], Pd[c], Wd[sd + 'UpperArm'], Wd[sd + 'Forearm'], Wd[c], BT[sd][i:i + 1], GT[sd][i:i + 1])
        setw(loc, Wd, sd + 'UpperArm', U[0]); Wd, Pd = fk(i, loc); setw(loc, Wd, sd + 'Forearm', F[0, 0]); Wd, Pd = fk(i, loc)
        if Hw is not None: setw(loc, Wd, c, Slerp([0, 1], Rot.from_matrix(np.stack([Wd[sd + 'Forearm'], Hw])))([WH[sd][i]]).as_matrix()[0])
        else: loc[c] = Slerp([0, 1], Rot.from_matrix(np.stack([np.eye(3), Hrel])))([0.4]).as_matrix()[0]   # relaxed wrist in the air
        Wd, Pd = fk(i, loc)
    frames.append({'p': [round(float(v), 5) for v in Pd['pelvis']], 'q': {b: [round(float(v), 6) for v in m2q(loc[b])] for b in JOINTS}, 'lock': LK[i]})
    for b in JOINTS:
        DUMP.setdefault('P_' + b, []).append(Pd[b]); DUMP.setdefault('W_' + b, []).append(Wd[b])
np.savez(dump.replace('.npz', '_xf.npz'), B=B, o=o, fps=FPS)
np.savez_compressed(dump, fps=np.array(float(FPS)), **{k: np.array(v) for k, v in DUMP.items()})
cam = toW(np.zeros(3)); tgt = toW(hm); tgt[1] = 0.75
fov = math.degrees(2 * math.atan(CY / F_PX))
fr = lambda f: int(round((f - FR[0]) / FPS0 * FPS))
anim = {'cams': {'v0': {'p': [round(float(v), 4) for v in cam], 't': [round(float(v), 4) for v in tgt], 'f': round(fov, 2)}},
        'id': 'breaking-airflare', 'name': 'Air Flare（视频 2D 关键点重投影拟合，三圈）r3', 'model': 'v3', 'fps': FPS, 'count': len(frames),
        'source': 'move_airflare_r3.py (r2 + rigid lower back, hip limits, pivoting planted palms; clip01 precision 10118-10273)',
        'phases': [{'n': '起势：右脚+右手入式', 'f': 0}, {'n': '左手接撑（入圈）', 'f': fr(10160)},
                   {'n': '圈1 左手单撑', 'f': fr(10168)}, {'n': '圈1 胸朝上', 'f': fr(10179)}, {'n': '圈1 腾空展开', 'f': fr(10181)}, {'n': '圈1 右手接撑', 'f': fr(10183)},
                   {'n': '圈2 左手单撑', 'f': fr(10198)}, {'n': '圈2 胸朝上', 'f': fr(10209)}, {'n': '圈2 腾空展开', 'f': fr(10210)}, {'n': '圈2 右手接撑', 'f': fr(10212)},
                   {'n': '圈3 左手单撑', 'f': fr(10229)}, {'n': '圈3 胸朝上', 'f': fr(10239)}, {'n': '圈3 腾空展开', 'f': fr(10241)}, {'n': '圈3 右手接撑', 'f': fr(10243)},
                   {'n': '收势：左脚落地', 'f': fr(10260)}, {'n': '右脚落地', 'f': fr(10273)}],
        'frames': frames}
json.dump(anim, open(out, 'w'), ensure_ascii=False)
print('frames', len(frames), 'cam', anim['cams']['v0'])
