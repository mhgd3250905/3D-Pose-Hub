import ast,json
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as R
from scipy.spatial import cKDTree
B=Path('F:/PoseHub-v2-production/template-finalization-20261029');d=json.loads((B/'probes/half-kneeling-grip-input-r5-attempt02/frame-0000-contact.json').read_text())['handInput'];m=d['mesh'];cur=d['current']['left'];ids=np.array(cur['vertexGroups']['all']);world=np.array(m['positionsWorld']).reshape(-1,3);H=np.array(cur['handMatrixWorld']).reshape(4,4).T;hand=(np.c_[world[ids],np.ones(len(ids))]@np.linalg.inv(H).T)[:,:3];lookup={int(v):i for i,v in enumerate(ids)};palm=np.array([lookup[int(i)] for i in cur['vertexGroups']['palm']]);nodes=ast.parse(Path('tools/action-completion-v3-r2/fit-half-kneeling-grip-r1.py').read_text()).body;exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name=='closest'],type_ignores=[]),'closest','exec'))
bear=json.loads(Path('F:/PoseHub-v2-production/elbow-review-20261029/bear-arm-continuity-candidate-r3/frame-0060-geometry.json').read_text());mesh=bear['meshes']['V2P_Base_Limbs'];vs={v['id']:v for v in mesh['vertices'] if v['weights']==[{'bone':'rightUpperArm','weight':1}]};vi=sorted(vs);vl={v:i for i,v in enumerate(vi)};faces=np.array([[vl[i] for i in f] for f in mesh['facesOriginalIndices'] if all(i in vs for i in f)]);old=np.array(bear['bones']['rightUpperArm']['matrixWorld']).reshape(4,4).T;target=(np.c_[[vs[i]['world'] for i in vi],np.ones(len(vi))]@np.linalg.inv(old).T)[:,:3]
records=json.loads((B/'planning/crossbody-reach-r6-cpu.json').read_text());out=[]
for rec in records['rows']:
 row={'frame':rec['frame']}
 for version in ['before','after']:
  pose=rec[version];j=pose['j'];hr=R.from_quat(pose['q']['leftHand']).as_matrix();h=hand@hr.T+j['leftWrist'];tr=R.from_quat(pose['q']['rightUpperArm']).as_matrix();v=target@tr.T+j['rightShoulder'];tri=v[faces];center=tri.mean(1);normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12);axis=np.array(j['rightElbow'])-j['rightShoulder'];length=np.linalg.norm(axis);axis/=length;rad=center-j['rightShoulder'];rad-=((rad@axis)[:,None]*axis);normal[(normal*rad).sum(1)<0]*=-1
  _,ii=cKDTree(center).query(h,k=32);near,idx=closest(h,tri[ii]);delta=h-near;dist=np.linalg.norm(delta,axis=1)*np.where((delta*normal[ii[np.arange(len(h)),idx]]).sum(1)<0,-1,1)*1000;along=(h-j['rightShoulder'])@axis;sel=(along>.17)&(along<length-.015)
  row[version]={'palmMinMm':float(dist[palm].min()),'allRegionMinMm':float(dist[sel].min()),'palmNear2mm':int((abs(dist[palm])<2).sum()),'negativeRegion1mm':int((dist[sel]<-1).sum())}
 out.append(row)
summary={s:{'palmRangeMm':[min(r[s]['palmMinMm'] for r in out),max(r[s]['palmMinMm'] for r in out)],'allRegionMinMm':min(r[s]['allRegionMinMm'] for r in out),'negativeRegion1mm':max(r[s]['negativeRegion1mm'] for r in out)} for s in ['before','after']};(B/'planning/crossbody-contact-r6-cpu.json').write_text(json.dumps({'summary':summary,'rows':out},indent=2));print(json.dumps(summary))
