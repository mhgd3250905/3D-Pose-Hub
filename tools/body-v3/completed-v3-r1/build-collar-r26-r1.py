"""Create the experimental local neck-ring inset from frozen r25 and rest data."""
import argparse,json
from pathlib import Path
import numpy as np
ap=argparse.ArgumentParser()
for name in ('candidate','rest','runtime','output'):ap.add_argument(name,type=Path)
args=ap.parse_args()
if args.output.exists():raise ValueError('output exists')
read=lambda x:json.loads(x.read_text(encoding='utf-8'))
base=read(args.candidate);P=np.array(read(args.rest)['meshes']['Mesh001']['P']).reshape(-1,3);N=np.array(read(args.runtime)['Mesh005']['N']).reshape(-1,3);center=P[5072];normal=N[[4957,5890,1833]].mean(0);normal/=np.linalg.norm(normal);distance=np.linalg.norm(P-center,axis=1);t=np.clip(1-distance/.008,0,1);fall=t*t*(3-2*t);shift=-normal[None,:]*fall[:,None]*.0008;delta=np.zeros_like(P);delta[base['neckMovedIndices']]=np.array(base['neckDeltaWorld']).reshape(-1,3);delta+=shift;ids=np.flatnonzero(np.linalg.norm(delta,axis=1)>1e-8);base['neckMovedIndices']=ids.tolist();base['neckDeltaWorld']=delta[ids].ravel().tolist();base['shoulderInteriorExperiment']={'centerSourceIds':[5072,5073],'radiusMm':8,'maxInsetMm':.8,'garmentFace':[4957,5890,1833],'direction':(-normal).tolist(),'limitations':'Local static-camera probe; motion and appearance unverified.'}
with args.output.open('x',encoding='utf-8') as f:json.dump(base,f,separators=(',',':'));f.write('\n')
print(json.dumps({'shiftedSourceVertices':int((fall>0).sum()),'maxInsetMm':float(np.linalg.norm(shift,axis=1).max()*1000)}))
