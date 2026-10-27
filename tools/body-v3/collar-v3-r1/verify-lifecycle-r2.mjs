// Real v3 lifecycle: instrument the page just before P3 attachment, then check
// bones, source geometry/materials and disposal through the unified entry.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
if(process.argv.length!==3||fs.existsSync(process.argv[2]))throw Error('new report path required');
const imp=f=>import(pathToFileURL(path.join(repo,f)).href),v3=await imp('drill-anim/models/training-human-v3-collar-r1/loader.mjs');
const {loadTheme}=await imp('drill-anim/lib/config.mjs'),{default:source}=await imp('drill-anim/specs/a-deep-squat-r3.js');
const spec={...structuredClone(source),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',...(source.v2plus||{})}};
const {b,p}=await v3.boot({size:480,pr:1,theme:loadTheme()}),realEvaluate=p.evaluate.bind(p);let captured=false;const errors=[];p.on('pageerror',e=>errors.push(String(e)));
p.evaluate=async(fn,arg)=>{
 if(!captured&&String(fn).includes('expected active v3 fragment and base torso')){
  captured=true;await realEvaluate(()=>{
   const v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);
   const torso=window.__v2p.torso.mesh,fragment=window.__v3HeadNeckFragment.fragment.mesh,garment=v.coach.getObjectByName('Mesh005'),body=v.coach.getObjectByName('Coach_Body');
   const hash=g=>{let x=2166136261;const attrs={...g.attributes,index:g.index};for(const [name,a]of Object.entries(attrs).sort()){for(let i=0;i<name.length;i++)x=Math.imul(x^name.charCodeAt(i),16777619);const raw=a.isInterleavedBufferAttribute?a.data.array:a.array;const bytes=new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength);for(const byte of bytes)x=Math.imul(x^byte,16777619);}return x>>>0;};
   const meshes=[torso,fragment,garment,body];for(const m of meshes)m.skeleton.update();
   window.__collarLifecycle={torso,fragment,garment,body,hash,meshes:meshes.map(m=>({mesh:m,geo:m.geometry,material:m.material,hash:hash(m.geometry),skeleton:m.skeleton,inverses:m.skeleton.boneInverses.map(a=>a.toArray())})),bones:body.skeleton.bones.map(b=>({bone:b,name:b.name,parent:b.parent,matrix:b.matrix.toArray()})),neck:window.__v3HeadNeckFragment.neck,head:window.__v3HeadNeckFragment.head};
  });
 }
 return realEvaluate(fn,arg);
};
try{
 const installed=await v3.applyV3(p,spec,{});if(!captured)throw Error('pre-attach capture was not reached');
 const attached=await realEvaluate(()=>{
  const v=flareInspector.viewer,s=window.__collarLifecycle,q=window.__collarShared,z=window.__collarGarmentRefinement;v.coach.updateMatrixWorld(true);let maxBoneLocalDifference=0,maxInverseDifference=0;
  const boneIdentity=s.bones.every((x,i)=>{const b=s.body.skeleton.bones[i];for(let k=0;k<16;k++)maxBoneLocalDifference=Math.max(maxBoneLocalDifference,Math.abs(b.matrix.elements[k]-x.matrix[k]));return b===x.bone&&b.name===x.name&&b.parent===x.parent&&q.mesh.skeleton.bones.find(candidate=>candidate.name===b.name)===b;});
  const sources=s.meshes.map(x=>{const original=x.mesh===s.garment?z.originalGeo:x.mesh.geometry,originalMaterial=x.mesh===s.garment?z.originalMaterial:x.mesh.material;for(let i=0;i<x.inverses.length;i++)for(let k=0;k<16;k++)maxInverseDifference=Math.max(maxInverseDifference,Math.abs(x.mesh.skeleton.boneInverses[i].elements[k]-x.inverses[i][k]));return{identity:original===x.geo,material:originalMaterial===x.material,skeleton:x.mesh.skeleton===x.skeleton,hash:s.hash(original)===x.hash};});
  const disposed={collarGeo:false,garmentGeo:false,garmentMat:false,fragmentGeo:false,collarMaterials:0,fragmentMaterials:0};q.mesh.geometry.addEventListener('dispose',()=>disposed.collarGeo=true);z.geo.addEventListener('dispose',()=>disposed.garmentGeo=true);z.material.addEventListener('dispose',()=>disposed.garmentMat=true);s.fragment.geometry.addEventListener('dispose',()=>disposed.fragmentGeo=true);q.mesh.material.forEach(m=>m.addEventListener('dispose',()=>disposed.collarMaterials++));s.fragment.material.forEach(m=>m.addEventListener('dispose',()=>disposed.fragmentMaterials++));s.disposed=disposed;
  return{bones:s.bones.length,boneIdentity,maxBoneLocalDifference,maxInverseDifference,sources,sharedMeshCount:v.coach.getObjectsByProperty('name','V3_Head_Neck_Torso_Shared_R25').length,materialCount:q.mesh.material.length};
 });
 if(attached.bones!==52||!attached.boneIdentity||attached.maxBoneLocalDifference>1e-8||attached.maxInverseDifference>1e-8||attached.sharedMeshCount!==1||attached.materialCount!==3||attached.sources.some(x=>!x.identity||!x.material||!x.skeleton||!x.hash))throw Error('attachment lifecycle regression '+JSON.stringify(attached));
 const result=await v3.detach(p);
 const detached=await realEvaluate(()=>{
  const s=window.__collarLifecycle,v=flareInspector.viewer;let shared=0,fragment=0;v.coach.traverse(o=>{if(o.name==='V3_Head_Neck_Torso_Shared_R25')shared++;if(o===s.fragment)fragment++;});
  return{shared,fragment,globalsCleared:!window.__collarShared&&!window.__collarGarmentRefinement&&!window.__v3HeadNeckFragment,garmentGeometryRestored:s.garment.geometry===s.meshes[2].geo,garmentMaterialRestored:s.garment.material===s.meshes[2].material,garmentHashRestored:s.hash(s.garment.geometry)===s.meshes[2].hash,torsoGeometryRestored:s.torso.geometry===s.meshes[0].geo,torsoHashRestored:s.hash(s.torso.geometry)===s.meshes[0].hash,torsoVisible:s.torso.visible,neckVisible:s.neck.visible,headVisible:s.head.visible,disposed:s.disposed};
 });
 if(!result||detached.shared||detached.fragment||!detached.globalsCleared||!detached.garmentGeometryRestored||!detached.garmentMaterialRestored||!detached.garmentHashRestored||!detached.torsoGeometryRestored||!detached.torsoHashRestored||!detached.torsoVisible||!detached.neckVisible||!detached.headVisible||Object.values(detached.disposed).some(x=>!x)||detached.disposed.collarMaterials!==3||detached.disposed.fragmentMaterials!==2)throw Error('detach lifecycle regression '+JSON.stringify(detached));
 if(errors.length)throw Error('page errors: '+JSON.stringify(errors));
 fs.writeFileSync(process.argv[2],JSON.stringify({installed,attached,detached,pageErrors:errors},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({attached,detached}));
}finally{await b.close();}
