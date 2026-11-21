import json,numpy as np,sys
from fkj import *
n=json.load(open(sys.argv[1]))['frames']
def seg(p,q,x):
    d=q-p;t=np.clip((x-p)@d/(d@d),0,1);return np.linalg.norm(p+t*d-x),t
for f in range(int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4])):
    W,P=fk(n[f]);row=[]
    for h in ('rightHand','leftHand'):
        fa=h.replace('Hand','Forearm')
        pts={'wr':P[h],'mid':(P[h]+P[fa])/2,'el':P[fa],'fing':P[h]+W[h]@np.array([0,-0.09,0])}
        best=min((seg(P[t],P[t.replace('Thigh','Shin')],x)[0],t,k) for t in ('leftThigh','rightThigh') for k,x in pts.items())
        row.append((h[:1],round(best[0],3),best[1][:1],best[2]))
    print(f,row)
