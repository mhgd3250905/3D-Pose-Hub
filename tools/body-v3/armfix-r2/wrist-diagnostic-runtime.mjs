// Read actual render-time wrist surfaces. All hooks are restored by the caller.
// scene.onAfterRender runs inside frozen r5 twist adjustment and any opt-in corrective.
export function installWristDiagnosticInPage({seam,limbSeam}){
 const T=__toonT,v=flareInspector.viewer,V=__v2p,H=V.hands.mesh,L=V.limbs.mesh;
 if(window.__wristDiagnostic)throw Error('wrist diagnostic already installed');
 v.motion.reset();V.restHands();v.coach.updateMatrixWorld(true);
 const neutral={};for(const side of ['left','right']){
  const h=v.coach.getObjectByName(side+'Hand'),f=v.coach.getObjectByName(side+'Forearm');
  neutral[side]={localQ:h.quaternion.clone(),relativeQ:f.getWorldQuaternion(new T.Quaternion()).invert().multiply(h.getWorldQuaternion(new T.Quaternion())),inverseWorld:h.matrixWorld.clone().invert()};
 }
 const attr=(g,k)=>{const a=g.attributes[k],out=[];for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++)out.push(a.getComponent(i,j));return out;};
 const index=Array.from(H.geometry.index.array),skinIndex=attr(H.geometry,'skinIndex'),skinWeight=attr(H.geometry,'skinWeight');
 const rest=[],q=new T.Vector3();H.skeleton.update();for(let i=0;i<H.geometry.attributes.position.count;i++){H.getVertexPosition(i,q).applyMatrix4(H.matrixWorld);rest.push(...q.toArray());}
 const sides={};for(const side of ['left','right']){
  const sign=side==='left'?1:-1,local=[],ids=[];
  for(let i=0;i<H.geometry.attributes.position.count;i++){
   let best=-1,name='';for(let k=0;k<4;k++)if(skinWeight[4*i+k]>best){best=skinWeight[4*i+k];name=H.skeleton.bones[skinIndex[4*i+k]].name;}
   if(!name.startsWith(side)&&!name.startsWith('v2p_'+side[0].toUpperCase()+'_'))continue;
   q.fromArray(rest,3*i).applyMatrix4(neutral[side].inverseWorld);q.x*=sign;
   if(q.x>=-.05&&q.x<=.04){ids.push(i);local.push(...q.toArray());}
  }
  sides[side]={ids,restLocal:local};
 }
 const pairs=seam.vid.map((vid,i)=>{const j=limbSeam.vid.findIndex((x,k)=>x===vid&&limbSeam.mesh[k]===seam.mesh[i]);if(j<0)throw Error('diagnostic seam counterpart missing');return [seam.first+i,limbSeam.first+j];});
 const limbRest=[],limbSides={};L.updateMatrixWorld(true);L.skeleton.update();
 for(let i=0;i<L.geometry.attributes.position.count;i++){L.getVertexPosition(i,q).applyMatrix4(L.matrixWorld);limbRest.push(...q.toArray());}
 for(const side of ['left','right']){const ids=[],local=[],sign=side==='left'?1:-1,g=L.geometry;
  for(let i=0;i<g.attributes.position.count;i++){let best=-1,name='';for(let k=0;k<4;k++){const weight=g.attributes.skinWeight.getComponent(i,k);if(weight>best){best=weight;name=L.skeleton.bones[g.attributes.skinIndex.getComponent(i,k)].name;}}
   if(name!==side+'Forearm'&&name!==side+'Hand')continue;q.fromArray(limbRest,i*3).applyMatrix4(neutral[side].inverseWorld);q.x*=sign;
   if(q.x>=-.08&&q.x<=.045){ids.push(i);local.push(...q.toArray());}}
  limbSides[side]={ids,restLocal:local};
 }
 const limbs={index:Array.from(L.geometry.index.array),sides:limbSides,rest:limbRest,seamPairs:pairs};
 const state=window.__wristDiagnostic={index,sides,rest,limbs,rows:[],last:null};
 const protectedMeshes=[H,L].map(mesh=>({mesh,geometry:mesh.geometry,attributes:Object.fromEntries(['position','normal','skinIndex','skinWeight'].map(name=>{const a=mesh.geometry.attributes[name];return [name,{ref:a,values:Array.from(a.array)}];})),index:mesh.geometry.index,indices:Array.from(mesh.geometry.index.array)}));
 state.assertRestored=()=>{
  for(const r of protectedMeshes){if(r.mesh.geometry!==r.geometry||r.geometry.index!==r.index||r.index.array.some((x,i)=>x!==r.indices[i]))throw Error('wrist corrective changed protected geometry/index');
   for(const [name,a]of Object.entries(r.attributes)){const current=r.geometry.attributes[name];if(current!==a.ref||current.array.some((x,i)=>x!==a.values[i]))throw Error('wrist corrective failed exact buffer restoration '+name);}
  }
  for(const [bone,q]of state.expectedBoneQ||[])if(bone.quaternion.toArray().some((x,i)=>Math.abs(x-q[i])>1e-12))throw Error('wrist render failed bone restoration '+bone.name);
  return {protectedGeometryReferences:true,positionsNormalsIndicesWeightsExact:true,boneRotationsRestored:true};
 };
 state.pose=(flex,twist)=>{
  v.motion.reset();V.restHands();
  for(const side of ['left','right']){const sign=side==='left'?1:-1,h=v.coach.getObjectByName(side+'Hand');h.quaternion.copy(neutral[side].localQ).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,-sign),flex*Math.PI/180)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(sign,0,0),twist*Math.PI/180));}
  v.coach.updateMatrixWorld(true);state.expectedBoneQ=[];v.coach.traverse(o=>{if(o.isBone)state.expectedBoneQ.push([o,o.quaternion.toArray()]);});state.command={flex,twist};
 };
 const previous=v.scene.onAfterRender;
 state.hook=function(...args){previous?.apply(this,args);H.updateMatrixWorld(true);L.updateMatrixWorld(true);H.skeleton.update();L.skeleton.update();
  const world=[],p=new T.Vector3();for(let i=0;i<H.geometry.attributes.position.count;i++){H.getVertexPosition(i,p).applyMatrix4(H.matrixWorld);world.push(...p.toArray());}
  const limbWorld=[];for(let i=0;i<L.geometry.attributes.position.count;i++){L.getVertexPosition(i,p).applyMatrix4(L.matrixWorld);limbWorld.push(...p.toArray());}
  const frames={};for(const side of ['left','right']){
   const sign=side==='left'?1:-1,h=v.coach.getObjectByName(side+'Hand'),f=v.coach.getObjectByName(side+'Forearm'),fq=f.getWorldQuaternion(new T.Quaternion()),hq=h.getWorldQuaternion(new T.Quaternion()),rel=fq.clone().invert().multiply(hq),d=neutral[side].relativeQ.clone().invert().multiply(rel).normalize();
   const long=new T.Vector3(sign,0,0),palmar=new T.Vector3(0,-1,0),next=long.clone().applyQuaternion(d),axial=2*Math.atan2(d.x*sign,d.w)*180/Math.PI;
   frames[side]={wrist:h.getWorldPosition(new T.Vector3()).toArray(),handWorldQuaternion:hq.toArray(),forearmWorldQuaternion:fq.toArray(),relativeDeltaQuaternion:d.toArray(),flexDegrees:Math.atan2(next.dot(palmar),next.dot(long))*180/Math.PI,swingDegrees:Math.acos(Math.max(-1,Math.min(1,next.dot(long))))*180/Math.PI,axialTwistDegrees:((axial+540)%360)-180,handMatrixWorld:h.matrixWorld.toArray()};
  }
  const gaps=pairs.map(([hi,li])=>new T.Vector3().fromArray(world,hi*3).distanceTo(L.getVertexPosition(li,new T.Vector3()).applyMatrix4(L.matrixWorld))*1000);
  state.last={command:state.command,world,limbWorld,frames,seam:{maxGapMm:Math.max(...gaps),rmsGapMm:Math.sqrt(gaps.reduce((a,b)=>a+b*b,0)/gaps.length),pairs:gaps.length},renderTime:true,twistStats:JSON.parse(JSON.stringify(window.__wristTwistStats||{})),correctiveDiagnostics:JSON.parse(JSON.stringify(window.__handWristCorrectiveR1?.lastDiagnostics||null))};
 };
 v.scene.onAfterRender=state.hook;
 state.detach=()=>{if(v.scene.onAfterRender!==state.hook)throw Error('wrist diagnostic hook replaced');v.scene.onAfterRender=previous;delete window.__wristDiagnostic;};
 return {vertices:H.geometry.attributes.position.count,faces:index.length/3,roi:Object.fromEntries(Object.entries(sides).map(([s,x])=>[s,x.ids.length])),capture:'scene.onAfterRender: after wrist twist/corrective, before restore',axes:'hand-rest longitudinal +/-X; palmar -Y; positive flex bends longitudinal toward palmar; axial twist measured separately'};
}
