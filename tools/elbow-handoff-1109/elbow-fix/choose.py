import json,sys
def classify(m,b):
    gain=m['ratio']-b['ratio']
    if m['htwMax']>b['htwMax']+15 and gain<0.15:return 'leave'
    if m['ratio']>=0.90 and m['twMax']<=45:return 'full'
    if m['ratio']>=0.80 and m['twMax']<=75 and (gain>=0.15 or (m['ratio']>=0.85 and gain>=0.08 and m['twMax']<=b['twMax']-40)):return 'partial'
    return 'leave'
# choose per side from verified candidates; classify full / partial / leave
recs={}
for l in open('/workspace/work/elbow-fix/res.jsonl'):
    r=json.loads(l);recs[r['id']]=r
FL={o['id']:o for o in json.load(open('/workspace/work/elbow-fix/flagged.json'))}
out={}
for id,r in recs.items():
    if r.get('error'):out[id]={'status':'error','why':r['error'][:200]};continue
    res={'sides':{}}
    for s in r['sides']:
        b=r['base'][s];best=None;rej=[]
        for v in r['ver']:
            if s not in v['p']:continue
            m=v['sm'][s];why=[]
            if v['drift']>0.5:why.append('drift')
            if m['sh']<min(b['sh'],0.85)-0.03:why.append('shoulder')
            if m['wr']<min(b['wr'],0.85)-0.03:why.append('wrist')
            if m['near']>b['near']+15:why.append('contact')
            if not(m['minY']>=b['minY']-3 or m['minY']>=10):why.append('floor')
            if m['htwMax']>max(b['htwMax'],45)+10:why.append('handtwist')
            if m.get('pitMax',0)>max(30,b.get('pitMax',0)+5)+10:why.append('pit')
            if m['warn']>b['warn']:why.append('warn')
            if why:rej.append(why);continue
            sc=m['ratio']-0.002*m['twMax']-0.004*max(0,m["htwMax"]-max(30,b["htwMax"]))-0.001*max(0,(m.get('pitMax') or 0)-30)
            if not best or sc>best['sc']:best={'sc':sc,'p':v['p'][s],'m':m,'drift':v['drift']}
        st=classify(best['m'],b) if best else 'leave'
        res['sides'][s]={'status':st,'best':best,'base':b,'rej':rej,'cands':r['cands'][s]}
    # symmetry preference: a verified pass with mirrored params on both flagged sides, each side within 0.03 of its best
    ss=r['sides']
    if len(ss)==2 and all(res['sides'][x]['best'] for x in ss):
        for v in r['ver']:
            if not all(x in v['p'] for x in ss):continue
            L,Rr=v['p']['left'],v['p']['right']
            if not(L['a']==-Rr['a'] and L['b']==-Rr['b'] and L['c']==Rr['c']):continue
            if v.get('_rej'):continue
            okk=True;nb={}
            for x in ss:
                m=v['sm'][x];b=r['base'][x]
                sc=m['ratio']-0.002*m['twMax']-0.004*max(0,m['htwMax']-max(30,b['htwMax']))
                if sc<res['sides'][x]['best']['sc']-0.03 or m['ratio']<0.85 or v['drift']>0.5 or m['warn']>b['warn'] or m['htwMax']>max(b['htwMax'],45)+10 or m.get('pitMax',0)>max(30,b.get('pitMax',0)+5)+10:okk=False
                nb[x]={'sc':sc,'p':v['p'][x],'m':m,'drift':v['drift']}
            if okk:
                for x in ss:res['sides'][x]['best']=nb[x];res['sides'][x]['mirrored']=True
                break
        for x in ss:
            y=res['sides'][x];m=y['best']['m'];b=y['base']
            y['status']=classify(m,b)
    out[id]=res
json.dump(out,open('/workspace/work/elbow-fix/choice.json','w'),ensure_ascii=False,indent=1)
for id,x in out.items():
    if 'sides' not in x:print(id,x);continue
    for s,y in x['sides'].items():
        b=y['base'];m=y['best']['m'] if y['best'] else None;p=y['best']['p'] if y['best'] else None
        print(f"{id:34s} {s[0]} {y['status']:7s} r {b['ratio']:.2f}->{(m['ratio'] if m else 0):.2f} tw {b['twMax']:.0f}->{(m['twMax'] if m else 0):.0f} htw {b['htwMax']:.0f}->{(m['htwMax'] if m else 0):.0f} elbW {b['elbowAtWorst']} p={(p['a'],p['b'],p['c']) if p else None} rej={y['rej']} pred={[ (c['a'],c['b'],c['tPred'],c['hPred'],c['pen']) for c in y['cands'][:1]]}")
