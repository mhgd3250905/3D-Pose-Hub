# head stage B (M10): head_fit.npz -> drill-anim/models/training-human-v2plus-head-base.json (opt-in head:'base', needs torso:'base')
#  - weld: the cut loop is snapped (arc-length, GAP above) onto Mesh001's bottom boundary loop (the v2 neck skin's own edge, under
#    the tee collar band), smooth bi-Laplacian field over 12 rings, zipper to the exact ring vertices (seam = Mesh001 vids: live
#    position / weights at runtime), faired 4 rings
#  - weights: the training-collar neck rule (the same field the live Mesh001 neck skin gets: torso -> neck -> head with height,
#    scapula share by |x|), with a head mask (jaw line / occiput: face, chin and skull 100 % head), 10 smoothing passes; seams = live
#  - normals: own (area-weighted) on the seam ring too (ownNormals; the ring is under the collar band)
#  - hides Toon_Mannequin_Head_v5 and Mesh001 (whole v2 neck skin + tucked old head) via draw range
import sys, base64, json as _json
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
GAP=float(os.environ.get('HD_GAP','0.003')); ZC=0.006
def radial(X): r=X-np.array([0,0,ZC]); r[:,1]=0; return r
h=np.load('head_fit.npz'); V1,F1,LA,ring,PT=h['V'],h['F'],list(h['LA']),h['ring'],h['PT']; n=len(V1)
ang=lambda X: np.arctan2(X[:,2]-ZC,X[:,0])
wind=lambda a: np.sign(np.sum((np.diff(np.r_[a,a[:1]])+np.pi)%(2*np.pi)-np.pi))
if wind(ang(V1[LA]))!=wind(ang(PT)): ring=ring[::-1]; PT=PT[::-1]
aT=ang(PT); aA=ang(V1[LA])
PL=V1[LA]; sl=np.r_[0,np.cumsum(np.linalg.norm(np.diff(np.r_[PL,PL[:1]],axis=0),axis=1))]; sl=sl[:-1]/sl[-1]
sr=np.r_[0,np.cumsum(np.linalg.norm(np.diff(np.r_[PT,PT[:1]],axis=0),axis=1))]; sr=sr/sr[-1]
# anchor: ring point at loop vertex 0's angle
j=int(np.argmin(np.abs(((aT-aA[0])+np.pi)%(2*np.pi)-np.pi))); s0=sr[j]
PTc=np.r_[PT,PT[:1]]; ss=(sl+s0)%1.0
tgt=np.stack([np.interp(ss,sr,PTc[:,c]) for c in range(3)],1)+GAP*np.array([0,1.0,0])
if os.environ.get('HD_SNAP','angle')=='angle':
    # by polar angle about the neck axis (the cut loop is a staircase on the dense base mesh, so its arc length does not follow the ring's);
    # loop angles made monotone first (cumulative max along the winding) so the zipper fans cannot fold
    aa=np.unwrap(aA); sgn_=np.sign(aa[-1]-aa[0]) or 1.0; aa=sgn_*np.maximum.accumulate(sgn_*aa)
    oT=np.argsort(aT); tgt=np.stack([np.interp(aa,aT[oT],PT[oT][:,c],period=2*np.pi) for c in range(3)],1)+GAP*np.array([0,1.0,0])
snap=np.linalg.norm(tgt-V1[LA],axis=1); print('loop',len(LA),'ring',len(ring),'snap mean/max mm',(snap.mean()*1000).round(2),(snap.max()*1000).round(2))
A1=adjacency(n,edges_of(F1)); deg1=np.asarray(A1.sum(1)).ravel(); L1=(sp.diags(1/deg1)@A1-sp.eye(n)).tocsr()
fixed=np.zeros(n,bool); fixed[LA]=True; Dfix=np.zeros((n,3)); Dfix[LA]=tgt-V1[LA]
rg=np.full(n,999); rg[fixed]=0; fr=fixed.copy()
for k in range(1,40):
    nb=(A1@fr.astype(float))>0; new=nb&(rg==999); rg[new]=k; fr=new
fx=fixed|(rg>=12); fi=np.where(~fx)[0]; xi=np.where(fx)[0]; Q=(L1.T@L1).tocsr(); Dv=np.zeros((n,3)); Dv[fx]=Dfix[fx]
rhs=-Q[fi][:,xi]@Dv[xi]; Qff=Q[fi][:,fi].tocsc()
for c in range(3): Dv[fi,c]=spsolve(Qff,rhs[:,c])
V1=V1+Dv
Zt=zipper(V1[LA],PT); Zg=np.where(Zt<len(LA),np.array(LA)[np.minimum(Zt,len(LA)-1)],n+Zt-len(LA))
V2=np.vstack([V1,PT]); F2=np.vstack([F1,Zg[:,[0,2,1]]])
nn2=len(V2); A2=adjacency(nn2,edges_of(F2)).tocsr(); rr=np.full(nn2,99); rr[n:]=0; fr2=rr==0
for k in range(1,8):
    nb=(A2@fr2.astype(float))>0; new=nb&(rr==99); rr[new]=k; fr2=new
V0=V2.copy(); V2=bilaplace_fair(V2,F2,(rr>=1)&(rr<=int(os.environ.get('HD_FAIR','4'))))
print('seam fair max move mm',(np.linalg.norm(V2-V0,axis=1).max()*1000).round(2))
# collar clearance: the base neck's band must stay under the kept tee collar band (compression shape) by >= CLR, else it pokes through
CLR=float(os.environ.get('HD_CLR','0.0025'))
from surfxfer import transfer
tj=_json.load(open(os.path.join(REPO,'drill-anim/models/training-human-v2plus-torso-base.json')))
Fc5=np.array(M['Mesh005']['index']).reshape(-1,3)[tj['keepFaces']['Mesh005']]; Pc5=PC['Mesh005']
cand=np.where((V2[:,1]<1.47)&(np.arange(len(V2))<n))[0]
Nq=vnormals(V2,F2)[cand]; fid,bc,dist=transfer(V2[cand],Nq,Pc5,Fc5,k=20,mincos=0.0)
tri=Pc5[Fc5[fid]]; pc=np.einsum('ik,ikc->ic',bc,tri); fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]); fn/=np.linalg.norm(fn,axis=1,keepdims=True)
fn*=np.sign(np.einsum('ij,ij->i',fn,radial(pc)))[:,None]
sd=np.einsum('ij,ij->i',V2[cand]-pc,fn); near=dist<0.02; push=near&(sd>-CLR)
mv=np.zeros_like(V2); mv[cand[push]]=-(sd[push]+CLR)[:,None]*fn[push]
# spread the push smoothly (a few Laplacian passes of the displacement, seam ring fixed)
Ad=adjacency(len(V2),edges_of(F2)).tocsr(); dgd=np.asarray(Ad.sum(1)).ravel(); hard=mv.any(1)
for it in range(int(os.environ.get('HD_CLR_IT','6'))):
    m2=Ad@mv/np.maximum(dgd,1)[:,None]; upd=~hard; upd[n:]=False; mv[upd]=m2[upd]
    mv[hard]=np.where((np.linalg.norm(m2[hard],axis=1)>np.linalg.norm(mv[hard],axis=1))[:,None],m2[hard],mv[hard])
mv[n:]=0; V2=V2+mv
print('collar clearance: verts pushed',int(push.sum()),'max push mm',(np.abs(sd[push]+CLR).max()*1000 if push.any() else 0).round(2))
# zipper orientation: outward (radial from the neck axis)
zf=np.arange(len(F1),len(F2))
Nf=np.cross(V2[F2[:,1]]-V2[F2[:,0]],V2[F2[:,2]]-V2[F2[:,0]])
if np.einsum('ij,ij->i',Nf[zf],radial(V2[F2[zf]].mean(1))).mean()<0: F2[zf]=F2[zf][:,[0,2,1]]
Nf=np.cross(V2[F2[:,1]]-V2[F2[:,0]],V2[F2[:,2]]-V2[F2[:,0]])
flz=int((np.einsum('ij,ij->i',Nf[zf],radial(V2[F2[zf]].mean(1)))<=0).sum())
# neighbouring-face consistency: count edges whose two faces' normals oppose (folded tris) in the whole piece
E=np.r_[F2[:,[0,1]],F2[:,[1,2]],F2[:,[2,0]]]; fid=np.tile(np.arange(len(F2)),3); key=np.sort(E,1)
o=np.lexsort((key[:,1],key[:,0])); ks=key[o]; same=(ks[1:]==ks[:-1]).all(1); a_=fid[o][:-1][same]; b_=fid[o][1:][same]
Nu=Nf/np.maximum(np.linalg.norm(Nf,axis=1,keepdims=True),1e-15); dots=np.einsum('ij,ij->i',Nu[a_],Nu[b_])
folds=int((dots<-0.5).sum()); bl=boundary_loops_F(F2)
fold_y=[] if folds==0 else np.round(np.percentile(V2[F2[a_[dots<-0.5]]].mean(1)[:,1],[0,50,100]),3).tolist()
print('fold y range',fold_y)
print('zipper faces',len(zf),'flipped',flz,'| folded edges (dihedral>120deg) whole piece',folds,'| boundary loops',[len(l) for l in bl])
report={'snapMaxMm':float(snap.max()*1000),'zipperFlipped':flz,'foldedEdges':folds,'boundaryLoops':[len(l) for l in bl]}
# ---- weights: training-collar neck rule + head mask
BONES=list(rest['bones'].keys()); bi={b:i for i,b in enumerate(BONES)}
X=V2; y=X[:,1]; ax=np.abs(X[:,0])
blend=sstep(1.30,1.36,y)*(1-sstep(1.49,1.53,y))*(1-sstep(0.225,0.28,ax))
beta=sstep(0.055,0.225,ax); neck=sstep(1.39,1.48,y)*(1-sstep(0.055,0.11,ax))
Wd=np.zeros((len(X),len(BONES)))
Wd[:,bi['head']]=1-blend
Wd[:,bi['torso']]+=blend*(1-beta)*(1-neck); Wd[:,bi['neck']]+=blend*(1-beta)*neck
Wd[X[:,0]>=0,bi['leftScapula']]+=(blend*beta)[X[:,0]>=0]; Wd[X[:,0]<0,bi['rightScapula']]+=(blend*beta)[X[:,0]<0]
HM0,HM1,HMZ=[float(v) for v in os.environ.get('HD_HEADMASK','1.475,1.505,0.10').split(',')]
hm=sstep(HM0,HM1,y+HMZ*(X[:,2]-0.02)); Wd=Wd*(1-hm)[:,None]; Wd[:,bi['head']]+=hm
A2=adjacency(len(X),edges_of(F2)).tocsr(); dg=np.asarray(A2.sum(1)).ravel(); seamM=np.zeros(len(X),bool); seamM[n:]=True
for it in range(10):
    Wn=A2@Wd/np.maximum(dg,1)[:,None]; Wd[~seamM]=0.5*Wd[~seamM]+0.5*Wn[~seamM]
Wd/=Wd.sum(1,keepdims=True)
print('weights: head share p50 at y<1.45 / 1.45-1.50 / >1.55:',[np.median(Wd[m_,bi['head']]).round(2) for m_ in (y<1.45,(y>1.45)&(y<1.50),y>1.55)])
N=vnormals(V2,F2)
order=np.argsort(-Wd,1)[:,:4]; top=np.take_along_axis(Wd,order,1); top/=top.sum(1,keepdims=True)
q=np.round(top*255).astype(int); q[:,0]+=255-q.sum(1)
b64=lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
nV=len(V2); lo=V2.min(0)-0.001; sc=(V2.max(0)+0.001-lo)/65535; Pq=np.round((V2-lo)/sc).astype(np.uint16); assert nV<65536
out={'version':1,'n':int(nV),'bones':BONES,
 'pos':{'lo':lo.round(6).tolist(),'scale':sc.tolist(),'u16':b64(Pq)},
 'nrm':{'i8':b64(np.round(N*127).astype(np.int8))},
 'index':{'u16':b64(F2.astype(np.uint16))},
 'joints':{'u8':b64(order.astype(np.uint8))},'weights':{'u8':b64(q.astype(np.uint8))},
 'seam':{'first':int(n),'mesh':['Mesh001']*len(ring),'vid':[int(v) for v in ring],'ring':['neck']*len(ring),'ownNormals':True},
 'keepFaces':{},'hideFaces':{},'hideMeshes':['Toon_Mannequin_Head_v5','Mesh001'],'requires':'torso','skin':'Coach_Body',
 'source':'Blender Human Base Meshes v1.4.1 (realistic male body, CC0, blender.org): neck'+({'mannequin':' + analytic faceless display-mannequin head (M10e)','wrap':' + head, fabric-wrap face (M10d)','egg':' + analytic faceless egg mannequin head (M10c)','soft':' + head, mannequin face (M10b)'}.get(os.environ.get('HD_FACE','mannequin') if os.environ.get('HD_MANNEQUIN','1')!='0' else 'detail',' + head (detail face)')),
 'paint':{'waistY':-1.0,'skin':True},'report':report}
_json.dump(out,open(sys.argv[1],'w'),separators=(',',':'))
np.savez('head_final.npz',V=V2,F=F2,N=N,W=Wd,nMC=n)
print('verts',nV,'faces',len(F2),'json bytes',os.path.getsize(sys.argv[1]))
