import json, numpy as np, sys
sys.path.insert(0,'/workspace/work/b2000/r21/fit')
from scipy.spatial.transform import Rotation as Rot
REST='/workspace/work/b2000-rest.json'
LP={k:np.array(v['lp'],float) for k,v in json.load(open(REST))['out'].items()}
PAR={'spineLower':'pelvis','spineUpper':'spineLower','torso':'spineUpper','neck':'torso','head':'neck','leftScapula':'torso','leftUpperArm':'leftScapula','leftForearm':'leftUpperArm','leftHand':'leftForearm','rightScapula':'torso','rightUpperArm':'rightScapula','rightForearm':'rightUpperArm','rightHand':'rightForearm','leftThigh':'pelvis','leftShin':'leftThigh','leftFoot':'leftShin','rightThigh':'pelvis','rightShin':'rightThigh','rightFoot':'rightShin'}
J=['pelvis','spineLower','spineUpper','torso','neck','head','leftScapula','leftUpperArm','leftForearm','leftHand','rightScapula','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','leftFoot','rightThigh','rightShin','rightFoot']
def Q(q): return Rot.from_quat(q).as_matrix()
def fk(fr):
    W={'pelvis':Q(fr['q']['pelvis'])};P={'pelvis':np.array(fr['p'])}
    for b in J[1:]:
        p=PAR[b];P[b]=P[p]+W[p]@LP[b];W[b]=W[p]@Q(fr['q'][b])
    return W,P
def elbow(W,P,sd='left'):
    u=P[sd+'Forearm']-P[sd+'UpperArm'];f=P[sd+'Hand']-P[sd+'Forearm']
    return np.degrees(np.arccos(np.clip(u@f/np.linalg.norm(u)/np.linalg.norm(f),-1,1)))
