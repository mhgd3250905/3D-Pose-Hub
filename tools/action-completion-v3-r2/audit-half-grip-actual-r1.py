"""Actual draw mesh audit for half-kneeling native heel grip, without changing geometry."""
import argparse,ast,hashlib,json,sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation as R
ap=argparse.ArgumentParser();ap.add_argument('probe',type=Path);ap.add_argument('output',type=Path);args=ap.parse_args();saved=args
sys.path.insert(0,str(Path.cwd()/'tools/human-v2plus/hands-native'));from check import audit,hits
module=ast.parse(Path('tools/action-completion-v3-r2/audit-half-grip-two-pose-r1.py').read_text(encoding='utf-8'));crossnode=next(n for n in module.body if isinstance(n,ast.FunctionDef) and n.name=='cross');exec(compile(ast.Module(body=[crossnode],type_ignores=[]),'cross','exec'))
results=[]
for frame in [0,114]:
 p=saved.probe/f'frame-{frame:04d}-contact.json';sys.argv=['audit',str(p),str(saved.output)];exec(Path('tools/action-completion-v3-r2/fit-half-kneeling-grip-r1.py').read_text(encoding='utf-8').split('active=np.where')[0]);dist=distances(actual);active=np.where(rest[:,0]>.025)[0];dom=si[np.arange(len(si)),sw.argmax(1)];bones=m['bones'];get=lambda name:np.array(next(b['matrixWorld'][12:15] for b in bones if b['name']==name));fore=get('leftHand')-get('leftForearm');fore/=np.linalg.norm(fore);finger=H[:3,:3]@np.array([.98253144,.05483374,.17783482]);angle=float(np.rad2deg(np.arccos(np.clip(fore@finger,-1,1))))
 results.append({'frame':frame,'inputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'nativeAction':record.get('nativeAction'),'selfIntersection':audit(actual,faces,{'left':np.arange(len(faces))}),'minimumSignedVertexGapMm':float(dist[active].min()*1000),'negativeVertices':int((dist[active]<-.0001).sum()),'handTargetTriangleCrosses':{sf['name']:cross(actual[faces],sf['tri']) for sf in surfaces},'contacts':{fn:{'minimumGapMm':float(dist[g].min()*1000),'closest20MeanAbsGapMm':float(np.mean(np.sort(abs(dist[g]))[:20])*1000)} for fn,g in groups.items()},'handLongAxisForearmDegrees':angle,'bodySurface':record['bodySurface']})
report={'format':'half-native-grip-actual-two-pose-audit-r1','poses':results,'limits':['Exact strict noncoplanar triangle crossings; coplanar overlap excluded.','Vertex distances use nearest triangle normals.','Only two actual key poses, not full-cycle surface collision proof.'],'passedAsCandidate':False};saved.output.write_bytes((json.dumps(report,indent=2)+'\n').encode());print(json.dumps([{k:v for k,v in r.items() if k!='bodySurface'} for r in results],indent=2))
