#!/usr/bin/env python3
"""Baseline statistics and data issues of the 249 finalized actions' existing tags (v3 text r2 + v1 catalog).

python tools/ai-tags/baseline_report.py > catalog/ai-tags/reports/baseline.md
Standard library only; read-only on the catalog.
"""
import collections as C, glob, json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
V = {os.path.basename(p)[:-5]: json.load(open(p, encoding='utf-8')) for p in sorted(glob.glob(os.path.join(ROOT, 'catalog/production/v3-text/*.json')))}
T = J('catalog/taxonomy.json')
V1 = {x['id']: x for x in J('catalog/catalog.json')['drills']}
VOC = J('catalog/ai-tags/vocabulary.json')['dimensions']
EQA = {a: k for k, v in VOC['equipment']['values'].items() for a in [k] + v['aliases']}
FLOOR_POS = {'supine', 'prone', 'quadruped', 'kneeling', 'half-kneeling', 'side-lying', 'plank'}


def table(counter, head, total=None):
    out = [f'| {head} | 数量 |', '|---|---:|']
    for k, n in counter.most_common():
        out.append(f'| {k} | {n} |')
    return '\n'.join(out)


def derived_scenes(d):
    """Heuristic only: taxonomy.rules + equipment default scenes. Not a tag."""
    t = d['tags']; eq = [EQA.get(e, e) for e in t['equipment']]
    sc = {'home', 'office', 'gym', 'hotel', 'outdoor'}
    for e in eq:
        ds = set(VOC['equipment']['values'].get(e, {}).get('defaultScenes', ['gym']))
        sc &= ds | {'gym'}
    if t['position'] in FLOOR_POS or 'mat' in eq: sc -= {'office', 'outdoor'}
    return sorted(sc)


def main():
    n = len(V)
    cat = C.Counter(d['tags']['category'] for d in V.values())
    eq_raw = C.Counter(e for d in V.values() for e in (d['tags']['equipment'] or ['(徒手)']))
    eq_norm = C.Counter(EQA.get(e, e) for d in V.values() for e in (d['tags']['equipment'] or ['(徒手)']))
    pos = C.Counter(d['tags']['position'] for d in V.values())
    dif = C.Counter(d['tags']['difficulty'] for d in V.values())
    mus = C.Counter(m for d in V.values() for m in d['tags']['activeMuscles'] + d['tags']['synergistMuscles'])
    v1sc = C.Counter('+'.join(V1[i]['scenes']) for i in V if i in V1)
    drsc = C.Counter(s for d in V.values() for s in derived_scenes(d))
    tax_m = set(T['muscleGroups']); tax_e = set(T['equipment']); tax_p = set(T['positions']); tax_c = set(T['categories'])

    print('# 249 个定稿动作现有标签基线（自动生成）\n')
    print(f'来源：`catalog/production/v3-text/*.json`（{n} 份 r2 文案 tags），交叉参考 `catalog/catalog.json` v1（{len(V1)} 个，其中 {len(set(V1) & set(V))} 个在 249 内）与 `catalog/taxonomy.json`。生成：`python tools/ai-tags/baseline_report.py`。\n')
    print('## 按 category（v3 tags.category）\n'); print(table(cat, 'category')); print()
    print('## 按器械（v3 原始写法，一个动作可多个）\n'); print(table(eq_raw, 'equipment')); print()
    print('## 按器械（归一到 ai-tags 词表 id 后）\n'); print(table(eq_norm, 'equipment')); print()
    print('## 按场景\n')
    print('v3 文案没有 scenes 字段。v1 旧目录有 scenes 的只有 141 个：\n'); print(table(v1sc, 'v1 scenes')); print()
    print('按器械默认场所 + 是否着地粗推（仅供批量打标参考，不是标签）：\n'); print(table(drsc, '推断可用场景')); print()
    print('## 体位 / 难度 / 肌群\n'); print(table(pos, 'position')); print(); print(table(dif, 'difficulty')); print(); print(table(mus, '肌群（active+synergist）')); print()

    print('## 发现的数据问题\n')
    issues = []
    bad_m = {m: c for m, c in mus.items() if m not in tax_m}
    unused = sorted(tax_m - set(mus))
    issues.append(f'**肌群词表不一致**：v3 用了 taxonomy 之外的 {len(bad_m)} 个粗粒度 id（' + '、'.join(f'{k} {v}' for k, v in sorted(bad_m.items(), key=lambda x: -x[1])) + f'），taxonomy 的 {len(unused)} 个 id 在 249 份里从未出现（{", ".join(unused)}）。前锯肌、竖脊肌、臀大肌/臀中肌之分全部丢失，AI 无法按“臀中肌”“前锯肌”选动作。')
    bad_e = sorted(e for e in eq_raw if e not in tax_e and e != '(徒手)')
    issues.append(f'**器械 id 不一致**：{len(bad_e)} 个不在 taxonomy（{", ".join(bad_e)}），且有同义重复：yoga-block/yoga-blocks/foam-block、slider/sliders、resistance-band(taxonomy=band)、pull-up-bar(pullup-bar)、gymnastic-rings(rings)、cable-machine(cable)、stability-ball(swiss-ball)、hip-abduction-machine(hip-abductor-machine)、stool(chair)。')
    bad_p = {p: c for p, c in pos.items() if p not in tax_p}
    issues.append('**体位不一致**：' + '、'.join(f'{k} {v}' for k, v in bad_p.items()) + ' 不在 taxonomy（side-lying vs side_lying 写法不同；other 无法判断是否着地）。other 包括：' + ', '.join(i for i, d in V.items() if d['tags']['position'] == 'other') + '。w-wall-sit 实为靠墙站姿。')
    seated_floor = [i for i, d in V.items() if d['tags']['position'] == 'seated' and 'mat' in d['tags']['equipment']]
    issues.append(f'**seated 混了坐椅和坐地**：taxonomy 定义 seated.floor=false，但 {len(seated_floor)} 个 seated 动作带 mat、实际坐地（如 {", ".join(seated_floor[:6])}…），按旧规则会被错误推给办公室。')
    bad_c = {c: k for c, k in cat.items() if c not in tax_c}
    issues.append('**category 不一致**：v3 新增 ' + '、'.join(f'{k} {v}' for k, v in bad_c.items()) + ' 不在 taxonomy；taxonomy 的 core 在 v3 被取消（v1 core→v3 strength 13 个、→stability 5 个）。assessment（' + ', '.join(i for i, d in V.items() if d['tags']['category'] == 'assessment') + '）不是训练类型。')
    issues.append(f'**没有场景字段**：v3 无 scenes，v1 只覆盖 141/249；新增 108 个动作（o-*/h-* 等办公室动作）没有场景标签。')
    uni = [i for i in V if i in V1 and V1[i]['unilateral'] != V[i]['unilateral']]
    alt = [i for i, d in V.items() if d['unilateral'] and (d.get('training') or {}).get('kind') == 'rep_alternate']
    issues.append(f'**单侧/交替混在 unilateral 一个布尔里**：v1 与 v3 有 {len(uni)} 个相反（{", ".join(uni)}）；v3 unilateral=true 的 130 个里 {len(alt)} 个是左右交替（rep_alternate），需拆成 laterality。')
    stretch_act = sum(1 for d in V.values() if d['tags']['category'] == 'stretch')
    issues.append(f'**拉伸类把被拉肌写进 activeMuscles**：{stretch_act} 个 stretch 动作无法区分“练”和“拉”，AI 会把拉伸当成力量动作推荐。')
    floor_nomat = [i for i, d in V.items() if d['tags']['position'] in FLOOR_POS and 'mat' not in d['tags']['equipment']]
    issues.append(f'**着地体位却无 mat**：{len(floor_nomat)} 个（{", ".join(floor_nomat)}）。')
    issues.append(f'**难度被压缩**：1 级 {dif[1]}、2 级 {dif[2]}、3 级 {dif[3]}，无 4–5；托马斯/L 坐/俯撑平衡类（t-*）与扶椅动作同为 1–3 级，例如 hamstrings-A 徒手单腿罗马尼亚硬拉为 1 级、t-tuck-planche 为 ' + str(V['t-tuck-planche']['tags']['difficulty']) + ' 级。')
    lvl = C.Counter((V1[i]['level'], V[i]['tags']['difficulty']) for i in V if i in V1 and V1[i]['level'] != V[i]['tags']['difficulty'])
    issues.append('**v1 level 与 v3 difficulty 不一致**：' + '、'.join(f'{a}→{b} {c} 个' for (a, b), c in lvl.most_common()) + '。')
    dup = [k for k, c in C.Counter(d['name']['zh'] for d in V.values()).items() if c > 1]
    for k in dup:
        issues.append(f'**中文名重复**：「{k}」= ' + ', '.join(i for i, d in V.items() if d['name']['zh'] == k) + '，AI 和用户无法区分。')
    issues.append('**注意部位只有自由文本**：v3 cautions 是句子，taxonomy.cautions 7 个部位词没有结构化落到 249 份里；v1 只覆盖 141 个。')
    issues.append('**没有关联动作**：v3 无 alternatives/progressions；v1 只有单个 alternative 字段，142 个中 69 个为 null，且不区分替代、退阶、进阶。')
    issues.append(f'**审核状态**：249 份全部为 `{C.Counter(d["reviewStatus"] for d in V.values()).most_common(1)[0][0]}`，标签同样未经人工审核。')
    for k, x in enumerate(issues, 1):
        print(f'{k}. {x}')


if __name__ == '__main__':
    main()
