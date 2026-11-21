import json,sys,numpy as np
from common import *
A=json.load(open('../r21/anim-2000-r21c.json'))['frames'];B=json.load(open(sys.argv[1]))['frames']
def met(F,i):
    W,P=fk(F[i]);o={}
    for s in ('left','right'):
        t=P[s+'Shin']-P[s+'Thigh'];sh=P[s+'Foot']-P[s+'Shin'];o[s+'knee']=np.degrees(np.arccos(t@sh/np.linalg.norm(t)/np.linalg.norm(sh)))
        # sideways lean of the leg: hip->ankle line vs vertical, measured in the plane perpendicular to the hand->support-foot line
    o['stance']=np.linalg.norm((P['leftFoot']-P['rightFoot'])[[0,2]])
    o['pel']=P['pelvis']
    u=P['leftForearm']-P['leftUpperArm'];f=P['leftHand']-P['leftForearm'];o['eL']=np.degrees(np.arccos(np.clip(u@f/np.linalg.norm(u)/np.linalg.norm(f),-1,1)))
    o['uvA']=projA(kp_world(W,P))
    return o
for i in list(range(232,428,12)):
    a,b=met(A,i),met(B,i)
    print(i,'stance %.2f->%.2f'%(a['stance'],b['stance']),'Lknee %.0f->%.0f'%(a['leftknee'],b['leftknee']),'Rknee %.0f->%.0f'%(a['rightknee'],b['rightknee']),'dpel',np.round(b['pel']-a['pel'],2),'elbL %.0f'%b['eL'],'Ashift med %.1f max %.1f'%(np.median(np.linalg.norm(a['uvA']-b['uvA'],axis=1)),np.linalg.norm(a['uvA']-b['uvA'],axis=1).max()))
