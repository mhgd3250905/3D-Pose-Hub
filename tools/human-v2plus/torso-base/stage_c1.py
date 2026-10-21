# stage C1: C1 seam fairing (bi-Laplacian with the neighbouring rings of the existing meshes as fixed ghosts) on the first
# rings next to each weld only; the rest of the base-mesh surface is untouched.  zip.npz -> fair.npz
import os
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
d=np.load('zip.npz',allow_pickle=True); V,F,nMC=d['V'],d['F'],int(d['nMC']); seam=d['seam']
n=len(V); pinned=np.zeros(n,bool); pinned[nMC:]=True
E=edges_of(F); A=adjacency(n,E)
ring=np.full(n,99); ring[nMC:]=0; front=pinned.copy()
for k in range(1,16):
    nb=(A@front.astype(float))>0; new=nb&(ring==99); ring[new]=k; front=new
V0=V.copy()
# spread the snapped loop vertices along the surface (they sit on the ring polyline after the snap)
#V=tangential_relax(V,F,pinned|(ring>3),8)
# seam fairing with ghost rings from the existing meshes
from scipy.spatial import cKDTree
ghostV=[]; ghostE=[]
for mesh in (TEE,BODY):
    Fm=np.array(M[mesh]['index']).reshape(-1,3); inv,first=weld(P[mesh])
    keep=d['keepT'] if mesh==TEE else d['keepB']; Fk=inv[Fm[keep]]; Em=edges_of(Fk); Am=adjacency(inv.max()+1,Em)
    ids=[k for k,s in enumerate(seam) if s[1]==mesh]
    if not ids: continue
    loopW=inv[np.array([int(seam[k][2]) for k in ids])]
    on=np.zeros(inv.max()+1,bool); on[loopW]=True
    r1=((Am@on.astype(float))>0)&~on
    r2=((Am@r1.astype(float))>0)&~on&~r1
    Pw=np.zeros((inv.max()+1,3)); Pw[inv]=P[mesh]
    gidx={}
    for w in np.where(r1|r2)[0]: gidx[w]=len(ghostV); ghostV.append(Pw[w])
    # edges: torso seam vertex (nMC+k) <-> ghost ring1 neighbours; ring1 <-> ring2 handled by connecting ring2 to the seam vertex's ring1 neighbours (graph only needs adjacency)
    Ecoo=Am.tocoo()
    loopmap={int(loopW[j]):nMC+ids[j] for j in range(len(ids))}
    for a,b in zip(Ecoo.row,Ecoo.col):
        if a in loopmap and b in gidx: ghostE.append((loopmap[a],gidx[b]))
    # ghost-ghost edges are needed so ring1 Laplacians are defined: encode them as torso-index pairs later
    gg=[(gidx[a],gidx[b]) for a,b in zip(Ecoo.row,Ecoo.col) if a in gidx and b in gidx and a<b]
    ghostE+= [(-1-a,-1-b) for a,b in gg]
ghostV=np.array(ghostV)
gE=[(a,b) for a,b in ghostE if a>=0]; ggE=[(-1-a,-1-b) for a,b in ghostE if a<0]
def fair(V,free):
    n=len(V); Vall=np.vstack([V,ghostV]); Ee=np.vstack([edges_of(F),np.array(gE)+[0,n],np.array(ggE)+n])
    N=len(Vall); A=adjacency(N,Ee); deg=np.asarray(A.sum(1)).ravel()
    L=sp.diags(1/np.maximum(deg,1))@A-sp.eye(N)
    fr=np.zeros(N,bool); fr[:n]=free
    near=fr|((A@fr.astype(float))>0)
    rows=np.where(near)[0]; Lr=L[rows]; Q=(Lr.T@Lr).tocsr()
    fi=np.where(fr)[0]; xi=np.where(~fr)[0]
    sol=spsolve(Q[fi][:,fi].tocsc(),-Q[fi][:,xi]@Vall[xi]); X=Vall.copy(); X[fi]=sol; return X[:n]
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
# ---------- below the old sleeve cuff the arm tube follows the v2 arm skin (field = skin ring fit); mark that band (weights) ----------
NR=int(os.environ.get('T_FAIR','6'))
free=(ring>=1)&(ring<=NR)
V=fair(V,free)
np.savez('fair.npz',V=V,F=F,nMC=nMC,seam=seam,keepT=d['keepT'],keepB=d['keepB'],ring=ring)
print('verts',len(V),'fair rings',NR,'max move mm',(np.linalg.norm(V-V0,axis=1).max()*1000).round(1))
