"""Read-only exact strict triangle cross audit and two actual foot poses for a fitted hand."""
import argparse,sys,json,hashlib
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation as R
ap=argparse.ArgumentParser();ap.add_argument('fit',type=Path);ap.add_argument('probe',type=Path);ap.add_argument('output',type=Path);args=ap.parse_args();saved=args
# Reuse established inverse-LBS/geometry definitions without running optimizer.
sys.argv=['audit',str(args.probe/'frame-0000-contact.json'),str(args.output)]
exec(Path('tools/action-completion-v3-r2/fit-half-kneeling-grip-r1.py').read_text(encoding='utf-8').split('active=np.where')[0])
args=saved;fit=json.loads(args.fit.read_bytes());x=np.array(fit['parameters']);world0,q=pose(x)
sys.path.insert(0,str(Path.cwd()/'tools/human-v2plus/hands-native'));from check import audit,hits
F0=np.array(next(b['matrixWorld'] for b in m['bones'] if b['name']=='leftFoot')).reshape(4,4).T
localWrist=np.linalg.inv(F0)@np.r_[fit['wristWorld'],1];localHandQ=R.from_matrix(F0[:3,:3].T@q).as_quat()
def cross(a,b):
 ac=a.mean(1);ar=np.linalg.norm(a-ac[:,None],axis=2).max(1);bc=b.mean(1);br=np.linalg.norm(b-bc[:,None],axis=2).max(1);tree=cKDTree(bc);pairs=[]
 for i,near in enumerate(tree.query_ball_point(ac,ar+br.max())):
  n=np.array(near,dtype=int)
  if len(n):
   n=n[(b[n].min(1)<=a[i].max(0)).all(1)&(b[n].max(1)>=a[i].min(0)).all(1)]
   if len(n):
    aa=np.repeat(a[i][None],len(n),axis=0);hit=hits(aa,b[n])|hits(b[n],aa);pairs.extend([int(i),int(j)] for j in n[hit])
 return {'pairs':len(pairs),'witnesses':pairs[:20]}
results=[]
for frame in [0,114]:
 p=args.probe/f'frame-{frame:04d}-contact.json';r=json.loads(p.read_bytes());F=np.array(next(b['matrixWorld'] for b in r['handInput']['mesh']['bones'] if b['name']=='leftFoot')).reshape(4,4).T;delta=F@np.linalg.inv(F0);world=(np.c_[world0,np.ones(len(world0))]@delta.T)[:,:3];surfaces=[]
 for mesh in r['targets']['meshes']:
  tri=np.array(mesh['positionsWorld'])[np.array(mesh['triangles'])];normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm=np.linalg.norm(normal,axis=1);tri=tri[norm>1e-12];normal=normal[norm>1e-12]/norm[norm>1e-12,None];surfaces.append({'name':mesh['name'],'tri':tri,'normal':normal,'tree':cKDTree(tri.mean(1))})
 dist=distances(world);active=np.where(rest[:,0]>.025)[0];results.append({'frame':frame,'inputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'minimumSignedVertexGapMm':float(dist[active].min()*1000),'negativeVertices':int((dist[active]<-.0001).sum()),'handTargetTriangleCrosses':{sf['name']:cross(world[faces],sf['tri']) for sf in surfaces},'contacts':{fn:{'minimumGapMm':float(dist[g].min()*1000),'closest20MeanAbsGapMm':float(np.mean(np.sort(abs(dist[g]))[:20])*1000)} for fn,g in groups.items()}})
report={'format':'half-native-grip-two-pose-cpu-audit-r1','fitSha256':hashlib.sha256(args.fit.read_bytes()).hexdigest(),'footLocalWrist':localWrist[:3].tolist(),'footLocalHandQuaternion':localHandQ.tolist(),'selfIntersection':audit(world0,faces,{'left':np.arange(len(faces))}),'poses':results,'limits':['Exact strict noncoplanar triangle crossings; coplanar overlap not covered. Vertex signed distances use nearest triangle normals.','Two actual corrected foot poses only; independent GPU remains required.'],'passedAsCandidate':False}
args.output.write_bytes((json.dumps(report,indent=2)+'\n').encode());print(json.dumps(report,indent=2))
