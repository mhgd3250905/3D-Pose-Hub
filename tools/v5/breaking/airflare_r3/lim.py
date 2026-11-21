import sys,pickle,numpy as np
from rig import Rig
d=pickle.load(open(sys.argv[1],'rb')); t3=np.degrees(3*(d['R0']['spine']+d['x'][:,6:9]))
W,P=Rig(d['R0']).fk(d['x'])
ab=[];fl=[]
for sd,sg in (('left',1),('right',-1)):
    tl=np.einsum('nji,nj->ni',W['pelvis'],P[sd+'Shin']-P[sd+'Thigh']); tl/=np.linalg.norm(tl,axis=1)[:,None]
    ab.append(np.degrees(np.arcsin(sg*tl[:,0]))); fl.append(np.degrees(np.arccos(-tl[:,1])))
nh=np.degrees(2*np.linalg.norm(d['R0']['nh']+d['x'][:,9:12],axis=1))
g=d['e']<1e9
print('err med %.1f p90 %.1f | flex %.0f ext %.0f lat %.0f tw %.0f tot %.0f neck %.0f | abd %.0f swing %.0f'%(np.median(d['e']),np.percentile(d['e'],90),t3[:,0].max(),-t3[:,0].min(),np.abs(t3[:,2]).max(),np.abs(t3[:,1]).max(),np.linalg.norm(t3,axis=1).max(),nh.max(),max(a.max() for a in ab),max(a.max() for a in fl)))
