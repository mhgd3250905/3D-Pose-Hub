# Hand-local FK of the finger rigs (old v2plus-hands vs native r3): contact-feature deltas per named pose, no rendering.
import json,sys,numpy as np
R='./drill-anim/models/'
def qm(q):
  x,y,z,w=q;return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def fk(rig,pose):
  P=rig['poses'][pose];out={}
  for f,d in rig['fingers'].items():
    J=[np.array(j) for j in d['joints']];M=np.eye(3);pts=[J[0]];o=J[0]
    for k in range(3):
      M=M@qm(P.get(f'{f}{k+1}',[0,0,0,1]));o=pts[-1]+M@(J[k+1]-J[k]);pts.append(o)
    out[f]=np.array(pts)
  return out
def feats(rig,pose):
  F=fk(rig,pose);pal=np.array(rig.get('palmar',[0,-1,0]))
  base=np.mean([F[f][0] for f in['index','middle','ring','pinky']],0);palm=(base+np.zeros(3))/2
  allp=np.vstack(list(F.values()))
  return dict(palm=palm,low=max(allp@pal),tip=np.mean([F[f][3] for f in['index','middle']],0),fist=np.mean(np.vstack([F[f][1:] for f in['index','middle','ring','pinky']]),0))
old=json.load(open(R+'training-human-v2plus-hands.json'));new=json.load(open(R+'hands-native-r3/hands-rig.json'))
grip=json.loads(json.dumps(new));grip['poses']['grip-bar']=json.load(open(R+'grip-native-r1/fit.json'))['targets']
res={}
for pose in['relaxed','open','palm-floor','grip-bar','band-grip']:
  a,b=feats(old,pose),feats(new,pose)
  res[pose]=dict(palm_mm=float(np.linalg.norm(a['palm']-b['palm'])*1000),palmarDepth_mm=float((b['low']-a['low'])*1000),tip_mm=float(np.linalg.norm(a['tip']-b['tip'])*1000),fist_mm=float(np.linalg.norm(a['fist']-b['fist'])*1000))
g=feats(grip,'grip-bar');res['grip-bar-native-fit']=dict(fist_mm=float(np.linalg.norm(feats(old,'grip-bar')['fist']-g['fist'])*1000))
json.dump(res,open('docs/native-hands-handoff/hand-deltas.json','w'),indent=1);print(json.dumps(res,indent=1))
