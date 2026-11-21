# r29 = r28d + feet: airborne frames get the ankle pulled back into a human range.
# Ankle angle read as toe pitch / toe yaw / sole roll relative to the shin; roll unwrapped over time, then soft-limited.
# Grounded frames (foot joint low) untouched.
import json, copy, numpy as np, sys
sys.path.insert(0,'/workspace/work/b2000/r22'); sys.path.insert(0,'/workspace/work/b2000/r28')
from fkj import *
from scipy.spatial.transform import Rotation as R
from footaudit import ang
a=json.load(open('anim-2000-r28d.json')); F=a['frames']; G=copy.deepcopy(F); N=len(F)
LIM=dict(pf=(-50,60),yaw=(-35,35),roll=(-30,30))
def soft(x,lo,hi,k=0.92):
    # identity inside k*limit, eases into the limit beyond
    out=np.array(x,float)
    for i,v in enumerate(out):
        for L,sg in ((hi,1),(lo,-1)):
            a0=k*L
            if sg*v>sg*a0:
                over=sg*(v-a0); span=sg*(L-a0); out[i]=a0+sg*span*np.tanh(over/span)
    return out
def build(pf,yaw,roll):
    pf,yaw,roll=np.radians([pf,yaw,roll])
    t=np.array([np.sin(yaw)*np.cos(pf),-np.sin(pf),np.cos(yaw)*np.cos(pf)])
    yp=np.array([0,1,0.])-t[1]*t; yp/=np.linalg.norm(yp)
    u=R.from_rotvec(t*roll).apply(yp); x=np.cross(u,t)
    return np.stack([x,u,t],1)
gnd={}
for s in ('left','right'):
    gnd[s]=np.array([fk(fr)[1][s+'Foot'][1]<0.14 for fr in F])
rep={}
for s in ('left','right'):
    A=np.array([ang(fr['q'][s+'Foot']) for fr in F])
    rl=np.degrees(np.unwrap(np.radians(A[:,2])))
    # keep unwrapped roll near the range: shift whole runs by 360 so grounded frames stay where they are
    pf=soft(A[:,0],*LIM['pf']); yw=soft(A[:,1],*LIM['yaw']); ro=soft(rl,*LIM['roll'])
    # blend weight: 0 on ground, ramps to 1 over 8 frames once airborne
    air=(~gnd[s]).astype(float); w=np.zeros(N)
    d=np.full(N,99)
    for i in range(N):
        if gnd[s][i]: d[i]=0
        elif i>0: d[i]=min(d[i],d[i-1]+1)
    for i in range(N-2,-1,-1): d[i]=min(d[i],d[i+1]+1)
    w=np.clip(d/8,0,1); w=w*w*(3-2*w)
    ch=[]
    for i in range(N):
        if w[i]<1e-3: continue
        M0=R.from_quat(F[i]['q'][s+'Foot']); M1=R.from_matrix(build(pf[i],yw[i],ro[i]))
        # sanity: unchanged angles must rebuild the same rotation
        q=R.from_quat([M0.as_quat(),M1.as_quat()]); 
        from scipy.spatial.transform import Slerp
        Mi=Slerp([0,1],q)([w[i]])[0]
        if (Mi.inv()*M0).magnitude()>np.radians(0.5): ch.append(i)
        G[i]['q'][s+'Foot']=list(np.round(Mi.as_quat(),6))
    rep[s]=ch
    # rebuild check on an untouched-range frame
for s in ('left','right'):
    ch=rep[s]; segs=[];st=None
    for i in ch:
        if st is None or i!=pv+1:
            if st is not None: segs.append((st,pv))
            st=i
        pv=i
    if st is not None: segs.append((st,pv))
    print(s,'changed frames',len(ch),segs)
a['frames']=G; a['name']=a['name'].replace('r28d','r29')
a['source']+='; r29: airborne ankle angles soft-limited (toe pitch -50..60, toe yaw +-30, sole roll +-25), grounded frames untouched'
json.dump(a,open('anim-2000-r29.json','w'),ensure_ascii=False,separators=(',',':'))
