# rom.py <jsonl...> : ROM census per tools/rom-spec/ROM.md (draft r1). Prints worst-frame values and exceed amounts.
# Draft limits below (ROM.md section 6). Calibrated fix criteria (section 8): htw <= 75, foreTot <= 140; elTw is reference only; elHyper/elVar/wr*/shExt unreliable.
import json,sys,math
import numpy as np
LIM=dict(elFlex=155,elHyper=10,elVar=15,elTw=30,htw=60,foreTot=90,wrFlex=90,wrExt=80,wrDev=40,
 knFlex=150,knHyper=10,knVar=10,knTwS=10,knTwB=35,ankDF=30,ankPF=60,ankInv=40,ankTw=15,hipFlex=135,hipExt=40,hipAbd=60,hipAdd=35,shExt=70)
def n(v):v=np.asarray(v,float);l=np.linalg.norm(v);return v/l if l>1e-9 else v
def ang(a,b):return math.degrees(math.acos(max(-1,min(1,float(np.dot(n(a),n(b)))))))
def frame(J,s):
  j=lambda k:np.array(J[k]);L='left' if s=='left' else 'right';o='right' if s=='left' else 'left'
  S,E,W,Pm=j(L+'Shoulder'),j(L+'Elbow'),j(L+'Wrist'),j(L+'Palm');H,K,A=j(L+'Hip'),j(L+'Knee'),j(L+'Ankle')
  return S,E,W,Pm,H,K,A
def row(r,s):
  J=r['joints'];m=r[s];S,E,W,Pm,H,K,A=frame(J,s);out={}
  u,f=n(E-S),n(W-E);fl=ang(u,f);out['elFlex']=fl
  pit=n(m['pitW']);bend=f-u*np.dot(f,u)
  out['elHyper']=fl if (fl>3 and np.dot(bend,pit)<0) else 0
  side=n(np.cross(u,pit));out['elVar']=math.degrees(math.asin(min(1,abs(np.dot(f,side))))) if fl>20 else 0
  out['elTw']=abs(m['elTw']);out['htw']=abs(m['htw5']);out['foreTot']=abs(m['elTw']+m['htw5'])
  if m.get('palmW'):
    h=n(Pm-W);nn=n(np.array(m['palmW'])-f*np.dot(m['palmW'],f));d=n(np.cross(nn,f))
    wf=math.degrees(math.atan2(np.dot(h,nn),np.dot(h,f)));out['wrFlex']=max(wf,0);out['wrExt']=max(-wf,0)
    out['wrDev']=abs(math.degrees(math.atan2(np.dot(h,d),np.dot(h,f))))
  t,sh=n(K-H),n(A-K);kf=ang(t,sh);out['knFlex']=kf;fr=n(m['kneeFrontW']);kb=sh-t*np.dot(sh,t)
  out['knHyper']=kf if (kf>3 and np.dot(kb,fr)>0) else 0
  ks=n(np.cross(t,fr));out['knVar']=math.degrees(math.asin(min(1,abs(np.dot(sh,ks)))))
  out['knTwS']=abs(m['knTw']) if kf<20 else 0;out['knTwB']=abs(m['knTw']) if kf>=20 else 0
  if m.get('ankDP') is not None:out['ankDF']=max(m['ankDP'],0);out['ankPF']=max(-m['ankDP'],0)
  if m.get('ankInv') is not None:out['ankInv']=abs(m['ankInv'])
  out['ankTw']=abs(m['ankTw'])
  x=n(np.array(J['leftHip'])-np.array(J['rightHip']));y=np.array(J['waist'])-np.array(J['pelvis']);y=n(y-x*np.dot(y,x));z=np.cross(x,y)
  d=np.array([np.dot(t,x),np.dot(t,y),np.dot(t,z)]);hf=math.degrees(math.atan2(d[2],-d[1]))
  out['hipFlex']=max(hf,0);out['hipExt']=max(-hf,0);ab=math.degrees(math.asin(max(-1,min(1,d[0]*(1 if s=='left' else -1)))))
  out['hipAbd']=max(ab,0);out['hipAdd']=max(-ab,0)
  x2=n(np.array(J['leftShoulder'])-np.array(J['rightShoulder']));y2=np.array(J['shoulderCenter'])-np.array(J['waist']);y2=n(y2-x2*np.dot(y2,x2));z2=np.cross(x2,y2)
  ua=np.array([np.dot(u,x2),np.dot(u,y2),np.dot(u,z2)]);out['shExt']=max(-math.degrees(math.atan2(ua[2],-ua[1])),0) if (ua[1]<0.2 and abs(ua[0])<0.5) else 0
  return out
def worst(rows):
  W={}
  for r in rows:
    for s in ['left','right']:
      try:o=row(r,s)
      except Exception as e:continue
      for k,v in o.items():
        if k not in W or v>W[k][0]:W[k]=(v,s,r['t'])
  ex={k:(v[0]-LIM[k],v[1],v[2],v[0]) for k,v in W.items() if k in LIM and v[0]>LIM[k]}
  return W,ex
if __name__=='__main__':
  res=[]
  for fn in sys.argv[1:]:
    for l in open(fn):
      d=json.loads(l)
      if not d.get('rows'):continue
      W,ex=worst(d['rows']);tot=sum(e[0] for e in ex.values());mx=max([e[0] for e in ex.values()]+[0])
      res.append((mx,tot,d['id'],ex,{k:round(v[0]) for k,v in W.items()}))
  res.sort(key=lambda x:-x[0])
  for mx,tot,i,ex,W in res:
    print(f"{i:40s} max+{mx:5.0f} "+'; '.join(f"{k} {e[3]:.0f}(+{e[0]:.0f},{e[1][0]},t{e[2]})" for k,e in sorted(ex.items(),key=lambda x:-x[1][0])))
  json.dump([dict(id=i,max=mx,ex={k:[round(e[0],1),e[1],e[2],round(e[3],1)] for k,e in ex.items()},W=W) for mx,tot,i,ex,W in res],open('rom-out.json','w'),ensure_ascii=False)
