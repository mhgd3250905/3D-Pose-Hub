import sys;sys.argv=['x'];exec(open('frame.py').read().split("if __name__")[0])
exec(open('measure2.py').read().split('def frame')[0].split("exec(")[0]) if False else None
def hull(P2):
  P=sorted(map(tuple,P2));c=lambda o,a,b:(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);lo=[];up=[]
  for p in P:
    while len(lo)>=2 and c(lo[-2],lo[-1],p)<=0:lo.pop()
    lo.append(p)
  for p in reversed(P):
    while len(up)>=2 and c(up[-2],up[-1],p)<=0:up.pop()
    up.append(p)
  h=np.array(lo[:-1]+up[:-1]);return float(np.sum(np.linalg.norm(h-np.roll(h,1,0),axis=1)))
dl,Xl,dml=load('training-human-v2plus-limbs-base.json');FL=Xl[(Xl[:,0]>0)&(dml=='leftForearm')]
out={}
for nm,rg,ms in [('old','training-human-v2plus-hands.json','training-human-v2plus-hands-base.json'),('r3','hands-native-r3/hands-rig.json','hands-native-r3/hands-base.json')]:
  R,t,res,d,X,dom,rig=handframe(rg,ms);sel=(X[:,0]>0);loc=(X[sel]-t)@R;dm=dom[sel]
  hand=np.isin(dm,['leftHand']+[b for b in d['bones'] if b.startswith('v2p_L_')]);nothumb=hand&~np.char.startswith(dm.astype(str),'v2p_L_thumb')
  L=loc[hand][:,0].max();r={'handLen_mm':round(L*1000,1),'handLen_%height':round(L/1.5505*100,2)}
  for fr in(0.3,0.45):
    S=loc[nothumb&(np.abs(loc[:,0]-fr*L)<0.004)];r[f'palm@{int(fr*100)}% width_mm']=round(np.ptp(S[:,2])*1000,1);r[f'palm@{int(fr*100)}% thick_mm']=round(np.ptp(S[:,1])*1000,1)
  for x in(0,10,20,35):
    S=loc[np.abs(loc[:,0]-x/1000)<0.003];r[f'sec@{x}mm perim']=round(hull(S[:,1:])*1000,1) if len(S)>6 else None
  Fl=(FL-t)@R
  for x in(-30,-15,-5):
    S=Fl[np.abs(Fl[:,0]-x/1000)<0.003];r[f'forearm@{x}mm perim']=round(hull(S[:,1:])*1000,1) if len(S)>6 else None
  r['forearm_end_local_mm']=round(Fl[:,0].max()*1000,1)
  out[nm]=r
print(json.dumps(out,indent=1));json.dump(out,open('measure-local.json','w'),indent=1)
