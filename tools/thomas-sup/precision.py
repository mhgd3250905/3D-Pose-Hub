#!/usr/bin/env python3
"""Thomas supplement r2 precision check (2026-11-19): measure an action against its movement standard.
   python3 tools/thomas-sup/precision.py <check-output.json> [--std tools/thomas-sup/standards/<id>.json] [--out <json>] [--table]
Input = the JSON written by `node tools/thomas-sup/check.mjs --out ...` (V5 body joints J + world quaternions Q, hub joints H, per sample).
All metrics are measured on the V5 body that the render machine draws (J/Q), hub joints (H) only for the palm/toe/heel points the
V5 rig has no bone for. Rig rest frame (all bones): +Y = up (cranial), +Z = front (anterior), +X = body left.
Phases: the standard names phases (start/top/bottom/hold ...); tools/thomas-sup/actions.json "phases" maps each name to time
windows (s) of this spec's timeline. Exit 1 when any check fails."""
import json, math, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
src = json.load(open(args[0]))
aid = src['id']
std = json.load(open(opt('--std', os.path.join(ROOT, 'tools/thomas-sup/standards', aid + '.json'))))
plan = next(a for a in json.load(open(os.path.join(ROOT, 'tools/thomas-sup/actions.json')))['actions'] if a['id'] == aid)
phases = plan.get('phases', {})

sub = lambda a, b: [a[i] - b[i] for i in range(3)]
add = lambda a, b: [a[i] + b[i] for i in range(3)]
mul = lambda a, k: [x * k for x in a]
dot = lambda a, b: sum(a[i] * b[i] for i in range(3))
norm = lambda a: math.sqrt(dot(a, a))
unit = lambda a: mul(a, 1 / (norm(a) or 1e-12))
mid = lambda a, b: mul(add(a, b), 0.5)
cross = lambda a, b: [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
deg = lambda r: r * 180 / math.pi
def ang(a, b, c):
    u, v = unit(sub(a, b)), unit(sub(c, b)); return deg(math.acos(max(-1, min(1, dot(u, v)))))
def qrot(q, v):   # three.js quaternion [x,y,z,w]
    x, y, z, w = q; ix = w * v[0] + y * v[2] - z * v[1]; iy = w * v[1] + z * v[0] - x * v[2]; iz = w * v[2] + x * v[1] - y * v[0]; iw = -x * v[0] - y * v[1] - z * v[2]
    return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]
def qinv(q): return [-q[0], -q[1], -q[2], q[3]]
def seg_closest(p, a, b):
    ab = sub(b, a); t = max(0, min(1, dot(sub(p, a), ab) / (dot(ab, ab) or 1e-12))); return t, add(a, mul(ab, t))

_bars = (plan.get('fixedBarGrip') or {}).get('bars') or {}
BARZ = (sum(b['bar'][2] for b in _bars.values()) / len(_bars)) if _bars and all(abs(b['axis'][0]) > 0.99 for b in _bars.values()) else None
KNEE_R, ARM_R = 0.050, 0.042   # knee (distal thigh) and upper-arm half thickness on the V5 body, m (qa.py upperArm radius 42 mm)

S = src['samples']

def metrics(s):
    J, Q, H, Y = s['J'], s['Q'], s['H'], s['minY']
    m = {}
    if 'grip' in s:   # v5.grip (dumbbell in the hand): handle vs hand (hand frame, rigid), dumbbell vs the rest of the body (per frame)
        m['gripPenMm'] = s['grip']['handlePenMm']; m['gripClearMm'] = s['grip']['clearMm']; m['gripContactMin'] = min(s['grip']['contact'][:4])
    if 'hubGrasp' in s:   # v5.hubGraspHands (r3): hub fixed fist vs bar / its fixed dumbbell handle, dumbbell vs body, wrist seam (check.mjs)
        hg = s['hubGrasp']; sd = [k for k in ('left', 'right') if k in hg]
        m['seamStepMinMm'] = min(hg['seam'][k]['min'] for k in sd); m['seamStepMaxMm'] = max(hg['seam'][k]['max'] for k in sd)
        bars = [hg[k]['bar'] for k in sd if 'bar' in hg[k]]
        if bars: m['barMinMm'] = min(b['minMm'] for b in bars); m['barWrapDeg'] = min(b['wrapDeg'] for b in bars); m['barContact'] = min(b['contact2mm'] for b in bars)
        dbs = [hg[k]['dumbbell'] for k in sd if hg[k].get('dumbbell')]
        if dbs:
            m['dbHandleMinMm'] = min(d['handle']['minMm'] for d in dbs); m['dbWrapDeg'] = min(d['handle']['wrapDeg'] for d in dbs)
            m['dbContact'] = min(d['handle']['contact2mm'] for d in dbs); m['dbClearMm'] = min(d['bodyClearMm'] for d in dbs)
    m['elbowL'], m['elbowR'] = s['ang']['leftElbow'], s['ang']['rightElbow']
    m['elbowMin'] = min(m['elbowL'], m['elbowR'])
    m['kneeMin'] = min(s['ang']['leftKnee'], s['ang']['rightKnee'])
    sh, wr = mid(J['leftUpperArm'], J['rightUpperArm']), mid(J['leftHand'], J['rightHand'])
    hip, ank = mid(J['leftThigh'], J['rightThigh']), mid(J['leftFoot'], J['rightFoot'])
    toe = mid(H['leftToe'], H['rightToe'])
    # forward = horizontal direction from the feet to the hands (= where the head points in a plank)
    f = unit([wr[0] - ank[0], 0, wr[2] - ank[2]]); lat = unit(cross([0, 1, 0], f))
    m['shoulderLeadCm'] = round(dot([sh[0] - wr[0], 0, sh[2] - wr[2]], f) * 100, 2)   # + = shoulders in front of the wrists
    m['armFromVerticalDeg'] = round(deg(math.atan2(dot(sub(sh, wr), f), sh[1] - wr[1])), 1)
    # body line thorax-hip-ankle: signed hip offset from the shoulder->ankle line in the sagittal plane (+ = hips above = pike)
    # upper point = the thorax at shoulder level (torso pivot), not the shoulder joints, which ride on the shoulder blades
    th = J['torso']; ax = unit(sub(ank, th)); hp = sub(hip, th); perp = sub(hp, mul(ax, dot(hp, ax)))
    up_s = unit(sub([0, 1, 0], mul(ax, dot([0, 1, 0], ax))))
    m['hipOffsetMm'] = round(dot(perp, up_s) * 1000, 1)
    m['bodyLineDeg'] = round(ang(th, hip, ank), 1)
    # kneeling variants (r3, 2026-11-19): the same signed hip offset, but from the thorax -> knee line (knee = V5 shin pivots)
    kn = mid(J['leftShin'], J['rightShin']); axk = unit(sub(kn, th)); pk = sub(hip, th); perpk = sub(pk, mul(axk, dot(pk, axk)))
    up_k = unit(sub([0, 1, 0], mul(axk, dot([0, 1, 0], axk))))
    m['hipOffsetKneeMm'] = round(dot(perpk, up_k) * 1000, 1)
    # trunk: flexion of the thorax (torso bone) relative to the pelvis, about the body's left axis (+ = rounded/flexed, - = arched)
    tu = qrot(qinv(Q['pelvis']), qrot(Q['torso'], [0, 1, 0]))
    m['trunkFlexDeg'] = round(deg(math.atan2(tu[2], tu[1])), 2)
    su = qrot(qinv(Q['spineUpper']), qrot(Q['torso'], [0, 1, 0]))
    m['upperBackFlexDeg'] = round(deg(math.atan2(su[2], su[1])), 2)
    # scapula: shoulder joint (upper-arm pivot) in the thorax frame; z = anterior (protraction), |x| = away from the spine
    for side, k in (('left', 'L'), ('right', 'R')):
        loc = qrot(qinv(Q['torso']), sub(J[side + 'UpperArm'], J['torso']))
        m['scapFwd' + k] = round(loc[2] * 1000, 1); m['scapLat' + k] = round(abs(loc[0]) * 1000, 1); m['scapUp' + k] = round(loc[1] * 1000, 1)
    m['scapFwd'] = round((m['scapFwdL'] + m['scapFwdR']) / 2, 1); m['scapLat'] = round((m['scapLatL'] + m['scapLatR']) / 2, 1)
    m['scapUp'] = round((m['scapUpL'] + m['scapUpR']) / 2, 1)
    m['chestHeightMm'] = round(J['torso'][1] * 1000, 1)
    # shoulder flexion/extension (r3, 2026-11-19): upper arm (shoulder -> elbow) in the thorax frame, sagittal angle from the thorax
    # down axis; + = arm behind the trunk (extension), - = in front (flexion). Per side and the smaller of the two.
    for side, k in (('left', 'L'), ('right', 'R')):
        ua = qrot(qinv(Q['torso']), sub(J[side + 'Forearm'], J[side + 'UpperArm']))
        m['shoulderExt' + k] = round(deg(math.atan2(-ua[2], -ua[1])), 1)
    m['shoulderExtMin'] = min(m['shoulderExtL'], m['shoulderExtR']); m['shoulderExtMax'] = max(m['shoulderExtL'], m['shoulderExtR'])
    # whole-body tilt / swing (r3): thorax -> mid-ankle line angle from straight down, sagittal plane of the rig (+ = feet in front, +Z)
    m['bodySwingDeg'] = round(deg(math.atan2(ank[2] - J['torso'][2], J['torso'][1] - ank[1])), 1)
    m['legSwingDeg'] = round(deg(math.atan2(ank[2] - hip[2], hip[1] - ank[1])), 1)
    m['shoulderToEarMm'] = None
    # head: angle between the face direction and the thorax front (neutral neck ~ 0-20), and gaze below horizontal
    face, tf = qrot(Q['head'], [0, 0, 1]), qrot(Q['torso'], [0, 0, 1])
    m['headVsTrunkDeg'] = round(ang(face, [0, 0, 0], tf), 1)
    m['gazeBelowHorizDeg'] = round(deg(math.asin(max(-1, min(1, -face[1])))), 1)
    m['neckFlexDeg'] = round(deg(math.atan2(qrot(qinv(Q['torso']), qrot(Q['head'], [0, 1, 0]))[2], qrot(qinv(Q['torso']), qrot(Q['head'], [0, 1, 0]))[1])), 1)
    # wrist extension = 180 - angle(elbow, wrist, finger line) (palm flat + vertical forearm = 90)
    for side, k in (('left', 'L'), ('right', 'R')):   # palm flat on the floor: finger line = horizontal wrist -> palm direction
        w = J[side + 'Hand']; fd = sub(H[side + 'Palm'], H[side + 'Wrist']); fd = unit([fd[0], 0, fd[2]])
        m['wristExt' + k] = round(180 - ang(J[side + 'Forearm'], w, add(w, fd)), 1)
    m['wristExtMax'] = max(m['wristExtL'], m['wristExtR'])
    # finger direction vs forward (0 = fingers forward, 90 = turned out)
    for side, k in (('left', 'L'), ('right', 'R')):
        fd = sub(H[side + 'Palm'], H[side + 'Wrist']); fd = unit([fd[0], 0, fd[2]]); m['fingerTurnOut' + k] = round(deg(math.acos(max(-1, min(1, dot(fd, f))))), 1)
    # feet / toes
    m['footClearMm'] = min(Y.get('footL', 1e9), Y.get('footR', 1e9))
    m['shinClearMm'] = min(Y.get('shinL', 1e9), Y.get('shinR', 1e9))
    m['kneeFloorMm'] = min(Y.get('shinL', 1e9), Y.get('thighL', 1e9), Y.get('shinR', 1e9), Y.get('thighR', 1e9))
    m['toeY'] = round(min(H['leftToe'][1], H['rightToe'][1]) * 1000, 1)
    m['handFloorMm'] = min(Y.get('handL', 1e9), Y.get('handR', 1e9))
    m['seatContactMm'] = min(Y.get('torso', 1e9), Y.get('thighL', 1e9), Y.get('thighR', 1e9))   # r3: seated contact (buttocks / backs of thighs)
    m['seatFloorMm'] = Y.get('torso', 1e9)   # r3: lowest pelvis/torso skin vertex vs the floor (seated: the buttocks on the mat)
    # knee on the upper arm (frog stand): knee pivot (V5 shin bone) vs the upper-arm segment of the same side
    for side, k in (('left', 'L'), ('right', 'R')):
        kn = J[side + 'Shin']; t, c = seg_closest(kn, J[side + 'UpperArm'], J[side + 'Forearm'])
        m['kneeArmGapMm' + k] = round((norm(sub(kn, c)) - KNEE_R - ARM_R) * 1000, 1)
        m['kneeArmT' + k] = round(t, 3)                        # 0 = shoulder ... 1 = elbow
        m['kneeOutsideArmMm' + k] = round(abs(dot(sub(kn, mid(J['leftThigh'], J['rightThigh'])), lat)) * 1000 - abs(dot(sub(c, mid(J['leftThigh'], J['rightThigh'])), lat)) * 1000, 1)
    m['kneeArmGapMax'] = max(m['kneeArmGapMmL'], m['kneeArmGapMmR']); m['kneeArmGapMin'] = min(m['kneeArmGapMmL'], m['kneeArmGapMmR'])
    m['kneeArmTmin'] = min(m['kneeArmTL'], m['kneeArmTR']); m['kneeArmTmax'] = max(m['kneeArmTL'], m['kneeArmTR'])
    m['kneeOutsideMin'] = min(m['kneeOutsideArmMmL'], m['kneeOutsideArmMmR'])
    # forearm vs thigh (frog stand: the elbow must not dig into the distal thigh): capsule gap on the V5 joints with the
    # check.mjs / drill-anim qa.py radii (forearm 34 mm, thigh 68 mm), mm, < 0 = capsules overlap (r2 fix 2026-11-19)
    def seg_gap(a, b, c, d, n=40):
        return min(norm(sub(add(a, mul(sub(b, a), i / n)), seg_closest(add(a, mul(sub(b, a), i / n)), c, d)[1])) for i in range(n + 1))
    m['forearmThighGapMm'] = round(min(seg_gap(J[sd + 'Forearm'], J[sd + 'Hand'], J[sd + 'Thigh'], J[sd + 'Shin']) for sd in ('left', 'right')) * 1000 - 102, 1)
    for side, k in (('left', 'L'), ('right', 'R')):   # hand bone rotation vs the first sample (palm rocking on the floor)
        q, q0 = Q[side + 'Hand'], S[0]['Q'][side + 'Hand']; m['handRot' + k] = round(2 * deg(math.acos(min(1, abs(sum(x * y for x, y in zip(q, q0)))))), 2)
    m['handRotMax'] = max(m['handRotL'], m['handRotR'])
    m['hipAboveShoulderMm'] = round((hip[1] - sh[1]) * 1000, 1)
    # whole-body centre of mass (segment masses and CoM fractions: de Leva 1996, male), horizontal offset from the wrists along forward
    seg = [(0.4346, J['pelvis'], J['neck'], 0.5), (0.0694, J['neck'], J['head'], 0.5)]
    for sd in ('left', 'right'):
        seg += [(0.0271, J[sd + 'UpperArm'], J[sd + 'Forearm'], 0.577), (0.0162, J[sd + 'Forearm'], J[sd + 'Hand'], 0.457), (0.0061, J[sd + 'Hand'], H[sd + 'Palm'], 0.79),
                (0.1416, J[sd + 'Thigh'], J[sd + 'Shin'], 0.41), (0.0433, J[sd + 'Shin'], J[sd + 'Foot'], 0.44), (0.0137, J[sd + 'Foot'], H[sd + 'Toe'], 0.44)]
    tm = sum(w for w, *_ in seg); com = [sum(w * (a[i] + (b[i] - a[i]) * fr) for w, a, b, fr in seg) / tm for i in range(3)]
    m['comLeadCm'] = round(dot([com[0] - wr[0], 0, com[2] - wr[2]], f) * 100, 2)   # + = in front of the wrists (over the palms)
    m['comLeadAirborneCm'] = m['comLeadCm'] if m['footClearMm'] > 5 else None   # only while both feet are off the mat
    # hanging / support actions (r3, 2026-11-19), rig facing +Z: world-sagittal measures
    # r3 (hubGraspHands): a bar the fixed fist really holds (actions.json fixedBarGrip.bars along X) is the support point, so the bar line
    # replaces the wrist bones as the reference (the wrist hangs ~5 cm behind the bar axis in the fist)
    m['comFwdCm'] = round((com[2] - (BARZ if BARZ is not None else wr[2])) * 100, 2)   # + = centre of mass in front of the hands (bar) along +Z
    m['comFwdShCm'] = round((com[2] - sh[2]) * 100, 2)
    for side, k in (('left', 'L'), ('right', 'R')):   # leg elevation: hip -> ankle angle from straight down (90 = level)
        lv = unit(sub(J[side + 'Foot'], J[side + 'Thigh'])); m['legElev' + k] = round(deg(math.acos(max(-1, min(1, -lv[1])))), 1)
    m['legElevMin'] = min(m['legElevL'], m['legElevR'])
    tu_w = qrot(Q['torso'], [0, 1, 0]); m['thoraxPitchDeg'] = round(deg(math.atan2(tu_w[2], tu_w[1])), 1)   # + = thorax top tipped forward (+Z)
    pu_w = qrot(Q['pelvis'], [0, 1, 0]); m['pelvisPitchDeg'] = round(deg(math.atan2(pu_w[2], pu_w[1])), 1)
    m['anklesApartCm'] = round(norm(sub(J['leftFoot'], J['rightFoot'])) * 100, 1)
    m['shoulderBarZcm'] = round((sh[2] - wr[2]) * 100, 2)
    # planche (r3): body tilt = thorax -> mid-ankle line vs horizontal (+ = feet higher than the chest); straddle = angle between the legs
    hz = math.hypot(ank[0] - J['torso'][0], ank[2] - J['torso'][2]); m['bodyTiltDeg'] = round(deg(math.atan2(ank[1] - J['torso'][1], hz)), 1)
    m['straddleDeg'] = round(deg(math.acos(max(-1, min(1, dot(unit(sub(J['leftFoot'], J['leftThigh'])), unit(sub(J['rightFoot'], J['rightThigh']))))))), 1)
    m['toeTopMm'] = round(max(H['leftToe'][1], H['rightToe'][1]) * 1000, 1)   # r3: highest toe point (support swing: never above the bars)
    m['propClearMm'] = min(s['prop'].values()) if s.get('prop') else None   # r3: closest body skin (hands excluded) to the props' QA capsules
    m['hipAboveWristMm'] = round((hip[1] - wr[1]) * 1000, 1); m['shoulderAboveWristMm'] = round((sh[1] - wr[1]) * 1000, 1)
    # wrist / forearm drills (r4, 2026-11-19), right hand. Hand frame = the hub's rest palm frame (engine.js palmFrame: right finger
    # axis [-0.9825, 0.0548, 0.1778], palm normal [-0.0607, -0.9978, -0.0276], out of the palm) carried by the V5 hand bone's world
    # rotation (V5 copies the hub's). F = forearm axis (V5 forearm pivot -> hand pivot); n0 = palm normal made perpendicular to F.
    F = unit(sub(J['rightHand'], J['rightForearm'])); fg = qrot(Q['rightHand'], [-0.98253144, 0.05483374, 0.17783482])
    pn = qrot(Q['rightHand'], [-0.06068526, -0.99777448, -0.02762938]); n0 = unit(sub(pn, mul(F, dot(pn, F)))); sd = cross(F, n0)
    m['wristFlexR'] = round(deg(math.atan2(dot(fg, n0), dot(fg, F))), 1)        # + = flexion (fingers toward the palm side), - = extension
    m['wristDevR'] = round(deg(math.asin(max(-1, min(1, dot(fg, sd))))), 1)      # side bend (radial/ulnar deviation), sign = F x n0
    upP = unit(sub([0, 1, 0], mul(F, F[1]))); med = cross(upP, F)               # med: horizontal, toward the body midline for the right arm
    m['supR'] = round(deg(math.atan2(dot(n0, upP), dot(n0, med))), 1)           # forearm rotation: 0 = thumb up, +90 = palm up, -90 = palm down
    m['thighLowMm'] = min(Y.get('thighL', 1e9), Y.get('thighR', 1e9))           # seated on a bench: backs of the thighs vs the floor (mm)
    m['forearmPitchDeg'] = round(deg(math.asin(max(-1, min(1, F[1])))), 1)       # forearm axis vs horizontal (+ = hand end up)
    # straddle leg lift (r4, 2026-11-19): lifted heel = the higher of the two feet's lowest skin points; knee cap / toes direction =
    # shin and foot bone front (+Z at rest) made perpendicular to the shin axis, angle to world up made perpendicular too (0 = up)
    m['legLiftMm'] = max(Y.get('footL', -1e9), Y.get('footR', -1e9)); m['footDownMm'] = min(Y.get('footL', 1e9), Y.get('footR', 1e9))
    for side, k in (('left', 'L'), ('right', 'R')):
        if side + 'Shin' not in Q: continue
        ax = unit(sub(J[side + 'Foot'], J[side + 'Shin'])); upP = sub([0, 1, 0], mul(ax, ax[1]))
        if norm(upP) < 1e-6: continue
        upP = unit(upP)
        # signed (+ = turned toward the body midline = inward rotation); thigh and shin rolls set where the V5 knee cap (patella =
        # thigh/shin slerp) faces; the foot only follows the ankle. Toes are also checked on the hub toe point (ankle -> toe).
        med = cross(upP, ax) if side == 'right' else cross(ax, upP)
        segs = (('thighUp', 'Thigh', 'Shin'), ('kneeUp', 'Shin', 'Foot'), ('toeUp', 'Foot', 'Foot'))
        for nm, bone, _ in segs:
            if bone == 'Thigh' and side + 'Thigh' not in Q: continue
            v = qrot(Q[side + bone], [0, 0, 1]); v = unit(sub(v, mul(ax, dot(v, ax))))
            m[nm + 'Deg' + k] = round(deg(math.acos(max(-1, min(1, dot(v, upP))))), 1); m[nm + 'Signed' + k] = round(deg(math.atan2(dot(v, med), dot(v, upP))), 1)
        tv = sub(H[side + 'Toe'], H[side + 'Ankle']); tv = unit(sub(tv, mul(ax, dot(tv, ax)))); m['toePtUpDeg' + k] = round(deg(math.acos(max(-1, min(1, dot(tv, upP))))), 1)
    if 'kneeUpDegL' in m:
        m['kneeUpDegMax'] = max(m['kneeUpDegL'], m['kneeUpDegR'], m.get('thighUpDegL', 0), m.get('thighUpDegR', 0))
        m['toeUpDegMax'] = max(m['toeUpDegL'], m['toeUpDegR'], m['toePtUpDegL'], m['toePtUpDegR'])
    for side, k, n0 in (('left', 'L', [0.06068526, -0.99777448, -0.02762938]), ('right', 'R', [-0.06068526, -0.99777448, -0.02762938])):
        pv = qrot(Q[side + 'Hand'], n0); m['palmDownDeg' + k] = round(deg(math.acos(max(-1, min(1, -pv[1])))), 1)   # 0 = palm flat facing the floor
    m['palmDownDegMax'] = max(m['palmDownDegL'], m['palmDownDegR'])
    # arm twist (r4, 2026-11-19, t-seated-forearm-rotation 肘部「拧着」), right arm, check.mjs 'arm' (V5 bones + skinned mesh):
    # the elbow is a hinge: no roll of the forearm bone against the upper arm (elbowTwistR), the forearm folds toward the elbow pit
    # (elbowPitR), pronation/supination = hand vs forearm twist spread along the forearm by the V5 twist helpers (handTwistR); the
    # whole forearm rotation vs the upper arm = forearmTwistR. upperArmRotR = upper-arm roll about its own axis in the thorax frame vs
    # the first sample (inward/outward rotation drifting over the cycle). Mesh: mean azimuth of the elbow-band skin ([-0.08, 0.04] of
    # the forearm length about the elbow) vs a pure hinge, proximal forearm band [0.04, 0.15], and the elbow-band radius vs the upper-arm
    # band [-0.4, -0.2] (pinch; 1 = as thick as the upper arm band ratio at rest).
    # r5 (2026-11-19): the same metrics per side, suffix R (right arm, r4 names unchanged) and L (left arm, the resting arm of
    # t-seated-forearm-rotation and the pressing hand of the self-resisted wrist drills).
    for side, k in (('right', 'R'), ('left', 'L')):
        if not ('arm' in s and s['arm'] and side in s['arm']): continue
        a = s['arm'][side]; m['elbowTwist' + k] = a['elbowTwistDeg']; m['elbowTwistAbs' + k] = abs(a['elbowTwistDeg'])
        m['elbowPit' + k] = a['elbowPitDeg']; m['elbowPitAbs' + k] = None if a['elbowPitDeg'] is None else abs(a['elbowPitDeg'])
        m['handTwist' + k] = a['handTwistDeg']; m['forearmTwist' + k] = round(a['elbowTwistDeg'] + a['handTwistDeg'], 2)
        a0 = S[0]['arm'][side]; q = a['uaT']; q0 = a0['uaT']; ax = a['aU']
        x0, y0, z0, w0 = qinv(q0); x1, y1, z1, w1 = q   # rel = q0^-1 * q (three.js [x,y,z,w])
        rel = [w0 * x1 + x0 * w1 + y0 * z1 - z0 * y1, w0 * y1 - x0 * z1 + y0 * w1 + z0 * x1, w0 * z1 + x0 * y1 - y0 * x1 + z0 * w1, w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1]
        pp, ww = dot(rel[:3], ax), rel[3]
        if ww < 0: pp, ww = -pp, -ww
        m['upperArmRot' + k] = round(deg(2 * math.atan2(pp, ww)), 2)
        ms = {tuple(b['at']): b for b in a['mesh']}
        eb, pf, ub = ms[(-0.08, 0.04)], ms[(0.04, 0.15)], ms[(-0.4, -0.2)]
        m['elbowSkinTwistAbs' + k] = abs(eb['azDeg']); m['proxForearmSkinTwistAbs' + k] = abs(pf['azDeg'])
        m['elbowPinch' + k] = round(eb['radius'] / ub['radius'], 3)
    return m

M = [(s['t'], metrics(s)) for s in S]
dur = max(t for t, _ in M) + (S[1]['t'] - S[0]['t'] if len(S) > 1 else 0)
def win(name):
    if name in (None, 'all'): return [[0, 1e9]]
    w = phases.get(name); assert w, f'phase {name} not mapped in actions.json phases'
    return w
def pick(name): W = win(name); return [m for t, m in M if any(a - 1e-6 <= t <= b + 1e-6 for a, b in W)]
def agg(vals, how):
    vals = [v for v in vals if v is not None]
    if not vals: return None
    return {'min': min(vals), 'max': max(vals), 'range': max(vals) - min(vals), 'mean': sum(vals) / len(vals)}[how]
def plateau(metric, ref, tol, phase=None):   # longest run (s) where metric stays within tol of ref ('max'/'min' of the cycle)
    seq = [(t, m[metric]) for t, m in M]; vals = [v for _, v in seq]; r = max(vals) if ref == 'max' else min(vals)
    dt = seq[1][0] - seq[0][0]; best = cur = 0
    for _, v in seq + seq:   # wrap (loop)
        cur = cur + 1 if abs(v - r) <= tol else 0; best = max(best, cur)
    return round(min(best, len(seq)) * dt, 2)
def count_peaks(metric, ref, tol):
    seq = [m[metric] for _, m in M]; r = max(seq) if ref == 'max' else min(seq); inn = [abs(v - r) <= tol for v in seq]
    return sum(1 for i in range(len(inn)) if inn[i] and not inn[i - 1])

res = []
for c in std['checks']:
    if c.get('kind') == 'plateau':
        v = plateau(c['metric'], c['ref'], c['tol'])
    elif c.get('kind') == 'diff':   # phase A agg minus phase B agg
        v = agg([m[c['metric']] for m in pick(c['phase'])], c['agg']) - agg([m[c['metric']] for m in pick(c['phase2'])], c['agg2'])
    elif c.get('kind') == 'pins':   # worst contact slip (mm) of the planted hub contact points over their planted windows (check.mjs)
        # hands: V5 hand bones (the hub's metric wrist/palm points are not updated by shoulders.shift; the bones are); feet: hub toe points
        # feet: horizontal drift of the V5 foot contact patch (vertices within 3 mm of the lowest; toe tips on the mat) over each planted window
        which = c.get('which', 'all'); sm = src['summary']
        if which == 'knees':   # kneeling contacts (r3): V5 shin pivots (= knee joints) over their planted windows
            v = max([x['driftMm'] for k, x in sm.get('pins', {}).items() if 'Shin' in k] or [None])
            v = None if v is None else round(v, 2); lo, hi = c.get('min', -1e18), c.get('max', 1e18)
            res.append({'id': c['id'], 'label': c['label'], 'value': v, 'min': c.get('min'), 'max': c.get('max'), 'unit': c.get('unit', ''),
                        'pass': v is not None and lo - 1e-9 <= v <= hi + 1e-9}); continue
        v = max([x['driftMm'] for k, x in sm.get('pins', {}).items() if 'Hand' in k] or [0]) if which in ('all', 'hands') else 0
        for p in plan.get('checks', {}).get('pins', []):
            if 'Foot' not in p['bone'] or which == 'hands': continue
            if 'minP' not in S[0]:   # older check output (no lowest-vertex positions): fall back to the hub toe point
                hp = sm.get('hubPins', {}).get(p['hub'] + (':' + p['label'] if p.get('label') else ''))
                if hp: v = max(v, hp['driftMm'])
                continue
            reg = 'footL' if p['bone'].startswith('left') else 'footR'
            P = [s['minP'].get(reg + 'Patch', s['minP'][reg]) for s in S if any(a - 1e-6 <= s['t'] <= b + 1e-6 for a, b in p['when'])]
            if P: mx, mz = sum(q[0] for q in P) / len(P), sum(q[2] for q in P) / len(P); v = max(v, round(max(math.hypot(q[0] - mx, q[2] - mz) for q in P) * 1000, 1))
    elif c.get('kind') == 'summary':
        v = src['summary']
        for k in c['path'].split('.'): v = v[k]
    elif c.get('kind') == 'plateau_above':   # longest run (s) where metric >= above
        dt = S[1]['t'] - S[0]['t']; best = cur = 0
        for _, m in M + M: cur = cur + 1 if m[c['metric']] >= c['above'] else 0; best = max(best, cur)
        v = round(min(best, len(M)) * dt, 2)
    elif c.get('kind') == 'transition':   # r3: shortest 10%->90% (or 90%->10%; 'frac' overrides) change of the metric over the loop, s (too fast = bouncing)
        seq = [m[c['metric']] for _, m in M]; lo_, hi_ = min(seq), max(seq); fa, fb = c.get('frac', [0.1, 0.9]); a_, b_ = lo_ + fa * (hi_ - lo_), lo_ + fb * (hi_ - lo_)
        dt = S[1]['t'] - S[0]['t']; best = None
        for up in {'up': (True,), 'down': (False,)}.get(c.get('dir'), (True, False)):   # dir: up = 10%->90% only, down = 90%->10% only
            last = None
            for i, x in enumerate(seq + seq):
                if (x <= a_ if up else x >= b_): last = i
                elif last is not None and (x >= b_ if up else x <= a_): best = (i - last) * dt if best is None else min(best, (i - last) * dt); last = None
        v = best
    elif c.get('kind') == 'reps':
        v = count_peaks(c['metric'], c['ref'], c['tol'])
    else:
        v = agg([m[c['metric']] for m in pick(c.get('phase'))], c['agg'])
    v = None if v is None else round(v, 2)
    lo, hi = c.get('min', -1e18), c.get('max', 1e18)
    ok = v is not None and lo - 1e-9 <= v <= hi + 1e-9
    res.append({'id': c['id'], 'label': c['label'], 'value': v, 'min': c.get('min'), 'max': c.get('max'), 'unit': c.get('unit', ''), 'pass': ok,
                **({'advisory': True} if c.get('advisory') else {})})
out = {'id': aid, 'frames': src['frames'], 'stride': src['stride'], 'pass': all(r['pass'] or r.get('advisory') for r in res), 'checks': res,
       'series': {k: [m[k] for _, m in M] for k in std.get('series', [])}, 't': [t for t, _ in M]}
if opt('--out'): json.dump(out, open(opt('--out'), 'w'), ensure_ascii=False, indent=1)
if '--table' in args:
    for r in res:
        rng = f"[{'' if r['min'] is None else r['min']} .. {'' if r['max'] is None else r['max']}]"
        print(f"{'OK ' if r['pass'] else ('ADV' if r.get('advisory') else 'BAD')} {r['id']:<22} {str(r['value']):>9} {r['unit']:<4} {rng:<16} {r['label']}")
print(json.dumps({'id': aid, 'pass': out['pass'], 'failed': [r['id'] for r in res if not r['pass'] and not r.get('advisory')], 'advisory': [r['id'] for r in res if not r['pass'] and r.get('advisory')]}, ensure_ascii=False))
sys.exit(0 if out['pass'] else 1)
