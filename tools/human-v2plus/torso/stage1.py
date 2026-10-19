# fields + marching cubes -> raw.npz
import sys
from common import *
from scipy.ndimage import gaussian_filter1d, gaussian_filter, maximum_filter1d
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes
VOX=float(sys.argv[1]) if len(sys.argv)>1 else 0.005
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
LM=rest['landmarks']
TCUT=0.170   # arm skin above this (t from the shoulder joint) is hidden in torso mode; the torso arm tube welds to the skin here
def ring_fill(E):
    E=E.copy()
    for j in range(len(E)):
        ok=~np.isnan(E[j])
        if ok.sum()>=4: x=np.arange(len(E[j])); E[j]=np.interp(x,x[ok],E[j][ok],period=len(E[j]))
        else: E[j]=np.nan
    good=np.where(~np.isnan(E).any(1))[0]
    for j in range(len(E)):
        if np.isnan(E[j]).any(): E[j]=E[good[np.argmin(np.abs(good-j))]]
    return E
# ---------- trunk envelope R(theta,y) about (0,y,zc(y)) ----------
NA=96; YS=np.round(np.arange(0.70,1.4801,0.005),4)
def zc_of(y): return np.interp(y,[0.70,0.84,0.90,0.98,1.06,1.20,1.30,1.45],[0.008,0.010,0.012,0.030,0.045,0.035,0.020,0.005])
def polar(Pt): zc=zc_of(Pt[:,1]); return np.arctan2(Pt[:,0],Pt[:,2]-zc), np.hypot(Pt[:,0],Pt[:,2]-zc)
def envelope(Pt, mask, ys=YS, h=0.004):
    th,r=polar(Pt); E=np.full((len(ys),NA),np.nan); ai=((th+np.pi)/(2*np.pi)*NA).astype(int)%NA
    for j,y in enumerate(ys):
        s=mask&(np.abs(Pt[:,1]-y)<h)
        if not s.any(): continue
        np.fmax.at(E[j], ai[s], r[s])
    return E
armT=bone_mass(TEE,['UpperArm']); teeM=(armT<0.30)
eT=envelope(PC[TEE], teeM)
eS=envelope(PC[SH], (PC[SH][:,1]>0.70)&(bone_mass(SH,['Thigh'])<2))
# the shorts below ~0.80 split into legs: only use it as trunk above 0.765 (trunk ends at the crotch)
E=np.full_like(eT,np.nan)
for j,y in enumerate(YS):
    a=eT[j]; b=eS[j]
    if y>=1.0: E[j]=a
    elif y<=0.95: E[j]=b
    else:
        w=sstep(0.95,1.0,y); E[j]=np.where(np.isnan(a),b,np.where(np.isnan(b),a,(1-w)*b+w*a))
def fill_circ(E):
    for j in range(len(E)):
        row=E[j]; ok=~np.isnan(row)
        if ok.sum()>=4: x=np.arange(NA); E[j]=np.interp(x,x[ok],row[ok],period=NA)
    return E
E=ring_fill(E)
thb0=(np.arange(NA)+0.5)/NA*2*np.pi-np.pi
E*=1-0.065*(np.sin(thb0)**2)[None,:]*(1-sstep(0.86,0.95,YS))[:,None]
# closing in angle (remove fold notches), then smooth
E=maximum_filter1d(E,3,axis=1,mode='wrap')
E=gaussian_filter1d(E,2.0,axis=1,mode='wrap')
# low-pass in angle: keep the first 9 harmonics per row (cloth folds are higher frequency)
Fh=np.fft.rfft(E,axis=1); Fh[:,10:]=0; wlp=(1-sstep(1.24,1.32,YS))[:,None]; E=wlp*np.fft.irfft(Fh,n=NA,axis=1)+(1-wlp)*E
Esm=gaussian_filter1d(E,6.0,axis=0,mode='nearest')
wtop=sstep(1.30,1.36,YS)[:,None]          # less vertical smoothing near the yoke (keep the tee shape there)
E=(1-wtop)*Esm+wtop*gaussian_filter1d(E,1.0,axis=0,mode='nearest')
def trunk_R(Pt):
    th,r=polar(Pt); a=(th+np.pi)/(2*np.pi)*NA-0.5; a0=np.floor(a).astype(int); fa=a-a0
    yj=np.clip((Pt[:,1]-YS[0])/0.005,0,len(YS)-1.001); y0=np.floor(yj).astype(int); fy=yj-y0
    g=lambda yy,aa: E[yy,aa%NA]
    R=(1-fy)*((1-fa)*g(y0,a0)+fa*g(y0,a0+1))+fy*((1-fa)*g(y0+1,a0)+fa*g(y0+1,a0+1)); return R,r,th
# ---------- limb tubes ----------
NB=48
class Tube:
    def __init__(s,A,B,ref):
        s.A=np.array(A,float); B=np.array(B,float); s.u=(B-s.A)/np.linalg.norm(B-s.A); e0=np.array(ref,float); e0-=s.u*(e0@s.u); s.e0=e0/np.linalg.norm(e0); s.e1=np.cross(s.u,s.e0)
    def coords(s,Pt):
        d=Pt-s.A; t=d@s.u; rr=d-np.outer(t,s.u); return t,np.arctan2(rr@s.e1,rr@s.e0),np.linalg.norm(rr,axis=1)
def tube_env(tube,Pt,mask,TS,h):
    t,ph,r=tube.coords(Pt); ai=((ph+np.pi)/(2*np.pi)*NB).astype(int)%NB; E=np.full((len(TS),NB),np.nan)
    for j,tt in enumerate(TS):
        s=mask&(np.abs(t-tt)<h)
        if s.any(): np.fmax.at(E[j],ai[s],r[s])
    return E
def tube_eval(E,TS,dt,t,ph):
    a=(ph+np.pi)/(2*np.pi)*NB-0.5; a0=np.floor(a).astype(int); fa=a-a0; nb=E.shape[1]
    yj=np.clip((t-TS[0])/dt,0,len(TS)-1.001); y0=np.floor(yj).astype(int); fy=yj-y0
    g=lambda yy,aa:E[yy,aa%nb]
    return (1-fy)*((1-fa)*g(y0,a0)+fa*g(y0,a0+1))+fy*((1-fa)*g(y0+1,a0)+fa*g(y0+1,a0+1))
loopsB=[L for L in boundary_loops(BODY) if len(L)>20]
arm={}; leg={}
for sgn,sd in ((1,'left'),(-1,'right')):
    # ---- arm: shoulder -> elbow
    tb=Tube(LM[sd+'Shoulder'],LM[sd+'Elbow'],[sgn,0,0]); TS=np.round(np.arange(-0.06,0.2001,0.005),4)
    skin=(P[BODY][:,0]*sgn>0.12)&(P[BODY][:,1]>1.0)
    eSk=ring_fill(tube_env(tb,P[BODY],skin,TS,0.006))
    sl=(PC[TEE][:,0]*sgn>0.10)&(armT>0.30)
    eSl=tube_env(tb,np.concatenate([PC[TEE][sl],PC[TRIM][PC[TRIM][:,0]*sgn>0]]),np.ones(sl.sum()+(PC[TRIM][:,0]*sgn>0).sum(),bool),TS,0.006)
    eSl=ring_fill(eSl)
    phb=(np.arange(NB)+0.5)/NB*2*np.pi-np.pi; jc=int(np.argmin(np.abs(TS-TCUT)))
    Ea=np.zeros((len(TS),NB))
    for j,tt in enumerate(TS):
        w=sstep(TCUT-0.050,TCUT-0.012,tt)          # 0 = sleeve shape (deltoid), 1 = arm skin
        sk=eSk[j]; slv=eSl[j]
        Ea[j]=(1-w)*(slv-0.0015)+w*sk
    # medial half above the cut: no wider than the skin ring at the cut (the v2 arm skin flares into the loose tee there)
    med=np.cos(phb-np.pi)
    for j,tt in enumerate(TS):
        if tt<TCUT:
            lim=eSk[jc]; wm=sstep(0.2,0.7,med)*sstep(-0.01,0.03,tt)
            Ea[j]=np.where(Ea[j]>lim,(1-wm)*Ea[j]+wm*lim,Ea[j])
    Ea=gaussian_filter1d(Ea,1.0,axis=1,mode='wrap'); Ea=gaussian_filter1d(Ea,1.2,axis=0,mode='nearest')
    for j,tt in enumerate(TS):
        w=sstep(TCUT-0.015,TCUT-0.006,tt); Ea[j]=(1-w)*Ea[j]+w*eSk[j]
    tloop=TCUT
    arm[sd]=(tb,TS,Ea,tloop)
    # ---- thigh: hip -> knee
    tb2=Tube(LM[sd+'Hip'],LM[sd+'Knee'],[-sgn,0,0]); TS2=np.round(np.arange(-0.02,0.30,0.005),4)
    skinL=(P[BODY][:,0]*sgn>0.0)&(P[BODY][:,1]<0.70)&(P[BODY][:,1]>0.40)
    eSkL=ring_fill(tube_env(tb2,P[BODY],skinL,TS2,0.006))
    shL=(PC[SH][:,0]*sgn>0.004)&(PC[SH][:,1]<0.80)
    eShL=ring_fill(tube_env(tb2,PC[SH],shL,TS2,0.006))
    El=np.zeros((len(TS2),NB)); yl=0.6312
    jh=int(np.argmin(np.abs((LM[sd+'Hip'][1]-TS2*0.999)-(yl+0.006)))); hem=eSkL[jh]
    phb=(np.arange(NB)+0.5)/NB*2*np.pi-np.pi; medial=np.cos(phb)        # e0 = -x*sgn -> phi=0 is medial
    gr=0.17-0.09*np.clip(medial,0,1)
    for j,tt in enumerate(TS2):
        y=LM[sd+'Hip'][1]-tt*0.999
        El[j]=hem*(1+gr*sstep(yl+0.004,0.81,y)**0.8)
    El=gaussian_filter1d(El,1.0,axis=1,mode='wrap'); El=gaussian_filter1d(El,1.5,axis=0,mode='nearest')
    for j,tt in enumerate(TS2):
        y=LM[sd+'Hip'][1]-tt*0.999; w=1-sstep(yl+0.003,yl+0.012,y)
        if not np.isnan(eSkL[j]).all(): El[j]=(1-w)*El[j]+w*eSkL[j]
    leg[sd]=(tb2,TS2,El)
# ---------- trunk sides under the arms: keep >= GAP medial of the arm tube's medial surface (armpit fillet starts ~1.27) ----------
xlim=np.full(len(YS),9.0)
for sd,(tb,TS,Ea,_) in arm.items():
    tt,pp=np.meshgrid(TS,(np.arange(NB)+0.5)/NB*2*np.pi-np.pi,indexing='ij'); R=Ea
    Pt=tb.A+tt[...,None]*tb.u+R[...,None]*(np.cos(pp)[...,None]*tb.e0+np.sin(pp)[...,None]*tb.e1)
    Pt=Pt.reshape(-1,3); ok=(tt.ravel()>0.0)&(tt.ravel()<TCUT+0.02)
    for j,y in enumerate(YS):
        s_=ok&(np.abs(Pt[:,1]-y)<0.004)
        if s_.any(): xlim[j]=min(xlim[j],np.abs(Pt[s_,0]).min())
gap=0.012*(1-sstep(1.255,1.31,YS)); xl=xlim-gap
thb=(np.arange(NA)+0.5)/NA*2*np.pi-np.pi
for j,y in enumerate(YS):
    if xlim[j]>1: continue
    sn=np.abs(np.sin(thb)); Rmax=np.where(sn>0.3,xl[j]/np.maximum(sn,1e-3),9.0)
    wl=1-sstep(1.27,1.31,y); E[j]=(1-wl)*E[j]+wl*np.minimum(E[j],Rmax)
E=gaussian_filter1d(E,1.2,axis=1,mode='wrap')
np.save('trunkE.npy',E)
np.savez('tubes.npz',**{f'arm_{k}':v[2] for k,v in arm.items()},**{f'leg_{k}':v[2] for k,v in leg.items()})
# ---------- SDF on grid ----------
def smin(a,b,k):
    k=np.maximum(k,1e-6); h=np.clip(0.5+0.5*(b-a)/k,0,1); return b*(1-h)+a*h-k*h*(1-h)
def smax(a,b,k): return -smin(-a,-b,k)
lo=np.array([-0.31,0.585,-0.15]); hi=np.array([0.31,1.475,0.19])
nx,ny,nz=(np.ceil((hi-lo)/VOX)).astype(int)+1
xs=lo[0]+np.arange(nx)*VOX; ys=lo[1]+np.arange(ny)*VOX; zs=lo[2]+np.arange(nz)*VOX
F=np.empty((nx,ny,nz),np.float32)
for i in range(nx):
    X,Y,Z=np.meshgrid([xs[i]],ys,zs,indexing='ij'); Pt=np.stack([X.ravel(),Y.ravel(),Z.ravel()],1)
    R,r,th=trunk_R(Pt); dT=r-R
    dT=smax(dT, 0.770-Pt[:,1], 0.012)            # trunk ends at the crotch
    dT=smax(dT, Pt[:,1]-1.475, 0.005)
    f=dT
    for sd in ('left','right'):
        tb,TS,Ea,tloop=arm[sd]; t,ph,rr=tb.coords(Pt); dA=rr-tube_eval(Ea,TS,0.005,t,ph)
        dA=smax(dA, -(t+0.045), 0.02); dA=smax(dA, t-(TCUT+0.03), 0.005)
        k=0.036*sstep(1.225,1.33,Pt[:,1])
        f=smin(f,dA,k)
    dL=np.full(len(Pt),9.0)
    for sd in ('left','right'):
        tb,TS,El=leg[sd]; t,ph,rr=tb.coords(Pt); d=rr-tube_eval(El,TS,0.005,t,ph); d=smax(d,t-0.29,0.005); d=smax(d,-(t+0.0),0.01); dL=np.minimum(dL,d)
    kL=0.020*sstep(0.70,0.78,Pt[:,1])
    f=smin(f,dL,kL)
    F[i]=f.reshape(ny,nz)
V,Fc,Nm,_=marching_cubes(F,0.0,spacing=(VOX,VOX,VOX))
V+=lo
# skimage winding is already outward for this field
print('MC verts',len(V),'faces',len(Fc))
np.savez('raw.npz',V=V,F=Fc)
