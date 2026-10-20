# limbs stage A: Blender "Human Base Meshes" realistic male (CC0, same object as the torso: GEO-body_male_realistic) arms + legs
# -> v2 rest frame.  input  <work>/male_l2.npz (torso-base build), <work>/zip.npz (torso seams: the arm / leg rings it welds to)
#                    output <work>/limbs_fit.npz
# Only smooth deformations: per-segment similarity re-pose (upper arm / forearm / hand, thigh / shin / foot) about base joints
# estimated from slices, blended at the joints, then a bi-Laplacian-regularised low-frequency displacement field fitted to the
# v2 arm / leg skin (Coach_Body), stopped early (stiff) so the base musculature (mid frequencies) survives.
import os, sys
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import cg
from scipy.spatial import cKDTree
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def rot_to(a,b):
    a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); v=np.cross(a,b); s=np.linalg.norm(v); c=a@b
    if s<1e-9: return np.eye(3)
    K=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]]); return np.eye(3)+K+K@K*((1-c)/s**2)
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
d=np.load('male_l2.npz'); V=d['V'].copy(); Q=d['F']; V[:,1]+=0.043; V[:,2]+=0.012
F=np.r_[Q[:,[0,1,2]],Q[:,[0,2,3]]]
B=P[BODY]
def centre_slices(mask, axis, origin, ts, half=0.004):
    out=[]
    for t in ts:
        s=V[mask&(np.abs((V-origin)@axis-t)<half)]
        out.append(s.mean(0) if len(s)>20 else np.full(3,np.nan))
    return np.array(out)
Vn=V.copy(); wsum=np.zeros(len(V)); acc=np.zeros_like(V); part=np.zeros(len(V),int)   # 1 arm, 2 leg
JB={}
for sgn,sd in ((1,'left'),(-1,'right')):
    # ---------- arm: base shoulder from the torso build, axis from slices, wrist = thinnest forearm slice ----------
    S0=np.array([0.174*sgn,1.378,-0.036])
    arm=(V[:,0]*sgn>0.13)&(V[:,1]<1.30)&(V[:,1]>0.70)
    lat=V[:,0]*sgn; armm=arm&(lat>0.20)  # beyond the torso gap (checked: gap at x 0.15..0.25 for y<1.2)
    for y0 in np.arange(0.75,1.30,0.01):  # remove torso-side points on each y band (gap search)
        pass
    pts=V[armm&(V[:,1]<1.18)]; c=pts.mean(0); _,_,vt=np.linalg.svd(pts-c,full_matrices=False); ax=vt[0]*np.sign(-vt[0][1])  # downward
    tip=V[armm][np.argmax((V[armm]-S0)@ax)]; Ltot=(tip-S0)@ax
    ts=np.linspace(0.05,Ltot-0.01,120); r=[]
    for t in ts:
        sel=armm&(np.abs((V-S0)@ax-t)<0.004)
        s=V[sel]; r.append(np.linalg.norm(s-s.mean(0),axis=1).mean() if len(s)>20 else np.nan)
    r=np.array(r); vw=(ts>0.40)&(ts<0.56); tw=ts[vw][np.nanargmin(r[vw])]
    cw=V[armm&(np.abs((V-S0)@ax-tw)<0.004)].mean(0)
    # elbow: v2 proportion along the shoulder->wrist segment
    v2u=np.linalg.norm(LM[sd+'Elbow']-LM[sd+'Shoulder']); v2f=np.linalg.norm(LM[sd+'Wrist']-LM[sd+'Elbow'])
    ce=S0+(cw-S0)*v2u/(v2u+v2f)
    ce_s=V[armm&(np.abs((V-S0)@ax-(ce-S0)@ax)<0.004)]; ce=ce_s.mean(0) if len(ce_s)>20 else ce
    JB[sd+'Arm']=(S0,ce,cw)
    print(sd,'base arm: shoulder',S0.round(3),'elbow',ce.round(3),'wrist',cw.round(3),'(wrist slice t',round(tw,3),'of',round(Ltot,3),')')
    # segments: (base A, base B, v2 A, v2 B); vertex param along the arm path
    segs=[(S0,ce,LM[sd+'Shoulder'],LM[sd+'Elbow']),(ce,cw,LM[sd+'Elbow'],LM[sd+'Wrist']),(cw,cw+(cw-ce)*0.4,LM[sd+'Wrist'],LM[sd+'Wrist']+(LM[sd+'Wrist']-LM[sd+'Elbow'])*0.4)]
    tA=(V-S0)@((cw-S0)/np.linalg.norm(cw-S0)); te=(ce-S0)@((cw-S0)/np.linalg.norm(cw-S0)); twp=np.linalg.norm(cw-S0)
    m=armm|(arm&(tA>0.10))
    wts=[1-sstep(te-0.03,te+0.03,tA), sstep(te-0.03,te+0.03,tA)*(1-sstep(twp-0.02,twp+0.02,tA)), sstep(twp-0.02,twp+0.02,tA)]
    for (a,b,a2,b2),w in zip(segs,wts):
        R=rot_to(b-a,b2-a2); s=np.linalg.norm(b2-a2)/np.linalg.norm(b-a); u=(b-a)/np.linalg.norm(b-a)
        X=V-a; ax_=X@u; X=X+np.outer(ax_*(s-1),u); Y=X@R.T+a2
        acc[m]+=w[m,None]*Y[m]; wsum[m]+=w[m]
    part[m]=1
    # ---------- leg: hip from the torso build, ankle = base slice at the v2 ankle height, knee by v2 proportion ----------
    H0=np.array([0.078*sgn if sgn>0 else -0.082,0.885,0.010])
    leg=(V[:,0]*sgn>0.0)&(V[:,1]<0.70)
    ca=V[leg&(np.abs(V[:,1]-0.16)<0.004)].mean(0); ca[1]=0.16   # leg tube centre just above the shoe collar
    v2t=np.linalg.norm(LM[sd+'Knee']-LM[sd+'Hip']); v2s=np.linalg.norm(LM[sd+'Ankle']-LM[sd+'Knee'])
    # base ankle joint: same height as v2's (heights agree within 1%); centre of the slice there
    cA=V[leg&(np.abs(V[:,1]-LM[sd+'Ankle'][1]-0.02)<0.004)].mean(0); cA[1]=LM[sd+'Ankle'][1]
    ck=H0+(cA-H0)*v2t/(v2t+v2s); cks=V[leg&(np.abs(V[:,1]-ck[1])<0.004)]; ck=np.r_[cks.mean(0)[0],ck[1],cks.mean(0)[2]]
    JB[sd+'Leg']=(H0,ck,cA)
    print(sd,'base leg: hip',H0.round(3),'knee',ck.round(3),'ankle',cA.round(3))
    v2a=LM[sd+'Ankle']
    segs=[(H0,ck,LM[sd+'Hip'],LM[sd+'Knee']),(ck,cA,LM[sd+'Knee'],v2a),(cA,cA+np.array([0,-0.05,0.]),v2a,v2a+np.array([0,-0.05,0.]))]
    y=V[:,1]; kh=ck[1]
    wts=[sstep(kh-0.03,kh+0.03,y), (1-sstep(kh-0.03,kh+0.03,y))*sstep(cA[1]-0.01,cA[1]+0.02,y), 1-sstep(cA[1]-0.01,cA[1]+0.02,y)]
    m=leg&(part==0)
    for (a,b,a2,b2),w in zip(segs,wts):
        R=rot_to(b-a,b2-a2); s=np.linalg.norm(b2-a2)/np.linalg.norm(b-a); u=(b-a)/np.linalg.norm(b-a)
        X=V-a; ax_=X@u; X=X+np.outer(ax_*(s-1),u); Y=X@R.T+a2
        acc[m]+=w[m,None]*Y[m]; wsum[m]+=w[m]
    part[m]=2
ok=wsum>0; Vn[ok]=acc[ok]/wsum[ok,None]
V=Vn
# keep only limb faces
keepF=(part[F]>0).all(1)
V,F,used=compact(V,F,keepF); part=part[used]
print('limb verts',len(V),'faces',len(F))
np.savez('limbs_pre.npz',V=V,F=F,part=part)
# ---------- displacement fit to the v2 arm / leg skin ----------
NB=np.array(M[BODY]['N']).reshape(-1,3)
def restN(k):
    Pk=P[k]; Fk=np.array(M[k]['index']).reshape(-1,3); inv,first=weld(Pk); return vnormals(Pk[first],inv[Fk])[inv]
NB=restN(BODY)
tsel=np.zeros(len(B),bool)
for sgn,sd in ((1,'left'),(-1,'right')):
    S,E_,W_=LM[sd+'Shoulder'],LM[sd+'Elbow'],LM[sd+'Wrist']; u=(W_-S)/np.linalg.norm(W_-S); t=(B-S)@u
    tsel|=(B[:,0]*sgn>0.12)&(t>0.14)&(t<np.linalg.norm(W_-S)+0.03)&(B[:,1]>0.80)
tsel|=(B[:,1]>0.10)&(B[:,1]<0.635)
T=B[tsel]; TN=NB[tsel]; tree=cKDTree(T)
n=len(V); E=edges_of(F); A=adjacency(n,E); deg=np.asarray(A.sum(1)).ravel(); L=sp.diags(1/deg)@A-sp.eye(n); LtL=(L.T@L).tocsr()
SCH=[(float(a),float(b)) for a,b in (x.split(':') for x in os.environ.get('L_SCHED','8000:0.05,4000:0.035,2500:0.025').split(','))]
for it,(lam,dmax) in enumerate(SCH):
    Nv=vnormals(V,F); dd,jj=tree.query(V,k=6)
    bres=np.zeros((n,3)); bw=np.zeros(n)
    for k in range(6):
        p=T[jj[:,k]]; nt=TN[jj[:,k]]; c=np.einsum('ij,ij->i',Nv,nt)
        r=np.einsum('ij,ij->i',p-V,nt)[:,None]*nt
        okk=(c>0.55)&(dd[:,k]<dmax)&(bw==0)
        bres[okk]=r[okk]; bw[okk]=(c[okk]-0.55)/0.45
    W=sp.diags(bw); Aop=(W+lam*LtL).tocsr(); Dv=np.zeros_like(V)
    for c in range(3): Dv[:,c],info=cg(Aop,bw*bres[:,c],rtol=1e-6,maxiter=3000)
    V=V+Dv
    print('fit iter',it,'matched',int((bw>0).sum()),'of',n,'mean |res| mm',(np.linalg.norm(bres[bw>0],axis=1).mean()*1000).round(2),'max step mm',(np.linalg.norm(Dv,axis=1).max()*1000).round(1))
np.savez('limbs_fit.npz',V=V,F=F,part=part)
