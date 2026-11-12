import json,sys
from summ import load,summ
D=load(sys.argv[1])
for id,V in D.items():
  if 'r1' not in V: continue
  for s in ['left','right']:
    b=summ(V['before']['rows'],s);r=summ(V['r1']['rows'],s)
    if b['el']>0.9 and abs(r['shTw']-b['shTw'])<5: continue
    fl=[]
    if r['shW']<b['shW']-0.03: fl.append('SHW')
    if r['shR5']<b['shR5']-0.03: fl.append('R5')
    if r['flip']>b['flip']+10: fl.append('FLIP')
    if r['shTw']>b['shTw']+15: fl.append('SHTW')
    print(f"{id:30s}{s[0]} el {b['el']:.2f}->{r['el']:.2f} shW {b['shW']:.2f}->{r['shW']:.2f} R5 {b['shR5']:.2f}->{r['shR5']:.2f} flip {b['flip']}->{r['flip']} shTw {b['shTw']:.0f}->{r['shTw']:.0f} rng {b['shTwRange']:.0f}->{r['shTwRange']:.0f} htw {b['htw']:.0f}->{r['htw']:.0f} pit {b['pit']}->{r['pit']} palm {b['palm']}->{r['palm']} {' '.join(fl)}")
