// Independent geometry oracle: actual transformed edges must be perpendicular
// to the resulting shader normal; input skin matrices are deliberately oblique
// and nonuniform. This does not test a browser or GPU upload lifecycle.
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildTopology,updateNormals} from '../../../drill-anim/models/training-human-v3-knee-normal-r1/kernel.mjs';

const n=81,positions=new Float32Array(n*3),normals=new Float32Array(n*3),joints=new Uint16Array(n*4),weights=new Float32Array(n*4),index=[];
const id=i=>i===40?80:i===80?40:i;
for(let y=0;y<9;y++)for(let x=0;x<9;x++){
 const i=id(y*9+x);positions.set([(x-4)*.009,(y-4)*.009,.003*Math.sin(x*.6)*Math.cos(y*.4)],3*i);normals.set([0,0,1],3*i);joints.set([0,1,0,0],4*i);const w=.2+.6*x/8;weights.set([w,1-w,0,0],4*i);
}
for(let y=0;y<8;y++)for(let x=0;x<8;x++){
 const a=id(y*9+x),b=id(y*9+x+1),c=id((y+1)*9+x),d=id((y+1)*9+x+1);index.push(a,b,d,a,d,c);
}
const meshWorld=new T.Matrix4().compose(new T.Vector3(.03,-.02,.04),new T.Quaternion().setFromEuler(new T.Euler(.31,-.42,.27)),new T.Vector3(1.7,.72,1.25));
const bind=new T.Matrix4().compose(new T.Vector3(-.1,.07,.02),new T.Quaternion().setFromEuler(new T.Euler(-.17,.28,.11)),new T.Vector3(.8,1.35,.9));
const bones=[new T.Matrix4().compose(new T.Vector3(.01,.02,-.03),new T.Quaternion().setFromEuler(new T.Euler(.2,-.33,.15)),new T.Vector3(1.1,.9,1.05)),new T.Matrix4().compose(new T.Vector3(-.02,.015,.04),new T.Quaternion().setFromEuler(new T.Euler(-.46,.12,.4)),new T.Vector3(.84,1.14,1.2))];
const local=bones.map(b=>bind.clone().invert().multiply(b).multiply(bind)),world=local.map(m=>meshWorld.clone().multiply(m));
const flatten=m=>Float64Array.from(m.flatMap(x=>x.toArray()));const restWorld=new Float32Array(n*3);
for(let i=0;i<n;i++)new T.Vector3().fromArray(positions,3*i).applyMatrix4(meshWorld).toArray(restWorld,3*i);
const topology=buildTopology({positions,normals,indices:Uint32Array.from(index),joints,weights,restWorld,seamFirst:80,leftKnee:[.03,-.02,.04],rightKnee:[3,3,3]});
const state={skinWorld:flatten(world),skinLocal:flatten(local),worldNormal:new T.Matrix3().getNormalMatrix(meshWorld).toArray(),worldToLocal:new T.Matrix3().setFromMatrix4(meshWorld).transpose().toArray(),gateLeft:1,gateRight:0,breath:0,fieldOn:1,orientation:1};
const before=[Array.from(positions),Array.from(normals),Array.from(joints),Array.from(weights),Array.from(index)];
const out=updateNormals(topology,state),vertex=id(39);assert.equal(out.mask[vertex],1,'interior target active');assert.equal(out.mask[id(0)],0,'open edge retained');assert.equal(out.mask[80],0,'source seam retained');
function skin(i){const v=new T.Vector3().fromArray(positions,3*i),r=new T.Vector3();for(let k=0;k<4;k++){const w=weights[4*i+k];if(w)r.addScaledVector(v.clone().applyMatrix4(world[joints[4*i+k]]),w);}return r;}
const area=new T.Vector3();for(let k=0;k<index.length;k+=3){const [a,b,c]=index.slice(k,k+3);if(a!==vertex&&b!==vertex&&c!==vertex)continue;const va=skin(a),vb=skin(b),vc=skin(c);area.add(vb.sub(va).cross(vc.sub(va)));}area.normalize();
const rendered=new T.Vector3().fromArray(out.normal,3*vertex).applyMatrix3(new T.Matrix3().getNormalMatrix(meshWorld)).normalize();assert.ok(rendered.dot(area)>1-1e-8,`nonuniform transformed triangle normal: dot ${rendered.dot(area)}`);
const first=out.normal,mask=out.mask;assert.strictEqual(updateNormals(topology,state).normal,first,'output buffer reused');assert.strictEqual(updateNormals(topology,state).mask,mask,'mask reused');
const off=updateNormals(topology,{...state,gateLeft:0});assert.equal(off.active,0);assert.equal(off.mask[vertex],0,'zero gate disables shader override');
const on=updateNormals(topology,state);assert.equal(on.mask[vertex],1,'gate restoration');const beforeFieldOff=Array.from(on.normal);const noBreath=updateNormals(topology,{...state,fieldOn:0,breath:3});assert.deepEqual(Array.from(noBreath.normal),beforeFieldOff,'disabled shader field ignores breath');
assert.deepEqual([Array.from(positions),Array.from(normals),Array.from(joints),Array.from(weights),Array.from(index)],before,'input attributes and topology untouched');
console.log(JSON.stringify({status:'ok',vertices:n,faces:index.length/3,normalDot:rendered.dot(area),boundaryMask:out.mask[id(0)],seamMask:out.mask[80],reuse:true}));

// Independent intermediate gate check: geometric and authored normals are
// normalized in world space before interpolation, then transformed to local.
const rv=new T.Vector3().fromArray(restWorld,3*vertex),left=[rv.x-.12,rv.y,rv.z];
const mid=buildTopology({positions,normals,indices:Uint32Array.from(index),joints,weights,restWorld,seamFirst:80,leftKnee:left,rightKnee:[3,3,3]});
const m=updateNormals(mid,{...state,gateLeft:.7});const f=mid.spaceL[vertex]*.7;
assert.ok(f>.3&&f<.4,`fade gate ${f}`);
let authored=new T.Vector3();for(let k=0;k<4;k++){const w=weights[4*vertex+k];if(w)authored.addScaledVector(new T.Vector3(0,0,1).applyMatrix3(new T.Matrix3().setFromMatrix4(local[joints[4*vertex+k]])),w);}
authored.applyMatrix3(new T.Matrix3().getNormalMatrix(meshWorld)).normalize();const expected=authored.multiplyScalar(1-f).addScaledVector(area,f).normalize();const got=new T.Vector3().fromArray(m.normal,3*vertex).applyMatrix3(new T.Matrix3().getNormalMatrix(meshWorld)).normalize();assert.ok(expected.dot(got)>1-1e-8,`world blend mismatch ${expected.dot(got)}`);
// Updating a different bone pose must change normals on the first call, and
// repeating it reuses buffers and remains stable (the adapter cache is separate).
const previous=new T.Vector3().fromArray(m.normal,3*vertex);const bnew=bones[1].clone().multiply(new T.Matrix4().makeRotationX(.3));const lnew=[local[0],bind.clone().invert().multiply(bnew).multiply(bind)];const wnew=lnew.map(x=>meshWorld.clone().multiply(x));const changed={...state,gateLeft:.7,skinLocal:flatten(lnew),skinWorld:flatten(wnew)};const firstChanged=updateNormals(mid,changed);const nv=new T.Vector3().fromArray(firstChanged.normal,3*vertex);assert.ok(nv.distanceTo(previous)>1e-5,'bone change did not update normal');const repeated=updateNormals(mid,changed);assert.strictEqual(repeated.normal,firstChanged.normal);assert.ok(new T.Vector3().fromArray(repeated.normal,3*vertex).distanceTo(nv)<1e-12,'same pose not stable');
console.log(JSON.stringify({intermediateGate:f,blendDot:expected.dot(got),changedPoseDelta:nv.distanceTo(previous),repeatStable:true}));

// A nonzero breath is applied before skinning, using the unmodified skinned
// object normal and uVR rest coordinate. The shader restores that original
// normal after writing vNormal, before position computation.
const chestWorld=new Float32Array(restWorld);for(let i=0;i<n;i++){chestWorld[3*i+1]+=1.24;chestWorld[3*i+2]+=.06;}
const chestKnee=[.03,1.22,.10];const chest=buildTopology({positions,normals,indices:Uint32Array.from(index),joints,weights,restWorld:chestWorld,seamFirst:80,leftKnee:chestKnee,rightKnee:[3,3,3]});
const breath=.013,breathState={...state,breath,fieldOn:1};const actual=updateNormals(chest,breathState);function breathSkin(i){const base=new T.Vector3().fromArray(positions,3*i),originalSkinnedNormal=new T.Vector3();for(let k=0;k<4;k++){const w=weights[4*i+k];if(w)originalSkinnedNormal.addScaledVector(new T.Vector3().fromArray(normals,3*i).applyMatrix3(new T.Matrix3().setFromMatrix4(local[joints[4*i+k]])),w);}const x=chestWorld[3*i]/.16,y=(chestWorld[3*i+1]-1.24)/.12,z=(chestWorld[3*i+2]-.06)/.10;const bm=Math.exp(-1.6*(x*x+y*y+z*z));base.addScaledVector(originalSkinnedNormal,breath*bm);const out=new T.Vector3();for(let k=0;k<4;k++){const w=weights[4*i+k];if(w)out.addScaledVector(base.clone().applyMatrix4(world[joints[4*i+k]]),w);}return out;}
const expectedArea=new T.Vector3();for(let k=0;k<index.length;k+=3){const [a,b,c]=index.slice(k,k+3);if(a!==vertex&&b!==vertex&&c!==vertex)continue;const A=breathSkin(a),B=breathSkin(b),C=breathSkin(c);expectedArea.add(B.sub(A).cross(C.sub(A)));}expectedArea.normalize();const actualN=new T.Vector3().fromArray(actual.normal,3*vertex).applyMatrix3(new T.Matrix3().getNormalMatrix(meshWorld)).normalize();assert.ok(actualN.dot(expectedArea)>1-1e-8,`nonzero breath geometry mismatch ${actualN.dot(expectedArea)}`);assert.ok(Math.abs(expectedArea.dot(area))<.999999,'nonzero breath test is vacuous');console.log(JSON.stringify({nonzeroBreath:breath,normalDot:actualN.dot(expectedArea),nonVacuous:true}));
