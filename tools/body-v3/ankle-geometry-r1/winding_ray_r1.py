"""Evaluate legacy-flagged shoe points against open skin surfaces.

Uses Trimesh's unique ray intersections and the generalized winding number
(signed triangle solid angles). Ray parity and winding have a rigorous
inside/outside interpretation for closed consistently oriented surfaces; these
production snapshots have openings, so all real-mesh results are evidence,
not an inside/outside proof. No model or audit data is modified.

Method references: https://github.com/mikedh/trimesh/blob/main/trimesh/ray/ray_triangle.py
https://github.com/libigl/libigl/blob/main/include/igl/winding_number.h
https://libigl.github.io/libigl-python-bindings/api/igl/#igl.winding_number
Trimesh is MIT licensed; libigl core is MPL-2.0. The formula here is authored
for this experiment and does not copy libigl implementation code.
"""
import argparse,base64,hashlib,json,math
from pathlib import Path
import numpy as np
import trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

def load(path):
    d=json.loads(path.read_text(encoding='utf8'))['meshes'];out={}
    for name in ['Coach_Body','Coach_Sneakers','V2P_Base_Limbs']:
        m=d[name];a=np.frombuffer(base64.b64decode(m['A']),np.float32).reshape(-1,6).astype(float)
        out[name]=(a[:,:3],np.asarray(m['idx'],int).reshape(-1,3))
    return out

def directions(n):
    i=np.arange(n,dtype=float);z=1-2*(i+.5)/n;theta=i*math.pi*(3-math.sqrt(5));r=np.sqrt(1-z*z)
    return np.column_stack((r*np.cos(theta),r*np.sin(theta),z))

def winding(vertices,faces,point):
    a=vertices[faces[:,0]]-point;b=vertices[faces[:,1]]-point;c=vertices[faces[:,2]]-point
    la=np.linalg.norm(a,axis=1);lb=np.linalg.norm(b,axis=1);lc=np.linalg.norm(c,axis=1)
    if min(la.min(),lb.min(),lc.min())<1e-12:raise ValueError('point is on a mesh vertex')
    num=np.einsum('ij,ij->i',a,np.cross(b,c))
    den=la*lb*lc+np.einsum('ij,ij->i',a,b)*lc+np.einsum('ij,ij->i',b,c)*la+np.einsum('ij,ij->i',c,a)*lb
    return float((2*np.arctan2(num,den)).sum()/(4*math.pi))

def parity(mesh,point,dirs):
    origins=np.repeat(np.asarray(point)[None,:],len(dirs),axis=0)
    locations,ray_ids,_=mesh.ray.intersects_location(origins,dirs,multiple_hits=True)
    count=np.bincount(ray_ids,minlength=len(dirs));return {'odd':int((count%2).sum()),'even':int((count%2==0).sum()),'hitsPerRay':count.tolist()}

def topology(rest,faces):
    _,groups=np.unique(np.round(rest/1e-5).astype(np.int64),axis=0,return_inverse=True);tri=groups[faces]
    e=np.sort(np.vstack([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]]),axis=1);e=e[e[:,0]!=e[:,1]]
    unique,counts=np.unique(e,axis=0,return_counts=True);boundary=unique[counts==1]
    centers=np.zeros((groups.max()+1,3));np.add.at(centers,groups,rest);centers/=np.bincount(groups)[:,None]
    graph=coo_matrix((np.ones(len(boundary)*2),(np.r_[boundary[:,0],boundary[:,1]],np.r_[boundary[:,1],boundary[:,0]])),shape=(len(centers),len(centers))).tocsr()
    _,labels=connected_components(graph,directed=False);components=[]
    for group in np.unique(labels[boundary[:,0]]):
        selected=boundary[labels[boundary[:,0]]==group];vertices=np.unique(selected);xyz=centers[vertices]
        components.append({'edges':len(selected),'vertices':len(vertices),'boundsM':[xyz.min(axis=0).tolist(),xyz.max(axis=0).tolist()],'centerM':xyz.mean(axis=0).tolist()})
    components.sort(key=lambda x:-x['edges'])
    return {'faces':len(faces),'verticesUsed':int(len(np.unique(faces))),'weldToleranceM':1e-5,'boundaryEdges':int((counts==1).sum()),'nonManifoldEdges':int((counts>2).sum()),'boundaryComponents':components}

def tests(dirs):
    sphere=trimesh.creation.icosphere(subdivisions=2,radius=1);v,f=np.asarray(sphere.vertices),np.asarray(sphere.faces)
    inside,outside=np.zeros(3),np.array([3.,.27,.13]);wi,wo=winding(v,f,inside),winding(v,f,outside);pi,po=parity(sphere,inside,dirs),parity(sphere,outside,dirs)
    if abs(abs(wi)-1)>1e-8 or abs(wo)>1e-8 or pi['odd']!=len(dirs) or po['even']!=len(dirs):raise ValueError('closed-sphere self-test failed')
    # Expose a large cap of the test sphere and report the loss of a closed
    # classification, rather than asserting that any particular ray must miss.
    opened=f[v[f].mean(axis=1)[:,2]<.55];mesh=trimesh.Trimesh(vertices=v,faces=opened,process=False)
    return {'closedSphere':{'insideWinding':wi,'outsideWinding':wo,'insideOdd':pi['odd'],'outsideEven':po['even']},
            'openSphere':{'topology':topology(v,opened),'centerWinding':winding(v,opened,inside),'centerParity':parity(mesh,inside,dirs)}}

p=argparse.ArgumentParser(description=__doc__);p.add_argument('audit_dir',type=Path);p.add_argument('flag_report',type=Path);p.add_argument('--state',default='plank');p.add_argument('--directions',type=int,default=24);p.add_argument('--output',required=True,type=Path);a=p.parse_args()
if a.output.exists():raise FileExistsError(a.output)
if not 8<=a.directions<=64:raise ValueError('direction count must be 8–64')
dirs=directions(a.directions);selftest=tests(dirs);rest=load(a.audit_dir/'rest.json');posed=load(a.audit_dir/(a.state+'.json'));flag_data=json.loads(a.flag_report.read_text());flags=flag_data['states'][a.state]
if flag_data.get('thresholdMm')!=1:raise ValueError('expected explicit 1 mm flags')
for name in posed:
    if not np.array_equal(posed[name][1],rest[name][1]):raise ValueError('pose topology differs from rest')
bp,bf=posed['Coach_Body'];lp,lf=posed['V2P_Base_Limbs'];br,_=rest['Coach_Body'];lr,_=rest['V2P_Base_Limbs'];shoe,_=posed['Coach_Sneakers']
comb=np.vstack((bp,lp));comb_rest=np.vstack((br,lr));comb_faces=np.vstack((bf,lf+len(bp)));combined=trimesh.Trimesh(vertices=comb,faces=comb_faces,process=False)
result={'method':f'{len(dirs)}-direction unique ray parity and direct signed solid-angle sum','directionCount':len(dirs),'directions':dirs.tolist(),
        'limits':['open/non-manifold surfaces mean neither winding nor parity is conclusive','ray edge and vertex intersections are numerically sensitive','FCL open-surface contact does not test containment','winding sign depends on orientation','flag set derives from a 1 mm nearest-vertex-normal proxy'],'selfTests':selftest,
        'sources':{'restSha256':hashlib.sha256((a.audit_dir/'rest.json').read_bytes()).hexdigest(),
                   'poseSha256':hashlib.sha256((a.audit_dir/(a.state+'.json')).read_bytes()).hexdigest(),
                   'flagsSha256':hashlib.sha256(a.flag_report.read_bytes()).hexdigest(),
                   'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        'combinedTopology':topology(comb_rest,comb_faces),'limbsTopology':topology(lr,lf),'states':{}}
raw=json.loads((a.audit_dir/(a.state+'.json')).read_text(encoding='utf8'));controls={}
body_a=np.frombuffer(base64.b64decode(raw['meshes']['Coach_Body']['A']),np.float32).reshape(-1,6).astype(float)
shoe_rest=rest['Coach_Sneakers'][0];shoe_faces=posed['Coach_Sneakers'][1];shoe_used=np.unique(shoe_faces);body_used=np.unique(bf)
distance,near=cKDTree(bp[body_used]).query(shoe[shoe_used]);nearest=body_used[near]
depth=-np.einsum('ij,ij->i',shoe[shoe_used]-bp[nearest],body_a[nearest,3:]);flag_mask=(distance<.03)&(depth>.001)
for side,sign in [('left',1),('right',-1)]:
    expected=set(shoe_used[flag_mask&(shoe_rest[shoe_used,0]*sign>0)].tolist());supplied={x['shoeVertexId'] for x in flags[side]['points']}
    if expected!=supplied:raise ValueError(f'{side} flag report does not match supplied snapshot')
for name in ['leftFoot','rightFoot','leftShin','rightShin']:
    point=np.asarray(raw['bones'][name],dtype=float)
    controls[name]={'point':point.tolist(),'winding':winding(comb,comb_faces,point),'parity':parity(combined,point,dirs),'caveat':'bone-center control is anatomically suggestive, not independently proven inside'}
point=comb.max(axis=0)+np.array([1.0,1.0,1.0]);controls['farOutsideBoundingBox']={'point':point.tolist(),'winding':winding(comb,comb_faces,point),'parity':parity(combined,point,dirs)}
result['modelControls']=controls
cent=br[bf].mean(axis=1);combined_count=0
for side,sign in [('left',1),('right',-1)]:
    ids=np.array([p['shoeVertexId'] for p in flags[side]['points']],dtype=int);foot_faces=bf[(cent[:,0]*sign>0)&(cent[:,1]<.30)];foot=trimesh.Trimesh(vertices=bp,faces=foot_faces,process=False)
    side_result={'oldFlagCount':len(ids),'footTopology':topology(br,foot_faces),'points':[]}
    for shoe_id in ids:
        point=shoe[shoe_id];item={'shoeVertexId':int(shoe_id),'point':point.tolist(),'footWinding':winding(bp,foot_faces,point),'footParity':parity(foot,point,dirs),'combinedWinding':winding(comb,comb_faces,point),'combinedParity':parity(combined,point,dirs)}
        side_result['points'].append(item)
    for label in ['foot','combined']:
        wn=np.array([x[label+'Winding'] for x in side_result['points']]);odd=np.array([x[label+'Parity']['odd'] for x in side_result['points']]);
        side_result[label+'Summary']={'windingMin':float(wn.min()) if len(wn) else None,'windingMax':float(wn.max()) if len(wn) else None,'allEven':int((odd==0).sum()),'allOdd':int((odd==len(dirs)).sum()),'mixedParity':int(((odd>0)&(odd<len(dirs))).sum())}
    result['states'][side]=side_result
with a.output.open('x',encoding='utf8') as f:json.dump(result,f,indent=2)
print(json.dumps({'output':str(a.output),'combinedTopology':result['combinedTopology'],'limbsTopology':result['limbsTopology'],'selfTests':selftest,'modelControls':controls,'states':{s:{k:v for k,v in d.items() if k!='points'} for s,d in result['states'].items()}},indent=2))
