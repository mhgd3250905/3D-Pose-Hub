import json
recs={}
for l in open('/workspace/work/elbow-scan/res.jsonl'):
    d=json.loads(l);recs[d['id']]=d
rows=[]
for d in recs.values():
    if d.get('error') or not d.get('rows'):continue
    for s in ['left','right']:
        fr=[r for r in d['rows'] if r[s]['ratio'] is not None]
        if not fr:continue
        w=min(fr,key=lambda r:r[s]['ratio'])
        if w[s]['ratio']<0.85:
            tws=[r[s]['tw'] for r in fr]
            rows.append(dict(id=d['id'],file=d['file'],t=w['t'],side=s,ratio=w[s]['ratio'],elbow=w[s]['elbow'],tw=w[s]['tw'],twmin=min(tws),twmax=max(tws)))
rows.sort(key=lambda r:r['ratio'])
jobs=rows[:24]
for j in jobs:
    if j['id']=='h-open-book':j['override']='drill-anim/specs/h-open-book-r12.js'
json.dump(jobs,open('/workspace/work/elbow-scan/jobs.json','w'),indent=0)
print('sides<0.85',len(rows))
for j in jobs:print(j['id'],j['side'],j['ratio'],'t',j['t'],'elb',j['elbow'],'tw',j['tw'],f"[{j['twmin']:.0f},{j['twmax']:.0f}]")
