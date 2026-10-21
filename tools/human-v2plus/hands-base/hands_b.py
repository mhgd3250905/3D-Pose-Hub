# hands stage B: both base-mesh hands -> drill-anim/models/training-human-v2plus-hands-base.json (opt-in hands:'base', needs
# limbs:'base').  input <work>/hands_fit.npz (hands_a.py, LEFT hand in left hand-bone local coords), limbs_zip.npz (the limbs
# piece's wrist rings + hidden Coach_Body segments), the limbs-base and torso-base JSONs (hideFaces).
#  - right hand = exact mirror of the left in hand-bone local coordinates (x -> -x, the same mirror the finger rig uses), winding flipped
#  - weld: cut each hand at its Coach_Body wrist ring (the exact ring the limbs piece is zippered to, from the hand side), snap the cut
#    loop GAP short of the ring with a smooth bi-Laplacian field, zipper to the exact ring vertices (seam = Coach_Body vids)
#  - weights: palm share = closest-point transfer of Coach_Body's own forearm / hand weights; finger shares = hands_a's finger
#    weights on the grafted v2p_<L|R>_<finger><j> bones; seams = live Coach_Body weights (runtime)
#  - hideFaces: everything limbs hides + Coach_Body's hand islands beyond the wrist rings (the v2 hands)
import sys, base64, json as _json
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from scipy.sparse.csgraph import connected_components
from scipy.spatial.transform import Rotation as Rr
from surfxfer import transfer
FN=['thumb','index','middle','ring','pinky']; FB=[f+str(j) for f in FN for j in (1,2,3)]
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
GAP=float(os.environ.get('L_GAP','0.004'))
h=np.load('hands_fit.npz'); XL,FL,Wf=h['X'],h['F'],h['Wf']
from thenar import lift_thenar
XL,threp=lift_thenar(XL,FL,Wf)            # M8: thenar pad lifted to the hypothenar pad line (it hung ~1 cm below it at rest)
z=np.load('limbs_zip.npz',allow_pickle=True); seamL=z['seam']; segF=z['segF']; keepB0=z['keepB0']
B=P[BODY]; Fb=np.array(M[BODY]['index']).reshape(-1,3); invB,firstB=weld(B); FbW=invB[Fb]
BONES=list(rest['bones'].keys())+['v2p_%s_%s'%(s,b) for s in 'LR' for b in FB]; bi={b:i for i,b in enumerate(BONES)}
def dense_w(k):
    J=arr(k,'J',4).astype(int); W=arr(k,'W',4); names=M[k]['bones']; D=np.zeros((len(J),len(BONES)))
    for c in range(4): np.add.at(D,(np.arange(len(J)),[bi[names[j]] for j in J[:,c]]),W[:,c])
    return D
Db=dense_w(BODY)
Lf=np.load('limbs_final.npz'); LV,LF,LnMC=Lf['V'],Lf['F'],int(Lf['nMC']); LA_=adjacency(len(LV),edges_of(LF)).tocsr()
limbsJ=_json.load(open(os.path.join(REPO,'drill-anim/models/training-human-v2plus-limbs-base.json')))
hideL=set(limbsJ['hideFaces'][BODY])
# Coach_Body faces still drawn in limbs mode; the hand islands = components of those containing a wrist ring
keep=np.ones(len(Fb),bool); keep[list(hideL)]=False
_,lab=connected_components(adjacency(invB.max()+1,edges_of(FbW[keep])),directed=False)
out_V=[]; out_F=[]; out_W=[]; out_N=[]; seam=[]; handHide=[]; nMC_list=[]; off=0
class Tube:
    def __init__(s,A,Bp,ref):
        s.A=np.array(A,float); Bp=np.array(Bp,float); s.u=(Bp-s.A)/np.linalg.norm(Bp-s.A); e0=np.array(ref,float); e0-=s.u*(e0@s.u); s.e0=e0/np.linalg.norm(e0); s.e1=np.cross(s.u,s.e0)
    def coords(s,Pt):
        dd=Pt-s.A; t=dd@s.u; rr=dd-np.outer(t,s.u); return t,np.arctan2(rr@s.e1,rr@s.e0),np.linalg.norm(rr,axis=1)
report={}
for sgn,sd,S in ((1,'left','L'),(-1,'right','R')):
    hb=rest['bones'][sd+'Hand']; RH=Rr.from_quat(hb['q']).as_matrix(); pH=np.array(hb['p'])
    mir=np.array([sgn,1,1.0]); V=(XL*mir)@RH.T+pH; F=FL.copy() if sgn>0 else FL[:,[0,2,1]]
    ring=[int(s[2]) for s in seamL if s[0]=='wrist_'+sd]
    # hand island of Coach_Body (hidden in hands mode)
    li=set(int(lab[invB[v]]) for v in ring); assert len(li)==1, li
    hf=np.where(keep&(lab[FbW[:,0]]==li.pop()))[0]; handHide+=hf.tolist()
    # cut: keep the hand side of the ring (polar-angle interpolated ring position along the forearm axis)
    tb=Tube(LM[sd+'Elbow'],LM[sd+'Wrist'],[sgn,0,0]); tl_,pl,_=tb.coords(B[ring]); o=np.argsort(pl)
    t,ph,_=tb.coords(V); tl=np.interp(ph,pl[o],tl_[o],period=2*np.pi)
    keepF=(t>tl+0.004)[F].all(1); V1,F1,used=compact(V,F,keepF); W1=Wf[used]
    lab1=components(len(V1),F1); big=np.argmax(np.bincount(lab1)); V1,F1,u2=compact(V1,F1,lab1[F1[:,0]]==big); W1=W1[u2]
    loops=boundary_loops_F(F1); assert len(loops)==1,[len(l) for l in loops]; LA=list(loops[0]); n=len(V1)
    # snap the loop onto the ring + GAP toward the hand (polar angle about the forearm axis)
    PT=B[ring]; cT=PT.mean(0); ax=tb.u; e0=np.cross(ax,[0,0,1.0]); e0/=np.linalg.norm(e0); e1=np.cross(ax,e0)
    ang=lambda X: np.arctan2((X-cT)@e1,(X-cT)@e0)
    wind=lambda a: np.sign(np.sum((np.diff(np.r_[a,a[:1]])+np.pi)%(2*np.pi)-np.pi))
    if wind(ang(V1[LA]))!=wind(ang(PT)): ring=ring[::-1]; PT=B[ring]
    aT=ang(PT); oo=np.argsort(aT); aA=ang(V1[LA])
    # arc-length parameterisation (monotone, so the zipper fans cannot fold over a jagged cut), anchored at loop vertex 0's angle
    PL=V1[LA]; sl=np.r_[0,np.cumsum(np.linalg.norm(np.diff(np.r_[PL,PL[:1]],axis=0),axis=1))]; sl=sl[:-1]/sl[-1]
    sr=np.r_[0,np.cumsum(np.linalg.norm(np.diff(np.r_[PT,PT[:1]],axis=0),axis=1))]; Lr=sr[-1]; sr=sr/Lr
    a0=aA[0]; p0=np.stack([np.interp(a0,aT[oo],PT[oo][:,c],period=2*np.pi) for c in range(3)])
    j=int(np.argmin([np.linalg.norm(np.cross(PT[(i+1)%len(PT)]-PT[i],p0-PT[i]))/max(np.linalg.norm(PT[(i+1)%len(PT)]-PT[i]),1e-9)+np.linalg.norm(p0-(PT[i]+PT[(i+1)%len(PT)])/2)*0.5 for i in range(len(PT))]))
    tj=np.clip((p0-PT[j])@(PT[(j+1)%len(PT)]-PT[j])/np.linalg.norm(PT[(j+1)%len(PT)]-PT[j])**2,0,1); s0=sr[j]+tj*(sr[j+1]-sr[j])
    PTc=np.r_[PT,PT[:1]]; src=sr; ss=(sl+s0)%1.0
    tgt=np.stack([np.interp(ss,src,PTc[:,c]) for c in range(3)],1)+GAP*ax
    snap=np.linalg.norm(tgt-V1[LA],axis=1); print(sd,'loop',len(LA),'ring',len(ring),'snap mean/max mm',(snap.mean()*1000).round(2),(snap.max()*1000).round(2))
    A1=adjacency(n,edges_of(F1)); deg1=np.asarray(A1.sum(1)).ravel(); L1=(sp.diags(1/deg1)@A1-sp.eye(n)).tocsr()
    fixed=np.zeros(n,bool); fixed[LA]=True; Dfix=np.zeros((n,3)); Dfix[LA]=tgt-V1[LA]
    rg=np.full(n,999); rg[fixed]=0; fr=fixed.copy()
    for k in range(1,40):
        nb=(A1@fr.astype(float))>0; new=nb&(rg==999); rg[new]=k; fr=new
    far=rg>=12; fx=fixed|far; fi=np.where(~fx)[0]; xi=np.where(fx)[0]; Q=(L1.T@L1).tocsr(); Dv=np.zeros((n,3)); Dv[fx]=Dfix[fx]
    rhs=-Q[fi][:,xi]@Dv[xi]; Qff=Q[fi][:,fi].tocsc()
    for c in range(3): Dv[fi,c]=spsolve(Qff,rhs[:,c])
    V1=V1+Dv
    Zt=zipper(V1[LA],PT); Zg=np.where(Zt<len(LA),np.array(LA)[np.minimum(Zt,len(LA)-1)],n+Zt-len(LA))
    V2=np.vstack([V1,PT]); F2=np.vstack([F1,Zg[:,[0,2,1]]])
    # seam fairing (like limbs_c): bi-Laplacian on the first rings next to the weld, with the limbs piece's first ring across the
    # seam as fixed ghosts, so the surface runs through the ring without a crease
    nn2=len(V2); A2=adjacency(nn2,edges_of(F2)).tocsr(); rr=np.full(nn2,99); rr[n:]=0; fr2=rr==0
    for k in range(1,8):
        nb=(A2@fr2.astype(float))>0; new=nb&(rr==99); rr[new]=k; fr2=new
    lseam=[int(s_[2]) for s_ in seamL]; lpos={v:LnMC+k for k,v in enumerate(lseam)}; gl=[]; ge=[]; gid={}
    for k,v in enumerate(ring):
        li_=lpos[v]
        for j in LA_.indices[LA_.indptr[li_]:LA_.indptr[li_+1]]:
            if j>=LnMC: continue
            if j not in gid: gid[j]=len(gl); gl.append(LV[j])
            ge.append((n+k,gid[j]))
    V0=V2.copy(); V2=bilaplace_fair(V2,F2,(rr>=1)&(rr<=int(os.environ.get('H_FAIR','5'))),np.array(gl),np.array(ge))
    print(sd,'fair ghosts',len(gl),'max move mm',(np.linalg.norm(V2-V0,axis=1).max()*1000).round(2))
    # zipper orientation must agree with the hand faces next to it
    Nf=np.cross(V2[F2[:,1]]-V2[F2[:,0]],V2[F2[:,2]]-V2[F2[:,0]]); zc=Nf[len(F1):].mean(0); radial=(V2[F2[len(F1):]].mean(1)-cT); radial-=np.outer(radial@ax,ax)
    if np.einsum('ij,ij->i',Nf[len(F1):],radial).mean()<0: F2[len(F1):]=F2[len(F1):][:,[0,2,1]]
    Nf=np.cross(V2[F2[:,1]]-V2[F2[:,0]],V2[F2[:,2]]-V2[F2[:,0]]); radial=V2[F2].mean(1)-cT; radial-=np.outer(radial@ax,ax)
    zf=np.arange(len(F1),len(F2)); flipped=int((np.einsum('ij,ij->i',Nf[zf],radial[zf])<=0).sum())
    bl=boundary_loops_F(F2); print(sd,'zipper faces',len(zf),'flipped (inward-facing) zipper faces',flipped,'boundary loops',[len(l) for l in bl])
    report[sd]={'snapMaxMm':float(snap.max()*1000),'zipperFlipped':flipped,'boundaryLoops':[len(l) for l in bl]}
    # weights
    srcF=keep&np.isin(np.arange(len(Fb)),hf)
    vs=np.zeros(invB.max()+1,bool); vs[invB[Fb[hf]].ravel()]=True; srcF|=vs[FbW].any(1)&~np.isin(np.arange(len(Fb)),list(hideL))
    Nv=vnormals(V1,F1); fid,bc,dist=transfer(V1,Nv,B,Fb[srcF],k=40,mincos=0.3)
    Wt=np.einsum('ik,ikb->ib',bc,Db[Fb[srcF][fid]])
    # the transferred palm share: forearm / hand only (Coach_Body's hand vertices carry no finger bones in the rest dump)
    W=Wt*W1[:,0:1]
    for c,b in enumerate(FB): W[:,bi['v2p_%s_%s'%(S,b)]]+=W1[:,1+c]
    Wseam=Db[ring]; W=np.vstack([W,Wseam]); print(sd,'transfer dist mm p50/p99',np.percentile(dist*1000,[50,99]).round(1))
    # normals: computed, seam = Coach_Body rest normal (runtime), first rings blended
    N=vnormals(V2,F2)
    out_V.append(V2); out_F.append(F2+off); out_W.append(W); out_N.append(N)
    nMC_list.append((off,n,ring)); off+=len(V2)
# interleave: [left mesh, left seam, right mesh, right seam] -> the piece format wants all seams at the end
Vh=[];Fh=[];Wh=[];Nh=[]; remap=[]; cur=0
for (o_,n,ring),V2,W,N in zip(nMC_list,out_V,out_W,out_N): Vh.append(V2[:n]); Wh.append(W[:n]); Nh.append(N[:n])
nMC=sum(n for _,n,_ in nMC_list); seamV=[]; seamW=[]; seamN=[]
for (o_,n,ring),V2,W,N in zip(nMC_list,out_V,out_W,out_N): seamV.append(V2[n:]); seamW.append(W[n:]); seamN.append(N[n:])
Vall=np.vstack(Vh+seamV); Wall=np.vstack(Wh+seamW); Nall=np.vstack(Nh+seamN)
# index remap per hand
idmap=[]; base=0; sbase=nMC
for (o_,n,ring) in nMC_list:
    m=np.r_[base+np.arange(n),sbase+np.arange(len(ring))]; idmap.append(m); base+=n; sbase+=len(ring)
Fall=np.vstack([idmap[k][out_F[k]-nMC_list[k][0]] for k in range(2)])
seam=[('wrist_'+sd,BODY,int(v)) for sd,(o_,n,ring) in zip(('left','right'),nMC_list) for v in ring]
assert len(seam)==len(Vall)-nMC
# wrist weld normals (M8): the seam vertices used to take Coach_Body's own (v2 forearm) rest normal at runtime, with the first
# rings on both sides blended toward it; that normal is not the normal of either welded surface, so a faint shading line showed at
# the weld in some lights.  Now one shared normal per wrist seam vertex = area-weighted face normals of BOTH pieces around it (hands
# + limbs), the rings next to it keep their own geometric normals (continuous with it), and the limbs piece's wrist rings get the
# same treatment in hands mode (limbsNrm, swapped in by setHands; limbs-only mode keeps its weld to the v2 hand untouched).
def rawN(V,F):
    fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); n_=np.zeros_like(V)
    for c in range(3): np.add.at(n_,F[:,c],fn)
    return n_
WELDN=os.environ.get('H_WELDN','1')!='0'
RH_=rawN(Vall,Fall); RL_=rawN(LV,LF); lseam_all=[int(s_[2]) for s_ in seamL]; lring_all=[str(s_[0]) for s_ in seamL]
if WELDN:
    N=RH_/np.maximum(np.linalg.norm(RH_,axis=1,keepdims=True),1e-15)
    NLnew=RL_/np.maximum(np.linalg.norm(RL_,axis=1,keepdims=True),1e-15)
    angs=[]; NRB=None
    def restN(k):
        Pk=P[k]; Fk_=np.array(M[k]['index']).reshape(-1,3); inv,first=weld(Pk); return vnormals(Pk[first],inv[Fk_])[inv]
    NRB=restN(BODY)
    for k,s_ in enumerate(seam):
        li_=[LnMC+j for j,(v,r) in enumerate(zip(lseam_all,lring_all)) if v==s_[2] and r==s_[0]]; assert len(li_)==1
        c=RH_[nMC+k]+RL_[li_[0]]; c/=np.linalg.norm(c); N[nMC+k]=c; NLnew[li_[0]]=c; angs.append(np.degrees(np.arccos(np.clip(c@NRB[s_[2]],-1,1))))
    # limbs vertices to override: the wrist seams + NB rings into the limbs piece
    NBR=int(os.environ.get('H_WELD_RINGS','5'))
    wl=np.array([LnMC+j for j,r in enumerate(lring_all) if r.startswith('wrist_')]); rgL=np.full(len(LV),99); rgL[wl]=0; frL=rgL==0
    for k in range(1,NBR+1):
        nb=(LA_@frL.astype(float))>0; new=nb&(rgL==99); rgL[new]=k; frL=new
    limbsIdx=np.where(rgL<=NBR)[0]
    # the zipper / fairing band has small ripples along the ring, so the toon terminator crossing it stepped (a faint jagged line):
    # relax the normals (not positions) over the weld band of both pieces as one surface (limbs seam vertex == hands seam vertex)
    AH=adjacency(len(Vall),edges_of(Fall)).tocsr(); rgH=np.full(len(Vall),99); rgH[nMC:]=0; frH=rgH==0
    for k in range(1,NBR+1):
        nb=(AH@frH.astype(float))>0; new=nb&(rgH==99); rgH[new]=k; frH=new
    lmap={}
    for k,s_ in enumerate(seam):
        lmap[[LnMC+j for j,(v,r) in enumerate(zip(lseam_all,lring_all)) if v==s_[2] and r==s_[0]][0]]=nMC+k
    nH=len(Vall); gid=np.r_[np.arange(nH),nH+np.arange(len(LV))]
    for li_,hi_ in lmap.items(): gid[nH+li_]=hi_
    EH=edges_of(Fall); EL=edges_of(LF); EU=np.vstack([EH,gid[nH+EL]]); nU=nH+len(LV); AU=adjacency(nU,EU).tocsr(); degU=np.asarray(AU.sum(1)).ravel()
    NU=np.zeros((nU,3)); NU[:nH]=N; NU[nH:]=NLnew; band=np.zeros(nU,bool); band[:nH]=rgH<NBR; band[nH:]=rgL<NBR
    wgt=np.zeros(nU); wgt[:nH]=1-np.clip(rgH/NBR,0,1); wgt[nH:]=1-np.clip(rgL/NBR,0,1)
    for it in range(int(os.environ.get('H_WELD_NIT','8'))):
        Nn=AU@NU/np.maximum(degU,1)[:,None]; NU[band]=(1-0.6*wgt[band,None])*NU[band]+0.6*wgt[band,None]*Nn[band]; NU/=np.maximum(np.linalg.norm(NU,axis=1,keepdims=True),1e-15)
    N=NU[:nH].copy(); NLnew=NU[gid[nH:]].copy()
    NL0=np.frombuffer(base64.b64decode(limbsJ['nrm']['i8']),np.int8).reshape(-1,3)/127.0
    dL=np.degrees(np.arccos(np.clip(np.einsum('ij,ij->i',NL0[limbsIdx],NLnew[limbsIdx]),-1,1)))
    print('weld normals: shared seam normal vs Coach_Body rest normal deg p50/max',np.percentile(angs,50).round(1),np.max(angs).round(1),
          '| limbs wrist-ring override verts',len(limbsIdx),'change deg p50/max',np.percentile(dL,50).round(1),dL.max().round(1))
    report['weldNormals']={'seamVsCoachDegMax':float(np.max(angs)),'limbsOverride':int(len(limbsIdx))}
else:
    def restN(k):
        Pk=P[k]; Fk_=np.array(M[k]['index']).reshape(-1,3); inv,first=weld(Pk); return vnormals(Pk[first],inv[Fk_])[inv]
    NRB=restN(BODY); N=vnormals(Vall,Fall)
    for k,s in enumerate(seam): N[nMC+k]=NRB[s[2]]
    A=adjacency(len(Vall),edges_of(Fall)).tocsr(); rg=np.full(len(Vall),99); rg[nMC:]=0; fr=rg==0
    for k in range(1,4):
        nb=(A@fr.astype(float))>0; new=nb&(rg==99); rg[new]=k; fr=new
    for r_,a in ((1,0.6),(2,0.3),(3,0.12)):
        for i in np.where(rg==r_)[0]:
            js=A.indices[A.indptr[i]:A.indptr[i+1]]; js=js[rg[js]==r_-1]
            if len(js): mm=N[js].mean(0); N[i]=(1-a)*N[i]+a*mm/np.linalg.norm(mm)
N/=np.linalg.norm(N,axis=1,keepdims=True)
report['thenar']=threp
# global checks: flipped faces vs the rest mesh's own outward normals (closed check: boundary loops), hole-free
loops=boundary_loops_F(Fall); print('piece boundary loops (must be [] before the Coach_Body weld; seam rings are the hand-side boundary)',[len(l) for l in loops])
order=np.argsort(-Wall,1)[:,:4]; top=np.take_along_axis(Wall,order,1); top/=top.sum(1,keepdims=True)
q=np.round(top*255).astype(int); q[:,0]+=255-q.sum(1)
b64=lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
n=len(Vall); lo=Vall.min(0)-0.001; sc=(Vall.max(0)+0.001-lo)/65535; Pq=np.round((Vall-lo)/sc).astype(np.uint16); assert n<65536
hide=sorted(hideL|set(handHide))
out={'version':1,'n':int(n),'bones':BONES,
 'pos':{'lo':lo.round(6).tolist(),'scale':sc.tolist(),'u16':b64(Pq)},
 'nrm':{'i8':b64(np.round(N*127).astype(np.int8))},
 'index':{'u16':b64(Fall.astype(np.uint16))},
 'joints':{'u8':b64(order.astype(np.uint8))},'weights':{'u8':b64(q.astype(np.uint8))},
 'seam':dict({'first':int(nMC),'mesh':[s[1] for s in seam],'vid':[s[2] for s in seam],'ring':[s[0] for s in seam]},**({'ownNormals':True} if WELDN else {})),
 'keepFaces':{},'hideFaces':{BODY:hide},'hideMeshes':[],'requires':'limbs','skin':BODY,
 'source':'Blender Human Base Meshes v1.4.1 (realistic male body, CC0, blender.org): hands (left retargeted onto the v2plus finger rig, right = mirror)',
 'paint':{'waistY':-1.0,'skin':True},'report':report}
if WELDN: out['limbsNrm']={'idx':limbsIdx.tolist(),'i8':b64(np.round(NLnew[limbsIdx]*127).astype(np.int8))}
_json.dump(out,open(sys.argv[1],'w'),separators=(',',':'))
np.savez('hands_final.npz',V=Vall,F=Fall,N=N,J=order,Wq=q,nMC=nMC,W=Wall)
print('verts',n,'faces',len(Fall),'hidden Coach_Body faces',len(hide),'(hand islands',len(handHide),') json bytes',os.path.getsize(sys.argv[1]))
