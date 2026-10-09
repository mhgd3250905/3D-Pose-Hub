# python3 lib/qa.py <frame dir> <spec.json> <out metrics.json> [comp dir]
# Auto QA over every rendered frame: floor penetration, pinned-contact drift, straight-limb angles, joint limits, capsule self-clip,
# solver warnings, figure touching the frame edge.
import json,sys,glob,numpy as np
D,SP,OUTF=sys.argv[1:4];CD=sys.argv[4] if len(sys.argv)>4 else None
spec=json.load(open(SP));q=spec.get('qa',{})
R=[];[R.extend(json.load(open(f))) for f in glob.glob(D+'/met-*.json')]
fr=sorted([r for r in R if r['f']>=0],key=lambda r:r['f'])
def get(r,path):
    v=r
    for k in path.split('.'):v=v[k]
    return v
def when(r,w):
    if w in (None,'always'):return True
    if w.startswith('locked.'):return bool(r['locked'][w.split('.')[1]])
    if w.startswith('params.'):  # params.name<0.01 / >0.99
        import re;m=re.match(r'params\.(\w+)\s*([<>])\s*([\d.]+)',w);v=r['params'].get(m.group(1),0);return v<float(m.group(3)) if m.group(2)=='<' else v>float(m.group(3))
    return True
res={'id':spec['id'],'frames':len(fr),'fps':spec.get('fps',30),'duration_s':spec['timeline']['duration']}
FLOOR_TOL=-0.002
res['min_vertex_y_m']=round(min(r['minY'] for r in fr),4);res['min_vertex_mesh']=min(fr,key=lambda r:r['minY'])['minYMesh']
res['below_floor']=res['min_vertex_y_m']<FLOOR_TOL
pins={}
for p in q.get('pins',[]):
    act=[r for r in fr if when(r,p.get('when')) and r['cen'].get(p['c'])]
    if not act:pins[p['c']]={'frames':0};continue
    ref=np.array(act[0]['cen'][p['c']]);d=[float(np.linalg.norm(np.array(r['cen'][p['c']])-ref)*1000) for r in act]
    pins[p['c']]={'frames':len(act),'drift_mm_max':round(max(d),2),'ok':max(d)<5.0}
for p in q.get('jointPins',[]):  # a joint (elbow/knee on the mat) that must not slide: drift of the joint centre + its lowest height
    act=[r for r in fr if when(r,p.get('when'))]
    if not act:continue
    ref=np.array(act[0]['J'][p['j']]);d=[float(np.linalg.norm(np.array(r['J'][p['j']])-ref)*1000) for r in act]
    pins[p['j']]={'frames':len(act),'drift_mm_max':round(max(d),2),'height_mm_range':[round(min(r['J'][p['j']][1] for r in act)*1000,1),round(max(r['J'][p['j']][1] for r in act)*1000,1)],'ok':max(d)<5.0}
res['pins']=pins
st={}
for s in q.get('straight',[]):
    act=[r for r in fr if when(r,s.get('when'))]
    mn=min(get(r,s['j']) for r in act) if act else None
    st[s['j']+(' when '+s['when'] if s.get('when') else '')]={'frames':len(act),'min_deg':round(mn,2) if mn else None,'ok':(mn or 999)>=s.get('min',172)}
res['straight']=st
# joint limits
lim={'knee_flex_backward':True,'elbow_flex_forward':True};worst={}
for r in fr:
    for s in ['left','right']:
        L=r['limits'][s]
        if r['knee'][s]<170 and L['kneeFlexDirZ']>0.15:lim['knee_flex_backward']=False;worst.setdefault('knee',(r['f'],s,L['kneeFlexDirZ']))
        if r['elbow'][s]<170 and L['elbowFlexDirZ']<-0.15:lim['elbow_flex_forward']=False;worst.setdefault('elbow',(r['f'],s,L['elbowFlexDirZ']))
hf=[r['limits'][s]['hipFlexDeg'] for r in fr for s in ['left','right']];ha=[r['limits'][s]['hipAbdDeg'] for r in fr for s in ['left','right']]
lim['hip_flex_deg_range']=[min(hf),max(hf)];lim['hip_abd_deg_range']=[min(ha),max(ha)]
# true abduction = angle between the thigh and the pelvis's sagittal plane (normal = hip axis). The frontal projection
# hipAbdDeg = atan2(x,-y) blows up past 90 deg when the thigh is near horizontal (deep squat, Cossack), so the limit uses this one.
import math
def _abd(r,s):
    J=r.get('J') or {};h,k,o=J.get(s+'Hip'),J.get(s+'Knee'),J.get(('right' if s=='left' else 'left')+'Hip')
    if not (h and k and o):return r['limits'][s]['hipAbdDeg']
    lat=[h[i]-o[i] for i in range(3)];n=math.sqrt(sum(c*c for c in lat)) or 1;th=[k[i]-h[i] for i in range(3)];m=math.sqrt(sum(c*c for c in th)) or 1
    return round(math.degrees(math.asin(max(-1,min(1,sum(lat[i]*th[i] for i in range(3))/n/m)))),1)
hat=[_abd(r,s) for r in fr for s in ['left','right']];lim['hip_abd_true_deg_range']=[min(hat),max(hat)]
lim['hip_ok']=min(hf)>-35 and max(hf)<135 and min(hat)>-35 and max(hat)<75
wb=[r['limits']['waistBendDeg'] for r in fr];lim['waist_bend_deg_max']=max(wb);lim['waist_ok']=max(wb)<45
lim['pelvis_to_chest_deg_max']=max(r['limits']['pelvisToChestDeg'] for r in fr)
lim['elbow_deg_range']=[round(min(min(r['elbow'].values()) for r in fr),1),round(max(max(r['elbow'].values()) for r in fr),1)]
lim['knee_deg_range']=[round(min(min(r['knee'].values()) for r in fr),1),round(max(max(r['knee'].values()) for r in fr),1)]
lim['neck_note']='head/neck rigid with the upper torso in this rig (no neck bend possible)'
lim['first_violation']=worst
res['limits']=lim
cw=min(fr,key=lambda r:r['clip']['worstGapMm'])
res['self_clip']={'worst_pair':cw['clip']['worstPair'],'worst_gap_mm':cw['clip']['worstGapMm'],'at_frame':cw['f'],'ok':cw['clip']['worstGapMm']>-8,
  'method':'capsule hulls per segment (torso r115, upper arm r42, forearm r34, hand r28, thigh r68, shin r48, foot r45 mm), adjacent + spec-allowed pairs skipped; ok if overlap < 8 mm'}
hcres={}
for side in ['left','right']:
    vals=[(r['handClip'][side],r['f'],r['handClip'].get(side+'Bone')) for r in fr if r.get('handClip')]
    if not vals:continue
    mn=min(vals);hcres[side]={'min_signed_mm':mn[0],'at_frame':mn[1],'nearest_bone':mn[2],'penetrating_frames':sum(1 for v in vals if v[0]<-0.5),'ok':mn[0]>=-0.5}
for tc in q.get('touch',[]):  # a hand that must rest on the body while `when` holds: gap <= max_gap
    act=[r for r in fr if when(r,tc.get('when')) and r.get('handClip')]
    if act:g=[r['handClip'][tc['side']] for r in act];hcres['contact_'+tc['side']]={'frames':len(act),'gap_mm_range':[round(min(g),2),round(max(g),2)],'ok':max(g)<=tc.get('max_gap',4.0) and min(g)>=-0.5}
res['hand_clip']=dict(hcres,method='per hand skin vertex: K=6 nearest vertices of each outer body layer (skin, tee, cuff, shorts, head; own hand/forearm excluded, radius 45 mm); inside if the vertex is closer to the nearest bone core line than those surface vertices; value = depth (<0) or gap (>0: radial gap over the surface patch, capped by the euclidean distance); ok if >= -0.5 mm')
res['solver_warning_frames']=sum(1 for r in fr if r.get('solverWarn'))
if CD:
    E={};[E.update(json.load(open(f))) for f in glob.glob(CD+'/edge-*.json')]
    res['frame_edge_touch_frames']=sum(1 for v in E.values() if v>0.05)
res['frames_complete']=len(fr)==round(spec['timeline']['duration']*spec.get('fps',30))
res['pass']=bool(res['frames_complete'] and not res['below_floor'] and all(p.get('ok',True) for p in pins.values()) and all(s['ok'] for s in st.values()) and lim['knee_flex_backward'] and lim['elbow_flex_forward'] and lim['hip_ok'] and lim['waist_ok'] and res['self_clip']['ok'] and all(v.get('ok',True) for v in res['hand_clip'].values() if isinstance(v,dict)) and not res.get('frame_edge_touch_frames'))
res['per_frame']=[{'f':r['f'],'params':{k:round(v,4) for k,v in r['params'].items()},'elbow':{k:round(v,1) for k,v in r['elbow'].items()},'knee':{k:round(v,1) for k,v in r['knee'].items()},'minY':round(r['minY'],4),'clip_mm':r['clip']['worstGapMm'],'hand_clip':r.get('handClip'),'touch_shift_mm':r.get('touch')} for r in fr]
json.dump(res,open(OUTF,'w'),indent=1)
print(json.dumps({k:v for k,v in res.items() if k!='per_frame'},indent=0))
