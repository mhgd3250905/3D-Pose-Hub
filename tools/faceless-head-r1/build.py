"""Build a faceless component using the repository's existing mannequin surface.
Never writes frozen model sources. Input/output are explicit preview artifacts.
"""
import json, os, sys, runpy
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree

repo = Path(__file__).resolve().parents[2]
folder = Path(sys.argv[1]).resolve()
source = json.loads((folder / 'rest.json').read_text())
V0 = np.array(source['positions']).reshape(-1, 3)
F0 = np.array(source['index']).reshape(-1, 3)
sys.path.insert(0, str(repo / 'tools/human-v2plus/torso-base'))
from meshops import vnormals
np.savez(folder / 'head_fit.npz', V=V0, F=F0, LA=np.arange(162))
for key in list(os.environ):
    if key.startswith('HD_'): del os.environ[key]
os.environ.update(HD_FACE='mannequin', HD_K_NOH='0', HD_K_CHIN='0',
                  HD_E_YC='1.475', HD_E_SNAP='0', HD_E_NA='96', HD_E_NR='72')
os.chdir(folder)
runpy.run_path(str(repo / 'tools/human-v2plus/head-base/head_e.py'), run_name='__main__')
result = np.load(folder / 'head_fit.npz')
generated, faces = result['V'], result['F']
distance, mapping = cKDTree(V0).query(generated)
# Preserve ALL original lower faces and vertex IDs, including disconnected/UV
# components discarded by the historical generator's largest-component step.
# Only borrow its new cut triangles, transition and analytic head surface.
is_new = distance >= 1e-8
ids = mapping.copy(); ids[is_new] = len(V0)+np.arange(is_new.sum())
keep = (V0[F0,1] < 1.475).all(axis=1)
add = (generated[faces,1] >= 1.475-1e-10).any(axis=1)
V = np.r_[V0, generated[is_new]]
F = np.r_[F0[keep], ids[faces[add]]]
nearest = np.r_[np.arange(len(V0)), mapping[is_new]]
exact = np.r_[np.ones(len(V0),dtype=bool),np.zeros(is_new.sum(),dtype=bool)]
retained = V0[:, 1] < 1.475
assert np.array_equal(V[:len(V0)],V0), 'Original vertex identities changed'
assert np.isfinite(V).all()
normals = vnormals(V, F)
area = np.linalg.norm(np.cross(V[F[:, 1]]-V[F[:, 0]], V[F[:, 2]]-V[F[:, 0]]), axis=1)
assert area[len(F0[keep]):].min() > 1e-13, 'New degenerate triangles'
# Carry each original material face; new head and transition faces use head material.
old_material = {}
for group in source['groups']:
    for tri in F0[group['start']//3:(group['start']+group['count'])//3]:
        old_material[tuple(sorted(tri))] = group['materialIndex']
materials = [old_material[tuple(sorted(tri))] for tri in F0[keep]]+[1]*int(add.sum())
edges = {}
for tri in F:
    for a,b in zip(tri, np.roll(tri,-1)):
        k=tuple(sorted((int(a),int(b)))); edges[k]=edges.get(k,0)+1
new_vertex_ids=set(range(len(V0),len(V)))
assert all(n<=2 for (a,b),n in edges.items() if a in new_vertex_ids or b in new_vertex_ids), 'New non-manifold edge'
seam = np.arange(162)
assert all(edges[tuple(sorted((int(seam[i]),int(seam[(i+1)%162]))))] == 2 for i in range(162))
data={'format':'pose-hub-faceless-head@1','version':'0.1.0-r1',
      'positions':V.ravel().tolist(),'normals':normals.ravel().tolist(),
      'index':F.ravel().tolist(),'nearest':nearest.tolist(),'exact':exact.tolist(),
      'faceMaterials':materials,'sourceVertices':len(V0),'sourceRestSha256':__import__('hashlib').sha256((folder/'rest.json').read_bytes()).hexdigest(),
      'preservedVertexIds':np.where(retained)[0].tolist(),
      'qa':{'retainedLowerVertices':int(retained.sum()),'sharedSeamEdges':162,
            'vertices':len(V),'triangles':len(F),'minDoubleTriangleArea':float(area.min()),
            'maxEdgeIncidence':max(edges.values()),'noseRidge':0,'eyesMouthEars':False}}
with (folder/'geometry.json').open('x') as f: json.dump(data,f,separators=(',',':'))
print(json.dumps(data['qa']))
