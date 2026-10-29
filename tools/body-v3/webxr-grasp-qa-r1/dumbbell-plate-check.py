"""All-hand triangle checks against captured finite project dumbbell surfaces.

Actual mesh orientation/hexagonal roll comes from the renderer's exported surfaces.
Convex clipping includes triangle interiors and completely contained triangles.
"""
import argparse,json,hashlib
from pathlib import Path
import numpy as np
from scipy.spatial import ConvexHull
import check as Q

def clip(poly,normal,offset):
 if not len(poly):return poly
 out=[];previous=poly[-1];pd=previous@normal+offset
 for current in poly:
  cd=current@normal+offset
  if (cd<=0)!=(pd<=0):out.append(previous+(current-previous)*pd/(pd-cd))
  if cd<=0:out.append(current)
  previous=current;pd=cd
 return np.asarray(out).reshape(-1,3)

def clipped(triangle,planes,erosion=0):
 poly=triangle
 for plane in planes:
  poly=clip(poly,plane[:3],plane[3]+erosion)
  if not len(poly):break
 return poly

def convex_penetration(triangles,planes):
 depths=np.zeros(len(triangles));intersects=[]
 for i,triangle in enumerate(triangles):
  if np.any(np.min(triangle@planes[:,:3].T+planes[:,3],axis=0)>1e-10):continue
  if not len(clipped(triangle,planes)):continue
  intersects.append(i);low=0.;high=.1
  for _ in range(27):
   mid=(low+high)/2
   if len(clipped(triangle,planes,mid)):low=mid
   else:high=mid
  depths[i]=low
 return depths,intersects

def triangle_surface_gap(A,B):
 aa=np.repeat(np.arange(len(A)),len(B));bb=np.tile(np.arange(len(B)),len(A));x=A[aa];y=B[bb];best=np.full(len(aa),np.inf)
 for k in range(3):best=np.minimum(best,Q.point_triangle_d2(x[:,k],y));best=np.minimum(best,Q.point_triangle_d2(y[:,k],x))
 for i in range(3):
  for j in range(3):best=np.minimum(best,Q.segment_segment_d2(x[:,i],x[:,(i+1)%3],y[:,j],y[:,(j+1)%3]))
 best[Q.proper_intersections(x,y)]=0;k=int(np.argmin(best))
 return {'minSurfaceGapMm':float(np.sqrt(max(0,best[k]))*1000),'closestFacePair':[int(aa[k]),int(bb[k])]}

def analyze(data,surfaces):
 for key in ['center','axis','radius','halfLength']:
  if not np.allclose(np.asarray(data['cylinder'][key]),np.asarray(surfaces['cylinder'][key]),atol=1e-12,rtol=0):raise ValueError('Surface capture cylinder frame mismatch: '+key)
 if data['cylinder']['radius']!=.016 or data['cylinder']['halfLength']!=.0825:raise ValueError('Must use finite project32mm x165mm handle')
 P=Q.points(data['positions']);F=np.asarray(data['indices']).reshape(-1,3);tri=P[F];axis=Q.unit(data['cylinder']['axis']);center=np.asarray(data['cylinder']['center']);axial=(P-center)@axis;meshes={m['name']:m for m in surfaces['meshes']}
 if set(meshes)!=set(['shaft','plate_minus','plate_plus']):raise ValueError('Expected complete shaft and two plates')
 results={}
 for name,mesh in meshes.items():
  V=Q.points(mesh['positions']);I=np.asarray(mesh['indices']).reshape(-1,3);Qtri=V[I];z=(V-center)@axis;radial=np.linalg.norm(V-center-z[:,None]*axis,axis=1);plate=name!='shaft';target_radius=.042 if plate else .016;target_extent=.060 if plate else .165;target_center=(-.111 if name=='plate_minus' else .111)if plate else 0
  if abs(radial.max()-target_radius)>1e-7 or abs(np.ptp(z)-target_extent)>1e-7 or abs((z.max()+z.min())/2-target_center)>1e-7:raise ValueError('Actual prop geometry differs from source dimensions: '+name)
  hull=ConvexHull(np.unique(V,axis=0));planes=hull.equations;depth,intersects=convex_penetration(tri,planes);gap=triangle_surface_gap(tri,Qtri)
  results[name]={'actualCircumradiusMm':float(radial.max()*1000),'actualAxialRangeMm':[float(z.min()*1000),float(z.max()*1000)],'maxTriangleInteriorPenetrationMm':float(depth.max()*1000),'penetratingHandFacesAbove0_1mm':np.flatnonzero(depth>.0001).tolist(),'intersectingOrTouchingHandFaces':intersects,'penetrationWithin0_1mm':bool(depth.max()<=.0001),**gap}
  if name=='shaft':
   groups={f+'Whole':data['vertexGroups'][f] for f in Q.FINGERS}
   groups.update({f+'Distal':data['vertexGroups']['distal'][f] for f in Q.FINGERS});groups.update({key:data['vertexGroups'][key]for key in ['palm','thumbPad']})
   contacts={}
   for group,ids in groups.items():
    selected=np.flatnonzero(np.sum(np.isin(F,ids),axis=1)>=2)
    if not len(selected):contacts[group]={'status':'notMeasured'};continue
    contact=triangle_surface_gap(tri[selected],Qtri);contact['closestFacePair'][0]=int(selected[contact['closestFacePair'][0]]);contacts[group]={**contact,'within1mm':contact['minSurfaceGapMm']<=1}
   results[name]['actualFacetedSurfaceContacts']=contacts
 shift=float((axial.min()+axial.max())/2)
 return {'format':'pose-hub-finite-dumbbell-surface-qa@1','testedHandVertices':len(P),'testedHandFaces':len(F),'allFacesIncluded':True,'finiteSurfaces':results,'axialClearance':{'wholeHandRangeMm':[float(axial.min()*1000),float(axial.max()*1000)],'negativePlateInnerPlaneGapMm':float((axial.min()+.081)*1000),'positivePlateInnerPlaneGapMm':float((.081-axial.max())*1000),'conservativeBalancedCenterShiftAlongAxisMm':shift*1000,'conservativeBalancedInnerPlaneGapMm':float((.081-(axial.max()-axial.min())/2)*1000),'candidateMutationPerformed':False},'method':'All hand triangles; exact convex-polyhedron clipping and27-step erosion depth. Exact triangle vertex/face and edge/edge surface separation against renderer-exported finite faceted shaft and hexagonal plates. No thumb/thenar exclusions. Axial inner-plane gaps are conservative whole-hand bounds; full finite mesh metrics govern collision.','limitations':['These are surface separation/collision tests, not force or friction simulation.','Axial recentering recommendation must be applied explicitly and recaptured; this checker does not move the prop.']}

def tests():
 V=np.array([[x,y,z]for x in [-.01,.01]for y in [-.01,.01]for z in [-.01,.01]],float);planes=ConvexHull(V).equations
 triangle=np.array([[[-.02,-.02,0],[.02,-.02,0],[0,.02,0]]],float);depth,_=convex_penetration(triangle,planes);assert abs(depth[0]-.01)<1e-8 # triangle interior penetrates, all vertices outside
 outside=triangle+np.array([0,0,2]);depth,hit=convex_penetration(outside,planes);assert depth[0]==0 and not hit
 contained=np.array([[[0,0,0],[.001,0,0],[0,.001,0]]]);depth,_=convex_penetration(contained,planes);assert abs(depth[0]-.01)<1e-8
 a=np.array([[[0,0,0],[1,0,0],[0,1,0]]],float);b=a+[0,0,.005];assert abs(triangle_surface_gap(a,b)['minSurfaceGapMm']-5)<1e-8
 print('4 finite-prop geometry checks passed')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('candidate',nargs='?',type=Path);ap.add_argument('--surfaces',type=Path);ap.add_argument('--output',type=Path);ap.add_argument('--self-test',action='store_true');a=ap.parse_args()
 if a.self_test:tests();return
 if not all([a.candidate,a.surfaces,a.output]):ap.error('candidate --surfaces --output required')
 report=analyze(Q.load(a.candidate),Q.load(a.surfaces));report['inputs']={k:{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for k,p in [('candidate',a.candidate),('surfaces',a.surfaces)]}
 with a.output.open('x',encoding='utf-8')as f:json.dump(report,f,indent=2)
 print(json.dumps({k:report[k]for k in ['finiteSurfaces','axialClearance']},indent=2))

if __name__=='__main__':main()
