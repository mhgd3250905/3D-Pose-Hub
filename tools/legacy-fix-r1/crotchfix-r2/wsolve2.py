import numpy as np, scipy.sparse as sp, scipy.sparse.linalg as spl
from v5lib import *
BN=('pelvis','spineLower','leftThigh','rightThigh')
def lap(A):
    d=np.asarray(A.sum(1)).ravel();return sp.diags(d)-A
def solve(g,pel0,p):
    """p: dict of params. returns new per-welded weight matrix (nw,nb)"""
    P=g['P']-pel0;W=g['W'].copy();bn=g['bones'];ib=[bn.index(b) for b in BN]
    C=np.array(p.get('C',(0,-0.16,0.0)));sc=np.array(p.get('scale',(1,1,1)))
    Q=(P-C)/sc
    if "back" in p: Q[:,2]=np.where(Q[:,2]<0,Q[:,2]/p["back"],Q[:,2])
    if "up" in p:  # r2: back-upper edge pushed out; factor ramps in smoothly behind z=C.z (no notch in the region boundary)
        t=np.clip(-(P[:,2]-C[2])/p.get("upw",0.06),0,1);t=t*t*(3-2*t);
        if "upx" in p: u=np.clip(1-np.abs(P[:,0])/p["upx"],0,1);t=t*u*u*(3-2*u)  # midline-only (gluteal cleft) variant
        k=1+(p["up"]-1)*t
        Q[:,1]=np.where(Q[:,1]>0,Q[:,1]/k,Q[:,1])
    r=np.linalg.norm(Q,axis=1);R=r<p["R"]
    if 'excl' in p:
        zb_,yb_=p['excl'];R&=~((P[:,2]<zb_)&(P[:,1]>yb_))
    fixed=~R  # outside region fixed to original
    val=W.copy()
    x,y,z=P[:,0],P[:,1],P[:,2]
    if p.get('seam',True):
        s=R&(np.abs(x)<p.get('seamx',0.004))&(y<p.get('seamy',-0.10))
        back=z<p.get('zback',-0.02)
        z0,z1=p.get('zblend',(-0.06,0.0))
        for i in np.where(s)[0]:
            t=np.clip((z[i]-z0)/(z1-z0),0,1);t=t*t*(3-2*t);pw=p['pb']*(1-t)+p['pf']*t
            v=np.zeros(W.shape[1]);v[ib[0]]=pw;v[ib[2]]=v[ib[3]]=(1-pw)/2;val[i]=v;fixed[i]=True
    if p.get('inner',True):
        nx=None
        # inner thigh: away from midline, below the crotch line
        zb=np.arange(-0.16,0.161,0.01);yl=np.full(len(zb),np.nan)
        mid=(np.abs(x)<0.006)&(y>-0.3)&(y<-0.05)
        for j,zz in enumerate(zb):
            q=mid&(np.abs(z-zz)<0.006)
            if q.any(): yl[j]=y[q].min()
        ok=~np.isnan(yl);Yl=np.interp(z,zb[ok],yl[ok])
        s=R&(y<Yl-p.get('innerd',0.01))&(np.abs(x)>p.get('innerxm',0.0))
        if 'innerx' in p: s|=R&(np.abs(x)>p['innerx'])&(y<p.get('innery',-0.17))
        for i in np.where(s)[0]:
            v=np.zeros(W.shape[1]);v[ib[2] if W[i,ib[2]]>=W[i,ib[3]] else ib[3]]=1;val[i]=v;fixed[i]=True
    if p.get('cot'):
        L=g.get('Lcot')
        if L is None:
            F=g['F'];V=g['P'];Lw=sp.lil_matrix((len(V),len(V)))
            rows=[];cols=[];vals=[];area=np.zeros(len(V))
            for a,b,c in ((0,1,2),(1,2,0),(2,0,1)):
                u=V[F[:,b]]-V[F[:,a]];v=V[F[:,c]]-V[F[:,a]]
                cot=(u*v).sum(1)/np.maximum(1e-12,np.linalg.norm(np.cross(u,v),axis=1));cot=np.clip(cot,-5,5)
                rows+= [F[:,b],F[:,c]];cols+=[F[:,c],F[:,b]];vals+=[0.5*cot,0.5*cot]
            Wc=sp.coo_matrix((np.concatenate(vals),(np.concatenate(rows),np.concatenate(cols))),shape=(len(V),len(V))).tocsr()
            ar=np.linalg.norm(np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]),axis=1)/6
            for k in range(3): np.add.at(area,F[:,k],ar)
            area=np.maximum(area,1e-10)
            L=sp.diags(np.asarray(Wc.sum(1)).ravel())-Wc;g['Lcot']=L;g['Minv']=sp.diags(1/area)
        K=(L@g['Minv']@L) if p.get('bi',True) else L
    else:
        L=lap(g['A']);K=L@L if p.get('bi',True) else L
    free=np.where(~fixed)[0];fx=np.where(fixed)[0]
    Kff=K[free][:,free].tocsc();Kfc=K[free][:,fx]
    out=val.copy()
    cols=np.where((W[R].max(0)>1e-4)|(val[R].max(0)>1e-4))[0]
    lu=spl.splu(Kff)
    for c in cols:
        out[free,c]=lu.solve(-(Kfc@val[fx,c]))
    if 'fade' in p:
        a,b=p['fade'];t=np.clip((r-a)/(b-a),0,1);t=t*t*(3-2*t);out=out*(1-t)[:,None]+W*t[:,None]
    out=np.clip(out,0,None)
    # keep top4
    o=np.argsort(-out,axis=1)[:,4:];np.put_along_axis(out,o,0,axis=1)
    out/=out.sum(1,keepdims=True)
    return out,R
def to_mesh(g,Wn):
    """welded weights -> per-vertex (sw,si) top-4"""
    Wv=Wn[g['inv']];si=np.argsort(-Wv,axis=1)[:,:4];sw=np.take_along_axis(Wv,si,1);sw/=sw.sum(1,keepdims=True);return sw,si
