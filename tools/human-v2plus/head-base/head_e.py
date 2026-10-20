# head stage E (M10c): faceless egg mannequin head — head_fit.npz -> head_fit.npz (in place; runs when HD_FACE=egg, the default)
#  The whole head above Y_C (just under the jaw) is replaced by an analytic surface; the base neck below Y_C (weld loop, collar band,
#  trapezius) is kept untouched.
#  Implicit: smooth union (polynomial smin, K_U) of
#    egg  : tilted ovoid (long axis leaning back TILT deg, semi-axes AX / AY / AZ, horizontal taper 1 + TAPER * y'/AY: narrower toward
#           the chin), scaled to an approximate distance; centre height solved so the crown matches the old top of head
#    neck : r - r_neck(y, a) about the vertical neck axis; r_neck = the base neck's own radial profile (binned, x-mirrored, smoothed) up
#           to Y_C, continued above Y_C by a cubic Hermite (value + slope at Y_C -> slim neck ellipse at Y_T, slope 0), faded out inside the
#           egg by + NECK_P * max(y - Y_P, 0)^2 (C1, no crease)
#  Mesh: per azimuth (NA, mirror-symmetric set: a_j = 2 pi j / NA, NA % 4 == 0) a meridian is ray-cast from an inner centre on the neck
#  axis (bisection), cut exactly at Y_C, and resampled by arc length to NR rows (crown pole -> Y_C); quads split with mirrored diagonals,
#  vertices of the x<0 half copied from the x>0 half (exact sagittal symmetry). Seam: kept base faces (all verts y < Y_C) zipped to the
#  bottom row (base cut exactly on the Y_C plane; grid bottom rows faded onto the real contour, FADE rows; no fairing needed).
import os, numpy as np
from meshops import *
FACE=os.environ.get('HD_FACE','egg') if os.environ.get('HD_MANNEQUIN','1')!='0' else 'detail'
if FACE!='egg': print('egg head: off, HD_FACE =',FACE); raise SystemExit
f=lambda k,d: float(os.environ.get(k,d))
Y_C=f('HD_E_YC','1.46'); Y_T=f('HD_E_YT','1.515'); K_U=f('HD_E_KU','0.03'); TILT=np.radians(f('HD_E_TILT','28'))
AX,AY,AZ=f('HD_E_AX','0.076'),f('HD_E_AY','0.124'),f('HD_E_AZ','0.096'); TAPER=f('HD_E_TAPER','0.16'); CZ=f('HD_E_CZ','0.03')
NRX,NRZF,NRZB=f('HD_E_NRX','0.056'),f('HD_E_NRZF','0.056'),f('HD_E_NRZB','0.050')   # slim neck ellipse at Y_T (side, front, back)
GAP_E=f('HD_E_GAP','0.003'); Y_P=f('HD_E_YP','1.53'); NECK_P=f('HD_E_NECKP','20'); NA=int(f('HD_E_NA','192')); NR=int(f('HD_E_NR','128')); assert NA%4==0
h=dict(np.load('head_fit.npz')); V0=h['V'].astype(float); F0=h['F']; LA0=np.array(h['LA'])
TOP=f('HD_E_TOP',str(V0[:,1].max()))
# ---- neck radial profile r_m(y, a) from the base neck (y < Y_C + 1 cm), mirrored in x
YB=0.0025; ys=np.arange(1.40,Y_C+0.0001,YB); NB=144
ang=lambda x,z: np.arctan2(z,x)
S=V0[(V0[:,1]>ys[0]-0.004)&(V0[:,1]<Y_C+0.004)]; S=np.r_[S,S*np.array([-1,1,1])]
r_m=np.full((len(ys),NB),np.nan); yi=np.clip(np.round((S[:,1]-ys[0])/YB).astype(int),0,len(ys)-1)
ai=np.floor((ang(S[:,0],S[:,2])+np.pi)/(2*np.pi)*NB).astype(int)%NB; rS=np.hypot(S[:,0],S[:,2])
for i,j,r in zip(yi,ai,rS):
    if not (r_m[i,j]>=r): r_m[i,j]=r
for it in range(80):
    m=np.isnan(r_m)
    if not m.any(): break
    nb=np.nanmean(np.stack([np.roll(r_m,1,1),np.roll(r_m,-1,1),np.r_[r_m[1:],r_m[-1:]],np.r_[r_m[:1],r_m[:-1]]]),0); r_m[m]=nb[m]
for it in range(4): r_m=(np.roll(r_m,1,1)+2*r_m+np.roll(r_m,-1,1))/4
for it in range(2): r_m=np.r_[r_m[:1],(r_m[:-2]+2*r_m[1:-1]+r_m[2:])/4,r_m[-1:]]
aB=(np.arange(NB)+0.5)/NB*2*np.pi-np.pi
r_m=0.5*(r_m+r_m[:,np.argmin(np.abs(((np.pi-aB[:,None])-aB[None]+np.pi)%(2*np.pi)-np.pi),1)])   # exact x-mirror (a -> pi - a)
r0=r_m[-1]; dr0=(r_m[-1]-r_m[-7])/(6*YB)                              # value / slope at Y_C (slope over the last 1.5 cm)
rt=1/np.sqrt((np.cos(aB)/NRX)**2+(np.sin(aB)/np.where(np.sin(aB)>0,NRZF,NRZB))**2)
def interp_a(tab,a):   # periodic linear interpolation over the NB angle bins; tab (..., NB)
    fa=(a+np.pi)/(2*np.pi)*NB-0.5; a0=np.floor(fa).astype(int); t=fa-a0
    return tab[...,a0%NB]*(1-t)+tab[...,(a0+1)%NB]*t
def r_neck(y,a):
    fy=np.clip((y-ys[0])/YB,0,len(ys)-1.0001); y0=np.floor(fy).astype(int); ty=fy-y0
    fa=(a+np.pi)/(2*np.pi)*NB-0.5; a0=np.floor(fa).astype(int); ta=fa-a0; g=lambda yy,aa: r_m[yy,aa%NB]
    low=(g(y0,a0)*(1-ta)+g(y0,a0+1)*ta)*(1-ty)+(g(y0+1,a0)*(1-ta)+g(y0+1,a0+1)*ta)*ty
    u=np.clip((y-Y_C)/(Y_T-Y_C),0,1); H=Y_T-Y_C; R0=interp_a(r0,a); D0=interp_a(dr0,a)*H; R1=interp_a(rt,a)
    hi=(2*u**3-3*u**2+1)*R0+(u**3-2*u**2+u)*D0+(-2*u**3+3*u**2)*R1
    return np.where(y<=Y_C,low,hi)
ct,st=np.cos(TILT),np.sin(TILT)
def d_egg(P,cy):
    dy=P[...,1]-cy; dz=P[...,2]-CZ; yp=ct*dy-st*dz; zp=st*dy+ct*dz; s=np.clip(1+TAPER*yp/AY,0.6,1.4)
    q=np.sqrt((P[...,0]/(AX*s))**2+(zp/(AZ*s))**2+(yp/AY)**2); return (q-1)*0.09
def smin(a,b,k): hh=np.clip(0.5+0.5*(b-a)/k,0,1); return b*(1-hh)+a*hh-k*hh*(1-hh)
def Ffun(P,cy):
    r=np.hypot(P[...,0],P[...,2]); a=ang(P[...,0],P[...,2]); dn=r-r_neck(P[...,1],a)+NECK_P*np.maximum(P[...,1]-Y_P,0)**2   # C1 fade-out inside the egg (a hard cap made a crease via smin)
    return smin(d_egg(P,cy),dn,K_U)
# crown height: solve cy so the egg's top matches TOP (top of the tilted egg, sampled on the sagittal plane)
def egg_top(cy):
    zz=np.linspace(-0.12,0.16,561); yy=np.linspace(cy,cy+0.2,801); Z,Y=np.meshgrid(zz,yy); P=np.stack([0*Z,Y,Z],-1)
    ins=d_egg(P,cy)<0; return Y[ins].max()
cy=1.61
for it in range(3): cy+=TOP-egg_top(cy)
# ---- meridians: the F = 0 contour in the half-plane of azimuth a (marching squares on an R_GRID grid over (r, y)), from the crown
# (r = 0) down to Y_C (works for the non-star-shaped jaw / under-chin / trapezius parts)
from skimage.measure import find_contours
RG=f('HD_E_GRID','0.0004'); rr_=np.arange(0,0.17,RG); yy_=np.arange(Y_C-0.006,TOP+0.01,RG); RR,YY=np.meshgrid(rr_,yy_)
def meridian(a):
    P=np.stack([RR*np.cos(a),YY,RR*np.sin(a)],-1); Fv=Ffun(P,cy)
    cs=find_contours(Fv,0.0); c=max(cs,key=len); Q=np.stack([np.interp(c[:,1],np.arange(len(rr_)),rr_),np.interp(c[:,0],np.arange(len(yy_)),yy_)],1)
    if Q[0,1]<Q[-1,1]: Q=Q[::-1]
    YE=Y_C+GAP_E; Q[0,0]=0.0; k=np.argmax(Q[:,1]<YE); t=(Q[k-1,1]-YE)/(Q[k-1,1]-Q[k,1]); end=Q[k-1]+(Q[k]-Q[k-1])*t; end[1]=YE
    Q=np.r_[Q[:k],end[None]]; ns=int((np.diff(np.sign(np.diff(Q[:,1])))!=0).sum())   # y-direction reversals (folds of the profile)
    return np.stack([Q[:,0]*np.cos(a),Q[:,1],Q[:,0]*np.sin(a)],1),ns
aj=2*np.pi*np.arange(NA)/NA; G=np.zeros((NR+1,NA,3)); multi=0
mir=lambda j: (NA//2-j)%NA
half=[j for j in range(NA) if np.cos(aj[j])>1e-9 or abs(np.cos(aj[j]))<1e-9]   # x >= 0 (incl. front / back meridians)
for j in half:
    Q,ns=meridian(aj[j]); multi=max(multi,ns)
    sl=np.r_[0,np.cumsum(np.linalg.norm(np.diff(Q,axis=0),axis=1))]; t=np.linspace(0,sl[-1],NR+1)
    G[:,j]=np.stack([np.interp(t,sl,Q[:,c]) for c in range(3)],1)
    if abs(np.cos(aj[j]))<1e-9: G[:,j,0]=0
for j in range(NA):
    if j not in half: G[:,j]=G[:,mir(j)]*np.array([-1,1,1])
G[0,:]=np.array([0,G[0,:,1].mean(),G[0,:,2].mean()])
print('egg: cy',round(cy,4),'max profile y-reversals',multi)
# grid mesh: pole vertex + NR rows x NA
Vg=np.r_[G[0,:1],G[1:].reshape(-1,3)]; idx=lambda i,j: 0 if i==0 else 1+(i-1)*NA+(j%NA)
Fg=[]
for j in range(NA): Fg.append((0,idx(1,j+1),idx(1,j)))
for i in range(1,NR):
    for j in range(NA):
        a,b,c,d=idx(i,j),idx(i,j+1),idx(i+1,j+1),idx(i+1,j)
        xm=np.cos((aj[j]+np.pi/NA))
        Fg+= [(a,b,c),(a,c,d)] if xm>0 else [(a,b,d),(b,c,d)]
Fg=np.array(Fg)
Ng=np.cross(Vg[Fg[:,1]]-Vg[Fg[:,0]],Vg[Fg[:,2]]-Vg[Fg[:,0]]); cen=np.array([0,cy,0.02])
if np.einsum('ij,ij->i',Ng,Vg[Fg].mean(1)-cen).mean()<0: Fg=Fg[:,[0,2,1]]
# ---- keep the base neck below Y_C: exact plane slice (crossing triangles split on their edges; verts within HD_E_SNAP (0.4 mm) snapped onto the
# plane first, no slivers), so the top loop is the base surface's own Y_C contour
Vs=V0.copy(); nearp=np.abs(Vs[:,1]-Y_C)<f('HD_E_SNAP','0.0004'); Vs[nearp,1]=Y_C
below=Vs[:,1]<=Y_C+1e-12; on=np.abs(Vs[:,1]-Y_C)<1e-12
Fb=F0[below[F0].all(1)]; cross=F0[below[F0].any(1)&~below[F0].all(1)]
ekey={}; newP=[]
def cut(i,j):
    if on[i]: return i
    k=(min(i,j),max(i,j))
    if k not in ekey:
        t=(Y_C-Vs[i,1])/(Vs[j,1]-Vs[i,1]); ekey[k]=len(Vs)+len(newP); newP.append(Vs[i]+(Vs[j]-Vs[i])*t)
    return ekey[k]
extra=[]
for tri in cross:
    bl=below[tri]
    if bl.sum()==1:   # one vertex below: small triangle
        k=int(np.argmax(bl)); a0,a1,a2=tri[k],tri[(k+1)%3],tri[(k+2)%3]
        if on[a0]: continue
        extra.append((a0,cut(a0,a1),cut(a0,a2)))
    else:             # two below: quad -> 2 triangles
        k=int(np.argmin(bl)); a0,a1,a2=tri[k],tri[(k+1)%3],tri[(k+2)%3]; p1,p2=cut(a1,a0),cut(a2,a0)
        extra+= [(a1,a2,p2),(a1,p2,p1)]
Vs=np.r_[Vs,np.array(newP)]; Fk=np.r_[Fb,np.array(extra,int).reshape(-1,3)]; Fk=Fk[(Fk[:,0]!=Fk[:,1])&(Fk[:,1]!=Fk[:,2])&(Fk[:,0]!=Fk[:,2])]
Vk,Fk,used=compact(Vs,Fk,np.ones(len(Fk),bool)); lab=components(len(Vk),Fk); big=np.argmax(np.bincount(lab)); Vk,Fk,u2=compact(Vk,Fk,lab[Fk[:,0]]==big)
nk=len(Vk)
from scipy.spatial import cKDTree
dLA,LA=cKDTree(Vk).query(V0[LA0]); assert dLA.max()<1e-9, dLA.max()
loops=sorted(boundary_loops_F(Fk),key=lambda l:-np.mean(Vk[l,1])); top=np.array(loops[0]); assert not set(top.tolist())&set(LA.tolist())
print('kept base neck verts',nk,'faces',len(Fk),'| top loop',len(top),'y range',Vk[top,1].min().round(5),Vk[top,1].max().round(5),'| loops',[len(l) for l in loops])
# grid bottom correction: per azimuth radial offset of the real contour vs the analytic r_neck(Y_C), faded up the grid over FADE rows
FADE=int(f('HD_E_FADE','14')); al=np.arctan2(Vk[top,2],Vk[top,0]); rl=np.hypot(Vk[top,0],Vk[top,2]); o_=np.argsort(al)
dr=np.interp(aj,al[o_],rl[o_],period=2*np.pi)-r_neck(np.full(NA,Y_C),(aj+np.pi)%(2*np.pi)-np.pi)
print('contour vs analytic r at Y_C mm: p5/p50/p95',np.percentile(dr*1000,[5,50,95]).round(2),'maxabs',np.abs(dr*1000).max().round(2))
for i in range(max(1,NR-FADE),NR+1):
    w=((i-(NR-FADE))/FADE); w=w*w*(3-2*w); rows=np.array([idx(i,j) for j in range(NA)]); Vg[rows,0]+=w*dr*np.cos(aj); Vg[rows,2]+=w*dr*np.sin(aj)
bot=np.array([idx(NR,j) for j in range(NA)])
PA=Vk[top]; PB=Vg[bot]
if not orient_like(PA,PB): bot=bot[::-1]; PB=PB[::-1]
Z=zipper(PA,PB); Zg=np.where(Z<len(top),top[np.minimum(Z,len(top)-1)],nk+bot[np.maximum(Z-len(top),0)])
V=np.r_[Vk,Vg]; F=np.r_[Fk,Fg+nk]
Nz=np.cross(V[Zg[:,1]]-V[Zg[:,0]],V[Zg[:,2]]-V[Zg[:,0]]); rad=V[Zg].mean(1); rad[:,1]=0
if np.einsum('ij,ij->i',Nz,rad).mean()<0: Zg=Zg[:,[0,2,1]]
F=np.r_[F,Zg]
# report: symmetry of the generated part, extents vs the old head, flips / sharp edges
g=slice(nk,len(V)); Vgen=V[g]; tr=cKDTree(Vgen); dm,_=tr.query(Vgen*np.array([-1,1,1])); print('egg part mirror error max mm',(dm.max()*1000).round(4))
Nf=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); Nu=Nf/np.maximum(np.linalg.norm(Nf,axis=1,keepdims=True),1e-15)
E=np.r_[F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]; fid=np.tile(np.arange(len(F)),3); key=np.sort(E,1); o=np.lexsort((key[:,1],key[:,0])); ks=key[o]
same=(ks[1:]==ks[:-1]).all(1); a_=fid[o][:-1][same]; b_=fid[o][1:][same]; dots=np.einsum('ij,ij->i',Nu[a_],Nu[b_])
yE=V[F[a_]].mean(1)[:,1]; gen=yE>Y_C+0.003
nFk=len(Fk); nFg=len(Fg); cls=lambda i: np.where(i<nFk,0,np.where(i<nFk+nFg,1,2)); bd=dots<0.5
print('  >60deg edges by face pair class (base/grid/zip):',np.unique(np.c_[cls(a_[bd]),cls(b_[bd])],axis=0,return_counts=True))
print('dihedral: edges >30deg (whole / egg part)',int((dots<np.cos(np.radians(30))).sum()),int((dots[gen]<np.cos(np.radians(30))).sum()),
      '| >60deg',int((dots<0.5).sum()),'| folded >120deg',int((dots<-0.5).sum()),'| egg part max dihedral deg',np.degrees(np.arccos(np.clip(dots[gen].min(),-1,1))).round(2))
g30=dots<np.cos(np.radians(30)); print('  >30deg edges y p0/p50/p100',np.percentile(yE[g30],[0,50,100]).round(3) if g30.any() else '-','| egg max dihedral at y',yE[gen][np.argmin(dots[gen])].round(3))
for yy in (1.50,1.56,1.62,1.68):
    s=np.abs(V[:,1]-yy)<0.003; s0=np.abs(V0[:,1]-yy)<0.003
    print(f'  y {yy}: x half-width new/old mm',round(V[s,0].max()*1000),round(V0[s0,0].max()*1000),'| z front/back new',round(V[s,2].max()*1000),round(V[s,2].min()*1000),'old',round(V0[s0,2].max()*1000),round(V0[s0,2].min()*1000))
print('top y new/old',V[:,1].max().round(4),V0[:,1].max().round(4),'| verts',len(V),'faces',len(F),'| boundary loops',[len(l) for l in boundary_loops_F(F)])
h['V']=V; h['F']=F; h['LA']=LA; h['nBase']=len(V); np.savez('head_fit.npz',**h)
