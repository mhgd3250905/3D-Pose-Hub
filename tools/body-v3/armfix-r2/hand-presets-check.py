"""Read-only triangle and wrist QA of actual rendered hand-preset captures."""
import argparse,json,sys
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'human-v2plus/hands-native'))
from check import audit
ap=argparse.ArgumentParser();ap.add_argument('capture',type=Path);ap.add_argument('output',type=Path);args=ap.parse_args()
if args.output.exists():raise SystemExit('Use a new report path')
rows=[]
for file in sorted(args.capture.glob('*-mesh.json')):
 d=json.loads(file.read_bytes());p=np.asarray(d['positions']).reshape(-1,3);f=np.asarray(d['index']).reshape(-1,3)
 side_faces={side:np.where(np.isin(f,values['ids']).all(1))[0] for side,values in d['sides'].items()}
 hits=audit(p,f,side_faces)
 row={'file':file.name,'wristSeam':d['wristSeam'],'selfIntersections':{s:v['pairs'] for s,v in hits.items()},'finite':bool(np.isfinite(p).all())}
 if file.name.startswith('support-'):
  row['floorMinMm']={s:float(p[x['ids'],1].min()*1000) for s,x in d['sides'].items()}
 row['pass']=row['finite'] and d['wristSeam']['maxGapMm']<.05 and all(x['pairs']==0 for x in hits.values()) and all(x>=-.05 for x in row.get('floorMinMm',{}).values())
 rows.append(row);print(json.dumps(row),flush=True)
report={'format':'pose-hub-hand-presets-mesh-check@1','pass':bool(rows) and all(x['pass'] for x in rows),'frames':rows,'limits':['Noncoplanar strict-interior triangle crossings only; edge touches and coplanar intersections require visual review.','Floor checks inspect the whole hand mesh against world y=0; other action body contacts are outside this check.']}
args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');sys.exit(0 if report['pass'] else 1)
