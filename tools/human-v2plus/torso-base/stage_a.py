# stage A: Blender "Human Base Meshes" realistic male (CC0) -> v2 rest frame.
#   input : <work>/male_l2.npz (extract_blend.py: base cage, Catmull-Clark x2 + multires normal displacement, three.js axes)
#   output: <work>/fit.npz   (torso part of the base mesh, re-posed and smoothly fitted to the v2 compression silhouette)
# Only smooth deformations: a similarity transform, arm/thigh re-pose about estimated joints with smooth weights, and a
# bi-Laplacian-regularised (low-frequency) displacement field fitted to the v2 compression tee/shorts + arm/leg skin.
import sys, os
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import cg
from scipy.spatial import cKDTree
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def rot(axis,ang):
    a=np.asarray(axis,float); a/=np.linalg.norm(a); K=np.array([[0,-a[2],a[1]],[a[2],0,-a[0]],[-a[1],a[0],0]]); return np.eye(3)+np.sin(ang)*K+(1-np.cos(ang))*K@K
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
d=np.load('male_l2.npz'); V=d['V'].copy(); Q=d['F']
# ---- 1. similarity: base crotch -> v2 crotch height, trunk depth centre -> v2 (scale 1: crotch-to-shoulder-top spans match within 1.3%)
V[:,1]+=0.043; V[:,2]+=0.012
# ---- 2. region of interest (torso + upper arms/thighs) to keep working on
keep=(V[:,1]>0.47)&(V[:,1]<1.56)
# ---- 3a. thighs first (hands are still out of the way)
for sgn,sd in ((1,'left'),(-1,'right')):
        # thigh re-pose: base legs stand wider than v2
        H=np.array([0.090*sgn,0.885,0.010])
        cs=[]
        for y in np.arange(0.52,0.70,0.02):
            s=V[(np.abs(V[:,1]-y)<0.004)&(V[:,0]*sgn>0.01)&(V[:,0]*sgn<0.19)]
            if len(s): cs.append(s.mean(0))
        cs=np.array(cs); a=np.polyfit(cs[:,1],cs[:,0],1); b=np.polyfit(cs[:,1],cs[:,2],1)
        yA,yB=H[1],0.55; ub=np.array([np.polyval(a,yB)-np.polyval(a,yA),yB-yA,np.polyval(b,yB)-np.polyval(b,yA)]); ub/=np.linalg.norm(ub)
        H=np.array([np.polyval(a,yA),yA,np.polyval(b,yA)])
        # abduction only (rotation about z): the base thigh axis also leans forward with the quadriceps shape
        ubx=np.array([ub[0],ub[1],0]); ubx/=np.linalg.norm(ubx); uv=LM[sd+'Knee']-LM[sd+'Hip']; uv=np.array([uv[0],uv[1],0]); uv/=np.linalg.norm(uv)
        ax=np.cross(ubx,uv); ang=np.arcsin(np.linalg.norm(ax)); R=rot(ax,ang)
        t=(V-H)@ubx; w=sstep(-0.02,0.16,t)*sstep(-0.01,0.03,V[:,0]*sgn)
        Vr=(V-H)@R.T+H+(LM[sd+'Hip']-H)*np.array([1,0,0])
        V=V+(Vr-V)*w[:,None]
        print(sd,'base hip axis point',H.round(3),'thigh angle deg',np.degrees(ang).round(1))
# ---- 3. arm re-pose (A-pose ~24 deg -> v2 ~10 deg) about the estimated base shoulder joint
for sgn,sd in ((1,'left'),(-1,'right')):
    J=np.array([0.175*sgn,1.378,0.0]); J[2]=np.median(V[(np.abs(V[:,0]-J[0])<0.03)&(np.abs(V[:,1]-1.10)<0.03),2])
    # base upper-arm axis from slice centres
    cs=[]
    for y in np.arange(1.02,1.20,0.02):
        s=V[(np.abs(V[:,1]-y)<0.004)&(V[:,0]*sgn>0.19)]
        s=s[s[:,0]*sgn>np.percentile(s[:,0]*sgn,1)] if len(s) else s
        if len(s): cs.append(s.mean(0))
    cs=np.array(cs); a=np.polyfit(cs[:,1],cs[:,0],1); b=np.polyfit(cs[:,1],cs[:,2],1)
    yA,yB=1.378,1.10; ub=np.array([np.polyval(a,yB)-np.polyval(a,yA),yB-yA,np.polyval(b,yB)-np.polyval(b,yA)]); ub/=np.linalg.norm(ub)
    J=np.array([np.polyval(a,yA),yA,np.polyval(b,yA)])
    uv=LM[sd+'Elbow']-LM[sd+'Shoulder']; uv/=np.linalg.norm(uv)
    ax=np.cross(ub,uv); ang=np.arcsin(np.linalg.norm(ax)); R=rot(ax,ang)
    t=(V-J)@ub; lat=(V[:,0]*sgn-0.13)
    w=sstep(-0.045,0.06,t)*sstep(0.0,0.05,lat)*sstep(0.90,0.98,V[:,1])   # arms only (the thighs lie on the same axis line further down)
    Vr=(V-J)@R.T+J+(LM[sd+'Shoulder']-J)          # rotate, then move the joint onto the v2 joint
    V=V+(Vr-V)*w[:,None]
    print(sd,'base shoulder',J.round(3),'arm angle deg',np.degrees(ang).round(1))
# ---- compact to the region (drop the arm below mid upper arm: it is replaced by the v2 arm skin)
for sd,sgn in (('left',1),('right',-1)):
    u=(LM[sd+'Elbow']-LM[sd+'Shoulder']); u/=np.linalg.norm(u); dv=V-LM[sd+'Shoulder']; ta=dv@u; ra=np.linalg.norm(dv-np.outer(ta,u),axis=1); keep&=~((ta>0.30)&(ra<0.10)&(V[:,0]*sgn>0.12))
Fq=Q[keep[Q].all(1)]; used=np.unique(Fq); remap=-np.ones(len(V),int); remap[used]=np.arange(len(used)); V=V[used]; Fq=remap[Fq]
F=np.r_[Fq[:,[0,1,2]],Fq[:,[0,2,3]]]
lab=components(len(V),F); big=np.bincount(lab).argmax(); kf=lab[F[:,0]]==big; V,F,u2=compact(V,F,kf); Fq=None
print('region verts',len(V),'faces',len(F))
np.savez('pre.npz',V=V,F=F)
# ---- 4. targets: compression tee (+trim) / shorts, the arm skin below the old sleeve and the leg skin near the weld
def nrm(k): return np.array(M[k]['N']).reshape(-1,3)
armT=bone_mass(TEE,['UpperArm'])
B=P[BODY]; NB=nrm(BODY)
tb=lambda sd: (LM[sd+'Shoulder'],(LM[sd+'Elbow']-LM[sd+'Shoulder'])/np.linalg.norm(LM[sd+'Elbow']-LM[sd+'Shoulder']))
armsk=np.zeros(len(B),bool)
for sd,sgn in (('left',1),('right',-1)):
    A0,u=tb(sd); t=(B-A0)@u; armsk|=(B[:,0]*sgn>0.10)&(t>0.15)&(t<0.24)&(B[:,1]>1.0)
legsk=(B[:,1]>0.55)&(B[:,1]<0.635)
shm=PC[SH][:,1]>0.70
T=np.vstack([PC[TEE],PC[TRIM],PC[SH][shm],B[armsk],B[legsk]]); TN=np.vstack([nrm(TEE),nrm(TRIM),nrm(SH)[shm],NB[armsk],NB[legsk]])
Tw=np.r_[np.ones(len(PC[TEE])+len(PC[TRIM])+shm.sum()),np.full(armsk.sum()+legsk.sum(),3.0)]
tree=cKDTree(T)
n=len(V); E=edges_of(F); A=adjacency(n,E); deg=np.asarray(A.sum(1)).ravel(); L=sp.diags(1/deg)@A-sp.eye(n); LtL=(L.T@L).tocsr()
for it,(lam,dmax) in enumerate([(6000,0.06),(3000,0.04),(1500,0.03),(800,0.02),(800,0.015)]):
    Nv=vnormals(V,F); dd,jj=tree.query(V,k=6)
    best=np.full(n,-1); bres=np.zeros((n,3)); bw=np.zeros(n)
    for k in range(6):
        p=T[jj[:,k]]; nt=TN[jj[:,k]]; c=np.einsum('ij,ij->i',Nv,nt)
        r=np.einsum('ij,ij->i',p-V,nt)[:,None]*nt
        ok=(c>0.55)&(dd[:,k]<dmax)&(bw==0)
        bres[ok]=r[ok]; bw[ok]=(c[ok]-0.55)/0.45*Tw[jj[ok,k]]
    W=sp.diags(bw); Aop=(W+lam*LtL).tocsr()
    Dv=np.zeros_like(V)
    for c in range(3):
        Dv[:,c],info=cg(Aop,bw*bres[:,c],x0=None,rtol=1e-6,maxiter=3000)
    V=V+Dv
    print('iter',it,'matched',int((bw>0).sum()),'mean |res| mm',(np.linalg.norm(bres[bw>0],axis=1).mean()*1000).round(2),'max step mm',(np.linalg.norm(Dv,axis=1).max()*1000).round(1))
np.savez('fit.npz',V=V,F=F)
