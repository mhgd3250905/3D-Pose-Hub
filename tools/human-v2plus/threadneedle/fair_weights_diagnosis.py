"""Local harmonic shoulder-weight repair, with fixed surrounding weights.

Changes a tiny weight field, never posed positions; CPU experiment only.
"""
import copy,json,sys,argparse
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix,diags
from scipy.sparse.linalg import spsolve
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from reachable_shoulder_endpoint import geometry,models,p,inspect,B,C
from dual_quaternion_diagnosis import points

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',required=True);ap.add_argument('--output',required=True);a=ap.parse_args();out=Path(a.output)
    if out.exists():raise FileExistsError(out)
    v=np.array(json.loads(Path(a.input).read_text())['params']);s=geometry(v)
    F=p['F'];nt=len(models['Torso'].bind);nn=nt+len(models['Mesh005'].bind)
    edges=np.vstack([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]);edges=np.unique(np.sort(edges,axis=1),axis=0)
    adj=coo_matrix((np.ones(len(edges)*2),(np.r_[edges[:,0],edges[:,1]],np.r_[edges[:,1],edges[:,0]])),shape=(nn,nn)).tocsr()
    region={2774,10956,18483,10988,18497,18498,659}
    for _ in range(3):region|=set(adj[list(region)].indices)
    free=np.array(sorted(region));fixed=np.setdiff1d(np.arange(nn),free)
    weights=[]
    for name in ['Torso','Mesh005']:
        m=models[name];w=np.zeros((len(m.bind),len(m.names)))
        for k in range(m.J.shape[1]):np.add.at(w,(np.arange(len(w)),m.J[:,k]),m.W[:,k])
        weights.append(w)
    W=np.vstack(weights);degree=np.array(adj.sum(1)).ravel();L=diags(degree)-adj
    # Weak fidelity retains the source distribution while removing local jumps.
    fidelity=.1
    target=spsolve(L[free][:,free]+fidelity*diags(degree[free]),-L[free][:,fixed]@W[fixed]+fidelity*degree[free,None]*W[free])
    target=np.maximum(target,0);target/=target.sum(1)[:,None];W[free]=target
    X=np.vstack([s['tv'],s['ov']]);patches=[]
    for name,offset in [('Torso',0),('Mesh005',nt)]:
        original=models[name];ids=free[(free>=offset)&(free<offset+len(original.bind))]-offset
        if not len(ids):continue
        m=copy.copy(original);m.bind=original.bind[ids];m.homogeneous=original.homogeneous[ids]
        m.J=np.tile(np.arange(len(m.names)),(len(ids),1));m.W=W[ids+offset]
        X[ids+offset]=points(m,s['T']);patches.append(dict(mesh=name,vertices=ids.tolist(),weights=m.W.tolist()))
    r=inspect('harmonic-shoulder-weights',X);r.update(freeVertices=len(free),maxPoseChangeMm=float(np.linalg.norm(X-np.vstack([s['tv'],s['ov']]),axis=1).max()*1000),shoulderBand=C.tri_band(X[:nt],B.torso.ix,C.smask),status='CPU_WEIGHT_PATCH_NOT_ACCEPTED')
    out.write_text(json.dumps(r,indent=2),encoding='utf-8');out.with_suffix('.weights.json').write_text(json.dumps(dict(params=v.tolist(),patches=patches)),encoding='utf-8');np.savez_compressed(out.with_suffix('.npz'),positions=X,faces=F)
    print(json.dumps(r),flush=True)

if __name__=='__main__':main()
