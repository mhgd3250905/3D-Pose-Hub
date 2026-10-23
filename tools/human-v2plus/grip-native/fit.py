import sys,json,copy,argparse,hashlib
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation as R
repo=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(repo/'tools/human-v2plus/hands-native'))
from check import decode,audit
parser=argparse.ArgumentParser(description='Fit the complete native hand to a fixed 32 mm rod; preserve all vertices and triangles.')
parser.add_argument('--rest',type=Path,required=True,help='Actual original model rest bones {bones: {leftHand: {p,q}}}')
parser.add_argument('--out',type=Path,required=True,help='New output directory')
args=parser.parse_args()
root=args.out
if root.exists(): raise SystemExit('Output exists; choose a new revision directory')
root.mkdir(parents=True)
asset_file=repo/'drill-anim/models/hands-native-r3/hands-base.json'
rig_file=repo/'drill-anim/models/hands-native-r3/hands-rig.json'
d=json.loads(asset_file.read_bytes())
rig=json.loads(rig_file.read_bytes())
rest=json.loads(args.rest.read_bytes())
p,f,w,j=decode(d);keep=p[:,0]>0;ids=np.where(keep)[0]; ww=w[keep];jj=j[keep]; names=d['bones'];h=rest['bones']['leftHand']; ph=np.c_[R.from_quat(h['q']).inv().apply(p[keep]-np.array(h['p'])),np.ones(len(ids))]
dominant=np.array(names)[jj[np.arange(len(jj)),ww.argmax(1)]]
groups={fn:np.where(dominant=='v2p_L_'+fn+'3')[0] for fn in ['thumb','index','middle','ring','pinky']}
for fn,indices in groups.items():
 a,b=np.array(rig['fingers'][fn]['joints'][2:]);direction=b-a
 groups[fn]=indices[((ph[indices,:3]-a)@direction)/(direction@direction)>.55]
groups['palm']=np.where((dominant=='leftHand')&(ph[:,0]>.045))[0]
def pose(x,targets=False):
 matrices=np.tile(np.eye(4),(len(names),1,1));qs={}
 for fi,fn in enumerate(['thumb','index','middle','ring','pinky']):
  parent=np.eye(4);last=np.zeros(3)
  for k in range(3):
   at=np.array(rig['fingers'][fn]['joints'][k]);local=np.eye(4);local[:3,3]=at-last
   if fn=='thumb':
    rot=R.from_euler('xyz',x[12:15],degrees=True) if k==0 else R.from_rotvec(np.array(rig['fingers'][fn]['flexAxis'])*np.deg2rad(x[14+k]))
   else:rot=R.from_euler('z',-x[(fi-1)*3+k],degrees=True)
   local[:3,:3]=rot.as_matrix();qs[fn+str(k+1)]=rot.as_quat().tolist();parent=parent@local
   inv=np.eye(4);inv[:3,3]=-at;matrices[names.index('v2p_L_'+fn+str(k+1))]=parent@inv;last=at
 out=sum(np.einsum('nij,nj->ni',matrices[jj[:,k]],ph)*ww[:,k,None] for k in range(4))[:,:3]
 return (out,qs) if targets else out
start=np.array([20,65,35]*4+[0,-15,20,0,15]+[.096,-.023,-.32,-.40])
def residual(x):
 pos=pose(x);c=np.array([x[17],x[18],.03]);axis=np.array([x[19],x[20],1]);axis/=np.linalg.norm(axis)
 dv=pos-c;dist=np.linalg.norm(dv-np.outer(dv@axis,axis),axis=1)
 # Strongly penalize all surface penetration, then seek distributed contact.
 penetration=np.minimum(dist-.0163,0)*5000
 contact=np.array([np.mean(np.sort(np.abs(dist[g]-.0165))[:35]) for g in groups.values()])*650
 regular=(x[:12]-start[:12])*.001
 return np.r_[penetration,contact,regular]
lo=[5,35,10]*4+[-25,-25,-10,-30,-30]+[.07,-.055,-.8,-.8]
hi=[29,110,80]*4+[25,25,22,65,65]+[.13,.005,.5,.5]
result=least_squares(residual,start,bounds=(lo,hi),max_nfev=160,ftol=1e-7,xtol=1e-7,gtol=1e-7,diff_step=1e-4)
pos,targets=pose(result.x,True);world=p.copy();world[ids]=R.from_quat(h['q']).apply(pos)+np.array(h['p']);qa=audit(world,f,{'left':np.where((p[f,0]>0).all(1))[0]})
x=result.x;c=np.array([x[17],x[18],.03]);axis=np.array([x[19],x[20],1]);axis/=np.linalg.norm(axis);dv=pos-c;dist=np.linalg.norm(dv-np.outer(dv@axis,axis),axis=1)
report={'parameters':x.tolist(),'targets':targets,'center':c.tolist(),'axis':axis.tolist(),'cost':result.cost,'evaluations':result.nfev,'worstPenetrationM':float(max(0,.016-dist.min())),'contact':{fn:float(np.min(dist[g])-.016) for fn,g in groups.items()},'qa':qa}
report['sourceSha256']={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [asset_file,rig_file,args.rest]}
report['limitations']='Static strict non-adjacent noncoplanar triangle witnesses only; actual moving wrists, full-body contacts and visual grip must be checked separately.'
(root/'fit.json').write_text(json.dumps(report,indent=2),encoding='utf8');np.savez(root/'posed-left-hand.npz',p=pos,faces=f,ids=ids)
print({k:v for k,v in report.items() if k not in ['targets','qa']});print('self',qa['left']['pairs'])
