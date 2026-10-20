# hands stage A: Blender "Human Base Meshes" realistic male (CC0, same object as torso / limbs) LEFT hand -> v2 finger rig.
# input  <work>/limbs_pre.npz (limbs stage A before its skin fit: the base hand intact; the fit itself spreads and flattens the
#        fingers, so the hand is taken from the re-posed mesh and faded into limbs_fit.npz toward the wrist ring)
#        <work>/limbs_fit.npz
# output <work>/hands_fit.npz  V (left hand, rest world), F, Wf (per-vertex finger weights: col 0 = hand, 1.. = FB order), joints
# Retarget like a pose (fingers keep their sculpted shape): base finger chains (tip = geodesic extreme from the forearm, centre-
# line by geodesic slices from the tip, joints at the v2 phalanx lengths x the base/v2 hand scale), palm = uniform scale about
# the wrist (identity at the ring), phalanges = rotation onto the v2 bone direction (minimal), axial stretch to the v2 length,
# linear-blended with weights from the base chains.  LEFT hand-bone local coordinates; the right hand is the exact mirror.
import os, sys, json
from common import *
from meshops import *
import scipy.sparse as sp
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation as Rr
FN=['thumb','index','middle','ring','pinky']; FB=[f+str(j) for f in FN for j in (1,2,3)]
HJ=json.load(open(os.path.join(REPO,'drill-anim/models/training-human-v2plus-hands.json')))
Jv={f:np.array(HJ['fingers'][f]['joints']) for f in FN}          # v2 joints (left hand local): j0 j1 j2 tip
hb=rest['bones']['leftHand']; RH=Rr.from_quat(hb['q']).as_matrix(); pH=np.array(hb['p'])
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def rot_to(a,b):
    a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); v=np.cross(a,b); s=np.linalg.norm(v); c=a@b
    if s<1e-9: return np.eye(3)
    K=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]]); return np.eye(3)+K+K@K*((1-c)/s**2)
def graph(V,F):
    E=edges_of(F); w=np.linalg.norm(V[E[:,0]]-V[E[:,1]],axis=1); n=len(V)
    return sp.coo_matrix((np.r_[w,w],(np.r_[E[:,0],E[:,1]],np.r_[E[:,1],E[:,0]])),shape=(n,n)).tocsr()
def seg_proj(X,a,b):
    u=b-a; L=np.linalg.norm(u); u=u/L; t=np.clip((X-a)@u,0,L); return np.linalg.norm(X-(a+np.outer(t,u)),axis=1),(X-a)@u,L
X0=None
if __name__=='__main__':
    WR=float(os.environ.get('L_WRIST','0.035'))
    pre=np.load(sys.argv[1] if len(sys.argv)>1 else 'limbs_pre.npz'); fit=np.load('limbs_fit.npz')
    assert len(pre['V'])==len(fit['V'])
    V,F,part=pre['V'],pre['F'],pre['part']; Xp=(V-pH)@RH; Xf=(fit['V']-pH)@RH
    sel=(part==1)&(V[:,0]>0)&(Xp[:,0]>-WR-0.03)&(np.linalg.norm(Xp-[0.07,0,0.02],axis=1)<0.17)
    keepF=sel[F].all(1); V1,F1,used=compact(Xp,F,keepF); lab=components(len(V1),F1); big=np.argmax(np.bincount(lab))
    V1,F1,u2=compact(V1,F1,lab[F1[:,0]]==big); idx=np.where(used)[0][u2] if used.dtype==bool else used[u2]
    XF=Xf[idx]
    # fade the limbs skin fit in toward the ring (the limbs piece's wrist end is the fitted mesh)
    a=sstep(-0.012,0.004,V1[:,0]); X=XF*(1-a[:,None])+V1*a[:,None]
    G=graph(X,F1); src=np.where(X[:,0]<X[:,0].min()+0.004)[0]; dg=dijkstra(G,indices=src,min_only=True)
    # tips = geodesic local maxima (suppression by geodesic radius, so touching fingertips stay separate)
    taken=np.zeros(len(X),bool); tips=[]
    for i in np.argsort(-dg):
        if taken[i]: continue
        r=dijkstra(G,indices=i,limit=0.05); nb=np.isfinite(r); taken[nb]=True
        if dg[nb&(r<0.015)].max()>dg[i]+1e-9: continue          # not a true local maximum (e.g. a finger web)
        tips.append(i)
        if len(tips)==5: break
    tipP=X[tips]; print('base tips',tipP.round(3).tolist(),'reach',dg[tips].round(3).tolist())
    th=int(np.argmin(dg[tips])); rest_=[k for k in range(5) if k!=th]; rest_.sort(key=lambda k:-tipP[k][2])   # thumb: shortest reach; fingers by z (radial first)
    order={'thumb':tips[th]}; order.update({f:tips[k] for f,k in zip(FN[1:],rest_)})
    # hand scale base/v2 from the middle finger tip reach
    s=np.linalg.norm(X[order['middle']])/np.linalg.norm(Jv['middle'][3]); print('base/v2 hand scale',round(s,3))
    JB={}
    for f in FN:
        L=np.linalg.norm(np.diff(Jv[f],axis=0),axis=1)*s; Lm=L.sum()
        dt=dijkstra(G,indices=order[f]); cl=[X[order[f]]]; ss=[0.0]
        reach=Lm*(0.55 if f!='thumb' else 0.62)
        for b in np.arange(0.004,reach,0.003):
            m=np.abs(dt-b)<0.0015
            if m.sum()>8: cl.append(X[m].mean(0)); ss.append(b)
        cl=np.array(cl); ss=np.array(ss)
        # tip vertex is on the surface: centreline tip = first slice + its direction backwards
        k=max(3,len(cl)//3); d=cl[-1]-cl[-k]; d/=np.linalg.norm(d)
        def at(a_):
            if a_<=ss[-1]: return np.array([np.interp(a_,ss,cl[:,c]) for c in range(3)])
            return cl[-1]+d*(a_-ss[-1])
        JB[f]=np.array([at(Lm),at(Lm-L[0]),at(Lm-L[0]-L[1]),at(0.0)])
        # thumb: its CMC sits deep in the palm where the slices run into the thenar mass -> the v2 CMC at the base hand scale
        if f=='thumb': JB[f][0]=Jv[f][0]*s
    # --- weights on the base hand: hand + 15 finger bones
    n=len(X); Wf=np.zeros((n,16)); Wf[:,0]=1
    D=np.full((n,5),9.0); TT=np.zeros((n,5)); 
    for fi,f in enumerate(FN):
        J=JB[f]; best=np.full(n,9.0)
        for j in range(3):
            dd,_,_=seg_proj(X,J[j],J[j+1]); best=np.minimum(best,dd)
        D[:,fi]=best; TT[:,fi]=(X-J[0])@((J[1]-J[0])/np.linalg.norm(J[1]-J[0]))
    fstar=np.argmin(D,1)
    for fi,f in enumerate(FN):
        m=fstar==fi; J=JB[f]
        if f=='thumb': w1=sstep(-0.030,0.020,TT[m,fi])*(1-sstep(0.020,0.050,D[m,fi]))   # wide thenar falloff (the thumb turns ~60 deg)
        else: w1=sstep(-0.010,0.008,TT[m,fi])*(1-sstep(0.016,0.024,D[m,fi]))
        # split along the chain at j1, j2 (+-5 mm)
        u1=(J[1]-J[0])/np.linalg.norm(J[1]-J[0]); u2=(J[2]-J[1])/np.linalg.norm(J[2]-J[1]); u3=(J[3]-J[2])/np.linalg.norm(J[3]-J[2])
        a1=sstep(-0.005,0.005,(X[m]-J[1])@(u1+u2)/np.linalg.norm(u1+u2)); a2=sstep(-0.005,0.005,(X[m]-J[2])@(u2+u3)/np.linalg.norm(u2+u3))
        p1=w1*(1-a1); p2=w1*a1*(1-a2); p3=w1*a1*a2
        Wf[m,0]=1-w1; Wf[m,1+fi*3]=p1; Wf[m,2+fi*3]=p2; Wf[m,3+fi*3]=p3
    # light smoothing of the finger weights over the mesh (keeps the sum)
    A=adjacency(n,edges_of(F1)).tocsr(); deg=np.asarray(A.sum(1)).ravel()
    for it in range(int(os.environ.get("H_SMOOTH","12"))): Wf=0.5*Wf+0.5*(A@Wf)/deg[:,None]
    # --- retarget: palm = uniform scale 1/s about the wrist, faded from identity at the ring; fingers onto the v2 bones
    k=1/s; ap=sstep(-WR+0.004,0.0,X[:,0])
    Xs=X*(1+(k-1)*ap[:,None])
    JBs={f:JB[f]*k for f in FN}
    out=Wf[:,0:1]*Xs
    for fi,f in enumerate(FN):
        J=JBs[f]; Jt=Jv[f]; Rc=np.eye(3); tc=np.zeros(3)   # chain-composed transform per bone (base -> v2)
        for j in range(3):
            a_,b_=J[j],J[j+1]; a2,b2=Jt[j],Jt[j+1]; R=rot_to(b_-a_,b2-a2); u=(b_-a_)/np.linalg.norm(b_-a_); st=np.linalg.norm(b2-a2)/np.linalg.norm(b_-a_)
            Y=Xs-a_; ax=Y@u; Y=Y+np.outer(ax*(st-1),u); Y=Y@R.T+a2
            out+=Wf[:,1+fi*3+j:2+fi*3+j]*Y
    # --- thumb web / thenar: the thumb turns ~60 deg out of the base's adducted pose, and linear blending of palm and thumb
    # transforms folds the web.  Instead: harmonic rotation (+ axial stretch) field over the thenar band, from identity on the
    # palm to the thumb-1 transform on the thumb, then a Poisson solve of the rotated (scaled) edge vectors with both sides fixed.
    # band by geodesic distance from the thumb tip (Euclidean thumb weights reach the index side of the palm and the web)
    J=JBs['thumb']; dgT=dijkstra(G,indices=order['thumb'])
    dM=dgT[np.argmin(np.linalg.norm(X-JB['thumb'][1],axis=1))]; lC=np.linalg.norm(JB['thumb'][1]-JB['thumb'][0])
    fother=Wf[:,4:].sum(1)
    Tset=dgT<dM*float(os.environ.get('H_TIN','0.85')); Pset=(~Tset)&((dgT>dM+lC*float(os.environ.get('H_POUT','1.3')))|(fother>0.3))
    print('thumb tip->MCP geodesic mm',round(dM*1000,1),'MCP->CMC mm',round(lC*1000,1),'T',int(Tset.sum()),'P',int(Pset.sum()))
    # weights: P has no thumb, T only thumb (chain split kept); band = harmonic t (thumb1) below
    tw=Wf[:,1:4].copy(); Wf[Pset,0]+=tw[Pset].sum(1); Wf[Pset,1:4]=0
    ts=tw[Tset].sum(1,keepdims=True); tw_=np.where(ts>1e-6,tw[Tset]/np.maximum(ts,1e-6),[[1,0,0]]); Wf[Tset,1:4]=tw_; Wf[Tset,0]=0; Wf[Tset,4:]=0
    om=~(Tset|Pset); wt=np.where(Tset,1.0,0.0); Thi=0.5
    # positions of the fixed sides with the cleaned weights
    out=Wf[:,0:1]*Xs
    for fi,f in enumerate(FN):
        Jx=JBs[f]; Jt=Jv[f]
        for j in range(3):
            a_,b_=Jx[j],Jx[j+1]; a2,b2=Jt[j],Jt[j+1]; R=rot_to(b_-a_,b2-a2); u=(b_-a_)/np.linalg.norm(b_-a_); st=np.linalg.norm(b2-a2)/np.linalg.norm(b_-a_)
            Y=Xs-a_; ax=Y@u; Y=Y+np.outer(ax*(st-1),u); Y=Y@R.T+a2
            out+=Wf[:,1+fi*3+j:2+fi*3+j]*Y
    J=JBs['thumb']; Jt=Jv['thumb']; R1=rot_to(J[1]-J[0],Jt[1]-Jt[0]); u1=(J[1]-J[0])/np.linalg.norm(J[1]-J[0])
    st1=np.linalg.norm(Jt[1]-Jt[0])/np.linalg.norm(J[1]-J[0]); rv1=Rr.from_matrix(R1).as_rotvec()
    E1=edges_of(F1); A1=adjacency(n,E1).tocsr(); deg1=np.asarray(A1.sum(1)).ravel()
    Lu=(sp.diags(deg1)-A1).tocsr(); fi_=np.where(om)[0]; fx_=np.where(~om)[0]
    bnd=np.zeros((n,4)); bnd[wt>=Thi,:3]=rv1; bnd[wt>=Thi,3]=st1-1
    from scipy.sparse.linalg import spsolve
    Lff=Lu[fi_][:,fi_].tocsc(); fld=bnd.copy()
    rhs=-Lu[fi_][:,fx_]@bnd[fx_]
    for c in range(4): fld[fi_,c]=spsolve(Lff,rhs[:,c])
    Mv=Rr.from_rotvec(fld[:,:3]).as_matrix()@(np.eye(3)+fld[:,3,None,None]*np.outer(u1,u1))    # per-vertex linear map
    eij=Xs[E1[:,1]]-Xs[E1[:,0]]; eij=0.5*(np.einsum('eab,eb->ea',Mv[E1[:,0]],eij)+np.einsum('eab,eb->ea',Mv[E1[:,1]],eij))
    use=om[E1[:,0]]|om[E1[:,1]]; Ee=E1[use]; ee=eij[use]; m_=len(Ee)
    G=sp.coo_matrix((np.r_[-np.ones(m_),np.ones(m_)],(np.r_[np.arange(m_),np.arange(m_)],np.r_[Ee[:,0],Ee[:,1]])),shape=(m_,n)).tocsr()
    Gf=G[:,fi_]; Gx=G[:,fx_]; Q_=(Gf.T@Gf).tocsc(); new=out.copy()
    for c in range(3): new[fi_,c]=spsolve(Q_,Gf.T@(ee[:,c]-Gx@out[fx_,c]))
    # flips: face normal vs the rotation-field image of the base face normal
    def fnorm(Y): f=np.cross(Y[F1[:,1]]-Y[F1[:,0]],Y[F1[:,2]]-Y[F1[:,0]]); return f/np.maximum(np.linalg.norm(f,axis=1,keepdims=True),1e-15)
    ref=np.einsum('fab,fb->fa',Mv[F1[:,0]],fnorm(Xs))
    tf_=(om|Tset)[F1].any(1)
    for nm_,Y in (('lbs',out),('field',new)): cz=np.einsum('ij,ij->i',fnorm(Y),ref)[tf_]; print('thumb region faces',int(tf_.sum()),nm_,'flipped',int((cz<0).sum()),'cos<0.5',int((cz<0.5).sum()))
    print('thenar band verts',int(om.sum()))
    out=new
    tb=np.clip(np.linalg.norm(fld[:,:3],axis=1)/np.linalg.norm(rv1),0,1); Wf[om]=0; Wf[om,0]=1-tb[om]; Wf[om,1]=tb[om]
    # smooth the thumb chain split across the band / thumb border (else thumb-2 starts with a step at the band edge in grips)
    sm=om|Tset
    for it in range(int(os.environ.get('H_TSMOOTH','10'))): Wn=(A@Wf)/deg[:,None]; Wf[sm]=0.5*Wf[sm]+0.5*Wn[sm]
    print('max move mm',(np.linalg.norm(out-X,axis=1).max()*1000).round(1))
    for f in FN: print(f,'base joints',JBs[f].round(3).tolist(),'v2',Jv[f].round(3).tolist())
    np.savez('hands_fit.npz',X=out,Xb=X,F=F1,Wf=Wf,idx=idx,**{'J_'+f:JBs[f] for f in FN})
