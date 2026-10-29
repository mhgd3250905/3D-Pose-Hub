"""CPU prediction only: apply alternative band-kernel delta to exact captured frames.
Non-band points and both endpoint rings are kept bit-for-bit. This is not render,
normal continuity or restoration evidence. Sources are never mutated.
"""
import json,math,argparse,importlib.util
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as Rot
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('QA',HERE/'check.py');QA=importlib.util.module_from_spec(spec);spec.loader.exec_module(QA)
ROOT=Path('F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/webxr-wrist-join-r1')
load=QA.load
R=load(ROOT/'static-build-r1/recipe.json');D=ROOT/'gpu-grid-r3';REPORT=load(D/'report.json');REF={s:load(D/f)for s,f in REPORT['references'].items()}

def kernel(P,q,linear=0,compression=0):
 y=np.array([0.,1.,0.]);end=q.apply(y);angle=np.arccos(np.clip(end[1],-1,1));axis=np.cross(y,end);axis=axis/np.linalg.norm(axis)if np.linalg.norm(axis)>1e-10 else np.array([1.,0,0]);swing=Rot.from_rotvec(axis*angle);tq=(swing.inv()*q).as_quat();twist=(2*np.arctan2(tq[1],tq[3])+np.pi)%(2*np.pi)-np.pi
 out=P.copy();mask=(P[:,1]>-.02+1e-10)&(P[:,1]<.02-1e-10);t=(P[mask,1]+.02)/.04;smooth=t*t*(3-2*t);phase=smooth*(1-linear)+t*linear
 section=P[mask].copy();section[:,1]=0;section=Rot.from_rotvec(np.outer(phase*twist,y)).apply(section)
 direction=end-end[1]*y;direction=direction/np.linalg.norm(direction)if np.linalg.norm(direction)>1e-10 else np.array([0.,0,1.]);radius=.02/np.tan(angle/2)if angle>1e-8 else np.inf
 if compression and angle>1e-8:
  inner=section@direction;fade=np.sin(np.pi*t)**2;section-=np.outer(np.maximum(inner,0)*compression*fade,direction)
 center=np.outer(-.02+radius*np.sin(angle*t),y)+np.outer(radius*(1-np.cos(angle*t)),direction)if angle>1e-8 else np.outer(P[mask,1],y)
 out[mask]=Rot.from_rotvec(np.outer(angle*t,axis)).apply(section)+center;out[P[:,1]>=.02-1e-10]=q.apply(P[P[:,1]>=.02-1e-10]);return out

def predict(sample,side,linear,compression):
 ref=REF[side];s=sample['sides'][side];nf=R['neutralFrames'][side];H=QA.matrix(s['handMatrixWorld']);F=QA.matrix(s['forearmMatrixWorld']);N=Rot.from_quat(nf['forearmWorldQuaternion']);NC=np.asarray(nf['canonicalToWorldRowMajor']).reshape(4,4);B=Rot.from_matrix(F[:3,:3])*N.inv()*Rot.from_matrix(NC[:3,:3]);M=np.asarray(nf['webCanonicalToHandLocalRowMajor']).reshape(4,4);Q=B.inv()*Rot.from_matrix((H@M)[:3,:3]);P=np.array([v['canonicalRest']for v in R['bridge'][side]['vertices']]);delta=B.apply(kernel(P,Q,linear,compression)-kernel(P,Q));out=QA.points(s['positions']).copy();ids=np.array(ref['regions']['bandVertexIds']);out[ids]+=delta;return out

def audit(linear,compression,primary_only=True):
 rows=[]
 for entry in REPORT['rows']:
  command=entry['command']
  if primary_only and abs(command['flexDeg'])>60:continue
  sample=load(D/entry['file'])
  for side in ['left','right']:
   ref=REF[side];w,_=QA.weld(ref);_,E,F=QA.topology(ref,w);P=predict(sample,side,linear,compression);ratio=QA.ratios(P,QA.points(ref['positions']),F,E);cross=QA.crossing_pairs(P,F,w)
   rows.append({'name':entry['name'],'side':side,'areaMin':ratio['minimumAreaRatio'],'edgeMin':ratio['minimumEdgeRatio'],'collapsedFaces':ratio['collapsedFaceIds'],'crossings':cross['properCount']+cross['coplanarCount'],'pairs':cross['pairs']})
 return {'mode':'cpu-replay-candidate','renderTime':False,'prediction':True,'linearTwistMix':linear,'innerCompression':compression,'normalContinuity':'notMeasured','restoration':'notMeasured','rows':rows,'allPrimaryGeometryPass':all(x['areaMin']>=.1 and x['edgeMin']>=.1 and x['crossings']==0 for x in rows)}

if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--linear',type=float,default=0);a.add_argument('--compression',type=float,default=0);a.add_argument('--output',type=Path,required=True);args=a.parse_args();report=audit(args.linear,args.compression);args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'pass':report['allPrimaryGeometryPass'],'minArea':min(x['areaMin']for x in report['rows']),'failures':[x for x in report['rows']if x['areaMin']<.1 or x['crossings']]}))
