"""Compare all visible skinned mesh dump arrays and indices across versions.

This read-only comparison does not prove topology or attributes absent from
the snapshot. In particular, drawRange, all GPU material state and full bone
matrices are not included; use the separate live signatures for those bones.
"""
import argparse,base64,hashlib,json
from pathlib import Path

p=argparse.ArgumentParser(description=__doc__);p.add_argument('candidate',type=Path);p.add_argument('reference',type=Path);p.add_argument('--reference-fold',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
if a.output.exists():raise FileExistsError(a.output)
result={'method':'compare all captured skinned mesh world-position/normal float arrays and index arrays for same pose',
        'limits':['visible skinned meshes only','drawRange and materials are not captured','bone snapshots include only named positions, not all matrices','capture equality is not a full runtime equivalence proof'],'states':{}}
for state in ['rest','squat','plank','fold']:
    ref=(a.reference_fold if state=='fold' and a.reference_fold else a.reference)/(state+'.json');candidate=a.candidate/(state+'.json')
    x=json.loads(ref.read_text(encoding='utf8'));y=json.loads(candidate.read_text(encoding='utf8'));names=set(x['meshes'])|set(y['meshes']);meshes={}
    for name in sorted(names):
        if name not in x['meshes'] or name not in y['meshes']:meshes[name]={'missing':True};continue
        first,last=x['meshes'][name],y['meshes'][name];v0=base64.b64decode(first['A']);v1=base64.b64decode(last['A'])
        meshes[name]={'worldPositionNormalIdentical':v0==v1,'facesIdentical':first['idx']==last['idx'],'worldArraySha256':hashlib.sha256(v1).hexdigest(),'vertexCount':len(v1)//24,'triangleCount':len(last['idx'])//3}
    result['states'][state]={'referenceSha256':hashlib.sha256(ref.read_bytes()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.read_bytes()).hexdigest(),'meshCount':len(names),'bonePositionsIdentical':x['bones']==y['bones'],'meshIdentical':all(v.get('worldPositionNormalIdentical',False) and v.get('facesIdentical',False) for v in meshes.values()),'meshes':meshes}
with a.output.open('x',encoding='utf8') as f:json.dump(result,f,indent=2)
for state,r in result['states'].items():print(state,'meshes',r['meshCount'],'meshExact',r['meshIdentical'],'bonePositionsExact',r['bonePositionsIdentical'])
