"""Check actual-JS-kernel CPU deltas against captured combined geometry."""
import argparse,importlib.util,json,hashlib
from pathlib import Path
import numpy as np
spec=importlib.util.spec_from_file_location('q',Path(__file__).with_name('check.py'));Q=importlib.util.module_from_spec(spec);spec.loader.exec_module(Q)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('capture',type=Path);ap.add_argument('deltas',type=Path);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args();manifest=Q.load(a.capture/'report.json');delta=Q.load(a.deltas);refs={s:Q.load(a.capture/p)for s,p in manifest['references'].items()};meta={r['name']:r for r in manifest['rows']};rows=[]
 state={s:(Q.weld(r)[0],*Q.topology(r,Q.weld(r)[0])[1:])for s,r in refs.items()}
 for row in delta['rows']:
  sample=Q.load(a.capture/meta[row['name']]['file'])
  for side,ref in refs.items():
   P=Q.points(sample['sides'][side]['positions']);C=P.copy();ids=np.asarray(ref['regions']['bandVertexIds']);D=Q.points(row['sides'][side]['delta']);C[ids]+=D;w,E,F=state[side];quality=Q.ratios(C,Q.points(ref['positions']),F,E);cross=Q.crossing_pairs(C,F,w)
   changed=np.linalg.norm(C-P,axis=1)>1e-12;affected=np.flatnonzero(np.any(changed[F],axis=1));N=np.cross(C[F[:,1]]-C[F[:,0]],C[F[:,2]]-C[F[:,0]]);N0=np.cross(P[F[:,1]]-P[F[:,0]],P[F[:,2]]-P[F[:,0]]);dot=np.einsum('ij,ij->i',N,N0)/(np.linalg.norm(N,axis=1)*np.linalg.norm(N0,axis=1));maxnormal=float(np.rad2deg(np.arccos(np.clip(dot[affected],-1,1))).max())if len(affected)else 0
   seamids=np.unique(np.asarray(sum(ref['seamPairs'].values(),[])).ravel());protected=np.setdiff1d(np.arange(len(P)),ids);assert np.array_equal(C[protected],P[protected]);assert np.array_equal(C[seamids],P[seamids]);
   rows.append({'name':row['name'],'side':side,'quality':quality,'intersections':cross,'changedVertices':int(changed.sum()),'affectedFaces':len(affected),'maxDisplacementMm':float(np.linalg.norm(D,axis=1).max()*1000),'minimumFaceNormalDotVsUncorrected':float(dot.min()),'maxAffectedFaceNormalChangeDeg':maxnormal,'faceNormalReversalsVsUncorrected':np.flatnonzero(dot<0).tolist(),'allNonBandPositionsExact':True,'bothSeamsExact':True})
 out={'prediction':True,'renderTime':False,'candidateRuntimeSha256':delta['candidateRuntimeSha256'],'sourceCapture':str(a.capture),'jsDeltasSha256':hashlib.sha256(a.deltas.read_bytes()).hexdigest(),'method':'Execute actual old/new JavaScript target kernels independently, apply only world-space delta to actual captured band, audit full combined limb/band/hand ROI. No copied restoration or world-normal evidence.','rows':rows,'limitations':['Actual GPU normals and lifecycle restoration require fresh capture.','Normal change compares with uncorrected captured geometry, including its already collapsed faces; this is diagnostic, not a face-flip acceptance gate.','Dumbbell positions are outside the edited band and are copied unchanged, not newly rendered.']}
 out['summary']={'allPrimaryGeometryPass':all(not r['intersections']['properCount']and not r['intersections']['coplanarCount']and not r['quality']['collapsedFaceIds']and not r['quality']['collapsedEdgeCount']for r in rows),'minimumAreaRatio':min(r['quality']['minimumAreaRatio']for r in rows),'minimumEdgeRatio':min(r['quality']['minimumEdgeRatio']for r in rows),'maximumDisplacementMm':max(r['maxDisplacementMm']for r in rows),'maximumFaceNormalChangeDeg':max(r['maxAffectedFaceNormalChangeDeg']for r in rows),'faceReversalCountVsUncorrected':sum(len(r['faceNormalReversalsVsUncorrected'])for r in rows),'sampleSides':len(rows)}
 with a.output.open('x',encoding='utf-8')as f:json.dump(out,f,indent=2)
 print(json.dumps(out['summary']))
if __name__=='__main__':main()
