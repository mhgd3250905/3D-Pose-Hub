import json,sys,math
# python3 summ.py file.jsonl [id]  -> per id/variant/side worst-frame summary
def lab(v,side):
    if not v: return '-'
    x,y,z=v
    L=[(y,'头','脚'),(z,'前','后'),((x if side=='left' else -x),'外','内')]
    L=sorted([(abs(c),p if c>0 else n) for c,p,n in L],reverse=True)
    return L[0][1]+(('偏'+L[1][1]) if L[1][0]>0.35 else '')
def wl(v):
    if not v: return '-'
    x,y,z=v; return '上' if y>0.5 else ('下' if y<-0.5 else '平')
def summ(rows,s):
    g=lambda k:[r[s].get(k) for r in rows if r[s].get(k) is not None]
    w=min(rows,key=lambda r:r[s]['ratio'] if r[s]['ratio'] is not None else 9)
    ws=min(rows,key=lambda r:r[s]['shW'])
    return dict(wr=min(g('wr')),el=min(g('ratio')),tw=max(abs(x) for x in g('tw')),htw=max(abs(x) for x in g('htw')),shW=min(g('shW')),shR5=min(g('shR5')),
        flip=max(g('shFlip')),shTw=max(abs(x) for x in g('shTw')),shTwRange=max(g('shTw'))-min(g('shTw')),near=max(g('near')),minY=min(g('minY')),
        warn=sum(r['warn'] for r in rows),tWorstEl=w['t'],tWorstSh=ws['t'],pit=lab(w[s]['pitT'],s),palm=lab(w[s]['palmT'],s),pitW=wl(w[s]['pitW']),palmW=wl(w[s]['palmW']),
        pitT=w[s]['pitT'],palmT=w[s]['palmT'])
def load(f):
    D={}
    for l in open(f):
        r=json.loads(l);D.setdefault(r['id'],{})[r['name']]=r
    return D
def drift(a,b):
    m=0
    for ra,rb in zip(a['rows'],b['rows']):
        for k,p in ra['joints'].items():
            q=rb['joints'].get(k)
            if isinstance(p,list) and isinstance(q,list) and len(p)==3: m=max(m,math.dist(p,q))
    return m*1000
if __name__=='__main__':
    D=load(sys.argv[1])
    for id,V in D.items():
        if len(sys.argv)>2 and id not in sys.argv[2:]: continue
        for n,r in V.items():
            for s in ['left','right']:
                m=summ(r['rows'],s)
                print(f"{id:28s} {n:10s} {s[0]} el {m['el']:.2f} tw {m['tw']:4.0f} htw {m['htw']:4.0f} | shW {m['shW']:.2f} R5 {m['shR5']:.2f} flip {m['flip']:3d} shTw {m['shTw']:4.0f} rng {m['shTwRange']:4.0f} | near {m['near']:3d} minY {m['minY']:5.1f} warn {m['warn']} | pit {m['pit']}/{m['pitW']} palm {m['palm']}/{m['palmW']} @{m['tWorstEl']}")
