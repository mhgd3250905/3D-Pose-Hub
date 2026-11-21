import json,numpy as np,sys
from fkj import *
a=json.load(open('anim-2000-r22d.json'));F=a['frames']
PR=LP['pelvis']; print('pelvisRest',PR)
def code_frame(o):
    q={j:[0,0,0,1] for j in J}; q.update(o['q']); return {'q':q,'p':list(PR+np.array(o['p']))}
def ang(q1,q2):
    d=abs(np.dot(np.array(q1)/np.linalg.norm(q1),np.array(q2)/np.linalg.norm(q2)));return np.degrees(2*np.arccos(min(1,d)))
for fn in sys.argv[1:]:
    o=json.load(open(fn));f=o['f'];cf=code_frame(o);af=F[f]
    print(fn,'f',f,'missing',[j for j in J if j not in o['q']],'dp',np.round(np.array(cf['p'])-af['p'],3))
    print(' changed:',{j:round(ang(cf['q'][j],af['q'][j]),1) for j in J if ang(cf['q'][j],af['q'][j])>1})
    W1,P1=fk(cf);W0,P0=fk(af)
    for b in ['rightHand','leftHand','rightFoot','leftFoot']:
        print(' ',b,'anim',np.round(P0[b],3),'code',np.round(P1[b],3))
