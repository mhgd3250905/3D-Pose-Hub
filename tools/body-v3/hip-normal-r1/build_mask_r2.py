"""Build a deterministic, seam-protected source mask from t1 hip components."""
import base64,collections,hashlib,json,sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image

actual,hipref,gpu,repo,out=map(Path,sys.argv[1:]);out.mkdir(exist_ok=False)
def read(name):
 d=json.loads((actual/name).read_text());m=d['meshes']['V3_Head_Neck_Torso_Shared_R26'];a=np.frombuffer(base64.b64decode(m['A']),'<f4').reshape(-1,6).astype(float);return d,a[:,:3],np.array(m['idx']).reshape(-1,3)
rest,R,F=read('rest.json');_,X,_=read('t1-zero.json');ref=json.loads(hipref.read_text());offset=14511;count=len(R)-offset;torso=R[offset:];first=json.loads((repo/'drill-anim/models/training-human-v2plus-torso-base.json').read_text())['seam']['first'];_,G=np.unique(np.round(torso/1e-5).astype(np.int64),axis=0,return_inverse=True);GF=G[F[np.all(F>=offset,axis=1)]-offset];n=G.max()+1;adj=[set() for _ in range(n)]
for a,b,c in GF:
 for x,y in [(a,b),(b,c),(c,a)]:
  if x!=y:adj[x].add(y);adj[y].add(x)
def bfs(seeds,maxring):
 d=np.full(n,999,int);q=collections.deque()
 for g in seeds:
  if d[g]>0:d[g]=0;q.append(int(g))
 while q:
  g=q.popleft()
  if d[g]>=maxring:continue
  for h in adj[g]:
   if d[h]>d[g]+1:d[h]=d[g]+1;q.append(h)
 return d
def ray(origin,d):
 a=X[F[:,0]];e=X[F[:,1]]-a;z=X[F[:,2]]-a;h=np.cross(d,z);det=(e*h).sum(axis=1);ok=det>1e-12;inv=np.zeros_like(det);inv[ok]=1/det[ok];s=origin-a;u=(s*h).sum(axis=1)*inv;q=np.cross(s,e);v=(d*q).sum(axis=1)*inv;depth=(z*q).sum(axis=1)*inv;ok&=(u>=0)&(v>=0)&(u+v<=1)&(depth>.02);ids=np.flatnonzero(ok)
 if not len(ids):return None
 k=int(ids[np.argmin(depth[ids])]);return k
seeds=[];sampleReport={}
for side,points in [('left',[(340,80)]),('right',[(130,80),(90,270)])]:
 original=np.asarray(Image.open(gpu/f't1-{side}-original.png').convert('RGB'),int);image=np.asarray(Image.open(gpu/f't1-{side}-mesh-id.png').convert('RGB'),int);orange=(original[:,:,0]>125)&(original[:,:,0]>original[:,:,1]*1.25)&(original[:,:,1]>original[:,:,2]*1.15);labels,_=ndimage.label(orange,np.ones((3,3)));selected=set()
 for x,y in points:
  z=labels[y-15:y+15,x-15:x+15];values,counts=np.unique(z[z>0],return_counts=True)
  if len(values):selected.add(int(values[counts.argmax()]))
 ys,xs=np.where(np.isin(labels,list(selected))&(image==[27,207,143]).all(axis=2));indices=np.linspace(0,len(xs)-1,min(160,len(xs)),dtype=int);cam=ref['poses']['1']['hips'][side];origin=np.array(cam['camera']);fw=np.array(cam['target'])-origin;fw/=np.linalg.norm(fw);right=np.cross(fw,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,fw);tan=np.tan(np.radians(22)/2);faces=[];pixels=[]
 for i in indices:
  x,y=int(xs[i]),int(ys[i]);d=fw+right*((2*(x+.5)/480-1)*tan)+up*((1-2*(y+.5)/480)*tan);d/=np.linalg.norm(d);face=ray(origin,d)
  if face is None or np.any(F[face]<offset):raise ValueError('sample did not hit P3 torso '+str((side,x,y,face)))
  faces.append(face);pixels.append([x,y]);seeds.extend((F[face]-offset).tolist())
 sampleReport[side]={'eligiblePixels':len(xs),'selected':len(indices),'uniqueFaces':len(set(faces)),'faces':faces,'pixels':pixels}
ring=bfs(set(G[seeds]),6);seam=bfs(set(G[first:]),3);x=np.clip((6-ring)/4,0,1);weight=x*x*(3-2*x);weight[ring<=2]=1;weight[seam==0]=0;weight[seam==1]*=.25;weight[seam==2]*=.75
rows=[]
for i in range(count):
 w=float(weight[G[i]])
 if w>0:rows.append([i,w,'left' if torso[i,0]>0 else 'right',int(ring[G[i]]),int(seam[G[i]])])
active={r[0] for r in rows};sh=repo/'drill-anim/models/training-human-v3-shoulder-completed-r3';overlap={}
for name in ['left','right']:
 d=json.loads((sh/(name+'.json')).read_text());offsets=np.frombuffer(base64.b64decode(d['bindOffsetsF32']),'<f4').reshape(-1,3);ids=d['vertexIds'];hits=[(i,float(np.linalg.norm(v))) for i,v in zip(ids,offsets) if i in active and np.linalg.norm(v)>1e-12];overlap[name]={'nonzeroPositionOverlap':len(hits),'ids':[i for i,_ in hits]}
norm=json.loads((sh/'normals.json').read_text());overlap['normal']={'targetsOverlap':len([row for row in norm['torsoTargets'] if row[0] in active]),'ids':[row[0] for row in norm['torsoTargets'] if row[0] in active]}
incident=F[np.any(np.isin(F,[i+offset for i in active]),axis=1)];neighbors={int(i-offset) for i in incident.ravel() if i>=offset}
for name in ['left','right']:
 d=json.loads((sh/(name+'.json')).read_text());vs=np.frombuffer(base64.b64decode(d['bindOffsetsF32']),'<f4').reshape(-1,3);ids=[i for i,v in zip(d['vertexIds'],vs) if i in neighbors and np.linalg.norm(v)>1e-12];overlap[name]['incidentVerticesNonzeroPositionOverlap']=len(ids)
overlap['normal']['incidentVerticesTargetOverlap']=sum(row[0] in neighbors for row in norm['torsoTargets'])
bones={x['name']:x['world'] for x in rest['boneSignatures'] if x['name'] in ['pelvis','leftThigh','rightThigh']}
if len(bones)!=3:raise ValueError('rest bones missing')
result={'version':'hip-normal-mask-r1','scope':'t1-seeded source IDs, geodesic full rings 0-2 and smooth fade 2-6; seams frozen with 3-ring fade; no camera use at runtime','offset':offset,'sourceCount':count,'seamFirst':first,'rows':rows,'samples':sampleReport,'p5Overlap':overlap,'restBoneWorld':bones,'sources':{'restSha256':hashlib.sha256((actual/'rest.json').read_bytes()).hexdigest(),'poseSha256':hashlib.sha256((actual/'t1-zero.json').read_bytes()).hexdigest(),'cameraSha256':hashlib.sha256(hipref.read_bytes()).hexdigest()}}
with (out/'mask.json').open('x',encoding='utf8') as f:json.dump(result,f,separators=(',',':'))
print(json.dumps({'sourceCount':count,'maskVertices':len(rows),'seedVertices':len(set(seeds)),'samples':{k:{x:y for x,y in v.items() if x not in ['faces','pixels']} for k,v in sampleReport.items()},'p5Overlap':{k:{x:y for x,y in v.items() if x!='ids'} for k,v in overlap.items()}},indent=2))
