# stage B: cut the fitted base torso under the kept tee collar band, at the arm weld ring (v2 arm skin, t=TCUT from the shoulder)
# and at the leg skin top; snap each cut loop onto its ring with a smooth (bi-Laplacian) displacement field; zipper the loops
# to the exact ring vertices of the existing meshes.  fit.npz -> zip.npz
import sys
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from scipy.spatial import cKDTree
from scipy.sparse.csgraph import connected_components
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
TCUT=0.170
d=np.load('fit.npz'); V,F=d['V'].copy(),d['F']
n0=len(V); E=edges_of(F); A=adjacency(n0,E); deg=np.asarray(A.sum(1)).ravel()
# ---- crotch: the base mesh is anatomically male; under compression tights the genital bulge is smoothed into a membrane
x,y,z=V[:,0],V[:,1],V[:,2]
wc=(1-sstep(0.035,0.075,np.abs(x)))*sstep(0.70,0.745,y)*(1-sstep(0.86,0.90,y))*sstep(-0.01,0.03,z)
Vs=V.copy()
for it in range(400):
    Lp=A@Vs/deg[:,None]-Vs; Vs=Vs+0.5*wc[:,None]*Lp
V=Vs
# ---- tee yoke (kept collar band), as in the sculpted-torso build
teeLoops=boundary_loops(TEE); neck=max(teeLoops,key=lambda L:P[TEE][L][:,1].mean())
NL=P[TEE][neck]; seg=[]
for a,b in zip(NL,np.roll(NL,-1,0)):
    for s in np.linspace(0,1,8,endpoint=False): seg.append(a+(b-a)*s)
treeN=cKDTree(np.array(seg))
def yoke_g(Pt):
    D=0.034-0.008*sstep(0.10,0.16,np.abs(Pt[:,0])); return D-treeN.query(Pt)[0]
Ft=np.array(M[TEE]['index']).reshape(-1,3); invT,firstT=weld(P[TEE]); gT=yoke_g(P[TEE])
keepT=(gT[Ft]>=0).all(1); Fw=invT[Ft]; nW=invT.max()+1
Ek=edges_of(Fw[keepT]); Ak=adjacency(nW,Ek); _,labc=connected_components(Ak,directed=False)
neckW=invT[neck]; cl=np.bincount(labc[neckW]).argmax(); keepT&=(labc[Fw[:,0]]==cl)
loopsK=boundary_loops_F(Fw[keepT]); yokeLoopW=min(loopsK,key=lambda L:np.mean([P[TEE][firstT[i]][1] for i in L]))
yokeLoop=[int(firstT[i]) for i in yokeLoopW]
print('tee kept faces',keepT.sum(),'of',len(Ft),'yoke loop',len(yokeLoop))
# ---- Coach_Body arm skin hidden above the weld ring (it flares into the loose tee there)
class Tube:
    def __init__(s,A,B,ref):
        s.A=np.array(A,float); B=np.array(B,float); s.u=(B-s.A)/np.linalg.norm(B-s.A); e0=np.array(ref,float); e0-=s.u*(e0@s.u); s.e0=e0/np.linalg.norm(e0); s.e1=np.cross(s.u,s.e0)
    def coords(s,Pt):
        d=Pt-s.A; t=d@s.u; rr=d-np.outer(t,s.u); return t,np.arctan2(rr@s.e1,rr@s.e0),np.linalg.norm(rr,axis=1)
Fb=np.array(M[BODY]['index']).reshape(-1,3); invB,firstB=weld(P[BODY]); FbW=invB[Fb]
hidB=np.zeros(len(P[BODY]),bool); armTubes={}
for sgn,sd in ((1,'left'),(-1,'right')):
    tb=Tube(LM[sd+'Shoulder'],LM[sd+'Elbow'],[sgn,0,0]); armTubes[sd]=tb
    t,ph,r=tb.coords(P[BODY]); hidB|=(P[BODY][:,0]*sgn>0.10)&(P[BODY][:,1]>1.0)&(t<TCUT)&(r<0.10)
keepB=~hidB[Fb].all(1)
loopsB=boundary_loops_F(FbW[keepB])
targets={'yoke':(TEE,yokeLoop)}
rm=yoke_g(V)>-0.004
rm|=(V[:,1]>1.40)&(np.abs(V[:,0])<0.09)&(yoke_g(V)>-0.03)     # neck column inside the collar
for sgn,sd in ((1,'left'),(-1,'right')):
    tb=armTubes[sd]
    cand=[l for l in loopsB if len(l)>20 and P[BODY][firstB[l]][:,0].mean()*sgn>0.12 and P[BODY][firstB[l]][:,1].mean()>1.0]
    L=[int(firstB[i]) for i in max(cand,key=len)]; targets['arm_'+sd]=(BODY,L)
    tl,pl,rl=tb.coords(P[BODY][L]); o=np.argsort(pl)
    t,ph,r=tb.coords(V); tloop=np.interp(ph,pl[o],tl[o],period=2*np.pi)
    Nv=vnormals(V,F); radd=(V-tb.A)-np.outer(t,tb.u); radd/=np.maximum(np.linalg.norm(radd,axis=1,keepdims=True),1e-9)
    facing=np.einsum('ij,ij->i',Nv,radd)
    rm|=(V[:,0]*sgn>0.10)&(r<0.085)&(t>0.02)&(t>tloop-0.004)&(facing>-0.2)
    print(sd,'arm loop',len(L),'t range',tl.min().round(3),tl.max().round(3))
bodyLoops=[L for L in boundary_loops(BODY) if len(L)>20]
for sgn,sd in ((1,'left'),(-1,'right')):
    Lg=[l for l in bodyLoops if len(l)==28 and P[BODY][l][:,0].mean()*sgn>0][0]; targets['leg_'+sd]=(BODY,Lg)
    yl=P[BODY][Lg][:,1].mean()
    rm|=(V[:,0]*sgn>-0.005)&(V[:,1]<yl+0.004)
keepF=~rm[F].any(1)
V1,F1,_=compact(V,F,keepF)
lab=components(len(V1),F1); big=np.bincount(lab).argmax(); V1,F1,_=compact(V1,F1,lab[F1[:,0]]==big)
loops=boundary_loops_F(F1); print('cut boundary loops',sorted([len(l) for l in loops]))
# ---- snap each cut loop onto its ring: arc-length matched targets, smooth displacement field (zero beyond ~16 rings)
n=len(V1); E1=edges_of(F1); A1=adjacency(n,E1); deg1=np.asarray(A1.sum(1)).ravel()
L1=(sp.diags(1/deg1)@A1-sp.eye(n)).tocsr()
fixed=np.zeros(n,bool); Dfix=np.zeros((n,3)); match={}
def arclen(Pl): s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(np.vstack([Pl,Pl[:1]]),axis=0),axis=1))]; return s/s[-1]
for name,(mesh,L) in targets.items():
    PT=P[mesh][L]; cT=PT.mean(0)
    li=min(range(len(loops)),key=lambda k:np.linalg.norm(V1[loops[k]].mean(0)-cT)); LA=list(loops[li]); match[name]=li
    PA=V1[LA]
    # target by polar angle about the ring centre (plane normal = limb axis / y), robust to uneven loop sampling
    ax=armTubes[name[4:]].u if name.startswith('arm') else np.array([0,1.0,0])
    e0=np.cross(ax,[0,0,1.0]) if abs(ax[2])<0.9 else np.cross(ax,[1.0,0,0]); e0/=np.linalg.norm(e0); e1=np.cross(ax,e0)
    ang=lambda X: np.arctan2((X-cT)@e1,(X-cT)@e0)
    wind=lambda a: np.sign(np.sum((np.diff(np.r_[a,a[:1]])+np.pi)%(2*np.pi)-np.pi))
    if wind(ang(PA))!=wind(ang(PT)): L=L[::-1]; targets[name]=(mesh,L); PT=P[mesh][L]
    print(name,'winding',wind(ang(PA)),wind(ang(PT)))
    aT=ang(PT); o=np.argsort(aT); aA=ang(PA)
    tgt=np.stack([np.interp(aA,aT[o],PT[o][:,c],period=2*np.pi) for c in range(3)],1)
    dd_=np.linalg.norm(tgt-PA,axis=1)
    if dd_.max()>0.03: print('  far snaps',name,[(PA[i].round(3).tolist(),round(float(np.degrees(aA[i])),1)) for i in np.argsort(-dd_)[:4]], 'ring y',PT[:,1].min().round(3),PT[:,1].max().round(3),'loop y',PA[:,1].min().round(3),PA[:,1].max().round(3))
    fixed[LA]=True; Dfix[LA]=tgt-PA
    print(name,'centres',PA.mean(0).round(3),cT.round(3),'mean radius',np.linalg.norm(PA-PA.mean(0),axis=1).mean().round(3),np.linalg.norm(PT-cT,axis=1).mean().round(3))
    print(name,'loop',len(LA),'ring',len(L),'snap mean/max mm',(np.linalg.norm(tgt-PA,axis=1).mean()*1000).round(1),(np.linalg.norm(tgt-PA,axis=1).max()*1000).round(1))
ring=np.full(n,999); ring[fixed]=0; fr=fixed.copy()
for k in range(1,40):
    nb=(A1@fr.astype(float))>0; new=nb&(ring==999); ring[new]=k; fr=new
far=ring>=16; fx=fixed|far; Dfix[far]=0
free=~fx; Q=(L1.T@L1).tocsr(); fi=np.where(free)[0]; xi=np.where(fx)[0]
Dv=np.zeros((n,3)); Dv[fx]=Dfix[fx]
rhs=-Q[fi][:,xi]@Dfix[xi]; Qff=Q[fi][:,fi].tocsc()
for c in range(3): Dv[fi,c]=spsolve(Qff,rhs[:,c])
V1=V1+Dv
# ---- zipper the snapped loops to the exact ring vertices
nB=len(V1); Vall=[V1]; Fall=[F1]; seam=[]; off=nB
for name,(mesh,L) in targets.items():
    LA=loops[match[name]]; PA=V1[LA]; PT=P[mesh][L]
    Z=zipper(PA,PT)
    Zg=np.where(Z<len(LA),np.array(LA)[np.minimum(Z,len(LA)-1)],off+Z-len(LA))
    Vall.append(PT); Fall.append(Zg[:,[0,2,1]]); seam+=[(name,mesh,int(v)) for v in L]; off+=len(L)
V2=np.vstack(Vall); F2=np.vstack(Fall)
# drop zero-area slivers (snapped base loop vertex coincides with the ring)
ar=np.linalg.norm(np.cross(V2[F2[:,1]]-V2[F2[:,0]],V2[F2[:,2]]-V2[F2[:,0]]),axis=1)
print('zipper faces',sum(len(f) for f in Fall[1:]),'tiny',int((ar<1e-9).sum()))
np.savez('zip.npz',V=V2,F=F2,nMC=nB,seam=np.array(seam,dtype=object),keepT=keepT,keepB=keepB)
loops2=boundary_loops_F(F2); print('after zipper boundary loops',[len(l) for l in loops2],'verts',len(V2),'faces',len(F2))
