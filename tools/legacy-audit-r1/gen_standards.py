# Per-action quantifiable standards for the legacy audit (2026-11-21).
#   python3 tools/legacy-audit-r1/gen_standards.py   -> standards/<id>.json (+ standards/INDEX.md)
# Every legacy action (tools/v5/v5-actions.json, 249) gets a standard derived from its own text (catalog/production/v3-text/<id>.json:
# name, cues, commonErrors, tags.position, unilateral, training.kind/perSide/repUnit) plus the recipe name (nameZh) and the catalog
# name (catalog/catalog.json), with family rules from common coaching knowledge (written out in each file's "basis"), and hand-written
# per-action rules in MANUAL below for the calibration set and the families the calibration showed are at risk.
# Flare negative controls (tools/flare2-moves*/standards exist; here they only get the auto rules) are generated with --controls.
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '../..'))
OUT = os.path.join(HERE, 'standards'); os.makedirs(OUT, exist_ok=True)

def J(p): return json.load(open(os.path.join(REPO, p)))

CAT = {d['id']: d for d in J('catalog/catalog.json')['drills']}

# ---- family rules -------------------------------------------------------------------------------------------------------------
BENT_SIDE_PLANK_CHECKS = [
    {'code': 'sideplank-feet-off-floor', 'kind': 'range', 'severity': 1, 'metric': "max(m['footMinL'], m['footMinR'])", 'hi': 45,
     'msg': '屈膝侧撑：双脚应叠放贴地，实际有一只脚离地 {v:.0f} mm', 'basis': '屈膝侧平板标准体位：前臂+下侧膝盖/小腿外侧撑地，双膝约 90°，小腿在身后，双脚叠放贴地（ACE/NASM 侧桥退阶）'},
    {'code': 'sideplank-shin-not-behind', 'kind': 'range', 'severity': 2, 'metric': "max(m['footBehindL'], m['footBehindR'])", 'hi': 0.05,
     'msg': '屈膝侧撑：小腿应在身后（脚在髋后方），实际脚在髋前方 {v:.2f} m', 'basis': '同上'},
    {'code': 'sideplank-foot-above-knee', 'kind': 'range', 'severity': 1, 'metric': "max(m['footAboveKneeL'], m['footAboveKneeR'])", 'hi': 0.06,
     'msg': '屈膝侧撑：小腿/脚翻向上方（脚比膝高 {v:.2f} m）', 'basis': '同上'},
    {'code': 'sideplank-knee-angle', 'kind': 'range', 'severity': 2, 'metric': "min(m['kneeL'], m['kneeR'])", 'lo': 65, 'hi': 125,
     'msg': '屈膝侧撑：屈膝应约 90°（65–125°），实际 {v:.0f}°', 'basis': '同上'},
]
SIDE_SQUAT_CHECKS = [   # cossack / lateral lunge / low side shift: bottom = one knee deeply bent, the other straight
    {'code': 'sidesquat-com-off-foot', 'kind': 'range', 'severity': 1,
     'cond': "min(m['kneeL'], m['kneeR']) < 110 and max(m['kneeL'], m['kneeR']) > 150",
     'metric': "(m['comVsFootL'] if m['kneeL'] < m['kneeR'] else m['comVsFootR'])", 'hi': 0.08,
     'msg': '侧蹲到底时重心没落在下蹲那只脚上（重心投影偏出该脚掌 {v:.2f} m）', 'basis': '哥萨克蹲/侧弓步：重心坐到屈膝腿，投影落在该脚中后部（NSCA 动作要领；常识：另一条腿只是伸直点地）'},
    {'code': 'sidesquat-heel-up', 'kind': 'range', 'severity': 2,
     'cond': "min(m['kneeL'], m['kneeR']) < 110 and max(m['kneeL'], m['kneeR']) > 150",
     'metric': "(m['soleHeelL'] if m['kneeL'] < m['kneeR'] else m['soleHeelR'])", 'hi': 12,
     'msg': '侧蹲到底时下蹲腿脚后跟离地 {v:.0f} mm（文字要求后跟踩实）', 'basis': '文字「蹲的那只脚后跟踩实」/常识'},
    {'code': 'sidesquat-knee-toe', 'kind': 'range', 'severity': 1,
     'cond': "min(m['kneeL'], m['kneeR']) < 110 and max(m['kneeL'], m['kneeR']) > 150",
     'metric': "(m['kneeVsToeL'] if m['kneeL'] < m['kneeR'] else m['kneeVsToeR'])", 'lo': -12, 'hi': 15,
     'msg': '侧蹲到底时下蹲腿膝盖与脚尖方向偏差 {v:.0f}°（负=膝内扣；文字要求膝盖对着脚尖）', 'basis': '文字「膝盖对着脚尖」'},
]
SQUAT_HEEL_CHECK = {'code': 'squat-heel-up', 'kind': 'range', 'severity': 2,
                    'cond': "min(m['kneeL'], m['kneeR']) < 120 and m['footMinL'] < 25 and m['footMinR'] < 25",
                    'metric': "max(m['soleHeelL'] if m['kneeL'] < 120 else 0, m['soleHeelR'] if m['kneeR'] < 120 else 0)", 'hi': 15,
                    'msg': '下蹲时屈膝负重腿脚后跟离地 {v:.0f} mm', 'basis': '深蹲/分腿蹲常识：全脚掌踩实（提踵类除外）'}

MANUAL = {
    'adductors-A': {'expectSwitch': True, 'switchStrong': True, 'switchBasis': '文字「左边蹲一次、右边蹲一次，才算 1 下」',
                    'extra': SIDE_SQUAT_CHECKS + [
                        {'code': 'cossack-straight-leg', 'kind': 'range', 'severity': 2, 'cond': "min(m['kneeL'], m['kneeR']) < 100",
                         'metric': "max(m['kneeL'], m['kneeR'])", 'lo': 160, 'msg': '哥萨克蹲伸直腿膝盖应伸直（≥160°），实际 {v:.0f}°', 'basis': '文字「另一条腿伸直」'}],
                    'notes': '开哥校准缺陷 1：受力屈膝腿膝内扣、脚与膝方向不一致、重心没落在支撑脚跟上方'},
    's-9090': {'expectSwitch': True, 'switchStrong': True,
               'switchBasis': '动作名「90/90 坐姿换髋」+ Flare 热身文案「脚跟压稳，双膝翻到另一侧，上身尽量坐直」（左右换髋）；Hub r3 文字已改成单侧前倾，名称仍是换髋',
               'extra': [{'code': '9090-torso-upright', 'kind': 'range', 'severity': 2, 'metric': "m['spineTotal']", 'hi': 35,
                          'msg': '换髋版要求上身尽量坐直，实际上身相对骨盆前屈 {v:.0f}°', 'basis': 'Flare 文案「上身尽量坐直」'}],
               'notes': '开哥校准缺陷 2（文案与动作不符）+ 3（裆部凸起）'},
    'h-short-side-plank': {'extra': BENT_SIDE_PLANK_CHECKS, 'notes': '开哥校准缺陷 4：小腿和脚翻向上方、脚朝向反人类'},
    'h-lateral-step-lunge': {'extra': SIDE_SQUAT_CHECKS},
    'n-squat-shift': {'extra': SIDE_SQUAT_CHECKS[:1] + SIDE_SQUAT_CHECKS[2:]},
    'h-9090-liftoff': {'notes': '90/90 家族：同模型同坐姿，重点看裆部和膝/脚朝向'},
}
CONTROL_MANUAL = {'t-wide-side-squat-shift': {'extra': SIDE_SQUAT_CHECKS}, 't-forearm-side-plank': {}}

SWITCH_WORDS = ['换髋', '换边', '翻到另一侧', '倒向另一边', '左右交替', '两边交替', '左右各', '轮流', '交替']

def text_of(t):
    parts = [t.get('name', {}).get('zh', ''), t.get('purpose', {}).get('zh', '')]
    parts += [c['text']['zh'] for c in t.get('cues', [])] + [e['zh'] for e in t.get('commonErrors', [])]
    return ' '.join(parts)

def build(aid, recipe, control=False):
    tp = f'catalog/production/v3-text/{aid}.json'
    t = J(tp) if os.path.exists(os.path.join(REPO, tp)) else {}
    if control:
        for d in ('flare2-moves-r1', 'flare2-moves-r2', 'flare2-moves-r3'):
            p = f'catalog/production/{d}/text/{aid}.json'
            if os.path.exists(os.path.join(REPO, p)): t = J(p); tp = p
    r = J(recipe)
    names = {'recipe': r.get('nameZh'), 'text': t.get('name', {}).get('zh'), 'catalog': CAT.get(aid, {}).get('name', {}).get('zh')}
    tr = t.get('training') or {}
    txt = text_of(t) + ' ' + ' '.join(v for v in names.values() if v)
    pos = (t.get('tags') or {}).get('position') or CAT.get(aid, {}).get('position') or ''
    uni = bool(t.get('unilateral'))
    st = {'id': aid, 'names': names, 'position': pos, 'unilateral': uni, 'startingSide': t.get('startingSide'), 'kind': tr.get('kind'),
          'perSide': tr.get('perSide'), 'repUnit': tr.get('repUnit'), 'textSource': tp, 'recipe': recipe, 'spec': r.get('spec'),
          'basis': [], 'checks': []}
    # side switch expectation
    hits = [w for w in SWITCH_WORDS if w in txt]
    if tr.get('perSide') == 'alternate' or tr.get('repUnit') == 'left+right':
        st['expectSwitch'] = True; st['switchBasis'] = f"训练参数 perSide={tr.get('perSide')} repUnit={tr.get('repUnit')}（每下左右各一次）"
        st['switchStrong'] = any(w in txt for w in ('左边', '右边', '左右各', '换边', '换髋', '翻到另一侧'))
    elif any(w in txt for w in ('换髋', '翻到另一侧', '换边')) and not uni:
        st['expectSwitch'] = True; st['switchStrong'] = True; st['switchBasis'] = '文字/名称含：' + '、'.join(hits)
    elif any(w in (names.get('recipe') or '') + (names.get('catalog') or '') for w in ('换髋', '换边')):
        st['expectSwitch'] = True; st['switchStrong'] = True; st['switchBasis'] = f"动作名含换髋/换边：{names}"
    else:
        st['expectSwitch'] = None
    st['basis'].append('换边期望：' + (st.get('switchBasis') or '无（单侧动作由 App 镜像，或双侧对称）'))
    # symmetry for bilateral actions
    if not uni and tr.get('kind') not in ('rep_cycle',) and not re.search('画圈|摇|转体|扭转|侧弯|侧伸|雨刷|穿针|转肩', txt):
        st['symmetric'] = True; st['asymTol'] = 0.10
        st['basis'].append('双侧对称动作：左右镜像差 ≤10 cm（文字未写单侧）')
    # families
    if re.search('侧平板|侧撑|侧桥', txt) and re.search('屈膝|短杠杆|膝盖撑地|小臂和膝盖', txt) and '哥本哈根' not in txt:
        st['checks'] += BENT_SIDE_PLANK_CHECKS; st['basis'].append('家族：屈膝侧平板（规则见 checks.basis）')
    if pos == 'standing' and re.search('蹲|弓步', txt) and not re.search('提踵|踮', txt):
        st['checks'].append(SQUAT_HEEL_CHECK); st['basis'].append('家族：站姿下蹲/弓步（负重腿全脚掌踩实；膝对脚尖由通用检查覆盖）')
    if re.search('小臂.{0,4}撑|前臂.{0,4}撑|小臂和膝盖撑地|手肘在肩膀正下方', txt) and pos in ('side-lying', 'plank', 'prone', 'quadruped'):
        st['checks'].append({'code': 'text-forearm-support', 'kind': 'range', 'severity': 1, 'when': [0.25, 0.75],
            'metric': "min(m['minY'].get('forearmL', 999), m['minY'].get('forearmR', 999))", 'hi': 30,
            'msg': '文字写小臂/前臂撑地，视频里小臂离地 {v:.0f} mm（实际是直臂手掌撑）', 'basis': '文字：' + '、'.join(re.findall('小臂[^，。]*撑[^，。]*|前臂[^，。]*撑[^，。]*|手肘在肩膀正下方', txt))[:60]})
        st['basis'].append('文字→接触：小臂撑地')
    man = (CONTROL_MANUAL if control else MANUAL).get(aid, {})
    for k, v in man.items():
        if k == 'extra':
            have = {c['code'] for c in st['checks']}; st['checks'] += [c for c in v if c['code'] not in have]
        else: st[k] = v
    if man: st['basis'].append('含手写逐动作规则（MANUAL）')
    st['generic'] = ['膝朝向/髌骨侧拧（thighFace/shinFace ≤40°）', '脚尖 vs 膝朝向（footVsKnee ≤60°，±180=脚反）', '膝铰链轴偏离（≤25°）',
                     '负重屈膝腿膝 vs 脚尖（-15°..35°）', '肘扭转（≤35°）', '穿地（≤-8 mm）/站定脚悬空（>8 mm）',
                     '重心投影在支撑面内（≤4 cm，连续帧）', '裆部区域局部凸包（bump，阈值见 REPORT）']
    return st

if __name__ == '__main__':
    V = J('tools/v5/v5-actions.json')['actions']
    idx = ['| id | 名称 | 体位 | 单侧 | 换边期望 | 家族/手写规则数 |', '|---|---|---|---|---|---|']
    for a in V:
        st = build(a['id'], a['recipe'])
        json.dump(st, open(os.path.join(OUT, a['id'] + '.json'), 'w'), ensure_ascii=False, indent=1)
        idx.append(f"| {a['id']} | {st['names']['recipe']} | {st['position']} | {'是' if st['unilateral'] else '否'} | {'是' if st.get('expectSwitch') else '-'} | {len(st['checks'])} |")
    ctl = [l.split('\t') for l in open(sys.argv[sys.argv.index('--controls') + 1]).read().split('\n') if l.strip()] if '--controls' in sys.argv else []
    for aid, rec in ctl:
        if not aid.startswith('t-') or os.path.exists(os.path.join(REPO, 'catalog/production/remaining219-r1/recipes', aid + '.json')): continue
        st = build(aid, rec, control=True); st['control'] = True
        json.dump(st, open(os.path.join(OUT, aid + '.json'), 'w'), ensure_ascii=False, indent=1)
    open(os.path.join(OUT, 'INDEX.md'), 'w').write('# 旧动作逐动作标准索引（自动推导 + 手写）\n\n' + '\n'.join(idx) + '\n')
    print(len(V), 'standards;', len(ctl), 'control rows')
