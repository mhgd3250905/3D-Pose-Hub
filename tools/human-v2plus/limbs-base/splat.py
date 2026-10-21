# fast numpy preview renderer (orthographic, z-buffered barycentric splats, per-vertex normal shading). No python loop per face.
import numpy as np
from PIL import Image
def vnorm(V,F):
    fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); n=np.zeros_like(V)
    for c in range(3): np.add.at(n,F[:,c],fn)
    return n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
def look(dirv):
    f=np.array(dirv,float); f/=np.linalg.norm(f); up=np.array([0,1,0.]); r=np.cross(up,f); r/=np.linalg.norm(r); u=np.cross(f,r); return np.stack([r,u,f])
def bary(k):
    out=[]
    for i in range(k+1):
        for j in range(k+1-i): out.append((i/k,j/k,1-(i+j)/k))
    return np.array(out)
def raster(meshes, dirv, center, half, W, L=(-0.4,0.7,0.6)):
    R=look(dirv); Lv=np.array(L,float); Lv/=np.linalg.norm(Lv)
    zb=np.full(W*W,-1e9); img=np.full((W*W,3),28.0)
    for V,F,col,N in meshes:
        if N is None: N=vnorm(V,F)
        Q=(V-np.asarray(center))@R.T
        px=(Q[:,0]/half*0.5+0.5)*W; py=(0.5-Q[:,1]/half*0.5)*W
        # samples per edge from the largest projected edge
        e=np.maximum(np.abs(px[F[:,1]]-px[F[:,0]])+np.abs(py[F[:,1]]-py[F[:,0]]),np.abs(px[F[:,2]]-px[F[:,0]])+np.abs(py[F[:,2]]-py[F[:,0]]))
        C=np.asarray(col,float); C=np.broadcast_to(C,(len(V),3)) if C.ndim==1 else C
        cam=N@R[2]; sh=0.30+0.70*np.clip(N@Lv,0,1)+0.12*np.clip(cam,0,1)
        cv=C*sh[:,None]
        for kk in (2,4,8,16):
            sel=(e<=kk*1.2) if kk<16 else (e>8*1.2)
            if kk>2: sel&=e>(kk/2)*1.2
            if not sel.any(): continue
            Fs=F[sel]; b=bary(kk)
            for bb in np.array_split(b,max(1,len(b)//6)):
                X=(bb[None,:,0]*px[Fs[:,0],None]+bb[None,:,1]*px[Fs[:,1],None]+bb[None,:,2]*px[Fs[:,2],None]).ravel()
                Y=(bb[None,:,0]*py[Fs[:,0],None]+bb[None,:,1]*py[Fs[:,1],None]+bb[None,:,2]*py[Fs[:,2],None]).ravel()
                Z=(bb[None,:,0]*Q[Fs[:,0],None,2]+bb[None,:,1]*Q[Fs[:,1],None,2]+bb[None,:,2]*Q[Fs[:,2],None,2]).ravel()
                Cc=(bb[None,:,0,None]*cv[Fs[:,0],None]+bb[None,:,1,None]*cv[Fs[:,1],None]+bb[None,:,2,None]*cv[Fs[:,2],None]).reshape(-1,3)
                xi=X.astype(int); yi=Y.astype(int); ok=(xi>=0)&(xi<W)&(yi>=0)&(yi<W)
                idx=(yi*W+xi)[ok]; Z=Z[ok]; Cc=Cc[ok]
                if not len(idx): continue
                o=np.lexsort((Z,idx)); idx,Z,Cc=idx[o],Z[o],Cc[o]
                last=np.r_[idx[1:]!=idx[:-1],True]; idx,Z,Cc=idx[last],Z[last],Cc[last]
                up=Z>zb[idx]; zb[idx[up]]=Z[up]; img[idx[up]]=Cc[up]
    return np.clip(img.reshape(W,W,3),0,255).astype(np.uint8)
def label(img,text):
    from PIL import ImageDraw
    im=Image.fromarray(img); ImageDraw.Draw(im).text((6,4),text,fill=(255,255,120)); return np.array(im)
