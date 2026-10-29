"""Read-only sections of captured actual body neutral and frozen static WebXR hand."""
import argparse,json,hashlib,math
from pathlib import Path
import numpy as np
import check as Q

def sections(P,F,cut):
 signed=P[:,1]-cut;selected=np.flatnonzero((signed[F].min(1)<=0)&(signed[F].max(1)>=0));verts=[];lookup={};edges=set();face_ids=[]
 def index(p):
  key=tuple(np.rint(p/1e-8).astype(int))
  if key not in lookup:lookup[key]=len(verts);verts.append(p)
  return lookup[key]
 for face in selected:
  ids=F[face];points=[]
  for a,b in zip(ids,np.roll(ids,-1)):
   da,db=signed[a],signed[b]
   if abs(da)<1e-12:points.append(P[a])
   if da*db<0:points.append(P[a]+(P[b]-P[a])*(da/(da-db)))
  unique=[]
  for point in points:
   if not any(np.linalg.norm(point-q)<1e-9 for q in unique):unique.append(point)
  if len(unique)==2:
   a,b=map(index,unique)
   if a!=b:edges.add(tuple(sorted([a,b])));face_ids.append(int(face))
 if not edges:return {'cutMm':cut*1000,'loops':[],'intersectionFaces':[]}
 neighbors={i:set()for i in range(len(verts))}
 for a,b in edges:neighbors[a].add(b);neighbors[b].add(a)
 todo=set(neighbors);loops=[];V=np.asarray(verts)
 while todo:
  start=min(todo);component=set([start]);stack=[start]
  while stack:
   for j in neighbors[stack.pop()]:
    if j not in component:component.add(j);stack.append(j)
  todo-=component;closed=all(len(neighbors[i])==2 for i in component);order=[]
  if closed:
   previous=None;i=start
   while i not in order:
    order.append(i);nexts=neighbors[i]-({previous}if previous is not None else set());previous,i=i,min(nexts)
  else:order=sorted(component)
  points=V[order];cross=points[:,[0,2]];lo=cross.min(0);hi=cross.max(0);center=(lo+hi)/2;length=float(sum(np.linalg.norm(V[a]-V[b])for a,b in edges if a in component));radius=float(np.linalg.norm(cross-center,axis=1).max())
  loops.append({'closed':closed,'vertices':len(points),'perimeterMm':length*1000,'crossCenterMm':(center*1000).tolist(),'widthAcrossThumbLittleMm':float((hi[0]-lo[0])*1000),'palmarDorsalThicknessMm':float((hi[1]-lo[1])*1000),'axisAlignedSemiaxesMm':((hi-lo)*500).tolist(),'maximumRadialDistanceFromCrossCenterMm':radius*1000,'pointsCanonicalMm':(points*1000).tolist()})
 return {'cutMm':cut*1000,'loops':sorted(loops,key=lambda r:-r['perimeterMm']),'intersectionFaces':face_ids}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--qa-root',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args();old=a.qa_root/'wrist-candidate-share0-r2';ref=Q.load(old/'mesh-reference.json');neutral=Q.load(old/'flex-0-twist-0.json');hand_path=a.qa_root/'webxr-grasp-r1/reference-power-grip-r1/contact-corrective-r1/left-grasp.json';hand=Q.load(hand_path);H=Q.points(hand['positions']);HF=np.asarray(hand['indices']).reshape(-1,3)
 sources=[old/'mesh-reference.json',old/'flex-0-twist-0.json',hand_path];report={'format':'pose-hub-webxr-wrist-independent-measures@1','sources':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sources],'neutralEvidence':{'renderTime':neutral['renderTime'],'command':neutral['command'],'correctiveMaxDisplacementMm':neutral['correctiveDiagnostics']['maxDisplacementMm'],'seam':neutral['seam']},'mapping':{},'bodySections':{},'handSections':[]}
 for side,sign in [('left',1),('right',-1)]:
  # Column vectors are canonical across(+X), longitudinal(+Y), palmar(+Z) in body hand-bone local coordinates.
  C=np.array([[0,sign,0],[0,0,-1],[-sign,0,0]],float);W=np.asarray(neutral['frames'][side]['handMatrixWorld']).reshape(4,4,order='F');Winv=np.linalg.inv(W)
  local=(np.c_[Q.points(neutral['limbWorld']),np.ones(len(neutral['limbWorld'])//3)]@Winv.T)[:,:3];canonical=local@C
  ids=np.asarray(ref['limbs']['sides'][side]['ids']);F=np.asarray(ref['limbs']['index']).reshape(-1,3);F=F[np.any(np.isin(F,ids),axis=1)]
  old_hand_local=(np.c_[Q.points(neutral['world']),np.ones(len(neutral['world'])//3)]@Winv.T)[:,:3];old_hand=old_hand_local@C;idsH=np.asarray(ref['sides'][side]['ids']);Fh=np.asarray(ref['index']).reshape(-1,3);Fh=Fh[np.any(np.isin(Fh,idsH),axis=1)]
  stored=np.asarray(ref['limbs']['sides'][side]['restLocal']).reshape(-1,3);actual=local[ids].copy();actual[:,0]*=sign
  report['mapping'][side]={'canonicalToBodyHandLocalRowMajor':C.tolist(),'determinant':float(np.linalg.det(C)),'orthonormalMaxError':float(np.max(np.abs(C.T@C-np.eye(3)))),'canonicalForwardInBodyHandLocal':C[:,1].tolist(),'canonicalPalmarInBodyHandLocal':C[:,2].tolist(),'canonicalAcrossInBodyHandLocal':C[:,0].tolist(),'neutralHandWorldMatrixColumnMajor':W.flatten(order='F').tolist(),'storedVsActualNeutralLimbLocalMaxMm':float(np.linalg.norm(stored-actual,axis=1).max()*1000),'meaning':'Bone-local rotation; does not imply body world+X in the captured arms-down pose. Right uses the separately mirrored canonical hand.'}
  combined=np.vstack([canonical,old_hand]);combined_faces=np.vstack([F,Fh+len(canonical)]);snap=[]
  for hi,li in ref['limbs']['seamPairs']:
   snap.append(float(np.linalg.norm(combined[li]-combined[len(canonical)+hi])*1000));combined[li]=combined[len(canonical)+hi]
  report['bodySections'][side]={'forearm':{str(cut):sections(canonical,F,cut/1000)for cut in [-35,-30,-28,-25,-22,-20,-18,-15,0]},'legacyHandCollar':{str(cut):sections(old_hand,Fh,cut/1000)for cut in [-30,-25,-22,-20,-18,-15,0]},'combinedWeldedForMeasurement':{str(cut):sections(combined,combined_faces,cut/1000)for cut in [-40,-35,-30,-28,-25,-22,-20,-18,-15,0]},'seamMeasurementSnap':{'maxMm':max(snap),'method':'Use explicit captured seamPairs, snap limb endpoint to matched hand endpoint in measurement copy only. Original inputs unchanged. This removes <=capture precision seam residual from ring connectivity.'}}
 for cut in [-15,0,10,15,18,20,22,24,25,28,30,35,40]:report['handSections'].append(sections(H,HF,cut/1000))
 si=np.asarray(hand['skinIndex']).reshape(-1,4);sw=np.asarray(hand['skinWeight']).reshape(-1,4);names=np.array(hand['jointNames']);dom=names[si[np.arange(len(H)),sw.argmax(1)]];thumb=np.char.startswith(dom,'thumb');joints=Q.get_matrices(hand,'posed');report['handBranchEvidence']={'firstThumbDominantVertexYmm':float(H[thumb,1].min()*1000),'thumbCmcMm':(joints['thumb-metacarpal'][:3,3]*1000).tolist(),'thumbMcpMm':(joints['thumb-phalanx-proximal'][:3,3]*1000).tolist(),'allHandBoundsMm':{'min':(H.min(0)*1000).tolist(),'max':(H.max(0)*1000).tolist()},'warning':'Thumb-dominant vertex onset is a conservative anatomical clue, not alone a topological branch proof; inspect cross-section loops and preserve all distal geometry.'}
 report['circularBendReference']=[{'equalCutDistanceMm':d,'absoluteFlexDegrees':angle,'tangentFilletRadiusMm':d/math.tan(math.radians(angle)/2),'arcLengthMm':d/math.tan(math.radians(angle)/2)*math.radians(angle),'neutralStraightBandLengthMm':2*d,'formula':'Equal distances from hinge along incoming/outgoing tangents: R=d*cot(theta/2). Curve regularity additionally needs R>inner cross-section support radius.'}for d in [18,20,22,25]for angle in [60,75]]
 report['limits']=['Read-only geometric measurements, not a built or GPU-validated wrist join.','Only captured neutral poses are used. Combined bend/twist requires later exact render-time grid and collision QA.','Cross sections preserve the actual surface; reported ellipse semiaxes are axis-aligned half extents, not a claim that either source loop is exactly elliptical.']
 with a.output.open('x',encoding='utf-8')as f:json.dump(report,f,indent=2)
 for side,data in report['bodySections'].items():
  for mesh,values in data.items():
   if mesh!='seamMeasurementSnap':print(side,mesh,{k:[(r['closed'],r['vertices'],round(r['widthAcrossThumbLittleMm'],2),round(r['palmarDorsalThicknessMm'],2),np.round(r['crossCenterMm'],2).tolist())for r in v['loops']]for k,v in values.items()})
 print('hand',{r['cutMm']:[(x['closed'],x['vertices'],round(x['widthAcrossThumbLittleMm'],2),round(x['palmarDorsalThicknessMm'],2),np.round(x['crossCenterMm'],2).tolist())for x in r['loops']]for r in report['handSections']});print(report['handBranchEvidence'])

if __name__=='__main__':main()
