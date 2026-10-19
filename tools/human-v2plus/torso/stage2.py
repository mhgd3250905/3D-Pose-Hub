import sys
from common import *
from meshops import *
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter1d
import stage1lib as S1
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
d=np.load('raw.npz'); V,F=d['V'],d['F']
LM=rest['landmarks']
# ---------- tee yoke ----------
teeLoops=boundary_loops(TEE); neck=max(teeLoops,key=lambda L:P[TEE][L][:,1].mean())
NL=P[TEE][neck]; seg=[]
for a,b in zip(NL,np.roll(NL,-1,0)):
    for s in np.linspace(0,1,8,endpoint=False): seg.append(a+(b-a)*s)
treeN=cKDTree(np.array(seg))
def yoke_g(Pt):
    D=0.034-0.008*sstep(0.10,0.16,np.abs(Pt[:,0])); return D-treeN.query(Pt)[0]
Ft=np.array(M[TEE]['index']).reshape(-1,3); invT,firstT=weld(P[TEE]); gT=yoke_g(P[TEE])
keepT=(gT[Ft]>=0).all(1)
# component containing the neckline
lab=components(len(P[TEE]),invT[Ft][keepT]) if False else None
Fw=invT[Ft]; nW=invT.max()+1
from scipy.sparse.csgraph import connected_components
Ek=edges_of(Fw[keepT]); A=adjacency(nW,Ek); _,labc=connected_components(A,directed=False)
neckW=invT[neck]; cl=np.bincount(labc[neckW]).argmax(); keepT&=(labc[Fw[:,0]]==cl)
loopsK=boundary_loops_F(Fw[keepT]); yokeLoopW=min(loopsK,key=lambda L:np.mean([P[TEE][firstT[i]][1] for i in L]))
yokeLoop=[int(firstT[i]) for i in yokeLoopW]
print('tee kept faces',keepT.sum(),'of',len(Ft),'yoke loop',len(yokeLoop),'loops',[len(l) for l in loopsK])
# ---------- cut the MC surface ----------
rm=yoke_g(V)>-0.004
TCUT=S1.TCUT
Fb=np.array(M[BODY]['index']).reshape(-1,3); invB,firstB=weld(P[BODY]); FbW=invB[Fb]
hidB=np.zeros(len(P[BODY]),bool); armTubes={}
for sgn,sd in ((1,'left'),(-1,'right')):
    tb=S1.Tube(LM[sd+'Shoulder'],LM[sd+'Elbow'],[sgn,0,0]); armTubes[sd]=tb
    t,ph,r=tb.coords(P[BODY]); hidB|=(P[BODY][:,0]*sgn>0.10)&(P[BODY][:,1]>1.0)&(t<TCUT)&(r<0.10)
keepB=~hidB[Fb].all(1)
loopsB=boundary_loops_F(FbW[keepB])
targets={'yoke':(TEE,yokeLoop)}
for sgn,sd in ((1,'left'),(-1,'right')):
    tb=armTubes[sd]
    cand=[l for l in loopsB if len(l)>20 and P[BODY][firstB[l]][:,0].mean()*sgn>0.12 and P[BODY][firstB[l]][:,1].mean()>1.0]
    L=[int(firstB[i]) for i in max(cand,key=len)]; targets['arm_'+sd]=(BODY,L)
    tl,pl,rl=tb.coords(P[BODY][L]); o=np.argsort(pl)
    t,ph,r=tb.coords(V); tloop=np.interp(ph,pl[o],tl[o],period=2*np.pi)
    Ea=S1.arm[sd][2]; TSa=S1.arm[sd][1]; Rs=S1.tube_eval(Ea,TSa,0.005,t,ph)
    rm|=(V[:,0]*sgn>0.10)&(r<Rs+0.005)&(t>0.02)&(t>tloop-0.004)
    print(sd,'arm loop',len(L),'t range',tl.min().round(3),tl.max().round(3))
bodyLoops=[L for L in boundary_loops(BODY) if len(L)>20]
for sgn,sd in ((1,'left'),(-1,'right')):
    Lg=[l for l in bodyLoops if len(l)==28 and P[BODY][l][:,0].mean()*sgn>0][0]; targets['leg_'+sd]=(BODY,Lg)
    yl=P[BODY][Lg][:,1].mean()
    rm|=(V[:,0]*sgn>-0.005)&(V[:,1]<yl+0.004)
keepF=~rm[F].any(1)
V1,F1,_=compact(V,F,keepF)
lab=components(len(V1),F1); big=np.bincount(lab).argmax(); V1,F1,_=compact(V1,F1,lab[F1[:,0]]==big)
loops=boundary_loops_F(F1); print('MC boundary loops',[len(l) for l in loops])
# ---------- zipper ----------
nMC=len(V1); Vall=[V1]; Fall=[F1]; seam=[]; off=nMC
for name,(mesh,L) in targets.items():
    PT=P[mesh][L]; cT=PT.mean(0)
    li=min(range(len(loops)),key=lambda k:np.linalg.norm(V1[loops[k]].mean(0)-cT)); LA=loops[li]
    PA=V1[LA]
    if not orient_like(PA,PT): L=L[::-1]; PT=P[mesh][L]
    Z=zipper(PA,PT)
    Zg=np.where(Z<len(LA),np.array(LA)[np.minimum(Z,len(LA)-1)],off+Z-len(LA))
    Vall.append(PT); Fall.append(Zg[:,[0,2,1]]); seam+= [(name,mesh,int(v)) for v in L]; off+=len(L)
    print(name,'loop',len(LA),'target',len(L),'gap mm mean',round(float(np.linalg.norm(PA.mean(0)-cT))*1000,1))
V2=np.vstack(Vall); F2=np.vstack(Fall)
np.savez('zip.npz',V=V2,F=F2,nMC=nMC,seam=np.array([(s[0],s[1],s[2]) for s in seam],dtype=object),keepT=keepT,keepB=keepB)
loops2=boundary_loops_F(F2); print('after zipper boundary loops',[len(l) for l in loops2], 'verts',len(V2),'faces',len(F2))
