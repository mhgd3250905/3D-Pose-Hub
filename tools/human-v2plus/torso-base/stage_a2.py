# stage A2: armpit lift. The v2 compression tee's armpit apex sits ~4.5 cm below the shoulder joint (y ~1.32), the anatomical
# base-mesh apex ~12 cm (y ~1.25). Skin that far under the joint cannot follow the arm overhead with linear blend skinning
# (partial arm weights swing out into round "bowls", hard splits stretch into flaps), so the top of the base-mesh armpit hollow
# is lifted onto the v2 armhole height (1.315 under the arm, rising 4 cm toward the front/back folds like the tee's armhole) by a
# smooth (bi-Laplacian regularised) displacement field, the same kind of deformation as stage A; the chest, back, deltoid cap,
# upper trunk and the arm below are anchored. With the arm/trunk split this close to the joint the sharp split in the weights
# (stage C2) only stretches a few cm overhead and needs no partial shares.  fit_a.npz -> fit.npz
import os, sys
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.linalg import cg
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
src=sys.argv[1] if len(sys.argv)>1 else 'fit.npz'; dst=sys.argv[2] if len(sys.argv)>2 else 'fit.npz'
d=np.load(src); V=d['V'].copy(); F=d['F']; n=len(V)
YT=float(os.environ.get('A2_YT','1.315'))      # v2 tee armpit apex height (left/right alike, |z| < 0.04)
LAM=float(os.environ.get('A2_LAM','3000'))
N=vnormals(V,F); x=np.abs(V[:,0]); y=V[:,1]; z=V[:,2]
# base apex ridge height per z (top of the hollow: down-facing surface between the inner arm and the side wall)
ZF=float(os.environ.get('A2_ZF','0.115'))
hollow=(x>0.13)&(x<0.215)&(y>1.17)&(y<1.33)&(np.abs(z)<ZF)&(N[:,1]<-0.25)
zb=np.arange(-ZF+0.005,ZF-0.0049,0.01); yb=[]
for zc in zb:
    m=hollow&(np.abs(z-zc)<0.006); yb.append(V[m,1].max() if m.any() else np.nan)
yb=np.array(yb); ok=np.isfinite(yb); yb=np.interp(zb,zb[ok],yb[ok])
print('base apex ridge y',dict(zip(zb.round(2),yb.round(3))))
yr=np.interp(z,zb,yb)
# lift: full at the ridge, fading out over the 4 cm below it and toward the front/back folds (|z| 0.04 -> 0.075)
YTz=YT+float(os.environ.get('A2_YTF','0.04'))*sstep(0.03,0.06,np.abs(z))     # the tee armhole rises toward the front/back folds
dy=np.clip(YTz-yr,0,None)*(1-sstep(ZF-0.035,ZF,np.abs(z)))
g=hollow*(1-sstep(0.0,0.04,yr-y))
w=np.where(g>0.05,3.0*g,0.0)
# anchors: everything clearly outside the armpit (chest, back, deltoid cap, upper trunk, lower side wall, arm below)
far=(x<0.10)|(y>1.40)|(y<1.10)|(np.abs(z)>0.11)
anc=np.where(far,3.0,0.0)
E=edges_of(F); A=adjacency(n,E); deg=np.asarray(A.sum(1)).ravel(); L=sp.diags(1/deg)@A-sp.eye(n); LtL=(L.T@L).tocsr()
bw=w+anc; Aop=(sp.diags(bw)+LAM*LtL).tocsr(); D=np.zeros_like(V); tgt=np.zeros_like(V); tgt[:,1]=dy*(w>0)
for c in range(3): D[:,c],_=cg(Aop,bw*tgt[:,c],rtol=1e-8,maxiter=8000)
V=V+D
print('A2 lifted verts',int((w>0).sum()),'max lift mm',(D[:,1].max()*1000).round(1),'moved >5mm',int((np.linalg.norm(D,axis=1)>0.005).sum()))
np.savez(dst,V=V,F=F)
