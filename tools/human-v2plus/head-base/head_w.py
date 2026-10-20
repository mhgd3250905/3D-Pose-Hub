# head stage W (M10d): "fabric wrap" face — head_fit.npz -> head_fit.npz (in place; runs when HD_FACE=wrap)
#  The real (M10 detail) head as if tightly wrapped in smooth stretch fabric (a Spider-Man head without its texture): the big convex forms
#  (skull, forehead, brow ridge, cheekbones, jaw, chin, nose bridge + tip) are kept exactly; small concavities are bridged.
#  Input: head_a's detail head with head_m step 1 applied (mouth / nostril cavities cut + capped, eye lid patches re-capped).
#   1. pre-flatten: screened bi-Laplacian low-pass S of the piece; V' = S + k (V - S) with k = K_EAR on the ears (pressed flat), K_MOUTH on
#      the lips (faint volume only), K_NOSE_U under the nose (alae / columella), 1 elsewhere (smooth ellipsoid falloffs)
#   2. morphological closing with a ball of radius R_CLOSE (voxel occupancy at VOX by z-ray parity, closing = EDT dilate + EDT erode):
#      the closed volume contains the head and differs from it only inside concavities narrower than the ball (eye sockets -> shallow
#      hollows, lip line / corners, nasolabial fold, nose-cheek and under-nose junctions, mentolabial sulcus, behind / inside the ears);
#      vertices inside the closed volume are pushed out onto its (blurred, trilinear) zero level set; convex parts are untouched
#   3. light Taubin over the face (and a lighter global one) to remove the voxel noise
#   4. exact sagittal symmetrize (v <- midpoint of v and the mirrored surface's closest point, iterated), faded to 0 below Y_SYM so the
#      neck / weld / collar band (y < 1.47) stays exactly as the base neck
import os, numpy as np
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import factorized
from scipy import ndimage as ndi
from scipy.spatial import cKDTree
FACE=os.environ.get('HD_FACE','detail') if os.environ.get('HD_MANNEQUIN','1')!='0' else 'detail'
if FACE!='wrap': print('fabric wrap: off, HD_FACE =',FACE); raise SystemExit
f=lambda k,d: float(os.environ.get(k,d))
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
R_CLOSE=f('HD_W_R','0.016'); VOX=f('HD_W_VOX','0.001'); T_LOW=f('HD_W_T','15000')
K_EAR=f('HD_W_KEAR','0.2'); K_MOUTH=f('HD_W_KMOUTH','0.35'); K_NOSE_U=f('HD_W_KNOSEU','0.3')
Y0,Y1=f('HD_W_Y0','1.47'),f('HD_W_Y1','1.50')       # everything fades in over y 1.47 -> 1.50 (neck below untouched)
TAU_FACE=int(f('HD_W_TAUF','20')); TAU_ALL=int(f('HD_W_TAUA','3'))
h=dict(np.load('head_fit.npz')); V=h['V'].astype(float); F=h['F']; LA=np.array(h['LA'])
# ---- 0. mouth re-topology: the closed-mouth patch (lips + head_m's cap, whose rings fold under the lips) is cut on an ellipsoid and
# re-filled with clean concentric rings + bi-Laplacian fairing (CAP_RIM rings around it free), so later steps see an untangled membrane
MC=np.array([0,1.543,0.122]); MR=np.array([float(v) for v in os.environ.get('HD_W_MOUTHCUT','0.024,0.011,0.03').split(',')])
inm=np.sqrt((((V-MC)/MR)**2).sum(1))<1; Fk=F[~inm[F].any(1)]; used=np.unique(Fk); rmp=-np.ones(len(V),int); rmp[used]=np.arange(len(used))
V=V[used]; F=rmp[Fk]; LA=rmp[LA]; assert (LA>=0).all()
lps=[np.array(l) for l in boundary_loops_F(F)]; sLA=set(LA.tolist()); holes=[l for l in lps if not set(l.tolist())&sLA]; print('mouth re-cap holes',[len(l) for l in holes])
n0=len(V); capV=[]; capF=[]; cur=n0; KR=int(f('HD_W_CAPRINGS','6'))
for l in holes:
    m_=len(l); c=V[l].mean(0); ids=[l]
    for kk in range(1,KR+1): capV.append(V[l]*(1-kk/(KR+1))+c*kk/(KR+1)); ids.append(cur+np.arange(m_)); cur+=m_
    capV.append(c[None]); cid=cur; cur+=1
    for kk in range(KR):
        A_,B_=ids[kk],ids[kk+1]
        for i in range(m_): j=(i+1)%m_; capF+=[(A_[i],B_[j],A_[j]),(A_[i],B_[i],B_[j])]
    for i in range(m_): j=(i+1)%m_; capF.append((ids[KR][i],cid,ids[KR][j]))
capF=np.array(capF)
V=np.vstack([V]+capV); F=np.vstack([F,capF])
fr=np.zeros(len(V),bool); fr[n0:]=True; Ac0=adjacency(len(V),edges_of(F)).tocsr()
for kk in range(int(f('HD_W_CAPRIM','3'))): fr=fr|((Ac0@fr.astype(float))>0)
V=bilaplace_fair(V,F,fr); h['F']=F; h['LA']=LA
n=len(V); Vin=V.copy()
x,y,z=V[:,0],V[:,1],V[:,2]; wy=sstep(Y0,Y1,y)
def ell(c,r):
    d=np.sqrt((((V-np.array(c))/np.array(r))**2).sum(1)); return 1-sstep(1.0,1.6,d)
# ---- 1. pre-flatten ears / lips / nose underside
ear=np.maximum(ell((0.081,1.627,0.016),(0.022,0.065,0.048)),ell((-0.081,1.627,0.016),(0.022,0.065,0.048)))
mouth=ell((0,1.543,0.122),(0.03,0.013,0.025)); noseu=ell((0,1.567,0.125),(0.022,0.01,0.022))
k=np.ones(n)
for m_,kk in ((ear,K_EAR),(mouth,K_MOUTH),(noseu,K_NOSE_U)): k=k*(1-m_)+kk*m_
k=1-(1-k)*wy
A=adjacency(n,edges_of(F)); dg=np.asarray(A.sum(1)).ravel(); L=(sp.diags(1/dg)@A-sp.eye(n)).tocsr()
solve=factorized((sp.eye(n)+T_LOW*(L.T@L)).tocsc()); S=np.stack([solve(V[:,c]) for c in range(3)],1)
V=S+k[:,None]*(V-S)
# mouth core: one bi-Laplacian membrane over the lips (no lip line / recess / corners; the membrane's C1 join gives a faint lip volume)
# ears pressed flat: membrane over the ear (bi-Laplacian, ear core free) + only K_EARB of the low-passed ear relief kept -> low smooth bump
fre=(ear>0.5)&(y>Y1); Ve=bilaplace_fair(V,F,fre); KB=f('HD_W_KEARB','0.35'); V=np.where(fre[:,None],Ve+KB*(V-Ve),V); print('ear core faired verts',int(fre.sum()))
MF=f('HD_W_MOUTHFAIR','0.6'); frm=(mouth>MF)&(y>Y1); V=bilaplace_fair(V,F,frm); print('mouth core faired verts',int(frm.sum()))
print('pre-flatten move max mm: ears',(np.linalg.norm(V-Vin,axis=1)[ear>0.9].max()*1000).round(1),'mouth',(np.linalg.norm(V-Vin,axis=1)[mouth>0.9].max()*1000).round(1))
# ---- 2. morphological closing
pad=R_CLOSE+0.006; sel=V[:,1]>Y0-0.012
lo=np.array([V[sel,0].min()-pad,Y0-0.012,V[sel,2].min()-pad]); hi=np.array([V[sel,0].max()+pad,V[:,1].max()+pad,V[sel,2].max()+pad])
NX,NY,NZ=np.ceil((hi-lo)/VOX).astype(int)+1; print('voxel grid',NX,NY,NZ,'=',NX*NY*NZ//10**6,'M')
gx=lo[0]+np.arange(NX)*VOX+VOX*0.1371; gy=lo[1]+np.arange(NY)*VOX+VOX*0.0713   # tiny jitter: no ray exactly through a vertex / edge
tog=np.zeros((NX,NY,NZ+1),np.int8)
P0,P1,P2=V[F[:,0]],V[F[:,1]],V[F[:,2]]
tx0=np.ceil((np.minimum(np.minimum(P0[:,0],P1[:,0]),P2[:,0])-gx[0])/VOX).astype(int); tx1=np.floor((np.maximum(np.maximum(P0[:,0],P1[:,0]),P2[:,0])-gx[0])/VOX).astype(int)
ty0=np.ceil((np.minimum(np.minimum(P0[:,1],P1[:,1]),P2[:,1])-gy[0])/VOX).astype(int); ty1=np.floor((np.maximum(np.maximum(P0[:,1],P1[:,1]),P2[:,1])-gy[0])/VOX).astype(int)
ok=(tx1>=tx0)&(ty1>=ty0)&(ty1>=0)&(ty0<NY)
ti=np.where(ok)[0]; nxs=tx1[ti]-tx0[ti]+1; nys=ty1[ti]-ty0[ti]+1; cnt=nxs*nys
T_=np.repeat(ti,cnt); off=np.arange(cnt.sum())-np.repeat(np.cumsum(cnt)-cnt,cnt); nyr=np.repeat(nys,cnt)
IX=tx0[T_]+off//nyr; IY=ty0[T_]+off%nyr; m=(IY>=0)&(IY<NY); T_,IX,IY=T_[m],IX[m],IY[m]
px,py=gx[IX],gy[IY]; a,b,c=P0[T_],P1[T_],P2[T_]
d=(b[:,1]-c[:,1])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,1]-c[:,1]); dok=np.abs(d)>1e-16
l1=((b[:,1]-c[:,1])*(px-c[:,0])+(c[:,0]-b[:,0])*(py-c[:,1]))/np.where(dok,d,1); l2=((c[:,1]-a[:,1])*(px-c[:,0])+(a[:,0]-c[:,0])*(py-c[:,1]))/np.where(dok,d,1); l3=1-l1-l2
ins=dok&(l1>=0)&(l2>=0)&(l3>=0); zc=(l1*a[:,2]+l2*b[:,2]+l3*c[:,2])[ins]; IX,IY=IX[ins],IY[ins]
IZ=np.clip(np.ceil((zc-lo[2])/VOX).astype(int),0,NZ)
np.add.at(tog,(IX,IY,IZ),1); occ=(np.cumsum(tog,axis=2,dtype=np.int16)[:,:,:NZ]%2).astype(bool); del tog
print('occupancy voxels',int(occ.sum()),'| crossings',len(zc))
D_out=ndi.distance_transform_edt(~occ)*VOX; dil=D_out<=R_CLOSE; del D_out
D_in=ndi.distance_transform_edt(dil)*VOX; closed=D_in>R_CLOSE; del D_in,dil
closed|=occ   # never lose material (EDT rounding at the grid's own border rows)
filled=int(closed.sum()-occ.sum()); print('closing R mm',R_CLOSE*1000,'| filled voxels',filled)
phi=np.where(closed,-(ndi.distance_transform_edt(closed)-0.5),ndi.distance_transform_edt(~closed)-0.5).astype(np.float32)*VOX
phi=ndi.gaussian_filter(phi,f('HD_W_BLUR','1.0'))
def samp(X,arr=None):
    q=((X-lo)/VOX-np.array([0.1371,0.0713,0.0])).T; return ndi.map_coordinates(phi if arr is None else arr,q,order=1,mode='nearest')
gphi=np.gradient(phi,VOX)
p0=samp(V); act=(p0<-f('HD_W_ACT0','0.0004'))&(V[:,1]>Y0-0.005)
W=V.copy(); ia=np.where(act)[0]
for it in range(8):
    X=W[ia]; ph=samp(X); g=np.stack([samp(X,gg) for gg in gphi],1); g2=np.maximum((g*g).sum(1),1e-6)
    W[ia]=X-(ph/g2)[:,None]*g
wact=sstep(f('HD_W_ACT0','0.0004'),f('HD_W_ACT1','0.0012'),-p0)*wy
disp=(W-V)*wact[:,None]; V0p=V.copy(); V=V+disp
# closest-point projection bunches vertices into the bridged creases (folds / flips): relax tangentially over the pushed region (+ 3 rings)
# and re-project anything that sank back inside the closed volume, a few rounds
Aa=adjacency(n,edges_of(F)).tocsr(); reg=(np.linalg.norm(disp,axis=1)>1e-4)
for kk in range(3): reg=reg|((Aa@reg.astype(float))>0)
reg&=(y>Y0)
for rnd in range(int(f('HD_W_RELAX','4'))):
    V=tangential_relax(V,F,~reg,8)
    ia=np.where(reg)[0]; X=V[ia]; ph=samp(X); inn=ph<0
    for it in range(6):
        X2=X[inn]; ph2=samp(X2); g=np.stack([samp(X2,gg) for gg in gphi],1); X[inn]=X2-(np.minimum(ph2,0)/np.maximum((g*g).sum(1),1e-6))[:,None]*g
    V[ia]=X
# remaining tangles (mouth corners where the cut mouth cap folds under the lip, inner ear): faces flipped vs the input or with a > 25 deg
# dihedral above Y1 -> that patch + RING rings is re-filled by bi-Laplacian fairing (membrane C1 to the surroundings), then pushed out again
def bad_faces(V):
    Nf=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); Nu=Nf/np.maximum(np.linalg.norm(Nf,axis=1,keepdims=True),1e-15)
    E=np.r_[F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]; fid=np.tile(np.arange(len(F)),3); key=np.sort(E,1); o=np.lexsort((key[:,1],key[:,0])); ks=key[o]
    same=(ks[1:]==ks[:-1]).all(1); a_=fid[o][:-1][same]; b_=fid[o][1:][same]; dt=np.einsum('ij,ij->i',Nu[a_],Nu[b_])
    bad=np.zeros(len(F),bool); sh=dt<np.cos(np.radians(25)); bad[a_[sh]]=True; bad[b_[sh]]=True
    bad&=V[F].mean(1)[:,1]>Y1; return bad
Nf0in=np.cross(Vin[F[:,1]]-Vin[F[:,0]],Vin[F[:,2]]-Vin[F[:,0]])
bad0=bad_faces(Vin); print('input bad faces (y>1.50)',int(bad0.sum()))
for rnd in range(int(f('HD_W_FIXR','3'))):
    bf=bad_faces(V)&~bad0 if rnd==0 and False else bad_faces(V)
    if not bf.any(): break
    fr=np.zeros(n,bool); fr[F[bf].ravel()]=True
    for kk in range(int(f('HD_W_RING','4'))): fr=fr|((Aa@fr.astype(float))>0)
    fr&=(y>Y1-0.005); print(' fix round',rnd,'bad faces',int(bf.sum()),'faired verts',int(fr.sum()))
    V=bilaplace_fair(V,F,fr); V=tangential_relax(V,F,~fr,6)
    ia=np.where(fr)[0]; X=V[ia]
    for it in range(6):
        ph=samp(X); g=np.stack([samp(X,gg) for gg in gphi],1); X=X-(np.minimum(ph,0)/np.maximum((g*g).sum(1),1e-6))[:,None]*g
    V[ia]=X
print('bad faces after fix',int(bad_faces(V).sum()))
disp=V-V0p; del gphi
dm=np.linalg.norm(disp,axis=1)*1000; print('closing push: moved verts >0.2mm',int((dm>0.2).sum()),'p50/p95/max mm',np.percentile(dm[dm>0.2],[50,95,100]).round(2) if (dm>0.2).any() else '-')
for nm,c_ in (('eye L',(0.034,1.62,0.11)),('eye R',(-0.034,1.62,0.11)),('lip line',(0,1.545,0.125)),('nasolabial L',(0.025,1.56,0.11)),('under nose',(0,1.567,0.128)),('ear L',(0.08,1.627,0.016))):
    s=np.linalg.norm(Vin-np.array(c_),axis=1)<0.012; print(f'  {nm}: max push mm',dm[s].max().round(1) if s.any() else '-')
del phi,closed,occ
# ---- 3. Taubin clean-up (face strong, global light), neck below Y0 pinned
pin=y<Y0
face=sstep(1.49,1.51,y)*np.maximum(sstep(0.0,0.05,z),np.clip(ear*1.5,0,1))
V=taubin(V,F,pin,TAU_FACE,w=np.clip(face+0.0,0,1)); V=taubin(V,F,pin,TAU_ALL,w=wy)
# ---- 4. exact sagittal symmetrize
Y_SYM=f('HD_W_YSYM','1.475'); wsym=sstep(Y_SYM,Y_SYM+0.02,V[:,1])*(V[:,1]>Y0)
def closest_on_mesh(Q,V,F,tree,kk=10):
    _,cand=tree.query(Q,k=kk); best=np.full(len(Q),np.inf); bp=np.zeros_like(Q)
    for j in range(kk):
        t=F[cand[:,j]]; a,b,c=V[t[:,0]],V[t[:,1]],V[t[:,2]]; p=closest_pt_tri(Q,a,b,c); dd=((p-Q)**2).sum(1); u=dd<best; best[u]=dd[u]; bp[u]=p[u]
    return bp,np.sqrt(best)
def closest_pt_tri(p,a,b,c):   # Ericson, vectorized
    ab,ac,ap=b-a,c-a,p-a; d1=(ab*ap).sum(1); d2=(ac*ap).sum(1); bp=p-b; d3=(ab*bp).sum(1); d4=(ac*bp).sum(1); cp=p-c; d5=(ab*cp).sum(1); d6=(ac*cp).sum(1)
    va=d3*d6-d5*d4; vb=d5*d2-d1*d6; vc=d1*d4-d3*d2; den=np.where(np.abs(va+vb+vc)<1e-30,1e-30,va+vb+vc); v=vb/den; w=vc/den
    res=a+ab*v[:,None]+ac*w[:,None]
    e=(vc<=0)&(d1>=0)&(d3<=0); t=d1/np.where(d1-d3==0,1e-30,d1-d3); res[e]=(a+ab*t[:,None])[e]
    e=(vb<=0)&(d2>=0)&(d6<=0); t=d2/np.where(d2-d6==0,1e-30,d2-d6); res[e]=(a+ac*t[:,None])[e]
    e=(va<=0)&((d4-d3)>=0)&((d5-d6)>=0); t=(d4-d3)/np.where((d4-d3)+(d5-d6)==0,1e-30,(d4-d3)+(d5-d6)); res[e]=(b+(c-b)*t[:,None])[e]
    res[(d1<=0)&(d2<=0)]=a[(d1<=0)&(d2<=0)]; e=(d3>=0)&(d4<=d3); res[e]=b[e]; e=(d6>=0)&(d5<=d6); res[e]=c[e]
    return res
Mx=np.array([-1,1,1.0]); hs=V[:,1]>Y0
for it in range(int(f('HD_W_SYMIT','4'))):
    tree=cKDTree(V[F].mean(1)); q,_=closest_on_mesh(V[hs]*Mx,V,F,tree); tgt=q*Mx
    Nv=vnormals(V,F)[hs]; dl=0.5*(tgt-V[hs]); dl=Nv*np.einsum('ij,ij->i',dl,Nv)[:,None] if it<int(f('HD_W_SYMIT','4'))-1 or True else dl
    V[hs]=V[hs]+wsym[hs][:,None]*dl
mid=(np.abs(V[:,0])<2e-4)&(V[:,1]>Y1); V[mid,0]*=(1-wsym[mid])   # midline vertices exactly on x = 0
# inner mouth-cap rings (sliver fan round the cap centre): final local fair against the symmetrized surroundings, centre on x = 0
frc=np.zeros(n,bool); frc[n0+3*len(holes[0]):n0+(KR*len(holes[0])+1)]=True; V=bilaplace_fair(V,F,frc); V[n0+KR*len(holes[0]),0]=0.0
tree=cKDTree(V[F].mean(1)); s=V[:,1]>Y1; _,me=closest_on_mesh(V[s]*Mx,V,F,tree); print('mirror error y>1.50 mm: p50/p99/max',np.percentile(me*1000,[50,99,100]).round(3))
# ---- report
Nf0=np.cross(Vin[F[:,1]]-Vin[F[:,0]],Vin[F[:,2]]-Vin[F[:,0]]); Nf=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]])
flip=(np.einsum('ij,ij->i',Nf0,Nf)<0); print('tris flipped vs input (input mouth/ear caps were tangled, so informative only)',int(flip.sum()),'| zero-area',int((np.linalg.norm(Nf,axis=1)<1e-12).sum()))
Nu=Nf/np.maximum(np.linalg.norm(Nf,axis=1,keepdims=True),1e-15)
E=np.r_[F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]; fid=np.tile(np.arange(len(F)),3); key=np.sort(E,1); o=np.lexsort((key[:,1],key[:,0])); ks=key[o]
same=(ks[1:]==ks[:-1]).all(1); a_=fid[o][:-1][same]; b_=fid[o][1:][same]; dots=np.einsum('ij,ij->i',Nu[a_],Nu[b_]); yE=V[F[a_]].mean(1)[:,1]
fc=yE>1.50; ang=np.degrees(np.arccos(np.clip(dots,-1,1)))
print('dihedral y>1.50: p99 / max deg',np.percentile(ang[fc],99).round(1),ang[fc].max().round(1),'| >30deg',int((ang[fc]>30).sum()),'| whole piece >30',int((ang>30).sum()),'>120 folded',int((ang>120).sum()))
if (ang[fc]>30).any(): print('  >30 at',np.round(V[F[a_[fc&(ang>30)]]].mean(1)[:8],3).tolist())
mv=np.linalg.norm(V-Vin,axis=1)*1000; print('total move max mm',mv.max().round(1),'| y<1.47 max move mm',mv[y<Y0].max().round(4))
h['V']=V; np.savez('head_fit.npz',**h)
