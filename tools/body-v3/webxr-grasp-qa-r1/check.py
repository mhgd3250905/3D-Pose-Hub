"""Independent fixed-WebXR-grasp CPU QA. Read-only inputs, exclusive-create report.
All distances are metres internally. No pose, source geometry, weight or candidate edits.
"""
import argparse,hashlib,json,math,struct
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree

FINGERS=['thumb','index','middle','ring','little']
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def points(a):return np.asarray(a,dtype=float).reshape(-1,3)
def unit(a):
 n=np.linalg.norm(a)
 if not np.isfinite(n) or n<1e-12:raise ValueError('Invalid direction')
 return np.asarray(a,dtype=float)/n

def cylinder_frame(cylinder):
 z=unit(cylinder['axis']);seed=np.eye(3)[np.argmin(np.abs(z))];x=unit(np.cross(seed,z));y=np.cross(z,x)
 return np.array([x,y,z]),np.asarray(cylinder['center'],float)

def clip_axis(poly,limit,sign):
 if len(poly)==0:return poly
 out=[];previous=poly[-1];pd=sign*previous[2]-limit
 for p in poly:
  d=sign*p[2]-limit
  if (d<=0)!=(pd<=0):out.append(previous+(p-previous)*(pd/(pd-d)))
  if d<=0:out.append(p)
  previous=p;pd=d
 return np.asarray(out,float).reshape(-1,3)
def clip_slab(poly,half):return clip_axis(clip_axis(poly,half,1),half,-1)

def radial_closest(poly):
 if len(poly)==0:return math.inf,None
 best=math.inf;point=None
 if len(poly)>=3:
  # Projected polygon is convex (it is a triangle clipped by two planes).
  for k in range(1,len(poly)-1):
   a,b,c=poly[0],poly[k],poly[k+1];matrix=np.column_stack([b[:2]-a[:2],c[:2]-a[:2]])
   if abs(np.linalg.det(matrix))<1e-16:continue
   uv=np.linalg.solve(matrix,-a[:2])
   if min(uv)>=-1e-10 and uv.sum()<=1+1e-10:return 0.,a+uv[0]*(b-a)+uv[1]*(c-a)
 for i,a in enumerate(poly):
  b=poly[(i+1)%len(poly)];d=b-a;den=np.dot(d[:2],d[:2]);t=np.clip(-np.dot(a[:2],d[:2])/den,0,1) if den>1e-20 else 0.;p=a+t*d;r=np.linalg.norm(p[:2])
  if r<best:best=float(r);point=p
 return best,point

def triangle_cylinder_penetration(triangle,radius,half):
 poly=clip_slab(triangle,half);minimum,witness=radial_closest(poly)
 if minimum>=radius-1e-10:return 0.,None
 # A point is at least t inside a capped cylinder iff it lies in the
 # eroded cylinder radius(r-t), halfLength(h-t). Bisection is exact to tolerance.
 low=0.;high=min(radius,half)
 for _ in range(26):
  mid=(low+high)*.5;poly=clip_slab(triangle,half-mid);r,p=radial_closest(poly)
  if r<=radius-mid:low=mid;witness=p
  else:high=mid
 return low,witness

def sidewall_gap(triangle,radius,half):
 poly=clip_slab(triangle,half)
 if not len(poly):return math.inf,None
 low,p=radial_closest(poly);r=np.linalg.norm(poly[:,:2],axis=1);high=float(r.max())
 if low<=radius<=high:return 0.,p # surface crosses side wall; penetration is reported independently
 if low>radius:return low-radius,p
 k=int(r.argmax());return radius-high,poly[k]

def proper_intersections(a,b):
 hit=np.zeros(len(a),bool)
 for segments,triangles in [(a,b),(b,a)]:
  e1=triangles[:,1]-triangles[:,0];e2=triangles[:,2]-triangles[:,0]
  for k in range(3):
   p=segments[:,k];direction=segments[:,(k+1)%3]-p;h=np.cross(direction,e2);det=np.einsum('ij,ij->i',e1,h);valid=np.abs(det)>1e-13;inv=np.zeros_like(det);inv[valid]=1/det[valid];s=p-triangles[:,0];u=inv*np.einsum('ij,ij->i',s,h);q=np.cross(s,e1);v=inv*np.einsum('ij,ij->i',direction,q);t=inv*np.einsum('ij,ij->i',e2,q)
   hit|=valid&(u>1e-7)&(v>1e-7)&(u+v<1-1e-7)&(t>1e-7)&(t<1-1e-7)
 return hit

def cross2(a,b):return a[0]*b[1]-a[1]*b[0]

def polygon_area(poly):
 if len(poly)<3:return 0.
 return abs(float(np.sum(poly[:,0]*np.roll(poly[:,1],-1)-poly[:,1]*np.roll(poly[:,0],-1))))*.5

def coplanar_overlap(a,b):
 n=np.cross(a[1]-a[0],a[2]-a[0]);length=np.linalg.norm(n)
 if length<1e-14:return False
 n/=length
 if np.max(np.abs((b-a[0])@n))>1e-8:return False
 dim=int(np.argmax(np.abs(n)));p=np.delete(a,dim,axis=1);q=np.delete(b,dim,axis=1)
 orientation=np.sign(cross2(q[1]-q[0],q[2]-q[0]))
 if orientation==0:return False
 for i in range(3):
  if len(p)==0:return False
  origin=q[i];edge=q[(i+1)%3]-origin;out=[];previous=p[-1];pd=orientation*cross2(edge,previous-origin)
  for point in p:
   d=orientation*cross2(edge,point-origin)
   if (d>=0)!=(pd>=0):out.append(previous+(point-previous)*(pd/(pd-d)))
   if d>=0:out.append(point)
   previous=point;pd=d
  p=np.array(out).reshape(-1,2)
 return polygon_area(p)>1e-12

def weld_ids(rest,epsilon=1e-7):
 # Weld source-rest coincidences only; never weld posed collisions away.
 parent=np.arange(len(rest))
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for i,j in cKDTree(rest).query_pairs(epsilon):
  x,y=find(i),find(j)
  if x!=y:parent[max(x,y)]=min(x,y)
 return np.array([find(i) for i in range(len(rest))])

def self_crossings(positions,faces,weld):
 tri=positions[faces];lo=tri.min(1);hi=tri.max(1);adj=weld[faces];aa=[];bb=[];order=np.arange(len(faces))
 for i in range(len(faces)):
  j=np.where(np.all(hi[i]+1e-9>=lo,axis=1)&np.all(hi+1e-9>=lo[i],axis=1)&(order>i))[0]
  j=j[~np.any(adj[i][:,None,None]==adj[j][None,:,:],axis=(0,2))];aa.extend([i]*len(j));bb.extend(j)
 aa=np.array(aa,dtype=int);bb=np.array(bb,dtype=int);proper=proper_intersections(tri[aa],tri[bb]);coplanar=np.zeros(len(aa),bool)
 for k in np.where(~proper)[0]:coplanar[k]=coplanar_overlap(tri[aa[k]],tri[bb[k]])
 return {'properCrossingPairs':np.column_stack([aa[proper],bb[proper]]).tolist(),'coplanarOverlapPairs':np.column_stack([aa[coplanar],bb[coplanar]]).tolist(),'broadPhasePairs':len(aa),'weldEpsilonM':1e-7,'sourceWeldGroups':int(len(np.unique(weld)))}

def point_triangle_d2(p,t):
 a,b,c=t[:,0],t[:,1],t[:,2];u=b-a;v=c-a;n=np.cross(u,v);nn=np.einsum('ij,ij->i',n,n);valid=nn>1e-24;distance=np.einsum('ij,ij->i',p-a,n);projected=p-n*np.divide(distance,nn,out=np.zeros_like(distance),where=valid)[:,None];w=projected-a
 uu=np.einsum('ij,ij->i',u,u);uv=np.einsum('ij,ij->i',u,v);vv=np.einsum('ij,ij->i',v,v);wu=np.einsum('ij,ij->i',w,u);wv=np.einsum('ij,ij->i',w,v);den=uu*vv-uv*uv;ok=np.abs(den)>1e-24
 s=np.divide(wu*vv-wv*uv,den,out=np.zeros_like(den),where=ok);q=np.divide(wv*uu-wu*uv,den,out=np.zeros_like(den),where=ok);inside=valid&ok&(s>=0)&(q>=0)&(s+q<=1)
 out=np.full(len(p),np.inf);out[inside]=distance[inside]**2/nn[inside]
 for x,y in [(a,b),(b,c),(c,a)]:
  e=y-x;ee=np.einsum('ij,ij->i',e,e);k=np.clip(np.divide(np.einsum('ij,ij->i',p-x,e),ee,out=np.zeros(len(p)),where=ee>1e-24),0,1);delta=p-(x+k[:,None]*e);out=np.minimum(out,np.einsum('ij,ij->i',delta,delta))
 return out

def segment_segment_d2(a,b,c,d):
 u=b-a;v=d-c;w=a-c;uu=np.einsum('ij,ij->i',u,u);uv=np.einsum('ij,ij->i',u,v);vv=np.einsum('ij,ij->i',v,v);uw=np.einsum('ij,ij->i',u,w);vw=np.einsum('ij,ij->i',v,w);den=uu*vv-uv*uv;ok=np.abs(den)>1e-24
 s=np.divide(uv*vw-vv*uw,den,out=np.zeros(len(a)),where=ok);t=np.divide(uu*vw-uv*uw,den,out=np.zeros(len(a)),where=ok);inside=ok&(s>=0)&(s<=1)&(t>=0)&(t<=1);delta=w+s[:,None]*u-t[:,None]*v;out=np.full(len(a),np.inf);out[inside]=np.einsum('ij,ij->i',delta,delta)[inside]
 for point,x,y in [(a,c,d),(b,c,d),(c,a,b),(d,a,b)]:
  e=y-x;ee=np.einsum('ij,ij->i',e,e);k=np.clip(np.divide(np.einsum('ij,ij->i',point-x,e),ee,out=np.zeros(len(a)),where=ee>1e-24),0,1);q=point-x-k[:,None]*e;out=np.minimum(out,np.einsum('ij,ij->i',q,q))
 return out

def opposition_gap(P,F,weld,thumb_ids,opponent_ids):
 A=np.where(np.sum(np.isin(F,thumb_ids),axis=1)>=2)[0];B=np.where(np.sum(np.isin(F,opponent_ids),axis=1)>=2)[0]
 if not len(A) or not len(B):return {'status':'notMeasured','reason':'No anatomical contact triangles'}
 ta=P[F[A]];tb=P[F[B]];alo=ta.min(1);ahi=ta.max(1);blo=tb.min(1);bhi=tb.max(1);aa=[];bb=[]
 # An all-pairs bound is small for one anatomical thumb patch; only pairs
 # whose AABB separation is <=20mm are contact-relevant. Larger gap is explicit.
 for i in range(len(A)):
  delta=np.maximum(np.maximum(alo[i]-bhi,blo-ahi[i]),0);j=np.where(np.einsum('ij,ij->i',delta,delta)<=.02**2)[0];j=j[~np.any(weld[F[A[i]]][:,None,None]==weld[F[B[j]]][None,:,:],axis=(0,2))];aa.extend([i]*len(j));bb.extend(j)
 if not aa:return {'status':'measured','minSurfaceGapMmLowerBound':20.,'within1mm':False}
 aa=np.array(aa);bb=np.array(bb);x=ta[aa];y=tb[bb];best=np.full(len(aa),np.inf)
 for k in range(3):best=np.minimum(best,point_triangle_d2(x[:,k],y));best=np.minimum(best,point_triangle_d2(y[:,k],x))
 for i in range(3):
  for j in range(3):best=np.minimum(best,segment_segment_d2(x[:,i],x[:,(i+1)%3],y[:,j],y[:,(j+1)%3]))
 best[proper_intersections(x,y)]=0.;k=int(best.argmin());gap=float(np.sqrt(max(0,best[k]))*1000)
 return {'status':'measured','minSurfaceGapMm':gap,'closestFacePair':[int(A[aa[k]]),int(B[bb[k]])],'within1mm':gap<=1.,'method':'Exact triangle vertex/face, edge/edge and crossing distance; source-weld adjacency excluded;20mm broad-phase contact neighborhood.'}

def get_matrices(data,prefix):
 raw=data.get(prefix+'JointMatrices') or data.get(prefix+'jointmatrices') or (data.get('restJointMatrices') if prefix=='original' else None)
 order='F' if data.get('matrixOrder')=='column-major' else 'C'
 if raw is None:return None
 if isinstance(raw,dict):return {k:np.asarray(v,float).reshape(4,4,order=order) for k,v in raw.items()}
 names=data.get('jointNames')
 if names is None:return None
 return {k:np.asarray(v,float).reshape(4,4,order=order) for k,v in zip(names,raw)}

def joint_scale(data):
 if data.get('derivation',{}).get('kind')=='mirror-static-grasp':
  original=mirror_source(data)
  result=joint_scale(original)
  return {**result,'measurementSource':'Original left static grasp before declared rigid reflection; no right-source skeletal pose claimed.'}
 original=get_matrices(data,'original');posed=get_matrices(data,'posed')
 if original is None or posed is None:return {'status':'notMeasured','reason':'jointNames/restJointMatrices/posedJointMatrices missing'}
 chains=[['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip']]+[['wrist',f+'-finger-metacarpal',f+'-finger-phalanx-proximal',f+'-finger-phalanx-intermediate',f+'-finger-phalanx-distal',f+'-finger-tip'] for f in ['index','middle','ring','pinky']]
 rows=[]
 for chain in chains:
  for parent,child in zip(chain,chain[1:]):
   if any(n not in original or n not in posed for n in [parent,child]):raise ValueError('Missing expected joint '+child)
   a=np.linalg.norm(original[child][:3,3]-original[parent][:3,3]);b=np.linalg.norm(posed[child][:3,3]-posed[parent][:3,3]);rows.append({'parent':parent,'child':child,'restLengthMm':float(a*1000),'posedLengthMm':float(b*1000),'deltaMm':float((b-a)*1000),'ratio':float(b/a)})
 linear=[np.linalg.svd(posed[n][:3,:3]@np.linalg.inv(original[n][:3,:3]),compute_uv=False) for n in original]
 return {'status':'measured','segments':rows,'maxLengthChangeMm':max(abs(x['deltaMm']) for x in rows),'maxSkinRigidScaleDeviation':float(np.max(np.abs(np.array(linear)-1))),'allAnchorAndSegmentLengthsPreservedWithin0_001mm':all(abs(x['deltaMm'])<=.001 for x in rows),'fingerChainLengthsPreservedWithin0_001mm':all(abs(x['deltaMm'])<=.001 for x in rows if x['parent']!='wrist'),'maxFingerChainLengthChangeMm':max(abs(x['deltaMm']) for x in rows if x['parent']!='wrist'),'rootAnchorShiftsMm':{x['child']:float(np.linalg.norm(posed[x['child']][:3,3]-original[x['child']][:3,3])*1000) for x in rows if x['parent']=='wrist'}}

def read_glb_mesh(path,full=False):
 raw=Path(path).read_bytes()
 if raw[:4]!=b'glTF' or struct.unpack_from('<I',raw,4)[0]!=2:raise ValueError('Expected GLB2')
 offset=12;document=None;binary=None
 while offset<len(raw):
  size,kind=struct.unpack_from('<II',raw,offset);chunk=raw[offset+8:offset+8+size];offset+=8+size
  if kind==0x4e4f534a:document=json.loads(chunk)
  if kind==0x004e4942:binary=chunk
 if document is None or binary is None:raise ValueError('GLB chunks missing')
 def accessor(index):
  a=document['accessors'][index];v=document['bufferViews'][a['bufferView']];dtype={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']];count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype(dtype);start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',dt.itemsize*count)
  return np.ndarray((a['count'],count),dtype=dt,buffer=binary,offset=start,strides=(stride,dt.itemsize)).copy()
 primitives=[p for mesh in document['meshes'] for p in mesh['primitives']]
 if len(primitives)!=1:raise ValueError('Expected one official hand primitive')
 primitive=primitives[0];result=(accessor(primitive['attributes']['POSITION']).astype(float),accessor(primitive['indices']).reshape(-1),raw)
 if not full:return result
 skin=document['skins'][0];extra={'jointNames':[document['nodes'][i]['name'] for i in skin['joints']],'skinIndex':accessor(primitive['attributes']['JOINTS_0']).astype(int),'skinWeight':accessor(primitive['attributes']['WEIGHTS_0']).astype(float),'inverseBind':accessor(skin['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1),'normals':accessor(primitive['attributes']['NORMAL']).astype(float)}
 return (*result,extra)

def mirror_source(data):
 d=data['derivation'];path=Path(d['sourceFile']);blob=path.read_bytes()
 if hashlib.sha256(blob).hexdigest()!=d['sourceSha256']:raise ValueError('Mirrored source candidate SHA mismatch')
 original=load(path)
 if original.get('side')!='left' or original.get('derivation',{}).get('kind') not in [None,'static-contact-corrective']:raise ValueError('Mirror must derive directly from declared left authored or controlled-corrective candidate')
 return original

def corrective_source(data):
 d=data['derivation'];path=Path(d['preCandidateFile']);blob=path.read_bytes()
 if hashlib.sha256(blob).hexdigest()!=d['preSha256']:raise ValueError('Corrective pre-candidate SHA mismatch')
 if Path(d['preservedPreCandidateFile']).read_bytes()!=blob:raise ValueError('Corrective preserved pre-candidate differs')
 pre=load(path)
 if pre.get('derivation'):raise ValueError('This controlled layer requires a direct original-LBS pre-candidate')
 if d.get('units')!='metres':raise ValueError('Corrective offsets must be explicit metres')
 return pre

def corrective_proof(data,source_dir):
 d=data['derivation'];pre=corrective_source(data);before=points(pre['positions']);expected=before.copy();seen=set()
 if load(d['sparseOffsetsFile'])!=d['sparseOffsets']:raise ValueError('Separate sparse-offset artifact differs from declared inline offsets')
 for item in d['sparseOffsets']:
  i=item['vertexIndex'];delta=np.asarray(item['delta'],float)
  if not isinstance(i,int) or i in seen or i<0 or i>=len(before) or delta.shape!=(3,) or not np.isfinite(delta).all():raise ValueError('Invalid or duplicate sparse corrective offset')
  seen.add(i);expected[i]+=delta
 actual=points(data['positions']);error=float(np.linalg.norm(expected-actual,axis=1).max());displacement=np.linalg.norm(actual-before,axis=1);maximum=float(displacement.max())
 if error>1e-12 or maximum>d['maxAllowedDisplacementM']+1e-12:raise ValueError('Corrective mesh differs from declared sparse offsets or displacement bound')
 exact_fields=['originalPositions','indices','skinIndex','skinWeight','restJointMatrices','posedJointMatrices','rawToCanonical','vertexGroups','source','cylinder']
 unchanged={key:data[key]==pre[key] for key in exact_fields}
 if not all(unchanged.values()) or data.get('scale')!=pre.get('scale') or data.get('scale')!=1:raise ValueError('Corrective altered protected source/topology/pose/cylinder fields')
 normals=points(data['normals']);oldnormals=points(pre['normals']);normal_hash=hashlib.sha256(np.asarray(normals,dtype='<f8').tobytes()).hexdigest()
 if normal_hash!=d['postNormalFloat64LEsha256']:raise ValueError('Post-corrective normal hash mismatch')
 normal_ids=np.flatnonzero(np.any(normals!=oldnormals,axis=1));declared=set(d['normalChangedVertexIndices'])
 if set(map(int,normal_ids))!=declared:raise ValueError('Actual normal update set differs from declaration')
 proof=source_proof(pre,source_dir)
 return {'status':'measured','derivationKind':'static-contact-corrective','preCandidate':d['preCandidateFile'],'preSha256':d['preSha256'],'preAuthoritativeSourceProof':proof,'controlledStaticLayerVerified':True,'postMeshIsUntouchedLBS':False,'restSourceShapePreserved':proof.get('sourceShapePreservedWithin0_001mm',False),'sourceShapePreservedWithin0_001mm':proof.get('sourceShapePreservedWithin0_001mm',False),'canonicalScalePreserved':proof.get('canonicalScalePreserved',False),'unchangedFields':unchanged,'sparseOffsetsCount':len(seen),'maxDisplacementMm':maximum*1000,'sparseReconstructionErrorMm':error*1000,'normalChangedVertices':len(normal_ids),'normalSha256':normal_hash,'independentBakeProof':{'status':'notApplicable','reason':'Post mesh intentionally differs from original LBS by verified sparse static offsets. Original GLB/LBS proof is retained under preAuthoritativeSourceProof; rest source remains preserved.'}}

def mirror_proof(data,source_dir):
 d=data['derivation'];original=mirror_source(data);M=np.asarray(d['mirrorMatrixRowMajor'],float).reshape(4,4)
 if data.get('side')!='right' or not d.get('flipWinding'):raise ValueError('Static mirror requires right side and winding reversal')
 if not np.isfinite(M).all() or not np.allclose(M[3],[0,0,0,1],atol=1e-12,rtol=0):raise ValueError('Invalid reflection matrix')
 singular=np.linalg.svd(M[:3,:3],compute_uv=False);det=float(np.linalg.det(M[:3,:3]));rigid=bool(np.max(np.abs(singular-1))<=1e-10 and abs(det+1)<=1e-10)
 if not rigid:raise ValueError('Mirror must preserve unit scale and have determinant -1')
 errors={}
 for key in ['positions','originalPositions','normals']:
  source=points(original[key]);actual=points(data[key]);expected=source@M[:3,:3].T
  if key!='normals':expected+=M[:3,3]
  if expected.shape!=actual.shape:raise ValueError('Mirrored array shape mismatch: '+key)
  errors[key]=float(np.linalg.norm(expected-actual,axis=1).max())
 expected_indices=np.asarray(original['indices'],int).reshape(-1,3)[:,[0,2,1]].reshape(-1);indices_exact=bool(np.array_equal(expected_indices,np.asarray(data['indices'],int).reshape(-1)))
 groups_exact=data.get('vertexGroups')==original.get('vertexGroups')
 a=original['cylinder'];b=data['cylinder'];center=np.asarray(a['center'])@M[:3,:3].T+M[:3,3];axis=unit(a['axis'])@M[:3,:3].T
 cylinder_exact=bool(np.max(np.abs(center-b['center']))<=1e-12 and np.max(np.abs(axis-unit(b['axis'])))<=1e-12 and a['radius']==b['radius'] and a['halfLength']==b['halfLength'])
 proof=source_proof(original,source_dir)
 if data.get('source',{}).get('sha256')!=original.get('source',{}).get('sha256'):raise ValueError('Mirrored static candidate must retain left GLB source identity')
 return {'status':'measured','derivationKind':'mirror-static-grasp','sourceCandidate':d['sourceFile'],'sourceCandidateSha256':d['sourceSha256'],'leftAuthoritativeSourceProof':proof,'reflectionDeterminant':det,'canonicalScalePreserved':rigid,'arrayMaxDifference':errors,'mirroredArraysExactWithin1e_12':all(v<=1e-12 for v in errors.values()),'indicesExactAfterWindingFlip':indices_exact,'anatomicalGroupsExact':groups_exact,'cylinderExactReflection':cylinder_exact,'sourceShapePreservedWithin0_001mm':proof.get('sourceShapePreservedWithin0_001mm',False) and errors['originalPositions']<=1e-6 and indices_exact,'independentBakeProof':{'status':'notApplicable','reason':'Explicit static reflection of verified left candidate; no right source skeletal bake claimed.'}}

def source_proof(data,source_dir):
 if data.get('derivation',{}).get('kind')=='mirror-static-grasp':return mirror_proof(data,source_dir)
 if data.get('derivation',{}).get('kind')=='static-contact-corrective':return corrective_proof(data,source_dir)
 if data.get('derivation'):raise ValueError('Unsupported explicit derivation')
 if source_dir is None:return {'status':'notMeasured','reason':'--source-dir not supplied'}
 side=data.get('side')
 if side not in ['left','right']:raise ValueError('Candidate side required for official source proof')
 raw,indices,blob,skin=read_glb_mesh(source_dir/('webxr-'+side+'.glb'),full=True);transform=data.get('rawToCanonical') or data.get('rawToCanonicalMatrix') or data.get('rawToCanonical4x4') or data.get('canonicalTransformRawToOutputRowMajor')
 if data.get('source',{}).get('sha256')!=hashlib.sha256(blob).hexdigest():raise ValueError('Declared official source SHA mismatch')
 if transform is None:return {'status':'notMeasured','reason':'rawToCanonical4x4 missing','sourceSha256':hashlib.sha256(blob).hexdigest()}
 M=np.asarray(transform,float).reshape(4,4);expected=np.c_[raw,np.ones(len(raw))]@M.T;expected=expected[:,:3]/expected[:,3,None];actual=points(data['originalPositions']);singular=np.linalg.svd(M[:3,:3],compute_uv=False)
 if actual.shape!=expected.shape:raise ValueError('Original vertex count differs from official source')
 error=float(np.linalg.norm(expected-actual,axis=1).max()*1000);pose=get_matrices(data,'posed');bake_proof={'status':'notMeasured'}
 if pose is not None:
  matrices=np.array([pose[name] for name in skin['jointNames']]);palette=matrices@skin['inverseBind']@np.linalg.inv(M);blend=(palette[skin['skinIndex']]*skin['skinWeight'][:,:,None,None]).sum(1);baked=(blend@np.c_[actual,np.ones(len(actual))][:,:,None])[:,:3,0];bake_error=float(np.linalg.norm(baked-points(data['positions']),axis=1).max()*1000)
  bake_proof={'status':'measured','maxPositionDifferenceMm':bake_error,'matchesDeclaredPoseAndOfficialSkinWithin0_001mm':bake_error<=.001,'jointOrderMatchesOfficial':data.get('jointNames')==skin['jointNames'],'method':'Independent authoritative GLB JOINTS/WEIGHTS/inverseBind + declared canonical posed matrices; plain glTF linear-blend skinning.'}
 same_indices=np.array_equal(indices,np.asarray(data['indices']).reshape(-1))
 return {'status':'measured','independentBakeProof':bake_proof,'sourceSha256':hashlib.sha256(blob).hexdigest(),'sourceVertices':len(raw),'originalMaxDeviationMm':error,'indicesExact':bool(same_indices),'canonicalLinearSingularValues':singular.tolist(),'canonicalScalePreserved':bool(np.max(np.abs(singular-1))<=1e-5),'sourceShapePreservedWithin0_001mm':error<=.001 and bool(same_indices)}

def analyze(data,source_dir=None,expected_diameter=40):
 if not math.isfinite(expected_diameter) or expected_diameter<=0:raise ValueError('Explicit expected shaft diameter must be finite and positive')
 P=points(data['positions']);R=points(data['originalPositions']);F=np.asarray(data['indices'],int).reshape(-1,3)
 if P.shape!=R.shape or not np.isfinite(P).all() or not np.isfinite(R).all() or F.min()<0 or F.max()>=len(P):raise ValueError('Invalid mesh arrays')
 cylinder=data['cylinder'];radius=float(cylinder['radius']);half=float(cylinder['halfLength']);basis,center=cylinder_frame(cylinder)
 if not math.isfinite(radius) or not math.isfinite(half) or not np.isfinite(center).all() or abs(radius-expected_diameter/2000)>1e-9 or half<=0:raise ValueError('Cylinder differs from explicit expected diameter '+str(expected_diameter)+'mm or is invalid')
 local=(P-center)@basis.T;tri=local[F];depth=[];witnesses=[];gaps=[]
 for f in tri:
  d,p=triangle_cylinder_penetration(f,radius,half);depth.append(d);witnesses.append(p);gap,_=sidewall_gap(f,radius,half);gaps.append(gap)
 depth=np.array(depth);gaps=np.array(gaps);worst=int(depth.argmax());contacts={}
 for finger in FINGERS:
  contacts[finger]={}
  for label,ids in [('wholeFinger',data['vertexGroups'].get(finger,[])),('distal',data['vertexGroups'].get('distal',{}).get(finger,[]))]:
   mask=np.sum(np.isin(F,ids),axis=1)>=2;available=np.where(mask&np.isfinite(gaps))[0]
   if not len(available):contacts[finger][label]={'status':'notMeasured','faces':int(mask.sum())};continue
   best=int(available[np.argmin(gaps[available])]);contacts[finger][label]={'status':'measured','minSidewallGapMm':float(gaps[best]*1000),'closestFace':best,'maxPenetrationMm':float(depth[mask].max()*1000),'within1mm':bool(gaps[best]<=.001),'faces':int(mask.sum())}
 for label in ['palm','thumbPad']:
  ids=data['vertexGroups'].get(label,data.get('contactGroups',{}).get(label,[]))
  if not ids:contacts[label]={'status':'notMeasured','reason':'No anatomically defined '+label+' vertex mask supplied'};continue
  mask=np.sum(np.isin(F,ids),axis=1)>=2;available=np.where(mask&np.isfinite(gaps))[0]
  if not len(available):contacts[label]={'status':'notMeasured','faces':int(mask.sum())};continue
  best=int(available[np.argmin(gaps[available])]);contacts[label]={'status':'measured','minSidewallGapMm':float(gaps[best]*1000),'closestFace':best,'maxPenetrationMm':float(depth[mask].max()*1000),'within1mm':bool(gaps[best]<=.001),'faces':int(mask.sum()),'maskProvenance':data.get('contactGroupRules',{}).get(label)}
 weld=weld_ids(R);opponent_ids=data['vertexGroups'].get('index',[])+data['vertexGroups'].get('middle',[]);thumb_patch=data['vertexGroups'].get('thumbPad') or data['vertexGroups'].get('distal',{}).get('thumb',[]);opposition=opposition_gap(P,F,weld,thumb_patch,opponent_ids);opposition['thumbPatch']='thumbPad' if data['vertexGroups'].get('thumbPad') else 'distal-thumb-surface';cross=self_crossings(P,F,weld);rest_cross=self_crossings(R,F,weld);pairs=set(map(tuple,cross['properCrossingPairs']+cross['coplanarOverlapPairs']));old_pairs=set(map(tuple,rest_cross['properCrossingPairs']+rest_cross['coplanarOverlapPairs']))
 area=lambda p:np.linalg.norm(np.cross(p[F[:,1]]-p[F[:,0]],p[F[:,2]]-p[F[:,0]]),axis=1)
 ra=area(R);valid=ra>1e-14;ratio=area(P)[valid]/ra[valid]
 bounds={'originalMm':{'min':(R.min(0)*1000).tolist(),'max':(R.max(0)*1000).tolist(),'extent':(np.ptp(R,axis=0)*1000).tolist()},'graspMm':{'min':(P.min(0)*1000).tolist(),'max':(P.max(0)*1000).tolist(),'extent':(np.ptp(P,axis=0)*1000).tolist()},'interpretation':'Grasp bounds intentionally differ from open-hand bounds; this does not imply scale change.'}
 return {'vertices':len(P),'faces':len(F),'finite':True,'expectedCylinderDiameterMm':expected_diameter,'cylinderDiameterMm':radius*2000,'cylinder':cylinder,'triangleInteriorCylinderPenetration':{'maxDepthMm':float(depth[worst]*1000),'worstFace':worst,'witnessWorld':((witnesses[worst]@basis)+center).tolist() if witnesses[worst] is not None else None,'faceCountAbove0_1mm':int((depth>.0001).sum()),'penetratingFaceIds':np.where(depth>.0001)[0].tolist(),'method':'Triangle clipped to finite-cylinder axial slabs; exact convex radial closest point;26-step erosion bisection. Includes face interiors and endcaps.'},'contacts':contacts,'thumbToIndexMiddleOpposition':opposition,'selfIntersection':{**cross,'restCrossingCount':len(old_pairs),'newPairCount':len(pairs-old_pairs),'newPairs':sorted(pairs-old_pairs)},'jointScale':joint_scale(data),'officialSourceProof':source_proof(data,source_dir),'bounds':bounds,'surfaceAreaRatios':{'min':float(ratio.min()),'p01':float(np.quantile(ratio,.01)),'below0_1':int((ratio<.1).sum()),'degenerateOriginalFaces':int((~valid).sum())},'checks':{'cylinderPenetrationWithin0_1mm':bool(depth.max()<=.0001),'allFiveFingerSurfaceContactsWithin1mmDiagnosticOnly':all(contacts[f]['wholeFinger'].get('within1mm',False) for f in FINGERS),'fourFingerSurfaceContactsWithin1mm':all(contacts[f]['wholeFinger'].get('within1mm',False) for f in ['index','middle','ring','little']),'thumbRodOrIndexMiddleOppositionWithin1mm':bool(contacts['thumbPad'].get('within1mm') or contacts['thumb']['wholeFinger'].get('within1mm') or opposition.get('within1mm')),'palmSurfaceContactWithin1mm':contacts['palm'].get('within1mm'),'thumbPadContactWithin1mm':contacts['thumbPad'].get('within1mm'),'noNonadjacentSelfIntersection':not pairs},'limits':['Contact groups use >=2 anatomical-group vertices per triangle; whole-finger proximity does not establish palmar-pad contact. Distal contacts reported separately.','Weld adjacency derives only from original positions within0.1micron; adjacent/weld-neighbor faces excluded. Proper crossings and positive-area coplanar overlaps tested.','Silhouette requires supplied camera renders; CPU bounds/areas/joint lengths alone are not visual acceptance.']}

def tests():
 t=np.array([[-.04,-.04,0],[.04,-.04,0],[0,.04,0]])
 d,_=triangle_cylinder_penetration(t,.016,.1);assert abs(d-.016)<1e-8 # no vertex penetrates; face interior does
 assert all(np.linalg.norm(p[:2])>.016 for p in t)
 assert triangle_cylinder_penetration(t+np.array([0,0,.2]),.016,.1)[0]==0
 d,_=triangle_cylinder_penetration(t+np.array([0,0,.099]),.016,.1);assert abs(d-.001)<1e-8
 assert coplanar_overlap(t,t*.5);assert not coplanar_overlap(t,t+np.array([1,0,0]))
 a=np.array([[[0.,0,0],[1,0,0],[0,1,0]]]);b=np.array([[[.2,.2,-1],[.2,.2,1],[.8,.2,1]]]);assert proper_intersections(a,b)[0]
 assert np.array_equal(weld_ids(np.array([[0.,0,0],[0,0,0],[.1,0,0]])),[0,0,2])
 assert abs(opposition_gap(np.array([[0.,0,0],[1,0,0],[0,1,0],[0,0,.003],[1,0,.003],[0,1,.003]]),np.array([[0,1,2],[3,4,5]]),np.arange(6),[0,1,2],[3,4,5])['minSurfaceGapMm']-3)<1e-8
 import tempfile,copy
 with tempfile.TemporaryDirectory(prefix='posehub-mirror-qa-') as folder:
  path=Path(folder)/'left.json';left={'side':'left','positions':[0,0,0,1,0,0,0,1,0],'originalPositions':[0,0,0,1,0,0,0,1,0],'normals':[0,0,1]*3,'indices':[0,1,2],'vertexGroups':{},'source':{'sha256':'test'},'cylinder':{'center':[1,0,0],'axis':[1,0,0],'radius':.016,'halfLength':.1}}
  path.write_text(json.dumps(left),encoding='utf-8');right=copy.deepcopy(left);M=np.diag([-1.,1,1,1]);right['side']='right';right['derivation']={'kind':'mirror-static-grasp','sourceFile':str(path),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'mirrorMatrixRowMajor':M.ravel().tolist(),'flipWinding':True}
  for key in ['positions','originalPositions','normals']:right[key]=(points(left[key])@M[:3,:3].T).ravel().tolist()
  right['indices']=[0,2,1];right['cylinder']['center']=[-1,0,0];right['cylinder']['axis']=[-1,0,0]
  proof=mirror_proof(right,None);assert proof['mirroredArraysExactWithin1e_12'] and proof['indicesExactAfterWindingFlip'] and proof['cylinderExactReflection']
  bad=copy.deepcopy(right);bad['indices']=[0,1,2];assert not mirror_proof(bad,None)['indicesExactAfterWindingFlip']
  bad=copy.deepcopy(right);bad['positions'][0]=.001;assert not mirror_proof(bad,None)['mirroredArraysExactWithin1e_12']
  bad=copy.deepcopy(right);bad['derivation']['mirrorMatrixRowMajor'][0]=-1.1
  try:mirror_proof(bad,None);raise AssertionError('Nonrigid reflection accepted')
  except ValueError:pass
 print('12 meaningful geometry and mirror-provenance QA checks passed')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('inputs',type=Path,nargs='*');ap.add_argument('--output',type=Path);ap.add_argument('--self-test',action='store_true');ap.add_argument('--source-dir',type=Path);ap.add_argument('--expected-diameter',type=float,default=40);a=ap.parse_args()
 if a.self_test:tests();return
 if not a.inputs or not a.output:ap.error('input JSON(s) and exclusive --output required')
 if not math.isfinite(a.expected_diameter) or a.expected_diameter<=0:ap.error('Explicit expected shaft diameter must be finite and positive')
 report={'format':'pose-hub-webxr-grasp-independent-qa@1','hands':[],'reviewed':False,'releaseEligible':False}
 for file in a.inputs:
  raw=file.read_bytes();data=load(file);result=analyze(data,a.source_dir,a.expected_diameter);result['input']={'path':str(file),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()};result['side']=data.get('side',file.stem.split('-')[0]);report['hands'].append(result)
 if len(report['hands'])==2:
  l,r=report['hands'];ls=l['jointScale'];rs=r['jointScale']
  if ls['status']==rs['status']=='measured':
   lm={x['child']:x for x in ls['segments']};rm={x['child']:x for x in rs['segments']};report['bilateralSegmentComparison']=[{'child':k,'leftRestMm':lm[k]['restLengthMm'],'rightRestMm':rm[k]['restLengthMm'],'leftPoseScale':lm[k]['ratio'],'rightPoseScale':rm[k]['ratio']} for k in lm]
  report['bilateralNote']='Official source anatomy may differ between hands. Compare each posed segment to its own fixed source; do not silently rescale one side to manufacture matching silhouettes.'
 with a.output.open('x',encoding='utf-8') as f:json.dump(report,f,indent=2)
 print(json.dumps([{'side':h['side'],'checks':h['checks'],'penetrationMm':h['triangleInteriorCylinderPenetration']['maxDepthMm'],'crossings':len(h['selfIntersection']['properCrossingPairs'])+len(h['selfIntersection']['coplanarOverlapPairs']),'jointScale':{k:v for k,v in h['jointScale'].items() if k!='segments'}} for h in report['hands']],indent=2))
if __name__=='__main__':main()
