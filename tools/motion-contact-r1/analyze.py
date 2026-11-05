#!/usr/bin/env python3
"""Motion-amplitude (class 1), contact-position (class 2) and extra low-cost screens (class 5+) from scan-fast.json.
usage: analyze.py fast.json catalog.json outdir"""
import json, sys, re, math, csv, os
import numpy as np

fast = json.load(open(sys.argv[1]))
cat = {d['id']: d for d in json.load(open(sys.argv[2]))['drills']}
OUT = sys.argv[3]
os.makedirs(OUT, exist_ok=True)

def V(j, k): return np.array(j[k]) if k in j else None
def ang(a, b):
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na < 1e-9 or nb < 1e-9: return 0.0
    return math.degrees(math.acos(max(-1, min(1, float(a @ b) / na / nb))))

def angles(j):
    o = {}
    trunk = V(j, 'shoulderCenter') - V(j, 'pelvis')
    o['trunkIncl'] = ang(trunk, np.array([0, 1, 0]))
    for s in ('left', 'right'):
        S, E, W, H, K, A, T = (V(j, s + x) for x in ('Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle', 'Toe'))
        o[s + 'Elbow'] = 180 - ang(E - S, W - E)          # 180 = straight
        o[s + 'ShoulderElev'] = ang(E - S, -trunk)         # 0 = arm down by side
        o[s + 'Knee'] = 180 - ang(K - H, A - K)
        o[s + 'Hip'] = ang(K - H, -trunk)                  # 0 = leg in line with trunk
        o[s + 'Ankle'] = ang(K - A, T - A)
    return o

PART = {'arms': ['leftElbow', 'rightElbow', 'leftShoulderElev', 'rightShoulderElev'],
        'legs': ['leftKnee', 'rightKnee', 'leftHip', 'rightHip', 'leftAnkle', 'rightAnkle'],
        'trunk': ['trunkIncl']}
EFFP = {'arms': ['leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], 'legs': ['leftAnkle', 'rightAnkle', 'leftKnee', 'rightKnee', 'leftToe', 'rightToe'],
        'trunk': ['head', 'shoulderCenter', 'pelvis']}
MG = {'arms': {'deltoids', 'chest', 'scapular', 'lats', 'triceps', 'forearms', 'rotator-cuff', 'biceps'},
      'legs': {'glute-max', 'hip-flexors', 'quadriceps', 'hamstrings', 'hip-abductors', 'adductors', 'calves', 'tibialis'},
      'trunk': {'abs', 'obliques', 'erectors', 'neck'}}
HOLD_RE = re.compile(r'停住不动|保持不动|撑住不动|定格|停住|静力|保持')

def text(d): return d['name']['zh'] + '。' + '。'.join(d['cues']['zh'])

# ---------- class 1 ----------
c1 = []
for id_, r in fast.items():
    if 'J' not in r: continue
    d = cat.get(id_, {})
    A = [angles(f['j']) for f in r['J']]
    keys = A[0].keys()
    rng = {k: max(a[k] for a in A) - min(a[k] for a in A) for k in keys}
    exc = {}
    for k in r['J'][0]['j']:
        P = np.array([f['j'][k] for f in r['J']])
        exc[k] = float(np.linalg.norm(P.max(0) - P.min(0))) * 1000
    part_ang = {p: max(rng[k] for k in ks) for p, ks in PART.items()}
    part_exc = {p: max(exc.get(k, 0) for k in ks) for p, ks in EFFP.items()}
    maxang, maxexc = max(part_ang.values()), max(part_exc.values())
    # static fraction: consecutive samples where every joint moves < 4 mm
    P = np.array([[f['j'][k] for k in sorted(f['j'])] for f in r['J']])
    step = np.linalg.norm(np.diff(np.vstack([P, P[:1]]), axis=0), axis=2).max(1) * 1000
    static = float((step < 4).mean())
    groups = set(d.get('muscleGroups', []))
    exp = [p for p in MG if groups & MG[p]]
    hold = d.get('defaultDose', {}).get('mode') == 'time' or bool(HOLD_RE.search(text(d))) if d else False
    sev, why = 0, []
    if hold:
        if maxang < 10 and maxexc < 80: sev, why = 3, ['保持类但整个循环几乎不动（没有进入/退出过程）']
        elif maxang < 25 and maxexc < 150: sev, why = 2, ['保持类，进入/退出幅度很小（起始姿势已接近保持姿势）']
        elif maxang < 35 and maxexc < 250: sev, why = 1, ['保持类，进入/退出幅度偏小']
    else:
        if maxang < 10 and maxexc < 80: sev, why = 3, ['计次动作整个循环几乎不动']
        elif maxang < 20 and maxexc < 150: sev, why = 2, ['计次动作幅度偏小']
        if static > 0.6: sev = max(sev, 1); why.append(f'循环里 {static:.0%} 时间完全静止')
    best = max(part_ang, key=lambda p: part_ang[p] / 30 + part_exc[p] / 200)
    if exp and not hold:
        e_ok = any(part_ang[p] >= 12 or part_exc[p] >= 100 for p in exp)
        if not e_ok and (maxang >= 15 or maxexc >= 120):
            sev = max(sev, 2); why.append(f'该动的部位({"/".join(exp)})几乎没动，主要在动的是 {best}')
    topang = sorted(rng.items(), key=lambda x: -x[1])[:3]
    topexc = sorted(exc.items(), key=lambda x: -x[1])[:3]
    c1.append(dict(id=id_, name=d.get('name', {}).get('zh', ''), hold=hold, severity=sev, issue='；'.join(why),
                   maxJointRangeDeg=round(maxang, 1), maxExcursionMm=round(maxexc), staticFrac=round(static, 2),
                   expectedParts='/'.join(exp), mostMovingPart=best,
                   topJointRanges=' '.join(f'{k}:{v:.0f}°' for k, v in topang), topExcursions=' '.join(f'{k}:{v:.0f}mm' for k, v in topexc),
                   arms=f"{part_ang['arms']:.0f}°/{part_exc['arms']:.0f}mm", legs=f"{part_ang['legs']:.0f}°/{part_exc['legs']:.0f}mm",
                   trunk=f"{part_ang['trunk']:.0f}°/{part_exc['trunk']:.0f}mm", duration=r['duration'], cue0=d.get('cues', {}).get('zh', [''])[0]))

# ---------- class 2 ----------
PROP = re.compile(r'椅|墙|杠|杆|砖|把手|毛巾|弹力带|壶铃|哑铃|门框|滑盘|滑垫|凳|沙发|吊环|带子|环')
def seg_t(p, a, b):
    ab = b - a; return float(np.clip((p - a) @ ab / (ab @ ab), 0, 1))

def hand_rule(sent):
    """returns (kind, target, desc) or None"""
    s = sent
    if re.search(r'抱住?(一侧)?膝盖|抱膝|单膝抱胸', s): return ('body', 'knee-hug', '手抱在膝下小腿/膝窝附近')
    if re.search(r'叉腰|扶腰|扶髋|手放在髋上', s): return ('body', 'waist', '手扶在髋/腰侧')
    if re.search(r'放在膝盖上|扶在.*膝盖外面', s): return ('body', 'knee-top', '手在膝盖上/外侧')
    if re.search(r'(手|前臂).*放在大腿|放在大腿外侧', s): return ('body', 'thigh', '手/前臂放在大腿上')
    if re.search(r'手抓脚踝|抓住?脚', s): return ('body', 'ankle', '手抓脚踝')
    if re.search(r'按在肘关节上方', s): return ('body', 'other-upperarm-elbow', '另一手按在对侧上臂肘上方')
    if re.search(r'后颈', s): return ('body', 'neck', '手放后颈')
    if re.search(r'交叉放在胸前', s): return ('body', 'chest', '双手交叉放胸前')
    if re.search(r'环抱', s): return ('body', 'hug-back', '双臂环抱，手到对侧肩背')
    if PROP.search(s): return None
    if re.search(r'前臂.*撑|前臂平板|前臂侧撑|手肘和手背贴地|撑到手肘|前臂和膝盖撑地', s): return ('floor', 'forearm', '前臂撑地')
    if re.search(r'撑地|撑在身后|撑在臀部两侧|撑在膝盖两侧|撑在肩膀正下方|俯卧撑|俯撑|跪撑|四点支撑|熊式支撑|平板|手背贴地|掌心贴地|双手撑起|分腿支撑|L ?撑|V撑|推地', s):
        return ('floor', 'hand', '手撑地')
    return None

def foot_rule(sent):
    if re.search(r'踩(椅|毛巾|弹力带|滑|在下面膝盖)|搭在|脚跟踩椅|踩住弹力带|踩上椅', sent): return None
    if re.search(r'双脚踩|整只脚踩|脚踩稳|脚跟踩地|脚跟一直踩地|脚跟踩实|前脚.*踩|后脚跟踩实|支撑脚踩|另一只脚踩|一只脚踩地|脚踩实', sent): return ('floor', 'foot', sent)
    return None

c2 = []
for id_, r in fast.items():
    if 'C' not in r: continue
    d = cat.get(id_)
    if not d: continue
    sents = [x for x in re.split('[，。；]', text(d)) if x]
    rules = []
    for s in sents:
        h = hand_rule(s)
        if h and h not in rules: rules.append(h)
    feet = [foot_rule(s) for s in sents]; feet = [f for f in feet if f]
    if feet: rules.append(('floor', 'foot', '脚踩地'))
    for kind, tgt, desc in rules:
        rows = []
        for fr in r['C']:
            j = {k: np.array(v) for k, v in fr['j'].items()}; c = fr['c']
            res = {}
            for side in ('left', 'right'):
                H = c.get(side + 'Hand'); F = c.get(side + 'Foot'); o = 'right' if side == 'left' else 'left'
                if tgt == 'knee-hug':
                    best = None
                    for leg in ('left', 'right'):
                        for reg in ('Shin', 'Thigh'):
                            dd = H['dist'].get(leg + reg)
                            if not dd: continue
                            a, b = (j[leg + 'Knee'], j[leg + 'Ankle']) if reg == 'Shin' else (j[leg + 'Hip'], j[leg + 'Knee'])
                            t = seg_t(np.array(dd[2]), a, b)
                            # ideal: shin t<=0.45 from knee or thigh t>=0.75 (just above knee)
                            ok = (reg == 'Shin' and t <= 0.45) or (reg == 'Thigh' and t >= 0.75)
                            cand = (dd[0], leg + reg, round(t, 2), ok)
                            if best is None or cand[0] < best[0]: best = cand
                    res[side] = dict(d=best[0], at=f'{best[1]}@t{best[2]}', okPart=best[3]) if best else None
                elif tgt == 'waist':
                    dd = H['dist'].get('torso'); y = dd[2][1] if dd else None
                    lo = min(j['leftHip'][1], j['rightHip'][1]) - 0.06; hi = j['waist'][1] + 0.1
                    res[side] = dict(d=dd[0], at=f'torso y{y:.2f} (髋{lo+0.06:.2f}~腰{hi-0.1:.2f})', okPart=lo <= y <= hi) if dd else None
                elif tgt in ('knee-top', 'thigh'):
                    best = None
                    for leg in ('left', 'right'):
                        for reg in ('Thigh', 'Shin'):
                            dd = H['dist'].get(leg + reg)
                            if not dd: continue
                            a, b = (j[leg + 'Hip'], j[leg + 'Knee']) if reg == 'Thigh' else (j[leg + 'Knee'], j[leg + 'Ankle'])
                            t = seg_t(np.array(dd[2]), a, b)
                            ok = (reg == 'Thigh' and (t >= 0.6 or tgt == 'thigh')) or (reg == 'Shin' and t <= 0.2 and tgt == 'knee-top')
                            cand = (dd[0], leg + reg, round(t, 2), ok)
                            if best is None or cand[0] < best[0]: best = cand
                    res[side] = dict(d=best[0], at=f'{best[1]}@t{best[2]}', okPart=best[3]) if best else None
                elif tgt == 'ankle':
                    best = None
                    for leg in ('left', 'right'):
                        for reg in ('Foot', 'Shin'):
                            dd = H['dist'].get(leg + reg)
                            if not dd: continue
                            t = seg_t(np.array(dd[2]), j[leg + 'Knee'], j[leg + 'Ankle']) if reg == 'Shin' else 1.0
                            cand = (dd[0], leg + reg, round(t, 2), reg == 'Foot' or t >= 0.7)
                            if best is None or cand[0] < best[0]: best = cand
                    res[side] = dict(d=best[0], at=f'{best[1]}@t{best[2]}', okPart=best[3]) if best else None
                elif tgt == 'other-upperarm-elbow':
                    dd = H['dist'].get(o + 'UpperArm')
                    if dd:
                        t = seg_t(np.array(dd[2]), j[o + 'Shoulder'], j[o + 'Elbow'])
                        res[side] = dict(d=dd[0], at=f'{o}UpperArm@t{t:.2f}', okPart=t >= 0.5)
                elif tgt == 'neck':
                    dd = min([H['dist'].get(k) for k in ('head', 'torso') if H['dist'].get(k)], key=lambda x: x[0], default=None)
                    if dd: res[side] = dict(d=dd[0], at=f'y{dd[2][1]:.2f} 颈{j["neck"][1]:.2f}', okPart=abs(dd[2][1] - j['neck'][1]) < 0.12)
                elif tgt == 'chest':
                    dd = H['dist'].get('torso')
                    if dd: res[side] = dict(d=dd[0], at=f'y{dd[2][1]:.2f}', okPart=j['waist'][1] < dd[2][1] < j['shoulderCenter'][1] + 0.03)
                elif tgt == 'hug-back':
                    cands = [(H['dist'][k][0], k) for k in ('torso', o + 'UpperArm') if H['dist'].get(k)]
                    if cands: b = min(cands); res[side] = dict(d=b[0], at=b[1], okPart=True)
                elif tgt == 'hand':
                    res[side] = dict(d=round(H['minY'] * 1000, 1), at='floor', okPart=True)
                elif tgt == 'forearm':
                    res[side] = dict(d=round((j[side + 'Elbow'][1] - 0.04) * 1000, 1), at='elbowJoint-40mm', okPart=True)
                elif tgt == 'foot':
                    res[side] = dict(d=round(F['minY'] * 1000, 1), at='floor', okPart=True)
                if res.get(side) is not None:
                    res[side]['occ'] = (H if tgt not in ('foot',) else F)['occ']
            rows.append((fr['tag'], fr['t'], res))
        # evaluate: body contacts need >=1 frame (peak/hold) with d<=15 and right part; floor contacts: best frame
        both = tgt in ('knee-hug', 'chest', 'hug-back') or re.search('双', desc) is not None
        def frame_score(res):
            vals = [x for x in res.values() if x]
            if not vals: return None
            if tgt in ('hand', 'forearm', 'foot'):
                # one side may legitimately be free (single-arm support, single-leg); judge the closer side unless 双
                ds = sorted(x['d'] for x in vals)
                return ds[-1] if (tgt == 'foot' and '双' in text(cat[id_]) and '双脚' in text(cat[id_])) else ds[0]
            if both: return max(x['d'] + (0 if x['okPart'] else 1000) for x in vals)
            return min(x['d'] + (0 if x['okPart'] else 1000) for x in vals)
        scored = [(frame_score(res), tag, t, res) for tag, t, res in rows if frame_score(res) is not None]
        if not scored: continue
        bestS = min(scored, key=lambda x: x[0])
        sc, tag, t, res = bestS
        wrongPart = sc >= 1000; dist = sc - 1000 if wrongPart else sc
        thr = 20 if kind == 'body' else (25 if tgt != 'forearm' else 40)
        sev, why = 0, []
        if wrongPart: sev = 2; why.append('接触部位不对')
        if dist > thr:
            sev = max(sev, 3 if dist > 60 else 2); why.append(f'最近 {dist:.0f}mm 悬空/够不着')
        occ = max((x.get('occ', 0) for x in res.values() if x), default=0)
        if kind == 'body' and occ > 150: sev = max(sev, 1); why.append(f'接触点在成片视角被遮挡(遮挡顶点{occ})')
        c2.append(dict(id=id_, name=d['name']['zh'], rule=desc, kind=kind, severity=sev, issue='；'.join(why), bestFrame=f'{tag}@{t}',
                       bestDistMm=round(dist, 1),
                       detail=' | '.join(f"{s}:{x['d']:.0f}mm {x['at']}{'' if x['okPart'] else '✗'} occ{x.get('occ',0)}" for s, x in res.items() if x),
                       allFrames=' '.join(f"{tg}:{(frame_score(rs) or 0):.0f}" for tg, _, rs in rows)))

# ---------- class 5+ ----------
c5 = []
for id_, r in fast.items():
    if 'J' not in r: continue
    d = cat.get(id_, {})
    issues = []
    # knee hyperextension: shin bends forward of the thigh line (sign w.r.t. pelvis lateral axis)
    hyper = {}
    for f in r['J']:
        j = {k: np.array(v) for k, v in f['j'].items()}
        for s in ('left', 'right'):
            H, K, A, T = j[s + 'Hip'], j[s + 'Knee'], j[s + 'Ankle'], j[s + 'Toe']
            ha = A - H; u = ha / np.linalg.norm(ha); off = (K - H) - u * ((K - H) @ u)
            f = T - A; f = f - u * (f @ u)
            flex = ang(K - H, A - K)
            # normal flexion pushes the knee toward the toes' side of the hip-ankle line; the opposite side = hyperextension
            if np.linalg.norm(f) > 1e-6 and off @ f < 0 and 3 < flex < 30: hyper[s] = max(hyper.get(s, 0), flex)
    # asymmetry for bilateral, non-alternating
    t = text(d) if d else ''
    asym = None
    if d and not d.get('unilateral') and not re.search(r'单|侧|一只|一手|一侧|转|扭|交替|轮流|左右|另一|哥本哈根|绕|画圈|点地|踢', t):
        A = [angles(f['j']) for f in r['J']]
        for k in ('Elbow', 'ShoulderElev', 'Knee', 'Hip'):
            L = [a['left' + k] for a in A]; R = [a['right' + k] for a in A]
            rl, rr = max(L) - min(L), max(R) - min(R)
            meanDiff = float(np.mean(np.abs(np.array(L) - np.array(R))))
            if (abs(rl - rr) > max(15, 0.4 * max(rl, rr))) or meanDiff > 20:
                asym = (asym or []) + [f'{k} 左幅{rl:.0f}° 右幅{rr:.0f}° 平均差{meanDiff:.0f}°']
    for s, v in hyper.items():
        if v > 8: issues.append((2 if v > 15 else 1, f'{s}膝反张 {v:.0f}°'))
    if asym: issues.append((1, '左右不对称: ' + '; '.join(asym)))
    if issues:
        c5.append(dict(id=id_, name=d.get('name', {}).get('zh', ''), severity=max(i[0] for i in issues), issue=' | '.join(i[1] for i in issues)))

def dump(rows, name, cols):
    rows.sort(key=lambda x: (-x['severity'], x['id']))
    with open(os.path.join(OUT, name), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore'); w.writeheader(); [w.writerow(r) for r in rows]
dump(c1, 'class1-motion-amplitude.csv', ['id', 'name', 'severity', 'issue', 'hold', 'maxJointRangeDeg', 'maxExcursionMm', 'staticFrac', 'expectedParts', 'mostMovingPart', 'arms', 'legs', 'trunk', 'topJointRanges', 'topExcursions', 'duration', 'cue0'])
dump(c2, 'class2-contact-position.csv', ['id', 'name', 'severity', 'issue', 'rule', 'kind', 'bestFrame', 'bestDistMm', 'detail', 'allFrames'])
dump(c5, 'class5-extra.csv', ['id', 'name', 'severity', 'issue'])
summ = dict(scanned=len(fast), errors=[k for k, v in fast.items() if 'error' in v],
            c1={s: sum(1 for r in c1 if r['severity'] == s) for s in (3, 2, 1)}, c2_checked=len(c2),
            c2={s: sum(1 for r in c2 if r['severity'] == s) for s in (3, 2, 1)}, c5={s: sum(1 for r in c5 if r['severity'] == s) for s in (2, 1)})
json.dump(summ, open(os.path.join(OUT, 'summary.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(summ, ensure_ascii=False))
