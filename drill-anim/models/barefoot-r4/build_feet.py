#!/usr/bin/env python3
"""Independent CC0 complete feet, sole writer export. Frozen source files never overwritten."""
import argparse,base64,hashlib,json,struct,sys
from pathlib import Path
import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from scipy.spatial.transform import Rotation
ap=argparse.ArgumentParser();ap.add_argument('--repo',type=Path,default=Path('posehub_v2plus_20261021'));ap.add_argument('--source',type=Path,default=Path('PoseHub-Dot-Deliveries/model-contact-r4-source/male_l2.npz'));ap.add_argument('--out',type=Path);a=ap.parse_args();repo=a.repo.resolve()
sys.dont_write_bytecode=True;sys.path.insert(0,str(repo/'tools/human-v2plus/torso-base'))
from meshops import edges_of,adjacency,compact,boundary_loops_F,components,vnormals,zipper,bilaplace_fair
ss=lambda lo,hi,x:(lambda q:q*q*(3-2*q))(np.clip((x-lo)/(hi-lo),0,1))
def rot_to(u,v):
 u=u/np.linalg.norm(u);v=v/np.linalg.norm(v);q=np.cross(u,v);c=u@v
 if np.linalg.norm(q)<1e-12:
  assert c>=0;return np.eye(3)
 K=np.array([[0,-q[2],q[1]],[q[2],0,-q[0]],[-q[1],q[0],0]]);return np.eye(3)+K+K@K/(1+c)
def unpack(s,d,c):return np.frombuffer(base64.b64decode(s),dtype=d).reshape(-1,c)
def b64(x):return base64.b64encode(np.ascontiguousarray(x).tobytes()).decode()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw=(repo/'runtime/public/coach/flare-coach.glb').read_bytes();jl=struct.unpack_from('<I',raw,12)[0];gl=json.loads(raw[20:20+jl]);bl=struct.unpack_from('<I',raw,20+jl)[0];blob=raw[28+jl:28+jl+bl]
def accessor(i):
 z=gl['accessors'][i];bv=gl['bufferViews'][z['bufferView']];nc={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[z['type']];dt=np.dtype({5126:'<f4',5125:'<u4',5123:'<u2',5122:'<i2',5121:'u1'}[z['componentType']]);x=np.ndarray((z['count'],nc),dtype=dt,buffer=blob,offset=bv.get('byteOffset',0)+z.get('byteOffset',0),strides=(bv.get('byteStride',dt.itemsize*nc),dt.itemsize)).copy();return x/np.iinfo(dt).max if z.get('normalized') else x
world={}
def visit(i,parent):
 n=gl['nodes'][i];m=np.eye(4)
 if 'matrix'in n:m=np.array(n['matrix']).reshape(4,4).T
 else:m[:3,:3]=Rotation.from_quat(n.get('rotation',[0,0,0,1])).as_matrix()@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
 world[i]=parent@m
 for c in n.get('children',[]):visit(c,world[i])
for i in gl['scenes'][gl.get('scene',0)]['nodes']:visit(i,np.eye(4))
def oldmesh(name):
 n=next(n for n in gl['nodes']if n.get('name')==name);p=gl['meshes'][n['mesh']]['primitives'][0];att=p['attributes'];sk=gl['skins'][n['skin']];P=accessor(att['POSITION']);J=accessor(att['JOINTS_0']);W=accessor(att['WEIGHTS_0']);names=[gl['nodes'][i]['name']for i in sk['joints']];ib=accessor(sk['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1);bm=np.array([world[i]@m for i,m in zip(sk['joints'],ib)]);m=(bm[J]*W[:,:,None,None]).sum(1);V=np.einsum('nij,nj->ni',m[:,:3,:3],P)+m[:,:3,3];return dict(V=V,F=accessor(p['indices']).reshape(-1,3),J=J,W=W,names=names)
body=oldmesh('Coach_Body');shoes={n:oldmesh(n)for n in ['Coach_Soles','Coach_Sneakers','Coach_Shoe_Details']};reset_dy=.006-min(m['V'][:,1].min()for m in shoes.values());B=body['V']+[0,reset_dy,0];rig=json.load(open(repo/'runtime/public/coach/coach-rig.json'))['landmarks'];LM={k:np.array(v)+[0,reset_dy,0]for k,v in rig.items()}
limbfile=repo/'drill-anim/models/training-human-v2plus-limbs-base.json';ld=json.load(open(limbfile));bones=ld['bones'];bi={n:i for i,n in enumerate(bones)};LV=unpack(ld['pos']['u16'],np.uint16,3)*ld['pos']['scale']+ld['pos']['lo'];LF=unpack(ld['index']['u16'],np.uint16,3);LN=unpack(ld['nrm']['i8'],np.int8,3).astype(float)/127;LN/=np.maximum(np.linalg.norm(LN,axis=1,keepdims=True),1e-12)
for i,(nm,vid)in enumerate(zip(ld['seam']['mesh'],ld['seam']['vid'])):
 if nm=='Coach_Body':LV[ld['seam']['first']+i]=B[vid]
LA=adjacency(len(LV),edges_of(LF));src=np.load(a.source);V=src['V'].copy()+[0,.043,.012];Q=src['F'];F=np.r_[Q[:,[0,1,2]],Q[:,[0,2,3]]];pieces=[];report=[]
for side,sgn in [('left',1),('right',-1)]:
 A,K,H=[LM[side+n]for n in ['Ankle','Knee','Hip']];leg=(V[:,0]*sgn>0)&(V[:,1]<.70);cA=V[leg&(abs(V[:,1]-A[1]-.02)<.004)].mean(0);cA[1]=A[1];H0=np.array([.078 if sgn>0 else -.082,.885,.010]);lt=np.linalg.norm(K-H);ls=np.linalg.norm(A-K);cK0=H0+(cA-H0)*lt/(lt+ls);sl=V[leg&(abs(V[:,1]-cK0[1])<.004)];cK=np.array([sl[:,0].mean(),cK0[1],sl[:,2].mean()]);u=(cA-cK)/np.linalg.norm(cA-cK);rs=rot_to(cA-cK,A-K);scale=ls/np.linalg.norm(cA-cK);x=V-cK;Yshin=(x+np.outer((x@u)*(scale-1),u))@rs.T+K
 low=V[leg&(V[:,1]<cA[1]+.01)];ev,vec=np.linalg.eigh(np.cov(low[:,[0,2]].T));forward=vec[:,-1]*np.sign(vec[1,-1]);yaw=np.degrees(np.arctan2(forward[0],forward[1]));rf=Rotation.from_euler('y',-yaw,degrees=True).as_matrix();Yfoot=(V-cA)@rf.T+A;w=ss(cA[1]-.01,cA[1]+.02,V[:,1]);Y=Yfoot*(1-w[:,None])+Yshin*w[:,None]
 si=np.array([i for i,n in enumerate(ld['seam']['ring'])if n=='ankle_'+side]);assert len(si)==28;oldvid=np.array(ld['seam']['vid'])[si];lvid=ld['seam']['first']+si;target=B[oldvid];centre=target.mean(0)
 def angle(P):return np.arctan2(P[:,2]-centre[2],P[:,0]-centre[0])
 phi=angle(target);order=np.argsort(phi);ring_y=np.interp(angle(Y),phi[order],target[order,1],period=2*np.pi);keep=leg&(Y[:,1]<=ring_y-.004);P,T,used=compact(Y,F,keep[F].all(1));loop=boundary_loops_F(T);assert len(loop)==1;assert len(np.unique(components(len(P),T)))==1;ring=np.array(loop[0]);n=len(P);P0=P.copy();pa=angle(P[ring]);aim=np.stack([np.interp(pa,phi[order],target[order,k],period=2*np.pi)for k in range(3)],axis=1);aim[:,1]-=.004;steps=(np.diff(np.r_[pa,pa[0]])+np.pi)%(2*np.pi)-np.pi;wind=np.sign(steps.sum());backtracks=int(np.sum(steps*wind<-1e-7))
 graph=adjacency(n,edges_of(T));degree=np.asarray(graph.sum(1)).ravel();L=sp.diags(1/np.maximum(degree,1))@graph-sp.eye(n);dist=np.full(n,999,int);dist[ring]=0;frontier=np.zeros(n,bool);frontier[ring]=True
 for k in range(1,17):new=(graph@frontier.astype(float)>0)&(dist==999);dist[new]=k;frontier=new
 protected=P0[:,1]<=A[1]+.03;fixed=(dist>=16)|protected;fixed[ring]=True;D=np.zeros_like(P);D[ring]=aim-P[ring];free=np.where(~fixed)[0];pins=np.where(fixed)[0];op=(L.T@L).tocsr();D[free]=spsolve(op[free][:,free].tocsc(),-op[free][:,pins]@D[pins]);P+=D
 original_fn=np.cross(P0[T[:,1]]-P0[T[:,0]],P0[T[:,2]]-P0[T[:,0]]);moved_fn=np.cross(P[T[:,1]]-P[T[:,0]],P[T[:,2]]-P[T[:,0]]);flipped_pre=int(np.sum(np.einsum('ij,ij->i',original_fn,moved_fn)<=0));target_steps=(np.diff(np.r_[phi,phi[0]])+np.pi)%(2*np.pi)-np.pi
 if np.sign(target_steps.sum())!=wind:target=target[::-1];oldvid=oldvid[::-1];lvid=lvid[::-1]
 z=zipper(P[ring],target);zg=np.where(z<len(ring),ring[np.minimum(z,len(ring)-1)],n+z-len(ring));oldedges=set(map(tuple,np.concatenate([T[:,[0,1]],T[:,[1,2]],T[:,[2,0]]])));ze=np.concatenate([zg[:,[0,1]],zg[:,[1,2]],zg[:,[2,0]]]);same=sum(tuple(e)in oldedges for e in ze);opp=sum(tuple(e[::-1])in oldedges for e in ze);assert (same==len(ring)and opp==0)or(opp==len(ring)and same==0)
 if same:zg=zg[:,[0,2,1]]
 P=np.vstack([P,target]);Tout=np.vstack([T,zg]);gr=adjacency(len(P),edges_of(Tout));dd=np.full(len(P),999,int);dd[n:]=0;fr=np.zeros(len(P),bool);fr[n:]=True
 for k in range(1,6):new=(gr@fr.astype(float)>0)&(dd==999);dd[new]=k;fr=new
 gm={};ghosts=[];ge=[];lvidset=set(lvid)
 for j,lv in enumerate(lvid):
  for nb in LA.indices[LA.indptr[lv]:LA.indptr[lv+1]]:
   if nb in lvidset:continue
   if nb not in gm:gm[nb]=len(ghosts);ghosts.append(LV[nb])
   ge.append((n+j,gm[nb]))
 P=bilaplace_fair(P,Tout,(dd>=1)&(dd<=5)&(P[:,1]>A[1]+.03),np.array(ghosts),np.array(ge,int));final_fn=np.cross(P[Tout[:,1]]-P[Tout[:,0]],P[Tout[:,2]]-P[Tout[:,0]]);area=np.linalg.norm(final_fn,axis=1)/2;flipped=int(np.sum(np.einsum('ij,ij->i',original_fn,final_fn[:len(T)])<=0));edges=np.concatenate([Tout[:,[0,1]],Tout[:,[1,2]],Tout[:,[2,0]]]);ue,counts=np.unique(np.sort(edges,axis=1),axis=0,return_counts=True);boundary=boundary_loops_F(Tout);assert len(boundary)==1 and len(boundary[0])==28 and not np.any(counts>2)
 capcentre=P[n:].mean(0);vcap=np.vstack([P,capcentre]);ci=len(P);bs=set(map(tuple,ue[counts==1]));be=edges[np.array([tuple(sorted(e))in bs for e in edges])];caps=np.array([[b,aa,ci]for aa,b in be]);closed=np.vstack([Tout,caps]);volume=float(np.einsum('ij,ij->i',vcap[closed[:,0]],np.cross(vcap[closed[:,1]],vcap[closed[:,2]])).sum()/6)
 axial=(P-A)@((K-A)/np.linalg.norm(K-A));wf=1-ss(.008,.060,axial);W=np.zeros((len(P),len(bones)));W[:,bi[side+'Foot']]=wf;W[:,bi[side+'Shin']]=1-wf
 for j,vid in enumerate(oldvid):
  W[n+j]=0
  for b,wv in zip(body['J'][vid],body['W'][vid]):
   if wv:W[n+j,bi[body['names'][b]]]+=wv
 J=np.argsort(-W,axis=1)[:,:4];weights=np.take_along_axis(W,J,axis=1);weights/=weights.sum(1,keepdims=True);Wq=np.round(weights*255).astype(int);Wq[:,0]+=255-Wq.sum(1);N=vnormals(P,Tout);N[n:]=LN[lvid]
 for rr,alpha in [(1,.6),(2,.3),(3,.12)]:
  for i in np.where(dd==rr)[0]:
   nb=gr.indices[gr.indptr[i]:gr.indptr[i+1]];nb=nb[dd[nb]==rr-1]
   if len(nb):normal=N[nb].mean(0);normal/=max(np.linalg.norm(normal),1e-12);N[i]=(1-alpha)*N[i]+alpha*normal
 N/=np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-12);radial=P[zg].mean(1)-centre;radial[:,1]=0;outward=np.einsum('ij,ij->i',final_fn[len(T):],radial)
 rec=dict(side=side,source_cA=cA.tolist(),source_cK=cK.tolist(),reset_ankle=A.tolist(),foot_yaw_deg=-yaw,shin_axial_scale=scale,source_vertices=n,source_triangles=len(T),cut_loop_vertices=len(ring),source_angle_backtracks=backtracks,max_local_displacement_mm=float(np.linalg.norm(P[:n]-P0,axis=1).max()*1000),protected_below_y=float(A[1]+.03),protected_vertices=int(protected.sum()),protected_max_change_mm=float(np.linalg.norm(P[:n][protected]-P0[protected],axis=1).max()*1000),flipped_original_faces_pre_fair=flipped_pre,flipped_original_faces_final=flipped,min_triangle_area_mm2=float(area.min()*1e6),degenerate_triangles=int((area<=1e-12).sum()),nonmanifold_edges=int((counts>2).sum()),boundary_vertices=len(boundary[0]),capped_signed_volume_m3=volume,seam_error_mm=float(np.linalg.norm(P[n:]-target,axis=1).max()*1000),zipper_outward_min_m3=float(outward.min()),zipper_nonoutward_faces=int((outward<=0).sum()),bbox_m=[P.min(0).tolist(),P.max(0).tolist()]);report.append(rec);pieces.append(dict(V=P,F=Tout,N=N,J=J,W=Wq,n=n,vid=oldvid,side=side))
ns=sum(p['n']for p in pieces);c=0;seamoff=ns;VV=[];NN=[];JJ=[];WW=[];FF=[];seams=[]
for p in pieces:
 remap=np.r_[np.arange(p['n'])+c,np.arange(28)+seamoff];FF.append(remap[p['F']]);VV.append(p['V'][:p['n']]);NN.append(p['N'][:p['n']]);JJ.append(p['J'][:p['n']]);WW.append(p['W'][:p['n']]);c+=p['n'];seamoff+=28
for p in pieces:
 VV.append(p['V'][p['n']:]);NN.append(p['N'][p['n']:]);JJ.append(p['J'][p['n']:]);WW.append(p['W'][p['n']:]);seams.extend(('ankle_'+p['side'],'Coach_Body',int(vid))for vid in p['vid'])
PV=np.vstack(VV);NF=np.vstack(NN);J=np.vstack(JJ);Wq=np.vstack(WW);FI=np.vstack(FF)
def rawN(P,T):
 fn=np.cross(P[T[:,1]]-P[T[:,0]],P[T[:,2]]-P[T[:,0]]);out=np.zeros_like(P)
 for k in range(3):np.add.at(out,T[:,k],fn)
 return out
unit=lambda X:X/np.maximum(np.linalg.norm(X,axis=1,keepdims=True),1e-15)
RH=rawN(PV,FI);RL=rawN(LV,LF);NF=unit(RH);NLnew=unit(RL);lookup={(r,int(v)):ld['seam']['first']+j for j,(r,v)in enumerate(zip(ld['seam']['ring'],ld['seam']['vid']))};lmap={}
for k,(r,mesh,vid)in enumerate(seams):
 li=lookup[(r,vid)];hi=ns+k;lmap[li]=hi;shared=RH[hi]+RL[li];shared/=np.linalg.norm(shared);NF[hi]=shared;NLnew[li]=shared
def graph_rings(graph,seeds,width=5):
 dist=np.full(graph.shape[0],999,int);dist[seeds]=0;front=dist==0
 for rr in range(1,width+1):new=(graph@front.astype(float)>0)&(dist==999);dist[new]=rr;front=new
 return dist
AF=adjacency(len(PV),edges_of(FI)).tocsr();rF=graph_rings(AF,np.arange(ns,len(PV)));rL=graph_rings(LA,np.array(list(lmap)));limbsIdx=np.where(rL<=5)[0];nH=len(PV);gid=np.arange(nH+len(LV))
for li,hi in lmap.items():gid[nH+li]=hi
EU=np.vstack([edges_of(FI),gid[nH+edges_of(LF)]]);AU=adjacency(nH+len(LV),EU).tocsr();degU=np.asarray(AU.sum(1)).ravel();NU=np.vstack([NF,NLnew]);band=np.r_[rF<5,rL<5];wgt=np.r_[1-np.clip(rF/5,0,1),1-np.clip(rL/5,0,1)]
for unused in range(8):avg=AU@NU/np.maximum(degU,1)[:,None];NU[band]=(1-.6*wgt[band,None])*NU[band]+.6*wgt[band,None]*avg[band];NU=unit(NU)
NF=NU[:nH].copy();NLnew=NU[gid[nH:]].copy();assert all(np.linalg.norm(NF[hi]-NLnew[li])<1e-12 for li,hi in lmap.items());cloud={};offset=0
for p in pieces:
 sd=p['side'];A=LM[sd+'Ankle'];ids=np.arange(p['n'])+offset;ids=ids[(J[ids,0]==bi[sd+'Foot'])&(Wq[ids,0]==255)];cloud[sd]=dict(bone=sd+'Foot',idx=ids.tolist(),restWorldF32=b64(PV[ids].astype('<f4')),restAnkle=A.tolist(),count=int(len(ids)),bbox=[PV[ids].min(0).tolist(),PV[ids].max(0).tolist()],note='Convert actual loaded world points with actual Foot world quaternion at reset.');offset+=p['n']
lo=PV.min(0)-.001;scale=(PV.max(0)+.001-lo)/65535;Pq=np.round((PV-lo)/scale).astype(np.uint16);assert len(PV)<65536
hd=json.load(open(repo/'drill-anim/models/training-human-v2plus-hands-base.json'));old_hidden=set(hd['hideFaces']['Coach_Body']);names=np.array(body['names'])[body['J'][np.arange(len(B)),body['W'].argmax(1)]];active=np.array([i not in old_hidden for i in range(len(body['F']))])&~(names=='head')[body['F']].any(1);ceiling=max(float(p['V'][p['n']:,1].max())for p in pieces)+1e-7;foot_replace=active&(B[body['F'],1]<=ceiling).all(1);foot_ids=np.flatnonzero(foot_replace);_,wf,weld=np.unique(np.round(B/2e-5).astype(np.int64),axis=0,return_index=True,return_inverse=True);loops=boundary_loops_F(weld[body['F'][foot_replace]]);assert len(loops)==2 and sorted(map(len,loops))==[28,28]and set(np.concatenate(loops))==set(weld[np.array([z[2]for z in seams])]);remaining=int((active&~foot_replace).sum())
decoded=Pq*scale+lo;decoded[ns:]=PV[ns:];fn0=np.cross(PV[FI[:,1]]-PV[FI[:,0]],PV[FI[:,2]]-PV[FI[:,0]]);fnq=np.cross(decoded[FI[:,1]]-decoded[FI[:,0]],decoded[FI[:,2]]-decoded[FI[:,0]]);qflip=int((np.einsum('ij,ij->i',fn0,fnq)<=0).sum());qarea=float(np.linalg.norm(fnq,axis=1).min()*5e5)
asset=dict(version=1,n=len(PV),bones=bones,pos=dict(lo=lo.tolist(),scale=scale.tolist(),u16=b64(Pq)),nrm=dict(i8=b64(np.round(NF*127).astype(np.int8))),index=dict(u16=b64(FI.astype(np.uint16))),joints=dict(u8=b64(J.astype(np.uint8))),weights=dict(u8=b64(Wq.astype(np.uint8))),skin='Coach_Body',seam=dict(first=ns,mesh=[s[1]for s in seams],vid=[s[2]for s in seams],ring=[s[0]for s in seams],ownNormals=True,owner='Coach_Body exact live reset position and four skin influences',limbsVid=[lookup[(s[0],s[2])]for s in seams]),limbsNrm=dict(idx=limbsIdx.tolist(),i8=b64(np.round(NLnew[limbsIdx]*127).astype(np.int8))),footCloud=cloud,paint=dict(skin=True,waistY=.935),source='Blender Human Base Meshes v1.4.1, GEO-body_male_realistic, CC0; independent R4 feet',sourceUrl='https://www.blender.org/download/demo-files/#assets',sourceSha256=sha(a.source),baseLimbsSha256=sha(limbfile),resetOffsetY=float(reset_dy),requires='limbs',keepFaces={},hideFaces={},hideFootFaces={'Coach_Body':[':'.join(map(str,sorted(t)))for t in body['F'][foot_ids].tolist()]},hideMeshes=['Coach_Sneakers','Coach_Soles','Coach_Shoe_Details'],replacement=dict(oldBodySourceFaceIds=foot_ids.tolist(),oldBodySourceTriangles=body['F'][foot_ids].tolist(),oldBodyVertexIds=np.unique(body['F'][foot_ids]).tolist(),oldBodyBounds=[B[np.unique(body['F'][foot_ids])].min(0).tolist(),B[np.unique(body['F'][foot_ids])].max(0).tolist()],remainingActiveOldBodyFaces=remaining,method='remove only certified old foot components; source face ordinals refer to original index',shoeMeshes=['Coach_Sneakers','Coach_Soles','Coach_Shoe_Details']),quantizedChecks=dict(reversedFaces=qflip,minTriangleAreaMm2=qarea),buildChecks=report)
print(json.dumps(dict(vertices=len(PV),triangles=len(FI),resetOffsetY=reset_dy,replacedOldBodyFaces=len(foot_ids),remainingActiveOldBodyFaces=remaining,quantizedChecks=asset['quantizedChecks'],limbsNormalOverrides=len(limbsIdx),footCloudCounts={k:v['count']for k,v in cloud.items()},checks=report),indent=2),flush=True)
passed=all(r['flipped_original_faces_final']==0 and r['degenerate_triangles']==0 and r['nonmanifold_edges']==0 and r['zipper_nonoutward_faces']==0 and r['capped_signed_volume_m3']>0 and r['protected_max_change_mm']<1e-8 and r['seam_error_mm']<1e-8 for r in report)and qflip==0 and qarea>1e-6
if a.out:
 assert passed and not a.out.exists();assert a.out.resolve().parent!=(repo/'drill-anim/models').resolve();a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(asset,separators=(',',':')));print('WROTE NEW ASSET',a.out,'sha256',sha(a.out))
print('BOUNDED_BUILD_CHECKS',passed,'; posed self-intersection, contact and rendering still required')
