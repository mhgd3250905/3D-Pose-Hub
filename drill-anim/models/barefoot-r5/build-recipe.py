import base64,hashlib,json,pathlib,sys
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation
sys.dont_write_bytecode=True
ROOT=pathlib.Path('posehub_v2plus_20261021');ASSET=ROOT/'drill-anim/models/barefoot-r4/feet-base.json';NPZ=pathlib.Path('PoseHub-Dot-Deliveries/model-contact-r4-source/male_l2.npz');CAP=pathlib.Path('PoseHub-Dot-Deliveries/preflight-121-repair-r4/attempt-2.json');OUT=ROOT/'drill-anim/models/barefoot-r5'
sys.path.insert(0,str(ROOT/'tools/human-v2plus/torso-base'));from meshops import boundary_loops_F
m=json.loads(ASSET.read_text())
def unpack(s,dtype,c):return np.frombuffer(base64.b64decode(s),dtype).reshape(-1,c)
P=unpack(m['pos']['u16'],np.uint16,3)*m['pos']['scale']+m['pos']['lo'];T=unpack(m['index']['u16'],np.uint16,3).astype(int);W=unpack(m['weights']['u8'],np.uint8,4).astype(float)/255;J=unpack(m['joints']['u8'],np.uint8,4);BN=np.asarray(m['bones'])[J]
rows=json.loads(CAP.read_text())['rows'];row0=next(r for r in rows if r['f']==0);Q_original=np.asarray(next(x for x in row0['meshes']if x['name']=='V2P_Barefoot_R4')['pts']);assert Q_original.shape==P.shape
src=np.load(NPZ);V=src['V']+[0,.043,.012];Vn=src['Vnod']+[0,.043,.012];DP=np.zeros_like(P)
def smoothstep(a,b,x):q=np.clip((x-a)/(b-a),0,1);return q*q*(3-2*q)
checks=[]
for side in ['left','right']:
 f=(W*(BN==side+'Foot')).sum(1);A=np.array(m['footCloud'][side]['restAnkle']);bc=next(x for x in m['buildChecks']if x['side']==side);R=Rotation.from_euler('y',bc['foot_yaw_deg'],degrees=True).as_matrix();Y=(V-np.array(bc['source_cA']))@R.T+A;Yn=(Vn-np.array(bc['source_cA']))@R.T+A;ids=np.where((f==1)&(P[:,2]>.09))[0];distance,source_id=cKDTree(Y).query(P[ids]);assert distance.max()<3.1e-6 and len(np.unique(source_id))==len(source_id);DP[ids]=(Yn[source_id]-Y[source_id])*smoothstep(.09,.11,P[ids,2])[:,None];checks.append({'side':side,'matched':len(ids),'maxSourceDistanceM':float(distance.max()),'maxDeltaMm':float(np.linalg.norm(DP[ids],axis=1).max()*1000)})
def affine(a,b):return np.linalg.lstsq(np.c_[a,np.ones(len(a))],b,rcond=None)[0]
Q=Q_original.copy();reference={}
for side in ['left','right']:
 f=(W*(BN==side+'Foot')).sum(1);s=(W*(BN==side+'Shin')).sum(1);pure=f==1;pure_shin=(s==1)&(np.arange(len(P))<m['seam']['first']);TF=affine(P[pure],Q_original[pure]);TS=affine(P[pure_shin],Q_original[pure_shin]);Q[pure]+=DP[pure]@TF[:3];reference[side]=float(Rotation.from_matrix(TF[:3]@TS[:3].T).magnitude())
def make_ankle_loft(Q,T,sf,seams,cut=-.345):
 q=Q.tolist();rec=[{i:1.}for i in range(len(Q))];bump=[0.]*len(Q);cache={};faces=[]
 def mix(a,b,t):
  d={}
  for i,w in a.items():d[i]=d.get(i,0)+(1-t)*w
  for i,w in b.items():d[i]=d.get(i,0)+t*w
  return d
 for tri in T[sf]:
  poly=[]
  for a,b in zip(tri,np.roll(tri,-1)):
   ia,ib=Q[a,2]<=cut,Q[b,2]<=cut
   if ia:poly.append(int(a))
   if ia!=ib:
    key=tuple(sorted((int(a),int(b))))
    if key not in cache:
     t=(cut-Q[a,2])/(Q[b,2]-Q[a,2]);cache[key]=len(q);q.append(((1-t)*Q[a]+t*Q[b]).tolist());rec.append({int(a):1-t,int(b):t});bump.append(0.)
    poly.append(cache[key])
  for k in range(1,len(poly)-1):faces.append([poly[0],poly[k],poly[k+1]])
 faces=np.asarray(faces,int);q=np.asarray(q);loops=boundary_loops_F(faces);assert len(loops)==1;ring=np.asarray(loops[0],int);seams=np.asarray(seams,int)
 def orient(ids):
  c=q[ids].mean(0);ph=np.arctan2(q[ids,1]-c[1],q[ids,0]-c[0]);d=(np.diff(np.r_[ph,ph[0]])+np.pi)%(2*np.pi)-np.pi
  if d.sum()<0:ids,ph,d=ids[::-1],ph[::-1],-d[::-1]
  assert np.all(d>=0),'Non-star boundary';k=np.argmin(ph);return np.roll(ids,-k),np.roll(ph,-k)
 ring,u=orient(ring);seams,v=orient(seams);n=len(ring);vp=np.r_[v[-1]-2*np.pi,v,v[0]+2*np.pi];sp=np.r_[seams[-1],seams,seams[0]];target=[]
 for a in u:
  j=np.searchsorted(vp,a,side='right')-1;t=(a-vp[j])/(vp[j+1]-vp[j]);target.append({int(sp[j]):1-t,int(sp[j+1]):t})
 prev=ring;bridge=[]
 for k in range(1,5):
  t=k/5;ids=np.arange(len(rec),len(rec)+n)
  for i in range(n):rec.append(mix(rec[int(ring[i])],target[i],t));bump.append(.02*np.sin(np.pi*t))
  for i in range(n):j=(i+1)%n;bridge.extend([[prev[i],prev[j],ids[i]],[prev[j],ids[j],ids[i]]])
  prev=ids
 j0=np.searchsorted(v,u[0],side='right')-1;ss=np.roll(seams,-j0);vv=np.unwrap(np.roll(v,-j0));vv+=2*np.pi*np.floor((u[0]-vv[0])/(2*np.pi));vv=np.r_[vv,vv[0]+2*np.pi];uu=np.r_[u,u[0]+2*np.pi];i=j=0
 while i<n or j<len(ss):
  if i<n and(j>=len(ss)or uu[i+1]<vv[j+1]):bridge.append([prev[i%n],prev[(i+1)%n],ss[j%len(ss)]]);i+=1
  else:bridge.append([prev[i%n],ss[(j+1)%len(ss)],ss[j%len(ss)]]);j+=1
 bridge=np.asarray(bridge,int);oldedges=set(map(tuple,np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]])));newedges=np.concatenate([bridge[:,[0,1]],bridge[:,[1,2]],bridge[:,[2,0]]]);same=sum(tuple(e)in oldedges for e in newedges);opposite=sum(tuple(e[::-1])in oldedges for e in newedges);assert(same,opposite)in[(0,n),(n,0)]
 if same:bridge=bridge[:,[0,2,1]]
 out=np.vstack([faces,bridge]);assert[len(x)for x in boundary_loops_F(out)]==[28];return out,rec,np.asarray(bump),len(faces)
sides=[]
for side in ['left','right']:
 f=(W*(BN==side+'Foot')).sum(1);s=(W*(BN==side+'Shin')).sum(1);sf=np.flatnonzero(((f+s)[T]>0).any(1));seams=np.asarray([m['seam']['first']+i for i,r in enumerate(m['seam']['ring'])if r=='ankle_'+side]);F,rec,bump,nf=make_ankle_loft(Q,T,sf,seams);active=np.unique(F);remap=np.full(len(rec),-1,int);remap[active]=np.arange(len(active));sides.append(dict(side=side,index=remap[F].reshape(-1).tolist(),recipes=[[[int(j),float(w)]for j,w in rec[i].items()if w!=0]for i in active],bumpM=bump[active].tolist(),seamSourceIds=seams.tolist(),seamRenderIds=remap[seams].tolist(),sourceToRender=[[int(i),int(remap[i])]for i in active if i<len(P)],retainedFaceCount=int(nf),referenceAngleRad=reference[side]))
rb=json.dumps(sides,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode();db=np.asarray(DP,dtype='<f4').tobytes();(OUT/'recipe.json').write_bytes(rb);(OUT/'toe-delta.json').write_text(json.dumps({'sourceVertices':len(P),'deltaF32':base64.b64encode(db).decode(),'checks':checks},separators=(',',':')));(OUT/'build-checks.json').write_text(json.dumps({'sourceSHA256':{str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in[ASSET,NPZ,CAP]},'deltaSHA256':hashlib.sha256(db).hexdigest(),'recipeSHA256':hashlib.sha256(rb).hexdigest(),'referenceCutZ':-.345,'sourceToeChecks':checks,'vertices':[len(x['recipes'])for x in sides],'faces':[len(x['index'])//3 for x in sides]},indent=2));print('built recipes',[len(x['recipes'])for x in sides])
# Build separate Float32 model with unchanged live seam owners, no source mutation.
records=[];faceblocks=[];seamrecs=[];sourceMaps={};offs=0
for ss in sides:
 for i,rec in enumerate(ss['recipes']):records.append({'side':ss['side'],'recipe':rec,'bumpM':ss['bumpM'][i]})
 faceblocks.append(np.array(ss['index']).reshape(-1,3)+offs)
 for sid,rid in zip(ss['seamSourceIds'],ss['seamRenderIds']):seamrecs.append((offs+rid,sid))
 sourceMaps[ss['side']]=[[sid,offs+rid]for sid,rid in ss['sourceToRender']];offs+=len(ss['recipes'])
seamids=[a for a,b in seamrecs];order=[i for i in range(len(records))if i not in set(seamids)]+seamids;inv=np.empty(len(order),int);inv[order]=np.arange(len(order));records=[records[i]for i in order];F=inv[np.vstack(faceblocks)];Pw=[];JW=[];WW=[]
for rec in records:
 x=np.zeros(3);weights={}
 for sid,w in rec['recipe']:
  x+=w*(P[sid]+DP[sid])
  for j,v in zip(J[sid],W[sid]):weights[int(j)]=weights.get(int(j),0)+w*v
 x+=rec['bumpM']*np.array([0,0,-1]);weights={j:w for j,w in weights.items()if w>1e-12};assert len(weights)<=4 and abs(sum(weights.values())-1)<1e-6
 jw=list(weights);ww=list(weights.values());JW.append(jw+[0]*(4-len(jw)));WW.append(ww+[0.]*(4-len(ww)));Pw.append(x)
Pw=np.array(Pw);norm=np.zeros_like(Pw);n=np.cross(Pw[F[:,1]]-Pw[F[:,0]],Pw[F[:,2]]-Pw[F[:,0]])
for k in range(3):np.add.at(norm,F[:,k],n)
norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-30)
b64=lambda x,d:base64.b64encode(np.asarray(x,dtype=d).tobytes()).decode()
new={'version':1,'n':len(Pw),'skin':m.get('skin','Mesh005'),'paint':m['paint'],'bones':m['bones'],'pos':{'f32':b64(Pw,'<f4')},'nrm':{'f32':b64(norm,'<f4')},'index':{'u16':b64(F,'<u2')},'joints':{'u8':b64(JW,'u1')},'weights':{'f32':b64(WW,'<f4')},'seam':{'first':len(Pw)-len(seamrecs),'vid':[],'mesh':[],'ring':[]},'keepFaces':{},'hideFaces':{},'hideMeshes':[]}
for oldidx,sid in seamrecs:
 k=sid-m['seam']['first']
 for key in ['vid','mesh','ring']:new['seam'][key].append(m['seam'][key][k])
(OUT/'feet-base-f32.json').write_text(json.dumps(new,separators=(',',':')))
rt={'records':records,'referenceAngles':reference,'sourceMaps':{s:[[sid,int(inv[rid])]for sid,rid in v]for s,v in sourceMaps.items()},'seamSourceIds':[s for i,s in seamrecs],'sourceVertices':len(P),'scope':'086 reset and demonstrated kneeling branch only; not arbitrary motion certification'};(OUT/'runtime-recipe.json').write_text(json.dumps(rt,separators=(',',':')));print('built f32',len(Pw),len(F))
