import json
c=json.load(open('choice.json'))
for l in open('verify.jsonl'):
  r=json.loads(l);id=r['id']
  if r.get('error'):print(id,'ERR',r['error'][:150]);continue
  x=c[id]['sides'];o=[]
  for s,y in x.items():
    if not(y['status'] in('full','partial') or y.get('override')):continue
    vr=min((q[s]['ratio'] if q[s]['ratio'] is not None else 1) for q in r['rows']);vt=max(abs(q[s]['tw']) for q in r['rows'])
    o.append(f"{s[0]} exp {y['best']['m']['ratio']:.2f}/{y['best']['m']['twMax']:.0f} got {vr:.2f}/{vt:.0f}{' !!' if vr<y['best']['m']['ratio']-0.03 else ''}")
  print(f"{id:34s} {r['spec'].split('/')[-1]:40s} warn={sum(q['warn'] for q in r['rows'])} "+' | '.join(o))
