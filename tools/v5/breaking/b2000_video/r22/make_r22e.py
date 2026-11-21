import json,numpy as np,copy,sys
from fkj import *
from scipy.spatial.transform import Rotation as R, Slerp
src=sys.argv[1] if len(sys.argv)>1 else 'anim-2000-r22d.json'
a=json.load(open(src));F=a['frames'];N=len(F)
def sm(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def ramp(f,a0,a1,b0,b1): return sm((f-a0)/(a1-a0))*(1-sm((f-b0)/(b1-b0)))
Rq=lambda q:R.from_quat(q)
def world(fr):
    W,P=fk(fr); return W,P
def set_world_rot(fr,b,Wnew,Wpar): fr['q'][b]=list(R.from_matrix(Wpar.T@Wnew).as_quat())
SP=['spineLower','spineUpper','torso']
# ---- A: rigid straight back in the inverted part (remove spine extension) ----
TGT_X=-4.0
for f in range(N):
    w=ramp(f,350,404,745,790)
    if w<=0: continue
    fr=F[f];W0,P0=fk(fr)
    S=Rq(fr['q'][SP[0]])*Rq(fr['q'][SP[1]])*Rq(fr['q'][SP[2]])
    e=S.as_euler('XYZ',degrees=True)
    if e[0]>=TGT_X: continue
    e2=e.copy();e2[0]=e[0]+w*(TGT_X-e[0])
    S2=R.from_euler('XYZ',e2,degrees=True);r=R.from_rotvec(S2.as_rotvec()/3)
    for b in SP: fr['q'][b]=list(r.as_quat())
    # keep torso world pose: solve pelvis
    Wp=W0['torso']@np.linalg.inv((r*r*r).as_matrix())
    fr['q']['pelvis']=list(R.from_matrix(Wp).as_quat())
    Wsl=Wp@r.as_matrix();Wsu=Wsl@r.as_matrix()
    fr['p']=list(P0['torso']-(Wp@LP['spineLower']+Wsl@LP['spineUpper']+Wsu@LP['torso']))
    for t in ('leftThigh','rightThigh'): set_world_rot(fr,t,W0[t],Wp)  # legs keep world direction
# ---- arm IK helper ----
def arm_ik(fr,sd,T,Wh):
    W,P=fk(fr);S=P[sd+'UpperArm'];E=P[sd+'Forearm'];H=P[sd+'Hand']
    A=np.linalg.norm(LP[sd+'Forearm']);B=np.linalg.norm(LP[sd+'Hand'])
    d=T-S;L=np.linalg.norm(d);L=min(L,A+B-1e-4);u=d/np.linalg.norm(d)
    pole=E-S-((E-S)@u)*u
    if np.linalg.norm(pole)<1e-6: pole=np.cross(u,[0,1,0])
    pole/=np.linalg.norm(pole)
    x=(A*A-B*B+L*L)/(2*L);h=np.sqrt(max(A*A-x*x,0));E2=S+u*x+pole*h
    def rot_between(v1,v2):
        v1=v1/np.linalg.norm(v1);v2=v2/np.linalg.norm(v2);c=np.cross(v1,v2);s=np.linalg.norm(c)
        if s<1e-9: return np.eye(3)
        return R.from_rotvec(c/s*np.arctan2(s,v1@v2)).as_matrix()
    Wua=rot_between(E-S,E2-S)@W[sd+'UpperArm']
    set_world_rot(fr,sd+'UpperArm',Wua,W[sd+'Scapula'])
    W,P=fk(fr)
    Wfa=rot_between(P[sd+'Hand']-P[sd+'Forearm'],S+u*L-E2)@W[sd+'Forearm']
    set_world_rot(fr,sd+'Forearm',Wfa,Wua)
    set_world_rot(fr,sd+'Hand',Wh,Wfa)
# ---- B: right (second) hand straight to its final plant (f477), then fixed ----
from scipy.ndimage import maximum_filter1d,gaussian_filter1d
ORIG={f:fk(F[f]) for f in range(330,480)}          # after spine fix, before any arm change
Wt,Pt=ORIG[477];T=Pt['rightHand'].copy();WhT=Wt['rightHand'].copy()
P404=ORIG[404][1]['rightHand'];W404=ORIG[404][0]['rightHand']
REACH=np.linalg.norm(LP['rightForearm'])+np.linalg.norm(LP['rightHand'])-0.003
def rot_about(fr,piv,Rm):
    W,P=fk(fr);fr['q']['pelvis']=list(R.from_matrix(Rm@W['pelvis']).as_quat());fr['p']=list(piv+Rm@(np.array(fr['p'])-piv))
# needed rigid rotation of the whole body about the planted left hand so the straight right arm reaches T
fs=list(range(380,480));th=[];ax=[]
for f in fs:
    W,P=ORIG[f];piv=P['leftHand'];S=P['rightUpperArm']
    n=np.cross(S-piv,T-piv);n/=np.linalg.norm(n);ax.append(n)
    if f<404 or np.linalg.norm(T-S)<=REACH: th.append(0.0);continue
    lo,hi=0.0,0.6
    for _ in range(40):
        m=(lo+hi)/2;S2=piv+R.from_rotvec(n*m).apply(S-piv)
        if np.linalg.norm(T-S2)>REACH: lo=m
        else: hi=m
    th.append(hi)
th=np.array(th);ax=np.array(ax)
env=gaussian_filter1d(maximum_filter1d(th,21),4)
th2=np.maximum(env,th)
th2=np.array([t*(sm((f-378)/26) if f<404 else 1) for f,t in zip(fs,th2)])
for f,t,n in zip(fs,th2,ax):
    if t>0: rot_about(F[f],ORIG[f][1]['leftHand'],R.from_rotvec(n*t).as_matrix())
print('rot deg max',np.degrees(th.max()),'at',fs[int(th.argmax())])
for f in range(356,480):
    fr=F[f];W0,P0=ORIG[f]
    s=sm((f-356)/(404-356))
    if f<404:
        pos=P0['rightHand']+s*(T-P404)
        pos[1]=max(pos[1],T[1]+0.002)
        rot=R.from_rotvec(s*R.from_matrix(WhT@W404.T).as_rotvec()).as_matrix()@W0['rightHand']
    else: pos=T;rot=WhT
    arm_ik(fr,'right',pos,rot)
    if f<470: arm_ik(fr,'left',P0['leftHand'],W0['leftHand'])
# ---- C: right arm swings clear of the right thigh in the entry (f206): rigid arm rotation about the shoulder ----
def clos(p,q,x):
    d=q-p;t=np.clip((x-p)@d/(d@d),0,1);c=p+t*d;return np.linalg.norm(x-c),(x-c)
CLR=0.115
for _it in range(8):
    rv={}
    for f in range(180,236):
        W,P=fk(F[f]);best=None
        for x in (P['rightHand'],P['rightHand']+W['rightHand']@np.array([0,-0.09,0]),(P['rightHand']+P['rightForearm'])/2):
            for t in ('rightThigh','leftThigh'):
                d,v=clos(P[t],P[t.replace('Thigh','Shin')],x)
                if best is None or d<best[0]: best=(d,v,x)
        S=P['rightUpperArm'];r=best[2]-S;rl=np.linalg.norm(r);rh=r/rl
        v=best[1]/max(best[0],1e-6);vt=v-(v@rh)*rh;c=np.linalg.norm(vt)
        push=max(0,CLR-best[0])/max(c,0.35)
        rv[f]=np.cross(rh,vt/max(c,1e-6))*(push/rl)
    fsC=sorted(rv);V=np.array([rv[f] for f in fsC])
    mag=0.5*gaussian_filter1d(maximum_filter1d(np.linalg.norm(V,axis=1),3),1.5)
    dirs=gaussian_filter1d(V,2.5,axis=0);dirs/=np.maximum(np.linalg.norm(dirs,axis=1,keepdims=True),1e-9)
    print('C max deg',np.degrees(np.linalg.norm(V,axis=1).max()))
    for i,f in enumerate(fsC):
        if mag[i]<1e-5: continue
        W,P=fk(F[f]);set_world_rot(F[f],'rightUpperArm',R.from_rotvec(dirs[i]*mag[i]).as_matrix()@W['rightUpperArm'],W['rightScapula'])
# ---- D: anatomical foot clamp while airborne ----
LIM=[(-55,30),(-25,25),(-25,25)]
for side in ('leftFoot','rightFoot'):
    rv=[]
    for f in range(N):
        e=R.from_quat(F[f]['q'][side]).as_euler('XYZ',degrees=True)
        c=np.array([np.clip(e[k],*LIM[k]) for k in range(3)])
        rv.append(R.from_euler('XYZ',c,degrees=True))
    for f in range(345,820):
        win=[rv[g] for g in range(max(0,f-5),min(N,f+6))]
        wts=np.exp(-0.5*((np.arange(max(0,f-5),min(N,f+6))-f)/2.5)**2)
        m=R.concatenate(win).mean(weights=wts)
        w=ramp(f,345,365,795,815);orig=R.from_quat(F[f]['q'][side])
        F[f]['q'][side]=list(R.from_rotvec(w*(m*orig.inv()).as_rotvec())*orig .as_quat()) if False else list((R.from_rotvec(w*(m*orig.inv()).as_rotvec())*orig).as_quat())
for fr in F:
    for k,v in fr['q'].items(): fr['q'][k]=[round(x,6) for x in v]
    fr['p']=[round(x,5) for x in fr['p']]
a['name']=a['name'].split(' r22')[0]+' r22e'
json.dump(a,open('anim-2000-r22e.json','w'),separators=(',',':'))
print('ok')
