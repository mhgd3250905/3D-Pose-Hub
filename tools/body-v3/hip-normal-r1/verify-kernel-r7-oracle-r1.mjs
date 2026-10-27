// Independent CPU oracle for shader-shaped geometry, no browser or GPU.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';

const geometry=new T.BufferGeometry();const pos=new Float32Array([0,0,0, .08,0,.01, 0,.07,.015, .08,.07,.025, 1,1,1]);
const normal=new Float32Array(15),joints=new Uint16Array(20),weights=new Float32Array(20);for(let i=0;i<5;i++)weights[4*i]=1;
geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setAttribute('normal',new T.BufferAttribute(normal,3));geometry.setAttribute('skinIndex',new T.BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new T.BufferAttribute(weights,4));geometry.setIndex([0,1,2,1,3,2]);
// Morph 0 is an independent non-P5 deformation on needed geometry. Morph 1
// represents a P5 target on an unrelated vertex and is zero on all needed IDs.
const morphP=new Float32Array(15),morphN=new Float32Array(15),p5P=new Float32Array(15),p5N=new Float32Array(15);morphP.set([.001,-.002,.004],3);morphP.set([-.002,.001,-.003],6);for(let i=0;i<4;i++)morphN.set([.025,-.015,.01],3*i);p5P.set([.03,.02,.01],12);p5N.set([.2,.1,.1],12);
geometry.morphTargetsRelative=true;geometry.morphAttributes.position=[new T.BufferAttribute(morphP,3),new T.BufferAttribute(p5P,3)];geometry.morphAttributes.normal=[new T.BufferAttribute(morphN,3),new T.BufferAttribute(p5N,3)];
const materials=Array.from({length:3},()=>new T.MeshToonMaterial());let oldCalls=0;materials[2].onBeforeCompile=sh=>{oldCalls++;sh.uniforms.oldTheme={value:1};};const oldHook=materials[2].onBeforeCompile;materials[2].customProgramCacheKey=()=> 'beforeHip';
const scene=new T.Scene(),coach=new T.Group();scene.add(coach);const pelvis=new T.Bone(),left=new T.Bone(),right=new T.Bone();pelvis.name='pelvis';left.name='leftThigh';right.name='rightThigh';coach.add(pelvis);pelvis.add(left,right);pelvis.rotation.set(.23,-.14,.19);pelvis.scale.set(1.1,.85,1.25);scene.updateMatrixWorld(true);
const mesh=new T.SkinnedMesh(geometry,materials);mesh.position.set(.03,.06,-.01);mesh.rotation.set(.31,-.4,.22);mesh.scale.set(1.6,.7,1.25);coach.add(mesh);const skeleton=new T.Skeleton([pelvis,left,right]);const bind=new T.Matrix4().compose(new T.Vector3(.04,-.02,.03),new T.Quaternion().setFromEuler(new T.Euler(-.3,.22,.27)),new T.Vector3(.8,1.4,.95));mesh.bind(skeleton,bind);mesh.updateMorphTargets();mesh.morphTargetInfluences[0]=.4;mesh.morphTargetInfluences[1]=.8;coach.updateMatrixWorld(true);skeleton.update();
const local=new T.Matrix4().copy(mesh.bindMatrixInverse).multiply(new T.Matrix4().fromArray(skeleton.boneMatrices,0)).multiply(mesh.bindMatrix),skin3=new T.Matrix3().setFromMatrix4(local),mesh3=new T.Matrix3().setFromMatrix4(mesh.matrixWorld),worldN=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
const basePoint=i=>mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld),A=basePoint(0),B=basePoint(1),C=basePoint(2),baseGeo=B.clone().sub(A).cross(C.clone().sub(A)).normalize();
// Choose original attribute so its shader-space normal starts on the base
// geometric normal, compensating for the nonzero generic normal morph.
const normalBeforeMorph=baseGeo.clone().applyMatrix3(mesh3.clone().transpose()).applyMatrix3(skin3.clone().invert()).normalize().sub(new T.Vector3(.025,-.015,.01).multiplyScalar(.4));for(let i=0;i<5;i++)normalBeforeMorph.toArray(normal,3*i);geometry.attributes.normal.needsUpdate=true;
const beforePoints=[0,1,2,3].map(basePoint),beforeAttrs={position:geometry.attributes.position,normal:geometry.attributes.normal,skinIndex:geometry.attributes.skinIndex,skinWeight:geometry.attributes.skinWeight},restWorld={};for(const b of [pelvis,left,right])restWorld[b.name]=b.matrixWorld.toArray();
let p5Calls=0;mesh.userData.__currentShouldersR1={update(){p5Calls++;},report(){return {amounts:[.8,.4]};}};
const window={__toonT:T,flareInspector:{viewer:{coach}},__collarShared:{mesh},__v2p:{torso:{on:true}}};vm.runInNewContext(fs.readFileSync(process.argv[2]||new URL('../../../drill-anim/models/training-human-v3-completed-r7/hip-kernel.js',import.meta.url),'utf8'),{window,console});
const mask={offset:0,sourceCount:5,rows:[[0,1,'left',1,2]],p5Overlap:{left:{nonzeroPositionOverlap:0},right:{nonzeroPositionOverlap:0},normal:{targetsOverlap:0}},restBoneWorld:restWorld},api=window.__installHipNormalR1(mask),attr=geometry.attributes.aHipLocalNormal;
assert.equal(api.update(scene,{}).skipped,'shader-not-ready-or-missing-input');assert.equal(attr.getW(0),0);
const mm=new Float32Array(20),vr=new Float32Array(20);for(let i=0;i<5;i++)vr.set([i*.025,1.24+(i%2)*.035,.06],4*i);mm[3]=.001;mm[7]=.004;mm[11]=.008;mm[15]=.002;
const shader={vertexShader:'#include <skinnormal_vertex>\n#include <defaultnormal_vertex>\n#include <normal_vertex>\n#include <begin_vertex>\n#include <skinning_vertex>',fragmentShader:'#include <opaque_fragment>\n#include <dithering_fragment>',uniforms:{uFieldOn:{value:1},uSinkK:{value:.75},uBreath:{value:.025},uMMT:{value:{version:0,image:{data:mm}}},uVR:{value:{version:0,image:{data:vr}}}}};materials[2].onBeforeCompile(shader,{});api.mode.value=1;
const save=shader.vertexShader.indexOf('vec3 hipSavedObjectNormal'),def=shader.vertexShader.indexOf('#include <defaultnormal_vertex>'),restore=shader.vertexShader.indexOf('objectNormal=hipSavedObjectNormal'),begin=shader.vertexShader.indexOf('#include <begin_vertex>');assert.ok(save<def&&def<restore&&restore<begin,'original shader normal must be restored before breath/sink');assert.equal(oldCalls,1);assert.equal(shader.uniforms.oldTheme.value,1);
left.rotation.x=Math.PI/2;coach.updateMatrixWorld(true);skeleton.update();
function skinnedAuth(i){const n=new T.Vector3().fromBufferAttribute(geometry.attributes.normal,i);for(let j=0;j<geometry.morphAttributes.normal.length;j++)n.addScaledVector(new T.Vector3().fromBufferAttribute(geometry.morphAttributes.normal[j],i),mesh.morphTargetInfluences[j]);return n.applyMatrix3(skin3);}
function pointOracle(i,{field=1,breath=.025,sink=.75,wrongBreath=false,wrongSink=false,wrongSign=false}={}){
 const p=basePoint(i),no=skinnedAuth(i),x=vr[4*i]/.16,y=(vr[4*i+1]-1.24)/.12,z=(vr[4*i+2]-.06)/.10,bm=Math.exp(-1.6*(x*x+y*y+z*z));
 if(field>.5){const b=no.clone().multiplyScalar(breath*bm);if(!wrongBreath)b.applyMatrix3(skin3);p.add(b.applyMatrix3(mesh3));const s=no.clone().normalize().multiplyScalar((wrongSign?1:-1)*mm[4*i+3]*sink);if(wrongSink)s.applyMatrix3(skin3);p.add(s.applyMatrix3(mesh3));}return p;
}
function faceNormal(options){const a=pointOracle(0,options),b=pointOracle(1,options),c=pointOracle(2,options);return b.sub(a).cross(c.sub(a)).normalize();}
const expected=faceNormal(),auth=skinnedAuth(0).applyMatrix3(worldN).normalize();assert.ok(auth.angleTo(expected)<Math.PI/6,'fixture must avoid correction cap');
const wrongs=[faceNormal({wrongBreath:true}),faceNormal({wrongSink:true}),faceNormal({wrongSign:true}),faceNormal({field:0})];for(const x of wrongs)assert.ok(expected.angleTo(x)>1e-3,'fixture does not distinguish incorrect shader geometry');
let result=api.update(scene,{});assert.equal(result.attributeSharesData,true);assert.equal(attr.getW(0),1,'actual GPU attribute must be written');const out=new T.Vector3(attr.getX(0),attr.getY(0),attr.getZ(0)).applyMatrix3(worldN).normalize();assert.ok(out.dot(expected)>1-1e-8,`shader geometry normal mismatch: dot ${out.dot(expected)}`);assert.equal(attr.getW(1),0,'mask0 keeps original normal');assert.ok(result.maxShaderOffsetMm>1);
const first=api.report().stats.recomputes;result=api.update(scene,{});assert.equal(result.cacheHit,true);assert.equal(api.report().stats.recomputes,first);
shader.uniforms.uFieldOn.value=0;result=api.update(scene,{});assert.equal(result.cacheHit,false);const offN=new T.Vector3(attr.getX(0),attr.getY(0),attr.getZ(0)).applyMatrix3(worldN).normalize();assert.ok(offN.dot(faceNormal({field:0}))>1-1e-8,'field off shader geometry');
shader.uniforms.uFieldOn.value=1;shader.uniforms.uBreath.value=.02;result=api.update(scene,{});assert.equal(result.cacheHit,false,'breath change invalidates cache');assert.ok(p5Calls>=4);
for(let i=0;i<4;i++)assert.ok(basePoint(i).distanceTo(beforePoints[i])<1e-12,'position mutated');for(const [k,v] of Object.entries(beforeAttrs))assert.strictEqual(geometry.attributes[k],v);
api.detach();assert.strictEqual(materials[2].onBeforeCompile,oldHook);console.log(JSON.stringify({status:'ok',normalDot:out.dot(expected),nonuniformBindMesh:true,nonzeroPositionNormalMorph:true,p5MorphNeededOverlap:0,breathAndSink:true,wrongSpaceAngles:wrongs.map(x=>expected.angleTo(x)*180/Math.PI),fieldOff:true,cacheHit:true,positionUntouched:true}));
