"""Actual render-capture wrist quality: proper triangle crossings, collapse, seam and restore evidence.
No mesh/source edits. Output is exclusive-create. Crossing counts exclude adjacent triangles,
coplanar overlap and touching endpoints; zero means none detected by this bounded test.
"""
import argparse,json
from pathlib import Path
import numpy as np

def load(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def proper_intersections(a,b):
 hit=np.zeros(len(a),bool)
 for segments,triangles in [(a,b),(b,a)]:
  e1=triangles[:,1]-triangles[:,0];e2=triangles[:,2]-triangles[:,0]
  for k in range(3):
   p=segments[:,k];direction=segments[:,(k+1)%3]-p;h=np.cross(direction,e2);det=np.einsum('ij,ij->i',e1,h);valid=np.abs(det)>1e-13
   inv=np.zeros_like(det);inv[valid]=1/det[valid];s=p-triangles[:,0];u=inv*np.einsum('ij,ij->i',s,h);q=np.cross(s,e1);v=inv*np.einsum('ij,ij->i',direction,q);t=inv*np.einsum('ij,ij->i',e2,q)
   hit|=valid&(u>1e-7)&(v>1e-7)&(u+v<1-1e-7)&(t>1e-7)&(t<1-1e-7)
 return hit

def crossing_pairs(points,faces,face_ids,adjacency_faces=None):
 adjacency=faces if adjacency_faces is None else adjacency_faces
 triangles=points[faces];lo=triangles.min(1);hi=triangles.max(1);a=[];b=[];order=np.arange(len(faces))
 for i in range(len(faces)):
  j=np.where(np.all(hi[i]>=lo,axis=1)&np.all(hi>=lo[i],axis=1)&(order>i))[0]
  j=j[~np.any(adjacency[i][:,None,None]==adjacency[j][None,:,:],axis=(0,2))];a.extend([i]*len(j));b.extend(j)
 a=np.array(a,dtype=int);b=np.array(b,dtype=int);hit=proper_intersections(triangles[a],triangles[b])
 return {(int(x),int(y)) for x,y in zip(face_ids[a[hit]],face_ids[b[hit]])}

def metrics(points,neutral,faces,face_ids,edges,threshold,adjacency_faces=None):
 area=lambda p:np.linalg.norm(np.cross(p[faces[:,1]]-p[faces[:,0]],p[faces[:,2]]-p[faces[:,0]]),axis=1)
 base=area(neutral);valid=base>1e-14;ratio=area(points)[valid]/base[valid]
 length=lambda p:np.linalg.norm(p[edges[:,1]]-p[edges[:,0]],axis=1)
 lengths=length(neutral);ev=lengths>1e-10;er=length(points)[ev]/lengths[ev];crossing=crossing_pairs(points,faces,face_ids,adjacency_faces)
 return {'crossingPairs':sorted(crossing),'crossingCount':len(crossing),'collapsedFaceIds':face_ids[valid][ratio<threshold].tolist(),'collapsedEdges':edges[ev][er<threshold].tolist(),'minimumAreaRatio':float(ratio.min()),'areaRatioP01':float(np.quantile(ratio,.01)),'minimumEdgeRatio':float(er.min()),'edgeRatioP99':float(np.quantile(er,.99)),'maximumEdgeRatio':float(er.max()),'degenerateNeutralFaces':int((~valid).sum())}

def self_test():
 a=np.array([[[0.,0,0],[1,0,0],[0,1,0]]]);cross=np.array([[[.2,.2,-1],[.2,.2,1],[.8,.2,1]]]);far=cross+np.array([3,0,0])
 assert proper_intersections(a,cross).tolist()==[True];assert proper_intersections(a,far).tolist()==[False]
 coplanar=a.copy();assert proper_intersections(a,coplanar).tolist()==[False]
 p=np.array([[0.,0,0],[1,0,0],[0,1,0],[1,1,0]]);f=np.array([[0,1,2],[1,3,2]]);assert crossing_pairs(p,f,np.arange(2))==set()
 print('proper crossing / separation / coplanar exclusion / shared-edge tests passed')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('directory',type=Path,nargs='?');ap.add_argument('--baseline',type=Path);ap.add_argument('--output',type=Path);ap.add_argument('--collapse-ratio',type=float,default=.1);ap.add_argument('--self-test',action='store_true');a=ap.parse_args()
 if a.self_test:self_test();return
 if not a.directory or not a.output:ap.error('directory and --output required')
 if not 0<a.collapse_ratio<1:ap.error('collapse ratio must be between0 and1')
 report=load(a.directory/'report.json');
 if not report.get('rows'):raise ValueError('No captured grid rows')
 ref=load(a.directory/'mesh-reference.json');F=np.array(ref['index']).reshape(-1,3)
 base_report=load(a.baseline/'report.json') if a.baseline else None
 if a.baseline:
  br=load(a.baseline/'mesh-reference.json')
  if br['index']!=ref['index'] or br['rest']!=ref['rest'] or report['twistShare']!=base_report['twistShare']:raise ValueError('Baseline rest/topology/twist policy mismatch')
  if report.get('sourcePins')!=base_report.get('sourcePins') and not (report['mode']=='cpu-replay-candidate' and 'sourcePins' not in report):raise ValueError('Baseline source pins mismatch')
 rois={}
 for side in ['left','right']:
  ids=set(ref['sides'][side]['ids']);mask=np.array([all(int(i) in ids for i in f) for f in F]);fi=np.where(mask)[0];f=F[mask];edges=np.unique(np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1),axis=0);rois[side]=(f,fi,edges,ids)
 combined={};hand_vertices=len(ref['rest'])//3;hand_faces=len(F)
 if ref.get('limbs'):
  LF=np.array(ref['limbs']['index']).reshape(-1,3);equivalence={hand_vertices+int(li):int(hi) for hi,li in ref['limbs']['seamPairs']}
  for side in ['left','right']:
   hf,hfi,_,_=rois[side];lid=set(ref['limbs']['sides'][side]['ids']);lm=np.array([all(int(i) in lid for i in f) for f in LF]);lf=LF[lm]+hand_vertices
   faces=np.vstack([hf,lf]);fi=np.r_[hfi,np.where(lm)[0]+hand_faces];adj=np.array([[equivalence.get(int(i),int(i)) for i in f] for f in faces]);edges=np.unique(np.sort(np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1),axis=0);combined[side]=(faces,fi,edges,adj)
 result={'format':'pose-hub-wrist-surface-quality@1','source':str(a.directory),'baseline':str(a.baseline) if a.baseline else None,'collapseRatio':a.collapse_ratio,'mode':report['mode'],'sourcePinComparison':'notMeasured' if 'sourcePins' not in report else 'matched' if a.baseline else 'notCompared','twistShare':report['twistShare'],'rows':[],'limits':['Proper noncoplanar crossings of non-adjacent triangles inside fixed rest wrist ROI only; combined limb analysis is optional and labels missing evidence; coplanar overlap/touching contacts and collisions outside ROI are not tested.','Area/edge ratios use same-twist zero-flex baseline; this diagnostic does not require all areas to approach1.','New crossing pairs and net count increase are reported separately. Visual shape and anatomical acceptance remain separate.']}
 for row in report['rows']:
  d=load(a.directory/(row['name']+'.json'));P=np.array(d['world']).reshape(-1,3);neutral_dir=a.baseline or a.directory;N=np.array(load(neutral_dir/('flex-0-twist-'+str(d['command']['twist'])+'.json'))['world']).reshape(-1,3)
  old=load(a.baseline/(row['name']+'.json')) if a.baseline else None;O=np.array(old['world']).reshape(-1,3) if old else None
  rr={'name':row['name'],'command':d['command'],'seam':d.get('seam'),'renderTime':d.get('renderTime') is True,'restoration':d.get('restoreCheck'),'sides':{}}
  for side,(f,fi,edges,ids) in rois.items():
   m=metrics(P,N,f,fi,edges,a.collapse_ratio)
   if old:
    b=metrics(O,N,f,fi,edges,a.collapse_ratio);new_pairs=set(map(tuple,m['crossingPairs']))-set(map(tuple,b['crossingPairs']));new_faces=set(m['collapsedFaceIds'])-set(b['collapsedFaceIds']);new_edges=set(map(tuple,m['collapsedEdges']))-set(map(tuple,b['collapsedEdges']))
    m['baseline']={k:b[k] for k in ['crossingCount','minimumAreaRatio','minimumEdgeRatio']};m['baseline']['collapsedFaceCount']=len(b['collapsedFaceIds']);m['addedCrossingPairs']=sorted(new_pairs);m['addedCollapsedFaceIds']=sorted(new_faces);m['addedCollapsedEdges']=sorted(new_edges);m['noNetIncreaseCrossingCount']=m['crossingCount']<=b['crossingCount'];m['noNewCrossingPairs']=not new_pairs;m['noNewCollapsedFaces']=not new_faces
    if d['command']=={'flex':0,'twist':0}:m['neutralMaxWorldDifferenceMm']=float(np.linalg.norm(P[list(ids)]-O[list(ids)],axis=1).max()*1000)
   rr['sides'][side]=m
  rr['combinedWrist']={'status':'notMeasured'}
  if combined and d.get('limbWorld') is not None:
   nd=load(a.directory/('flex-0-twist-'+str(d['command']['twist'])+'.json'))
   CP=np.vstack([P,np.array(d['limbWorld']).reshape(-1,3)]);CN=np.vstack([np.array(nd['world']).reshape(-1,3),np.array(nd['limbWorld']).reshape(-1,3)])
   rr['combinedWrist']={'status':'measured','neutralComparison':'same-capture-same-twist-zero-flex','faceIdEncoding':{'hand':[0,hand_faces-1],'limbsOffset':hand_faces},'stitchedSeamAdjacencyExcluded':True,'sides':{}}
   for side,(cf,cfi,ce,adj) in combined.items():
    cm=metrics(CP,CN,cf,cfi,ce,a.collapse_ratio,adj);cm['crossingKinds']={'handHand':sum(x<hand_faces and y<hand_faces for x,y in cm['crossingPairs']),'limbLimb':sum(x>=hand_faces and y>=hand_faces for x,y in cm['crossingPairs']),'handLimb':sum((x<hand_faces)!=(y<hand_faces) for x,y in cm['crossingPairs'])}
    rr['combinedWrist']['sides'][side]=cm
  result['rows'].append(rr)
 result['summary']={'rows':len(result['rows']),'allRenderTime':all(r['renderTime'] for r in result['rows']),'maxSeamGapMm':max((r['seam']['maxGapMm'] for r in result['rows'] if r['seam'] is not None),default=None),'sides':{s:{'maxCrossingCount':max(r['sides'][s]['crossingCount'] for r in result['rows']),'maxCollapsedFaces':max(len(r['sides'][s]['collapsedFaceIds']) for r in result['rows']),'minimumAreaRatio':min(r['sides'][s]['minimumAreaRatio'] for r in result['rows']),'minimumEdgeRatio':min(r['sides'][s]['minimumEdgeRatio'] for r in result['rows'])} for s in ['left','right']}}
 measured_combined=[r['combinedWrist'] for r in result['rows'] if r['combinedWrist']['status']=='measured']
 result['summary']['combinedWrist']={'measuredRows':len(measured_combined),'status':'measured' if measured_combined else 'notMeasured','baselineComparison':'notMeasured','sides':{s:{'maxCrossingCount':max(r['sides'][s]['crossingCount'] for r in measured_combined),'maxCollapsedFaces':max(len(r['sides'][s]['collapsedFaceIds']) for r in measured_combined),'minimumAreaRatio':min(r['sides'][s]['minimumAreaRatio'] for r in measured_combined)} for s in ['left','right']} if measured_combined else {}}
 result['summary']['restoration']={'required':report['mode']=='candidate','measuredRows':sum(isinstance(r['restoration'],dict) and all(k in r['restoration'] for k in ['protectedGeometryReferences','positionsNormalsIndicesWeightsExact','boneRotationsRestored']) for r in result['rows']),'allPassed':all(isinstance(r['restoration'],dict) and all(r['restoration'].get(k) is True for k in ['protectedGeometryReferences','positionsNormalsIndicesWeightsExact','boneRotationsRestored']) for r in result['rows'])}
 if old is not None:result['summary']['noNewCrossingPairs']=all(r['sides'][s]['noNewCrossingPairs'] for r in result['rows'] for s in ['left','right']);result['summary']['noNewCollapsedFaces']=all(r['sides'][s]['noNewCollapsedFaces'] for r in result['rows'] for s in ['left','right'])
 with a.output.open('x',encoding='utf-8') as f:json.dump(result,f,indent=2)
 print(json.dumps(result['summary'],indent=2))
if __name__=='__main__':main()
