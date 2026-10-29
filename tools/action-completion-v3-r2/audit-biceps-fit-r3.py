"""Reuse real exported hand skin and rigid forearm geometry; CPU only, no asset mutation.
Reconstruction is checked against r7 actual-render palm samples and target witnesses.
"""
import ast,json,hashlib,sys,argparse
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as R
from scipy.spatial import cKDTree
from scipy.optimize import least_squares
ap=argparse.ArgumentParser();ap.add_argument('output',type=Path);ap.add_argument('--evaluations',type=int,default=80);args=ap.parse_args()
if args.output.exists():raise SystemExit('Fresh output required')
B=Path('F:/PoseHub-v2-production/template-finalization-20261029')
handfile=B/'probes/half-kneeling-grip-input-r5-attempt02/frame-0000-contact.json'
bearfile=Path('F:/PoseHub-v2-production/elbow-review-20261029/bear-arm-continuity-candidate-r3/frame-0060-geometry.json')
capturefile=B/'captures/h-biceps-self/attempt02/capture.json'
d=json.loads(handfile.read_text())['handInput'];m=d['mesh'];cur=d['current']['left'];rig=d['rig']['fingers'];fns=['thumb','index','middle','ring','pinky']
ids=np.array(cur['vertexGroups']['all']);lookup={int(v):i for i,v in enumerate(ids)};index=np.array(m['index']).reshape(-1,3);faces=np.array([[lookup[int(i)] for i in f] for f in index if all(int(i) in lookup for i in f)])
actual=np.array(m['positionsWorld']).reshape(-1,3)[ids];H=np.array(cur['handMatrixWorld']).reshape(4,4).T;Hi=np.linalg.inv(H);actual_local=(np.c_[actual,np.ones(len(ids))]@Hi.T)[:,:3]
si=np.array(m['skinIndex']).reshape(-1,4)[ids];sw=np.array(m['skinWeight']).reshape(-1,4)[ids];names=[b['name'] for b in m['bones']];ix={n:i for i,n in enumerate(names)}
# Reuse the independently used half-kneeling FK and exact point/triangle implementation.
shared=Path(__file__).with_name('fit-half-kneeling-grip-r1.py');nodes=ast.parse(shared.read_text()).body
exec(compile(ast.Module(body=[n for n in nodes if isinstance(n,ast.FunctionDef) and n.name in ['matrices','closest']],type_ignores=[]),str(shared),'exec'))
current_q=cur['currentFingerQuaternions'];blend=sum(matrices(current_q)[si[:,k]]*sw[:,k,None,None] for k in range(4));rest=np.einsum('nij,nj->ni',np.linalg.inv(blend),np.c_[actual_local,np.ones(len(ids))])
def skin(qs):
 mats=matrices(qs);return sum(np.einsum('nij,nj->ni',mats[si[:,k]],rest)*sw[:,k,None] for k in range(4))[:,:3]
base_q=json.loads(json.dumps(current_q));base_q.update({'thumb1':[-.1049098158515736,0,.1593800591498046,.981627183447664],'thumb2':[0,0,0,1],'thumb3':[0,0,0,1]})
bear=json.loads(bearfile.read_text());verts={v['id']:v for v in bear['meshes']['V2P_Base_Limbs']['vertices'] if v['weights']==[{'bone':'rightForearm','weight':1}]};targetids=sorted(verts);targetlookup={v:i for i,v in enumerate(targetids)};targetfaces=np.array([[targetlookup[i] for i in f] for f in bear['meshes']['V2P_Base_Limbs']['facesOriginalIndices'] if all(i in verts for i in f)])
old=np.array(bear['bones']['rightForearm']['matrixWorld']).reshape(4,4).T;targetlocal=(np.c_[[verts[i]['world'] for i in targetids],np.ones(len(targetids))]@np.linalg.inv(old).T)[:,:3]
capture=json.loads(capturefile.read_text());world=np.array(m['positionsWorld']).reshape(-1,3);surfaces=[];checks=[]
for frame in range(241):
 rec=json.loads((B/f'probes/biceps-contact-candidate-r7/frame-{frame:04}-contact.json').read_text())
 pairs=[s for s in rec['samples'] if all(sw[lookup[s['id']],k]<1e-8 or 'thumb' not in names[si[lookup[s['id']],k]] for k in range(4))]
 a=world[[s['id'] for s in pairs]];b=np.array([s['world'] for s in pairs]);u,_,vh=np.linalg.svd((a-a.mean(0)).T@(b-b.mean(0)));rot=vh.T@u.T;trans=b.mean(0)-rot@a.mean(0);M=np.eye(4);M[:3,:3]=rot;M[:3,3]=trans;HH=M@H;HHinv=np.linalg.inv(HH)
 rebuilt=skin(base_q)@HH[:3,:3].T+HH[:3,3];handerr=max(np.linalg.norm(rebuilt[lookup[s['id']]]-s['world']) for s in rec['samples'])
 targetR=R.from_quat(capture['metrics'][frame]['actualRenderRotations']['right']['forearm']['worldQuaternion']).as_matrix();targetWorld=targetlocal@targetR.T+rec['rightElbow'];target=(np.c_[targetWorld,np.ones(len(targetWorld))]@HHinv.T)[:,:3];tri=target[targetfaces]
 witnesserr=[]
 for s in rec['samples']:
  t=targetWorld[[targetlookup[i] for i in s['targetTriangle']]];n=np.cross(t[1]-t[0],t[2]-t[0]);n/=np.linalg.norm(n);witnesserr.append(abs(np.dot(np.array(s['point'])-t[0],n)))
 assert handerr<1e-6 and max(witnesserr)<1e-8,(frame,handerr,max(witnesserr))
 elbow=(HHinv@np.r_[rec['rightElbow'],1])[:3];wrist=(HHinv@np.r_[rec['rightWrist'],1])[:3];axis=wrist-elbow;length=np.linalg.norm(axis);axis/=length
 normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm=np.linalg.norm(normal,axis=1);keep=norm>1e-12;tri=tri[keep];normal=normal[keep]/norm[keep,None];center=tri.mean(1);radial=center-elbow-((center-elbow)@axis)[:,None]*axis;normal[(normal*radial).sum(1)<0]*=-1
 tt=frame/30
 u=0 if tt<=.3 or tt>=7.7 else (1-np.cos(np.pi*(tt-.3)/3.8))/2 if tt<4.1 else 1 if tt<=4.5 else (1+np.cos(np.pi*(tt-4.5)/3.2))/2
 beta=np.deg2rad(70+52*u-1);offset_direction=HHinv[:3,:3]@np.array([0,np.sin(beta),np.cos(beta)])
 surfaces.append({'u':u,'offsetDirection':offset_direction,'frame':frame,'tri':tri,'normal':normal,'tree':cKDTree(center),'elbow':elbow,'axis':axis,'length':length})
 checks.append({'frame':frame,'handReconstructionMaxMm':handerr*1000,'forearmWitnessMaxMm':max(witnesserr)*1000,'matchedPalmVertices':len(rec['samples'])})
def distance(points,sf,k=12):
 _,ii=sf['tree'].query(points,k=k);near,j=closest(points,sf['tri'][ii]);normal=sf['normal'][ii[np.arange(len(points)),j]];delta=points-near;dist=np.linalg.norm(delta,axis=1)*np.where((delta*normal).sum(1)<0,-1,1);along=(points-sf['elbow'])@sf['axis'];outside=(along<.035)|(along>sf['length']-.022);dist[outside]=abs(dist[outside]);return dist
dominant=np.array(names)[si[np.arange(len(ids)),sw.argmax(1)]]
active=np.where((rest[:,0]>.025)&np.isin(dominant,['v2p_L_'+f+str(j) for f in ['thumb','index'] for j in [1,2,3]]))[0]
palm_faces=faces[np.all(dominant[faces]=='leftHand',axis=1)];palm_tri=skin(base_q)[palm_faces];pn=np.cross(palm_tri[:,1]-palm_tri[:,0],palm_tri[:,2]-palm_tri[:,0]);plen=np.linalg.norm(pn,axis=1);keep=plen>1e-12;palm_tri=palm_tri[keep];pn=pn[keep]/plen[keep,None];ptree=cKDTree(palm_tri.mean(1));thumb=np.where(np.isin(dominant,['v2p_L_thumb2','v2p_L_thumb3']))[0]
start=np.r_[json.loads((B/'planning/biceps-native-fit-r1.json').read_text())['parameters'],0,0]
palmids=np.array([lookup[int(i)] for i in cur['vertexGroups']['palm']]);active=np.where(rest[:,0]>.025)[0]
def shifted(p,sf,x):return p-((1-sf['u'])*x[8]+sf['u']*x[9])/1000*sf['offsetDirection']
def targetqs(x):
 qs=json.loads(json.dumps(base_q));qs['thumb1']=R.from_euler('xyz',x[:3],degrees=True).as_quat().tolist();qs['index1']=(R.from_euler('xyz',x[3:6],degrees=True)*R.from_quat(base_q['index1'])).as_quat().tolist()
 for i in [2,3]:qs['index'+str(i)]=R.from_rotvec(np.array(rig['index']['flexAxis'])*np.deg2rad(x[4+i])).as_quat().tolist()
 return qs
def residual(x):
 p=skin(targetqs(x));parts=[]
 for sf in surfaces:
  pp=shifted(p,sf,x);dist=distance(pp,sf);parts.append(np.minimum(dist[active]-.0005,0)*2500);parts.append(np.array([max(dist[palmids].min()-.0007,0)*3500]))
 _,ii=ptree.query(p[thumb],k=12);near,j=closest(p[thumb],palm_tri[ii]);delta=p[thumb]-near;sd=np.linalg.norm(delta,axis=1)*np.where((delta*pn[ii[np.arange(len(thumb)),j]]).sum(1)<0,-1,1);parts.append(np.minimum(sd-.0005,0)*2500)
 parts.append((x-start)*.005);return np.concatenate(parts)
fitdata=json.loads((B/'planning/biceps-native-fit-r2.json').read_text());x=np.array(fitdata['parameters']);p=skin(targetqs(x));rows=[]
for sf in surfaces:
 dist=distance(shifted(p,sf,x),sf,k=32);rows.append({'frame':sf['frame'],'minimumMm':float(dist.min()*1000),'palmMinimumMm':float(dist[palmids].min()*1000),'negativeVertices':int((dist<0).sum())})
report={'format':'biceps-fit-whole-cycle-audit@1','reconstruction':checks,'samples':rows,'passed':all(r['minimumMm']>0 for r in rows),'userAccepted':False};args.output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
