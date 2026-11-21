import json,numpy as np,sys
sys.path.insert(0,'/workspace/work/b2000/r22')
from fkj import *
A=json.load(open('/workspace/work/b2000/r22/anim-2000-r22d.json'))['frames'];B=json.load(open(sys.argv[1]))['frames']
W7,P7=fk(A[477]);T=P7["rightHand"]+np.array([0.0025,0,-0.1262]);R7=W7['rightHand']
c=np.array([-0.0795,0.1164,4.2556]);t=np.array([-0.0795,0.5309,-0.0244]);z=(t-c)/np.linalg.norm(t-c);x=np.cross(z,[0,1,0]);x/=np.linalg.norm(x);y=np.cross(x,z)
fy=540/np.tan(np.radians(47.15/2))
def pr(p):d=p-c;return np.array([fy*(d@x)/(d@z),-fy*(d@y)/(d@z)])
diff=[f for f in range(914) if A[f]!=B[f]];print('changed',diff[0],diff[-1],len(diff))
for f in [380,388,396,404,412,420,430,440,450,460,470,477]:
  Wa,Pa=fk(A[f]);W,P=fk(B[f]);ang=np.degrees(np.arccos(np.clip((np.trace(R7.T@W['rightHand'])-1)/2,-1,1)))
  sh=[np.linalg.norm(pr(P[b])-pr(Pa[b])) for b in J if b not in('rightUpperArm','rightForearm','rightHand')]
  print(f,'RH d',round(np.linalg.norm(P['rightHand']-T)*1000,1),'y',round(P['rightHand'][1],3),'rot',round(ang,1),'elR',round(elbow(W,P,'right')),'LHdrift',round(np.linalg.norm(P['leftHand']-Pa['leftHand'])*1000,2),'px med/max',round(np.median(sh),1),round(max(sh),1),'pelvis cm',round(np.linalg.norm(P['pelvis']-Pa['pelvis'])*100,1))
