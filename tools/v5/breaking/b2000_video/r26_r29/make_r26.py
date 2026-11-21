# r26 = r22d + ONE local fix: right (second) hand plant.
# Root cause: single-camera depth ambiguity. r22d put the plant at T (f477 wrist), which the f404 body
# cannot reach straight-armed (0.54 m > 0.485 m), so the hand slid 57 mm and turned 84 deg.
# Moving the plant 12.6 cm along the clipA camera's depth axis (0.6 px on screen) makes it reachable
# for the whole 404-477 window with the body untouched. The body is then carried the same 12.6 cm in
# depth (rigid translation, invisible from clipA) after the left hand leaves, so the spin pivots on it.
import json, copy, numpy as np, sys
sys.path.insert(0,'/workspace/work/b2000/r22')
from fkj import *
from scipy.spatial.transform import Rotation as Rot, Slerp
a=json.load(open('/workspace/work/b2000/r22/anim-2000-r22d.json')); F=a['frames']; G=copy.deepcopy(F); N=len(F)
W7,P7=fk(F[477]); T=P7['rightHand'].copy(); R7=W7['rightHand']
dP=np.array([0.0025,0.0,-0.1262]); PL=T+dP
LEND=max(f for f in range(404,520) if F[f]['lock'][0]); R0=LEND+1; R1=R0+40
A0,AW,TD=372,398,404
la=np.linalg.norm(LP['rightForearm']); lb=np.linalg.norm(LP['rightHand'])
def sm(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def mq(M): return list(np.round(Rot.from_matrix(M).as_quat(),6))
def rotv(u,v):
    u=u/np.linalg.norm(u); v=v/np.linalg.norm(v); c=np.cross(u,v); s=np.linalg.norm(c)
    return np.eye(3) if s<1e-9 else Rot.from_rotvec(c/s*np.arctan2(s,u@v)).as_matrix()
print('left lock ends',LEND,'ramp',R0,R1)
for f in range(R0,N):
    G[f]['p']=list(np.round(np.array(F[f]['p'])+sm((f-R0)/(R1-R0))*dP,5))
for f in range(A0,R1+1):
    fr=G[f]; W,P=fk(fr); S=P['rightUpperArm']; h0=P['rightHand']
    if f<TD:
        w=sm((f-A0)/(AW-A0)); hgt=0.07*(1-sm((f-AW)/(TD-AW)))
        ht=(1-w)*h0+w*(PL+np.array([0,hgt,0])); ht[1]=max(ht[1],PL[1])
        Rh=Slerp([0,1],Rot.from_matrix([W['rightHand'],R7]))(sm((f-A0)/(TD-2-A0))).as_matrix()
    else:
        ht=PL.copy(); Rh=R7 if f<=477 else W['rightHand']
    d=ht-S; dist=np.linalg.norm(d); n=d/dist; dist=min(dist,la+lb-1e-5)
    E0=P['rightForearm']; cosA=np.clip((la*la+dist*dist-lb*lb)/(2*la*dist),-1,1)
    pole=(E0-S)-((E0-S)@n)*n; pole=pole/np.linalg.norm(pole) if np.linalg.norm(pole)>1e-6 else np.cross(n,[0,1,0])
    E=S+n*la*cosA+pole*la*np.sqrt(1-cosA*cosA)
    Wua=rotv(W['rightUpperArm']@LP['rightForearm'],E-S)@W['rightUpperArm']
    Wfa0=Wua@Rot.from_quat(fr['q']['rightForearm']).as_matrix()
    Wfa=rotv(Wfa0@LP['rightHand'],S+n*dist-E)@Wfa0
    fr['q']['rightUpperArm']=mq(W['rightScapula'].T@Wua); fr['q']['rightForearm']=mq(Wua.T@Wfa); fr['q']['rightHand']=mq(Wfa.T@Rh)
a['frames']=G; a['name']=a['name'].replace('r22d','r26')
a['source']+='; r26: r22d + right-hand plant moved 12.6 cm in camera depth (reachable straight-armed, no slide/turn), body carried in depth after left hand leaves'
json.dump(a,open('anim-2000-r26.json','w'),ensure_ascii=False,separators=(',',':'))
