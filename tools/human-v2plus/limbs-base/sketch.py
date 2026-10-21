# direction sketch: current v2 arm/leg skin vs base-mesh limbs (rest pose, offline, rough trims) -> sketch.jpg
import sys, json, numpy as np
from PIL import Image
from common import *
from meshops import compact
from splat import raster, label, vnorm
LM={k:np.array(v) for k,v in rest['landmarks'].items()}
tj=json.load(open(os.path.join(REPO,'drill-anim/models/training-human-v2plus-torso-base.json')))
fin=np.load('final.npz'); TV,TF=fin['V'],fin['F']
lf=np.load(sys.argv[2] if len(sys.argv)>2 else 'limbs_fit.npz'); LV,LF=lf['V'],lf['F']
B=P[BODY]; FB=np.array(M[BODY]['index']).reshape(-1,3)
keepB=np.ones(len(FB),bool); keepB[tj['hideFaces'][BODY]]=False
def armt(X,sd):
    S,W=LM[sd+'Shoulder'],LM[sd+'Wrist']; u=(W-S)/np.linalg.norm(W-S); return (X-S)@u, np.linalg.norm(W-S)
def limbmask(X):
    m=np.zeros(len(X),bool)
    for sgn,sd in ((1,'left'),(-1,'right')):
        t,Lw=armt(X,sd); m|=(X[:,0]*sgn>0.12)&(X[:,1]>0.80)&(t>0.165)&(t<Lw-0.03)
    m|=(X[:,1]>0.15)&(X[:,1]<0.632)
    return m
bl=limbmask(B); keepNew=keepB&~(bl[FB].all(1))
ll=limbmask(LV); LV2,LF2,_=compact(LV,LF,ll[LF].all(1))
SK=np.array([214,170,140.]); OUT=np.array([70,90,120.]); SH=np.array([60,60,66.])
others=[]
for k in ('Toon_Mannequin_Head_v5','Coach_Sneakers','Coach_Soles','Coach_Shoe_Details'):
    if k in M and M[k]['index']: others.append((arr(k,'P'),np.array(M[k]['index']).reshape(-1,3),SK if 'Head' in k else SH,None))
cur=[(B,FB[keepB],SK,None),(TV,TF,OUT,None)]+others
new=[(B,FB[keepNew],SK,None),(LV2,LF2,SK*np.array([1.0,0.97,0.95]),None),(TV,TF,OUT,None)]+others
W=int(os.environ.get('SK_W','420'))
rows=[]
for name,dirv,cen,half in (('front',(0,0,1),(0,0.86,0),0.95),('back',(0,0,-1),(0,0.86,0),0.95)):
    rows.append(np.concatenate([label(raster(cur,dirv,cen,half,W),'v2 limbs '+name),label(raster(new,dirv,cen,half,W),'base limbs '+name)],1))
# close-ups: left arm (3/4 front) and left leg (3/4 front-side)
for name,dirv,cen,half in (('arm',(0.6,0.1,0.8),(0.23,1.10,0.02),0.30),('leg',(0.5,0.05,0.85),(0.09,0.40,0.0),0.34),('arm back',(0.5,0.1,-0.85),(0.23,1.10,0.02),0.30),('leg back',(0.4,0.05,-0.9),(0.09,0.40,0.0),0.34)):
    rows.append(np.concatenate([label(raster(cur,dirv,cen,half,W),'v2 '+name),label(raster(new,dirv,cen,half,W),'base '+name)],1))
grid=[np.concatenate(rows[i:i+2],1) for i in range(0,len(rows),2)]
Image.fromarray(np.concatenate(grid,0)).save(sys.argv[1],quality=88)
print('saved',sys.argv[1])
