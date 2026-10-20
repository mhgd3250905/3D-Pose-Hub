# limbs stage C: seam fairing, skin weights, normals, export (limbs_zip.npz -> models/training-human-v2plus-limbs-base.json)
#  - fairing: bi-Laplacian on the first rings next to each weld (Coach_Body ring neighbours as fixed ghosts), like the torso's C1
#  - weights: closest-point barycentric transfer of the v2 arm / leg skin's own weights (the Coach_Body segments being replaced),
#    seam vertices = exact weights of the welded vertex (the runtime reads them live)
#  - normals: computed; seams = skinned rest normals of the welded vertex, first 3 rings blended toward them
import sys, base64, json as _json
from common import *
from meshops import *
from scipy.spatial import cKDTree
from surfxfer import transfer
d=np.load('limbs_zip.npz',allow_pickle=True); V,F,nMC,seam,segF,keepB0=d['V'],d['F'],int(d['nMC']),d['seam'],d['segF'],d['keepB0']
n=len(V); B=P[BODY]; Fb=np.array(M[BODY]['index']).reshape(-1,3); invB,firstB=weld(B)
pinned=np.zeros(n,bool); pinned[nMC:]=True
E=edges_of(F); A=adjacency(n,E).tocsr()
ring=np.full(n,99); ring[nMC:]=0; front=pinned.copy()
for k in range(1,16):
    nb=(A@front.astype(float))>0; new=nb&(ring==99); ring[new]=k; front=new
# ghost rings: Coach_Body vertices adjacent to the seam ring on the kept (hand / foot / torso-side) part
keepSide=keepB0&~segF                         # Coach_Body faces still drawn in limbs mode
Fk=invB[Fb[keepSide]]; Ak=adjacency(invB.max()+1,edges_of(Fk))
Pw=np.zeros((invB.max()+1,3)); Pw[invB]=B
seamW=invB[np.array([int(s[2]) for s in seam])]; on=np.zeros(invB.max()+1,bool); on[seamW]=True
r1=((Ak@on.astype(float))>0)&~on
gid={g:i for i,g in enumerate(np.where(r1)[0])}; ghostV=Pw[np.where(r1)[0]]; ge=[]
w2l={int(w):nMC+k for k,w in enumerate(seamW)}
Ak=Ak.tocsr()
for w,li in w2l.items():
    for j in Ak.indices[Ak.indptr[w]:Ak.indptr[w+1]]:
        if j in gid: ge.append((li,gid[j]))
# top seams (arm / leg rings): the base torso is the other side; its first ring of vertices are ghosts too (without them the
# fairing extrapolates past the leg ring and folds the zipper strip)
tf=np.load('final.npz'); TV,TF,tn=tf['V'],tf['F'],int(tf['nMC']); tseam=np.load('zip.npz',allow_pickle=True)['seam']
At=adjacency(len(TV),edges_of(TF)).tocsr(); v2l={int(s[2]):nMC+k for k,s in enumerate(seam)}; gl=list(ghostV); tg={}
for k,s in enumerate(tseam):
    if s[1]!=BODY or int(s[2]) not in v2l: continue
    ti=tn+k
    for j in At.indices[At.indptr[ti]:At.indptr[ti+1]]:
        if j>=tn: continue
        if j not in tg: tg[j]=len(gl); gl.append(TV[j])
        ge.append((v2l[int(s[2])],tg[j]))
ghostV=np.array(gl); ge=np.array(ge); print('ghosts',len(ghostV),'from torso',len(tg))
free=(ring>=1)&(ring<=int(os.environ.get('L_FAIR','5')))
V0=V.copy(); V=bilaplace_fair(V,F,free,ghostV,ge)
print('fair rings',free.sum(),'max move mm',(np.linalg.norm(V-V0,axis=1).max()*1000).round(1))
BONES=list(rest['bones'].keys()); bi={b:i for i,b in enumerate(BONES)}; NBn=len(BONES)
def dense_w(k):
    J=arr(k,'J',4).astype(int); W=arr(k,'W',4); names=M[k]['bones']; D=np.zeros((len(J),NBn))
    for c in range(4): np.add.at(D,(np.arange(len(J)),[bi[names[j]] for j in J[:,c]]),W[:,c])
    return D
Db=dense_w(BODY)
# source: the replaced segments plus one face ring of their neighbours on each side (so the ends interpolate toward the seams)
srcF=segF.copy()
vs=np.zeros(invB.max()+1,bool); vs[invB[Fb[segF]].ravel()]=True; srcF|=vs[invB[Fb]].any(1)&keepB0
Nv=vnormals(V,F)
fid,bc,dist=transfer(V,Nv,B,Fb[srcF],k=40,mincos=0.3)
W=np.einsum('ik,ikb->ib',bc,Db[Fb[srcF][fid]])
for k,s in enumerate(seam): W[nMC+k]=Db[int(s[2])]
# light smoothing of the transferred field (closest-triangle jumps), seams fixed
fr=np.ones(n,bool); fr[nMC:]=False; deg=np.asarray(A.sum(1)).ravel()
for it in range(int(os.environ.get('L_SMOOTH','10'))):
    Wn=A@W/np.maximum(deg,1)[:,None]; W[fr]=0.5*W[fr]+0.5*Wn[fr]
print('weights: source dist mm p50/p99/max',np.percentile(dist*1000,[50,99,100]).round(1))
order=np.argsort(-W,1)[:,:4]; top=np.take_along_axis(W,order,1); top/=top.sum(1,keepdims=True)
q=np.round(top*255).astype(int); q[:,0]+=255-q.sum(1)
def restN(k):
    Pk=P[k]; Fk_=np.array(M[k]['index']).reshape(-1,3); inv,first=weld(Pk); return vnormals(Pk[first],inv[Fk_])[inv]
NRB=restN(BODY); N=vnormals(V,F)
for k,s in enumerate(seam): N[nMC+k]=NRB[int(s[2])]
for r_,a in ((1,0.6),(2,0.3),(3,0.12)):
    sel=np.where(ring==r_)[0]
    for i in sel:
        js=A.indices[A.indptr[i]:A.indptr[i+1]]; js=js[ring[js]==r_-1]
        if len(js): m=N[js].mean(0); N[i]=(1-a)*N[i]+a*m/np.linalg.norm(m)
N/=np.linalg.norm(N,axis=1,keepdims=True)
# hand vertices whose weights v2plus rewrites must not be on a seam (the runtime reads seam weights at load time)
hw=_json.load(open(os.path.join(REPO,'drill-anim/models/training-human-v2plus-hands.json')))['weights']
hset=set(hw['left']['idx'])|set(hw['right']['idx']); bad=[int(s[2]) for s in seam if int(s[2]) in hset]
print('seam vertices with v2plus hand weights',len(bad))
b64=lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
lo=V.min(0)-0.001; sc=(V.max(0)+0.001-lo)/65535; Pq=np.round((V-lo)/sc).astype(np.uint16); assert n<65536
tj=_json.load(open(os.path.join(REPO,'drill-anim/models/training-human-v2plus-torso-base.json')))
hide=sorted(set(tj['hideFaces'][BODY])|set(np.where(segF)[0].tolist()))
out={'version':1,'n':int(n),'bones':BONES,
 'pos':{'lo':lo.round(6).tolist(),'scale':sc.tolist(),'u16':b64(Pq)},
 'nrm':{'i8':b64(np.round(N*127).astype(np.int8))},
 'index':{'u16':b64(F.astype(np.uint16))},
 'joints':{'u8':b64(order.astype(np.uint8))},'weights':{'u8':b64(q.astype(np.uint8))},
 'seam':{'first':int(nMC),'mesh':[str(s[1]) for s in seam],'vid':[int(s[2]) for s in seam],'ring':[str(s[0]) for s in seam]},
 'keepFaces':{},'hideFaces':{BODY:hide},'hideMeshes':[],'requires':'torso',
 'source':'Blender Human Base Meshes v1.4.1 (realistic male body, CC0, blender.org): arms + legs','paint':{'waistY':0.935}}
_json.dump(out,open(sys.argv[1],'w'),separators=(',',':'))
np.savez('limbs_final.npz',V=V,F=F,N=N,J=order,Wq=q,nMC=nMC)
print('verts',n,'faces',len(F),'hidden Coach_Body faces',len(hide),'json bytes',os.path.getsize(sys.argv[1]))
