# Legacy action accuracy audit r1 (2026-11-21): per-action metrics + findings from audit.mjs dumps and standards/<id>.json.
#   python3 tools/legacy-audit-r1/analyze.py <dump.json> [--std standards/<id>.json]  -> prints JSON {id, metrics, findings}
# Conventions (V5 rig, see tools/v5/runtime/v5-hub.js): bind world rotations are identity, so Q (world quaternion) is the rotation
# from bind; +Y up, body forward in bind = +Z. A bone's bind axis = R_bone^-1 (J_child - J_bone).
import json, sys, math, os
import numpy as np
from scipy.spatial.transform import Rotation as R
from scipy.spatial import ConvexHull

HERE = os.path.dirname(os.path.abspath(__file__))
UP = np.array([0., 1., 0.])
# segment masses (fraction of body mass; Dempster/Winter rounded): segment = (proximal joint, distal joint, mass, com fraction)
SEG = [('pelvis', 'torso', .30, .5), ('torso', 'neck', .20, .5), ('neck', 'head', .081, 1.0),
       ('leftUpperArm', 'leftForearm', .028, .44), ('rightUpperArm', 'rightForearm', .028, .44),
       ('leftForearm', 'leftHand', .022, .6), ('rightForearm', 'rightHand', .022, .6),
       ('leftThigh', 'leftShin', .10, .43), ('rightThigh', 'rightShin', .10, .43),
       ('leftShin', 'leftFoot', .0465, .43), ('rightShin', 'rightFoot', .0465, .43)]
FOOT_M = .0145
CROTCH_BUMP = [28, 32]   # mm, set from the calibration (see REPORT): s-9090 43, Flare supine straddle 32, standing baseline in REPORT


def unit(v):
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else v * 0


def hz(v):
    v = np.array(v, float).copy(); v[1] = 0; return v


def sangle(a, b):  # signed angle a->b about +Y, degrees
    a, b = unit(hz(a)), unit(hz(b))
    return math.degrees(math.atan2(np.dot(np.cross(a, b), UP), np.dot(a, b)))


def twist_swing(q_rel, axis):
    """q_rel scipy Rotation; axis unit (bind). Returns twist deg about axis, swing rotvec (deg)."""
    x, y, z, w = q_rel.as_quat()
    p = np.dot([x, y, z], axis)
    tw = 2 * math.degrees(math.atan2(p, w))
    if tw > 180: tw -= 360
    if tw < -180: tw += 360
    twist = R.from_rotvec(math.radians(tw) * axis)
    swing = q_rel * twist.inv()
    return tw, np.degrees(swing.as_rotvec())


def com(J):
    c = np.zeros(3); m = 0
    for a, b, mass, f in SEG:
        p = np.array(J[a]) + f * (np.array(J[b]) - np.array(J[a])); c += mass * p; m += mass
    for f in ('leftFoot', 'rightFoot'):
        c += FOOT_M * np.array(J[f]); m += FOOT_M
    return c / m


def hull_dist(points2, p2):
    """signed distance (m) of p2 to convex hull of points2 (positive = outside)."""
    P = np.array(points2)
    if len(P) < 3: return None
    try:
        h = ConvexHull(P)
    except Exception:
        return None
    best = -1e9
    for eq in h.equations:  # n.x + d <= 0 inside
        best = max(best, np.dot(eq[:2], p2) + eq[2])
    if best <= 0: return best
    # outside: distance to polygon
    V = P[h.vertices]; d = 1e9
    for i in range(len(V)):
        a, b = V[i], V[(i + 1) % len(V)]; ab = b - a
        t = np.clip(np.dot(p2 - a, ab) / max(np.dot(ab, ab), 1e-12), 0, 1)
        d = min(d, np.linalg.norm(p2 - (a + t * ab)))
    return d


def frame_metrics(s):
    J = {k: np.array(v) for k, v in s['J'].items()}
    Q = {k: R.from_quat(v) for k, v in s['Q'].items()}
    m = {'f': s['f'], 't': s['t']}
    pel_fwd = unit(hz(Q['pelvis'].apply([0, 0, 1])))
    m['pelvisH'] = J['pelvis'][1]
    for side, S in (('L', 'left'), ('R', 'right')):
        hip, knee, ank = J[S + 'Thigh'], J[S + 'Shin'], J[S + 'Foot']
        kang = s['ang'][S + 'Knee']; m['knee' + side] = kang
        # bone axes in bind
        ax_th = unit(Q[S + 'Thigh'].inv().apply(knee - hip)); ax_sh = unit(Q[S + 'Shin'].inv().apply(ank - knee))
        sg = 1.0 if side == 'L' else -1.0   # V5 bind faces +Z: the body's left is +X
        # knee as a hinge, in the thigh frame (bind coords): shin direction d; off-plane = lateral deviation from the thigh's sagittal
        # plane (+ = ankle lateral of the knee line = valgus); flexion = posterior swing; tibial twist = shin anterior vs the anterior a
        # pure hinge would carry (+ = external)
        qt = Q[S + 'Thigh']; d = unit(qt.inv().apply(ank - knee))
        m['kneeOff' + side] = math.degrees(math.asin(np.clip(d[0] * sg, -1, 1)))
        flex = math.atan2(-d[2], -d[1]); m['kneeFlexDir' + side] = math.degrees(flex)
        a_s = (qt.inv() * Q[S + 'Shin']).apply([0, 0, 1]); a_e = R.from_rotvec([flex, 0, 0]).apply([0, 0, 1])
        pr = lambda v: unit(v - np.dot(v, d) * d)
        a_s, a_e = pr(a_s), pr(a_e)
        m['kneeTwist' + side] = sg * math.degrees(math.atan2(np.dot(np.cross(a_e, a_s), d), np.dot(a_e, a_s)))
        # ankle in the shin frame: toe-out vs the knee's facing (+ = toe out), inversion (+ = sole turned inward)
        qa = Q[S + 'Shin'].inv() * Q[S + 'Foot']; ff = qa.apply([0, 0, 1]); fu = qa.apply([0, 1, 0])
        m['ankleTwist' + side] = math.degrees(math.atan2(ff[0] * sg, ff[2]))
        m['ankleInv' + side] = math.degrees(math.atan2(fu[0] * sg, fu[1]))
        m['ankleFlex' + side] = math.degrees(math.atan2(ff[1], ff[2]))   # + = toes up (dorsiflexion) relative to the shin's rest
        # hip rotation: thigh anterior vs pelvis (twist about the thigh axis), magnitude only used as detail
        ax_th = unit(Q[S + 'Thigh'].inv().apply(knee - hip))
        twh, swh = twist_swing(Q['pelvis'].inv() * Q[S + 'Thigh'], ax_th)
        m['hipRot' + side] = twh * sg
        ffw = Q[S + 'Foot'].apply([0, 0, 1]); fup = Q[S + 'Foot'].apply([0, 1, 0])
        m['footUpTilt' + side] = math.degrees(math.acos(np.clip(fup[1], -1, 1)))
        m['footPitch' + side] = math.degrees(math.asin(np.clip(ffw[1], -1, 1)))
        ha = ank - hip; tt = np.dot(knee - hip, ha) / max(np.dot(ha, ha), 1e-9); kp = knee - (hip + tt * ha)
        m['kp' + side] = float(np.linalg.norm(kp))
        lat = unit(hz(hip - J['pelvis']))
        fd = unit(hz(ffw)); perp = np.cross(UP, fd)
        if np.dot(perp, lat) < 0: perp = -perp
        kph = hz(kp)
        m['kneeVsToe' + side] = math.degrees(math.atan2(np.dot(kph, perp), np.dot(kph, fd))) if np.linalg.norm(kph) > 0.02 else None
        # what a viewer sees at the knee (world space, no bind-axis assumptions): knee pointing kpu = from the hip-ankle line to the knee;
        # thighFace / shinFace = angle about the segment axis between the segment's anterior (kneecap side) and kpu (0 = the knee
        # bends straight back under its kneecap); footVsKnee = toe direction vs kpu about the shin axis (0 = toes on the kneecap side,
        # +/-180 = toes pointing back to the calf = reversed foot). Only meaningful with the knee bent (flex >= 30 deg).
        def pang(a, b, ax):
            a = a - np.dot(a, ax) * ax; b = b - np.dot(b, ax) * ax
            if np.linalg.norm(a) < 0.25 or np.linalg.norm(b) < 1e-6: return None
            a, b = unit(a), unit(b); return sg * math.degrees(math.atan2(np.dot(np.cross(a, b), ax), np.dot(a, b)))
        if 180 - kang >= 30 and np.linalg.norm(kp) > 0.01:
            kpu = unit(kp); tax = unit(knee - hip); sax = unit(ank - knee)
            m['thighFace' + side] = pang(Q[S + 'Thigh'].apply([0, 0, 1]), kpu, tax)
            m['shinFace' + side] = pang(Q[S + 'Shin'].apply([0, 0, 1]), kpu, sax)
            m['footVsKnee' + side] = pang(ffw, kpu, sax)
            rv = (Q[S + 'Thigh'].inv() * Q[S + 'Shin']).as_rotvec(); ax = unit(rv) * np.array([1, sg, sg])
            m['kneeAxisDev' + side] = math.degrees(math.acos(np.clip(abs(ax[0]), 0, 1)))
        else:
            m['thighFace' + side] = m['shinFace' + side] = m['footVsKnee' + side] = m['kneeAxisDev' + side] = None
        m['kneeLatOfFoot' + side] = float(np.dot(hz(knee - ank), perp))   # + = knee outside the foot's long axis line (m)
        m['kneeFwdOfAnkle' + side] = float(np.dot(hz(knee - ank), fd))
        mid = ank + 0.07 * unit(hz(ffw))
        m['midfoot' + side] = mid.tolist()
        # foot / shin vs body (posterior = behind the hip along pelvis forward)
        m['footBehind' + side] = float(np.dot(hz(ank - hip), pel_fwd))
        m['footAboveKnee' + side] = float(ank[1] - knee[1])
        m['soleHeel' + side] = s['sole']['foot' + side + '_heel']; m['soleFore' + side] = s['sole']['foot' + side + '_fore']
        m['footMin' + side] = s['minY'].get('foot' + side)
    for side, S in (('L', 'left'), ('R', 'right')):
        ax_fa = unit(Q[S + 'Forearm'].inv().apply(J[S + 'Hand'] - J[S + 'Forearm']))
        tw, sw = twist_swing(Q[S + 'UpperArm'].inv() * Q[S + 'Forearm'], ax_fa)
        m['elbowTwist' + side] = tw
    m['kneeSep'] = float(np.linalg.norm(J['leftShin'] - J['rightShin']))
    m['spineTotal'] = math.degrees((Q['pelvis'].inv() * Q['torso']).magnitude())
    c = com(s['J']); m['com'] = c.tolist()
    for side in 'LR':
        mf = np.array(m['midfoot' + side]); m['comToMidfoot' + side] = float(np.linalg.norm(hz(c - mf)))
    cells = [(x, z) for x, z, h, r in s['contact'] if h < 15]
    regs = sorted({r for x, z, h, r in s['contact'] if h < 15})
    m['contactRegions'] = regs
    m['comOutside'] = hull_dist(cells, np.array([c[0], c[2]])) if len(cells) >= 3 else None
    for side in 'LR':
        fc = [(x, z) for x, z, h, r in s['contact'] if h < 15 and r == 'foot' + side]
        m['comVsFoot' + side] = hull_dist(fc, np.array([c[0], c[2]])) if len(fc) >= 3 else None
    m['crotchBump'] = (s['crotch'].get('bump') or {}).get('mm')
    m['minY'] = s['minY']
    m['crotch'] = s['crotch']
    return m


def mirror_pose(s):
    """pose in pelvis-yaw frame; returns dict of key points and their L/R-mirrored counterpart."""
    J = {k: np.array(v) for k, v in s['J'].items()}
    Qp = R.from_quat(s['Q']['pelvis']); fwd = unit(hz(Qp.apply([0, 0, 1])))
    right = np.cross(fwd, UP)  # x axis
    o = J['pelvis']
    def loc(p):
        d = p - o; return np.array([np.dot(d, right), d[1], np.dot(d, fwd)])
    keys = ['Shin', 'Foot', 'Forearm', 'Hand']
    P = {}
    for k in keys:
        P['left' + k] = loc(J['left' + k]); P['right' + k] = loc(J['right' + k])
    P['head'] = loc(J['head']); P['torso'] = loc(J['torso'])
    return P


def mirror_dist(Pa, Pb):
    """distance between pose b and the mirror of pose a (m, max over points)."""
    d = 0
    for k, v in Pa.items():
        if k.startswith('left'): mk = 'right' + k[4:]
        elif k.startswith('right'): mk = 'left' + k[5:]
        else: mk = k
        mv = v.copy(); mv[0] = -mv[0]
        d = max(d, np.linalg.norm(Pb[mk] - mv))
    return d


def self_dist(Pa, Pb):
    return max(np.linalg.norm(Pa[k] - Pb[k]) for k in Pa)


def load_std(path):
    return json.load(open(path)) if path and os.path.exists(path) else {}


def analyze(dump, std):
    S = dump['samples']
    F = [frame_metrics(s) for s in S]
    poses = [mirror_pose(s) for s in S]
    out = {'id': dump['id'], 'frames': len(S), 'findings': [], 'metrics': {}}
    find = out['findings']
    def add(code, sev, msg, val, frames, conf='high'):
        find.append({'code': code, 'severity': sev, 'msg': msg, 'value': val, 'frames': frames[:8], 'confidence': conf})
    pos = std.get('position', '')
    # ---------- stationary planted feet (for knee/heel/hover checks)
    def planted(i, side):
        fm = F[i]['footMin' + side]
        if fm is None or fm > 25: return False
        # stationary vs neighbours
        J0 = np.array(S[i]['J'][('left' if side == 'L' else 'right') + 'Foot'])
        for j in (i - 1, i + 1):
            if 0 <= j < len(S):
                if np.linalg.norm(np.array(S[j]['J'][('left' if side == 'L' else 'right') + 'Foot']) - J0) > 0.02: return False
        return True
    # ---------- 1 knee vs toe on loaded bent leg
    kvt = []
    for i, m in enumerate(F):
        for side in 'LR':
            if not planted(i, side): continue
            flex = 180 - m['knee' + side]
            if flex < 35 or m['kneeVsToe' + side] is None: continue
            if m['pelvisH'] < 0.35 and pos not in ('standing',): continue  # kneeling/seated: knee not a load path via the foot
            # load share: is the CoM closer to this foot than the other?
            kvt.append((m['kneeVsToe' + side], side, m['f'], flex))
    if kvt:
        worst = min(kvt, key=lambda x: x[0])
        out['metrics']['kneeVsToeMin'] = round(worst[0], 1)
        out['metrics']['kneeVsToeMax'] = round(max(x[0] for x in kvt), 1)
        bad = [x for x in kvt if x[0] < -std.get('valgusTolDeg', 15)]
        if bad:
            w = min(bad, key=lambda x: x[0]); sev = 1 if w[0] < -30 else 2
            add('knee-valgus', sev, f"负重屈膝腿膝盖比脚尖方向往内偏 {-w[0]:.0f}°（{'左' if w[1]=='L' else '右'}腿，屈膝 {w[3]:.0f}°）",
                round(w[0], 1), sorted({x[2] for x in bad}))
        badout = [x for x in kvt if x[0] > std.get('varusTolDeg', 35)]
        if badout:
            w = max(badout, key=lambda x: x[0])
            add('knee-out-of-toe', 2, f"负重屈膝腿膝盖比脚尖方向往外偏 {w[0]:.0f}°（{'左' if w[1]=='L' else '右'}腿）", round(w[0], 1), sorted({x[2] for x in badout}))
    kl = []
    for i, m in enumerate(F):
        for side in 'LR':
            if not planted(i, side) or 180 - m['knee' + side] < 45: continue
            if m['pelvisH'] < 0.35 and pos not in ('standing',): continue
            kl.append((m['kneeLatOfFoot' + side], side, m['f'], 180 - m['knee' + side]))
    if kl:
        out['metrics']['kneeLatOfFootMin'] = round(min(x[0] for x in kl), 3); out['metrics']['kneeLatOfFootMax'] = round(max(x[0] for x in kl), 3)
        bad = [x for x in kl if x[0] < -std.get('kneeInTolM', 0.04)]
        if len(bad) >= 2:
            w = min(bad)
            add('knee-inside-foot', 1 if w[0] < -0.08 else 2, f"负重屈膝时膝盖落在脚的内侧 {-w[0]*100:.0f} cm（膝内扣，{'左' if w[1]=='L' else '右'}腿）", round(w[0], 3), [b[2] for b in bad])
        bad = [x for x in kl if x[0] > std.get('kneeOutTolM', 0.10)]
        if len(bad) >= 2:
            w = max(bad)
            add('knee-outside-foot', 1 if w[0] > 0.14 else 2, f"负重屈膝时膝盖远在脚的外侧 {w[0]*100:.0f} cm（膝过度外翻，小腿斜向内，{'左' if w[1]=='L' else '右'}腿）", round(w[0], 3), [b[2] for b in bad])
    # ---------- 2 joint ROM (hinge twist etc.)
    lim = {'thighFace': (45, 60, '膝盖（髌骨）朝向与屈膝方向不一致'), 'shinFace': (45, 60, '小腿拧转（胫骨前侧偏离屈膝平面）'),
           'kneeAxisDev': (42, 50, '膝关节非铰链运动（屈膝轴偏离）'), 'footVsKnee': (60, 120, '脚尖与膝盖朝向不一致')}
    for k, (t2, t1, name) in lim.items():
        tol = std.get('rom', {}).get(k)
        if tol: t2, t1 = tol
        for side in 'LR':
            vals = [(abs(m[k + side]), m[k + side], m['f']) for m in F if m.get(k + side) is not None]
            if not vals: continue
            w = max(vals)
            out['metrics'][k + side] = round(w[1], 1)
            if w[0] > t2:
                frames = [v[2] for v in vals if v[0] > t2]
                if len(frames) < 2 and len(vals) > 3: continue
                msg = f"{name}{'左' if side=='L' else '右'}侧 {w[1]:.0f}°（阈值 {t2}°）"
                if k == 'footVsKnee' and w[0] > 150: msg = f"{'左' if side=='L' else '右'}脚朝向反了：脚尖指向小腿后侧（与膝盖朝向差 {w[1]:.0f}°，解剖上不可能）"
                add('rom-' + k, 1 if w[0] > t1 else 2, msg, round(w[1], 1), frames, 'medium' if k in ('kneeAxisDev', 'elbowTwist') else 'high')
    for k in ('kneeTwist', 'kneeOff', 'ankleTwist', 'ankleInv', 'hipRot', 'elbowTwist'):   # bind-relative readings, kept as info only
        for side in 'LR':
            out['metrics']['info_' + k + side] = round(max((m[k + side] for m in F), key=abs), 1)
    kf = min(min(m['kneeL'], m['kneeR']) for m in F)
    for side in 'LR':
        hx = max(m['knee' + side] for m in F)
        out['metrics']['kneeMax' + side] = round(hx, 1)
    # ---------- 3 floor: penetration / hover of planted feet / heel
    pen = {}
    for m in F:
        for r, v in m['minY'].items():
            if v < pen.get(r, (1e9,))[0]: pen[r] = (v, m['f'])
    out['metrics']['floorMin'] = {r: v[0] for r, v in pen.items()}
    for r, (v, f) in pen.items():
        if v < -8:
            add('floor-penetration', 1 if v < -30 else 2 if v < -15 else 3, f"{r} 穿入地面/垫子 {-v:.0f} mm", v, [f])
    hov = []
    for i, m in enumerate(F):
        for side in 'LR':
            if planted(i, side):
                fm = m['footMin' + side]
                if fm > 8: hov.append((fm, side, m['f']))
    if hov and len(hov) >= 2:
        w = max(hov)
        add('foot-hover', 3 if w[0] < 15 else 2, f"站定的脚悬空 {w[0]:.0f} mm（{'左' if w[1]=='L' else '右'}脚）", w[0], sorted({h[2] for h in hov}), 'medium')
    # ---------- 4 crotch / groin bulge
    co = max(F, key=lambda m: m['crotch']['outMm']); cs = max(F, key=lambda m: m['crotch']['spikeMm'])
    out['metrics']['crotchOutMm'] = co['crotch']['outMm']; out['metrics']['crotchSpikeMm'] = cs['crotch']['spikeMm']
    out['metrics']['crotchAt'] = co['crotch']['atOut']; out['metrics']['crotchOutFrame'] = co['f']
    out['metrics']['crotchSpikeFrame'] = cs['f']
    bm = [(m['crotchBump'], m['f']) for m in F if m.get('crotchBump') is not None]
    if bm:
        w = max(bm); out['metrics']['crotchBumpMm'] = w[0]; out['metrics']['crotchBumpFrame'] = w[1]
        bs = max(F, key=lambda m: m['crotchBump'] or -1)['crotch']['bump']; out['metrics']['crotchBumpAt'] = bs.get('at')
        CT = std.get('crotchBump', CROTCH_BUMP)
        # visibility: bump normal (bind, pelvis frame) carried by the pelvis, vs the direction to the recipe camera
        def vis(m, smp):
            b = smp['crotch'].get('bump') or {}
            if not b.get('n') or 'cam' not in smp: return None
            nw = R.from_quat(smp['Q']['pelvis']).apply(b['n']); pw = np.array(smp['J']['pelvis'])
            return float(np.dot(unit(nw), unit(np.array(smp['cam']) - pw)))
        vv = [(m['crotchBump'], vis(m, S[i]), m['f']) for i, m in enumerate(F) if m.get('crotchBump') is not None]
        front = (bs.get('at') or [0, 0, 0])[2] > 0.02
        big = [x for i, x in enumerate(vv) if x[0] >= CT[1] and F[[m['f'] for m in F].index(x[2])]['kneeSep'] >= 0.30]   # legs apart: groin open to view
        if w[0] > CT[0]:
            sevc = 1 if len(big) >= 2 else 2
            add('crotch-bulge', sevc, f"裆部网格局部鼓包 {w[0]:.0f} mm（相对周围 4 cm 区域沿法线外凸；{'前裆' if (bs.get('at') or [0,0,0])[2] > 0.02 else '会阴'}；{'两腿分开时可见，敏感' if sevc == 1 else '幅度较小或两腿并拢遮挡'}）",
                w[0], [x[1] for x in bm if x[0] > CT[0]], 'medium')
    # ---------- 5 CoM vs support
    co_out = [(m['comOutside'], m['f']) for m in F if m['comOutside'] is not None]
    if co_out:
        w = max(co_out)
        out['metrics']['comOutsideMaxCm'] = round(w[0] * 100, 1)
        tol = std.get('comTolCm', 4)
        cpos = {m['f']: np.array(m['com']) for m in F}; fs_ = [m['f'] for m in F]; dt = dump['stride'] / 30
        def speed(f):
            k = fs_.index(f); nb = [fs_[j] for j in (k - 1, k + 1) if 0 <= j < len(fs_)]
            return max(np.linalg.norm(hz(cpos[f] - cpos[g])) / (abs(f - g) / 30) for g in nb) if nb else 0
        pl = dump.get('props', []); props = [p for p in pl if p != 'mat'] + (['block'] if pl.count('mat') > 1 else [])
        bad = [x for x in co_out if x[0] * 100 > tol and speed(x[1]) < 0.25] if (not props and pos in ('standing', 'half-kneeling', 'kneeling', '')) else []
        fl = [b[1] for b in bad]; st = dump['stride']
        consec = any(fl[k + 1] - fl[k] <= st for k in range(len(fl) - 1))
        if bad and (consec or std.get('kind') == 'hold'):
            add('com-outside-support', 1 if w[0] * 100 > 12 else 2, f"重心投影落在支撑面外 {w[0]*100:.0f} cm（静力上站不住）", round(w[0] * 100, 1), [b[1] for b in bad], 'medium')
    # ---------- 6 mirror / side switch
    asym = [self_dist(p, {**{('right' + k[4:] if k.startswith('left') else 'left' + k[5:] if k.startswith('right') else k): (lambda v: np.array([-v[0], v[1], v[2]]))(v) for k, v in p.items()}}) for p in poses]
    out['metrics']['asymMaxCm'] = round(max(asym) * 100, 1)
    n = len(poses)
    best_mirror = 1e9; pair = None
    for i in range(n):
        if asym[i] < 0.15: continue
        for j in range(n):
            d = mirror_dist(poses[i], poses[j])
            if d < best_mirror: best_mirror, pair = d, (S[i]['f'], S[j]['f'])
    out['metrics']['mirrorMatchCm'] = round(best_mirror * 100, 1) if pair else None
    has_switch = pair is not None and best_mirror < 0.12
    out['metrics']['hasSideSwitch'] = has_switch if pair else None
    exp = std.get('expectSwitch')
    if exp is True and pair and not has_switch:
        add('text-no-switch', 1, f"文字/名称要求左右换边（{std.get('switchBasis','')}），视频里没有左右切换（最接近镜像姿态仍差 {best_mirror*100:.0f} cm）",
            round(best_mirror * 100, 1), [pair[0], pair[1]])
    if exp is False and has_switch and std.get('unilateral'):
        add('unexpected-switch', 3, '单侧动作视频里出现左右镜像切换（App 还会再镜像一次）', round(best_mirror * 100, 1), list(pair), 'low')
    if std.get('symmetric') and not std.get('unilateral'):
        bad = [(a, S[i]['f']) for i, a in enumerate(asym) if a > std.get('asymTol', 0.10)]
        if len(bad) >= 2:
            w = max(bad)
            add('asymmetry', 2, f"双侧对称动作左右不对称 {w[0]*100:.0f} cm", round(w[0] * 100, 1), [b[1] for b in bad], 'medium')
    # ---------- 6b text kind vs motion: a hold should hold, reps should move
    kind = std.get('kind')
    if kind and len(poses) >= 6:
        L = max(3, int(len(poses) * 0.3)); rng = 1e9   # the stillest 30 % window (holds usually loop enter -> hold -> exit)
        for k in range(0, len(poses) - L + 1):
            win = poses[k:k + L]; rng = min(rng, max(self_dist(a, b) for a in win for b in win))
        allr = max(self_dist(a, b) for a in poses for b in poses)
        out['metrics']['motionMidCm'] = round(rng * 100, 1); out['metrics']['motionAllCm'] = round(allr * 100, 1)
        if kind == 'hold' and rng > 0.12:
            add('text-hold-moving', 2, f"文字是静态保持（hold），视频里找不到静止段（最稳的 30% 时长内仍变化 {rng*100:.0f} cm）", round(rng * 100, 1), [], 'medium')
        if kind and kind.startswith('rep') and allr < 0.04:
            add('text-reps-static', 2, f"文字是做次数（{kind}），视频几乎不动（最大位移 {allr*100:.1f} cm）", round(allr * 100, 1), [], 'medium')
    # ---------- 7 action-specific checks from the standard
    for c in std.get('checks', []):
        res = run_check(c, F, S)
        if res: add(c['code'], c.get('severity', 2), res[0], res[1], res[2], c.get('confidence', 'high'))
    out['metrics']['kneeMinAll'] = round(kf, 1)
    return out


def run_check(c, F, S):
    kind = c['kind']
    win = c.get('when')  # [t0,t1] fraction of duration or None
    dur = S[-1]['t'] + 1e-9 if S else 1
    sel = [m for m in F if not win or (win[0] <= m['t'] / dur <= win[1])]
    if kind == 'range':
        # metric (or expression of sides) in [lo,hi] on frames where cond holds
        key = c['metric']; lo, hi = c.get('lo', -1e9), c.get('hi', 1e9)
        vals = []
        for m in sel:
            if 'cond' in c and not eval(c['cond'], {}, {'m': m, 'abs': abs, 'min': min, 'max': max}): continue
            v = eval(key, {}, {'m': m, 'abs': abs, 'min': min, 'max': max})
            if v is None: continue
            vals.append((v, m['f']))
        if not vals: return (c['msg'] + '（没有满足条件的帧）', None, []) if c.get('requireFrames') else None
        bad = [x for x in vals if not (lo <= x[0] <= hi)]
        if len(bad) >= c.get('minFrames', 2) or (c.get('minFrames', 2) == 1 and bad):
            w = max(bad, key=lambda x: max(lo - x[0], x[0] - hi))
            return (c['msg'].format(v=w[0]), round(w[0], 1), [b[1] for b in bad])
    if kind == 'exists':
        vals = [m['f'] for m in sel if eval(c['cond'], {}, {'m': m, 'abs': abs, 'min': min, 'max': max})]
        if not vals: return (c['msg'], None, [])
    return None


if __name__ == '__main__':
    dump = json.load(open(sys.argv[1]))
    stdp = sys.argv[sys.argv.index('--std') + 1] if '--std' in sys.argv else os.path.join(HERE, 'standards', dump['id'] + '.json')
    print(json.dumps(analyze(dump, load_std(stdp)), ensure_ascii=False, default=float))
