"""Offline bounded inner-garment displacement, retaining the original boundary.

CPU rays only approximate the shader and are not visual acceptance.
"""
import argparse,base64,json
from collections import Counter
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

ap=argparse.ArgumentParser()
for key in ('runtime','rest','p3rest','toon','base_refinement','base_index','outfit','images','out'):ap.add_argument(key,type=Path)
ap.add_argument('--radius-mm',type=float,default=14);ap.add_argument('--offset-mm',type=float,default=.8)
args=ap.parse_args();args.out.mkdir()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
g=load(args.runtime)['Mesh005'];rest=load(args.rest);q=load(args.p3rest);asset=load(args.toon);base=load(args.base_refinement);F=np.array(load(args.base_index),int).reshape(-1,3);outfit=set(load(args.outfit)['meshes']['Mesh005']['idx'])
P=np.array(g['P']).reshape(-1,3);N=np.array(g['N']).reshape(-1,3);J=np.array(g['skinIndex'],int).reshape(-1,4);W=np.array(g['skinWeight']).reshape(-1,4);f0=np.array(g['idx']).reshape(-1,3)
bm=np.array(g['boneMatrices']).reshape(-1,16).reshape(-1,4,4).transpose(0,2,1);world=np.array(g['matrixWorld']).reshape(4,4).T;ib=np.array(g['bindMatrixInverse']).reshape(4,4).T;bind=np.array(g['bindMatrix']).reshape(4,4).T
def mat(ids,weights):return world@ib@sum(bm[int(k)]*v for k,v in zip(ids,weights))@bind
def camera(side,x,y):
 t=np.array(rest['bones'][side+'UpperArm']['p']);off=np.array([.55,.1,.75]);f=-off/np.linalg.norm(off);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f)
 return t+off+r*((x+.5-210)*.22/420)-u*((y+.5-210)*.22/420),f
samples=[('right',234,114,[4957,5890,1833]),('right',235,115,[4957,8345,5890]),('left',127,65,[4455,5772,8159]),('left',130,66,[4455,1083,5772]),('left',138,65,[7798,1083,4455])]
centers=[]
for side,x,y,face in samples:
 o,ray=camera(side,x,y);a,b,c=P[face];sol=np.linalg.solve(np.column_stack((b-a,c-a,-ray)),o-a);bar=np.array([1-sol[0]-sol[1],sol[0],sol[1]]);centers.append(bar@P[face])
_,first,group=np.unique(np.round(P/1e-6).astype(np.int64),axis=0,return_index=True,return_inverse=True);GF=group[f0];edges=Counter(tuple(sorted(e)) for f in GF for e in ((f[0],f[1]),(f[1],f[2]),(f[2],f[0])) if e[0]!=e[1]);boundary=np.unique([v for e,c in edges.items() if c==1 for v in e]);bdist=cKDTree(P[first[boundary]]).query(P[first])[0];leftdist=cKDTree(np.array(centers[2:])).query(P[first])[0];rightdist=cKDTree(np.array(centers[:2])).query(P[first])[0]
avgN=np.zeros((len(first),3));np.add.at(avgN,group,N);avgN/=np.maximum(np.linalg.norm(avgN,axis=1)[:,None],1e-12)
def falloff(dist):
 t=np.clip(1-dist/(args.radius_mm/1000),0,1);return t*t*(3-2*t)
x=np.clip(bdist/.004,0,1);border=x*x*(3-2*x);mag=falloff(leftdist)*args.offset_mm*border/1000;mag[boundary]=0
for i in outfit:mag[group[i]]=0
delta=avgN[group]*mag[group,None];moved=np.flatnonzero(np.linalg.norm(delta,axis=1)>1e-9);local=[]
for i in moved:local.append(np.linalg.solve(mat(J[i],W[i])[:3,:3],delta[i]).tolist())
base_positions=np.array(load(args.out.parent/'collar-bear-small-refined-r3.json')['shirtRest']).reshape(-1,3);S0=base_positions.copy();S1=base_positions.copy();S1[:len(P)]+=delta
additions=[]
for e in base['additions']:
 d=sum(e['barycentric'][k]*delta[v] for k,v in enumerate(e['triangle']));weights={int(k):v for k,v in e['skinWeights'].items()};T=mat(list(weights),list(weights.values()));new=dict(e);new['localPosition']=(np.array(e['localPosition'])+np.linalg.solve(T[:3,:3],d)).tolist();additions.append(new);S1[e['newIndex']]+=d
angles=[]
for face in F:
 if not np.any(np.linalg.norm(S1[face]-S0[face],axis=1)>1e-9):continue
 a,b,c=S0[face];d,e,f=S1[face];n0=np.cross(b-a,c-a);n1=np.cross(e-d,f-d);l0=np.linalg.norm(n0);l1=np.linalg.norm(n1)
 if min(l0,l1)<1e-12:continue
 angles.append(float(np.degrees(np.arccos(np.clip((n0@n1)/(l0*l1),-1,1)))))
Q=np.array(q['P']).reshape(-1,3);QN=np.array(q['N']).reshape(-1,3);marker=np.array(q['marker'][:14511],int);tex=np.frombuffer(base64.b64decode(asset['materials'][0]['constants']['uMMT']['data']),dtype='<f4').reshape(-1,4);Q[:14511]-=QN[:14511]*tex[marker,3,None];ix=np.array(q['idx']);groups=q['groups'];neck=groups[0];faces={'neck':ix[neck['start']:neck['start']+neck['count']-888].reshape(-1,3),'bridge':ix[neck['start']+neck['count']-888:neck['start']+neck['count']].reshape(-1,3),'torso':ix[groups[2]['start']:groups[2]['start']+groups[2]['count']].reshape(-1,3)}
def hit(V,F,O,ray):
 a=V[F[:,0]];e=V[F[:,1]]-a;h=V[F[:,2]]-a;v=np.cross(np.broadcast_to(ray,h.shape),h);det=(e*v).sum(1);valid=det>1e-10;inv=np.zeros_like(det);inv[valid]=1/det[valid];s=O-a;u=(s*v).sum(1)*inv;z=np.cross(s,e);vv=(ray*z).sum(1)*inv;dist=(h*z).sum(1)*inv;valid&=(u>=0)&(vv>=0)&(u+vv<=1)&(dist>0);ids=np.where(valid)[0];return float(np.min(dist[ids])) if len(ids) else None
summary={}
for side,roi in [('left',(120,145,60,70)),('right',(230,240,110,120))]:
 before=np.array(Image.open(args.images/('before-'+side+'-shoulder.png')).convert('RGB')).astype(int);after=np.array(Image.open(args.images/('after-'+side+'-shoulder.png')).convert('RGB')).astype(int);x0,x1,y0,y1=roi;mask=(before[:,:,0]<80)&(after[:,:,0]>80)&(np.max(abs(after-before),axis=2)>20);ys,xs=np.where(mask);points=[(int(x),int(y)) for x,y in zip(xs,ys) if x0<=x<x1 and y0<=y<y1];counts=[]
 for S in (S0,S1):
  ahead=0
  for x,y in points:
   O,ray=camera(side,x,y);skin=[hit(Q,f,O,ray) for f in faces.values()];skin=[v for v in skin if v is not None];shirt=hit(S,F,O,ray)
   if shirt is not None and skin and min(skin)<shirt:ahead+=1
  counts.append(ahead)
 summary[side]={'imageDifferenceSamples':len(points),'skinAheadBefore':counts[0],'skinAheadAfter':counts[1]}
candidate={'sourceVertexCount':len(P),'movedIds':moved.tolist(),'localDeltas':np.array(local).ravel().tolist(),'worldDeltas':delta[moved].ravel().tolist(),'updatedAdditions':additions,'maxOffsetMm':float(np.linalg.norm(delta,axis=1).max()*1000),'radiusMm':args.radius_mm,'method':'smooth bounded interior displacement; fixed original garment boundary','limitations':'Static CPU reconstruction; runtime/GPU/dynamic poses not validated.'}
report={'movedVertices':len(moved),'outfitConflict':len(outfit.intersection(moved.tolist())),'boundaryMoved':int((mag[boundary]>0).sum()),'maxOffsetMm':candidate['maxOffsetMm'],'affectedFaces':len(angles),'maxFaceRotationDeg':max(angles,default=0),'faceRotationsOver90':sum(a>90 for a in angles),'shoulders':summary,'limitations':candidate['limitations']}
for name,data in [('candidate.json',candidate),('report.json',report)]:
 with (args.out/name).open('x',encoding='utf-8') as f:json.dump(data,f,separators=(',',':'));f.write('\n')
print(json.dumps(report))
