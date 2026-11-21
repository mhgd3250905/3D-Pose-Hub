import json,numpy as np
from fkj import *
a=json.load(open('anim-2000-r22d.json'));F=a['frames']
A=np.linalg.norm(LP['rightForearm']);B=np.linalg.norm(LP['rightHand']);print('arm',A,B,A+B)
T=fk(F[477])[1]['rightHand']
prev=None
for f in range(300,480,4):
    W,P=fk(F[f]);d=np.linalg.norm(T-P['rightUpperArm'])
    v=None if prev is None else np.linalg.norm(P['rightHand']-prev)/4*120
    prev=P['rightHand']
    print(f,'reach',round(d,3),'RH',np.round(P['rightHand'],3),'speed',v and round(v,2), 'elb',round(elbow(W,P,'right'),0))
