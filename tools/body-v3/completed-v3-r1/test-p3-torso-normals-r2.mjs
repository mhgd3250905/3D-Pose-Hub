// Offline topology probe using captured rest torso and the actual P2 fragment.
// Dummy materials and an identity-at-rest torso bind test geometry only.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
if(process.argv.length!==4)throw Error('Usage: node verify-collar-offline-r1.mjs <rest.json> <new-report.json>');
const output=path.resolve(process.argv[3]);if(fs.existsSync(output))throw Error('report exists');
const imp=f=>import(pathToFileURL(path.join(root,f)).href);
const {restoreHeadNeck}=await imp('drill-anim/models/head-neck-restore-r3/loader.mjs');
const {applyCollarShared}=await imp('drill-anim/models/collar-weld-r26/loader.mjs');
const buf=fs.readFileSync(path.join(root,'drill-anim/models/head-neck-fragment-r3/head-neck.glb'));
const gltf=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
const restored=restoreHeadNeck(gltf.scene),head=restored.mesh;
const rest=JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),'utf8')).meshes.V2P_Base_Torso;
const bonesByName=new Map(head.skeleton.bones.map(b=>[b.name,b]));const bones=rest.bones.map(n=>{const b=bonesByName.get(n);if(!b)throw Error('bone missing '+n);return b;});
gltf.scene.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones,bones.map(b=>b.matrixWorld.clone().invert()));
const geo=new THREE.BufferGeometry();for(const [name,key,size,Type] of [['position','P',3,Float32Array],['normal','N',3,Float32Array],['skinIndex','J',4,Uint16Array],['skinWeight','W',4,Float32Array]])geo.setAttribute(name,new THREE.BufferAttribute(new Type(rest[key]),size));geo.setIndex(new THREE.BufferAttribute(new Uint32Array(rest.index),1));
const torso=new THREE.SkinnedMesh(geo,new THREE.MeshToonMaterial());gltf.scene.add(torso);torso.bind(skeleton,new THREE.Matrix4());torso.visible=true;gltf.scene.updateMatrixWorld(true);skeleton.update();head.skeleton.update();
globalThis.window={__toonT:THREE,__v3HeadNeckFragment:{fragment:{mesh:head}},__v2p:{torso:{mesh:torso,on:true}},__drill:{selectModelProfile(){}}};
globalThis.flareInspector={viewer:{coach:gltf.scene,motion:{reset(){}}}};window.flareInspector=globalThis.flareInspector;
// Simulate a preexisting piece-normal repair distinct from the captured rest.
const a=torso.geometry.attributes.normal,q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.08),v=new THREE.Vector3();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyQuaternion(q);a.setXYZ(i,v.x,v.y,v.z);}const before=Array.from(a.array);
const page={evaluate:async(fn,arg)=>fn(arg)};const report=await applyCollarShared(page);const outN=window.__collarShared.mesh.geometry.attributes.normal,offset=outN.count-a.count,candidate=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/collar-weld-r26/candidate.json'))),ring=new Set(candidate.torsoRing);let maxOutside=0,ringChanged=0;for(let i=0;i<a.count;i++){let diff=0;for(let k=0;k<3;k++)diff=Math.max(diff,Math.abs(outN.getComponent(offset+i,k)-before[i*3+k]));if(ring.has(i)){if(diff>1e-6)ringChanged++;}else maxOutside=Math.max(maxOutside,diff);}if(maxOutside>1e-7||ringChanged===0)throw Error('P3 normal preservation failed '+JSON.stringify({maxOutside,ringChanged}));const result={torsoVertices:a.count,ringVertices:ring.size,maxOutside,ringChanged,limitations:'Synthetic normal rotation and captured rest torso, not real piece-normal or rendering test.'};fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
