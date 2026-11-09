import json,sys
from summ import load,summ,drift
# python3 cmp.py base.jsonl cand.jsonl id side  -> table of candidates vs before / r1 with constraint flags
B=load(sys.argv[1]);C=load(sys.argv[2]);id=sys.argv[3];sides=sys.argv[4].split(',')
V={k:v for k,v in {**B.get(id,{}),**C.get(id,{})}.items() if not k.startswith('joints')}
b=V['before']
for s in sides:
    mb=summ(b['rows'],s)
    print(f'--- {id} {s}')
    out=[]
    for n,r in V.items():
        m=summ(r['rows'],s);d=drift(b,r)
        ok=[]
        if m['el']<0.85: ok.append('el')
        if m['shW']<mb['shW']-0.03: ok.append('shW')
        if m['shR5']<mb['shR5']-0.03: ok.append('R5')
        if m['flip']>mb['flip']+10: ok.append('flip')
        if m['shTw']>mb['shTw']+15: ok.append('shTw')
        if m['htw']>mb['htw']+15: ok.append('htw')
        if m['warn']>mb['warn']: ok.append('warn')
        if m['near']>mb['near']+15: ok.append('near')
        if m['minY']<min(mb['minY']-3,10) : ok.append('minY')
        out.append((len(ok),-m['el'],n,m,d,ok))
    for k,_,n,m,d,ok in sorted(out,key=lambda x:(x[0],x[1])):
        print(f"{n:16s} wr {m['wr']:.2f} el {m['el']:.2f} tw {m['tw']:4.0f} htw {m['htw']:4.0f} shW {m['shW']:.2f} R5 {m['shR5']:.2f} flip {m['flip']:3d} shTw {m['shTw']:4.0f}/{m['shTwRange']:3.0f} near {m['near']:3d} minY {m['minY']:6.1f} w {m['warn']} drift {d:5.1f} pit {m['pit']}/{m['pitW']} palm {m['palm']}/{m['palmW']} {'OK' if not ok else ','.join(ok)}")
