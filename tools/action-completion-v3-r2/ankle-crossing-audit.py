"""Read-only triangle crossing audit on actual probe exports. No rendering."""
import json,sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
base,candidate=map(Path,sys.argv[1:3])
side=sys.argv[3] if len(sys.argv)>3 else 'left'
if side not in ('left','right'):raise ValueError('Side must be left or right')
rest=json.loads((base/'probe.json').read_text())['rest']
a=np.array(rest['bones'][side+'Foot']['worldPosition']);axis=np.array(rest['bones'][side+'Shin']['worldPosition'])-a;axis/=np.linalg.norm(axis)
R={name:{v['id']:np.array(v['world']) for v in m['vertices']} for name,m in rest['meshes'].items()}
def faces(name,skin):
 out=[]
 for f in rest['meshes'][name]['facesOriginalIndices']:
  p=np.mean([R[name][i] for i in f],axis=0);q=p-a;h=q@axis
  if (p[0]>0 if side=='left' else p[0]<0) and ((-.02<h<.14) if skin else (-.045<h<.05)) and np.linalg.norm(q-h*axis)<.105:out.append((name,f))
 return out
Afaces=faces('Coach_Body',True)+faces('V2P_Base_Limbs',True);Bfaces=faces('Coach_Sneakers',False)
def segment_hit(O,D,V):
 E1=V[:,1]-V[:,0];E2=V[:,2]-V[:,0];P=np.cross(D,E2);det=np.sum(E1*P,axis=1);ok=np.abs(det)>1e-12;iv=np.zeros(len(det));iv[ok]=1/det[ok];W=O-V[:,0];u=np.sum(W*P,axis=1)*iv;Q=np.cross(W,E1);v=np.sum(D*Q,axis=1)*iv;t=np.sum(E2*Q,axis=1)*iv;e=1e-7
 return ok&(u>-e)&(v>-e)&(u+v<1+e)&(t>e)&(t<1-e)
def audit(p):
 M={name:{v['id']:v['world'] for v in m['vertices']} for name,m in p['meshes'].items()}
 A=np.array([[M[name][i] for i in f] for name,f in Afaces]);B=np.array([[M[name][i] for i in f] for name,f in Bfaces]);ac=A.mean(1);bc=B.mean(1);ar=np.linalg.norm(A-ac[:,None],axis=2).max(1);br=np.linalg.norm(B-bc[:,None],axis=2).max(1);tree=cKDTree(bc);pairs=[];amin=A.min(1);amax=A.max(1);bmin=B.min(1);bmax=B.max(1)
 for i,jj in enumerate(tree.query_ball_point(ac,ar+br.max())):
  jj=np.array(jj,dtype=int)
  if not len(jj):continue
  jj=jj[np.all(amax[i]>=bmin[jj],axis=1)&np.all(bmax[jj]>=amin[i],axis=1)]
  pairs.extend((i,j) for j in jj)
 if not pairs:return {'crossingPairs':0,'skinTriangles':len(A),'shoeTriangles':len(B)}
 ii,jj=np.array(pairs).T;AA=A[ii];BB=B[jj];hit=np.zeros(len(ii),bool)
 for k in range(3):
  hit|=segment_hit(AA[:,k],AA[:,(k+1)%3]-AA[:,k],BB)
  hit|=segment_hit(BB[:,k],BB[:,(k+1)%3]-BB[:,k],AA)
 return {'crossingPairs':int(hit.sum()),'skinTrianglesWithCrossings':len(set(ii[hit].tolist())),'shoeTrianglesWithCrossings':len(set(jj[hit].tolist())),'skinTriangles':len(A),'shoeTriangles':len(B)}
rows=[]
frames=sorted(int(p.name.split('-')[1]) for p in candidate.glob('frame-*-geometry.json') if (base/p.name).is_file())
if not frames:raise RuntimeError('No common actual geometry frames to audit')
for frame in frames:
 filename=f'frame-{frame:04d}-geometry.json';b=json.loads((base/filename).read_text());c=json.loads((candidate/filename).read_text());rows.append({'frame':frame,'baseline':audit(b),'candidate':audit(c)})
report={'method':f'identical neutral-selected {side} ankle ROI; segment-triangle noncoplanar crossings','limitations':['Not a closed-solid test; containment and coplanar overlap are not detected.','No visual acceptance or external penetration depth is inferred from counts.'],'results':rows}
(candidate/('independent-geometry-comparison.json' if side=='left' else 'independent-geometry-comparison-right.json')).write_text(json.dumps(report,indent=2));print(json.dumps(rows))
