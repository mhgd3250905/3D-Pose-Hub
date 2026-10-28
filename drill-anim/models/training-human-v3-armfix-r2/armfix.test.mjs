import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import * as model from './loader.mjs';
import * as pieces from './proportion-base.mjs';
import {HAND_SOURCE} from './recipe.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(repo,rel),'utf8'));
const spec={modelProfile:'training-human-v2plus-hands-native',v2plus:{torso:'base',limbs:'base',hands:'base'}};
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
function decode(d){const b=Buffer.from(d.pos.u16,'base64');return Array.from({length:d.n},(_,i)=>[0,1,2].map(k=>d.pos.lo[k]+b.readUInt16LE(2*(3*i+k))*d.pos.scale[k]));}
function pageContext(values){const context=vm.createContext({...values});context.window=context;let mutations=0;return {page:{evaluate:async(fn,arg)=>{context.arg=arg;return vm.runInContext('('+fn.toString()+')(arg)',context);},addScriptTag:async()=>{mutations++;throw Error('unexpected mutation');}},context,get mutations(){return mutations;}};}

test('fixed recipe restores both original arm lengths and retains v3 lower body/trunk',()=>{
 const old=read('runtime/public/coach/coach-rig.json'),prior=read('runtime/public/coach-v3/coach-rig-v3.json'),rig=read('runtime/public/coach-v3-armfix-r1/coach-rig.json');
 for(const s of ['left','right']){for(const k of ['Shoulder','Elbow','Wrist'])assert.deepEqual(rig.landmarks[s+k],old.landmarks[s+k]);for(const k of ['Hip','Knee','Ankle'])assert.deepEqual(rig.landmarks[s+k],prior.landmarks[s+k]);}
 for(const k of ['pelvis','torso','neck','head'])assert.ok(distance(rig.landmarks[k],prior.landmarks[k])<1e-12);
 assert.equal(rig.v3.segmentScale.upperArm,1);assert.equal(rig.v3.segmentScale.forearm,1);assert.equal(rig.v3.armfix.handScale,1);
 const {v2:J,v3:N}=model.RESET_JOINTS;for(const s of ['left','right'])for(const k of ['Shoulder','Elbow','Wrist'])assert.ok(distance(J[s+k],N[s+k])<1e-12);
});
test('fixed symmetric source remains unscaled and immutable through armfix warp',()=>{
 const d=read('drill-anim/models/'+HAND_SOURCE+'/hands-base.json'),before=JSON.stringify(d),warped=model.warpBase(d),a=decode(d),b=decode(warped);
 assert.equal(JSON.stringify(d),before);assert.equal(warped.v3.handScale,1);
 let max=0;for(let i=0;i<a.length;i++)max=Math.max(max,distance(a[i],b[i]));assert.ok(max<.00004,`hand drift ${max}`);
 assert.throws(()=>model.warpBase(warped),/already warped/);
});
test('small pooled position buffer decodes only its byte range',()=>{
 const q=Buffer.alloc(12);[3,5,7,11,13,17].forEach((n,i)=>q.writeUInt16LE(n,i*2));
 const d={n:2,pos:{lo:[0,0,0],scale:[.01,.01,.01],u16:q.toString('base64')},bones:['head'],joints:{u8:Buffer.alloc(8).toString('base64')},weights:{u8:Buffer.from([255,0,0,0,255,0,0,0]).toString('base64')}};
 const out=decode(model.warpBase(d));assert.ok(distance(out[0],[.03,.05,.07])<1e-6);assert.ok(distance(out[1],[.11,.13,.17])<1e-6);
 assert.throws(()=>model.warpBase({...d,pos:{...d.pos,u16:''}}),/byte count/);
});
test('torso and limb derivations are finite fresh data, never frozen source mutations',()=>{
 for(const name of ['torso','limbs']){const d=read('drill-anim/models/training-human-v2plus-'+name+'-base.json'),before=JSON.stringify(d),out=model.warpBase(d);assert.equal(JSON.stringify(d),before);assert.notStrictEqual(out,d);assert.ok(decode(out).every(v=>v.every(Number.isFinite)));}
});
test('reject alternate source, scale, mutable asset, ignored flags and invalid twist before page access',async()=>{
 assert.strictEqual(model.checkSpec(spec,{handDir:HAND_SOURCE,handScale:1}),spec);
 for(const options of [{handDir:'hands-native-c1r2'},{handScale:1.18},{handScale:null},{handAsset:{}},{debug:true}]){
  assert.throws(()=>model.checkSpec(spec,options),/armfix-r2/);await assert.rejects(pieces.applyV3(null,spec,options),/armfix-r2/);
 }
 assert.throws(()=>model.checkSpec({...spec,nativeHands:{twistShare:NaN}}),/twistShare/);
 assert.throws(()=>model.checkSpec({...spec,nativeHands:{handAsset:'other'}}),/nativeHands/);
});
test('duplicate, failed and r1 initialized pages fail before script mutation',async()=>{
 for(const values of [{__armfixR2Init:{phase:'ready'}},{__armfixR2Init:{phase:'failed'}},{__armfixR1:{}},{__v2p:{}}]){
  const env=pageContext(values);await assert.rejects(model.applyV3(env.page,spec),/fresh page/);assert.equal(env.mutations,0);
 }
});
test('piece initialization rejects wrong rig and pre-existing finger chain',async()=>{
 for(const [upperArm,names,message]of [[1.2,[],/wrong boot rig/],[1,['v2p_L_index1'],/finger chain already/]]){
  const env=pageContext({__armfixR2Init:{phase:'installing'},flareInspector:{viewer:{bodyV3:{},rigData:{v3:{segmentScale:{upperArm,forearm:1},armfix:{handScale:1}}},coach:{traverse:fn=>names.forEach(name=>fn({isBone:true,name}))}}}});
  await assert.rejects(pieces.applyV3(env.page,spec),message);assert.equal(env.mutations,0);
 }
});
test('candidate source pins verify without browser and remain unreviewed',async()=>{
 const result=await model.verify();assert.equal(result.version,'0.1.0-r2');assert.equal(result.status,'candidate-unreviewed');
});
