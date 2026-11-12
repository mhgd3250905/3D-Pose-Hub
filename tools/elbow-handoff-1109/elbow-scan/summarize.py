import json,csv,collections
recs={}
for l in open('/workspace/work/elbow-scan/res.jsonl'):
    d=json.loads(l);recs[d['id']+('#'+d['key'].split('#')[1] if '#' in d['key'] else '')]=d
names={}
for d in recs.values():
    try:names[d['id']]=json.load(open(d['file'])).get('nameZh','')
    except Exception:pass
rows=[];errs=[]
for k,d in recs.items():
    if d.get('error') or not d.get('rows'):errs.append((k,(d.get('error') or 'no rows')[:200]));continue
    for s in ['left','right']:
        fr=[r for r in d['rows'] if r[s]['ratio'] is not None]
        w=min(fr,key=lambda r:r[s]['ratio'])
        tws=[r[s]['tw'] for r in fr]
        rows.append(dict(id=d['id'],spec=d['spec'],side=s,min_ratio=w[s]['ratio'],frame_t=w['t'],twist_min=min(tws),twist_max=max(tws),
            elbow_deg_at_min=w[s]['elbow'],minW_mm=w[s]['minW'],twist_at_min=w[s]['tw'],nameZh=names.get(d['id'],''),file=d['file']))
rows.sort(key=lambda r:r['min_ratio'])
with open('/workspace/work/elbow-scan/results.csv','w',newline='') as f:
    W=csv.writer(f);W.writerow(['id','spec','side','min_ratio','frame_t','twist_min','twist_max','elbow_deg_at_min','minW_mm','twist_at_min','nameZh'])
    for r in rows:W.writerow([r[k] for k in ['id','spec','side','min_ratio','frame_t','twist_min','twist_max','elbow_deg_at_min','minW_mm','twist_at_min','nameZh']])
ids=collections.defaultdict(list)
for r in rows:ids[r['id']].append(r)
worst={i:min(v,key=lambda r:r['min_ratio']) for i,v in ids.items()}
de=[w for w in worst.values() if w['min_ratio']<0.75];bo=[w for w in worst.values() if 0.75<=w['min_ratio']<0.85]
print('scanned actions',len(worst),'errors',len(errs),'definite',len(de),'borderline',len(bo))
for e in errs:print('ERR',e)
for r in sorted(worst.values(),key=lambda r:r['min_ratio'])[:40]:
    sides=' '.join(f"{x['side'][0]}{x['min_ratio']:.2f}" for x in ids[r['id']])
    print(f"{r['id']:34s} {sides:14s} t={r['frame_t']:<6} tw[{r['twist_min']:.0f},{r['twist_max']:.0f}] elb={r['elbow_deg_at_min']} {r['nameZh']}")
json.dump({'worst':sorted(worst.values(),key=lambda r:r['min_ratio']),'errors':errs},open('/workspace/work/elbow-scan/summary.json','w'),ensure_ascii=False,indent=0)
