"""One isolated CPU candidate: complete cuff fairing with full exterior audit.

This does not modify production sources or drop triangles. The previous fixed
interior contact pins are not reused: their folded placement is not the action
goal. Anatomical shoulder support is measured after the solve, independently.
"""
import argparse
import json
import sys
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix, diags, eye
from scipy.sparse.linalg import spsolve

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from audit_recovered_shoulder import P, B, C, p, F, selected, old_skin, inspect


def fair(X, faces, selected_faces):
    n = len(X)
    edges = np.unique(np.sort(np.vstack([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1),axis=0)
    a,b = edges.T
    adj = coo_matrix((np.ones(len(a)*2),(np.r_[a,b],np.r_[b,a])),shape=(n,n)).tocsr()
    chosen = np.zeros(len(faces),bool); chosen[selected_faces]=True
    ids=np.unique(faces[chosen]); protected=np.unique(faces[~chosen])
    free=np.setdiff1d(ids,protected)
    degree=np.asarray(adj.sum(1)).ravel()
    L=diags(1/np.maximum(degree,1))@adj-eye(n)
    rows=np.flatnonzero((np.asarray(adj[:,free].sum(1)).ravel()>0)|np.isin(np.arange(n),free))
    L=L[rows].tocsr(); pins=np.setdiff1d(np.unique(faces),free)
    A=L[:,free]; pin=L[:,pins]@X[pins]
    # Fixed fidelity is a geometric regularizer, not a scan over pass thresholds.
    fidelity=.001
    Q=(A.T@A+fidelity*eye(len(free))).tocsc()
    Y=X.copy();Y[free]=spsolve(Q,-A.T@pin+fidelity*X[free])
    return Y,free


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True)
    args=parser.parse_args();out=Path(args.output)
    if out.exists():raise FileExistsError(out)
    # One additional 10-ring collar/arm band permits smooth continuation beyond
    # the previous 254-edge patch; all exterior vertices remain exactly fixed.
    chosen=set(selected.tolist())
    for _ in range(10):
        ids=np.unique(F[list(chosen)]);chosen.update(np.flatnonzero(np.isin(F,ids).any(1)).tolist())
    S=np.array(sorted(chosen))
    s=P.geometry(1);tv=B.torso.points(s['T']);ov=old_skin(s['T'],B.F['SRCMODELS']['Mesh005'])
    for a,b in p['G']['pairs']:tv[a]=ov[b]
    X=np.vstack([tv,ov]);Y,free=fair(X,F,S)
    # Audit the full expanded patch, not only the original narrow subset.
    from audit_recovered_shoulder import strict_pairs
    outside=np.setdiff1d(np.arange(len(F)),S)
    si,ss,cp=strict_pairs(Y,F[S],F[S],True);ex,_,cp2=strict_pairs(Y,F[S],F[outside])
    moved=np.linalg.norm(Y-X,axis=1)
    result={'status':'CPU_CANDIDATE_NOT_RUNTIME_ACCEPTED','patchFaces':len(S),'changedVertices':len(free),
            'internalCrossings':len(si),'externalCrossings':len(ex),'coplanarOverlap':cp+cp2,
            'sharedFeatureExtendedCrossings':int((ss>0).sum()),'maximumMoveMm':float(moved.max()*1000),
            'minimumYmm':float(Y[np.unique(F),1].min()*1000),
            'shoulderBand':C.tri_band(Y[:len(tv)],B.torso.ix,C.smask),
            'internalSourceExamples':S[si[:12]].tolist(),
            'exteriorSourceExamples':[[int(S[a]),int(outside[b])]for a,b in ex[:12]],
            'topologyUnchanged':True,'boundaryUnchanged':True,'droppedFaces':0}
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2),encoding='utf-8')
    np.savez_compressed(out.with_suffix('.npz'),source=X,candidate=Y,faces=F,patchFaces=S,free=free)
    print(json.dumps(result),flush=True)


if __name__=='__main__':main()
