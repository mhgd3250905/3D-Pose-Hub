# training-human-v3 rig: arms to Drillis&Contini norms, thigh/shank lengthened, torso (pelvis->torso pivot) shortened by the
# same amount so shoulder/neck/head heights and stature stay unchanged. Shoulders and everything above them are unchanged.
import json,numpy as np,os
SRC='runtime/public/coach/coach-rig.json';OUT='runtime/public/coach-v3/coach-rig-v3.json'
K={'upperArm':0.3218/0.2563,'forearm':0.2526/0.2280,'thigh':1.161,'shin':1.017}
r=json.load(open(SRC));L={k:np.array(v) for k,v in r['landmarks'].items()}
dh=0.064                                  # hip raise = torso shortening (audit: thigh -17%, shank -4%)
pt=L['pelvis']-L['torso'];kt=(np.linalg.norm(pt)-dh)/np.linalg.norm(pt)
N=dict(L);N['pelvis']=L['torso']+pt*kt;dp=N['pelvis']-L['pelvis']
for s in('left','right'):
  N[s+'Elbow']=L[s+'Shoulder']+(L[s+'Elbow']-L[s+'Shoulder'])*K['upperArm']
  N[s+'Wrist']=N[s+'Elbow']+(L[s+'Wrist']-L[s+'Elbow'])*K['forearm']
  N[s+'Hip']=L[s+'Hip']+dp
  N[s+'Knee']=N[s+'Hip']+(L[s+'Knee']-L[s+'Hip'])*K['thigh']
  N[s+'Ankle']=N[s+'Knee']+(L[s+'Ankle']-L[s+'Knee'])*K['shin']
piv={'pelvis':'pelvis','torso':'torso','neck':'neck','head':'head'}
for s in('left','right'):piv.update({s+'Scapula':s+'Shoulder',s+'UpperArm':s+'Shoulder',s+'Forearm':s+'Elbow',s+'Hand':s+'Wrist',s+'Thigh':s+'Hip',s+'Patella':s+'Knee',s+'Shin':s+'Knee',s+'Foot':s+'Ankle'})
n=json.loads(json.dumps(r));n['landmarks']={k:v.round(7).tolist() for k,v in N.items()}
for b in n['bones']:
  o=np.array(b['pivot']);b['pivot']=(o+N[piv[b['name']]]-L[piv[b['name']]]).round(7).tolist()
n['notes']=r['notes']+' | training-human-v3: upper arm x%.3f, forearm x%.3f, thigh x%.3f, shank x%.3f, pelvis->torso x%.3f (hip +%.0f mm); shoulders/head/stature unchanged.'%(K['upperArm'],K['forearm'],K['thigh'],K['shin'],kt,dh*1000)
n['v3']={'segmentScale':K,'torsoScale':kt,'hipRaiseM':dh,'source':SRC}
os.makedirs(os.path.dirname(OUT),exist_ok=True);json.dump(n,open(OUT,'w'),indent=1)
for k in('leftShoulder','leftElbow','leftWrist','pelvis','leftHip','leftKnee','leftAnkle'):print(k,L[k].round(3),'->',N[k].round(3))
