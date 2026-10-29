// Replays captured source geometry and bone transforms through the real runtime
// installer. No WebGL, scene screenshots, or GPU process is involved.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as R3 from './ankle-join-r3.mjs';
import * as R4 from './ankle-join-r4.mjs';
const baseline=process.argv[2];if(!baseline)throw Error('Usage: node ankle-join-r4-captured-test.mjs BASELINE_DIR [FAILED_LIVE_JSON]');
const source=JSON.parse(fs.readFileSync(path.join(baseline,'probe.json'))).rest;
const live=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3])).report.rest:null;
const fixtures=[['captured-baseline',source],...(live?[['failed-live-install',live]]:[])];
let finalConfig=null;const results=[];const out=process.argv[4];if(out)fs.mkdirSync(out,{recursive:true});
for(const [fixture,rest]of fixtures)for(const [version,module]of [['r3',R3],['r4',R4]]){
 const coach=new T.Group(),scene=new T.Scene();scene.add(coach);const boneNames=Object.keys(rest.bones),bones=boneNames.map(name=>{const b=new T.Bone();b.name=name;new T.Matrix4().fromArray(rest.bones[name].matrixWorld).decompose(b.position,b.quaternion,b.scale);coach.add(b);return b;});
 coach.updateMatrixWorld(true);
 const meshes={};for(const name of ['Coach_Body','V2P_Base_Limbs','Coach_Sneakers','Coach_Shoe_Details']){
  const data=rest.meshes[name],g=new T.BufferGeometry(),positions=new Float32Array(data.vertexCount*3),skinIndex=new Uint16Array(data.vertexCount*4),skinWeight=new Float32Array(data.vertexCount*4);
  for(const v of data.vertices){positions.set(v.world,v.id*3);v.weights.forEach((w,k)=>{const id=boneNames.indexOf(w.bone);if(id<0)throw Error('Unknown fixture bone: '+w.bone);skinIndex[v.id*4+k]=id;skinWeight[v.id*4+k]=w.weight;});}
  g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('skinIndex',new T.BufferAttribute(skinIndex,4));g.setAttribute('skinWeight',new T.BufferAttribute(skinWeight,4));g.setIndex(data.facesOriginalIndices.flat());g.computeVertexNormals();const m=new T.SkinnedMesh(g,new T.MeshBasicMaterial());m.name=name;coach.add(m);m.bind(new T.Skeleton(bones));meshes[name]=m;
 }
 const reset=()=>{for(const b of bones)new T.Matrix4().fromArray(rest.bones[b.name].matrixWorld).decompose(b.position,b.quaternion,b.scale);};
 const v={coach,scene,camera:new T.PerspectiveCamera(),renderer:{render(){scene.onBeforeRender();scene.onAfterRender();}},motion:{reset,capturePose(){return{};},applyPose(){}}};
 globalThis.window={__toonT:T,__ankleIntegratedR4:{},__v2p:{limbs:{on:true,mesh:meshes.V2P_Base_Limbs}},__makeAnkleJoinMath:module.makeAnkleJoinMath,__fairAnkleContours:module.fairAnkleContours};globalThis.flareInspector={viewer:v};
 const pairs=rest.seams.map(s=>[s.side.replace('ankle_',''),s.bodyId,s.limbId]);finalConfig=module.installAnkleJoinInPage({pairs});
 const api=window[version==='r3'?'__ankleJoinR3':'__ankleJoinR4'];const snapshots=Object.fromEntries(Object.entries(meshes).map(([n,m])=>[n,{p:m.geometry.attributes.position.array.slice(),n:m.geometry.attributes.normal.array.slice()}]));
 for(const frame of [0,60,120]){
  const pose=JSON.parse(fs.readFileSync(path.join(baseline,`frame-${String(frame).padStart(4,'0')}-geometry.json`)));for(const b of bones)new T.Matrix4().fromArray(pose.bones[b.name].matrixWorld).decompose(b.position,b.quaternion,b.scale);coach.updateMatrixWorld(true);
  let error=null,diagnostics=null;try{diagnostics=api.sample(()=>{
    if(out&&version==='r4'&&fixture==='captured-baseline'){
      const exported=structuredClone(pose),world=(name,id)=>meshes[name].getVertexPosition(id,new T.Vector3()).applyMatrix4(meshes[name].matrixWorld).toArray();
      for(const [name,data]of Object.entries(exported.meshes))if(meshes[name])for(const vert of data.vertices){vert.world=world(name,vert.id);vert.normal=new T.Vector3().fromBufferAttribute(meshes[name].geometry.attributes.normal,vert.id).toArray();}
      exported.seamMaxGapMm=0;for(const seam of exported.seams){seam.bodyWorld=world('Coach_Body',seam.bodyId);seam.limbWorld=world('V2P_Base_Limbs',seam.limbId);seam.gapMm=new T.Vector3().fromArray(seam.bodyWorld).distanceTo(new T.Vector3().fromArray(seam.limbWorld))*1000;exported.seamMaxGapMm=Math.max(exported.seamMaxGapMm,seam.gapMm);}
      exported.cpuReplay={method:'actual runtime install/update in Three CPU scene on captured source and bone matrices',actualGpu:false,diagnostics:structuredClone(api.last)};
      fs.writeFileSync(path.join(out,`frame-${String(frame).padStart(4,'0')}-geometry.json`),JSON.stringify(exported));
    }
    return structuredClone(api.last);
  });}catch(e){error=e.message;}
  for(const [name,m]of Object.entries(meshes)){assert.deepEqual(m.geometry.attributes.position.array,snapshots[name].p);assert.deepEqual(m.geometry.attributes.normal.array,snapshots[name].n);}
  if(version==='r3')assert.match(error??'',/Ankle corrected seam opened/,'actual split-neighborhood source must reproduce r3 failure');
  else{assert.equal(error,null);assert.ok(diagnostics.preSyncSeamMaxGapMm<.01);assert.ok(diagnostics.seamMaxGapMm<.01);}
  results.push({fixture,version,frame,error,seamMaxGapMm:diagnostics?.seamMaxGapMm,preSyncSeamMaxGapMm:diagnostics?.preSyncSeamMaxGapMm,maxSeamSyncCorrectionMm:diagnostics?.maxSeamSyncCorrectionMm,restored:true});
 }
 api.detach();
}
if(out){fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({rest:source,actualGpu:false,adapter:finalConfig}));fs.writeFileSync(path.join(out,'captured-runtime-test.json'),JSON.stringify(results,null,2));}console.log(JSON.stringify(results,null,2));
