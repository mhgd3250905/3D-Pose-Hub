# skin weights + normals + export JSON for the runtime
import sys, base64
from common import *
from meshops import *
from scipy.spatial import cKDTree
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
d=np.load('fair.npz',allow_pickle=True); V,F,nMC,seam,ring=d['V'],d['F'],int(d['nMC']),d['seam'],d['ring']
n=len(V); BONES=list(rest['bones'].keys()); bi={b:i for i,b in enumerate(BONES)}; NBn=len(BONES)
def dense_w(k):
    J=arr(k,'J',4).astype(int); W=arr(k,'W',4); names=M[k]['bones']; D=np.zeros((len(J),NBn))
    for c in range(4): np.add.at(D,(np.arange(len(J)),[bi[names[j]] for j in J[:,c]]),W[:,c])
    return D
def collar(Pt,D):
    """training-collar.js weight rule (float, no quantisation)"""
    D=D.copy(); x,y,z=Pt[:,0],Pt[:,1],Pt[:,2]
    box=(y>=1.30)&(y<=1.53)&(np.abs(x)<=0.28)&(z>=-0.13)&(z<=0.16)
    aff=[bi[b] for b in ('torso','neck','head','leftScapula','rightScapula')]
    mass=D[:,aff].sum(1); blend=sstep(1.30,1.36,y)*(1-sstep(1.49,1.53,y))*(1-sstep(0.225,0.28,np.abs(x)))
    ok=box&(mass>=0.05)&(blend>1e-5)
    beta=sstep(0.055,0.225,np.abs(x)); nk=sstep(1.39,1.48,y)*(1-sstep(0.055,0.11,np.abs(x)))
    tgt=np.zeros_like(D); tgt[:,bi['torso']]=mass*(1-beta)*(1-nk); tgt[:,bi['neck']]=mass*(1-beta)*nk
    sc=np.where(x>=0,bi['leftScapula'],bi['rightScapula']); tgt[np.arange(len(D)),sc]+=mass*beta
    for a in aff: D[ok,a]=(1-blend[ok])*D[ok,a]+blend[ok]*tgt[ok,a]
    return D
# ---- sources ----
src=[]; srcW=[]; srcN=[]
nT=np.array(M[TEE]['N']).reshape(-1,3); Dt=collar(PC[TEE],dense_w(TEE)); src.append(PC[TEE]); srcW.append(Dt); srcN.append(nT)
nS=np.array(M[SH]['N']).reshape(-1,3); Ds=dense_w(SH)
Wo=outfit['weights'][SH]
for i,bs,ws in zip(Wo['idx'],Wo['bones'],Wo['w']):
    Ds[i]=0
    for b,w in zip(bs,ws): Ds[i,bi[b]]+=w/255
src.append(PC[SH]); srcW.append(Ds); srcN.append(nS)
B=P[BODY]; nB=np.array(M[BODY]['N']).reshape(-1,3); Db=dense_w(BODY)
bsel=((np.abs(B[:,0])>0.12)&(B[:,1]>1.10)&(B[:,1]<1.32))|((B[:,1]>0.58)&(B[:,1]<0.70))
src.append(B[bsel]); srcW.append(Db[bsel]); srcN.append(nB[bsel])
S=np.vstack(src); SW=np.vstack(srcW); SN=np.vstack(srcN)
Nv=vnormals(V,F)
import os
KNN=int(os.environ.get('T_KNN','8')); DIFF=int(os.environ.get('T_DIFF','15')); SHR=int(os.environ.get('T_SHOULDER','1'))
tree=cKDTree(S); dd,jj=tree.query(V,k=KNN)
cos=np.einsum('ikj,ij->ik',SN[jj],Nv)
w=np.where(cos>0.2,(cos-0.2)/0.8,0)/(dd+0.004)**2
w[w.sum(1)==0]=1.0/(dd[w.sum(1)==0]+0.004)**2
W=np.einsum('ik,ikb->ib',w,SW[jj])/w.sum(1,keepdims=True)
# ---- seam vertices: exact weights of the vertex they weld to ----
seamW=np.zeros((n-nMC,NBn))
for k,(name,mesh,vid) in enumerate(seam):
    vid=int(vid)
    if mesh==TEE: seamW[k]=Dt[vid]
    else: seamW[k]=Db[vid]
W[nMC:]=seamW
# ---- diffuse (heat) on the torso graph, seams pinned ----
E=edges_of(F); A=adjacency(n,E); deg=np.asarray(A.sum(1)).ravel()
free=np.ones(n,bool); free[nMC:]=False
for it in range(DIFF):
    Wn=A@W/np.maximum(deg,1)[:,None]; W[free]=0.5*W[free]+0.5*Wn[free]
# ---- shoulders: upper-arm share by geometry (1 on the arm tube, ramping in over the deltoid cap, 0 on the armpit web and chest/back
#      wall) so raising the arm stretches the armpit instead of folding a half-arm/half-torso web ----
import stage1lib as S1
armI={sd:[bi[b] for b in BONES if b==sd+'UpperArm' or b==sd+'Forearm' or b==sd+'Hand'] for sd in ('left','right')}
for sgn,sd in (((1,'left'),(-1,'right')) if SHR else ()):
    tb,TSa,Ea,_=S1.arm[sd]; t,ph,r=tb.coords(V); Rs=S1.tube_eval(Ea,TSa,0.005,t,ph)
    rad=(V-tb.A)-np.outer(t,tb.u); rad/=np.maximum(np.linalg.norm(rad,axis=1,keepdims=True),1e-9)
    facing=np.einsum('ij,ij->i',Nv,rad)              # arm tube faces away from its axis; the chest wall under the arm faces it
    m=np.maximum((1-sstep(0.004,0.020,r-Rs))*sstep(0.25,0.75,facing),d['snapW']*(V[:,0]*sgn>0)); a=sstep(-0.035,0.055,t); tgt=m*a
    reg=sstep(0.05,0.09,V[:,0]*sgn)*sstep(1.04,1.12,V[:,1])*free
    ai=armI[sd]; cur=W[:,ai].sum(1); oth=1-cur
    Wn=W.copy(); Wn[:,ai]=0; Wn[:,bi[sd+'UpperArm']]=tgt
    sc=np.where(oth>1e-6,(1-tgt)/np.maximum(oth,1e-6),0); Wn[:,[k for k in range(NBn) if k not in ai]]*=sc[:,None]
    lack=oth<=1e-6; Wn[lack,bi[sd+'Scapula']]+=1-tgt[lack]
    W=np.where(reg[:,None]>0,(1-reg[:,None])*W+reg[:,None]*Wn,W)
# snapped arm band = the v2 arm skin there: its own weights (blended by the snap weight)
swp=np.maximum(d['snapW'],((ring>=1)&(ring<=4)&(np.abs(V[:,0])>0.12)&(V[:,1]>1.08)&(V[:,1]<1.30)).astype(float)); armSk=(np.abs(B[:,0])>0.10)&(B[:,1]>1.0)
_,jn=cKDTree(B[armSk]).query(V); Wsk=Db[armSk][jn]; W=W*(1-swp[:,None])+Wsk*swp[:,None]
free2=free&(swp<0.5)
for it in range(12):
    Wn=A@W/np.maximum(deg,1)[:,None]; W[free2]=0.5*W[free2]+0.5*Wn[free2]
# ---- top 4, normalised, quantised to /255 (seams exact) ----
order=np.argsort(-W,1)[:,:4]; top=np.take_along_axis(W,order,1); top/=top.sum(1,keepdims=True)
q=np.round(top*255).astype(int); q[:,0]+=255-q.sum(1)
# ---- normals: computed, seam vertices take the authored normal of the vertex they weld to ----
N=vnormals(V,F)
for k,(name,mesh,vid) in enumerate(seam):
    N[nMC+k]=np.array(M[mesh]['N'][int(vid)*3:int(vid)*3+3])
# blend the first rings toward the seam normals so shading continues across the weld
for r_,a in ((1,0.6),(2,0.3),(3,0.12)):
    sel=np.where(ring==r_)[0]
    nb=A[sel]; acc=np.zeros((len(sel),3))
    for t,i in enumerate(sel):
        js=nb[t].indices; js=js[ring[js]==r_-1]
        if len(js): acc[t]=N[js].mean(0)
    ok=np.linalg.norm(acc,axis=1)>0
    N[sel[ok]]=(1-a)*N[sel[ok]]+a*acc[ok]/np.linalg.norm(acc[ok],axis=1,keepdims=True)
N/=np.linalg.norm(N,axis=1,keepdims=True)

# ---- short-sleeve paint gate: 1 on the arm tube (sleeve hem goes round the arm), 0 on the armpit web / torso ----
import stage1lib as S1
gate=np.zeros(n)
for sgn,sd in ((1,'left'),(-1,'right')):
    tb,TSa,Ea,_=S1.arm[sd]; t,ph,r=tb.coords(V); Rs=S1.tube_eval(Ea,TSa,0.005,t,ph)
    g=(1-sstep(0.002,0.006,r-Rs))*sstep(0.03,0.06,t)*(V[:,0]*sgn>0.10)
    gate=np.maximum(gate,g)

gate[nMC:]=np.where(np.array([s[0].startswith('arm') for s in seam]),1.0,0.0)
# ---- hidden parts of the existing meshes in torso mode ----
keepT=d['keepT']; keepB=d['keepB']
b64=lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
lo=V.min(0)-0.001; sc=(V.max(0)+0.001-lo)/65535
Pq=np.round((V-lo)/sc).astype(np.uint16)
assert n<65536
out={'version':1,'n':int(n),'bones':BONES,
 'pos':{'lo':lo.round(6).tolist(),'scale':sc.tolist(),'u16':b64(Pq)},
 'nrm':{'i8':b64(np.round(N*127).astype(np.int8))},
 'index':{'u16':b64(F.astype(np.uint16))},
 'joints':{'u8':b64(order.astype(np.uint8))},'weights':{'u8':b64(q.astype(np.uint8))},
 'seam':{'first':int(nMC),'mesh':[str(s[1]) for s in seam],'vid':[int(s[2]) for s in seam]},
 'keepFaces':{TEE:np.where(keepT)[0].tolist()},'hideFaces':{BODY:np.where(~keepB)[0].tolist()},
 'hideMeshes':[TRIM,SH],
 'paint':{'waistY':0.935,'sleeveGate':{'u8':b64(np.round(gate*255).astype(np.uint8))}}}
json.dump(out,open(sys.argv[1],'w'),separators=(',',':'))
np.savez('final.npz',V=V,F=F,N=N,J=order,Wq=q,nMC=nMC)
import os; print('verts',n,'faces',len(F),'json bytes',os.path.getsize(sys.argv[1]))
# report: dominant bones of a few regions
dom=np.array(BONES)[order[:,0]]
import collections; print(collections.Counter(dom))
