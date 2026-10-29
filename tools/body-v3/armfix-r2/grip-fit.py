"""Fit c1r2 handScale1 against a 32mm rod using actual exported skinned surface.
Reuses the repository grip-native fitting design; no mesh/rig source is modified.
"""
import argparse,json
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation as R
ap=argparse.ArgumentParser();ap.add_argument('input',type=Path);ap.add_argument('output',type=Path);args=ap.parse_args()
if args.output.exists():raise SystemExit('Use a new output file')
d=json.loads(args.input.read_bytes());mesh=d['mesh'];cur=d['current']['left'];rig=d['rig']['fingers'];fns=['thumb','index','middle','ring','pinky']
ids=np.array(cur['vertexGroups']['all']);pos=np.array(mesh['positionsWorld']).reshape(-1,3)[ids];inv=np.array(cur['handInverseWorld']).reshape(4,4).T;ph=np.c_[pos,np.ones(len(pos))]@inv.T
si=np.array(mesh['skinIndex']).reshape(-1,4)[ids];sw=np.array(mesh['skinWeight']).reshape(-1,4)[ids];names=[b['name'] for b in mesh['bones']];ix={n:i for i,n in enumerate(names)}
lookup={int(v):i for i,v in enumerate(ids)};groups={f:np.array([lookup[i] for i in cur['vertexGroups']['distal'][f]]) for f in fns};groups['palm']=np.array([lookup[i] for i in cur['vertexGroups']['palm']])
if any(len(g)<5 for g in groups.values()):raise SystemExit('Insufficient measured contact vertices')
def pose(x,targets=False):
 mats=np.tile(np.eye(4),(len(names),1,1));qs={}
 for fi,fn in enumerate(fns):
  parent=np.eye(4);last=np.zeros(3)
  for k in range(3):
   at=np.array(rig[fn]['joints'][k]);local=np.eye(4);local[:3,3]=at-last
   rot=R.from_euler('xyz',x[12:15],degrees=True) if fn=='thumb' and k==0 else R.from_rotvec(np.array(rig[fn]['flexAxis'])*np.deg2rad(x[14+k] if fn=='thumb' else x[(fi-1)*3+k]))
   local[:3,:3]=rot.as_matrix();qs[fn+str(k+1)]=rot.as_quat().tolist();parent=parent@local;ib=np.eye(4);ib[:3,3]=-at;mats[ix['v2p_L_'+fn+str(k+1)]]=parent@ib;last=at
 out=sum(np.einsum('nij,nj->ni',mats[si[:,k]],ph)*sw[:,k,None] for k in range(4))[:,:3]
 return (out,qs) if targets else out
# Confirm identity FK reproduces exported native surface before fitting.
identity=np.max(np.abs(pose(np.zeros(22))-ph[:,:3]));assert identity<1e-7,identity
start=np.array([45,85,55]*4+[15,-20,35,35,35]+[.09,-.028,.005,0,0],float)
lo=[10,30,5]*4+[-80,-80,-80,-20,-20]+[.055,-.065,-.035,-.8,-.8]
hi=[95,115,100]*4+[80,80,100,90,90]+[.12,.015,.045,.8,.8]
def distances(x):
 out=pose(x);c=x[17:20];axis=np.array([x[20],x[21],1]);axis/=np.linalg.norm(axis);dv=out-c;return np.linalg.norm(dv-np.outer(dv@axis,axis),axis=1)
def residual(x):
 dist=distances(x);pen=np.minimum(dist-.01615,0)*5000
 contact=np.array([np.mean(np.sort(np.abs(dist[g]-.0165))[:min(25,len(g))]) for g in groups.values()])*950
 regular=(x[:12]-start[:12])*.0005
 return np.r_[pen,contact,regular]
result=least_squares(residual,start,bounds=(lo,hi),max_nfev=220,ftol=1e-8,xtol=1e-8,gtol=1e-8,diff_step=1e-4)
x=result.x;out,qs=pose(x,True);dist=distances(x);axis=np.array([x[20],x[21],1]);axis/=np.linalg.norm(axis)
report={'format':'pose-hub-armfix-power-grip@1','handScale':1,'radius':.016,'targets':qs,'center':x[17:20].tolist(),'axis':axis.tolist(),'parameters':x.tolist(),'evaluations':result.nfev,'cost':result.cost,'identityMaxM':float(identity),'worstPenetrationM':float(max(0,.016-dist.min())),'contact':{f:{'minimumGapM':float(dist[g].min()-.016),'closest25MeanGapM':float(np.mean(np.sort(abs(dist[g]-.016))[:25]))} for f,g in groups.items()},'limitations':['Static rod fit only; self-collision, actual props and moving hands require separate validation.']}
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'human-v2plus/hands-native'))
from check import audit
faces=np.array(mesh['index']).reshape(-1,3);world=np.array(mesh['positionsWorld']).reshape(-1,3);hand=np.linalg.inv(inv);world[ids]=(np.c_[out,np.ones(len(out))]@hand.T)[:,:3];leftFaces=np.where(np.isin(faces,ids).all(1))[0]
report['selfIntersection']=audit(world,faces,{'left':leftFaces})
args.output.write_bytes((json.dumps(report,indent=2)+'\n').encode());print(json.dumps({k:v for k,v in report.items() if k not in ['targets','parameters']},indent=2))
