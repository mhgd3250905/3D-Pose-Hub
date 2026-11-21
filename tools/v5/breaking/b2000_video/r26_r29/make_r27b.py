# r27b = r27 + hand carried with the forearm by swing only (no twist) toward the planted orientation:
# fingers keep the landing direction from ~f372, so no last-moment wrist turn.
import json, copy, numpy as np, sys
sys.path.insert(0,'/workspace/work/b2000/r22')
from fkj import *
from scipy.spatial.transform import Rotation as Rot, Slerp
a=json.load(open('anim-2000-r27.json')); F=a['frames']; G=copy.deepcopy(F)
def sm(x): x=np.clip(x,0,1); return x*x*(3-2*x)
def rotv(u,v):
    u=u/np.linalg.norm(u); v=v/np.linalg.norm(v); c=np.cross(u,v); s=np.linalg.norm(c)
    return np.eye(3) if s<1e-9 else Rot.from_rotvec(c/s*np.arctan2(s,u@v)).as_matrix()
W4,P4=fk(F[404]); R7=W4['rightHand']; fa4=P4['rightHand']-P4['rightForearm']
B0,B1=354,374; L4=W4['rightForearm'].T@R7; ROLL=[]
for f in range(B0,404):
    W,P=fk(F[f]); fa=P['rightHand']-P['rightForearm']
    Rc=rotv(fa4,fa)@R7                     # planted hand pose carried by the forearm swing, no twist
    # roll the forearm (pronation/supination) so the planted wrist angle gives that carried hand pose
    ax=fa/np.linalg.norm(fa); best=(1e9,0)
    for th in np.radians(np.arange(-90,90.5,0.5)):
        Wf=Rot.from_rotvec(ax*th).as_matrix()@W['rightForearm']
        e=np.degrees(Rot.from_matrix(Rc.T@Wf@L4).magnitude()); best=min(best,(e,th))
    th=best[1]*sm((f-B0)/(B1-B0)); ROLL.append(np.degrees(th))
    Wf=Rot.from_rotvec(ax*th).as_matrix()@W['rightForearm']
    ql=Slerp([0,1],Rot.from_matrix([W['rightForearm'].T@W['rightHand'],L4]))(sm((f-B0)/(B1-B0))).as_matrix()
    G[f]['q']['rightForearm']=list(np.round(Rot.from_matrix(W['rightUpperArm'].T@Wf).as_quat(),6))
    G[f]['q']['rightHand']=list(np.round(Rot.from_matrix(ql).as_quat(),6))
print('roll',np.round(ROLL[::4],0))
a['frames']=G; a['name']=a['name'].replace('r27','r27b')
a['source']+='; r27b: right palm keeps landing direction from f374 (no late wrist turn)'
json.dump(a,open('anim-2000-r27b.json','w'),ensure_ascii=False,separators=(',',':'))
