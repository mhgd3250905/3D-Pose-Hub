"""Diagnostic cap probe only, never a model asset or a production fix.

Clip in reset-space y, linearly interpolate each clipped edge in the current
pose, positional-weld, and cap only if exactly one simple cut boundary exists.
Validate topology and independently report FCL self-contact candidates. Output
must be new; this does not alter the source snapshots. Dependencies: numpy,
scipy, trimesh, rtree, python-fcl. Input snapshot omits drawRange.
"""
import argparse, hashlib, importlib.util, json
from pathlib import Path
import numpy as np
from scipy.spatial import Delaunay, cKDTree
import trimesh
import fcl

spec=importlib.util.spec_from_file_location('cap_feasibility',Path(__file__).with_name('cap-feasibility-r2.py'))
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)

def loop_boundary(faces,boundary):
    directed=np.vstack([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]);count={tuple(x):0 for x in map(sorted,boundary.tolist())}
    found=[]
    for a,b in directed:
        key=tuple(sorted((a,b)))
        if key in count:found.append((int(a),int(b)))
    outgoing={};incoming={}
    for a,b in found:
        if a in outgoing or b in incoming:raise ValueError('boundary is not a directed simple loop')
        outgoing[a]=b;incoming[b]=a
    start=found[0][0];loop=[start];n=outgoing[start]
    while n!=start:
        if n in loop or n not in outgoing:raise ValueError('broken boundary')
        loop.append(n);n=outgoing[n]
    if len(loop)!=len(boundary):raise ValueError('multiple boundary loops')
    return np.asarray(loop)

def in_polygon(p,poly):
    x,y=p;inside=False
    for a,b in zip(poly,np.roll(poly,-1,axis=0)):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
    return inside

def build_cap(vr,loop):
    coords=vr[loop][:,[0,2]]
    dt=Delaunay(coords);tri=dt.simplices
    tri=np.asarray([t for t in tri if in_polygon(coords[t].mean(axis=0),coords)])
    if not len(tri):raise ValueError('empty cap')
    u=coords[tri[:,1]]-coords[tri[:,0]];v=coords[tri[:,2]]-coords[tri[:,0]];cross=u[:,0]*v[:,1]-u[:,1]*v[:,0]
    # Cap must traverse every original boundary edge opposite to the skin.
    skin_area=np.sum(coords[:,0]*np.roll(coords[:,1],-1)-np.roll(coords[:,0],-1)*coords[:,1])
    if skin_area==0:raise ValueError('zero-area loop')
    flip=np.sign(cross)==np.sign(skin_area)
    tri[flip]=tri[flip][:,[0,2,1]]
    return loop[tri]

def self_contacts(vertices,faces):
    model=fcl.BVHModel();model.beginModel(len(vertices),len(faces));model.addSubModel(vertices.astype(float),faces.astype(np.int32));model.endModel()
    obj=fcl.CollisionObject(model);request=fcl.CollisionRequest(num_max_contacts=150000,enable_contact=True);result=fcl.CollisionResult();fcl.collide(obj,obj,request,result)
    pairs=set()
    for contact in result.contacts:
        i,j=int(contact.b1),int(contact.b2)
        if i<0 or j<0 or i==j or len(set(faces[i])&set(faces[j])):continue
        pairs.add(tuple(sorted((i,j))))
    face_ids=np.unique(np.asarray(sorted(pairs)).ravel()) if pairs else np.array([],dtype=int)
    verts=vertices[faces[face_ids]].reshape(-1,3)
    return {'allContacts':len(result.contacts),'truncated':len(result.contacts)>=150000,'nonAdjacentFacePairs':len(pairs),'samplePairs':sorted(pairs)[:20], 'involvedFaceIds':face_ids.tolist(), 'worldBoundsM':[verts.min(axis=0).tolist(),verts.max(axis=0).tolist()] if len(verts) else None}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('audit_dir',type=Path);p.add_argument('flags',type=Path);p.add_argument('--output',type=Path,required=True);p.add_argument('--tolerance-m',type=float,default=1e-5);a=p.parse_args()
    if a.output.exists():raise FileExistsError(a.output)
    rest=base.load(a.audit_dir/'rest.json');pose=base.load(a.audit_dir/'plank.json');flags=json.loads(a.flags.read_text())['states']['plank'];shoe=pose['Coach_Sneakers'][0]
    d={'purpose':'experimental audit solid, never production geometry','limits':['snapshot indices omit drawRange','weld is positional and must be verified against seam identities','rest cap is planar; posed cap is an edge-interpolated artificial surface','FCL contact list is not a mathematical guarantee of no self-intersections','result applies only to sampled flagged points in the sampled pose'], 'inputSha256':{str(x):hashlib.sha256(x.read_bytes()).hexdigest() for x in [a.audit_dir/'rest.json',a.audit_dir/'plank.json',a.flags]},'cases':{}}
    for side,sign in [('left',1),('right',-1)]:
        ids=np.asarray([x['shoeVertexId'] for x in flags[side]['points']],dtype=int);points=shoe[ids]
        for cut in [.20,.25]:
            name=f'{side}-{cut:.2f}';r,vr,vp,faces,boundary=base.construct(rest,pose,sign,cut,a.tolerance_m,True)
            case={'preCap':r};d['cases'][name]=case
            try:
                loop=loop_boundary(faces,boundary);caps=build_cap(vr,loop);allfaces=np.vstack([faces,caps]);mesh=trimesh.Trimesh(vertices=vp,faces=allfaces,process=False)
                case['cap']={'boundaryVertices':len(loop),'faces':len(caps),'watertight':bool(mesh.is_watertight),'windingConsistent':bool(mesh.is_winding_consistent),'volumeM3':float(mesh.volume),'nonManifoldAfterCap':int(np.sum(np.unique(np.sort(mesh.edges,axis=1),axis=0,return_counts=True)[1]>2))}
                case['selfContacts']=self_contacts(vp,allfaces)
                capmesh=trimesh.Trimesh(vertices=vp,faces=caps,process=False)
                closest,dist,_=trimesh.proximity.closest_point(capmesh,points)
                case['capDistanceMmRange']=[float(dist.min()*1000),float(dist.max()*1000)]
                if mesh.is_watertight and mesh.is_winding_consistent:
                    inside=mesh.contains(points);_,nearest,_=trimesh.proximity.closest_point(mesh,points)
                    ids_problem=case['selfContacts']['involvedFaceIds'];problem=trimesh.Trimesh(vertices=vp,faces=allfaces[ids_problem],process=False)
                    _,to_problem,_=trimesh.proximity.closest_point(problem,points) if ids_problem else (None,np.full(len(points),np.inf),None)
                    strict=not case['selfContacts']['truncated'] and case['selfContacts']['nonAdjacentFacePairs']==0
                    case['exploratoryClassification']={'strictlyValid':strict,'warning':None if strict else 'not a proof: FCL self-contacts or truncated search','inside':int(inside.sum()),'outside':int((~inside).sum()),'nearestDistanceMmRange':[float(nearest.min()*1000),float(nearest.max()*1000)],'distanceToSelfContactFacesMmRange':[float(to_problem.min()*1000),float(to_problem.max()*1000)],'perPoint':[{'shoeVertexId':int(i),'inside':bool(c),'nearestDistanceMm':float(n*1000),'capDistanceMm':float(z*1000)} for i,c,n,z in zip(ids,inside,nearest,dist)]}
            except Exception as exc:case['error']=str(exc)
            print(name,case.get('cap'),case.get('selfContacts'),{k:v for k,v in case.get('exploratoryClassification',{}).items() if k!='perPoint'},flush=True)
    with a.output.open('x',encoding='utf8') as f:json.dump(d,f,indent=2)
if __name__=='__main__':main()
