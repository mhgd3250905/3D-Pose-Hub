# r27 = r26 + (1) right-arm swing f178-236 clears the legs; (2) right hand prepares like the left:
# arm reaches down nearly straight, wrist up / palm to ground early, then lands on the r26 plant.
# Frames outside 178-236 and 340-403 are byte-identical to r26.
import json, copy, numpy as np, sys
sys.path.insert(0,'/workspace/work/b2000/r22')
from fkj import *
from scipy.spatial.transform import Rotation as Rot, Slerp
a=json.load(open('/workspace/work/b2000/r26/anim-2000-r26.json')); F=a['frames']; G=copy.deepcopy(F)
la=np.linalg.norm(LP['rightForearm']); lb=np.linalg.norm(LP['rightHand'])
def sm(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def mq(M): return list(np.round(Rot.from_matrix(M).as_quat(),6))
def rotv(u,v):
    u=u/np.linalg.norm(u); v=v/np.linalg.norm(v); c=np.cross(u,v); s=np.linalg.norm(c)
    return np.eye(3) if s<1e-9 else Rot.from_rotvec(c/s*np.arctan2(s,u@v)).as_matrix()
def ik(fr,ht,Rh,pole_bias=None):
    W,P=fk(fr); S=P['rightUpperArm']; d=ht-S; dist=np.linalg.norm(d); n=d/dist; dist=min(dist,la+lb-1e-5)
    E0=P['rightForearm']; v=(E0-S) if pole_bias is None else pole_bias
    cosA=np.clip((la*la+dist*dist-lb*lb)/(2*la*dist),-1,1)
    pole=v-(v@n)*n; pole=pole/np.linalg.norm(pole) if np.linalg.norm(pole)>1e-6 else np.cross(n,[0,1,0])
    E=S+n*la*cosA+pole*la*np.sqrt(1-cosA*cosA)
    Wua=rotv(W['rightUpperArm']@LP['rightForearm'],E-S)@W['rightUpperArm']
    Wfa0=Wua@Rot.from_quat(fr['q']['rightForearm']).as_matrix()
    Wfa=rotv(Wfa0@LP['rightHand'],S+n*dist-E)@Wfa0
    fr['q']['rightUpperArm']=mq(W['rightScapula'].T@Wua); fr['q']['rightForearm']=mq(Wua.T@Wfa); fr['q']['rightHand']=mq(Wfa.T@Rh)
def segd(p,a_,b):
    ab=b-a_; t=np.clip((p-a_)@ab/(ab@ab),0,1); q=a_+t*ab; return np.linalg.norm(p-q),q
LEGS=[('leftThigh','leftShin'),('rightThigh','rightShin'),('leftShin','leftFoot'),('rightShin','rightFoot')]
# ---- (1) swing clearance: push hand (and forearm) out of the legs along body-forward, smooth in time
S0,S1=178,236; CLR=0.15
need=np.zeros(len(F)); fwd={}
for f in range(S0,S1+1):
    W,P=fk(F[f]); fw=W['pelvis']@np.array([0,0,1.0]); fw[1]=0; fw/=np.linalg.norm(fw); fwd[f]=fw
    m=0
    for pt in [P['rightHand'],0.5*(P['rightHand']+P['rightForearm'])]:
        for s,e in LEGS:
            d,q=segd(pt,P[s],P[e])
            if d<CLR:
                # how far forward must pt go to get CLR from the leg axis
                for k in np.linspace(0,0.35,71):
                    if segd(pt+fw*k,P[s],P[e])[0]>=CLR: break
                m=max(m,k)
    need[f]=m
k=np.hanning(31); k/=k.sum(); sm_need=np.convolve(need,k,'same'); sm_need=np.maximum(sm_need, np.convolve(need,np.ones(9)/9,'same'))
env=np.array([sm((f-S0)/12)*sm((S1-f)/12) for f in range(len(F))])
print('swing max push cm',round(need.max()*100,1),'at',int(need.argmax()))
for f in range(S0,S1+1):
    off=sm_need[f]*env[f]
    if off<1e-4: continue
    W,P=fk(G[f]); ht=P['rightHand']+fwd[f]*off
    ik(G[f],ht,W['rightHand'])
# ---- (2) prep: from f340 the arm reaches down straight, palm turns flat (wrist up) by ~f372
A0,AW,TD=340,396,404
W7,P7=fk(F[TD]); PL=P7['rightHand']; R7=W7['rightHand']
for f in range(A0,TD):
    fr=G[f]; W,P=fk(F[f]); S=P['rightUpperArm']; h0=P['rightHand']
    w=sm((f-A0)/(AW-A0)); hgt=0.11*(1-sm((f-366)/(TD-366)))
    tgt=PL+np.array([0,hgt,0])
    d0=h0-S; d1=tgt-S; L0=np.linalg.norm(d0); L1=min(np.linalg.norm(d1),la+lb-0.005)
    dirn=Slerp([0,1],Rot.from_matrix([np.eye(3),rotv(d0,d1)]))(w).as_matrix()@(d0/L0)
    u=sm((f-A0)/(366-A0)); L=(1-u)*L0+u*L1 if f<AW else L1
    ht=S+dirn*L
    if f>=AW: ht=S+(tgt-S)/np.linalg.norm(tgt-S)*L1
    # wrist: blend local wrist to the planted local wrist (dorsiflexed, palm to ground when arm points down)
    ql=Slerp([0,1],Rot.from_quat([F[f]['q']['rightHand'],F[TD]['q']['rightHand']]))(sm((f-A0)/(366-A0)))
    ik(fr,ht,np.eye(3))
    W2,_=fk(fr); fr['q']['rightHand']=list(np.round(ql.as_quat(),6))
a['frames']=G; a['name']=a['name'].replace('r26','r27')
a['source']+='; r27: swing clears legs f178-236, right-hand prep f340-403 (straight reach, palm flat early)'
json.dump(a,open('anim-2000-r27.json','w'),ensure_ascii=False,separators=(',',':'))
