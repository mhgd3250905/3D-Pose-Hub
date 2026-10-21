# direction sketch: v2 hand vs base-mesh hand (hands_fit.npz), left hand, rest + named finger poses, offline LBS on the v2
# finger rig (left hand-bone local frame).  sketch.py <out.jpg> [pose ...]
import sys, json
from PIL import Image
from hands_a import *
from splat import raster, label
def chain_mats(pose):
    Ms={}
    for f in FN:
        J=Jv[f]; Mp=np.eye(4)
        for j in range(3):
            q=pose.get(f+str(j+1),[0,0,0,1]); R=Rr.from_quat(q).as_matrix(); T=np.eye(4); T[:3,:3]=R; T[:3,3]=J[j]-R@J[j]
            Mp=Mp@T; Ms[f+str(j+1)]=Mp.copy()
    return Ms
def skin(X,W,names,pose):
    Ms=chain_mats(pose); out=np.zeros_like(X); Xh=np.c_[X,np.ones(len(X))]
    for c,nm in enumerate(names):
        w=W[:,c]
        if not w.any(): continue
        Mm=Ms.get(nm[2:] if nm.startswith('l_') else nm,np.eye(4)); out+=w[:,None]*(Xh@Mm.T)[:,:3]
    return out
if __name__=='__main__':
    poses=sys.argv[2:] or ['grip-bar']
    d=np.load('hands_fit.npz'); XB,FBm,Wf=d['X'],d['F'],d['Wf']
    # v2 hand: Coach_Body vertices around the left hand with the v2plus finger weights
    B=P[BODY]; FBd=np.array(M[BODY]['index']).reshape(-1,3); XV=(B-pH)@RH
    hw=HJ['weights']['left']; names=['leftHand']+['l_'+b for b in FB]; ni={n:i for i,n in enumerate(names)}
    WV=np.zeros((len(B),len(names))); WV[:,0]=1
    for i,bs,ws in zip(hw['idx'],hw['bones'],hw['w']):
        WV[i]=0
        for b,w in zip(bs,ws): WV[i,ni.get(b,0)]+=w/255
    mv=(B[:,0]>0.15)&(XV[:,0]>-0.04)&(B[:,1]>0.5)&(np.abs(XV).max(1)<0.3); V2,F2,u=compact(XV,FBd,mv[FBd].all(1)); WV=WV[u]
    SK=[214,170,140]; rows=[]
    for pn in ['rest']+poses:
        pose={} if pn=='rest' else HJ['poses'][pn]
        A=skin(V2,WV,names,pose); Bq=skin(XB,Wf,['leftHand']+FB,pose)
        for dv in ((0,1,0.001),(0,-1,0.001),(0.001,0.3,1)):
            rows.append(np.concatenate([label(raster([(A,F2,SK,None)],dv,(0.1,0,0.035),0.17,300),'v2 '+pn),label(raster([(Bq,FBm,SK,None)],dv,(0.1,0,0.035),0.17,300),'base '+pn)],1))
    grid=[np.concatenate(rows[i:i+3],1) for i in range(0,len(rows),3)]
    Image.fromarray(np.concatenate(grid,0)).save(sys.argv[1],quality=88); print('saved',sys.argv[1])
