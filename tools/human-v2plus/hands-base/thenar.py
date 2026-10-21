# thenar lift (M8): the retargeted base thenar (thumb-base pad) hangs ~10 mm below the palm plane at rest (palmar side, -y in left
# hand-bone local coords), well past the hypothenar ridge and the distal palm pad.  Fit the palm plane y = a + b x + c z to the
# palmar extremes of the hypothenar ridge and the distal palm pad, soft-clamp the thenar's excess below it to <= H_TH_KEEP (a natural
# low pad, not flat), and spread the lift as a smooth (Laplacian-relaxed) displacement field so the pad stays fair.
import os, numpy as np
from meshops import adjacency, edges_of
def sstep(a,b,x): u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def lift_thenar(X, F, Wf, verbose=True):
    keep=float(os.environ.get('H_TH_KEEP','0.002'))
    if keep<=0 or os.environ.get('H_TH','1')=='0': return X, {}
    n=len(X); A=adjacency(n,edges_of(F)).tocsr(); deg=np.asarray(A.sum(1)).ravel()
    fn=np.cross(X[F[:,1]]-X[F[:,0]],X[F[:,2]]-X[F[:,0]]); vn=np.zeros_like(X)
    for c in range(3): np.add.at(vn,F[:,c],fn)
    vn/=np.maximum(np.linalg.norm(vn,axis=1,keepdims=True),1e-15)
    palmar=vn[:,1]<-0.3
    # reference: the hypothenar pad (most palmar point per 5 mm x bin across the ulnar half of the palm), linear in x and
    # flat across the palm: a real palm carries the thenar and hypothenar pads at about the same height
    th=Wf[:,1:4].sum(1); P=[]
    m=palmar&(th<0.15)&(X[:,0]>=-0.005)&(X[:,0]<0.06)&(X[:,2]>=-0.025)&(X[:,2]<0.003); idx=np.where(m)[0]; kb=np.floor(X[idx,0]/0.005)
    for k in np.unique(kb): ii=idx[kb==k]; P.append(X[ii[np.argmin(X[ii,1])]])
    P=np.array(P); cf=np.polyfit(P[:,0],P[:,1],1)
    plane=np.polyval(cf,np.clip(X[:,0],P[:,0].min(),P[:,0].max())); e=plane-X[:,1]                 # > 0 = palmar of the pad line
    # thenar region: thumb share or the radial palm, proximal to the MCPs, faded out toward the wrist ring and the thumb proper
    reg=sstep(0.0,0.03,th+0.6*sstep(0.0,0.02,X[:,2]))*(1-sstep(0.045,0.065,X[:,0]))*sstep(-0.012,0.004,X[:,0])*(1-sstep(0.5,0.8,th))
    es=keep*np.tanh(np.maximum(e,0)/keep); d=np.where(palmar,(np.maximum(e,0)-es)*reg,0.0)
    # relax: Laplacian smoothing of the displacement (never below the computed lift where it is set)
    d0=d.copy()
    for it in range(int(os.environ.get('H_TH_IT','25'))): d=np.maximum(d0,0.5*d+0.5*(A@d)/deg)
    for it in range(int(os.environ.get("H_TH_SOFT","20"))): d=0.5*d+0.5*(A@d)/deg                                       # final soften of the max() kink
    Y=X.copy(); Y[:,1]+=d
    rep={'planeSamples':int(len(P)),'plane':[round(float(v),4) for v in cf],'maxExcessMm':float(e[palmar&(reg>0.5)].max()*1000),'maxLiftMm':float(d.max()*1000),
         'afterMaxExcessMm':float((plane-Y[:,1])[palmar&(reg>0.5)].max()*1000)}
    if verbose: print('thenar lift',rep)
    return Y, rep
if __name__=='__main__':
    import sys
    d=dict(np.load(sys.argv[1])); Y,r=lift_thenar(d['X'],d['F'],d['Wf']); d['X']=Y; np.savez(sys.argv[2],**d)
