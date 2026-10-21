# Catmull-Clark x2 of the Blender realistic male base cage + multires (level 3 stored as 5x5 corner grids) normal displacement
# sampled at the level-2 points. Output (three.js axes: x right, y up, z forward): male_l2.npz V,F(quads),face-of-origin
import numpy as np, scipy.sparse as sp
d=np.load('male_raw.npz'); V0,cv,po,D=d['V'],d['cv'],d['po'],d['D']; D=D.reshape(-1,5,5,3)
polys=[cv[po[i]:po[i+1]] for i in range(len(po)-1)]
def cc(V,polys):
    nv=len(V); E={}; eid=[]
    for f,p in enumerate(polys):
        for k in range(len(p)):
            a,b=int(p[k]),int(p[(k+1)%len(p)]); key=(min(a,b),max(a,b))
            if key not in E: E[key]=[len(E),[]]
            E[key][1].append(f)
    ne=len(E); FP=np.array([V[p].mean(0) for p in polys])
    EP=np.zeros((ne,3)); bnd=np.zeros(nv,bool); emid=np.zeros((ne,3))
    for (a,b),(i,fs) in E.items():
        emid[i]=(V[a]+V[b])/2
        if len(fs)==2: EP[i]=(V[a]+V[b]+FP[fs[0]]+FP[fs[1]])/4
        else: EP[i]=emid[i]; bnd[a]=bnd[b]=True
    # vertex points
    Fsum=np.zeros((nv,3)); Fn=np.zeros(nv); Rsum=np.zeros((nv,3)); Rn=np.zeros(nv)
    for f,p in enumerate(polys):
        for v in p: Fsum[v]+=FP[f]; Fn[v]+=1
    for (a,b),(i,fs) in E.items():
        Rsum[a]+=emid[i]; Rsum[b]+=emid[i]; Rn[a]+=1; Rn[b]+=1
    n=np.maximum(Fn,1)[:,None]; VP=(Fsum/n+2*Rsum/np.maximum(Rn,1)[:,None]+(Fn[:,None]-3)*V)/n
    # boundary verts (none expected) keep position
    VP[bnd]=V[bnd]
    NV=np.vstack([VP,EP,FP]); quads=[]
    for f,p in enumerate(polys):
        m=len(p)
        for k in range(m):
            a=int(p[k]); b=int(p[(k+1)%m]); c=int(p[(k-1)%m])
            en=E[(min(a,b),max(a,b))][0]; ep=E[(min(a,c),max(a,c))][0]
            quads.append([a,nv+en,nv+ne+f,nv+ep])
    return NV,np.array(quads)
V1,Q1=cc(V0,polys)          # Q1[l] = [v_c, e_next, f, e_prev] for loop l (same order as corner loops)
V2,Q2=cc(V1,list(Q1))       # Q2[4*l+k]: sub-quad at corner k of Q1[l]: [q_k, mid(q_k,q_k+1), center, mid(q_k-1,q_k)]
nl=len(Q1); n1=len(V1)
# grid vertex ids: G[l][a][b] for a,b in {0,1,2} (= level-3 5x5 indices 0,2,4)
G=np.zeros((nl,3,3),int)
sq=Q2.reshape(nl,4,4)
# corner verts of Q1 kept (vertex points of level 2 reuse index of level-1 vertex)
q=Q1
G[:,2,2]=q[:,0]; G[:,0,2]=q[:,1]; G[:,0,0]=q[:,2]; G[:,2,0]=q[:,3]
G[:,1,1]=sq[:,0,2]                   # face point of Q1
G[:,1,2]=sq[:,0,1]                   # mid(v, e_next)
G[:,0,1]=sq[:,1,1]                   # mid(e_next, f)
G[:,1,0]=sq[:,2,1]                   # mid(f, e_prev)
G[:,2,1]=sq[:,3,1]                   # mid(e_prev, v)
Z=D[:,::2,::2,2]                     # normal displacement at the level-2 points
F=Q2
def vnormals_q(V,Qd):
    T=np.r_[Qd[:,[0,1,2]],Qd[:,[0,2,3]]]; fn=np.cross(V[T[:,1]]-V[T[:,0]],V[T[:,2]]-V[T[:,0]]); n=np.zeros_like(V)
    for c in range(3): np.add.at(n,T[:,c],fn)
    return n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
N=vnormals_q(V2,F)
acc=np.zeros(len(V2)); cnt=np.zeros(len(V2)); np.add.at(acc,G.ravel(),Z.ravel()); np.add.at(cnt,G.ravel(),1)
z=acc/np.maximum(cnt,1); print('displaced verts',(cnt>0).sum(),'of',len(V2),'z max',np.abs(z).max())
# consistency of shared samples
spread=np.zeros(len(V2)); np.maximum.at(spread,G.ravel(),np.abs(Z.ravel()-z[G.ravel()])); print('max sample disagreement',spread.max())
V3=V2+N*z[:,None]
conv=lambda X: np.c_[X[:,0],X[:,2],-X[:,1]]
forig=np.repeat(np.arange(len(polys)),[len(p) for p in polys]); forig=np.repeat(forig,4)
np.savez('male_l2.npz',V=conv(V3),Vnod=conv(V2),F=F,forig=forig)
print('L2 verts',len(V3),'quads',len(F))
