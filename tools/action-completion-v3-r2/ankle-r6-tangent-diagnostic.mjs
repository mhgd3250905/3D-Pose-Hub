import fs from 'node:fs';import * as T from 'three';import {makeAnkleSectionField} from './ankle-join-r5.mjs';import {makeAnkleCurveStudyMath} from './ankle-r6-curve-study.mjs';
const source=JSON.parse(fs.readFileSync('F:/PoseHub-v2-production/ankle-review-20261029/bear-baseline-r1/probe.json')).rest,capture=JSON.parse(fs.readFileSync('F:/PoseHub-v2-production/template-finalization-20261029/captures/h-mountain-climber/attempt01/capture.json')),math=makeAnkleCurveStudyMath(T),lo=-.018,hi=.185,N={};
for(const side of ['left','right']){
 const ankle=new T.Vector3().fromArray(source.bones[side+'Foot'].worldPosition),axis=new T.Vector3().fromArray(source.bones[side+'Shin'].worldPosition).sub(ankle).normalize(),X=new T.Vector3(1,0,0).addScaledVector(axis,-axis.x).normalize(),Z=X.clone().cross(axis).normalize(),basis=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(X,axis,Z)),inv=basis.clone().invert(),local=p=>new T.Vector3().fromArray(p).sub(ankle).applyQuaternion(inv),vertices=[],triangles=[];
 for(const name of ['Coach_Body','V2P_Base_Limbs']){
  const M=new Map(source.meshes[name].vertices.map(v=>[v.id,{v,p:local(v.world)}]));
  for(const {v,p}of M.values())if((v.world[0]>=0?'left':'right')===side&&p.y>=lo&&p.y<=hi&&Math.hypot(p.x,p.z)<=.105&&v.weights.every(w=>[side+'Foot',side+'Shin'].includes(w.bone)))vertices.push({name,id:v.id,p});
  triangles.push(source.meshes[name].facesOriginalIndices.filter(f=>f.every(i=>(M.get(i).v.world[0]>=0?'left':'right')===side)).map(f=>f.map(i=>M.get(i).p.toArray())));
 }
 const heights=source.seams.filter(s=>s.side==='ankle_'+side).map(s=>local(s.bodyWorld).y),field=makeAnkleSectionField(triangles,lo,hi,heights.reduce((a,b)=>a+b,0)/heights.length);
 for(const v of vertices){const r=Math.hypot(v.p.x,v.p.z),delta=field.query(v.p.y,Math.atan2(v.p.z,v.p.x));v.radial=[v.p.x*(r+delta)/r,v.p.z*(r+delta)/r];v.t=(v.p.y-lo)/(hi-lo);}
 N[side]={ankle,axis,basis,vertices,footInv:new T.Matrix4().fromArray(source.bones[side+'Foot'].matrixWorld).invert(),shinInv:new T.Matrix4().fromArray(source.bones[side+'Shin'].matrixWorld).invert()};
}
const result=[];
for(const [frame,side]of [[48,'right']]){
 const m=capture.metrics.find(m=>m.frame===frame),n=N[side],r=m.actualRenderRotations[side],F=new T.Matrix4().compose(new T.Vector3().fromArray(m.joints[side+'Ankle']),new T.Quaternion().fromArray(r.foot.worldQuaternion),new T.Vector3(1,1,1)).multiply(n.footInv),S=new T.Matrix4().compose(new T.Vector3().fromArray(m.joints[side+'Knee']),new T.Quaternion().fromArray(r.lowerLeg.worldQuaternion),new T.Vector3(1,1,1)).multiply(n.shinInv),p0=new T.Vector3(0,lo,0).applyQuaternion(n.basis).add(n.ankle).applyMatrix4(F),p1=new T.Vector3(0,hi,0).applyQuaternion(n.basis).add(n.ankle).applyMatrix4(S),q0=new T.Quaternion().setFromRotationMatrix(F).multiply(n.basis),q1=new T.Quaternion().setFromRotationMatrix(S).multiply(n.basis),state=math.state(p0,p1,q0,q1,hi-lo),values=[];
 for(const startScale of [.25,.5,.75,1,1.25,1.5,2,2.5,3])for(const endScale of [.25,.5,.75,1,1.25,1.5,2,2.5,3]){
 state.startScale=startScale;state.endScale=endScale;let minJ=Infinity,maxMove=0,maxK=0;
 for(const v of n.vertices){const eps=1e-5,t=v.t,A=math.point(state,t-eps,...v.radial),B=math.point(state,t+eps,...v.radial),a=math.section(state,t-eps).center,b=math.section(state,t+eps).center,tangent=math.section(state,t).tangent,J=B.sub(A).dot(tangent)/b.sub(a).length();minJ=Math.min(minJ,J);maxMove=Math.max(maxMove,math.point(state,t,...v.radial).distanceTo(math.point({...state,startScale:1,endScale:1},t,...v.radial))*1000);maxK=Math.max(maxK,math.section(state,t).curvature);}
 result.push({startScale,endScale,minJ,maxDisplacementFromR5Mm:maxMove,maxCurvature:maxK});
 }
}
result.sort((a,b)=>b.minJ-a.minJ);
const out='F:/PoseHub-v2-production/template-finalization-20261029/planning/mountain-climber-r6-tangent-study.json';fs.writeFileSync(out,JSON.stringify({scope:'right peak frame48, scale grid; CPU study only, endpoint tangent directions/curvature preserved but endpoint derivative magnitudes change',results:result},null,2));console.log(JSON.stringify(result.slice(0,15),null,2));
