import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as T from 'three';
const root=new URL('../',import.meta.url),read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
const data=read('hands-native-c1r2-symmetric-r1/hands-base.json'),limb=read('training-human-v2plus-limbs-base.json');
const rest=JSON.parse(fs.readFileSync(new URL('./rest-fixture.json',import.meta.url),'utf8'));
const scene=new T.Scene(),coach=new T.Group();scene.add(coach);const bones=new Map();
for(const name of new Set([...data.bones,...limb.bones])){const b=new T.Bone();b.name=name;const src=rest.bones[name];if(src){b.position.fromArray(src.p);b.quaternion.fromArray(src.q);}coach.add(b);bones.set(name,b);}
coach.updateMatrixWorld(true);const originalBones=[...bones.values()].map(b=>({b,p:b.position.clone(),q:b.quaternion.clone()}));
function piece(d){const dec=(v,C)=>{const b=Buffer.from(v,'base64');return new C(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};const q=dec(d.pos.u16,Uint16Array),p=Float32Array.from(q,(x,i)=>d.pos.lo[i%3]+x*d.pos.scale[i%3]),n=Float32Array.from(dec(d.nrm.i8,Int8Array),x=>x/127),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('skinIndex',new T.BufferAttribute(dec(d.joints.u8,Uint8Array),4));g.setAttribute('skinWeight',new T.BufferAttribute(Float32Array.from(dec(d.weights.u8,Uint8Array),x=>x/255),4));g.setIndex(new T.BufferAttribute(dec(d.index.u16,Uint16Array),1));const m=new T.SkinnedMesh(g,new T.MeshBasicMaterial());coach.add(m);const sk=new T.Skeleton(d.bones.map(n=>bones.get(n)));m.bind(sk);return {mesh:m,on:true};}
const hands=piece(data),limbs=piece(limb),pairs=data.limbsNrm.idx.map((i,k)=>[data.seam.first+k,i]);
// Runtime loader welds both pieces to exactly the same Coach_Body seam vertex.
for(const [hi,li]of pairs){const a=hands.mesh.geometry.attributes.position,b=limbs.mesh.geometry.attributes.position;b.setXYZ(li,a.getX(hi),a.getY(hi),a.getZ(hi));const sih=hands.mesh.geometry.attributes.skinIndex,swh=hands.mesh.geometry.attributes.skinWeight,sil=limbs.mesh.geometry.attributes.skinIndex,swl=limbs.mesh.geometry.attributes.skinWeight;for(let k=0;k<4;k++){const name=data.bones[sih.getComponent(hi,k)];sil.setComponent(li,k,limb.bones.indexOf(name));swl.setComponent(li,k,swh.getComponent(hi,k));}}
const motion={capturePose:()=>({}),applyPose(){},reset(){for(const r of originalBones){r.b.position.copy(r.p);r.b.quaternion.copy(r.q);}coach.updateMatrixWorld(true);}};
let renders=0;const renderer={render(s,c){s.onBeforeRender?.(this,s,c,null);renders++;s.onAfterRender?.(this,s,c);}};
const viewer={scene,coach,motion,renderer,camera:new T.PerspectiveCamera()},window={__toonT:T,__v2p:{hands,limbs},flareInspector:{viewer},__armfixR2Init:{},__wristCorrectiveOptions:{enabled:true,seamPairs:pairs},__drill:{},__wristTwistShare:.5};window.window=window;
const ctx=vm.createContext({...window,window,console});vm.runInContext(fs.readFileSync(new URL('./kernel.js',import.meta.url),'utf8'),ctx);
const K=window.__createWristCorrectiveKernel(T);let assertions=0;
for(const angle of [-75,-60,-30,0,30,60,75]){const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),angle*Math.PI/180),lo=-.06,hi=.03;for(const x of [lo,hi]){const p=new T.Vector3(x,.012,.008),expected=x===lo?p:p.clone().applyQuaternion(q);assert.ok(K.target(p,q,lo,hi).distanceTo(expected)<1e-12);assertions++;}for(let j=0;j<=10;j++){const p=new T.Vector3(lo+(hi-lo)*j/10,.012,.008),v=K.target(p,q,lo,hi);assert.ok(v.toArray().every(Number.isFinite));assertions++;}}
// The real frozen twist wrapper runs around the stub renderer, exactly as in browser.
vm.runInContext(fs.readFileSync(new URL('../hands-native-r5/wrist-twist.js',import.meta.url),'utf8'),ctx);
vm.runInContext(fs.readFileSync(new URL('./runtime.js',import.meta.url),'utf8'),ctx);
const api=window.__wristCorrective,snap=[hands,limbs].map(p=>({P:p.mesh.geometry.attributes.position.array.slice(),N:p.mesh.geometry.attributes.normal.array.slice()}));
const report=[];for(const angle of [-75,-60,-30,0,30,60,75]){
 motion.reset();for(const side of ['left','right']){const b=bones.get(side+'Hand');b.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,side==='left'?1:-1),angle*Math.PI/180));}coach.updateMatrixWorld(true);const saved=[...bones.values()].map(b=>b.quaternion.toArray());
 const measurement=api.sample(()=>{assert.equal(api.sample(()=>42),42);let seam=0;const a=new T.Vector3(),b=new T.Vector3();for(const [hi,li]of pairs){hands.mesh.getVertexPosition(hi,a).applyMatrix4(hands.mesh.matrixWorld);limbs.mesh.getVertexPosition(li,b).applyMatrix4(limbs.mesh.matrixWorld);seam=Math.max(seam,a.distanceTo(b));}return {angle,seamMm:seam*1000,diagnostics:api.last};});
 assert.ok(measurement.seamMm<.001,JSON.stringify(measurement));assertions++;for(const [k,p]of [hands,limbs].entries()){assert.deepEqual(p.mesh.geometry.attributes.position.array,snap[k].P);assert.deepEqual(p.mesh.geometry.attributes.normal.array,snap[k].N);assertions+=2;}[...bones.values()].forEach((b,i)=>{assert.ok(b.quaternion.toArray().every((x,k)=>Math.abs(x-saved[i][k])<1e-12));});report.push(measurement);
}
api.setEnabled(false);api.sample(()=>assert.equal(api.last.changedVertices,0));assert.throws(()=>api.sample(()=>{throw Error('sample deliberate');}),/sample deliberate/);api.dispose();assert.equal(api.active,false);
console.log(JSON.stringify({passed:true,assertions,renders,config:api.config,grid:report},null,2));
