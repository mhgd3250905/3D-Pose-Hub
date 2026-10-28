"""CPU structural audit of the independently versioned symmetric hand."""
import argparse,base64,json,hashlib
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation
REPO=Path(__file__).resolve().parents[3]
def un(s,t,k):return np.frombuffer(base64.b64decode(s),t).reshape(-1,k)
def decode(d):return np.array(d['pos']['lo'])+un(d['pos']['u16'],'<u2',3)*d['pos']['scale']
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--rest',type=Path,required=True);ap.add_argument('--output',type=Path);a=ap.parse_args();root=REPO/'drill-anim/models';old=json.loads((root/'hands-native-c1r2/hands-base.json').read_text());new=json.loads((root/'hands-native-c1r2-symmetric-r1/hands-base.json').read_text());O=decode(old);P=decode(new);F=un(new['index']['u16'],'<u2',3);first=new['seam']['first'];rest=json.loads(a.rest.read_text());L=P[:,0]>0;R=~L
 metrics={'format':'pose-hub-symmetric-hand-cpu-audit@1','vertices':len(P),'faces':len(F),'bones':len(new['bones']),'seamVertices':len(P)-first,'unchanged':{k:old[k]==new[k] for k in ['bones','index','joints','weights','seam','keepFaces','hideFaces','hideMeshes','requires']},'rigByteIdentical':(root/'hands-native-c1r2/hands-rig.json').read_bytes()==(root/'hands-native-c1r2-symmetric-r1/hands-rig.json').read_bytes(),'leftPositionMaxChangeMm':float(np.linalg.norm(P[L]-O[L],axis=1).max()*1000),'seamPositionMaxChangeMm':float(np.linalg.norm(P[first:]-O[first:],axis=1).max()*1000)}
 loc={};dims={}
 for side,sign in [('left',1),('right',-1)]:
  h=rest['bones'][side+'Hand'];T=Rotation.from_quat(h['q']).as_matrix();ids=P[:,0]*sign>0;local=((P[ids]-h['p'])@T)*[sign,1,1];oldLocal=((O[ids]-h['p'])@T)*[sign,1,1];loc[side]=local
  dims[side]={'tipFromHandOriginMm':float(local[:,0].max()*1000),'oldTipFromHandOriginMm':float(oldLocal[:,0].max()*1000),'widthMm':float(np.ptp(local[:,2])*1000),'depthMm':float(np.ptp(local[:,1])*1000)}
 metrics['dimensions']=dims;metrics['tipDifferenceMm']=abs(dims['left']['tipFromHandOriginMm']-dims['right']['tipFromHandOriginMm'])
 for name,minimum in [('full',-.1),('palmAndFingers',.035)]:
  l=loc['left'][loc['left'][:,0]>minimum];r=loc['right'][loc['right'][:,0]>minimum];dist=np.r_[cKDTree(l).query(r)[0],cKDTree(r).query(l)[0]];metrics[name+'MirrorNearestMm']={'max':float(dist.max()*1000),'p95':float(np.quantile(dist,.95)*1000),'rms':float(np.sqrt(np.mean(dist**2))*1000)}
 W=un(new['weights']['u8'],'u1',4).astype(int);J=un(new['joints']['u8'],'u1',4);N=un(new['nrm']['i8'],'i1',3)/127;tri=np.cross(P[F[:,1]]-P[F[:,0]],P[F[:,2]]-P[F[:,0]]);areas=np.linalg.norm(tri,axis=1)/2
 edges=np.sort(np.concatenate([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]),axis=1);edges,count=np.unique(edges,axis=0,return_counts=True)
 metrics['weights']={'allSums255':bool(np.all(W.sum(1)==255)),'validBoneIndices':bool(J.max()<len(new['bones'])),'unchangedEncodedWeights':new['weights']==old['weights'],'unchangedEncodedJoints':new['joints']==old['joints']};metrics['topology']={'boundaryEdges':int(np.sum(count==1)),'nonManifoldEdges':int(np.sum(count>2)),'zeroAreaTriangles':int(np.sum(areas<1e-14)),'minimumTriangleAreaMm2':float(areas.min()*1e6)};metrics['normals']={'finite':bool(np.isfinite(N).all()),'lengthMin':float(np.linalg.norm(N,axis=1).min()),'lengthMax':float(np.linalg.norm(N,axis=1).max()),'sharedSeamNormalsExact':bool(np.array_equal(un(new['nrm']['i8'],'i1',3)[first:],un(new['limbsNrm']['i8'],'i1',3)))}
 checks=[all(metrics['unchanged'].values()),metrics['rigByteIdentical'],metrics['leftPositionMaxChangeMm']==0,metrics['seamPositionMaxChangeMm']==0,metrics['weights']['allSums255'],metrics['weights']['validBoneIndices'],metrics['tipDifferenceMm']<.1,metrics['palmAndFingersMirrorNearestMm']['max']<.1,metrics['topology']['nonManifoldEdges']==0,metrics['topology']['zeroAreaTriangles']==0,metrics['normals']['sharedSeamNormalsExact']]
 metrics['passed']=all(checks);metrics['limitations']=['CPU/rest geometry only; renderer loading, posed grip, support/contact, collision, full motion and user visual acceptance are separate gates.','Wrist topology remains the original asymmetric 53-face zipper per side; its rest shape is close but not perfectly mirror-identical.','Historical frame reconstructed from rounded rig; distal affine fit residual is recorded in build-provenance.json.']
 if a.output:a.output.write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(metrics,indent=2));assert metrics['passed']
if __name__=='__main__':main()
