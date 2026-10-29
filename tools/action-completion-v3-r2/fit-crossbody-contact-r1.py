import ast,json
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as R
from scipy.spatial import cKDTree
B=Path('F:/PoseHub-v2-production/template-finalization-20261029');d=json.loads((B/'probes/half-kneeling-grip-input-r5-attempt02/frame-0000-contact.json').read_text())['handInput'];m=d['mesh'];cur=d['current']['left'];ids=np.array(cur['vertexGroups']['all']);world=np.array(m['positionsWorld']).reshape(-1,3);H=np.array(cur['handMatrixWorld']).reshape(4,4).T;hand=(np.c_[world[ids],np.ones(len(ids))]@np.linalg.inv(H).T)[:,:3];lookup={int(v):i for i,v in enumerate(ids)};palm=np.array([lookup[int(i)] for i in cur['vertexGroups']['palm']]);nodes=ast.parse(Path('tools/action-completion-v3-r2/fit-half-kneeling-grip-r1.py').read_text()).body;exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name=='closest'],type_ignores=[]),'closest','exec'))
bear=json.loads(Path('F:/PoseHub-v2-production/elbow-review-20261029/bear-arm-continuity-candidate-r3/frame-0060-geometry.json').read_text());mesh=bear['meshes']['V2P_Base_Limbs'];vs={v['id']:v for v in mesh['vertices'] if v['weights']==[{'bone':'rightUpperArm','weight':1}]};vi=sorted(vs);vl={v:i for i,v in enumerate(vi)};faces=np.array([[vl[i] for i in f] for f in mesh['facesOriginalIndices'] if all(i in vs for i in f)]);old=np.array(bear['bones']['rightUpperArm']['matrixWorld']).reshape(4,4).T;target=(np.c_[[vs[i]['world'] for i in vi],np.ones(len(vi))]@np.linalg.inv(old).T)[:,:3]

from scipy.optimize import least_squares
records=json.loads((B/'planning/crossbody-reach-r6-cpu.json').read_text());pose=records['rows'][0]['after'];j=pose['j'];qr=R.from_quat(pose['q']['rightUpperArm']);hr=R.from_quat(pose['q']['leftHand']);ref=qr.inv().apply(hr.apply(hand)+j['leftWrist']-np.array(j['rightShoulder']));center=ref[palm].mean(0)
tri=target[faces];norm=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-12);mid=tri.mean(1);rad=mid.copy();rad[:,0]=0;norm[(norm*rad).sum(1)<0]*=-1;tree=cKDTree(mid)
# Axial range of rigid section excludes shoulder cloth and elbow blend; require palm contact within it.
def dist(p):
 _,ii=tree.query(p,k=20);near,j=closest(p,tri[ii]);dd=p-near;return np.linalg.norm(dd,axis=1)*np.where((dd*norm[ii[np.arange(len(p)),j]]).sum(1)<0,-1,1)
def move(x):return R.from_rotvec(x[3:]).apply(ref-center)+center+x[:3]
subset=np.unique(np.r_[np.arange(0,len(hand),8),palm[::4]])
def residual(x):
 p=move(x);ds=dist(p[subset]);dp=dist(p[palm[::4]]);ps=p[palm].mean(0);return np.r_[np.minimum(ds-.0007,0)*1800,np.sort(dp)[:24]*550, max(-ps[0]-.205,0)*800,max(.175+ps[0],0)*800, x[3:]*.1]
x=np.zeros(6);near,jj=closest(center[None],tri[tree.query(center[None],k=20)[1]]);x[:3]=(near[0]-center)*.88
fit=least_squares(residual,x,bounds=([-.09,-.09,-.09,-.8,-.8,-.8],[.09,.09,.09,.8,.8,.8]),max_nfev=100,diff_step=1e-4,ftol=1e-6)
p=move(fit.x);dd=dist(p);dp=dd[palm];result={'parameters':fit.x.tolist(),'handCenterUpperLocal':center.tolist(),'minAllMm':float(dd.min()*1000),'minPalmMm':float(dp.min()*1000),'palmNear2':int((abs(dp)<.002).sum()),'handLocalQuaternion':(R.from_rotvec(fit.x[3:])*qr.inv()*hr).as_quat().tolist(),'wristLocal':(R.from_rotvec(fit.x[3:]).apply(qr.inv().apply(np.array(j['leftWrist'])-j['rightShoulder'])-center)+center+fit.x[:3]).tolist(),'palmLocal':(R.from_rotvec(fit.x[3:]).apply(qr.inv().apply(np.array(j['leftPalm'])-j['rightShoulder'])-center)+center+fit.x[:3]).tolist(),'limits':['CPU rigid upper-arm section fit; actual full skinned contact and wrist/hand visibility required.']};(B/'planning/crossbody-contact-fit-r1.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
