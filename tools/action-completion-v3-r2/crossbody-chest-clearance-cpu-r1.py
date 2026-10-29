import json,numpy as np
from pathlib import Path
from scipy.spatial.transform import Rotation as R
B=Path('F:/PoseHub-v2-production/template-finalization-20261029');rest=json.loads(Path('F:/PoseHub-v2-production/elbow-review-20261029/bear-arm-continuity-candidate-r3/probe.json').read_text())['rest'];m=rest['meshes']['V3_Head_Neck_Torso_Shared_R26'];vs={v['id']:v for v in m['vertices'] if max(v['weights'],key=lambda w:w['weight'])['bone'] in ['torso','spineUpper','spineLower','pelvis','leftScapula','rightScapula']};faces=[f for f in m['facesOriginalIndices'] if all(i in vs for i in f)];P=np.array([0,.956970171859,.004045798312]);R0=np.array([0,.963525171859,.008228798312]);rot=R.from_euler('x',1,degrees=True);tris=np.array([[rot.apply(np.array(vs[i]['world'])-R0)+P for i in f] for f in faces]);xy=tris[:,:,:2];a=xy[:,0];ab=xy[:,1]-a;ac=xy[:,2]-a;det=ab[:,0]*ac[:,1]-ab[:,1]*ac[:,0];mask=abs(det)>1e-10;tris=tris[mask];a=a[mask];ab=ab[mask];ac=ac[mask];det=det[mask]
def front(p):
 ap=p[:2]-a;u=(ap[:,0]*ac[:,1]-ap[:,1]*ac[:,0])/det;v=(ab[:,0]*ap[:,1]-ab[:,1]*ap[:,0])/det;ok=(u>=0)&(v>=0)&(u+v<=1)
 if not ok.any():return None
 return float(np.max(tris[ok,0,2]+u[ok]*(tris[ok,1,2]-tris[ok,0,2])+v[ok]*(tris[ok,2,2]-tris[ok,0,2])))
rows=[]
for rev in [8,9]:
 d=json.loads((B/f'planning/crossbody-contact-r{rev}-engine-cpu.json').read_text());out=[]
 for f in [0,60,114]:
  j=d['rows'][f]['after']['j'];S=np.array(j['rightShoulder']);E=np.array(j['rightElbow']);axis=(E-S)/np.linalg.norm(E-S);samples=[]
  for t in [.10,.125,.15,.175,.20]:
   p=S+axis*t;z=front(p)
   if z is not None:samples.append({'alongMm':t*1000,'centerBeyondChestFrontMm':(p[2]-z)*1000})
  out.append({'frame':f,'samples':samples})
 rows.append({'revision':rev,'frames':out})
p=B/'planning/crossbody-chest-clearance-r1.json';p.write_text(json.dumps({'method':'CPU chest-front +Z triangle rays on neutral actual torso transformed by unchanged body pose; shaft center only, not full-skin collision certificate','rows':rows},indent=2));print(json.dumps(rows))
