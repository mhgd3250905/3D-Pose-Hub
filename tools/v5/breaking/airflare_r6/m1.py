"""r6 方案1: harmonic crotch weights (as r4) + constraints:
 S  true midline seam (verts on edges crossing x=0, at/above the smooth crotch line ycs(z), below ytop): pelvis pm, thighs (1-pm)/2
 B  inner-thigh sheets between the legs (|x|>=xs, below the lowest midline point ycp(z) by hb, |x|<xb): 100% own thigh
 free verts between them + rest of crotch sphere: harmonic (smooth transition). Outside sphere: raw weights (same as r4)."""
import sys, os, json, numpy as np, scipy.sparse.linalg as spl
sys.path[:0]=[os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','airflare_r4')]
from model import Model; from crotch import weld, lap, dense_w, to4
def ss(u): u=np.clip(u,0,1); return u*u*(3-2*u)
def m1(m, pi=2, R=0.18, center=(0,0.83,0.005), ymax=0.95, pm=0.7, ytop_b=0.94, ytop_f=0.92, tol=0.003,
       hb=0.015, xs=0.004, xb=0.045, depth=0.12, pocket=(-0.012,0.03), bih=False, band=0.0, pmf=None, pmp=None, zp=(-0.05,-0.015,0.04,0.08), band_b=None):
    p=m.prims[pi]; P=m.skin(None,pi); W0=dense_w(m,p); jn=m.jn
    ip,iL,iR=jn.index('pelvis'),jn.index('leftThigh'),jn.index('rightThigh')
    wid=weld(P); nU=wid.max()+1; PU=np.zeros((nU,3)); PU[wid]=P; WU=np.zeros((nU,W0.shape[1])); WU[wid]=W0
    IU=wid[p['I']]; L=lap(IU,nU)
    E=np.r_[IU[:,[0,1]],IU[:,[1,2]],IU[:,[2,0]]]; xa,xb_=PU[E[:,0],0],PU[E[:,1],0]
    cr=np.zeros(nU,bool); cr[np.unique(E[(np.sign(xa)!=np.sign(xb_))|(xa==0)|(xb_==0)])]=True
    x,y,z=PU.T; cr&=(y<1.0)&(abs(z)<0.2)
    zb=np.arange(-0.16,0.1601,0.01); ycp=[]; ycs=[]
    for zz in zb:
        t=cr&(abs(z-zz)<0.006); ycp.append(y[t].min() if t.any() else np.nan)
        t2=t&~((z>pocket[0])&(z<pocket[1])); ycs.append(y[t2].min() if t2.any() else np.nan)
    ycp=np.array(ycp); ycs=np.array(ycs); ok=~np.isnan(ycs); ycs=np.interp(zb,zb[ok],ycs[ok]); okp=~np.isnan(ycp); ycp=np.interp(zb,zb[okp],ycp[okp])
    Yp=np.interp(z,zb,ycp); Ys=np.interp(z,zb,ycs)
    r=np.linalg.norm(PU-np.array(center),axis=1); inner=(r<R)&(y<ymax)
    S=inner&cr&(y>=Ys-tol)&(y<np.where(z<0,ytop_b,ytop_f))
    B=inner&~cr&(abs(x)>=xs)&(abs(x)<xb)&(y<Yp-hb)&(y>Yp-depth)&(z>-0.10)&(z<0.12)
    T=WU.copy()
    if band>0:
        bw=np.full(nU,band) if band_b is None else np.interp(z,[-0.3,-0.04,0.0,0.3],[band_b,band_b,band,band])
        S=inner&(abs(x)<bw)&(y>=Ys-tol)&(y<np.where(z<0,ytop_b,ytop_f)+0.01)&((z<=pocket[0])|(z>=pocket[1])|(y>=Ys-tol))
        yt=np.where(z[S]<0,ytop_b,ytop_f); g=(ss(1-abs(x[S])/bw[S])*(1-ss((y[S]-(yt-0.035))/0.03)))[:,None]; pmz=pm if pmf is None else pm+(pmf-pm)*ss((z[S]+0.01)/0.05)
        if pmp is not None: pmz=np.interp(z[S],[-0.2,*zp,0.2],[pm,pm,pmp,pmp,pmf,pmf])
        Mid=np.zeros((S.sum(),T.shape[1])); Mid[:,ip]=pmz; Mid[:,iL]=Mid[:,iR]=(1-pmz)/2
        # band edge blends to the r4 harmonic weights (computed without constraints)
        fr0=np.where(inner)[0]; cc=np.where(~inner)[0]; R4=WU.copy()
        R4[fr0]=np.clip(spl.splu(L[fr0][:,fr0].tocsc()).solve(-(L[fr0][:,cc]@WU[cc])),0,None); R4/=R4.sum(1,keepdims=True)
        T[S]=g*Mid+(1-g)*R4[S]
    else:
        T[S]=0; T[S,ip]=pm; T[S,iL]=T[S,iR]=(1-pm)/2
    sL=x>0  # left thigh is +x
    T[B]=0; T[B&sL,iL]=1; T[B&~sL,iR]=1
    free=inner&~S&~B; fi=np.where(free)[0]; ci=np.where(~free)[0]
    Q=(L.T@L).tocsr() if bih else L
    X=spl.splu(Q[fi][:,fi].tocsc()).solve(-(Q[fi][:,ci]@T[ci])); T[fi]=np.clip(X,0,None); T/=T.sum(1,keepdims=True)
    info=dict(S=int(S.sum()),B=int(B.sum()),free=int(free.sum()),ycs=dict(zip(np.round(zb[::2],2).tolist(),np.round(ycs[::2],3).tolist())))
    return T[wid], inner[wid], W0, info, dict(S=S[wid],B=B[wid])
if __name__=='__main__':
    src,dst,kw=sys.argv[1],sys.argv[2],json.loads(sys.argv[3]) if len(sys.argv)>3 else {}
    m=Model(src); W,inn,W0,info,_=m1(m,**kw); p=m.prims[2]; J,q=to4(W); p['J'][inn]=J[inn]; p['W'][inn]=q[inn]; m.g.save(dst); print(info)
