import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {verify} from './loader.mjs';

const input=verify({recipePath:process.argv[2]});input.options={enabled:true,showDumbbells:true};
const scene=new T.Scene(),coach=new T.Group();scene.add(coach);const originals=[];
const bone=new T.Bone();bone.name='fixture_world';coach.add(bone);const bones=[bone];
for(const side of ['left','right']){const f=input.recipe.neutralFrames[side],forearm=new T.Bone(),hand=new T.Bone();forearm.name=side+'Forearm';hand.name=side+'Hand';forearm.position.fromArray(f.wrist);forearm.quaternion.fromArray(f.forearmWorldQuaternion);hand.quaternion.copy(forearm.quaternion).invert().multiply(new T.Quaternion().fromArray(f.handWorldQuaternion));coach.add(forearm);forearm.add(hand);bones.push(forearm,hand);}
coach.updateMatrixWorld(true);for(const o of bones)originals.push({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()});
const g=new T.BufferGeometry(),P=Float32Array.from(input.neutralLimbWorld),count=P.length/3,SI=new Uint16Array(count*4),SW=new Float32Array(count*4);
for(let i=0;i<count;i++){SI[i*4]=P[i*3]>0?1:3;SW[i*4]=1;}
g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(SW,4));g.setIndex(input.sourceLimbIndex);g.computeVertexNormals();const limbs=new T.SkinnedMesh(g,new T.MeshToonMaterial());coach.add(limbs);limbs.bind(new T.Skeleton(bones));
const hands=new T.Mesh(new T.BoxGeometry(.01,.01,.01),new T.MeshToonMaterial());coach.add(hands);
const motion={capturePose:()=>({}),applyPose(){},reset(){for(const x of originals){x.o.position.copy(x.p);x.o.quaternion.copy(x.q);x.o.scale.copy(x.s);}coach.updateMatrixWorld(true);}};
const renderer={render(s,c){s.updateMatrixWorld(true);s.onBeforeRender?.(this,s,c,null);s.onAfterRender?.(this,s,c);}};
const window={__toonT:T,__v2p:{limbs:{mesh:limbs},hands:{mesh:hands},restHands(){}},__webxrWristJoinOptions:input,flareInspector:{viewer:{scene,coach,motion,renderer,camera:new T.PerspectiveCamera()}},__drill:{},__wristTwistShare:.5};window.window=window;
const context=vm.createContext({...window,window,console});
vm.runInContext(fs.readFileSync(new URL('../../../drill-anim/models/hands-native-r5/wrist-twist.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./runtime.js',import.meta.url),'utf8'),context);
const api=window.__webxrWristJoin,rows=[];let assertions=0;
for(const [flex,twist]of [[0,0],[30,0],[-30,0],[60,0],[-60,0],[60,60],[-60,-60],[75,60],[0,0]]){
 const calibration=api.setDiagnosticPose(flex,twist);for(const a of Object.values(calibration.measured)){assert.ok(Math.abs(a.flexDeg-flex)<.1);assert.ok(Math.abs(a.twistDeg-twist)<.1);assert.ok(Math.abs(a.outOfFlexPlaneDeg)<.1);assertions+=3;}const data=api.sample(()=>{assert.equal(api.sample(()=>42),42);return api.capture();});assertions++;
 for(const side of ['left','right']){const d=data.sides[side];assert.ok(d.positions.every(Number.isFinite));assert.ok(d.diagnostics.bodySeamMaxGapMm<.001);assert.ok(d.diagnostics.handSeamMaxGapMm<.001);assertions+=3;}
 assert.ok(api.lastRestoreCheck.positionsNormalsExact);assert.ok(api.lastRestoreCheck.boneTransformsExact);assert.ok(api.lastRestoreCheck.cacheExact);assertions+=3;rows.push({flex,twist,seams:api.last,restore:api.lastRestoreCheck});
}
api.setDiagnosticPose(0,0);const ref=api.sample(()=>api.reference('left'));assert.equal(ref.positions.length/3,Math.max(...ref.indices)+1);assertions++;
assert.throws(()=>api.capture(),/onAfterRender/);assert.throws(()=>api.sample(()=>{throw Error('fixture exception');}),/fixture exception/);assert.ok(api.lastRestoreCheck.positionsNormalsExact);assertions+=3;
api.setEnabled(false);assert.equal(limbs.geometry,g);assert.equal(hands.visible,true);api.setEnabled(true);assert.notEqual(limbs.geometry,g);assertions+=3;
const detached=api.detach();assert.equal(limbs.geometry,g);assert.equal(hands.visible,true);assertions+=2;
console.log(JSON.stringify({passed:true,assertions,fixture:'Pinned actual neutral limb positions and topology, synthetic rigid forearm skin; this is CPU lifecycle/math coverage, not actual source-skin or GPU acceptance.',rows,detached},null,2));
