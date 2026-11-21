import json,numpy as np,sys
from fkj import *
from scipy.spatial.transform import Rotation as R
o=json.load(open('anim-2000-r22d.json'))['frames'];n=json.load(open(sys.argv[1]))['frames']
def seg(p,q,x):
    d=q-p;t=np.clip((x-p)@d/(d@d),0,1);return np.linalg.norm(p+t*d-x)
mx=0
for f in range(0,914):
    W,P=fk(n[f])
    if f%8==0 and 340<=f<=820:
        W0,P0=fk(o[f])
        sp=(R.from_quat(n[f]['q']['spineLower'])*R.from_quat(n[f]['q']['spineUpper'])*R.from_quat(n[f]['q']['torso'])).as_euler('XYZ',degrees=True)[0]
        # hand/forearm vs thighs
        dmin=min(seg(P[t],P[t.replace('Thigh','Shin')],x) for t in ('leftThigh','rightThigh') for x in (P['rightHand'],P['rightForearm'],(P['rightHand']+P['rightForearm'])/2,P['leftHand'],P['leftForearm']))
        print(f,'RH',np.round(P['rightHand'],3),'LH',np.round(P['leftHand'],3),'dP',np.round(np.array(n[f]['p'])-o[f]['p'],3),'elbL/R',round(elbow(W,P,'left')),round(elbow(W,P,'right')),'spX',round(sp),'LF',np.round(R.from_quat(n[f]['q']['leftFoot']).as_euler('XYZ',degrees=True)),'RF',np.round(R.from_quat(n[f]['q']['rightFoot']).as_euler('XYZ',degrees=True)),'armThigh',round(dmin,3))
# max per-frame angular step per joint
for j in J:
    s=max(np.degrees(R.from_quat(n[f]['q'][j]).inv()*R.from_quat(n[f+1]['q'][j])).magnitude() if False else np.degrees((R.from_quat(n[f]['q'][j]).inv()*R.from_quat(n[f+1]['q'][j])).magnitude()) for f in range(913))
    s0=max(np.degrees((R.from_quat(o[f]['q'][j]).inv()*R.from_quat(o[f+1]['q'][j])).magnitude()) for f in range(913))
    if s>s0+1: print('step',j,round(s0,1),'->',round(s,1))
pv=max(np.linalg.norm(np.array(n[f+1]['p'])-n[f]['p']) for f in range(913))*120;print('max pelvis speed',round(pv,2))
