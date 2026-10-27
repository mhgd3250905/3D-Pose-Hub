"""Attribute fold pixels visible only in a double-sided coverage rendering.

Reconstructs perspective rays for the saved camera and uses Trimesh unique
triangle intersections against selected saved skinned mesh snapshots. This
is CPU geometry evidence, not proof of renderer material ownership: snapshots
do not record drawRange, alpha/discard or render ordering for each mesh.
"""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
import trimesh

p=argparse.ArgumentParser(description=__doc__);p.add_argument('snapshot',type=Path);p.add_argument('camera_meta',type=Path);p.add_argument('bright',type=Path);p.add_argument('coverage',type=Path);p.add_argument('orientation',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
if a.output.exists():raise FileExistsError(a.output)
d=json.loads(a.snapshot.read_text(encoding='utf8'))['meshes'];meta=json.loads(a.camera_meta.read_text(encoding='utf8'))
names=['Coach_Body','V2P_Base_Limbs','Coach_Sneakers','Coach_Shoe_Details','Coach_Soles'];meshes={}
for name in names:
    if name not in d:continue
    m=d[name];raw=np.frombuffer(base64.b64decode(m['A']),np.float32).reshape(-1,6).astype(float);faces=np.asarray(m['idx'],int).reshape(-1,3)
    meshes[name]=trimesh.Trimesh(vertices=raw[:,:3],faces=faces,process=False)
b=np.asarray(Image.open(a.bright).convert('RGB'));c=np.asarray(Image.open(a.coverage).convert('RGB'));o=np.asarray(Image.open(a.orientation).convert('RGB'))
if b.shape!=c.shape or b.shape!=o.shape or b.shape!=(360,360,3):raise ValueError('expected three 360px images')
bright=(b[:,:,0]>235)&(b[:,:,1]<30)&(b[:,:,2]>235);covered=(c[:,:,0]>210)&(c[:,:,1]>210)&(c[:,:,2]>210);back=(o[:,:,0]>200)&(o[:,:,1]<60)&(o[:,:,2]<60)
roi=np.zeros((360,360),dtype=bool);roi[205:250,110:250]=True;ys,xs=np.where(bright&covered&back&roi)
if not len(xs):raise ValueError('no selected background/backface pixels')
origin=np.asarray(meta['camera'],float);target=np.asarray(meta['target'],float);forward=target-origin;forward/=np.linalg.norm(forward)
right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward)
ndc_x=(xs+.5)/360*2-1;ndc_y=1-(ys+.5)/360*2;tan=np.tan(np.deg2rad(22)/2)
dirs=forward[None,:]+ndc_x[:,None]*tan*right+ndc_y[:,None]*tan*up;dirs/=np.linalg.norm(dirs,axis=1)[:,None];origins=np.repeat(origin[None,:],len(xs),axis=0)
nearest=[None]*len(xs)
for name,mesh in meshes.items():
    locations,ray_ids,face_ids=mesh.ray.intersects_location(origins,dirs,multiple_hits=True)
    if not len(ray_ids):continue
    distances=np.linalg.norm(locations-origins[ray_ids],axis=1)
    for point,ri,fi,dist in zip(locations,ray_ids,face_ids,distances):
        if dist<.02:continue
        if nearest[ri] is None or dist<nearest[ri]['distanceM']:
            normal=mesh.face_normals[fi];nearest[ri]={'mesh':name,'faceId':int(fi),'distanceM':float(dist),'normalDotToCamera':float(normal@(-dirs[ri])),'point':point.tolist()}
result={'method':'saved 22-degree perspective rays for magenta-in-normal, white-in-coverage and red-in-orientation pixels','pixelCount':len(xs),'meshCounts':{},'pixels':[],
        'limitations':['saved snapshots omit per-mesh drawRange and material discard','CPU intersection may differ at rasterized edges','double-sided override can reveal a surface not rendered by the original material','does not prove a topological hole'],
        'sha256':{x.name:hashlib.sha256(x.read_bytes()).hexdigest() for x in [a.snapshot,a.camera_meta,a.bright,a.coverage,a.orientation]}}
for x,y,hit in zip(xs,ys,nearest):
    key=hit['mesh'] if hit else 'no_selected_mesh_hit';result['meshCounts'][key]=result['meshCounts'].get(key,0)+1;result['pixels'].append({'x':int(x),'y':int(y),'hit':hit})
with a.output.open('x',encoding='utf8') as f:json.dump(result,f,indent=2)
print(json.dumps({'pixels':len(xs),'meshCounts':result['meshCounts'],'output':str(a.output)}))
