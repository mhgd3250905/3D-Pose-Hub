"""Inspect cut foot topology; do not manufacture caps or modify model data.

Rest-space horizontal clipping uses edge interpolation for both rest and posed
vertices. Coincident vertices are welded only within the requested tolerance;
the reported pose spread exposes whether that assumption holds. No inside/
outside conclusion is produced unless a separately validated closed solid is
available. Requires numpy, scipy, trimesh. Output must be a new file.
"""
import argparse, base64, hashlib, json
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

def load(path):
    meshes=json.loads(path.read_text(encoding='utf8'))['meshes']
    out={}
    for name in ['Coach_Body','V2P_Base_Limbs','Coach_Sneakers']:
        m=meshes[name]
        a=np.frombuffer(base64.b64decode(m['A']),np.float32).reshape(-1,6).astype(float)
        out[name]=(a[:,:3],np.asarray(m['idx'],dtype=int).reshape(-1,3))
    return out

def construct(rest,pose,side,cut,tol,return_geometry=False):
    rv=[];pv=[];ff=[];source=[]
    for name in ['Coach_Body','V2P_Base_Limbs']:
        r,f=rest[name];p,pf=pose[name]
        if not np.array_equal(f,pf):raise ValueError('index topology changed: '+name)
        # A triangle crossing the midline is not silently assigned to a side.
        same_side=(r[f,0].min(axis=1)>0) if side>0 else (r[f,0].max(axis=1)<0)
        candidates=f[(r[f,1].min(axis=1)<cut)&same_side]
        for tri in candidates:
            poly=[(r[i],p[i]) for i in tri];out=[]
            for i in range(3):
                a,b=poly[i],poly[(i+1)%3];ina=a[0][1]<cut;inb=b[0][1]<cut
                if ina:out.append(a)
                if ina != inb:
                    t=(cut-a[0][1])/(b[0][1]-a[0][1]);out.append((a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])))
            if len(out)<3:continue
            start=len(rv);rv.extend(x[0] for x in out);pv.extend(x[1] for x in out)
            for i in range(1,len(out)-1):ff.append([start,start+i,start+i+1]);source.append(name)
    rv=np.asarray(rv);pv=np.asarray(pv);ff=np.asarray(ff,dtype=int);source=np.asarray(source)
    # Union-find handles duplicated position attributes and the ankle seam.
    parent=np.arange(len(rv))
    def find(x):
        while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
        return x
    for a,b in cKDTree(rv).query_pairs(tol,output_type='ndarray'):
        a=find(a);b=find(b)
        if a!=b:parent[b]=a
    roots=np.array([find(i) for i in range(len(rv))]);_,first,groups=np.unique(roots,return_index=True,return_inverse=True)
    vr=rv[first];vp=pv[first];spread=np.linalg.norm(pv-vp[groups],axis=1);faces=groups[ff]
    degenerate=np.any(np.diff(np.sort(faces,axis=1),axis=1)==0,axis=1)
    faces=faces[~degenerate];source=source[~degenerate]
    edges=np.vstack([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]);u=np.sort(edges,axis=1)
    unique,counts=np.unique(u,axis=0,return_counts=True);boundary=unique[counts==1]
    graph=coo_matrix((np.ones(len(unique)*2),(np.r_[unique[:,0],unique[:,1]],np.r_[unique[:,1],unique[:,0]])),shape=(len(vr),len(vr))).tocsr()
    _,labels=connected_components(graph,directed=False);used=np.unique(faces);parts=[]
    for label in np.unique(labels[used]):
        verts=used[labels[used]==label];mask=np.isin(faces[:,0],verts);e=boundary[np.isin(boundary[:,0],verts)]
        parts.append({'vertices':len(verts),'faces':int(mask.sum()),'bodyFaces':int((source[mask]=='Coach_Body').sum()),'limbFaces':int((source[mask]=='V2P_Base_Limbs').sum()),'boundaryEdges':len(e),'boundaryAtCut':int(np.sum(np.all(np.abs(vr[e,1]-cut)<tol*2,axis=1))),'boundsRestM':[vr[verts].min(axis=0).tolist(),vr[verts].max(axis=0).tolist()]})
    parts.sort(key=lambda x:-x['faces'])
    report={'vertices':len(used),'faces':len(faces),'removedDegenerateFaces':int(degenerate.sum()),'weldPoseSpreadMaxMm':float(spread.max()*1000),'boundaryEdges':len(boundary),'nonManifoldEdges':int((counts>2).sum()),'connectedComponents':parts}
    return (report,vr,vp,faces,boundary) if return_geometry else report

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('audit_dir',type=Path);p.add_argument('--output',type=Path,required=True);p.add_argument('--weld-tolerance-m',type=float,default=1e-5);a=p.parse_args()
    if a.output.exists():raise FileExistsError(a.output)
    files=[a.audit_dir/'rest.json',a.audit_dir/'plank.json'];rest,pose=map(load,files)
    d={'purpose':'pre-cap topology feasibility; no inside/outside conclusion','limits':['snapshot contains full index arrays, not drawRange','rest coordinates are captured reset-pose world coordinates','positional welding must be checked against seam identity','no self-intersection test or cap constructed'], 'inputSha256':{x.name:hashlib.sha256(x.read_bytes()).hexdigest() for x in files},'weldToleranceM':a.weld_tolerance_m,'cases':{}}
    for cut in [.20,.25]:
        for name,sign in [('left',1),('right',-1)]:
            d['cases'][f'{name}-{cut:.2f}']=construct(rest,pose,sign,cut,a.weld_tolerance_m)
    with a.output.open('x',encoding='utf8') as f:json.dump(d,f,indent=2)
    print(json.dumps(d,indent=2))
if __name__=='__main__':main()
