"""Audit captured actual native-grip hands, wrists and native 16-sided rod.

Processes one captured surface pose at a time. These discrete checks do not
certify continuous collision, dynamics, training safety or visual acceptance.
"""
import argparse,json,sys
from pathlib import Path
import numpy as np
repo=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(repo/'tools/human-v2plus/hands-native'))
from check_wrist import audit_pose
from check import hits

def rod_check(mesh,rod):
    p=np.asarray(mesh['pos']).reshape(-1,3);f=np.asarray(mesh['index']).reshape(-1,3)
    rp=np.asarray(rod['pos']).reshape(-1,3);rf=np.asarray(rod['index']).reshape(-1,3)
    rt=rp[rf];n=np.cross(rt[:,1]-rt[:,0],rt[:,2]-rt[:,0]);good=np.linalg.norm(n,axis=1)>1e-12
    rt=rt[good];n=n[good];n/=np.linalg.norm(n,axis=1)[:,None];offset=(n*rt[:,0]).sum(1)
    assert (n@rp.mean(0)-offset).max()<0,'Native rod winding is not outward'
    signed=(p@n.T-offset).max(1)
    tri=p[f];minimum=tri.min(1);maximum=tri.max(1);witness=[]
    for k,t in enumerate(rt):
        candidates=np.where((minimum<=t.max(0)).all(1)&(maximum>=t.min(0)).all(1))[0]
        if len(candidates):
            rods=np.broadcast_to(t,(len(candidates),3,3));actual=hits(tri[candidates],rods)|hits(rods,tri[candidates])
            witness.extend([[int(i),k] for i in candidates[actual]])
    names=np.asarray(mesh['bones']);j=np.asarray(mesh['joints']).reshape(-1,4);w=np.asarray(mesh['weights']).reshape(-1,4)
    dominant=names[j[np.arange(len(j)),w.argmax(1)]]
    contact={}
    for side in ['L','R']:
        for finger in ['thumb','index','middle','ring','pinky']:
            ids=np.where(dominant==f'v2p_{side}_{finger}3')[0]
            contact[side+'_'+finger]={'minGapM':float(signed[ids].min()),'near2MmVertices':int((np.abs(signed[ids])<.002).sum())}
    return {'strictTriangleIntersections':len(witness),'witnesses':witness,'maxVertexPenetrationM':float(max(0,-signed.min())),
            'verticesInside':int((signed<0).sum()),'distalContact':contact}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture',type=Path);parser.add_argument('out',type=Path);args=parser.parse_args()
    if args.out.exists():raise SystemExit('Output exists; choose a new report')
    hands=json.loads((repo/'drill-anim/models/hands-native-r3/hands-base.json').read_bytes())
    limbs=json.loads((repo/'drill-anim/models/training-human-v2plus-limbs-base.json').read_bytes())
    poses=json.loads((args.capture/'poses.json').read_bytes());report={'id':poses['id'],'frames':{},'fullPoseCount':len(poses['frames']),
        'limits':__doc__,'solverWarningFrames':[row['frame'] for row in poses['frames'] if row.get('warnings')]}
    joint_keys=[k for k,v in poses['frames'][0]['joints'].items() if isinstance(v,list) and len(v)==3]
    a,z=poses['frames'][0]['joints'],poses['frames'][-1]['joints']
    report['loopJointErrorM']=max(np.linalg.norm(np.array(a[k])-z[k]) for k in joint_keys)
    for frame in poses['surfaceFrames']:
        data=json.loads((args.capture/f'frame-{frame}.json').read_bytes())
        wrist=audit_pose(data['meshes'],hands,limbs)
        rod=rod_check(data['meshes']['hands'],data['rod'])
        report['frames'][str(frame)]={'wrist':wrist,'rod':rod}
        print(frame,{side:(value['handSelf']['pairs'],value['handForearm']['pairs']) for side,value in wrist['sides'].items()},'rod',rod['strictTriangleIntersections'],flush=True)
    report['pass']=not report['solverWarningFrames'] and report['loopJointErrorM']<1e-6 and all(
        entry['wrist']['seam']['maxGapM']<1e-5 and all(v['covered'] and v['handSelf']['pairs']==0 and v['handForearm']['pairs']==0 for v in entry['wrist']['sides'].values()) and
        entry['rod']['strictTriangleIntersections']==0 and entry['rod']['maxVertexPenetrationM']<=1e-6 and
        all(v['near2MmVertices']>0 for v in entry['rod']['distalContact'].values()) for entry in report['frames'].values())
    args.out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print('pass',report['pass'])
    if not report['pass']:raise SystemExit(1)
if __name__=='__main__':main()
