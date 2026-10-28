exec(open('measure.py').read().split('WX=')[0])
def handframe(rigf,meshf,side='L'):
  rig=json.load(open(M+rigf));d,X,dom=load(meshf);src=[];dst=[]
  for f,v in rig['fingers'].items():
    J=np.array(v['joints'])
    for k in range(3):
      b=f'v2p_{side}_{f}{k+1}';S=X[(dom==b)&(X[:,0]>0)]
      if len(S)>20:src.append((J[k]+J[k+1])/2);dst.append(S.mean(0))
  A=np.array(src);B=np.array(dst);ca,cb=A.mean(0),B.mean(0);U,S,Vt=np.linalg.svd((A-ca).T@(B-cb));Dg=np.diag([1,1,np.sign(np.linalg.det(Vt.T@U.T))]);R=Vt.T@Dg@U.T
  sc=S.sum()/((A-ca)**2).sum();t=cb-R@ca  # without scale
  res=np.linalg.norm((A@R.T+t)-B,axis=1)
  return R,t,res,d,X,dom,rig
if __name__=='__main__':
  for rg,ms in [('training-human-v2plus-hands.json','training-human-v2plus-hands-base.json'),('hands-native-r3/hands-rig.json','hands-native-r3/hands-base.json')]:
    R,t,res,d,X,dom,rig=handframe(rg,ms);H=X[(X[:,0]>0)&np.isin(dom,['leftHand']+[b for b in d['bones'] if b.startswith('v2p_L_')])]
    loc=(H-t)@R;print(ms,'origin',t.round(4),'fit resid mm',(res*1000).round(1).max(),'local x range mm',(loc[:,0].min()*1000).round(1),(loc[:,0].max()*1000).round(1),'z range',(np.ptp(loc[:,2])*1000).round(1),'y',(np.ptp(loc[:,1])*1000).round(1))
