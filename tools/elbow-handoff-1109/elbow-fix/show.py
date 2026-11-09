import json,sys
want=set(sys.argv[1:])
for l in open('/workspace/work/elbow-fix/res.jsonl'):
  r=json.loads(l)
  if want and r['id'] not in want:continue
  print('##',r['id'],r.get('error','')[:300] if r.get('error') else '',r['sec'])
  if r.get('error'):continue
  K=('ratio','sh','wr','twMax','htwMax','near','minY','warn','elbowAtWorst')
  print(' base',{s:[r['base'][s][k] for k in K] for s in r['sides']})
  for v in r['ver']:print(' ver',{s:(v['p'][s]['a'],v['p'][s]['b'],v['p'][s]['c'],v['p'][s]['tPred'],v['p'][s]['hPred'],v['p'][s]['pen']) for s in v['p']},v['drift'],{s:[v['sm'][s][k] for k in K] for s in v['p']})
  print(' choice',{s:(c['p']['a'],c['p']['b'],c['p']['c'],c['m']['ratio'],c['m']['twMax'],c['m']['htwMax']) if c else None for s,c in r['choice'].items()})
