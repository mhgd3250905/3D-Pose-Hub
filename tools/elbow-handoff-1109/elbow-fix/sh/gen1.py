import json,os
R='/workspace/work/elbow-scan-wt/drill-anim/specs/'
V='/workspace/work/elbow-fix/sh/var/'
def mk(name,base,body):
    f=V+name+'.mjs'
    open(f,'w').write(f"import b from 'file://{R}{base}';\nimport {{fixSide,rollHand}} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';\nconst s=structuredClone(b);\n{body}\nexport default s;\n")
    return {'name':name.split('__')[1],'file':f}
jobs=[]
# forearms-A: static humerus roll toward anatomical (pit forward/medial), time-varying stays at elbow (c=0)
v=[]
for ae in [30,45,60,90]:
  for b in [-90,-45,0,45,90]:
    v.append(mk(f'forearms-A__fa_e{ae}_b{b}','forearms-A-r2-gc1-ht2.js',f"fixSide(s,'left',{-ae},{b},0);fixSide(s,'right',{ae},{-b},0);"))
jobs.append({'id':'forearms-A','variants':v})
# face pull: keep humerus (pit medial, a=0), roll palms
v=[]
for th in [90,-90,180]:
  for ai in [0,20]:
    v.append(mk(f'h-band-face-pull__fp_h{th}_i{ai}','h-band-face-pull-rr1-kn1.js',f"rollHand(s,'left',{th});rollHand(s,'right',{-th});fixSide(s,'left',{ai},0,0);fixSide(s,'right',{-ai},0,0);"))
jobs.append({'id':'h-band-face-pull','variants':v})
# leg-out right arm: pit up as before; roll the fist and/or undo et1 elbowTwist (-100)
v=[]
for th in [-90,-45,45,90]:
  for b in [0,100]:
    v.append(mk(f'h-band-leg-out__lo_h{th}_b{b}','h-band-leg-out-et1-fa1.js',f"rollHand(s,'right',{th});fixSide(s,'right',0,{b},0);"))
jobs.append({'id':'h-band-leg-out','variants':v})
json.dump(jobs,open('jobs-s1.json','w'),indent=0)
print(sum(len(j['variants']) for j in jobs))
# bridge march: arms straight on the floor beside the body (~20 deg from trunk), palms down, fingers toward the feet
v=[]
import math
for ang in [20]:
  dx=0.469*math.cos(math.radians(ang)); dz=0.469*math.sin(math.radians(ang))
  x=round(-0.4073+dx,3); z=round(0.1879+dz,3); fz=round(math.tan(math.radians(ang)),3)
  for ai in [0,30,60]:
    for b in [-90,-45,0,45,90]:
      body=f"""s.id='h-bridge-march-arms';
for (const [side,sg] of [['left',-1],['right',1]]){{const h=s.pose.base.hands[side];
  h.mode='floor';h.at=[{x},sg*{z}];h.finger=[1,sg*{fz}];h.poleUp=[0,-1,sg*0.3];delete h.elbowTwist;delete h.upperArmTwist;}}
fixSide(s,'left',{ai},{b},0);fixSide(s,'right',{-ai},{-b},0);"""
      v.append(mk(f'h-bridge-march__bm_a{ang}_i{ai}_b{b}','h-bridge-march-et1.js',body))
jobs.append({'id':'h-bridge-march','variants':v})
json.dump(jobs,open('jobs-s1.json','w'),indent=0)
print(sum(len(j['variants']) for j in jobs))
