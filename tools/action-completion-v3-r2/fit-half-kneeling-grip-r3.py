"""CPU fit of a native left hand against exported actual rear ankle/shoe surfaces.
No asset mutation or GPU. Targets are real skinned mesh triangles, not a cylinder.
"""
import argparse,hashlib,json,sys
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation as R
ap=argparse.ArgumentParser();ap.add_argument('input',type=Path);ap.add_argument('output',type=Path);ap.add_argument('--evaluations',type=int,default=90);args=ap.parse_args()
if args.output.exists():raise SystemExit('Use a fresh output path')
raw=args.input.read_bytes();record=json.loads(raw);d=record['handInput'];m=d['mesh'];cur=d['current']['left'];rig=d['rig']['fingers'];fns=['thumb','index','middle','ring','pinky']
ids=np.array(cur['vertexGroups']['all']);index=np.array(m['index']).reshape(-1,3);lookup={int(v):i for i,v in enumerate(ids)};faces=np.array([[lookup[int(i)] for i in f] for f in index if all(int(i) in lookup for i in f)])
actual=np.array(m['positionsWorld']).reshape(-1,3)[ids];H=np.array(cur['handMatrixWorld']).reshape(4,4).T;Hi=np.linalg.inv(H);actual_local=(np.c_[actual,np.ones(len(ids))]@Hi.T)[:,:3]
si=np.array(m['skinIndex']).reshape(-1,4)[ids];sw=np.array(m['skinWeight']).reshape(-1,4)[ids];names=[b['name'] for b in m['bones']];ix={n:i for i,n in enumerate(names)}
groups={f:np.array([lookup[int(i)] for i in cur['vertexGroups']['distal'][f]]) for f in fns};groups['palm']=np.array([lookup[int(i)] for i in cur['vertexGroups']['palm']])
def matrices(qs):
 mats=np.tile(np.eye(4),(len(names),1,1))
 for fn in fns:
  parent=np.eye(4);last=np.zeros(3)
  for k in range(3):
   at=np.array(rig[fn]['joints'][k]);local=np.eye(4);local[:3,3]=at-last;local[:3,:3]=R.from_quat(qs[fn+str(k+1)]).as_matrix();parent=parent@local;inv=np.eye(4);inv[:3,3]=-at;mats[ix['v2p_L_'+fn+str(k+1)]]=parent@inv;last=at
 return mats
# Undo the known exported finger pose exactly. Wrist collar is not optimized.
current_q=cur['currentFingerQuaternions'];current_m=matrices(current_q);blend=sum(current_m[si[:,k]]*sw[:,k,None,None] for k in range(4));rest=np.einsum('nij,nj->ni',np.linalg.inv(blend),np.c_[actual_local,np.ones(len(ids))]);assert np.max(abs(np.einsum('nij,nj->ni',blend,rest)[:,:3]-actual_local))<1e-9
def targets(x):
 qs={}
 for fi,fn in enumerate(fns):
  for k in range(3):
   q=R.from_euler('xyz',x[12:15],degrees=True) if fn=='thumb' and k==0 else R.from_rotvec(np.array(rig[fn]['flexAxis'])*np.deg2rad(x[14+k] if fn=='thumb' else x[(fi-1)*3+k]));qs[fn+str(k+1)]=q.as_quat().tolist()
 return qs
def pose(x):
 mats=matrices(targets(x));local=sum(np.einsum('nij,nj->ni',mats[si[:,k]],rest)*sw[:,k,None] for k in range(4))[:,:3];q=R.from_rotvec(np.deg2rad(x[20:23])).as_matrix()@H[:3,:3];return local@q.T+H[:3,3]+x[17:20],q
def closest(points,tri):
 a,b,c=tri[:,:,0],tri[:,:,1],tri[:,:,2];p=points[:,None,:];ab=b-a;ac=c-a;ap=p-a
 aa=(ab*ab).sum(-1);bb=(ab*ac).sum(-1);cc=(ac*ac).sum(-1);d=(ab*ap).sum(-1);e=(ac*ap).sum(-1);den=aa*cc-bb*bb
 u=np.divide(d*cc-e*bb,den,out=np.zeros_like(d),where=abs(den)>1e-24);v=np.divide(e*aa-d*bb,den,out=np.zeros_like(e),where=abs(den)>1e-24);proj=a+u[:,:,None]*ab+v[:,:,None]*ac;inside=(u>=0)&(v>=0)&(u+v<=1)&(abs(den)>1e-24)
 dist=np.where(inside,((p-proj)**2).sum(-1),np.inf);best=proj.copy()
 for start,end in [(a,b),(b,c),(c,a)]:
  edge=end-start;t=np.clip(((p-start)*edge).sum(-1)/np.maximum((edge*edge).sum(-1),1e-30),0,1);q=start+t[:,:,None]*edge;dd=((p-q)**2).sum(-1);mask=dd<dist;best[mask]=q[mask];dist=np.minimum(dist,dd)
 j=dist.argmin(1);return best[np.arange(len(points)),j],j
surfaces=[]
for mesh in record['targets']['meshes']:
 vertices=np.array(mesh['positionsWorld']);tri=vertices[np.array(mesh['triangles'])];normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm=np.linalg.norm(normal,axis=1);tri=tri[norm>1e-12];normal=normal[norm>1e-12]/norm[norm>1e-12,None];surfaces.append({'name':mesh['name'],'tri':tri,'normal':normal,'tree':cKDTree(tri.mean(1))})
def distances(points):
 all_dist=[]
 for sf in surfaces:
  _,ii=sf['tree'].query(points,k=min(8,len(sf['tri'])));near,j=closest(points,sf['tri'][ii]);n=sf['normal'][ii[np.arange(len(points)),j]];delta=points-near;sgn=np.where((delta*n).sum(1)<0,-1,1);all_dist.append(np.linalg.norm(delta,axis=1)*sgn)
 return np.min(np.array(all_dist),axis=0)
dominant=np.array([names[i] for i in si[np.arange(len(si)),sw.argmax(1)]])
palm_faces=faces[np.all(dominant[faces]=='leftHand',axis=1)]
palm_tri=rest[palm_faces,:3];palm_normal=np.cross(palm_tri[:,1]-palm_tri[:,0],palm_tri[:,2]-palm_tri[:,0]);length=np.linalg.norm(palm_normal,axis=1);keep=length>1e-12;palm_tri=palm_tri[keep];palm_normal=palm_normal[keep]/length[keep,None];palm_tree=cKDTree(palm_tri.mean(1))
thumb_ids=np.where(np.isin(dominant,['v2p_L_thumb2','v2p_L_thumb3']))[0]
def palm_penalty(world,q,x):
 local=(world-H[:3,3]-x[17:20])@q
 pts=local[thumb_ids];_,ii=palm_tree.query(pts,k=12);near,j=closest(pts,palm_tri[ii]);n=palm_normal[ii[np.arange(len(pts)),j]];delta=pts-near;sd=np.linalg.norm(delta,axis=1)*np.where((delta*n).sum(1)<0,-1,1)
 return np.minimum(sd-.0005,0)*4500
ring_faces=faces[np.all(np.isin(dominant[faces],['v2p_L_ring2','v2p_L_ring3']),axis=1)]
mid_ids=np.where(dominant=='v2p_L_middle3')[0]
thumbbase_faces=faces[np.any(dominant[faces]=='v2p_L_thumb1',axis=1)]
def finger_penalty(world):
 tri=world[ring_faces];normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm=np.linalg.norm(normal,axis=1);normal/=np.maximum(norm[:,None],1e-12);tree=cKDTree(tri.mean(1));pts=world[mid_ids];_,ii=tree.query(pts,k=12);near,j=closest(pts,tri[ii]);n=normal[ii[np.arange(len(pts)),j]];delta=pts-near;sd=np.linalg.norm(delta,axis=1)*np.where((delta*n).sum(1)<0,-1,1)
 return np.minimum(sd-.0007,0)*4500
active=np.where(rest[:,0]>.025)[0];start=np.array(json.loads(Path('F:/PoseHub-v2-production/template-finalization-20261029/planning/half-kneeling-grip-fit-r2.json').read_bytes())['parameters']);start[3]=48

lo=[5,5,0]*4+[-30,-35,-35,-5,-5]+[-.055]*3+[-45]*3;hi=[80,75,45]*4+[35,35,35,45,45]+[.055]*3+[55]*3;hi[3]=50
def residual(x):
 world,q=pose(x);dist=distances(world);pen=np.minimum(dist[active]-.0005,0)*3500;contact=np.array([np.mean(np.sort(abs(dist[g]-.001))[:min(20,len(g))]) for g in groups.values()])*1100
 basecenters=world[thumbbase_faces].mean(1);baseclear=np.minimum(distances(basecenters)-.001,0)*5000
 return np.r_[pen,baseclear,palm_penalty(world,q,x),finger_penalty(world),contact,(x[:12]-start[:12])*.002,x[17:20]*8,x[20:23]*.003]
fit=least_squares(residual,start,bounds=(lo,hi),max_nfev=args.evaluations,ftol=1e-6,xtol=1e-6,gtol=1e-6,diff_step=1e-4);world,q=pose(fit.x);dist=distances(world)
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'human-v2plus/hands-native'));from check import audit
selfcheck=audit(world,faces,{'left':np.arange(len(faces))})
report={'format':'half-kneeling-native-grip-cpu-fit-r3','sourceInput':str(args.input),'sourceSha256':hashlib.sha256(raw).hexdigest(),'targetMeshes':[s['name'] for s in surfaces],'targets':targets(fit.x),'parameters':fit.x.tolist(),'wristWorld':(H[:3,3]+fit.x[17:20]).tolist(),'handWorldQuaternion':R.from_matrix(q).as_quat().tolist(),'evaluations':fit.nfev,'cost':float(fit.cost),'minimumSignedVertexGapMm':float(dist[active].min()*1000),'negativeVertices':int((dist[active]<-.0001).sum()),'contacts':{f:{'minimumGapMm':float(dist[g].min()*1000),'closest20MeanAbsGapMm':float(np.mean(np.sort(abs(dist[g]))[:20])*1000)} for f,g in groups.items()},'selfIntersection':selfcheck,'thumbPalmConstraints':{'sampleVertices':len(thumb_ids),'palmTriangles':len(palm_tri)},'limits':['CPU fit uses nearest 8 triangle candidates per surface; final exact triangle intersections and independent GPU remain required.','Fitting reconstructs immutable native rest shape from the recorded known finger FK; wrist collar is excluded from optimization.','No source mesh, generic preset or renderer was modified.'],'passedAsCandidate':False}
args.output.write_bytes((json.dumps(report,indent=2)+'\n').encode());print(json.dumps({k:v for k,v in report.items() if k not in ['targets','parameters','selfIntersection']},indent=2));print('self pairs',selfcheck['left']['pairs'])
