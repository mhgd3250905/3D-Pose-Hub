# tiny numpy z-buffer rasterizer for quick looks (orthographic). render(meshes, views, out)
import numpy as np
from PIL import Image
def vnorm(V,F):
    fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); n=np.zeros_like(V)
    for c in range(3): np.add.at(n,F[:,c],fn)
    return n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
def look(dirv):
    f=np.array(dirv,float); f/=np.linalg.norm(f); up=np.array([0,1,0.]); r=np.cross(up,f); r/=np.linalg.norm(r); u=np.cross(f,r); return np.stack([r,u,f])
def raster(meshes, dirv, center, half, W, toon=True, Lw=(-0.45,0.75,0.55)):
    R=look(dirv); img=np.full((W,W,3),30.0); zb=np.full((W,W),-1e9)
    L=np.array(Lw); L/=np.linalg.norm(L)
    for V,F,col,N in meshes:
        if N is None: N=vnorm(V,F)
        Q=(V-center)@R.T; px=(Q[:,0]/half*0.5+0.5)*W; py=(0.5-Q[:,1]/half*0.5)*W; pz=Q[:,2]
        nl=N@L; sh=np.where(nl>0.05,1.0,0.62) if toon else 0.35+0.65*np.clip(nl,0,1)
        if toon: sh=np.where(nl>0.5,1.12,sh)
        fr=np.clip(1-np.abs(N@R[2]),0,1)**2.6
        C=np.asarray(col,float); C=np.broadcast_to(C,(len(V),3)) if C.ndim==1 else C
        cv=C*sh[:,None]+ (fr>0.6)[:,None]*np.array([40,30,10])
        # backface cull: face normal toward camera (+z = toward viewer since f points from target to camera)
        A,B,Cc=F[:,0],F[:,1],F[:,2]
        area=(px[B]-px[A])*(py[Cc]-py[A])-(px[Cc]-px[A])*(py[B]-py[A])
        keep=area<0
        for f in np.where(keep)[0]:
            ia,ib,ic=F[f]; xs=np.array([px[ia],px[ib],px[ic]]); ys=np.array([py[ia],py[ib],py[ic]])
            x0,x1=max(int(xs.min()),0),min(int(xs.max())+1,W-1); y0,y1=max(int(ys.min()),0),min(int(ys.max())+1,W-1)
            if x1<x0 or y1<y0: continue
            gx,gy=np.meshgrid(np.arange(x0,x1+1)+0.5,np.arange(y0,y1+1)+0.5)
            d=(ys[1]-ys[2])*(xs[0]-xs[2])+(xs[2]-xs[1])*(ys[0]-ys[2])
            if abs(d)<1e-12: continue
            l0=((ys[1]-ys[2])*(gx-xs[2])+(xs[2]-xs[1])*(gy-ys[2]))/d; l1=((ys[2]-ys[0])*(gx-xs[2])+(xs[0]-xs[2])*(gy-ys[2]))/d; l2=1-l0-l1
            m=(l0>=-1e-6)&(l1>=-1e-6)&(l2>=-1e-6)
            if not m.any(): continue
            z=l0*pz[ia]+l1*pz[ib]+l2*pz[ic]
            yy,xx=gy[m].astype(int),gx[m].astype(int); z=z[m]
            upd=z>zb[yy,xx]
            if not upd.any(): continue
            yy,xx,z=yy[upd],xx[upd],z[upd]; l0m,l1m,l2m=l0[m][upd],l1[m][upd],l2[m][upd]
            zb[yy,xx]=z; img[yy,xx]=l0m[:,None]*cv[ia]+l1m[:,None]*cv[ib]+l2m[:,None]*cv[ic]
    return np.clip(img,0,255).astype(np.uint8)
def render(meshes, views, center, half, W, out, toon=True):
    tiles=[raster(meshes,d,np.array(center),half,W,toon) for d in views]
    Image.fromarray(np.concatenate(tiles,1)).save(out)
