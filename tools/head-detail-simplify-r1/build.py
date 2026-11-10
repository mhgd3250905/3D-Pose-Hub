"""Local face-detail removal on the original head; no analytic replacement skull."""
import json, os, sys, runpy, hashlib
from pathlib import Path
from collections import defaultdict
import numpy as np
from scipy.spatial import cKDTree
repo=Path(__file__).resolve().parents[2]; folder=Path(sys.argv[1]).resolve()
source=json.loads((folder/'rest.json').read_text()); V0=np.array(source['positions']).reshape(-1,3); F0=np.array(source['index']).reshape(-1,3)
material=np.empty(len(F0),dtype=int)
for g in source['groups']: material[g['start']//3:(g['start']+g['count'])//3]=g['materialIndex']
head_faces=F0[material==1]; used=np.unique(head_faces); remap=np.full(len(V0),-1,dtype=int);remap[used]=np.arange(len(used))
assert (remap[:162]>=0).all()
np.savez(folder/'head_fit.npz',V=V0[used],F=remap[head_faces],LA=remap[:162])
sys.path.insert(0,str(repo/'tools/human-v2plus/torso-base'))
from meshops import vnormals, bilaplace_fair
for key in list(os.environ):
 if key.startswith('HD_'): del os.environ[key]
os.environ.update(HD_FACE='soft',HD_M_KFACE='0.35',HD_M_KEYE='0',HD_M_KMOUTH='0',HD_M_KNOSE='0.32',HD_M_KEAR='0.04')
os.chdir(folder)
# The historical diagnostic assumes every region has a >0.9 core. Current
# armfix geometry can have none; guard that print only, preserving the algorithm.
script=(repo/'tools/human-v2plus/head-base/head_m.py').read_text(encoding='utf-8')
assert 's=m_>0.9; print(' in script
script=script.replace('s=m_>0.9; print(', 's=m_>0.9;\n    if s.any(): print(')
compat=folder/'head_m-compatible.py';compat.write_text(script,encoding='utf-8')
state=runpy.run_path(str(compat),run_name='__main__')
r=np.load(folder/'head_fit.npz'); generated=r['V'].copy(); faces=r['F']
# Fair the ear interior into one low relief surface; retain its surrounding
# temporal/skull transition rather than preserving the old inner ear cup.
ear_free=(state['ear']>.55)&(generated[:,1]>1.515)&(generated[:,1]<1.675)
generated=bilaplace_fair(generated,faces,ear_free)
# Carry the old IDs through the generator's two compaction steps. Explicitly
# protect crown, upper forehead, occiput and jaw; only local face detail changes.
survivors=state['used'][state['used2']]; original=V0[used[survivors]]
protected=(original[:,1]>=1.68)|(original[:,1]<=1.515)|((original[:,2]<-.025)&(np.abs(original[:,0])<.068))|((original[:,1]>1.658)&(original[:,2]>.06))
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
x,y,z=original.T
blend=smooth(1.515,1.53,y)*(1-smooth(1.65,1.68,y))
blend*=1-smooth(1.64,1.658,y)*smooth(.045,.06,z)
blend*=1-(1-smooth(-.025,-.005,z))*(1-smooth(.068,.078,np.abs(x)))
generated[:len(original)]=original+(generated[:len(original)]-original)*blend[:,None]
generated[np.where(protected)[0]]=original[protected]
distance,mapping=cKDTree(V0[used]).query(generated);mapping=used[mapping]
is_new=distance>=1e-8; ids=mapping.copy();ids[is_new]=len(V0)+np.arange(is_new.sum())
V=np.r_[V0,generated[is_new]];F=np.r_[F0[material!=1],ids[faces]]
nearest=np.r_[np.arange(len(V0)),mapping[is_new]];exact=np.r_[np.ones(len(V0),bool),np.zeros(is_new.sum(),bool)]
preserved=np.where((V0[:,1]<=1.515)|(V0[:,1]>=1.68)|((V0[:,2]<-.025)&(np.abs(V0[:,0])<.068))|((V0[:,1]>1.658)&(V0[:,2]>.06)))[0]
active=set(F.ravel().tolist()); required=set(np.unique(F0)).intersection(preserved.tolist())
assert required.issubset(active),'Protected surface vertex removed'
edges=defaultdict(list)
for fi,tri in enumerate(F):
 for a,b in zip(tri,np.roll(tri,-1)): edges[tuple(sorted((int(a),int(b))))].append((fi,int(a)<int(b)))
assert all(len(edges[tuple(sorted((i,(i+1)%162)))])==2 for i in range(162))
assert all(len(e)<=2 for (a,b),e in edges.items() if max(a,b)>=len(V0))
assert all(e[0][1]!=e[1][1] for (a,b),e in edges.items() if max(a,b)>=len(V0) and len(e)==2)
N=vnormals(V,F); area=np.linalg.norm(np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]),axis=1)
assert area[len(F0[material!=1]):].min()>1e-13
face_norm=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]])/np.maximum(area[:,None],1e-20)
angles=[float(np.degrees(np.arccos(np.clip(face_norm[e[0][0]]@face_norm[e[1][0]],-1,1)))) for (a,b),e in edges.items() if max(a,b)>=len(V0) and len(e)==2]
assert max(angles)<120,'Fold in modified surface'
data={'format':'pose-hub-head-detail-simplify@1','version':'0.1.0-r1','positions':V.ravel().tolist(),'normals':N.ravel().tolist(),'index':F.ravel().tolist(),
 'nearest':nearest.tolist(),'exact':exact.tolist(),'faceMaterials':material[material!=1].tolist()+[1]*len(faces),'sourceVertices':len(V0),
 'sourceRestSha256':hashlib.sha256((folder/'rest.json').read_bytes()).hexdigest(),'preservedVertexIds':preserved.tolist(),
 'qa':{'protectedVertices':len(preserved),'sharedSeamEdges':162,'vertices':len(V),'triangles':len(F),'headShape':'original skull, forehead, occiput and jaw retained','nasalBridge':'subtle','maxNewVertexDisplacementMm':float(distance.max()*1000),'modifiedSurfaceMaxDihedralDegrees':max(angles)}}
with (folder/'geometry.json').open('x') as f: json.dump(data,f,separators=(',',':'))
print(json.dumps(data['qa']))
