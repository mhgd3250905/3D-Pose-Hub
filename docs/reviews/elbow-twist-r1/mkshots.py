import csv, json
R = '/workspace/work/pose-hub-elbow/'
rows = list(csv.DictReader(open('/workspace/work/elbow-audit/suspects-all.csv')))
recipes = {l.strip().split('/')[-1][:-5]: l.strip() for l in open('/workspace/work/elbow-audit/recipes.txt')}
shots = []
top = [r for r in rows if r.get('flag') in ('severe', 'suspect')][:10]
for i, r in enumerate(top, 1):
    side = 'left' if r['side'] == 'L' else 'right'
    t = r[side[0]+'_wrapAt'] or r['worstAt']
    shots.append(dict(recipe=recipes[r['id']], t=float(t), side=side, size=320, out=f"/workspace/work/elbow-audit/img/{i:02d}-{r['id']}-{side}-t{t}.png"))
json.dump(shots, open('/workspace/work/elbow-audit/shots-top.json', 'w'), indent=1)
print(len(shots))
