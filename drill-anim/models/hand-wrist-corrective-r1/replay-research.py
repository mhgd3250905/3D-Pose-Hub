"""CPU replay of exact captured render-time surfaces for candidate geometry research."""
import json,base64
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as R
import argparse
ap=argparse.ArgumentParser();ap.add_argument('--candidate',type=Path,required=True);ap.add_argument('--baseline',type=Path,required=True);args=ap.parse_args()
A=args.candidate;B=args.baseline;ROOT=A.parent
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
ref=read(A/'mesh-reference.json');P=np.array(ref['rest']).reshape(-1,3);F=np.array(ref['index']).reshape(-1,3);zero=read(A/'flex-0-twist-0.json');config=read(A/'report.json')['corrective']['config']
D=read(Path('drill-anim/models/hands-native-c1r2-symmetric-r1/hands-base.json'));J=np.frombuffer(base64.b64decode(D['joints']['u8']),'u1').reshape(-1,4);W=np.frombuffer(base64.b64decode(D['weights']['u8']),'u1').reshape(-1,4)/255
ss=lambda x:np.clip(x,0,1)**2*(3-2*np.clip(x,0,1))

def target(p,q,lo,hi,kind):
 x=p[:,0];u=np.clip((x-lo)/(hi-lo),0,1);L=hi-lo;end=q.apply([1.,0,0]);end=np.array(end);angle=np.arccos(np.clip(end[0],-1,1));axis=np.cross([1.,0,0],end);axis=axis/max(np.linalg.norm(axis),1e-14)
 if kind=='quintic':
  h00=1-10*u**3+15*u**4-6*u**5;h10=u-6*u**3+8*u**4-3*u**5;h01=1-h00;h11=-4*u**3+7*u**4-3*u**5;d00=-30*u*u+60*u**3-30*u**4;d10=1-18*u*u+32*u**3-15*u**4;d01=-d00;d11=-12*u*u+28*u**3-15*u**4
  c=(h01*hi+h11*L)[:,None]*end;c[:,0]+=h00*lo+h10*L;t=(d01*hi+d11*L)[:,None]*end;t[:,0]+=d00*lo+d10*L;t/=np.linalg.norm(t,axis=1)[:,None];quat=np.c_[np.zeros(len(t)),-t[:,2],t[:,1],1+t[:,0]];quat/=np.linalg.norm(quat,axis=1)[:,None];rot=R.from_quat(quat)
 elif kind=='arc':
  a=min(-lo,hi);w=np.clip((x+a)/(2*a),0,1)
  if angle<1e-8:c=np.c_[x,np.zeros((len(x),2))];rot=R.identity(len(x))
  else:
   radius=a/np.tan(angle/2);direction=(end-[end[0],0,0])/max(np.sin(angle),1e-14);c=(radius*(1-np.cos(angle*w)))[:,None]*direction;c[:,0]+=-a+radius*np.sin(angle*w);rot=R.from_rotvec(w[:,None]*angle*axis)
  lo=-a;hi=a;u=w
 swing=R.from_rotvec(axis*angle);twist=(swing.inv()*q).as_rotvec();rot=rot*R.from_rotvec(ss(u)[:,None]*twist);out=rot.apply(np.c_[np.zeros(len(x)),p[:,1:]])+c;out[x<=lo]=p[x<=lo];out[x>=hi]=q.apply(p[x>=hi]);return out

def predict(d,kind,lowScale=1,continuous=False,extraHigh=0,fadeHigh=True):
 old=read(B/f"flex-{d['command']['flex']}-twist-{d['command']['twist']}.json");out=np.array(old['world']).reshape(-1,3)
 for side,sign in [('left',1),('right',-1)]:
  z=zero['frames'][side];frame=d['frames'][side];flip=R.from_rotvec([0,np.pi if sign<0 else 0,0]);neutral=R.from_quat(z['handWorldQuaternion'])*flip;base=R.from_quat(frame['forearmWorldQuaternion'])*R.from_quat(z['forearmWorldQuaternion']).inv()*neutral;q=base.inv()*R.from_quat(frame['handWorldQuaternion'])*flip
  l=neutral.inv().apply(P-z['wrist']);inf=np.isin(J,[D['bones'].index(side+'Hand'),D['bones'].index(side+'Forearm')])*W;sel=((inf.sum(1)>=.8) if not continuous else np.ones(len(P),bool))&((P[:,0]>0) if sign>0 else (P[:,0]<0));cfg=config[side];lo=cfg['lowM']*lowScale;hi=cfg['highM']+(cfg['fadeM']*.5 if extraHigh is None else extraHigh);fade=cfg['fadeM'];sel&=(l[:,0]>lo)&(l[:,0]<hi);ids=np.where(sel)[0];w=ss((l[ids,0]-lo)/fade)*(ss((hi-l[ids,0])/fade) if fadeHigh else 1)
  tgt=base.apply(target(l[ids],q,lo,hi,kind))+frame['wrist'];out[ids]=out[ids]*(1-w[:,None])+tgt*w[:,None]
 return out

def metric(out,d):
 zz=np.array(read(B/f"flex-0-twist-{d['command']['twist']}.json")['world']).reshape(-1,3);ans={}
 for side in ['left','right']:
  f=F[np.isin(F,ref['sides'][side]['ids']).all(1)];area=lambda p:np.linalg.norm(np.cross(p[f[:,1]]-p[f[:,0]],p[f[:,2]]-p[f[:,0]]),axis=1);ratio=area(out)/area(zz);ans[side]={'min':float(ratio.min()),'p01':float(np.quantile(ratio,.01)),'below01':int((ratio<.1).sum()),'below025':int((ratio<.25).sum())}
 return ans
if __name__=='__main__':
 for flex in [-75,-60,60,75]:
  d=read(A/f'flex-{flex}-twist-0.json');actual=np.array(d['world']).reshape(-1,3)
  for kind in ['quintic','arc']:
   out=predict(d,kind);print(flex,kind,metric(out,d),'prediction maxMm',np.linalg.norm(out-actual,axis=1).max()*1000)
