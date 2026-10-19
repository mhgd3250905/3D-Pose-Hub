# closest-point-on-surface transfer: for every query point find the closest point on a triangle soup (normal-compatible
# triangles preferred) and return the triangle id + barycentric coordinates, so per-vertex source attributes (skin weights)
# can be interpolated linearly over the source triangle (no nearest-vertex streaks).
import numpy as np
from scipy.spatial import cKDTree
def closest_on_tris(P, A, B, C):
    """vectorised closest point on triangles (Ericson, Real-Time Collision Detection 5.1.5). returns (Q, bary(u,v,w))"""
    ab=B-A; ac=C-A; ap=P-A
    d1=np.einsum('ij,ij->i',ab,ap); d2=np.einsum('ij,ij->i',ac,ap)
    bp=P-B; d3=np.einsum('ij,ij->i',ab,bp); d4=np.einsum('ij,ij->i',ac,bp)
    cp=P-C; d5=np.einsum('ij,ij->i',ab,cp); d6=np.einsum('ij,ij->i',ac,cp)
    n=len(P); bc=np.zeros((n,3)); done=np.zeros(n,bool)
    def put(m,u,v,w):
        m=m&~done; bc[m,0]=u[m] if np.ndim(u) else u; bc[m,1]=v[m] if np.ndim(v) else v; bc[m,2]=w[m] if np.ndim(w) else w; done[m]=True
    one=np.ones(n); zero=np.zeros(n)
    put((d1<=0)&(d2<=0),one,zero,zero)
    put((d3>=0)&(d4<=d3),zero,one,zero)
    vc=d1*d4-d3*d2
    with np.errstate(all='ignore'): v=d1/(d1-d3)
    put((vc<=0)&(d1>=0)&(d3<=0),1-v,v,zero)
    put((d6>=0)&(d5<=d6),zero,zero,one)
    vb=d5*d2-d1*d6
    with np.errstate(all='ignore'): w=d2/(d2-d6)
    put((vb<=0)&(d2>=0)&(d6<=0),1-w,zero,w)
    va=d3*d6-d5*d4
    with np.errstate(all='ignore'): w2=(d4-d3)/((d4-d3)+(d5-d6))
    put((va<=0)&((d4-d3)>=0)&((d5-d6)>=0),zero,1-w2,w2)
    with np.errstate(all='ignore'):
        den=1/(va+vb+vc); vv=vb*den; ww=vc*den
    put(np.ones(n,bool),1-vv-ww,vv,ww)
    bc=np.nan_to_num(bc); Q=bc[:,0:1]*A+bc[:,1:2]*B+bc[:,2:3]*C
    return Q,bc
def transfer(Pq, Nq, S, F, k=10, mincos=0.3, chunk=4000):
    """Pq,Nq: query points/normals. S,F: source vertices/triangles. returns face id, bary (n,3), distance"""
    fn=np.cross(S[F[:,1]]-S[F[:,0]],S[F[:,2]]-S[F[:,0]]); good=np.linalg.norm(fn,axis=1)>1e-10; fn/=np.maximum(np.linalg.norm(fn,axis=1,keepdims=True),1e-12)
    # vertex -> incident faces (padded)
    inc=[[] for _ in range(len(S))]
    for f,(a,b,c) in enumerate(F):
        if not good[f]: continue
        inc[a].append(f); inc[b].append(f); inc[c].append(f)
    mx=max(len(x) for x in inc); IF=np.full((len(S),mx),-1)
    for i,x in enumerate(inc): IF[i,:len(x)]=x
    used=np.where(IF[:,0]>=0)[0]; tree=cKDTree(S[used]); IF=IF[used]; n=len(Pq); fid=np.zeros(n,int); BC=np.zeros((n,3)); dist=np.zeros(n)
    for s in range(0,n,chunk):
        P=Pq[s:s+chunk]; Nn=Nq[s:s+chunk]; m=len(P)
        _,jj=tree.query(P,k=k); cand=IF[jj].reshape(m,-1)
        best=np.full(m,np.inf); bf=np.zeros(m,int); bb=np.zeros((m,3)); bestA=np.full(m,np.inf); bfA=np.zeros(m,int); bbA=np.zeros((m,3))
        for c in range(cand.shape[1]):
            f=cand[:,c]; ok=f>=0; ff=np.where(ok,f,0)
            Q,bc=closest_on_tris(P,S[F[ff,0]],S[F[ff,1]],S[F[ff,2]]); d=np.linalg.norm(Q-P,axis=1); d[~ok|~np.isfinite(d)]=np.inf
            comp=np.einsum('ij,ij->i',fn[ff],Nn)>mincos
            u=(d<bestA); bestA[u]=d[u]; bfA[u]=ff[u]; bbA[u]=bc[u]
            u=comp&(d<best); best[u]=d[u]; bf[u]=ff[u]; bb[u]=bc[u]
        none=~np.isfinite(best); best[none]=bestA[none]; bf[none]=bfA[none]; bb[none]=bbA[none]
        fid[s:s+m]=bf; BC[s:s+m]=bb; dist[s:s+m]=best
    return fid,BC,dist
