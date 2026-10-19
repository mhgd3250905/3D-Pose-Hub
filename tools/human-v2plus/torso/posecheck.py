# offline pose check: skin the torso with the dumped skinning matrices (tools/human-v2plus/probe-pose.mjs -> poses.json in the
# build workdir) and render it with the numpy preview rasterizer.  python3 posecheck.py <pose tag> <out.png> auto <half-size> '<views>' [weights.png]
import sys, json
from common import *
from preview import render
from meshops import vnormals
PZ=json.load(open('poses.json')); d=np.load('final.npz'); V,F,J,Wq=d['V'],d['F'],d['J'],d['Wq']/255.0
BONES=list(rest['bones'].keys())
def mats(tag):
    names=PZ[tag]['bones']; A=np.array(PZ[tag]['A']).reshape(-1,4,4).transpose(0,2,1)   # three column-major -> row-major
    idx=[names.index(b) for b in BONES]; return A[idx]
def skin(tag):
    Ar=mats('rest'); Ap=mats(tag)
    Sr=np.einsum('vk,vkij->vij',Wq,Ar[J]); Sp=np.einsum('vk,vkij->vij',Wq,Ap[J])
    ph=np.c_[V,np.ones(len(V))]; pb=np.einsum('vij,vj->vi',np.linalg.inv(Sr),ph); return np.einsum('vij,vj->vi',Sp,pb)[:,:3]
Fb=np.array(M[BODY]['index']).reshape(-1,3); keepB=np.load('fair.npz',allow_pickle=True)['keepB']
tag=sys.argv[1]; Vp=skin(tag); print('rest check max err', np.abs(skin('rest')-V).max()); Bp=np.array(PZ[tag]['body']).reshape(-1,3)
c=Vp[(V[:,1]>1.15)&(V[:,1]<1.4)].mean(0) if sys.argv[3]=='auto' else eval(sys.argv[3]); h=float(sys.argv[4]); views=eval(sys.argv[5])
render([(Vp,F,(150,160,175),None),(Bp,Fb[keepB],(200,170,150),None)],views,c,h,450,sys.argv[2])
if len(sys.argv)>6:
    Wd=np.zeros((len(V),len(BONES))); np.add.at(Wd,(np.repeat(np.arange(len(V)),4),J.ravel()),Wq.ravel())
    arm=Wd[:,[BONES.index(b) for b in ('leftUpperArm','rightUpperArm')]].sum(1); sc=Wd[:,[BONES.index(b) for b in ('leftScapula','rightScapula')]].sum(1)
    col=np.stack([90+165*arm,90+100*(1-arm-sc),90+165*sc],1)
    render([(Vp,F,col,None),(Bp,Fb[keepB],(200,170,150),None)],views,c,h,450,sys.argv[6])
