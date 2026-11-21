import numpy as np, pickle, os
from scipy.spatial import cKDTree
import scipy.sparse as sp
from v5lib import *
def build(M,mi=2):
    m=M[mi];b=m['bpos'];n=len(b)
    key=np.round(b*1e5).astype(np.int64)
    _,wid,inv=np.unique(key,axis=0,return_index=True,return_inverse=True);inv=inv.ravel()
    nw=inv.max()+1;P=np.zeros((nw,3));P[inv]=b
    I=m['index'].reshape(-1,3);E=np.r_[I[:,[0,1]],I[:,[1,2]],I[:,[2,0]]];E=inv[E];E=E[E[:,0]!=E[:,1]]
    A=sp.coo_matrix((np.ones(len(E)),(E[:,0],E[:,1])),shape=(nw,nw)).tocsr();A=((A+A.T)>0).astype(float)
    bn=m['bones'];W=np.zeros((n,len(bn)))
    for k in range(4): np.add.at(W,(np.arange(n),m['si'][:,k]),m['sw'][:,k])
    Ww=np.zeros((nw,len(bn)));cnt=np.zeros(nw);np.add.at(Ww,inv,W);np.add.at(cnt,inv,1);Ww/=cnt[:,None]
    T=cKDTree(P);d,mir=T.query(P*np.array([-1,1,1]))
    F=inv[m['index'].reshape(-1,3)];F=F[(F[:,0]!=F[:,1])&(F[:,1]!=F[:,2])&(F[:,0]!=F[:,2])]
    return dict(F=F,inv=inv,P=P,A=A,W=Ww,Wv=W,mir=mir,mird=d,bones=bn,mi=mi)
