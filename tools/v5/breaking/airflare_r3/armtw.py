import sys, numpy as np, math
from armfix import humerus_twist, pronation
from scipy.spatial.transform import Rotation as R
Z=np.load(sys.argv[1]); P=lambda j:Z['P_'+j]; W=lambda j:Z['W_'+j]; s=sys.argv[2]; sg=1 if s=='left' else -1
n3=lambda v:v/np.linalg.norm(v); a,b,st=[int(x) for x in sys.argv[3:6]]
for i in range(a,b,st):
    e_=n3(P(s+'Forearm')[i]-P(s+'UpperArm')[i]); f_=n3(P(s+'Hand')[i]-P(s+'Forearm')[i])
    hw=humerus_twist(W('torso')[i],sg,e_,W(s+'UpperArm')[i][:,2]); pr=pronation(W(s+'UpperArm')[i],W(s+'Forearm')[i],e_,f_)
    q=R.from_matrix(W(s+'Forearm')[i].T@W(s+'Hand')[i]).as_quat(); tw=math.degrees(2*math.atan2(q[:3]@(sg*np.eye(3)[0]),q[3])); tw=(tw+180)%360-180
    fa=P(s+'Hand')[i]-P(s+'Forearm')[i]; fi=W(s+'Hand')[i]@(sg*np.eye(3)[0]); wr=math.degrees(math.acos(fa@fi/np.linalg.norm(fa)/np.linalg.norm(fi)))
    print('%.2fs hw %+4.0f pr %+4.0f handtw %+4.0f sum %+4.0f wrist %3.0f handY %.3f'%(i/120,hw,pr,tw,hw+pr+tw,wr,P(s+'Hand')[i][1]))
