"""Investigate nearest-vertex flags with same-side closest triangles.

This is evidence to assess a proxy, NOT proof of inside/outside: both surfaces
are open and triangle orientation/normal interpolation may be imperfect.
No original audit is modified. Dependencies: numpy, scipy, trimesh, rtree.
"""
import argparse,base64,json
from pathlib import Path
import numpy as np
import trimesh
from scipy.spatial import cKDTree

def load(path):
    d=json.loads(path.read_text(encoding='utf8'))['meshes'];out={}
    for name in ['Coach_Body','Coach_Sneakers']:
        m=d[name];a=np.frombuffer(base64.b64decode(m['A']),np.float32).reshape(-1,6).astype(float)
        out[name]=(a[:,:3],a[:,3:],np.asarray(m['idx'],int).reshape(-1,3))
    return out
p=argparse.ArgumentParser(description=__doc__);p.add_argument('audit_dir',type=Path);p.add_argument('--states',nargs='+',default=['rest','squat','plank','fold']);p.add_argument('--threshold-mm',type=float,default=1);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
if a.output.exists():raise FileExistsError(a.output)
ref=load(a.audit_dir/'rest.json');shoe_rest,_,sf=ref['Coach_Sneakers'];skin_rest,_,bf=ref['Coach_Body'];cent=skin_rest[bf].mean(axis=1)
out={'method':'reproduce nearest-used-vertex flags; compare same-side foot-region nearest triangle with geometric and interpolated normals','thresholdMm':a.threshold_mm,'limits':['closest-surface signs on open meshes do not prove inside/outside','normal orientation can be inconsistent','same-side rest-space region excludes skin face centroids y>=0.30 m','FCL face contacts do not test containment'],'states':{}}
for state in a.states:
    d=load(a.audit_dir/(state+'.json'));shoe,_,sfaces=d['Coach_Sneakers'];skin,n,bfaces=d['Coach_Body']
    if not np.array_equal(sf,sfaces) or not np.array_equal(bf,bfaces):raise ValueError('topology changed')
    used_shoe=np.unique(sf);used_skin=np.unique(bf);dist,near=cKDTree(skin[used_skin]).query(shoe[used_shoe]);nearest=used_skin[near]
    depth=-np.einsum('ij,ij->i',shoe[used_shoe]-skin[nearest],n[nearest]);flags=(dist<.03)&(depth>a.threshold_mm/1000);out['states'][state]={}
    for side,sign in [('left',1),('right',-1)]:
        selected=np.flatnonzero(flags&(shoe_rest[used_shoe,0]*sign>0));vid=used_shoe[selected];samefaces=np.flatnonzero((cent[:,0]*sign>0)&(cent[:,1]<.30))
        result={'legacyFlagCount':len(vid),'legacyMaxMm':float(depth[selected].max()*1000) if len(vid) else 0,'sameSideFootFaces':len(samefaces),'points':[]}
        if len(vid):
            surface=trimesh.Trimesh(vertices=skin,faces=bfaces[samefaces],process=False)
            closest,distance,local_faces=trimesh.proximity.closest_point(surface,shoe[vid]);original_faces=samefaces[local_faces]
            bary=trimesh.triangles.points_to_barycentric(surface.triangles[local_faces],closest)
            interp=(n[bfaces[original_faces]]*bary[:,:,None]).sum(axis=1);interp/=np.maximum(np.linalg.norm(interp,axis=1)[:,None],1e-12)
            geom=surface.face_normals[local_faces];v=shoe[vid]-closest;di=-np.einsum('ij,ij->i',v,interp)*1000;dg=-np.einsum('ij,ij->i',v,geom)*1000
            for i in range(len(vid)):
                result['points'].append({'shoeVertexId':int(vid[i]),'legacyDepthMm':float(depth[selected[i]]*1000),'legacyNearestVertexId':int(nearest[selected[i]]),'triangleId':int(original_faces[i]),'triangleDistanceMm':float(distance[i]*1000),'smoothNormalProjectionMm':float(di[i]),'faceNormalProjectionMm':float(dg[i]),'smoothFaceNormalDot':float(interp[i]@geom[i])})
            result.update(smoothOverThreshold=int(np.sum(di>a.threshold_mm)),faceOverThreshold=int(np.sum(dg>a.threshold_mm)),smoothProjectionMmRange=[float(di.min()),float(di.max())],faceProjectionMmRange=[float(dg.min()),float(dg.max())],opposedFaceNormalCount=int(np.sum(np.einsum('ij,ij->i',interp,geom)<0)))
        out['states'][state][side]=result
with a.output.open('x',encoding='utf8') as f:json.dump(out,f,indent=2)
print(json.dumps({'output':str(a.output),'states':{k:{s:{x:y for x,y in v.items() if x!='points'} for s,v in q.items()} for k,q in out['states'].items()}},indent=2))
