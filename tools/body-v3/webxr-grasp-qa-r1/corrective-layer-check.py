"""Independent QA for the single explicitly declared static contact layer."""
import argparse,json,hashlib
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
import check as Q
import tight_compare as TC

def angles(a,b):
 a=a/np.linalg.norm(a,axis=1)[:,None];b=b/np.linalg.norm(b,axis=1)[:,None]
 return np.degrees(np.arccos(np.clip(np.einsum('ij,ij->i',a,b),-1,1)))

def ray_exit(P,F,origin,direction,exclude):
 tri=P[F];e1=tri[:,1]-tri[:,0];e2=tri[:,2]-tri[:,0];h=np.cross(np.broadcast_to(direction,e2.shape),e2);det=np.einsum('ij,ij->i',e1,h);valid=np.abs(det)>1e-14;inv=np.divide(1,det,out=np.zeros_like(det),where=valid);s=origin-tri[:,0];u=inv*np.einsum('ij,ij->i',s,h);vraw=np.cross(s,e1);v=inv*(vraw@direction);t=inv*np.einsum('ij,ij->i',e2,vraw);outward=np.cross(e1,e2)@direction
 valid&=(u>=-1e-8)&(v>=-1e-8)&(u+v<=1+1e-8)&(t>1e-5)&(outward>1e-12)&~exclude
 return float(t[valid].min())if np.any(valid)else None

def main():
 ap=argparse.ArgumentParser();ap.add_argument('candidate',type=Path);ap.add_argument('--source-dir',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args();d=Q.load(a.candidate);pre=Q.corrective_source(d);proof=Q.corrective_proof(d,a.source_dir)
 P=Q.points(pre['positions']);S=Q.points(d['positions']);R=Q.points(d['originalPositions']);N=Q.points(pre['normals']);NN=Q.points(d['normals']);F=np.asarray(d['indices']).reshape(-1,3);delta=np.linalg.norm(S-P,axis=1);changed=np.flatnonzero(delta>0);affected=np.flatnonzero(np.any(np.isin(F,changed),axis=1));weld=Q.weld_ids(R)
 def faces(X):return np.cross(X[F[:,1]]-X[F[:,0]],X[F[:,2]]-X[F[:,0]])
 old=faces(P);new=faces(S);ratio=np.linalg.norm(new,axis=1)/np.linalg.norm(old,axis=1);face_angle=angles(old,new);normal_angle=angles(N,NN)
 _,_,_,skin=Q.read_glb_mesh(a.source_dir/'webxr-left.glb',full=True);M=np.asarray(pre['rawToCanonical']).reshape(4,4);rest_normals=skin['normals']@np.linalg.inv(M[:3,:3]);rest_normals/=np.linalg.norm(rest_normals,axis=1)[:,None]
 moving=[i for i,n in enumerate(skin['jointNames'])if n!='wrist'and not n.endswith('metacarpal')and not n.startswith('thumb')];influence=(skin['skinWeight']*np.isin(skin['skinIndex'],moving)).sum(1);protected=(influence==0)|((rest_normals[:,2]<-.35)&np.isin(np.arange(len(P)),d['vertexGroups']['palm']))
 # Measure source-weld seams directly, including distinct indexed duplicate vertices.
 pairs=np.asarray(sorted(cKDTree(R).query_pairs(1e-7)),int);seam=lambda X:float(np.linalg.norm(X[pairs[:,0]]-X[pairs[:,1]],axis=1).max()*1000)
 axis=Q.unit(d['cylinder']['axis']);center=np.asarray(d['cylinder']['center']);thickness=[]
 for i in changed:
  radial=S[i]-center-axis*np.dot(S[i]-center,axis);direction=radial/np.linalg.norm(radial);exclude=np.any(weld[F]==weld[i],axis=1);before=ray_exit(P,F,P[i],direction,exclude);after=ray_exit(S,F,S[i],direction,exclude)
  thickness.append({'vertex':int(i),'preMm':None if before is None else before*1000,'postMm':None if after is None else after*1000,'deltaMm':None if before is None or after is None else(after-before)*1000})
 valid=[t for t in thickness if t['preMm']is not None and t['postMm']is not None]
 # Geometric normals near the rod should face the rod (opposite its radial direction).
 basis,c=Q.cylinder_frame(d['cylinder']);local=(S-c)@basis.T;contact=[]
 for face in affected:
  gap,witness=Q.sidewall_gap(local[F[face]],d['cylinder']['radius'],d['cylinder']['halfLength'])
  if gap>.001 or witness is None:continue
  radial=np.array([witness[0],witness[1],0.]);radial=radial/np.linalg.norm(radial);radial=radial@basis;normal=new[face]/np.linalg.norm(new[face]);contact.append({'face':int(face),'gapMm':gap*1000,'outwardNormalDotRodRadial':float(normal@radial)})
 report={'format':'pose-hub-single-contact-corrective-independent-qa@1','candidate':{'path':str(a.candidate),'sha256':hashlib.sha256(a.candidate.read_bytes()).hexdigest()},'provenance':proof,'changedVertices':changed.tolist(),'affectedFaces':affected.tolist(),'geometry':{'changedVerticesCount':len(changed),'affectedFacesCount':len(affected),'maxDisplacementMm':float(delta.max()*1000),'minimumFaceAreaRatioToPre':float(ratio.min()),'maximumFaceNormalRotationDegrees':float(face_angle.max()),'faceFlipsOver90Degrees':np.flatnonzero(face_angle>=90).tolist(),'facesAreaRatioBelow0_1':np.flatnonzero(ratio<.1).tolist()},'protectedSourceMask':{'definition':'Zero original long-finger phalanx influence OR original source palm-group dorsal normal.z<-.35; independently recomputed from authoritative GLB.','count':int(protected.sum()),'maxPositionChangeMm':float(delta[protected].max()*1000),'normalsExactlyUnchanged':bool(np.array_equal(N[protected],NN[protected]))},'normals':{'changedVerticesCount':int(np.any(N!=NN,axis=1).sum()),'maxUnitLengthError':float(np.max(np.abs(np.linalg.norm(NN,axis=1)-1))),'maxRotationDegrees':float(normal_angle.max()),'p95RotationDegrees':float(np.quantile(normal_angle,.95))},'sourceWeldSeams':{'pairs':len(pairs),'preMaxGapMm':seam(P),'postMaxGapMm':seam(S)},'affectedContactGeometricNormals':contact,'localRadialThickness':{'method':'For each changed source vertex, cast fixed post radial direction away from rod into hand; first outward-facing exit excluding incident source-weld faces. Diagnostic local thickness, not a full volume proof.','measuredVertices':len(valid),'notMeasuredVertices':len(thickness)-len(valid),'minPreMm':min(t['preMm']for t in valid),'minPostMm':min(t['postMm']for t in valid),'maximumReductionMm':max(-t['deltaMm']for t in valid),'values':thickness}}
 with a.output.open('x',encoding='utf-8')as f:json.dump(report,f,indent=2)
 print(json.dumps({k:v for k,v in report.items()if k in ['geometry','protectedSourceMask','normals','sourceWeldSeams']},indent=2));print(json.dumps({k:v for k,v in report['localRadialThickness'].items()if k!='values'},indent=2));print('Contact faces:',len(contact),'normal dot range:',min(x['outwardNormalDotRodRadial']for x in contact),max(x['outwardNormalDotRodRadial']for x in contact))

if __name__=='__main__':main()
