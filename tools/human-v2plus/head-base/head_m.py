# head stage M (M10b): mannequin face — head_fit.npz -> head_fit.npz (in place; skipped with HD_MANNEQUIN=0)
#  A shop-mannequin face: skull, jaw, chin, cheekbones, neck and weld unchanged; lips, eyelids / eye shapes, nostrils and ear folds
#  removed. Detail split: S = screened bi-Laplacian low-pass of the whole piece (no shrink, keeps the large forms: cheek / jaw / brow mass,
#  shallow eye recess), D = V - S (the fine detail). V' = S + k * D with a smooth per-region detail factor k:
#    k = 1 skull / neck / weld (y < 1.505 hard 1), K_FACE over the front of the face, K_EYE around the eyes, K_MOUTH over the lips,
#    K_NOSE on the nose (soft low ridge), K_EAR on the ears (smooth low-relief blob); all masks are smoothstep / ellipsoid falloffs
#  then a masked Taubin clean-up pass (same falloff) for the transition. Before that, the mouth slit / nostril cavities and the M10
#  eye lid patches are cut and re-capped (faired), so no cavity or lid crease survives the smoothing.
import os, numpy as np
from meshops import *
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
if os.environ.get('HD_MANNEQUIN','1')=='0': print('mannequin face: off'); raise SystemExit
h=dict(np.load('head_fit.npz')); V=h['V'].astype(float); F=h['F']; n=len(V)
f=lambda k,d: float(os.environ.get(k,d))
T_LOW=f('HD_M_T','15000'); K_FACE=f('HD_M_KFACE','0.25'); K_EYE=f('HD_M_KEYE','0.0'); K_MOUTH=f('HD_M_KMOUTH','0.06')
K_NOSE=f('HD_M_KNOSE','0.25'); K_EAR=f('HD_M_KEAR','0.15'); CLEAN=int(f('HD_M_CLEAN','20'))
# ---- 1. close the mouth slit and the nostrils: vertices in the mouth / nostril boxes hidden from the front (a +z ray hits the face
# further than 1 mm away, incident faces excluded) are the cavity lining (mouth bag, nostril tubes); their faces are cut and each hole
# capped with concentric rings + bi-Laplacian fairing (cap + CAP_RIM rings of surrounding lip / nostril rim free), like the M10 eye caps
LA=np.array(h['LA'])
def ray_hits(O,Vt,Ft):   # +z rays from O against triangles -> nearest t (inf if none); Moller-Trumbore, chunked
    v0,e1,e2=Vt[Ft[:,0]],Vt[Ft[:,1]]-Vt[Ft[:,0]],Vt[Ft[:,2]]-Vt[Ft[:,0]]; d=np.array([0,0,1.0]); best=np.full(len(O),np.inf)
    pv=np.cross(d,e2); det=np.einsum('ij,ij->i',e1,pv); ok=np.abs(det)>1e-14; v0,e1,e2,pv,det=v0[ok],e1[ok],e2[ok],pv[ok],det[ok]
    for i0 in range(0,len(O),256):
        o=O[i0:i0+256,None,:]; tv=o-v0[None]; u=np.einsum('ijk,jk->ij',tv,pv)/det; qv=np.cross(tv,e1[None]); w=qv[...,2]/det
        t=np.einsum('ijk,jk->ij',qv,e2)/det; hit=(u>=0)&(w>=0)&(u+w<=1)&(t>0.001); best[i0:i0+256]=np.where(hit,t,np.inf).min(1)
    return best
CAV=[((-0.032,1.528,0.085),(0.032,1.562,0.15)),((-0.026,1.562,0.095),(0.026,1.60,0.15))]
drop=np.zeros(len(F),bool)
for lo_,hi_ in CAV:
    inb=np.all((V>np.array(lo_))&(V<np.array(hi_)),1); fb=inb[F].any(1); ci=np.where(inb)[0]
    occ=ray_hits(V[ci],V,F[fb])<np.inf; oc=np.zeros(n,bool); oc[ci[occ]]=True; drop|=oc[F].any(1); print('cavity box',lo_[1],'hidden verts',int(occ.sum()))
# eyes: the whole M10 lid + cap patch (ellipsoid core; its slivers made the upper-lid crease and the folded edges) is cut and re-capped
EYC=[(0.034,1.62,0.105),(-0.034,1.62,0.105)]; EYR=np.array([float(v) for v in os.environ.get('HD_M_EYECUT','0.022,0.014,0.03').split(',')])
for c_ in EYC:
    ine=np.sqrt((((V-np.array(c_))/EYR)**2).sum(1))<1; drop|=ine[F].any(1); print('eye cut verts',int(ine.sum()))
keepF=~drop; Fk=F[keepF]; used=np.unique(Fk); rmp=-np.ones(n,int); rmp[used]=np.arange(len(used)); V=V[used]; F=rmp[Fk]
lab=components(len(V),F); big=np.argmax(np.bincount(lab)); kf=lab[F[:,0]]==big; Fk=F[kf]; used2=np.unique(Fk); rmp2=-np.ones(len(V),int); rmp2[used2]=np.arange(len(used2))
V=V[used2]; F=rmp2[Fk]; LA=rmp2[rmp[LA]]; assert (LA>=0).all(); n=len(V)
loops=[np.array(l) for l in boundary_loops_F(F)]; setLA=set(LA.tolist()); holes=[l for l in loops if not set(l.tolist())&setLA]
print('holes to cap',[len(l) for l in holes])
K=4; capV=[]; capF=[]; cur=n
for l in holes:
    m_=len(l); c=V[l].mean(0); ids=[l]
    for kk in range(1,K+1): capV.append(V[l]*(1-kk/(K+1))+c*kk/(K+1)); ids.append(cur+np.arange(m_)); cur+=m_
    capV.append(c[None]); cid=cur; cur+=1
    for kk in range(K):
        A_,B_=ids[kk],ids[kk+1]
        for i in range(m_): j=(i+1)%m_; capF+=[(A_[i],B_[j],A_[j]),(A_[i],B_[i],B_[j])]   # reversed vs the loop's own face winding
    for i in range(m_): j=(i+1)%m_; capF.append((ids[K][i],cid,ids[K][j]))
if holes:
    V=np.vstack([V]+capV); F=np.vstack([F,np.array(capF)]); free=np.zeros(len(V),bool); free[n:]=True; Ac=adjacency(len(V),edges_of(F)).tocsr()
    for kk in range(int(os.environ.get('HD_M_CAPRIM','3'))): free=free|((Ac@free.astype(float))>0)
    V=bilaplace_fair(V,F,free); n=len(V)
h['F']=F; h['LA']=LA
x,y,z=V[:,0],V[:,1],V[:,2]; ax=np.abs(x)
def ell(c,r):   # 1 inside the ellipsoid, smooth falloff to 0 at 1.6x radius
    d=np.sqrt((((V-np.array(c))/np.array(r))**2).sum(1)); return 1-sstep(1.0,1.6,d)
face=sstep(0.055,0.08,z)*sstep(1.505,1.525,y)*(1-sstep(1.655,1.69,y))*(1-sstep(0.055,0.075,ax))
eye=np.maximum(ell((0.034,1.62,0.105),(0.024,0.016,0.03)),ell((-0.034,1.62,0.105),(0.024,0.016,0.03)))
mouth=ell((0,1.543,0.122),(0.03,0.014,0.025))
nose=ell((0,1.588,0.128),(0.02,0.03,0.025))
ear=np.maximum(ell((0.081,1.627,0.016),(0.022,0.065,0.048)),ell((-0.081,1.627,0.016),(0.022,0.065,0.048)))
k=np.ones(n)
k=k*(1-face)+K_FACE*face
for m_,kk in ((nose,K_NOSE),(eye,K_EYE),(mouth,K_MOUTH)): k=k*(1-m_)+kk*m_
k=k*(1-ear)+K_EAR*ear
k[y<1.505]=1.0
pin=np.zeros(n,bool)
# low-pass: S = argmin |S-V|^2 + T |L S|^2 (screened bi-Laplacian, uniform L): gain 1/(1+T k^2), no shrink, no blow-up
import scipy.sparse as sp
from scipy.sparse.linalg import factorized
A=adjacency(n,edges_of(F)); dg=np.asarray(A.sum(1)).ravel(); L=(sp.diags(1/dg)@A-sp.eye(n)).tocsr()
solve=factorized((sp.eye(n)+T_LOW*(L.T@L)).tocsc()); S=np.stack([solve(V[:,c]) for c in range(3)],1)
V2=S+k[:,None]*(V-S)
wcl=np.clip(1-k,0,1); wcl[y<1.505]=0
V2=taubin(V2,F,pin,CLEAN,w=wcl)
# mouth + eye cores: bi-Laplacian fairing (membrane C1 to the surrounding low-passed face) -> one smooth gently convex mouth plane and a
# shallow fully smooth eye recess (no seam left from the cut / caps)
FAIR_T=f('HD_M_FAIRMASK','0.5'); fr_=((mouth>FAIR_T)|(eye>FAIR_T))&(y>=1.505); V2=bilaplace_fair(V2,F,fr_); print('faired core verts',int(fr_.sum()))
mv=np.linalg.norm(V2-V,axis=1)*1000
print('mannequin face: low-pass T',T_LOW,'| moved verts >0.1mm',int((mv>0.1).sum()),'max mm',mv.max().round(1),'| y<1.505 max move mm',mv[y<1.505].max().round(3))
for nm,m_ in (('nose',nose),('mouth',mouth),('eye',eye),('ear',ear)):
    s=m_>0.9; print(f'  {nm}: k {np.round(k[s].mean(),2)} mean/max move mm',mv[s].mean().round(1),mv[s].max().round(1))
V0=h['V']; m0=(np.abs(V0[:,0])<0.003)&(V0[:,2]>0.05); m=(ax<0.003)&(z>0.05); prof=[]
for yy in np.arange(1.50,1.66,0.01):
    s=m&(np.abs(y-yy)<0.003); s0=m0&(np.abs(V0[:,1]-yy)<0.003)
    if s.any() and s0.any(): prof.append((round(float(yy),2),round(float(V0[s0,2].max())*1000),round(float(V2[s,2].max())*1000)))
print('  midline z mm (y, before, after):',prof)
h['V']=V2; np.savez('head_fit.npz',**h)
