"""249-action forearm roll list (before) + r6 re-scan of the opted-in recipes (after).
Usage: python3 elbow-table.py before.csv after.csv out.md out.csv"""
import csv, sys, json, glob, os
before = {r['id']: r for r in csv.DictReader(open(sys.argv[1]))}
after = {r['id']: r for r in csv.DictReader(open(sys.argv[2]))} if os.path.exists(sys.argv[2]) else {}
names = {}
for f in glob.glob('catalog/production/remaining219-r1/recipes/*.json') + glob.glob('catalog/production/remaining32-r4/groups/*/*.json'):
    r = json.load(open(f)); names[r['id']] = (r.get('nameZh', ''), r.get('wristTwistRuntime'))
order = {'severe': 0, 'suspect': 1, 'ok': 2}
rows = sorted(before.values(), key=lambda r: (order.get(r['flag'], 3), -float(r['rollRange'] or 0)))
f = lambda x: '%.0f' % float(x) if x not in ('', None) else ''
md = ['| # | 动作 | 中文名 | 修前 | 循环内转动° | 单步跳变° | 手相对前臂最大° | ±180 折返 | 肘角跳变° | 本轮处理 | 修后(r6) 转动°/跳变° | 修后级别 |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
out = []
for i, r in enumerate(rows, 1):
    nm, wt = names.get(r['id'], ('', None)); a = after.get(r['id'])
    act = 'r6 运行时' if wt else ''
    if r['id'] == 'h-standing-forearm-rotation': act = '保留（动作本身旋前旋后）'
    aft = f"{f(a['rollRange'])}/{f(a['rollStep'])}" if a and wt else ''
    md.append(f"| {i} | {r['id']} | {nm} | {r['flag']} | {f(r['rollRange'])} | {f(r['rollStep'])} | {f(r['handRollMax'])} | {r['wrapFlips']} | {f(r['elbowPop'])} | {act} | {aft} | {a['flag'] if a and wt else ''} |")
    out.append(dict(id=r['id'], nameZh=nm, flag_before=r['flag'], rollRange=r['rollRange'], rollStep=r['rollStep'], handRollMax=r['handRollMax'], wrapFlips=r['wrapFlips'], elbowPop=r['elbowPop'],
                    fix=act, rollRange_after=a['rollRange'] if a and wt else '', rollStep_after=a['rollStep'] if a and wt else '', flag_after=a['flag'] if a and wt else ''))
open(sys.argv[3], 'w').write('\n'.join(md) + '\n')
with open(sys.argv[4], 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
print('rows', len(out), 'before', {k: sum(r['flag_before'] == k for r in out) for k in order}, 'after(opted)', {k: sum(r['flag_after'] == k for r in out) for k in order})
