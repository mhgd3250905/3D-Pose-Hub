import json,numpy as np,sys
from scipy.spatial.transform import Rotation as R
def ang(q):
    M=R.from_quat(q).as_matrix(); t=M@np.array([0,0,1.]); u=M@np.array([0,1,0.])
    pf=np.degrees(np.arctan2(-t[1],np.hypot(t[0],t[2])))   # + plantar (toes point down along shin), - dorsi
    yaw=np.degrees(np.arctan2(t[0],t[2]))
    y=np.array([0,1.]); yp=np.array([0,1,0.])-(t[1])*t; yp/=np.linalg.norm(yp)
    roll=np.degrees(np.arctan2(np.cross(yp,u)@t, yp@u))
    return pf,yaw,roll
def audit(path,lim=(35,55,35,30)):
    F=json.load(open(path))['frames']; out={}
    for s in ('left','right'):
        A=np.array([ang(fr['q'][s+'Foot']) for fr in F]); out[s]=A
    return F,out
if __name__=='__main__':
    F,o=audit(sys.argv[1])
    for s,A in o.items():
        bad=np.where((A[:,0]<-52)|(A[:,0]>60)|(np.abs(A[:,1])>35)|(np.abs(A[:,2])>30))[0]
        segs=[];st=None
        for i in bad:
            if st is None or i!=pv+1:
                if st is not None: segs.append((st,pv))
                st=i
            pv=i
        if st is not None: segs.append((st,pv))
        print(s,'frames flagged',len(bad))
        for a,b in segs: print('  %d-%d'%(a,b),'pf',A[a:b+1,0].min().round(),A[a:b+1,0].max().round(),'yaw',np.abs(A[a:b+1,1]).max().round(),'roll',A[a:b+1,2].min().round(),A[a:b+1,2].max().round())
        # speed of roll
        d=np.abs(np.diff(A[:,2])); d=np.minimum(d,360-d); print('  max roll jump/frame',d.max().round(1),'at',d.argmax())
