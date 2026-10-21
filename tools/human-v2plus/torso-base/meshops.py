import numpy as np, collections
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
def edges_of(F):
    E=np.concatenate([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]); return np.unique(np.sort(E,1),axis=0)
def adjacency(n,E):
    A=sp.coo_matrix((np.ones(len(E)*2),(np.r_[E[:,0],E[:,1]],np.r_[E[:,1],E[:,0]])),shape=(n,n)).tocsr(); A.data[:]=1; return A
def vnormals(V,F):
    fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); n=np.zeros_like(V)
    for c in range(3): np.add.at(n,F[:,c],fn)
    return n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
def boundary_loops_F(F):
    E=np.concatenate([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]); Es=np.sort(E,1)
    uu,c=np.unique(Es,axis=0,return_counts=True); b=set(map(tuple,uu[c==1]))
    nxt={}
    for a,bb in E:
        if (min(a,bb),max(a,bb)) in b: nxt[a]=bb
    loops=[]; seen=set()
    for s in list(nxt):
        if s in seen: continue
        L=[s]; seen.add(s); x=nxt[s]
        while x!=s and x not in seen: L.append(x); seen.add(x); x=nxt[x]
        loops.append(L)
    return loops
def components(n,F):
    from scipy.sparse.csgraph import connected_components
    A=adjacency(n,edges_of(F)); k,lab=connected_components(A,directed=False); return lab
def compact(V,F,keep_faces):
    F=F[keep_faces]; used=np.unique(F); remap=-np.ones(len(V),int); remap[used]=np.arange(len(used)); return V[used],remap[F],used
def taubin(V,F,pinned,iters,lam=0.5,mu=-0.53,w=None):
    E=edges_of(F); A=adjacency(len(V),E); deg=np.asarray(A.sum(1)).ravel()
    free=(~pinned).astype(float)[:,None] if w is None else (w*(~pinned))[:,None]
    for _ in range(iters):
        L=A@V/np.maximum(deg,1)[:,None]-V; V=V+lam*free*L
        L=A@V/np.maximum(deg,1)[:,None]-V; V=V+mu*free*L
    return V
def tangential_relax(V,F,pinned,iters,lam=0.5):
    E=edges_of(F); A=adjacency(len(V),E); deg=np.asarray(A.sum(1)).ravel()
    for _ in range(iters):
        N=vnormals(V,F); L=A@V/np.maximum(deg,1)[:,None]-V; L-=N*np.einsum('ij,ij->i',L,N)[:,None]; V=V+lam*(~pinned)[:,None]*L
    return V
def zipper(PA,PB,start_hint=None):
    """PA, PB: ordered closed loops (n,3),(m,3) oriented the same way. returns triangles over indices A: 0..n-1, B: n..n+m-1"""
    n,m=len(PA),len(PB)
    d=np.linalg.norm(PA[:,None]-PB[None],axis=2); i0,j0=np.unravel_index(np.argmin(d),d.shape)
    tris=[]; i=j=0
    while i<n or j<m:
        a,a1=(i0+i)%n,(i0+i+1)%n; b,b1=(j0+j)%m,(j0+j+1)%m
        if i<n and (j>=m or np.linalg.norm(PA[a1]-PB[b])<np.linalg.norm(PA[a]-PB[b1])):
            tris.append((a,a1,n+b)); i+=1
        else:
            tris.append((a,n+b1,n+b)); j+=1
    return np.array(tris)
def loop_frame(Pl):
    c=Pl.mean(0); _,_,vt=np.linalg.svd(Pl-c); return c,vt[2]
def orient_like(PA,PB):
    """reverse PB if its winding about the common axis differs from PA"""
    c,nrm=loop_frame(PA)
    def wind(Pl):
        X=Pl-c; return np.sign(np.dot(np.cross(X,np.roll(X,-1,0)).sum(0),nrm))
    return wind(PA)==wind(PB)
def bilaplace_fair(V,F,free,ghostV=None,ghostE=None):
    """minimise sum |L x|^2 with free vertices solved, others fixed. optional ghost vertices (fixed) + edges (vertex idx, ghost idx)"""
    n=len(V); E=edges_of(F)
    if ghostV is not None:
        G=len(ghostV); Vall=np.vstack([V,ghostV]); E=np.vstack([E,np.c_[ghostE[:,0],ghostE[:,1]+n]])
    else: Vall=V; G=0
    N=n+G; A=adjacency(N,E); deg=np.asarray(A.sum(1)).ravel()
    L=sp.diags(1/np.maximum(deg,1))@A-sp.eye(N)
    # only rows of L for vertices near the free set matter: use rows of all torso vertices that touch free (and the free ones)
    fr=np.zeros(N,bool); fr[:n]=free
    rows=np.unique(np.r_[np.where(fr)[0],A[fr].indices])
    Lr=L[rows]; Q=(Lr.T@Lr).tocsr()
    fi=np.where(fr)[0]; xi=np.where(~fr)[0]
    Qff=Q[fi][:,fi]; Qfx=Q[fi][:,xi]
    X=Vall.copy(); rhs=-Qfx@Vall[xi]
    sol=spsolve(Qff.tocsc(),rhs)
    X[fi]=sol; return X[:n]
