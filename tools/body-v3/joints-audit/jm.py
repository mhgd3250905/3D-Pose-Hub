exec(open('/workspace/body-v3/ja.py').read())
import json
R={}
S={s:load(s) for s in['rest','squat','plank','fold','neckflex','neckext','neckrot']}
for s,(M,B) in S.items():
  r={}
  r['gap Mesh001(neck) bottom->torso']=gap(M,'Mesh001','V2P_Base_Torso',1.3,1.47)
  r['gap torso top->Mesh001']=gap(M,'V2P_Base_Torso','Mesh001',1.3,1.5)
  r['gap head opening->Mesh001']=gap(M,'Toon_Mannequin_Head_v5','Mesh001')
  r['gap limbs ankle->Coach_Body']=gap(M,'V2P_Base_Limbs','Coach_Body',-9,0.3)
  r['pen Mesh001 into torso']=pen(M,'Mesh001','V2P_Base_Torso')
  r['pen head into torso']=pen(M,'Toon_Mannequin_Head_v5','V2P_Base_Torso')
  r['pen shoe inside shin (shin pokes through shoe)']=pen(M,'Coach_Sneakers','V2P_Base_Limbs',excl=0.0)
  r['pen shoe inside foot (foot pokes through shoe)']=pen(M,'Coach_Sneakers','Coach_Body',excl=0.0)
  R[s]=r
M0,B0=S['rest']
for s in['squat','plank','fold','neckflex','neckext','neckrot']:
  M1,B1=S[s]
  R[s]['collapse knee']=collapse(M0,B0,M1,B1,'V2P_Base_Limbs',[('leftThigh','leftShin'),('leftShin','leftFoot')],'leftShin')
  R[s]['collapse ankle']=collapse(M0,B0,M1,B1,'V2P_Base_Limbs',[('leftShin','leftFoot')],'leftFoot',0.12)
  R[s]['collapse elbow']=collapse(M0,B0,M1,B1,'V2P_Base_Limbs',[('leftUpperArm','leftForearm'),('leftForearm','leftHand')],'leftForearm')
  R[s]['collapse neck(Mesh001)']=collapse(M0,B0,M1,B1,'Mesh001',[('neck','head')],'neck',0.09)
  R[s]['collapse hip']=collapse(M0,B0,M1,B1,'V2P_Base_Torso',[('pelvis','leftThigh'),('leftThigh','leftShin')],'leftThigh',0.08)
  R[s]['collapse shoulder']=collapse(M0,B0,M1,B1,'V2P_Base_Torso',[('torso','leftUpperArm'),('leftUpperArm','leftForearm')],'leftUpperArm',0.08)
M,B=S['rest']
R['rest']['profile knee']=profile(M,'V2P_Base_Limbs','leftThigh','leftShin',B)
R['rest']['profile elbow']=profile(M,'V2P_Base_Limbs','leftUpperArm','leftForearm',B)
pass
R['rest']['profile neck(Mesh001)']=profile(M,'Mesh001','neck','head',B,ext=0.06)
json.dump(R,open('/workspace/body-v3/joints-metrics.json','w'),indent=1)
for s,r in R.items():
  print('==',s)
  for k,v in r.items():print(' ',k,v)
