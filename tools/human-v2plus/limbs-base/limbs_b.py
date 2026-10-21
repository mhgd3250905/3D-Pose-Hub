# limbs stage B: cut the fitted base arms / legs between the torso's weld rings (the same Coach_Body arm / leg rings the base torso
# is zippered to) and a wrist ring / ankle ring of Coach_Body (hand + foot stay v2), snap each cut loop onto its ring with a smooth
# bi-Laplacian displacement field, zipper to the exact ring vertices.  limbs_fit.npz + zip.npz -> limbs_zip.npz
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from scipy.sparse.csgraph import connected_components
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
d=np.load('limbs_fit.npz'); V,F=d['V'].copy(),d['F']
z=np.load('zip.npz',allow_pickle=True); tseam=z['seam']; keepB0=z['keepB']
B=P[BODY]; Fb=np.array(M[BODY]['index']).reshape(-1,3); invB,firstB=weld(B); FbW=invB[Fb]
WR=float(os.environ.get('L_WRIST','0.035'))   # wrist ring this far up the forearm from the wrist joint
AY=float(os.environ.get('L_ANKLE','0.190'))   # ankle ring height: above the v2 tights hem (toon.js uCut paints skin below rest y 0.17) and the shoe collar (0.112)
GAP=float(os.environ.get('L_GAP','0.004'))   # zipper band width
class Tube:
    def __init__(s,A,Bp,ref):
        s.A=np.array(A,float); Bp=np.array(Bp,float); s.u=(Bp-s.A)/np.linalg.norm(Bp-s.A); e0=np.array(ref,float); e0-=s.u*(e0@s.u); s.e0=e0/np.linalg.norm(e0); s.e1=np.cross(s.u,s.e0)
    def coords(s,Pt):
        dd=Pt-s.A; t=dd@s.u; rr=dd-np.outer(t,s.u); return t,np.arctan2(rr@s.e1,rr@s.e0),np.linalg.norm(rr,axis=1)
# ---- Coach_Body: hand / foot faces (kept, v2) and the limb segments between the rings (hidden in limbs mode)
hand=np.zeros(len(B),bool); foot=np.zeros(len(B),bool); tubes={}
for sgn,sd in ((1,'left'),(-1,'right')):
    tf=Tube(LM[sd+'Elbow'],LM[sd+'Wrist'],[sgn,0,0]); tubes['fore_'+sd]=tf; Lf=np.linalg.norm(LM[sd+'Wrist']-LM[sd+'Elbow'])
    t,_,r=tf.coords(B); hand|=(B[:,0]*sgn>0.10)&(B[:,1]>0.6)&(t>Lf-WR)
    foot|=(B[:,0]*sgn>0.0)&(B[:,1]<AY)
    tubes['up_'+sd]=Tube(LM[sd+'Shoulder'],LM[sd+'Elbow'],[sgn,0,0])
handF=hand[Fb].all(1); footF=foot[Fb].all(1)
# limb segment faces: Coach_Body faces kept by the torso, not hand / foot, connected (without crossing those) to the torso's arm / leg rings
cand=keepB0&~handF&~footF
nW=invB.max()+1; Ac=adjacency(nW,edges_of(FbW[cand])); _,lab=connected_components(Ac,directed=False)
rings={}
for name in ('arm_left','arm_right','leg_left','leg_right'): rings[name]=[int(s[2]) for s in tseam if s[0]==name]
segLab=set(int(lab[invB[rings[k][0]]]) for k in rings)
segF=cand&np.isin(lab[FbW[:,0]],list(segLab))
print('Coach_Body limb segment faces hidden',int(segF.sum()),'hand faces',int(handF.sum()),'foot faces',int(footF.sum()))
# bottom rings: boundary loops of the segment faces that touch the hand / foot
loops=boundary_loops_F(FbW[segF])
for sgn,sd in ((1,'left'),(-1,'right')):
    lw=[l for l in loops if len(l)>12 and abs(B[firstB[l]][:,1].mean()-LM[sd+'Wrist'][1])<0.08 and B[firstB[l]][:,0].mean()*sgn>0.15]
    la=[l for l in loops if len(l)>12 and B[firstB[l]][:,1].mean()<AY+0.03 and B[firstB[l]][:,0].mean()*sgn>0.0]
    assert len(lw)==1 and len(la)==1, (sd,[len(l) for l in lw],[len(l) for l in la])
    rings['wrist_'+sd]=[int(firstB[i]) for i in lw[0]]; rings['ankle_'+sd]=[int(firstB[i]) for i in la[0]]
print({k:len(v) for k,v in rings.items()})
# ---- cut the base limbs
rm=np.zeros(len(V),bool); Nv=vnormals(V,F)
def angle_interp(tb,X,L,useT=True):
    tl,pl,_=tb.coords(B[L]); o=np.argsort(pl); t,ph,r=tb.coords(X); return t,np.interp(ph,pl[o],tl[o],period=2*np.pi),r
for sgn,sd in ((1,'left'),(-1,'right')):
    side=V[:,0]*sgn>0
    t,tl,r=angle_interp(tubes['up_'+sd],V,rings['arm_'+sd]); rm|=side&(V[:,1]>0.8)&(r<0.10)&(t<tl+0.004)
    t,tl,r=angle_interp(tubes['fore_'+sd],V,rings['wrist_'+sd]); rm|=side&(V[:,1]>0.7)&(t>tl-0.004)
    ty=Tube([0.082*sgn,0.6,0],[0.082*sgn,0.0,0],[sgn,0,0])
    t,tl,r=angle_interp(ty,V,rings['leg_'+sd]); rm|=side&(V[:,1]<0.75)&(t<tl+0.004)
    t,tl,r=angle_interp(ty,V,rings['ankle_'+sd]); rm|=side&(V[:,1]<0.75)&(t>tl-0.004)
keepF=~rm[F].any(1); V1,F1,_=compact(V,F,keepF)
lab1=components(len(V1),F1); cnt=np.bincount(lab1); big=np.argsort(-cnt)[:4]; V1,F1,_=compact(V1,F1,np.isin(lab1[F1[:,0]],big))
print('components kept',cnt[big])
loopsA=boundary_loops_F(F1); print('cut loops',sorted(len(l) for l in loopsA))
# ---- snap loops onto rings (polar angle about the limb axis), smooth field over ~16 rings
n=len(V1); A1=adjacency(n,edges_of(F1)); deg1=np.asarray(A1.sum(1)).ravel(); L1=(sp.diags(1/deg1)@A1-sp.eye(n)).tocsr()
fixed=np.zeros(n,bool); Dfix=np.zeros((n,3)); match={}
for name,L in rings.items():
    PT=B[L]; cT=PT.mean(0)
    li=min(range(len(loopsA)),key=lambda k:np.linalg.norm(V1[loopsA[k]].mean(0)-cT)); LA=list(loopsA[li]); match[name]=li; PA=V1[LA]
    sd=name.split('_')[1]; ax=tubes['up_'+sd].u if name.startswith('arm') else tubes['fore_'+sd].u if name.startswith('wrist') else np.array([0,1.0,0])
    e0=np.cross(ax,[0,0,1.0]); e0/=np.linalg.norm(e0); e1=np.cross(ax,e0)
    ang=lambda X: np.arctan2((X-cT)@e1,(X-cT)@e0)
    wind=lambda a: np.sign(np.sum((np.diff(np.r_[a,a[:1]])+np.pi)%(2*np.pi)-np.pi))
    if wind(ang(PA))!=wind(ang(PT)): L=L[::-1]; rings[name]=L; PT=B[L]
    aT=ang(PT); o=np.argsort(aT); aA=ang(PA)
    tgt=np.stack([np.interp(aA,aT[o],PT[o][:,c],period=2*np.pi) for c in range(3)],1)
    # stop GAP short of the ring, on the base side, so the zipper strip is a real band (snapping onto the ring polyline itself gives
    # zero-width strips whose triangles flip: dark jagged line at the leg ring)
    into=ax*(1.0 if name.startswith(('arm','leg')) else -1.0)*(-1.0 if name.startswith(('leg','ankle')) else 1.0)
    tgt=tgt+GAP*into
    fixed[LA]=True; Dfix[LA]=tgt-PA
    print(name,'loop',len(LA),'ring',len(L),'snap mean/max mm',(np.linalg.norm(tgt-PA,axis=1).mean()*1000).round(1),(np.linalg.norm(tgt-PA,axis=1).max()*1000).round(1))
ring=np.full(n,999); ring[fixed]=0; fr=fixed.copy()
for k in range(1,40):
    nb=(A1@fr.astype(float))>0; new=nb&(ring==999); ring[new]=k; fr=new
far=ring>=16; fx=fixed|far; Dfix[far]=0
fi=np.where(~fx)[0]; xi=np.where(fx)[0]; Q=(L1.T@L1).tocsr()
Dv=np.zeros((n,3)); Dv[fx]=Dfix[fx]; rhs=-Q[fi][:,xi]@Dfix[xi]; Qff=Q[fi][:,fi].tocsc()
for c in range(3): Dv[fi,c]=spsolve(Qff,rhs[:,c])
V1=V1+Dv
Vall=[V1]; Fall=[F1]; seam=[]; off=n
for name,L in rings.items():
    LA=loopsA[match[name]]; PA=V1[LA]; PT=B[L]
    Zt=zipper(PA,PT); Zg=np.where(Zt<len(LA),np.array(LA)[np.minimum(Zt,len(LA)-1)],off+Zt-len(LA))
    Vall.append(PT); Fall.append(Zg[:,[0,2,1]]); seam+=[(name,BODY,int(v)) for v in L]; off+=len(L)
V2=np.vstack(Vall); F2=np.vstack(Fall)
# orientation check: zipper faces must agree with neighbouring base faces (outward normals)
Nf=np.cross(V2[F2[:,1]]-V2[F2[:,0]],V2[F2[:,2]]-V2[F2[:,0]])
loops2=boundary_loops_F(F2); print('after zipper boundary loops',[len(l) for l in loops2],'verts',len(V2),'faces',len(F2))
np.savez('limbs_zip.npz',V=V2,F=F2,nMC=n,seam=np.array(seam,dtype=object),segF=segF,keepB0=keepB0,ring=ring)
