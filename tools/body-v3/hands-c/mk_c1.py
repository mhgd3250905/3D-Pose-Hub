import numpy as np,json
from scipy.spatial.transform import Rotation
V=[];F=[];grp=None;G={};fg=[]
for l in open('mh/base.obj'):
    t=l.split()
    if not t:continue
    if t[0]=='v':V.append([float(x) for x in t[1:4]])
    elif t[0]=='g':grp=t[1]
    elif t[0]=='f':
        ids=[int(x.split('/')[0])-1 for x in t[1:]];G.setdefault(grp,set()).update(ids)
        if grp=='body':
            for k in range(1,len(ids)-1):F.append([ids[0],ids[k],ids[k+1]])
V=np.array(V);F=np.array(F)
c=lambda g:V[list(G[g])].mean(0)
w=c('joint-l-hand');ax=c('joint-l-finger-3-1')-w;ax/=np.linalg.norm(ax)
lat=c('joint-l-finger-2-1')-c('joint-l-finger-5-1');lat-=ax*(lat@ax);lat/=np.linalg.norm(lat)
y=np.cross(lat,ax);M=np.array([ax,y,lat])
L=lambda p:M@(p-w)
tipL=max(L(V[i])[0] for i in G['body'] if np.linalg.norm(V[i]-w)<3)
print('thumb local',L(c('joint-l-finger-1-3')).round(2),'tip len dm',round(tipL,3))
s=0.187/tipL
rest=json.load(open('rest-v2.json'));hb=rest['bones']['leftHand']
RH=Rotation.from_quat(hb['q']).as_matrix();hp=np.array(hb['p'])
X=((V-w)@M.T)*s;W=X@RH.T+hp
part=np.zeros(len(V),int);part[list(G['body'])]=1
used=np.unique(F);keep=np.zeros(len(V),bool);keep[used]=True;part[~keep]=0
np.savez('c1-source.npz',V=W,F=F,part=part);print(len(V),len(F))
