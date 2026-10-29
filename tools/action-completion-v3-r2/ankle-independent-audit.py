"""Independent actual-vertex audit; cached seam fields never establish closure."""
import json,sys,subprocess
from pathlib import Path
import numpy as np
base,candidate=map(Path,sys.argv[1:3])
rest=json.loads((base/'probe.json').read_text(encoding='utf-8-sig'))['rest']
candidate_metadata=json.loads((candidate/'probe.json').read_text(encoding='utf-8-sig'));protected_height=candidate_metadata.get('adapter',{}).get('lowerHeight')
neutral={}
for side in ['left','right']:
 a=np.array(rest['bones'][side+'Foot']['worldPosition']);axis=np.array(rest['bones'][side+'Shin']['worldPosition'])-a;axis/=np.linalg.norm(axis);neutral[side]=(a,axis)
R={n:{v['id']:v for v in m['vertices']} for n,m in rest['meshes'].items()}
rows=[]
frames=sorted(int(p.name.split('-')[1]) for p in candidate.glob('frame-*-geometry.json') if (base/p.name).is_file())
if not frames:raise RuntimeError('No common actual geometry frames to audit')
for frame in frames:
 filename=f'frame-{frame:04d}-geometry.json';a=json.loads((base/filename).read_text(encoding='utf-8-sig'));b=json.loads((candidate/filename).read_text(encoding='utf-8-sig'));A={n:{v['id']:v for v in m['vertices']} for n,m in a['meshes'].items()};B={n:{v['id']:v for v in m['vertices']} for n,m in b['meshes'].items()}
 seams=[]
 for s in rest['seams']:
  gap=float(np.linalg.norm(np.array(B['Coach_Body'][s['bodyId']]['world'])-B['V2P_Base_Limbs'][s['limbId']]['world'])*1000);seams.append({'bodyId':s['bodyId'],'limbId':s['limbId'],'gapMm':gap})
 row={'frame':frame,'recomputedSeamMaxGapMm':max(s['gapMm'] for s in seams),'failedSeamPairs':[s for s in seams if s['gapMm']>.01],'cachedSeamMaxGapMm':b.get('seamMaxGapMm'),'meshes':{}}
 for name in ['Coach_Body','V2P_Base_Limbs','Coach_Sneakers','Coach_Shoe_Details']:
  ids=set(A[name])&set(B[name]);d={i:float(np.linalg.norm(np.array(A[name][i]['world'])-B[name][i]['world'])*1000) for i in ids}
  entry={'maxPositionDeltaMm':max(d.values(),default=0),'weightsIdentical':all(A[name][i]['weights']==B[name][i]['weights'] for i in ids),'commonVertices':len(ids)}
  if name in ['Coach_Body','V2P_Base_Limbs']:
   protected=[]
   for i in ids:
    if i not in R[name]:continue
    p=np.array(R[name][i]['world']);ankle,axis=neutral['left' if p[0]>=0 else 'right'];h=(p-ankle)@axis
    if protected_height is not None and h<=protected_height:protected.append(d[i])
   entry['unchangedSkinBelowHeightM']=protected_height
   entry['belowCorrectionBandMaxPositionDeltaMm']=max(protected,default=0) if protected_height is not None else None
  row['meshes'][name]=entry
 row['maxBoneMatrixDelta']=max(abs(x-y) for name in a['bones'] for x,y in zip(a['bones'][name]['matrixWorld'],b['bones'][name]['matrixWorld']))
 row['actualGpu']=not b.get('cpuReplay',{}).get('actualGpu') is False
 rows.append(row)
for side in ['left','right']:
 result=subprocess.run([sys.executable,str(Path(__file__).with_name('ankle-crossing-audit.py')),str(base),str(candidate),side],capture_output=True,text=True)
 if result.returncode:raise RuntimeError(result.stderr)
crossings={side:json.loads((candidate/('independent-geometry-comparison.json' if side=='left' else 'independent-geometry-comparison-right.json')).read_text())['results'] for side in ['left','right']}
report={'format':'ankle-independent-audit@1','seamAuthority':'recomputed from actual exported corrected vertices, never cached seams','frames':frames,'threePoseSetComplete':frames==[0,60,120],'results':rows,'shoeCrossings':crossings,'visualAcceptance':'not inferred; inspect actual full and close-up views','limitations':['Triangle audit detects noncoplanar crossings only, not containment/coplanar contact/all self-intersections.','CPU scene replay is explicitly distinguished from actual GPU evidence.']}
(candidate/'independent-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps({'candidate':str(candidate),'maxActualSeamGapMm':max(r['recomputedSeamMaxGapMm'] for r in rows),'maxShoeDeltaMm':max(r['meshes'][n]['maxPositionDeltaMm'] for r in rows for n in ['Coach_Sneakers','Coach_Shoe_Details']),'crossingPairs':{side:[f['candidate']['crossingPairs'] for f in data] for side,data in crossings.items()}}))
