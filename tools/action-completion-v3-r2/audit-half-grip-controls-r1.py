from pathlib import Path
s=Path('tools/action-completion-v3-r2/fit-half-kneeling-grip-r1.py').read_text(encoding='utf-8').split('surfaces=[]')[0]
exec(s)
sys.path.insert(0,str(Path.cwd()/'tools/human-v2plus/hands-native'))
from check import audit
qs=json.loads(Path('drill-anim/models/fixed-hand-presets-r1/presets.json').read_bytes())['grasp']['targets'];mats=matrices(qs);grasp=sum(np.einsum('nij,nj->ni',mats[si[:,k]],rest)*sw[:,k,None] for k in range(4))[:,:3]
first=json.loads(Path('F:/PoseHub-v2-production/template-finalization-20261029/planning/half-kneeling-grip-fit-r1.json').read_bytes());failed,_=pose(np.array(first['parameters']))
# Weld rest seam duplicate coordinates at 1 micron. This only changes read-only audit adjacency.
_,weld=np.unique(np.round(rest[:,:3],6),axis=0,return_inverse=True)
def test(points):
 result=audit(points,faces,{'left':np.arange(len(faces))})['left'];pairs=result['witnessFaces'];real=[]
 for a,b in pairs:
  if not np.isin(weld[faces[a]],weld[faces[b]]).any():real.append([a,b])
 return {'pairs':len(pairs),'afterRestSeamWeldPairs':len(real),'nonSeamWitnesses':real[:20]}
r={'format':'native-grip-self-control-r1','sourceSha256':hashlib.sha256(raw).hexdigest(),'sameNativeTopology':True,'detector':'strict interior noncoplanar, shared vertex excluded; rest seam weld 1 micrometre adjacency control','originalAssistOpen':test(actual_local),'presetGrasp32mm':test(grasp),'failedFitR1':test(failed),'passedAsCandidate':False}
args.output.write_bytes((json.dumps(r,indent=2)+'\n').encode());print(json.dumps(r,indent=2))
