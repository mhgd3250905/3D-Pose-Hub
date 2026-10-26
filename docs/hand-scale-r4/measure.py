import json,base64,numpy as np,sys
M='./drill-anim/models/'
def load(f):
  d=json.load(open(M+f));p=d['pos'];q=np.frombuffer(base64.b64decode(p['u16']),np.uint16).reshape(-1,3).astype(float)
  X=np.array(p['lo'])+q*np.array(p['scale']);J=np.frombuffer(base64.b64decode(d['joints']['u8']),np.uint8).reshape(-1,4);W=np.frombuffer(base64.b64decode(d['weights']['u8']),np.uint8).reshape(-1,4)
  dom=np.array(d['bones'])[J[np.arange(len(J)),W.argmax(1)]];return d,X,dom
WX=0.6703302;WC=np.array([0.6703302,1.3301086,-0.0090141])
def hull_perim(P):
  from math import atan2
  P=sorted(map(tuple,P));
  def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
  lo=[];up=[]
  for p in P:
    while len(lo)>=2 and cross(lo[-2],lo[-1],p)<=0:lo.pop()
    lo.append(p)
  for p in reversed(P):
    while len(up)>=2 and cross(up[-2],up[-1],p)<=0:up.pop()
    up.append(p)
  h=np.array(lo[:-1]+up[:-1]);return float(np.sum(np.linalg.norm(h-np.roll(h,1,0),axis=1)))
def sect(X,x0,w=0.004):
  S=X[np.abs(X[:,0]-x0)<w][:,1:];
  if len(S)<5:return None
  return dict(n=len(S),perim_mm=round(hull_perim(S)*1000,1),width_z_mm=round(np.ptp(S[:,1])*1000,1),thick_y_mm=round(np.ptp(S[:,0])*1000,1))
out={}
for name,f in [('old_v2plus_base','training-human-v2plus-hands-base.json'),('native_r3','hands-native-r3/hands-base.json')]:
  d,X,dom=load(f);L=X[(X[:,0]>0.55)&np.isin(dom,['leftHand']+[b for b in d['bones'] if b.startswith('v2p_L_')])]
  hl=L[:,0].max()-WX
  r=dict(verts=len(L),handLen_mm=round(hl*1000,1),minX_mm=round((L[:,0].min()-WX)*1000,1))
  # palm: metacarpal band 35-45% of hand length, excluding thumb (z>?) -> use all
  r['palm@40%']=sect(L,WX+0.40*hl);r['wrist@0']=sect(L,WX+0.002);r['wrist@+10mm']=sect(L,WX+0.010)
  out[name]=r
d,X,dom=load('training-human-v2plus-limbs-base.json');F=X[(X[:,0]>0.5)&(dom=='leftForearm')]
out['forearm']={'maxX_mm':round((F[:,0].max()-WX)*1000,1),'@-10mm':sect(F,WX-0.010),'@-25mm':sect(F,WX-0.025),'@-40mm':sect(F,WX-0.040)}
ys=[]
for f in ['training-human-v2plus-head-base.json','training-human-v2plus-torso-base.json','training-human-v2plus-limbs-base.json']:
  try:ys.append(load(f)[1][:,1])
  except Exception as e:print(f,e)
Y=np.concatenate(ys);out['height_m']=round(float(Y.max()-Y.min()),4);out['yMin']=round(float(Y.min()),4)
print(json.dumps(out,indent=1,ensure_ascii=False));json.dump(out,open('docs/hand-scale-r4/measure.json','w'),indent=1)
