# smoothing + seam fairing -> fair.npz
from common import *
from meshops import *
d=np.load('zip.npz',allow_pickle=True); V,F,nMC=d['V'],d['F'],int(d['nMC']); seam=d['seam']
n=len(V); pinned=np.zeros(n,bool); pinned[nMC:]=True
# graph distance (rings) from the seam
E=edges_of(F); A=adjacency(n,E)
ring=np.full(n,99); ring[nMC:]=0; front=pinned.copy()
for k in range(1,12):
    nb=(A@front.astype(float))>0; new=nb&(ring==99); ring[new]=k; front=new
V0=V.copy()
V=taubin(V,F,pinned,60)
V=tangential_relax(V,F,pinned,10)
V=taubin(V,F,pinned,20)
# ---------- sculpted anatomical offsets (along the normal), drawn in the same torso chart as the v2plus muscle regions ----------
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def zc_glsl(y): mix=lambda a,b,t:a+(b-a)*t; return mix(mix(0.012,0.026,sstep(0.80,0.90,y)),mix(0.052,0.028,sstep(1.16,1.34,y)),sstep(0.92,1.06,y))
def sculpt(V):
    x,y,z=np.abs(V[:,0]),V[:,1],V[:,2]; s=0.13*np.arctan2(x,z-zc_glsl(y)); sb=0.408-s; off=np.zeros(len(V))
    band=lambda a,b,w: sstep(a-w,a+w,y)*(1-sstep(b-w,b+w,y))
    # pecs: plate with a crisp lower border (rising toward the armpit), soft upper fade into the yoke
    yb=np.interp(s,[0.0,0.016,0.070,0.128,0.150,0.2],[1.205,1.200,1.180,1.215,1.290,1.33])
    pec=sstep(-0.006,0.012,y-yb)*(1-sstep(1.30,1.37,y))*sstep(0.004,0.020,s)*(1-sstep(0.135,0.165,s))
    off+=0.0040*pec
    off-=0.0016*np.exp(-(s/0.009)**2)*band(1.20,1.33,0.02)                     # sternum line
    abs_=band(0.93,1.17,0.02)*(1-sstep(0.075,0.10,s))
    off-=0.0012*np.exp(-(s/0.006)**2)*abs_                                      # linea alba
    for yt in (1.040,1.110): off-=0.0009*np.exp(-((y-yt)/0.005)**2)*abs_*sstep(0.006,0.014,s)
    off-=0.0010*np.exp(-((s-0.090)/0.008)**2)*band(0.95,1.16,0.03)              # rectus edge
    off+=0.0012*sstep(0.0,0.02,s)*(1-sstep(0.06,0.09,s))*band(0.93,1.17,0.02)   # rectus fullness
    # back: spine groove between the erector columns, lower trapezius/lat fullness
    off-=0.0028*np.exp(-(sb/0.011)**2)*band(0.93,1.33,0.03)*(z<0.03)
    off+=0.0014*np.exp(-((sb-0.030)/0.014)**2)*band(0.90,1.14,0.04)*(z<0.03)
    # glutes: a little more cushion
    off+=0.0020*sstep(0.0,0.02,sb)*(1-sstep(0.10,0.15,sb))*band(0.78,0.89,0.03)*(z<0.0)
    return off*(ring>=6)
Nn=vnormals(V,F); V=V+Nn*sculpt(V)[:,None]
V=taubin(V,F,pinned,6)
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
free=(ring>=1)&(ring<=7)
V=fair(V,free)
V=taubin(V,F,pinned|(ring<=3),5)
np.savez('fair.npz',V=V,F=F,nMC=nMC,seam=seam,keepT=d['keepT'],keepB=d['keepB'],ring=ring)
print('verts',len(V),'max move from MC',np.linalg.norm(V-V0,axis=1).max())
