#!/usr/bin/env python3
"""Summarize ground-penetration-audit results.jsonl -> summary JSON + markdown table.
usage: summarize.py <results.jsonl> <summary.json>
Penetration: region min vertex height < -5 mm (floor plane y=0).
Hover reference: a region whose joint is a declared ground contact (spec shadow.blobs) but never comes
within 15 mm of the floor over the sampled cycle.
Thickness t = joint-centre height - lowest region vertex at the deepest frame (knee/elbow), used for root-cause split.
"""
import json, sys
PEN, HOV = -0.005, 0.015
REG = ['leftKnee','rightKnee','leftElbow','rightElbow','leftForearm','rightForearm','leftShin','rightShin','leftThigh','rightThigh',
       'leftUpperArm','rightUpperArm','leftHand','rightHand','leftFoot','rightFoot','torso','head']
BLOB2REG = {'Knee':'Knee','Elbow':'Elbow','Palm':'Hand','Wrist':'Hand','Toe':'Foot','Heel':'Foot','Ankle':'Foot'}
JOINT = {'Knee':'Knee','Elbow':'Elbow','Shin':'Knee','Forearm':'Elbow'}
def segs(fr):
    if not fr: return []
    out=[[fr[0][0],fr[0][0]]]
    for f,_ in fr[1:]:
        if f-out[-1][1] <= fr_step*1.01: out[-1][1]=f
        else: out.append([f,f])
    return [f"{a}-{b}" if a!=b else f"{a}" for a,b in out]
import math, os
MATS={m['id']:m['mats'] for m in json.load(open(sys.argv[3]))} if len(sys.argv)>3 and os.path.exists(sys.argv[3]) else {}
def inmat(pt,m):
    at=m.get('at') or [0,0,0]; L,W,H=(m.get('size') or [1.83,0.61,0.006]); a=math.radians(m.get('yaw',0) or 0)
    dx,dz=pt[0]-at[0],pt[2]-at[2]; lx=dx*math.cos(a)-dz*math.sin(a); lz=dx*math.sin(a)+dz*math.cos(a)
    return abs(lx)<=L/2 and abs(lz)<=W/2
rows=[]; hovers=[]; matrows=[]
for line in open(sys.argv[1]):
    r=json.loads(line); global fr_step; fr_step=r['stride']; F=r['frames']
    for reg in REG:
        vals=[(f['f'],f['regions'][reg]['minY'],f) for f in F if reg in f['regions']]
        if not vals: continue
        f0,y0,fd=min(vals,key=lambda x:x[1])
        if y0 < PEN:
            side='left' if reg.startswith('left') else 'right'; part=reg[len(side):] if reg[:4] in ('left','righ') else reg
            jn=JOINT.get(part); jh=fd['joints'].get(side+jn) if jn else None
            rows.append({'id':r['id'],'region':reg,'depthMm':round(-y0*1000,1),'frame':f0,'loopFrames':r['loopFrames'],
                         'framesBelow5mm':segs([(f,y) for f,y,_ in vals if y<PEN]),'jointCentreYmm':None if jh is None else round(jh*1000,1),
                         'jointToLowestVertexMm':None if jh is None else round((jh-y0)*1000,1),'at':fd['regions'][reg].get('at'),'mesh':fd['regions'][reg].get('mesh')})
    for m in MATS.get(r['id'],[]):
        top=(m.get('at') or [0,0,0])[1]
        if top<=0.001: continue
        worst=None
        for f in F:
            for reg,v in f['regions'].items():
                if reg=='all' or not v.get('at'): continue
                if inmat(v['at'],m):
                    c=v['minY']-top
                    if worst is None or c<worst[0]: worst=(c,reg,f['f'])
        matrows.append({'id':r['id'],'matTopMm':round(top*1000,1),'size':m.get('size'),'lowestRegionOnMat':None if worst is None else worst[1],
                        'clearanceToMatTopMm':None if worst is None else round(worst[0]*1000,1),'frame':None if worst is None else worst[2]})
    for j in set(r.get('shadowBlobJoints',[])):
        for k,v in BLOB2REG.items():
            if j.endswith(k):
                side='left' if j.startswith('left') else 'right'; reg=side+v
                vals=[(f['f'],f['regions'][reg]['minY']) for f in F if reg in f['regions']]
                if vals:
                    m=min(y for _,y in vals)
                    if m>HOV: hovers.append({'id':r['id'],'joint':j,'region':reg,'closestMm':round(m*1000,1)})
rows.sort(key=lambda x:-x['depthMm'])
done=[json.loads(l)['id'] for l in open(sys.argv[1])]
summary={'thresholds':{'penetrationMm':5,'hoverMm':15},'floor':'y=0 world plane (engine.js); no 3-D mat; props not counted',
         'audited':done,'penetratingActions':sorted(set(x['id'] for x in rows)),'penetrations':rows,'hoverReference':hovers,'raisedMatProps':matrows,
         'notes':['clearance = CPU-skinned drawn-vertex height (SkinnedMesh.getVertexPosition) after onAfterRender of a real 128px render; GPU-only displacement (chest breath <=1.8mm outward, cloth sink inward) not included','raised-mat check uses only each region\'s lowest vertex position (approximate)']}
json.dump(summary,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
print(len(done),'audited;',len(summary['penetratingActions']),'actions >5mm')
for x in rows[:40]: print(x['id'],x['region'],x['depthMm'],'f',x['frame'],x['framesBelow5mm'],'jY',x['jointCentreYmm'],'t',x['jointToLowestVertexMm'],x['mesh'])
print('raised mats:'); [print(m) for m in matrows]
print('hover:'); [print(h) for h in hovers]
