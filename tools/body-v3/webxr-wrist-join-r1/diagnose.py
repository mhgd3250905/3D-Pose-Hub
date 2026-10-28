"""Read-only supplemental orientation and failed-face localization; no geometry rerun."""
import argparse, hashlib, importlib.util, json
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation

spec=importlib.util.spec_from_file_location('wrist_check',Path(__file__).with_name('check.py'))
Q=importlib.util.module_from_spec(spec);spec.loader.exec_module(Q)

def orientation(ref,sample,flex,twist):
 H0,_=Q.rot(Q.matrix(ref['handMatrixWorld']));F0,_=Q.rot(Q.matrix(ref['forearmMatrixWorld']))
 H,_=Q.rot(Q.matrix(sample['handMatrixWorld']));F,_=Q.rot(Q.matrix(sample['forearmMatrixWorld']))
 D=(F0.T@H0).T@(F.T@H)
 long=Q.G.unit(ref['frameConventions']['longitudinalHandLocal']);palmar=Q.G.unit(ref['frameConventions']['palmarHandLocal'])
 target=(Rotation.from_rotvec(np.cross(long,palmar)*np.deg2rad(flex))*Rotation.from_rotvec(long*np.deg2rad(twist))).as_matrix()
 moved=D@long
 return {'totalSwingDeg':float(np.rad2deg(np.arccos(np.clip(moved@long,-1,1)))),
         'outOfFlexPlaneDeg':float(np.rad2deg(np.arcsin(np.clip(moved@np.cross(long,palmar),-1,1)))),
         'fullTargetOrientationErrorDeg':float(np.rad2deg(Rotation.from_matrix(target.T@D).magnitude())),
         'within1DegreeOfFullTarget':bool(Rotation.from_matrix(target.T@D).magnitude()<=np.deg2rad(1))}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('directory',type=Path);ap.add_argument('--qa',required=True,type=Path);ap.add_argument('--recipe',required=True,type=Path);ap.add_argument('--output',required=True,type=Path);a=ap.parse_args()
 manifest=Q.load(a.directory/'report.json');qa=Q.load(a.qa);recipe=Q.load(a.recipe)
 refs={s:Q.load(a.directory/p)for s,p in manifest['references'].items()};meta={r['name']:r for r in manifest['rows']}
 out={'format':'webxr-wrist-supplement@1','sourceQaSha256':hashlib.sha256(a.qa.read_bytes()).hexdigest(),'sourceRecipeSha256':hashlib.sha256(a.recipe.read_bytes()).hexdigest(),'sourceDirectory':str(a.directory),'method':'Independently reconstruct neutral-relative matrices. Full target is flex about cross(long,palmar), then axial twist; sidebend target zero. Localize existing measured geometry failures without changing thresholds or captures.','rows':[]}
 for row in qa['rows']:
  capture=Q.load(a.directory/meta[row['name']]['file']);entry={'name':row['name'],'classification':row['classification'],'sides':{}}
  for side,v in row['sides'].items():
   ref=refs[side];b=recipe['bridge'][side];face_ids=ref['regions']['bandFaceIds'];ordinal={f:i for i,f in enumerate(face_ids)};BF=np.asarray(b['indices']).reshape(-1,3);F=np.asarray(ref['index']).reshape(-1,3);P=Q.points(capture['sides'][side]['positions']);R=Q.points(ref['positions'])
   bad=sorted(set(v['qualityVsActualNeutral']['collapsedFaceIds']+v['selfIntersection']['allAffectedFaces']));details=[]
   for f in bad:
    info={'combinedFaceId':f,'region':next((k for k in ['limbFaceIds','bandFaceIds','handFaceIds']if f in ref['regions'][k]),'unknown'),'combinedVertexIds':F[f].tolist()}
    if f in ordinal:
     bi=ordinal[f];vs=BF[bi];info.update(bridgeFaceId=bi,bridgeVertexIds=vs.tolist(),canonicalRestMm=[[x*1000 for x in b['vertices'][i]['canonicalRest']]for i in vs],rows=[b['vertices'][i]['row']for i in vs],arcT=[b['vertices'][i]['arcT']for i in vs],u=[b['vertices'][i]['u']for i in vs])
     # Explicitly verify mapping rather than silently assuming export ordering.
     assert F[f].tolist()==[ref['regions']['bandVertexIds'][i]for i in vs]
    A=P[F[f]];B=R[F[f]];info['areaRatio']=float(np.linalg.norm(np.cross(A[1]-A[0],A[2]-A[0]))/np.linalg.norm(np.cross(B[1]-B[0],B[2]-B[0])));details.append(info)
   entry['sides'][side]={'orientation':orientation(ref,capture['sides'][side],**{'flex':row['command']['flexDeg'],'twist':row['command']['twistDeg']}),'crossingPairs':v['selfIntersection']['pairs'],'problemFaces':details}
  out['rows'].append(entry)
 out['summary']={'maximumFullTargetOrientationErrorDeg':max(s['orientation']['fullTargetOrientationErrorDeg']for r in out['rows']for s in r['sides'].values()),'maximumAbsoluteOutOfFlexPlaneDeg':max(abs(s['orientation']['outOfFlexPlaneDeg'])for r in out['rows']for s in r['sides'].values())}
 with a.output.open('x',encoding='utf-8')as f:json.dump(out,f,indent=2)
 print(json.dumps(out['summary']))

if __name__=='__main__':main()
