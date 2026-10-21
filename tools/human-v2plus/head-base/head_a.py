# head stage A (M10): Blender Human Base Meshes v1.4.1 realistic male head + neck (CC0, male_l2.npz) -> head_fit.npz
#  - similarity: the M8 sketch alignment (skull depth / ear position): V + (0, 0.043, 0.012 - 0.035)
#  - cut on the angle-dependent height of Mesh001's own bottom boundary loop (the v2 neck skin's weld to Coach_Body, which sits
#    just under the tee collar band all round) + a few mm
#  - lower neck: radial displacement onto the v2 neck surface (Mesh001) in the band under / just above the collar (alpha 1), fading
#    to 0 below the jaw, so the base neck runs under the collar exactly where the v2 skin did (no poke-through / z-fighting);
#    displacement field smoothed (bi-Laplacian) so the neck keeps its SCM / trapezius shape above the band
#  - eye holes: each loop capped with concentric rings + bi-Laplacian fairing against the outer rings (closed smooth lid)
import sys, os, numpy as np
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
ZC=0.006
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
d=np.load('male_l2.npz'); V=d['V']+np.array([0,0.043,0.012-0.035]); Q=d['F']; T=np.r_[Q[:,[0,1,2]],Q[:,[0,2,3]]]
# Mesh001 bottom boundary loop (200 verts)
S=P['Mesh001']; F1=np.array(M['Mesh001']['index']).reshape(-1,3); inv,first=weld(S); Fw=inv[F1]
Fw=Fw[(Fw[:,0]!=Fw[:,1])&(Fw[:,1]!=Fw[:,2])&(Fw[:,0]!=Fw[:,2])]
E=np.sort(np.r_[Fw[:,[0,1]],Fw[:,[1,2]],Fw[:,[2,0]]],1); u,c=np.unique(E,axis=0,return_counts=True); b=u[c==1]; Yw=S[first]
low=b[(Yw[b[:,0],1]<1.47)&(Yw[b[:,1],1]<1.47)]
nb={}
for a_,b_ in low: nb.setdefault(a_,[]).append(b_); nb.setdefault(b_,[]).append(a_)
s0=low[0,0]; ringW=[s0]; prev=-1; x=s0
while True:
    nx=[y for y in nb[x] if y!=prev][0]
    if nx==s0: break
    ringW.append(nx); prev,x=x,nx
ringW=np.array(ringW); ring=first[ringW]; PT=S[ring]; assert len(ring)==len(low), (len(ring),len(low))
ang=lambda X: np.arctan2(X[:,2]-ZC,X[:,0])
aR=ang(PT); o=np.argsort(aR)
yR=lambda a: np.interp(a,aR[o],PT[o,1],period=2*np.pi)
# cut the base mesh
CUT=float(os.environ.get('HD_CUT','0.004'))
keepF=(V[T][:,:,1]>yR(ang(V))[T]+CUT).all(1)
# keep the head component only (drop the shoulders' disconnected bits)
V1,F1b,used=compact(V,T,keepF); lab=components(len(V1),F1b); big=np.argmax(np.bincount(lab)); V1,F1b,u2=compact(V1,F1b,lab[F1b[:,0]]==big)
loops=boundary_loops_F(F1b); loops=sorted(loops,key=lambda l:-len(l)); print('base cut loops',[len(l) for l in loops],[V1[l].mean(0).round(3).tolist() for l in loops])
LA=list(loops[0])
# ---- eye openings: the base lids wrap into the (empty) socket; cut the inward-facing socket lining (normal z < EYE_NZ inside the eye
# box, connected to the deepest point) so each eye becomes a hole, capped below with a faired closed lid
EYE_NZ=float(os.environ.get('HD_EYE_NZ','0.35'))
Nv=vnormals(V1,F1b); A0=adjacency(len(V1),edges_of(F1b)).tocsr(); dropF=np.zeros(len(F1b),bool)
for sgn in (1,-1):
    box=(sgn*V1[:,0]>0.012)&(sgn*V1[:,0]<0.06)&(V1[:,1]>1.595)&(V1[:,1]<1.645)&(V1[:,2]>0.085)
    cand=box&(Nv[:,2]<EYE_NZ)
    from scipy.sparse.csgraph import connected_components as _cc
    sub=np.where(cand)[0]; As=A0[sub][:,sub]; nc,lb=_cc(As,directed=False)
    seed=np.argmin(np.where(Nv[sub,2]<-0.3,V1[sub,2],9)); comp=sub[lb==lb[seed]]
    mk=np.zeros(len(V1),bool); mk[comp]=True; dropF|=mk[F1b].any(1); print('eye',sgn,'socket verts',len(comp))
V1,F1b,u3=compact(V1,F1b,~dropF); lab=components(len(V1),F1b); big=np.argmax(np.bincount(lab)); V1,F1b,u4=compact(V1,F1b,lab[F1b[:,0]]==big)
loops=sorted(boundary_loops_F(F1b),key=lambda l:-len(l)); print('loops after eye cut',[len(l) for l in loops],[V1[l].mean(0).round(3).tolist() for l in loops])
LA=list(loops[0]); eyes=[l for l in loops[1:]]
# ---- lower neck onto Mesh001 (radial, per height / angle bins of the v2 neck's outer surface)
YB,NA=0.003,120; ys=np.arange(1.33,1.50,YB)
Sv=S[(S[:,1]<1.50)&(S[:,1]>1.32)]
r_m=np.full((len(ys),NA),np.nan)
aS=ang(Sv); rS=np.hypot(Sv[:,0],Sv[:,2]-ZC); yi=np.clip(((Sv[:,1]-ys[0])/YB).astype(int),0,len(ys)-1); ai=((aS+np.pi)/(2*np.pi)*NA).astype(int)%NA
for i,j,r in zip(yi,ai,rS):
    if not (r_m[i,j]>=r): r_m[i,j]=r
# fill holes along angle then height, smooth
for it in range(60):
    m=np.isnan(r_m)
    if not m.any(): break
    nbv=np.nanmean(np.stack([np.roll(r_m,1,1),np.roll(r_m,-1,1),np.r_[r_m[1:],r_m[-1:]],np.r_[r_m[:1],r_m[:-1]]]),0); r_m[m]=nbv[m]
for it in range(4): r_m=(np.roll(r_m,1,1)+2*r_m+np.roll(r_m,-1,1))/4
for it in range(2): r_m=np.r_[r_m[:1],(r_m[:-2]+2*r_m[1:-1]+r_m[2:])/4,r_m[-1:]]
def rm(X):
    a=ang(X); fy=np.clip((X[:,1]-ys[0])/YB,0,len(ys)-1.001); fa=(a+np.pi)/(2*np.pi)*NA-0.5
    y0=np.floor(fy).astype(int); ty=fy-y0; a0=np.floor(fa).astype(int); ta=fa-a0
    g=lambda yy,aa: r_m[yy,aa%NA]
    return (g(y0,a0)*(1-ta)+g(y0,a0+1)*ta)*(1-ty)+(g(y0+1,a0)*(1-ta)+g(y0+1,a0+1)*ta)*ty
a1=ang(V1); r1=np.hypot(V1[:,0],V1[:,2]-ZC); yb=yR(a1)
# alpha: 1 up to 2 cm above the boundary (the collar zone), 0 at 1.478 (below the chin 1.497 / the jaw angle)
Y1=float(os.environ.get('HD_Y1','1.478'))
alpha=1-sstep(np.minimum(yb+0.02,Y1-0.01),Y1,V1[:,1])
alpha[V1[:,1]>Y1]=0
D=np.zeros_like(V1); rad=np.c_[np.cos(a1),np.zeros(len(a1)),np.sin(a1)]
D=rad*((rm(V1)-r1)*alpha)[:,None]
# low-frequency displacement: bi-Laplacian solve with the alpha>0.98 band fixed to its radial target and alpha==0 fixed to 0
n=len(V1); A1=adjacency(n,edges_of(F1b)); deg=np.asarray(A1.sum(1)).ravel(); L1=(sp.diags(1/deg)@A1-sp.eye(n)).tocsr()
fx=(alpha>0.98)|(alpha<=0)|(V1[:,1]>Y1); fi=np.where(~fx)[0]; xi=np.where(fx)[0]; Qm=(L1.T@L1).tocsr()
Dv=D.copy(); rhs=-Qm[fi][:,xi]@Dv[xi]; Qff=Qm[fi][:,fi].tocsc()
for c_ in range(3): Dv[fi,c_]=spsolve(Qff,rhs[:,c_])
print('neck radial fit: band move mm p50/max',np.percentile(np.linalg.norm(Dv[alpha>0.98],axis=1)*1000,[50,100]).round(1),'free move max mm',(np.linalg.norm(Dv[fi],axis=1).max()*1000).round(1))
V1=V1+Dv
# ---- eye caps
capV=[]; capF=[]; nV=len(V1); Fcap_all=[]
K=int(os.environ.get('HD_EYE_RINGS','5'))
for l in eyes:
    l=np.array(l); m_=len(l); c=V1[l].mean(0); ids=[l]
    newV=[]; cur=nV+sum(len(x) for x in capV)
    for k in range(1,K+1):
        t=k/(K+1); newV.append(V1[l]*(1-t)+c*t); ids.append(cur+np.arange(m_)); cur+=m_
    newV.append(c[None]); cid=cur; cur+=1
    Fl=[]
    for k in range(K):
        A_,B_=ids[k],ids[k+1]
        for i in range(m_):
            j=(i+1)%m_; Fl+=[(A_[i],A_[j],B_[j]),(A_[i],B_[j],B_[i])]
    for i in range(m_): j=(i+1)%m_; Fl.append((ids[K][i],ids[K][j],cid))
    capV.append(np.vstack(newV)); Fcap_all.append(np.array(Fl))
Vc=np.vstack([V1]+capV); Fc=np.vstack([F1b]+Fcap_all)
# orientation of caps: agree with the neighbouring face across the loop edge (loop order from boundary_loops_F follows the faces)
Nf=np.cross(Vc[Fc[:,1]]-Vc[Fc[:,0]],Vc[Fc[:,2]]-Vc[Fc[:,0]])
off=len(F1b)
for k,l in enumerate(eyes):
    nf=len(Fcap_all[k]); sl=slice(off,off+nf); cn=Nf[sl].sum(0)
    # outward ~ +z (eyes look forward)
    if cn[2]<0: Fc[sl]=Fc[sl][:,[0,2,1]]
    off+=nf
free=np.zeros(len(Vc),bool); free[len(V1):]=True
# soften the lid margins too: the first EYE_RIM rings of lid around each loop are faired with the cap (C1 into the face beyond)
EYE_RIM=int(os.environ.get('HD_EYE_RIM','2')); Ac=adjacency(len(Vc),edges_of(Fc)).tocsr(); fr=free.copy()
for k in range(EYE_RIM): fr=fr|((Ac@fr.astype(float))>0)
Vc=bilaplace_fair(Vc,Fc,fr)
# eyeball bulge: closed lids over a round eyeball sit proud of the rim plane; dome h*(1-(1-t)^2) forward (t = 0 rim .. 1 centre)
EYE_H=float(os.environ.get('HD_EYE_H','0.0025')); cur=len(V1)
for k,l in enumerate(eyes):
    m_=len(l)
    for r in range(1,K+1):
        t=r/(K+1); Vc[cur:cur+m_,2]+=EYE_H*(1-(1-t)**2); cur+=m_
    Vc[cur,2]+=EYE_H; cur+=1
fr2=fr&~free; Vc=bilaplace_fair(Vc,Fc,fr2)   # re-blend the rim rings onto the domed cap
# slight convexity check (lid should not sink into the socket): report the cap centre depth vs the loop's plane
for k,l in enumerate(eyes):
    c0=V1[l].mean(0); cc=Vc[len(V1)+sum(len(x) for x in capV[:k])+len(capV[k])-1]; print('eye cap',len(l),'centre forward of loop centroid mm',((cc-c0)[2]*1000).round(1))
bl=boundary_loops_F(Fc); print('after caps boundary loops',[len(l) for l in bl])
np.savez('head_fit.npz',V=Vc,F=Fc,LA=np.array(LA),ring=ring,PT=PT,nBase=len(V1))
print('head fit verts',len(Vc),'faces',len(Fc),'ring',len(ring),'loop',len(LA))
