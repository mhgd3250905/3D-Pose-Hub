"""Check actual overhead hand/wrist triangles, finite rod contact and end plates.

Discrete pose QA only; no continuous collision or dynamics certification.
"""
import argparse, importlib.util, json, sys
from pathlib import Path
import numpy as np

repo=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(repo/'tools/human-v2plus/hands-native'))
from check_wrist import audit_pose
module_spec=importlib.util.spec_from_file_location('native_grip_check',repo/'tools/human-v2plus/grip-native/check.py')
module=importlib.util.module_from_spec(module_spec);module_spec.loader.exec_module(module)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture',type=Path);parser.add_argument('out',type=Path)
    parser.add_argument('--baseline',type=Path,help='rr2 actual-poses.json for exact joint comparison')
    args=parser.parse_args()
    if args.out.exists():raise SystemExit('Output exists; choose a fresh QA report')
    hands=json.loads((repo/'drill-anim/models/hands-native-r3/hands-base.json').read_bytes())
    limbs=json.loads((repo/'drill-anim/models/training-human-v2plus-limbs-base.json').read_bytes())
    poses=json.loads((args.capture/'poses.json').read_bytes())
    report={'id':poses['id'],'fullPoseCount':len(poses['frames']),'frames':{},'limits':__doc__,
        'solverWarningFrames':[r['frame'] for r in poses['frames'] if r.get('warnings')]}
    first,last=poses['frames'][0]['joints'],poses['frames'][-1]['joints']
    keys=[k for k,v in first.items() if isinstance(v,list) and len(v)==3]
    report['loopJointErrorM']=max(float(np.linalg.norm(np.array(first[k])-last[k])) for k in keys)
    if args.baseline:
        old=json.loads(args.baseline.read_bytes())['frames']
        assert len(old)==len(poses['frames'])
        report['maxJointDeltaVsRr2M']=max(float(np.linalg.norm(np.array(a['joints'][k])-b['joints'][k])) for a,b in zip(old,poses['frames']) for k in keys)
    for frame in poses['surfaceFrames']:
        data=json.loads((args.capture/f'frame-{frame}.json').read_bytes())
        wrist=audit_pose(data['meshes'],hands,limbs)
        rod=module.rod_check(data['meshes']['hands'],data['rod'])
        plates=[module.rod_check(data['meshes']['hands'],plate) for plate in data['endPlates']]
        contact={k:v for k,v in rod['distalContact'].items() if k.startswith('R_')}
        scans=data['propScans']
        row={'wrist':wrist,'rod':rod,'rightDistalContact':contact,
            'endPlateHandIntersections':[p['strictTriangleIntersections'] for p in plates],
            'endPlateHandInside':[p['verticesInside'] for p in plates],
            'bodyPropOver2Mm':sum(sum(s['over2Mm']) for s in scans),
            'maxBodyPropPenetrationMm':max(max(s['maxDepthMm']) for s in scans),
            'bodyEndPlateInside':sum(sum(s['inside'][1:]) for s in scans)}
        report['frames'][str(frame)]=row
        print(frame,{s:(v['handSelf']['pairs'],v['handForearm']['pairs']) for s,v in wrist['sides'].items()},'rod',rod['strictTriangleIntersections'],flush=True)
    report['pass']=not report['solverWarningFrames'] and report['loopJointErrorM']<1e-6 and report.get('maxJointDeltaVsRr2M',0)<1e-9 and all(
        r['wrist']['seam']['maxGapM']<1e-5 and all(v['covered'] and v['handSelf']['pairs']==0 and v['handForearm']['pairs']==0 for v in r['wrist']['sides'].values()) and
        r['rod']['strictTriangleIntersections']==0 and r['rod']['verticesInside']==0 and all(v['near2MmVertices']>0 for v in r['rightDistalContact'].values()) and
        not any(r['endPlateHandIntersections']) and not r['bodyEndPlateInside'] and not r['bodyPropOver2Mm'] for r in report['frames'].values())
    args.out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print('pass',report['pass'])
    if not report['pass']:raise SystemExit(1)

if __name__=='__main__':main()
