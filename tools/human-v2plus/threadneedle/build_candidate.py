"""Build the standalone 091 trajectory from the hash-verified recovery workspace.

Run from the recovered cpu-work directory. The output is a new model candidate,
never a production registration. Frozen meshes and historical records are read.
"""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse,json,sys
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from reachable_shoulder_endpoint import geometry,models,P,B,C,p

def smooth(x):
    x=np.clip(x,0,1);return x*x*(3-2*x)

def sample(t):
    start=.6064814814814814
    if t<.8:return start
    if t<3:return start+(1-start)*smooth((t-.8)/2.2)
    if t<5:return 1.
    if t<7.2:return 1.-(1-start)*smooth((t-5)/2.2)
    return start

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--endpoint',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    out=Path(a.out)
    if out.exists():raise FileExistsError(out)
    out.mkdir(parents=True)
    end=np.array(json.loads(Path(a.endpoint).read_text())['params'])
    # Native source palm orientation is measured from its complete surface.
    # The support wrist follows its heel contact rather than the legacy hand.
    B.WR[1]=.03387250166112267
    rows=P.FINAL.copy();rows[-1,1:4]=end[:3];rows[-1,5:8]=end[5:8];rows[-1,8]=end[8]
    track=[]
    for f in range(241):
        q=sample(f/30);k=min(np.searchsorted(rows[:,0],q,side='right')-1,len(rows)-2)
        t=smooth((q-rows[k,0])/(rows[k+1,0]-rows[k,0]));r=rows[k]*(1-t)+rows[k+1]*t
        v=np.r_[r[1:4],end[3:5]*r[4],r[5:8],r[8],end[9]*r[4]];s=geometry(v)
        # A small cervical extension clears the threading arm with anatomical
        # neck/head continuity. It does not move the torso or supporting points.
        neck=s['j']['neck'];R=B.rz(7.)
        for name in ['head']:
            Q,d=s['T'][name];s['T'][name]=(R@Q,R@(d-neck)+neck)
        s['j']['head']=R@(s['j']['head']-neck)+neck
        finger=s['j']['leftWrist']-s['j']['leftElbow'];finger[1]=0;finger/=np.linalg.norm(finger)
        track.append(dict(frame=f,q=float(q),fairAmount=float(.3-.1*smooth((q-.575)/.075)),params=v.tolist(),bones={n:dict(q=Rotation.from_matrix(Q).as_quat().tolist(),t=d.tolist())for n,(Q,d)in s['T'].items()},joints={n:x.tolist()for n,x in s['j'].items()},leftFinger=finger.tolist()))
    F=np.vstack([models['Torso'].ix,models['Mesh005'].ix+len(models['Torso'].bind)])
    fair=[]
    for i in [2774,10956,18483]:
        ids=np.unique(F[np.any(F==i,axis=1)]);fair.append(dict(vertex=i,neighbors=ids[ids!=i].tolist()))
    rig=json.loads(Path('posehub_v2plus_20261021/runtime/public/coach/coach-rig.json').read_text())
    data=dict(version='1.0.0-r1',fps=30,duration=8,fair=fair,leftPalmRollDegrees=-30,rightPalmRollDegrees=40,
        weld=[[i,int(owner)]for i,owner in enumerate(p['weld'])if i!=owner],
        pivots={r['name']:r['pivot']for r in rig['bones']},
        calibration={name:dict(bones=m.names,palette=m.palette.transpose(0,2,1).reshape(-1,16).tolist(),vertices=len(m.bind))for name,m in models.items()if name in ['Torso','Limbs','Mesh005']},
        track=track)
    (out/'trajectory.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
    print(out/'trajectory.json',flush=True)
if __name__=='__main__':main()
