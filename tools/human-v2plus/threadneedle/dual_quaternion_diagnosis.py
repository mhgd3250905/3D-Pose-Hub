"""Test volume-preserving skinning on the exact recovered endpoint.

CPU diagnostic only. No frozen source or registration is changed.
"""
import argparse,json,sys
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from natural_shoulder_endpoint import models,P,B,C,p,inspect

def mul(a,b):
    av,aw=a[...,:3],a[...,3:];bv,bw=b[...,:3],b[...,3:]
    return np.concatenate([aw*bv+bw*av+np.cross(av,bv),aw*bw-np.sum(av*bv,axis=-1,keepdims=True)],axis=-1)

def points(mesh,T):
    Q=np.array([T.get(n,(np.eye(3),np.zeros(3)))[0] for n in mesh.names])
    t=np.array([T.get(n,(np.eye(3),np.zeros(3)))[1] for n in mesh.names])
    qr=Rotation.from_matrix(Q).as_quat();qd=.5*mul(np.c_[t,np.zeros(len(t))],qr)
    ref=qr[mesh.J[np.arange(len(mesh.J)),mesh.W.argmax(1)]]
    signs=np.where(np.einsum('nki,ni->nk',qr[mesh.J],ref)<0,-1.,1.)
    w=mesh.W*signs;r=(qr[mesh.J]*w[:,:,None]).sum(1);d=(qd[mesh.J]*w[:,:,None]).sum(1)
    norm=np.linalg.norm(r,axis=1)[:,None];r/=norm;d/=norm;d-=r*np.sum(r*d,axis=1)[:,None]
    conj=r.copy();conj[:,:3]*=-1
    trans=2*mul(d,conj)[:,:3]
    # Original canonical bind palettes differ only by float roundoff (<0.3 um).
    v=(mesh.homogeneous@mesh.palette[0].T)[:,:3]
    return Rotation.from_quat(r).apply(v)+trans

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);a=ap.parse_args();out=Path(a.output)
    if out.exists():raise FileExistsError(out)
    s=P.geometry(1);T=s['T'];tv=points(models['Torso'],T);ov=points(models['Mesh005'],T)
    X=np.vstack([tv,ov]);r=inspect('exact-bind-dual-quaternion',X)
    r.update(shoulderBand=C.tri_band(tv,B.torso.ix,C.smask),status='CPU_DIAGNOSIS_NOT_ACCEPTED')
    out.write_text(json.dumps(r,indent=2),encoding='utf-8');np.savez_compressed(out.with_suffix('.npz'),positions=X,faces=p['F'])

if __name__=='__main__':main()
