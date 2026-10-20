# M8 head direction sketch (offline raster): current head (Toon_Mannequin_Head_v5) vs the Blender Human Base Meshes v1.4.1 realistic
# male head (CC0, male_l2.npz) aligned by skull depth / ear z.  Run in the torso-base work dir:
#   PYTHONPATH=pylib:tools/human-v2plus/torso-base:tools/human-v2plus/limbs-base python3 tools/human-v2plus/head-base/sketch.py out.jpg Toon_Mannequin_Head_v5
import sys, numpy as np
from PIL import Image
from common import *
from splat import raster, label
d=np.load('male_l2.npz'); V=d['V']+[0,0.043,0.012-0.035]; Q=d['F']   # aligned to the current head: skull depth / ear z (-3.5 cm)
T=np.r_[Q[:,[0,1,2]],Q[:,[0,2,3]]]; m=(V[T].min(1)[:,1]>1.36).all(1) if False else (V[T][:,:,1].min(1)>1.36)
Tb=T[m]
SK=[200,200,205]; dirs=[((0,0.05,1),'front'),((0.7,0.05,0.7),'3/4'),((1,0.05,0.001),'profile')]
C=(0,1.57,0.02); H=0.17; PX=300
def mesh(k,ymin=1.36):
    Pk=P[k] if k in P else arr(k,'P'); F=np.array(M[k]['index']).reshape(-1,3); return Pk,F[(Pk[F][:,:,1].min(1)>ymin)]
rows=[]
cands=sys.argv[2:] if len(sys.argv)>2 else ['Coach_Body','Toon_Mannequin_Head_v5']
for k in cands:
    Pk,F=mesh(k); rows.append(np.concatenate([label(raster([(Pk,F,SK,None)],dv,C,H,PX),'current '+nm) for dv,nm in dirs],1))
rows.append(np.concatenate([label(raster([(V,Tb,SK,None)],dv,C,H,PX),'Blender base male (CC0) '+nm) for dv,nm in dirs],1))
Image.fromarray(np.concatenate(rows,0)).save(sys.argv[1],quality=85)
