"""Independent CPU QA of actual onAfterRender WebXR wrist-join captures.

Input: report.json with references:{side:file}, rows:[{name,file,command,repeatOf?}].
References and samples use the small contract documented in contract.md.
No source, recipe, renderer or captured files are mutated. Output is exclusive-create.
"""
import argparse,hashlib,importlib.util,json,math
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation

_file=Path(__file__).parents[1]/'webxr-grasp-qa-r1/check.py'
_spec=importlib.util.spec_from_file_location('webxr_geometry_qa',_file)
G=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(G)
load=G.load;points=G.points

def matrix(a):
 M=np.asarray(a,float).reshape(4,4,order='F')
 if not np.isfinite(M).all():raise ValueError('Nonfinite matrix')
 return M

def command(row):
 c=row.get('command',row)
 return float(c.get('flexDeg',c.get('flex',0))),float(c.get('twistDeg',c.get('twist',0)))

def rot(M):
 R=M[:3,:3];U,S,V=np.linalg.svd(R)
 if np.linalg.det(U@V)<0:raise ValueError('Pose matrix contains a reflection; provide proper bone-world matrices and explicit local axes')
 return U@V,float(np.max(np.abs(S-1)))

def measured_angles(ref,sample):
 H0,hs0=rot(matrix(ref['handMatrixWorld']));F0,fs0=rot(matrix(ref['forearmMatrixWorld']));H,hs=rot(matrix(sample['handMatrixWorld']));F,fs=rot(matrix(sample['forearmMatrixWorld']))
 D=(F0.T@H0).T@(F.T@H);axes=ref['frameConventions'];long=G.unit(axes['longitudinalHandLocal']);palmar=G.unit(axes['palmarHandLocal'])
 if abs(long@palmar)>1e-8:raise ValueError('Longitudinal and palmar axes must be perpendicular')
 moved=D@long;q=Rotation.from_matrix(D).as_quat();twist=math.degrees(2*math.atan2(float(q[:3]@long),float(q[3])));twist=(twist+180)%360-180
 return {'flexDeg':math.degrees(math.atan2(float(moved@palmar),float(moved@long))),'twistDeg':twist,'totalSwingDeg':math.degrees(math.acos(float(np.clip(moved@long,-1,1)))),'outOfFlexPlaneDeg':math.degrees(math.asin(float(np.clip(moved@np.cross(long,palmar),-1,1)))),'relativeDeltaQuaternion':q.tolist(),'maxPoseScaleDeviation':max(hs0,fs0,hs,fs),'method':'Independent neutral-relative forearm-to-hand matrix; signed longitudinal swing and axial quaternion twist. Command values are not used.'}

def full_orientation_error(ref,angles,flex,twist):
 long=G.unit(ref['frameConventions']['longitudinalHandLocal']);palmar=G.unit(ref['frameConventions']['palmarHandLocal']);target=Rotation.from_rotvec(np.cross(long,palmar)*math.radians(flex))*Rotation.from_rotvec(long*math.radians(twist))
 return math.degrees((target.inv()*Rotation.from_quat(angles['relativeDeltaQuaternion'])).magnitude())

def weld(ref):
 P=points(ref['positions']);parent=np.arange(len(P))
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 if 'weldPairs'in ref:pairs=list(ref['weldPairs']);method='explicit source weldPairs'
 else:
  initial=G.weld_ids(P);pairs=[[i,int(j)]for i,j in enumerate(initial)if i!=j];method='inferred from actual neutral positions within1e-7m; duplicate-face and degeneracy audit retained'
 for group in ref['seamPairs'].values():pairs.extend(group)
 for a,b in pairs:
  if not(0<=a<len(P)and 0<=b<len(P)):raise ValueError('Invalid seam/weld vertex')
  a,b=find(a),find(b);parent[max(a,b)]=min(a,b)
 return np.array([find(i)for i in range(len(P))]),method

def topology(ref,w):
 P=points(ref['positions']);F=np.asarray(ref['index'],int).reshape(-1,3)
 if not len(F)or F.min()<0 or F.max()>=len(P):raise ValueError('Invalid combined topology')
 WF=w[F];deg=np.flatnonzero((WF[:,0]==WF[:,1])|(WF[:,1]==WF[:,2])|(WF[:,2]==WF[:,0]));unique,count=np.unique(np.sort(WF,axis=1),axis=0,return_counts=True);duplicate_count=int(np.maximum(count-1,0).sum())
 E=np.sort(np.vstack([WF[:,[0,1]],WF[:,[1,2]],WF[:,[2,0]]]),axis=1);edges,counts=np.unique(E,axis=0,return_counts=True);seams={}
 for name,pairs in ref['seamPairs'].items():
  ids=np.unique(w[np.asarray(pairs,int).ravel()]);mask=np.all(np.isin(edges,ids),axis=1);degree={int(i):0 for i in ids}
  graph={int(i):set()for i in ids}
  for a,b in edges[mask]:degree[int(a)]+=1;degree[int(b)]+=1;graph[int(a)].add(int(b));graph[int(b)].add(int(a))
  todo=set(graph);components=0
  while todo:
   components+=1;stack=[todo.pop()]
   while stack:
    for j in graph[stack.pop()]&todo:todo.remove(j);stack.append(j)
  seams[name]={'pairCount':len(pairs),'uniqueVertices':len(ids),'interfaceEdges':int(mask.sum()),'everyInterfaceEdgeTwoFaces':bool(mask.any()and np.all(counts[mask]==2)),'ringComponents':components,'singleRingDegreeTwo':bool(components==1 and len(degree)>=3 and all(d==2 for d in degree.values()))}
 band=np.asarray(ref.get('regions',{}).get('bandFaceIds',[]),int);band_status={'status':'notMeasured'}
 if len(band):
  BE=np.unique(np.sort(np.vstack([WF[band][:,[0,1]],WF[band][:,[1,2]],WF[band][:,[2,0]]]),axis=1),axis=0);lookup={tuple(edge):int(n)for edge,n in zip(edges,counts)};bad=[edge.tolist()for edge in BE if lookup[tuple(edge)]!=2];band_status={'status':'measured','edges':len(BE),'notTwoIncidentFaceEdges':bad}
 return {'vertices':len(P),'faces':len(F),'weldedDegenerateFaces':deg.tolist(),'duplicateWeldedFaces':duplicate_count,'nonmanifoldEdges':edges[counts>2].tolist(),'openBoundaryEdges':int((counts==1).sum()),'seams':seams,'bandEdges':band_status},edges,F

def crossing_pairs(P,F,w):
 tri=P[F];lo=tri.min(1);hi=tri.max(1);axis=int(np.argmax(np.ptp(P,axis=0)));order=np.argsort(lo[:,axis],kind='stable');sorted_min=lo[order,axis];W=w[F];aa=[];bb=[]
 for k,i in enumerate(order):
  end=int(np.searchsorted(sorted_min,hi[i,axis]+1e-9,side='right'));j=order[k+1:end]
  j=j[np.all(hi[i]+1e-9>=lo[j],axis=1)&np.all(hi[j]+1e-9>=lo[i],axis=1)]
  j=j[~np.any(W[i][:,None,None]==W[j][None,:,:],axis=(0,2))];aa.extend([int(i)]*len(j));bb.extend(j.tolist())
 if not aa:return {'properCount':0,'coplanarCount':0,'pairs':[],'broadPhasePairs':0}
 aa=np.asarray(aa);bb=np.asarray(bb);A=tri[aa];B=tri[bb];proper=G.proper_intersections(A,B);normal=np.cross(A[:,1]-A[:,0],A[:,2]-A[:,0]);length=np.linalg.norm(normal,axis=1);unit=normal/np.maximum(length[:,None],1e-30);dist=np.max(np.abs(np.einsum('nij,nj->ni',B-A[:,0,None,:],unit)),axis=1);candidate=np.flatnonzero((~proper)&(length>1e-14)&(dist<=1e-8));coplanar=np.zeros(len(aa),bool)
 for k in candidate:coplanar[k]=G.coplanar_overlap(A[k],B[k])
 pairs=np.column_stack([aa[proper|coplanar],bb[proper|coplanar]])
 return {'properCount':int(proper.sum()),'coplanarCount':int(coplanar.sum()),'pairs':pairs[:2000].tolist(),'pairsTruncated':len(pairs)>2000,'allAffectedFaces':np.unique(pairs).tolist(),'broadPhasePairs':len(aa)}

def area(P,F):return np.linalg.norm(np.cross(P[F[:,1]]-P[F[:,0]],P[F[:,2]]-P[F[:,0]]),axis=1)

def ratios(P,R,F,E):
 a0=area(R,F);valid=a0>1e-14;a=area(P,F);ar=a[valid]/a0[valid];e0=np.linalg.norm(R[E[:,0]]-R[E[:,1]],axis=1);ev=e0>1e-10;er=np.linalg.norm(P[E[ev,0]]-P[E[ev,1]],axis=1)/e0[ev]
 return {'minimumAreaRatio':float(ar.min()),'maximumAreaRatio':float(ar.max()),'areaRatioP01':float(np.quantile(ar,.01)),'collapsedFaceIds':np.flatnonzero(valid&(a<.1*a0)).tolist(),'referenceDegenerateFaceIds':np.flatnonzero(~valid).tolist(),'minimumEdgeRatio':float(er.min()),'maximumEdgeRatio':float(er.max()),'edgeRatioP01':float(np.quantile(er,.01)),'collapsedEdgeCount':int((er<.1).sum())}

def rigid(ref,sample):
 ids=np.asarray(ref['rigidHandVertexIds'],int);A=points(ref['positions'])[ids];B=points(sample['positions'])[ids]
 if len(A)<4:raise ValueError('Need at least4 protected hand points for rigid proof')
 ac=A.mean(0);bc=B.mean(0);U,_,V=np.linalg.svd((A-ac).T@(B-bc));fix=np.eye(3);fix[2,2]=np.linalg.det(U@V);R=U@fix@V;t=bc-ac@R;residual=np.linalg.norm(A@R+t-B,axis=1)
 db0=points(ref['dbWorldPositions']);db=points(sample['dbWorldPositions'])
 if db.shape!=db0.shape:raise ValueError('DB point order/count changed')
 return {'handVertices':len(ids),'maxHandRigidResidualMm':float(residual.max()*1000),'dbVertices':len(db),'maxDbRelativeResidualMm':float(np.linalg.norm(db0@R+t-db,axis=1).max()*1000),'method':'Fit one proper rigid transform to protected hand cloud; use same transform to predict all DB points. No fit to DB points.'}

def seam_normals(ref,sample):
 if 'normalsWorld'not in sample:return {'status':'notMeasured','reason':'Actual normalsWorld not captured','seams':{}}
 N=points(sample['normalsWorld']);P=points(sample['positions'])
 if N.shape!=P.shape or not np.isfinite(N).all():return {'status':'failed','reason':'Invalid normal array','seams':{}}
 lengths=np.linalg.norm(N,axis=1)
 if np.any(lengths<1e-10):return {'status':'failed','reason':'Zero-length actual normals','seams':{}}
 N=N/lengths[:,None];result={}
 for name,pairs in ref['seamPairs'].items():
  pair=np.asarray(pairs,int);angle=np.degrees(np.arccos(np.clip(np.einsum('ij,ij->i',N[pair[:,0]],N[pair[:,1]]),-1,1)));k=int(angle.argmax());result[name]={'pairs':len(pairs),'maximumAngleDeg':float(angle.max()),'rmsAngleDeg':float(np.sqrt(np.mean(angle**2))),'worstPair':pairs[k],'within0_05Degree':bool(angle.max()<=.05)}
 return {'status':'measured','seams':result,'method':'Normalize actual render-time world normals independently; acos of corresponding seam-pair dot products.'}

def restore_status(sample):
 r=sample.get('restoreCheck',{});keys=['positionsNormalsExact','boneTransformsExact','cacheExact'];measured=all(k in r for k in keys);asserted=measured and all(r[k]is True for k in keys);hashes=r.get('hashes');hash_proof=None
 if isinstance(hashes,dict)and isinstance(hashes.get('before'),dict)and isinstance(hashes.get('after'),dict):hash_proof=bool(hashes['before'] and hashes['before']==hashes['after'])
 return {'status':'passed'if asserted and hash_proof is not False else'failed'if measured else'notMeasured','runtimeAssertions':{k:r.get(k)for k in keys},'hashEquality':hash_proof,'evidence':'before/after hashes + runtime assertions'if hash_proof is not None else'runtime assertions only'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('directory',type=Path);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args();manifest=load(a.directory/'report.json');refs={s:load(a.directory/p)for s,p in manifest['references'].items()};rows=[(r,load(a.directory/r['file']))for r in manifest['rows']];lookup={r['name']:d for r,d in rows};report={'format':'pose-hub-webxr-wrist-independent-qa@1','sourceDirectory':str(a.directory),'manifestSha256':hashlib.sha256((a.directory/'report.json').read_bytes()).hexdigest(),'thresholds':{'seamMm':.1,'angleErrorDeg':1,'areaCollapseRatio':.1,'edgeCollapseRatio':.1,'rigidResidualMm':.001,'repeatDriftMm':.001},'references':{},'rows':[],'limits':['All combined ROI triangles are checked; geometry outside exported ROI is not covered.','Proper crossings and positive-area coplanar overlaps exclude source/seam-adjacent triangles. Mere touching is not counted as penetration.','Area/edge ratios use actual rendered neutral; same-twist neutral is an additional diagnostic.','75degree poses are stress cases, never folded into60degree acceptance.','Visual acceptance and whole-action/whole-body collisions remain separate.']};state={}
 for side,ref in refs.items():
  w,method=weld(ref);topo,E,F=topology(ref,w);state[side]=(w,E,F);topo_checks={'noDegenerateOrDuplicateFaces':not topo['weldedDegenerateFaces']and topo['duplicateWeldedFaces']==0,'noNonmanifoldEdges':not topo['nonmanifoldEdges'],'bothEndpointSeamsClosed':set(topo['seams'])=={'body','hand'}and all(s['everyInterfaceEdgeTwoFaces']and s['singleRingDegreeTwo']for s in topo['seams'].values()),'bandFullyConnected':topo['bandEdges']['status']=='measured'and not topo['bandEdges'].get('notTwoIncidentFaceEdges'),'actualNeutralCapture':ref.get('capturedAt')=='scene.onAfterRender'};report['references'][side]={'topology':topo,'checks':topo_checks,'weldMethod':method,'sourcePins':ref.get('sourcePins'),'roi':ref.get('regions'),'neutralCapturedAt':ref.get('capturedAt')}
 for meta,sample in rows:
  flex,twist=command(sample if 'command'in sample else meta);item={'name':meta['name'],'command':{'flexDeg':flex,'twistDeg':twist},'classification':'stress75'if abs(flex)>60 else'primaryThrough60','capturedAt':sample.get('capturedAt'),'restoration':restore_status(sample),'sides':{}}
  for side,ref in refs.items():
   s=sample['sides'][side];P=points(s['positions']);R=points(ref['positions']);w,E,F=state[side]
   if P.shape!=R.shape or not np.isfinite(P).all():raise ValueError('Invalid actual combined mesh positions')
   angles=measured_angles(ref,s);cross=crossing_pairs(P,F,w);quality=ratios(P,R,F,E);rigidity=rigid(ref,s);normal_seams=seam_normals(ref,s);seams={name:{'pairs':len(pairs),'maxGapMm':float(np.linalg.norm(P[np.asarray(pairs)[:,0]]-P[np.asarray(pairs)[:,1]],axis=1).max()*1000)}for name,pairs in ref['seamPairs'].items()}
   neutral=next((d['sides'][side]for r,d in rows if abs(command(d if'command'in d else r)[0])<1e-8 and abs(command(d if'command'in d else r)[1]-twist)<1e-8),None)
   repeat=None
   if meta.get('repeatOf'):
    prior=lookup[meta['repeatOf']]['sides'][side];repeat={'of':meta['repeatOf'],'combinedMaxDriftMm':float(np.linalg.norm(P-points(prior['positions']),axis=1).max()*1000),'dbMaxDriftMm':float(np.linalg.norm(points(s['dbWorldPositions'])-points(prior['dbWorldPositions']),axis=1).max()*1000)}
   checks={'actualRenderCapture':sample.get('capturedAt')=='scene.onAfterRender','seamsWithin0_1mm':all(v['maxGapMm']<=.1 for v in seams.values()),'measuredFlexWithin1Degree':abs(angles['flexDeg']-flex)<=1,'measuredTwistWithin1Degree':abs((angles['twistDeg']-twist+180)%360-180)<=1,'noNonadjacentIntersection':cross['properCount']+cross['coplanarCount']==0,'noSevereAreaCollapse':not quality['collapsedFaceIds'],'noSevereEdgeCollapse':quality['collapsedEdgeCount']==0,'rigidHandWithin0_001mm':rigidity['maxHandRigidResidualMm']<=.001,'rigidDbRelationshipWithin0_001mm':rigidity['maxDbRelativeResidualMm']<=.001,'repeatWithoutAccumulation':None if repeat is None else max(repeat['combinedMaxDriftMm'],repeat['dbMaxDriftMm'])<=.001}
   angles['fullTargetOrientationErrorDeg']=full_orientation_error(ref,angles,flex,twist)
   checks['fullOrientationWithin1Degree']=angles['fullTargetOrientationErrorDeg']<=1
   checks['seamNormalsWithin0_05Degree']=None if normal_seams['status']=='notMeasured'else normal_seams['status']=='measured'and all(v['within0_05Degree']for v in normal_seams['seams'].values())
   item['sides'][side]={'measuredAngles':angles,'seams':seams,'seamNormals':normal_seams,'qualityVsActualNeutral':quality,'qualityVsSameTwistNeutral':None if neutral is None else ratios(P,points(neutral['positions']),F,E),'selfIntersection':cross,'rigidHandAndDb':rigidity,'repeat':repeat,'checks':checks}
  report['rows'].append(item);print(json.dumps({'row':item['name'],'class':item['classification'],'sides':{side:{'angles':v['measuredAngles'],'crossings':v['selfIntersection']['properCount']+v['selfIntersection']['coplanarCount'],'areaMin':v['qualityVsActualNeutral']['minimumAreaRatio'],'checks':v['checks']}for side,v in item['sides'].items()}}),flush=True)
 report['summary']={}
 for classification in ['primaryThrough60','stress75']:
  group=[r for r in report['rows']if r['classification']==classification];fails=[]
  for r in group:
   for side,s in r['sides'].items():
    for check,value in s['checks'].items():
     if value is False:fails.append({'row':r['name'],'side':side,'check':check})
   if r['restoration']['status']!='passed':fails.append({'row':r['name'],'check':'restorationNotPassed','status':r['restoration']['status']})
  report['summary'][classification]={'samples':len(group),'failures':fails,'allMeasuredChecksPassed':bool(group)and not fails}
 report['summary']['repeatMeasurements']=sum(s['repeat']is not None for r in report['rows']for s in r['sides'].values());report['summary']['nonAccumulationMeasured']=report['summary']['repeatMeasurements']>0
 report['summary']['referenceFailures']=[{'side':side,'check':key}for side,r in report['references'].items()for key,value in r['checks'].items()if not value]
 flexes=sorted(set(r['command']['flexDeg']for r in report['rows']if r['classification']=='primaryThrough60'));twists=sorted(set(r['command']['twistDeg']for r in report['rows']if r['classification']=='primaryThrough60'));report['summary']['coverage']={'primaryFlexCommands':flexes,'primaryTwistCommands':twists,'both30And60FlexSignsPresent':all(v in flexes for v in [-60,-30,0,30,60]),'bothTwistSignsPresent':any(v<0 for v in twists)and any(v>0 for v in twists)}
 report['summary']['primaryAcceptanceEvidenceComplete']=bool(report['summary']['primaryThrough60']['allMeasuredChecksPassed']and not report['summary']['referenceFailures']and report['summary']['nonAccumulationMeasured']and report['summary']['coverage']['both30And60FlexSignsPresent']and report['summary']['coverage']['bothTwistSignsPresent'])
 report['thresholds']['seamNormalAngleDeg']=.05
 report['summary']['allPrimarySeamNormalsMeasured']=all(s['seamNormals']['status']=='measured'for r in report['rows']if r['classification']=='primaryThrough60'for s in r['sides'].values())
 report['summary']['primaryAcceptanceEvidenceComplete'] &= report['summary']['allPrimarySeamNormalsMeasured']
 with a.output.open('x',encoding='utf-8')as f:json.dump(report,f,indent=2)
 print(json.dumps(report['summary'],indent=2))

if __name__=='__main__':main()
