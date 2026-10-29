"""Independent finite-candidate tight-grip comparison; never edits candidate inputs.

Protected masks come from authoritative open-source GLB normals and skin weights,
not the candidate shape or cylinder proximity. Finger dorsal movement is measured,
not prohibited: natural finger flexion moves both palmar and dorsal surfaces.
"""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
import check as Q

def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def protection_masks(baseline,source_dir):
 _,_,_,skin=Q.read_glb_mesh(source_dir/'webxr-left.glb',full=True)
 M=np.asarray(baseline['rawToCanonical']).reshape(4,4)
 normals=skin['normals']@np.linalg.inv(M[:3,:3])
 normals/=np.linalg.norm(normals,axis=1)[:,None]
 palmar=Q.unit(baseline['coordinateFrame']['palmarNormal'])
 dorsal=normals@palmar<=-.35
 names=skin['jointNames'];indices=skin['skinIndex'];weights=skin['skinWeight']
 wrist=np.sum(weights*(indices==names.index('wrist')),axis=1)
 palm_bones=[i for i,name in enumerate(names) if name=='wrist' or 'metacarpal' in name]
 palm_weight=np.sum(weights*np.isin(indices,palm_bones),axis=1)
 masks={'wristRigidCore':wrist>=.95,'palmDorsalBody':dorsal&(palm_weight>=.95)}
 for finger in Q.FINGERS:
  masks[finger+'Dorsal']=dorsal&np.isin(np.arange(len(normals)),baseline['vertexGroups'][finger])
 return masks

def displacement(base,candidate,masks):
 delta=np.linalg.norm(Q.points(candidate['positions'])-Q.points(base['positions']),axis=1)*1000
 out={}
 for name,mask in masks.items():
  values=delta[mask]
  if not len(values):raise ValueError('Empty anatomical protection mask '+name)
  out[name]={'vertices':int(mask.sum()),'maxMm':float(values.max()),'p95Mm':float(np.quantile(values,.95)),'meanMm':float(values.mean()),'vertexIds':np.flatnonzero(mask).tolist()}
 return out

def invariants(base,candidate):
 if candidate.get('side')!='left':raise ValueError('Authoring comparison expects left candidate; exact final right mirror is checked by check.py')
 cylinder={}
 for key in ['center','axis','radius','halfLength']:
  cylinder[key]=bool(np.array_equal(np.asarray(base['cylinder'][key]),np.asarray(candidate['cylinder'][key])))
 same_source=base['source']['sha256']==candidate['source']['sha256']
 arrays={key:bool(np.array_equal(np.asarray(base[key]),np.asarray(candidate[key]))) for key in ['originalPositions','indices','skinIndex','skinWeight','restJointMatrices','rawToCanonical']}
 scale=base.get('scale')==candidate.get('scale')==1
 return {'fixedCylinderComponentsExact':cylinder,'sourceShaExact':same_source,'sourceArraysExact':arrays,'scaleExactly1':scale,'allRequiredInvariants':all(cylinder.values()) and same_source and all(arrays.values()) and scale}

def contact_snapshot(qa):
 return {'wholeFingerGapMm':{f:qa['contacts'][f]['wholeFinger']['minSidewallGapMm'] for f in Q.FINGERS},'distalGapMm':{f:qa['contacts'][f]['distal']['minSidewallGapMm'] for f in Q.FINGERS},'palmGapMm':qa['contacts']['palm']['minSidewallGapMm'],'thumbOppositionGapMm':qa['thumbToIndexMiddleOpposition'].get('minSurfaceGapMm'),'penetrationMm':qa['triangleInteriorCylinderPenetration']['maxDepthMm'],'crossings':len(qa['selfIntersection']['properCrossingPairs'])+len(qa['selfIntersection']['coplanarOverlapPairs'])}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--baseline',required=True,type=Path);ap.add_argument('--source-dir',required=True,type=Path);ap.add_argument('--output',required=True,type=Path);ap.add_argument('candidates',nargs='*',type=Path);a=ap.parse_args()
 baseline=Q.load(a.baseline);diameter=baseline['cylinder']['radius']*2000
 if diameter!=25:raise ValueError('This comparison is anchored to the accepted25mm baseline')
 masks=protection_masks(baseline,a.source_dir);base_qa=Q.analyze(baseline,a.source_dir,diameter);base_contact=contact_snapshot(base_qa)
 report={'format':'pose-hub-tight-grip-independent-comparison@1','reviewed':False,'releaseEligible':False,'baseline':{'path':str(a.baseline),'sha256':digest(a.baseline),'qa':base_qa,'contactSummary':base_contact},'maskDefinition':{'source':'Authoritative left GLB open-rest normal transformed with inverse-transpose canonical matrix and original JOINTS/WEIGHTS. No candidate-dependent masks.','wristRigidCore':'Wrist bone weight >=.95; protects wrist anchor/core.','palmDorsalBody':'Sum wrist/metacarpal weights >=.95 AND source-rest normal dot canonical palmarNormal <=-.35.','fingerDorsal':'Source anatomy finger groups AND same dorsal source-normal test; motion quantified, not forbidden.'},'candidates':[]}
 for path in a.candidates:
  candidate=Q.load(path);fixed=invariants(baseline,candidate);movement=displacement(baseline,candidate,masks);qa=Q.analyze(candidate,a.source_dir,diameter);contacts=contact_snapshot(qa)
  row={'path':str(path),'sha256':digest(path),'poseSource':candidate.get('poseSource'),'invariants':fixed,'displacement':movement,'qa':qa,'contactSummary':contacts,'contactDeltaMm':{kind:{f:contacts[kind][f]-base_contact[kind][f] for f in Q.FINGERS} for kind in ['wholeFingerGapMm','distalGapMm']}}
  row['comparisonChecks']={'sourceAndCylinderFixed':fixed['allRequiredInvariants'],'wristCoreWithin0_001mm':movement['wristRigidCore']['maxMm']<=.001,'palmDorsalBodyWithin0_001mm':movement['palmDorsalBody']['maxMm']<=.001,'rodPenetrationWithinExisting0_1mm':qa['checks']['cylinderPenetrationWithin0_1mm'],'noNonadjacentSelfIntersection':qa['checks']['noNonadjacentSelfIntersection'],'originalFingerLengthsPreserved':qa['jointScale']['fingerChainLengthsPreservedWithin0_001mm']}
  report['candidates'].append(row)
  print(json.dumps({'candidate':str(path),'contacts':contacts,'checks':row['comparisonChecks'],'dorsalMovement':{k:{j:v for j,v in value.items() if j!='vertexIds'} for k,value in movement.items()}},indent=2),flush=True)
 with a.output.open('x',encoding='utf-8') as f:json.dump(report,f,indent=2)
 print(str(a.output))

if __name__=='__main__':main()
