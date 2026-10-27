"""Combine a smooth interior garment proposal and two small near-edge inserts.

Uses captured rest data for an experimental candidate, not a final model.
"""
import argparse,json
from pathlib import Path
import numpy as np

ap=argparse.ArgumentParser()
for x in ('runtime','p3_refinement','p3_index','smooth','bear','bearpose','out'):ap.add_argument(x,type=Path)
args=ap.parse_args();args.out.mkdir();read=lambda x:json.loads(x.read_text(encoding='utf-8'))
g=read(args.runtime)['Mesh005'];base=read(args.p3_refinement);F=np.array(read(args.p3_index),int).reshape(-1,3);smooth=read(args.smooth);bear=read(args.bear)
P=np.array(g['P']).reshape(-1,3);N=np.array(g['N']).reshape(-1,3);J=np.array(g['skinIndex'],int).reshape(-1,4);W=np.array(g['skinWeight']).reshape(-1,4);all_moves=np.array(smooth['movedIds'],int);used=np.isin(all_moves,np.unique(F));moves=all_moves[used];DL=np.array(smooth['localDeltas']).reshape(-1,3)[used];DW=np.array(smooth['worldDeltas']).reshape(-1,3)[used];delta=np.zeros_like(P);delta[moves]=DW
seams=read(Path('drill-anim/models/training-human-v2plus-torso-base.json'))['seam'];seam_ids={i for i,s in zip(seams['vid'],seams['mesh']) if s=='Mesh005'}
if seam_ids.intersection(moves.tolist()):raise ValueError('piece-normal seam overlaps moved vertex')
outfit=set(read(Path('drill-anim/models/training-human-v2plus-outfit.json'))['meshes']['Mesh005']['idx'])
if outfit.intersection(moves.tolist()):raise ValueError('outfit writes a moved vertex')
def palette(raw):return np.array(raw).reshape(-1,16).reshape(-1,4,4).transpose(0,2,1)
B0=palette(g['boneMatrices']);B1=palette(read(args.bearpose)['boneMatrices']);world=np.array(g['matrixWorld']).reshape(4,4).T;ib=np.array(g['bindMatrixInverse']).reshape(4,4).T;bind=np.array(g['bindMatrix']).reshape(4,4).T
def mat(ids,weights,palette):return world@ib@sum(palette[int(i)]*w for i,w in zip(ids,weights))@bind
base_extra=[]
for item in base['additions']:
 weights={int(k):v for k,v in item['skinWeights'].items()};base_extra.append((mat(list(weights),list(weights.values()),B0)@np.r_[item['localPosition'],1])[:3])
baseRest=np.vstack([P,np.array(base_extra)]);S0=baseRest.copy();S1=baseRest.copy();S1[:len(P)]+=delta
adds=smooth['updatedAdditions'];extra=[];replacement={};lookup={tuple(f):i for i,f in enumerate(F)};offsets=[]
for e in adds:S1[e['newIndex']]+=sum(e['barycentric'][k]*delta[v] for k,v in enumerate(e['triangle']))
for original in extra:
 e=dict(original);weights={int(k):v for k,v in e['skinWeights'].items()};M=mat(list(weights),list(weights.values()),B0);d=sum(e['barycentric'][k]*delta[v] for k,v in enumerate(e['triangle']));local=np.array(e['localPosition'])+np.linalg.solve(M[:3,:3],d);e['localPosition']=local.tolist();position=(M@np.r_[local,1])[:3];baseline=sum(e['barycentric'][k]*P[v] for k,v in enumerate(e['triangle']));offsets.append(float(np.linalg.norm(position-baseline)*1000));S0=np.vstack([S0,baseline]);S1=np.vstack([S1,position]);face=e['triangle']
 if tuple(face) not in lookup:raise ValueError('edge face mismatch')
 i=e['newIndex'];replacement[lookup[tuple(face)]]=[[face[0],face[1],i],[face[1],face[2],i],[face[2],face[0],i]];adds.append(e)
if max(offsets,default=0)>=1:raise ValueError('near-edge point displaced >=1 mm')
joined=[]
for i,f in enumerate(F):joined.extend(replacement.get(i,[f.tolist()]))
joined=np.array(joined,int)
# Transport the original smooth normals by the local change of area normal;
# source seam normals are excluded above and continue to be managed by L2.
def accumulated(points,faces):
 a=points[faces[:,0]];cross=np.cross(points[faces[:,1]]-a,points[faces[:,2]]-a);out=np.zeros_like(points)
 for k in range(3):np.add.at(out,faces[:,k],cross)
 return out
oldA=accumulated(baseRest,F);newA=accumulated(S1,joined);normal_local=[];angles=[]
for i in moves:
 a=oldA[i];b=newA[i];la=np.linalg.norm(a);lb=np.linalg.norm(b)
 if min(la,lb)<1e-12:raise ValueError('unavailable smooth normal')
 a=a/la;b=b/lb;dot=float(np.clip(a@b,-1,1));cross=np.cross(a,b);denom=1+dot
 if denom<1e-8:raise ValueError('normal rotation is opposed')
 rotated=N[i]+np.cross(cross,N[i])+np.cross(cross,np.cross(cross,N[i]))/denom;rotated/=np.linalg.norm(rotated);local=mat(J[i],W[i],B0)[:3,:3].T@rotated;local/=np.linalg.norm(local);normal_local.append(local.tolist());angles.append(float(np.degrees(np.arccos(dot))))
combined=dict(base);combined['additions']=adds;combined['changedFaces']=base['changedFaces'];combined['sourceMoves']={'ids':moves.tolist(),'localDeltas':DL.ravel().tolist(),'worldDeltas':DW.ravel().tolist(),'normalValues':np.array(normal_local).ravel().tolist()};combined['maxOffsetMm']=max(smooth['maxOffsetMm'],max(offsets,default=0));combined['method']='smooth interior source displacement; original boundary fixed';combined['samples']=dict(base['samples'])
for i in moves:combined['samples'][str(i)]=g['localPosition'][i*3:i*3+3]
for e in extra:
 for i in e['triangle']:combined['samples'][str(i)]=g['localPosition'][i*3:i*3+3]
# Exact CPU linear-blend skinning of the proposed garment at the captured bear pose.
posed=np.empty_like(S1)
for i in range(len(S1)):
 if i<len(P):ids,weights=J[i],W[i]
 else:
  item=adds[i-len(P)];weights_dict={int(k):v for k,v in item['skinWeights'].items()};ids,weights=list(weights_dict),list(weights_dict.values())
 relative=mat(ids,weights,B1)@np.linalg.inv(mat(ids,weights,B0));posed[i]=(relative@np.r_[S1[i],1])[:3]
bearResult=dict(bear);bearResult['shirtRest']=S1.ravel().tolist();bearResult['shirtPosed']=posed.ravel().tolist();bearResult['groups']=dict(bear['groups']);bearResult['groups']['shirt']=joined.ravel().tolist();bearResult['limitations']+=' Additional shoulder garment candidate uses CPU skinning only.'
report={'sourceMoved':len(moves),'maxSourceOffsetMm':smooth['maxOffsetMm'],'edgeAdded':len(extra),'edgeOffsetMm':offsets,'maxSourceNormalRotationDeg':max(angles,default=0),'seamConflict':0,'outfitConflict':0,'limitations':'Experimental CPU candidate; GPU, all poses and appearance remain unvalidated.'}
for name,data in [('refinement.json',combined),('refined-index.json',joined.ravel().tolist()),('bear-reconstruction.json',bearResult),('report.json',report)]:
 with (args.out/name).open('x',encoding='utf-8') as f:json.dump(data,f,separators=(',',':'));f.write('\n')
print(json.dumps(report))
