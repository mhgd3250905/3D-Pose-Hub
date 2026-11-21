import json,csv,numpy as np
P='/workspace/work/airflare/precision/'
F0,F1=10118,10273; FR=list(range(F0,F1+1)); N=len(FR)
fx=2202.91; cx,cy=960.,540.
def kp2d():
    K=np.zeros((N,133,2)); C=np.zeros((N,133)); Q=[];SIDE=[]
    for i,f in enumerate(FR):
        a=json.load(open(P+f'kp2d/{f}.json')); SIDE.append((a['side_assignment'],a['side_review']))
        for k in a['keypoints']:
            j=k['id']; 
            if j>=133: continue
            x,y=k['x'],k['y']
            if x is None: C[i,j]=0; continue
            K[i,j]=(x,y); C[i,j]=k['confidence']
        Q.append(a)
    return K,C,SIDE,Q
def drift():
    M={}
    for r in csv.DictReader(open(P+'labels/background_tracking.csv')):
        f=int(r['frame']); M[f]=np.array([[float(r['frame_to_ref_00']),float(r['frame_to_ref_01']),float(r['frame_to_ref_02'])],[float(r['frame_to_ref_10']),float(r['frame_to_ref_11']),float(r['frame_to_ref_12'])]])
    return np.array([M[f] for f in FR])
def kp3d():
    C=np.zeros((N,24,3)); W=np.zeros((N,24,3)); D=[]
    for i,f in enumerate(FR):
        a=json.load(open(P+f'kp3d/{f}.json')); C[i]=a['camera_xyz_model_m']; W[i]=a['world_xyz_model_m']; D.append(a)
    return C,W,D
