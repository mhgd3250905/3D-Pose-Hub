# stage C2: skin weights + normals + export JSON for the runtime (fair.npz -> models/training-human-v2plus-torso-base.json)
import os, sys, base64
from common import *
from meshops import *
from scipy.spatial import cKDTree
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
d=np.load('fair.npz',allow_pickle=True); V,F,nMC,seam,ring=d['V'],d['F'],int(d['nMC']),d['seam'],d['ring']
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
class Tube:
    def __init__(s,A,B,ref):
        s.A=np.array(A,float); B=np.array(B,float); s.u=(B-s.A)/np.linalg.norm(B-s.A); e0=np.array(ref,float); e0-=s.u*(e0@s.u); s.e0=e0/np.linalg.norm(e0); s.e1=np.cross(s.u,s.e0)
    def coords(s,Pt):
        d=Pt-s.A; t=d@s.u; rr=d-np.outer(t,s.u); return t,np.arctan2(rr@s.e1,rr@s.e0),np.linalg.norm(rr,axis=1)
TUBE={sd:Tube(LM[sd+'Shoulder'],LM[sd+'Elbow'],[sgn,0,0]) for sgn,sd in ((1,'left'),(-1,'right'))}
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
# ---- weights: copy the compression outfit's own skinning (it gives the clean V-taper in overhead hangs) by closest-point
#      transfer: every torso vertex takes the barycentric interpolation of the weights of the closest normal-compatible source
#      triangle (tee incl. the training-collar rule / shorts with the outfit weights / visible Coach_Body arm + leg skin), so the
#      field is continuous (no nearest-vertex streaks) and no smoothing is needed. Smoothing is deliberately absent: partial arm
#      shares in the armpit swing out on an arc around the shoulder when the arm goes overhead (round "bowls"); the split along
#      the armpit crease stays sharp (stage A2 lifted the apex to the v2 height, so the crease row only stretches a few cm).
from surfxfer import transfer
Ft=np.array(M[TEE]['index']).reshape(-1,3); Dt=collar(PC[TEE],dense_w(TEE))
Fs=np.array(M[SH]['index']).reshape(-1,3); Ds=dense_w(SH)
Wo=outfit['weights'][SH]
for i,bs,ws in zip(Wo['idx'],Wo['bones'],Wo['w']):
    Ds[i]=0
    for b,w in zip(bs,ws): Ds[i,bi[b]]+=w/255
B=P[BODY]; Db=dense_w(BODY); Fb=np.array(M[BODY]['index']).reshape(-1,3)
# arm skin only where it is visible in torso mode (below the weld ring, t >= 0.165): above the ring it is a full-arm-weight tube
# hidden under the loose tee; leg skin just below the leg weld ring
bsel=((B[:,1]>0.58)&(B[:,1]<0.70))
for sgn,sd in ((1,'left'),(-1,'right')):
    tB,_,rB=TUBE[sd].coords(B); bsel|=(B[:,0]*sgn>0.10)&(tB>0.165)&(tB<0.26)&(rB<0.09)
S=np.vstack([PC[TEE],PC[SH],B]); SW=np.vstack([Dt,Ds,Db]); o1=len(PC[TEE]); o2=o1+len(PC[SH])
SF=np.vstack([Ft,Fs+o1,Fb[bsel[Fb].all(1)]+o2])
Nv=vnormals(V,F)
fid,bc,dist=transfer(V,Nv,S,SF,k=40,mincos=0.3)
W=np.einsum('ik,ikb->ib',bc,SW[SF[fid]])
# ---- seam vertices: exact weights of the vertex they weld to ----
seamW=np.zeros((n-nMC,NBn))
for k,(name,mesh,vid) in enumerate(seam): seamW[k]=Dt[int(vid)] if mesh==TEE else Db[int(vid)]
W[nMC:]=seamW
E=edges_of(F); A=adjacency(n,E).tocsr(); free=np.ones(n,bool); free[nMC:]=False
# ---- armpit crease: where the closest tee triangle flips between the sleeve's inner wall and the side wall, single vertices can
#      land on the wrong side (arm share 0 inside 1s or vice versa) and stretch into long spikes overhead. Majority filter: a
#      vertex whose arm share differs from its neighbours' median by more than 0.5 takes the weights of the neighbour closest to
#      that median (whole vertices are copied, so no partial shares are introduced)
armI=[bi['leftUpperArm'],bi['rightUpperArm']]
for it in range(4):
    a=W[:,armI].sum(1); Wn=W.copy(); ch=0
    for i in np.where(free&(np.abs(V[:,0])>0.10)&(V[:,1]>1.1)&(V[:,1]<1.36))[0]:
        js=A.indices[A.indptr[i]:A.indptr[i+1]]; med=np.median(a[js])
        if abs(a[i]-med)>0.5: Wn[i]=W[js[np.argmin(np.abs(a[js]-med))]]; ch+=1
    W=Wn
    if not ch: break
# ---- smooth the transferred field (closest-triangle jumps leave fine-scale noise that crumples the deltoid / lat skin when the
#      arm goes overhead), but never across the armpit split: edges whose arm share jumps by more than 0.5 are cut from the graph
SMI=int(os.environ.get('T_SMOOTH','30'))
a=W[:,armI].sum(1); keepE=np.abs(a[E[:,0]]-a[E[:,1]])<=0.5
FZ=float(os.environ.get('T_FOLDZ','9'))
keepE|=(np.abs(V[E[:,0],2])>FZ)&(np.abs(V[E[:,1],2])>FZ)
Ac=adjacency(n,E[keepE]).tocsr(); degc=np.asarray(Ac.sum(1)).ravel()
for it2 in range(SMI):
    Wn=Ac@W/np.maximum(degc,1)[:,None]; W[free]=0.5*W[free]+0.5*Wn[free]
# ---- armpit apex: stage A2 packed the hollow's apex (and the zipper rows around it) into a few dense rows where the transferred
#      field still alternates (arm share 0.4 / 0.7 on vertices 2 mm apart). With the arm overhead those edges stretch 10-20x into a
#      small dark crease ringed by rim light (back armpit in the hang). Re-solve the weights of that small patch only as the
#      harmonic interpolation of its border (Gauss-Seidel-style Jacobi on the full graph, border fixed): the shear spreads evenly
#      across the patch, nothing outside it changes, so no broad partial shares come back (those made the overhead shoulder bowls).
AX=os.environ.get('T_APEX','0.150,1.270,1.345,-0.065,0.055')
if AX!='0':
    ax0,ay0,ay1,az0,az1=map(float,AX.split(','))
    patch=free&(np.abs(V[:,0])>ax0)&(np.abs(V[:,0])<0.21)&(V[:,1]>ay0)&(V[:,1]<ay1)&(V[:,2]>az0)&(V[:,2]<az1)
    Af=adjacency(n,E).tocsr(); degf=np.asarray(Af.sum(1)).ravel()
    for it3 in range(int(os.environ.get('T_APEXIT','400'))):
        Wn=Af@W/np.maximum(degf,1)[:,None]; W[patch]=Wn[patch]
    print('armpit apex patch: harmonic weights on',int(patch.sum()),'verts')
print('weights: closest-point transfer, source dist mm p50/p99',np.percentile(dist*1000,[50,99]).round(1),'majority-filter passes',it+1)
# ---- top 4, normalised, quantised to /255 (seams exact) ----
order=np.argsort(-W,1)[:,:4]; top=np.take_along_axis(W,order,1); top/=top.sum(1,keepdims=True)
q=np.round(top*255).astype(int); q[:,0]+=255-q.sum(1)
# ---- normals: computed, seam vertices take the rest normal of the vertex they weld to. rest.json's N is the authored normal
#      rotated by matrixWorld only (not skinned): fine for the tee and the legs, but Coach_Body's arms are bound in another pose
#      (its arm normals there are ~50 deg off), so rest normals are the welded vertex normals of the skinned rest positions ----
def restN(k):
    Pk=P[k]; Fk=np.array(M[k]['index']).reshape(-1,3); inv,first=weld(Pk); return vnormals(Pk[first],inv[Fk])[inv]
NR={TEE:restN(TEE),BODY:restN(BODY)}
N=vnormals(V,F)
for k,(name,mesh,vid) in enumerate(seam):
    N[nMC+k]=NR[mesh][int(vid)]
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
# armpit apex shading: at rest the armpit is a ~1 cm wide slot whose top is a tight U-turn of small, crumpled triangles (stage
# A2's lift); their normals swing 60-120 deg between neighbours. With the arm overhead the slot opens and those normals show as a
# small dark crease with rim-light lines (shade-colour branch where the shading normal turns from the camera). Give the crumpled
# faces' vertices (dilated 3 rings, smooth falloff) the 6-ring smoothed normal field instead; positions are not touched.
NSM=int(os.environ.get('T_APEXN','1'))
if NSM:
    fnn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); fnn/=np.maximum(np.linalg.norm(fnn,axis=1,keepdims=True),1e-15)
    Nr=vnormals(V,F)
    for _ in range(6): Nr=A@Nr+Nr; Nr/=np.linalg.norm(Nr,axis=1,keepdims=True)
    rf=Nr[F].mean(1); rf/=np.linalg.norm(rf,axis=1,keepdims=True); C0=V[F].mean(1)
    crum=((fnn*rf).sum(1)<0.7)&(np.abs(C0[:,0])>0.12)&(C0[:,1]>1.15)&(C0[:,1]<1.40)
    hop=np.full(n,99); hop[F[crum].ravel()]=0
    for h in range(1,4):
        nb=np.unique(A[np.where(hop==h-1)[0]].indices); nb=nb[hop[nb]==99]; hop[nb]=h
    wn=np.where(hop<=3,1-(hop/4.0)**2,0.0); wn[nMC:]=0
    N=(1-wn)[:,None]*N+wn[:,None]*Nr; N/=np.linalg.norm(N,axis=1,keepdims=True)
    print('armpit apex normals: crumpled faces',int(crum.sum()),'verts re-shaded',int((wn>0).sum()))

# short-sleeve skin strip: the torso's upper arm between the compression cuff plane (where the short sleeve now ends, shader) and
# the arm weld ring shows as skin. Its base-mesh normals carry anatomical detail the v2 arm skin does not have (toon shading turns
# it into grey blotches and a lighter band that stops at the weld). Give that strip the normals of the v2 arm skin just below
# the weld ring (Coach_Body arm, 0.17-0.20 m down the shoulder->elbow axis), matched by angle around the axis, so the skin from the
# cuff down shades as one smooth tube and continues across the weld without a step. Full from the cut down, fading out over 1.5 cm under the sleeve. Positions unchanged.
SKN=int(os.environ.get('T_SKINN','1'))
if SKN:
    NB=NR[BODY]; nsk=0
    for sgn,sd in ((1,'left'),(-1,'right')):
        pl=np.array(outfit['cuffPlanes'][sd]); fc=V@pl[:3]-pl[3]+0.006; tb=TUBE[sd]
        armsh=W[:,armI].sum(1)
        wv=sstep(-0.015,0.0,fc)*sstep(0.2,0.4,armsh)*(V[:,0]*sgn>0.13); wv[nMC:]=0
        sel=np.where(wv>0)[0]
        tB,aB,rB=tb.coords(B); bm=(B[:,0]*sgn>0.12)&(tB>0.17)&(tB<0.20)&(rB<0.09)
        key=lambda t,a: np.c_[0.0*t,0.05*np.cos(a),0.05*np.sin(a)]
        tree=cKDTree(key(tB[bm],aB[bm])); tV,aV,_=tb.coords(V[sel])
        dd,ii=tree.query(key(tV,aV),k=6); ww=1/np.maximum(dd,1e-4); ww/=ww.sum(1,keepdims=True)
        Nt=np.einsum('ik,ikc->ic',ww,NB[np.where(bm)[0]][ii]); Nt/=np.linalg.norm(Nt,axis=1,keepdims=True)
        N[sel]=(1-wv[sel])[:,None]*N[sel]+wv[sel][:,None]*Nt; nsk+=len(sel)
    N/=np.linalg.norm(N,axis=1,keepdims=True)
    print('short-sleeve skin strip: v2 arm-skin normals on',nsk,'verts')
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
 'source':'Blender Human Base Meshes v1.4.1 (realistic male body, CC0, blender.org)','paint':{'waistY':0.935}}
json.dump(out,open(sys.argv[1],'w'),separators=(',',':'))
np.savez('final.npz',V=V,F=F,N=N,J=order,Wq=q,nMC=nMC)
import os; print('verts',n,'faces',len(F),'json bytes',os.path.getsize(sys.argv[1]))
# report: dominant bones of a few regions
dom=np.array(BONES)[order[:,0]]
import collections; print(collections.Counter(dom))
