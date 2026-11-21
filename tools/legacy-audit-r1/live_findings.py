# live_findings.py: export the current (unreviewed) severity-1/2 findings from analyze results into FINDINGS-LIVE.md / .json,
# ranked into fix tiers for the repair handoff (Hark-QUA). Re-run any time while the batch is still running.
#   python3 tools/legacy-audit-r1/live_findings.py
import json, os, glob, time
os.environ['TZ'] = 'Asia/Shanghai'; time.tzset()
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '../..'))
W = '/workspace/work/legacy-audit-r1'
V = {a['id']: a for a in json.load(open(os.path.join(REPO, 'tools/v5/v5-actions.json')))['actions']}
FP = {'abs-A': '躺姿四肢悬空 2–3 cm 触发重心规则，已判误报（重心规则已改为只判站/跪姿）'}
P0 = {'rom-footVsKnee', 'sideplank-feet-off-floor', 'sideplank-foot-above-knee', 'sideplank-shin-not-behind', 'text-no-switch', 'text-forearm-support'}
P1 = {'knee-inside-foot', 'knee-outside-foot', 'sidesquat-com-off-foot', 'com-outside-support', 'rom-thighFace', 'rom-shinFace', 'rom-kneeAxisDev', 'knee-valgus'}
def tier(f):
    c = f['code']
    if c == 'crotch-bulge': return 'M'
    if (c in P0 and f['severity'] == 1) or (c == 'knee-valgus' and abs(f.get('value') or 0) >= 90): return 'P0'
    if c in P1: return 'P1' if f['severity'] == 1 else 'P2'
    return 'P1' if f['severity'] == 1 else 'P2'
def name(aid):
    try:
        r = json.load(open(os.path.join(REPO, V[aid]['recipe']))); return r.get('nameZh') or aid
    except Exception: return aid
rows = {}
for src in ('calib-an', 'an'):  # an/ (final full run) overrides calib-an/
    for f in glob.glob(os.path.join(W, src, '*.json')):
        aid = os.path.basename(f)[:-5]
        try: d = json.load(open(f))
        except Exception: continue
        rows[aid] = [x for x in d.get('findings', []) if x.get('severity') in (1, 2)]
items = []
for aid, fs in rows.items():
    if aid in FP or not fs: continue
    for x in fs:
        if x['severity'] == 2 and x['code'] == 'crotch-bulge': continue
        items.append({'id': aid, 'name': name(aid), 'tier': tier(x), 'sev': x['severity'], 'code': x['code'], 'msg': x['msg'], 'value': x.get('value'), 'frames': x.get('frames')})
order = {'P0': 0, 'P1': 1, 'M': 2, 'P2': 3}
items.sort(key=lambda r: (order[r['tier']], r['sev'], -abs(r['value'] or 0)))
json.dump({'generated': time.strftime('%Y-%m-%d %H:%M'), 'analyzed': len(rows), 'false_positive': FP, 'items': items}, open(os.path.join(HERE, 'FINDINGS-LIVE.json'), 'w'), ensure_ascii=False, indent=1)
L = [f'# 旧动作审计 r1 实时问题清单（未经独立评审，{time.strftime("%Y-%m-%d %H:%M")} 导出，已分析 {len(rows)} 个动作）', '',
     '分级：P0 反人类/文不对题（先修）→ P1 严重错位 → M 模型级裆部鼓包（V5 皮肤层一次修）→ P2 明显不准。同级按幅度从大到小。', '']
for t, title in (('P0', 'P0 反人类 / 文不对题'), ('P1', 'P1 严重错位（膝脚朝向、膝内扣外翻、重心）'), ('M', 'M 模型级：裆部鼓包（不逐动作改姿势）'), ('P2', 'P2 明显不准')):
    sub = [r for r in items if r['tier'] == t]
    L += [f'## {title}（{len(sub)} 条）', '', '| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |', '|---|---|---|---|---|---|']
    L += [f"| {r['id']} | {r['name']} | S{r['sev']} | {r['code']} | {r['msg']} | {','.join(map(str, (r['frames'] or [])[:4]))} |" for r in sub]
    L += ['']
L += ['## 已判误报', ''] + [f'- {k}：{v}' for k, v in FP.items()]
open(os.path.join(HERE, 'FINDINGS-LIVE.md'), 'w').write('\n'.join(L) + '\n')
print(len(items), {t: sum(r['tier'] == t for r in items) for t in order})
