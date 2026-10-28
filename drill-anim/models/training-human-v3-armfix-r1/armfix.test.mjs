import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import * as model from './loader.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(repo,rel),'utf8'));
const old=read('runtime/public/coach/coach-rig.json'),prior=read('runtime/public/coach-v3/coach-rig-v3.json');
const candidate=read('runtime/public/coach-v3-armfix-r1/coach-rig.json');
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
function decode(d){const b=Buffer.from(d.pos.u16,'base64'),u=new Uint16Array(b.buffer,b.byteOffset,b.byteLength/2);return Array.from({length:d.n},(_,i)=>[0,1,2].map(k=>d.pos.lo[k]+u[3*i+k]*d.pos.scale[k]));}

test('independent recipe restores both arm segments while preserving unrelated v3 landmarks',()=>{
  for(const side of['left','right']){
    for(const suffix of['Shoulder','Elbow','Wrist'])assert.deepEqual(candidate.landmarks[side+suffix],old.landmarks[side+suffix]);
    for(const [a,b,key]of[['Shoulder','Elbow','upperArm'],['Elbow','Wrist','forearm']]){
      assert.equal(candidate.v3.segmentScale[key],1);
      assert.ok(Math.abs(distance(candidate.landmarks[side+a],candidate.landmarks[side+b])-distance(old.landmarks[side+a],old.landmarks[side+b]))<1e-9);
    }
    for(const suffix of['Hip','Knee','Ankle'])assert.deepEqual(candidate.landmarks[side+suffix],prior.landmarks[side+suffix]);
  }
  for(const key of['pelvis','torso','neck','head'])assert.ok(distance(candidate.landmarks[key],prior.landmarks[key])<1e-12);
  assert.equal(candidate.v3.armfix.handScale,1);
});

test('reset geometry recipe and IK source have the same original arm lengths',()=>{
  const J=model.RESET_JOINTS.v2,N=model.RESET_JOINTS.v3;
  for(const side of['left','right']){
    for(const suffix of['Shoulder','Elbow','Wrist'])assert.ok(distance(N[side+suffix],J[side+suffix])<1e-12);
    assert.ok(Math.abs(distance(N[side+'Shoulder'],N[side+'Elbow'])*1000-256.78003943)<.001);
    assert.ok(Math.abs(distance(N[side+'Elbow'],N[side+'Wrist'])*1000-228.04695229)<.001);
  }
});

test('unscaled c1r2 hand JSON remains its source size and the source is not mutated',()=>{
  const source=read('drill-anim/models/hands-native-c1r2/hands-base.json'),before=JSON.stringify(source);
  const result=model.warpBase(source),a=decode(source),b=decode(result);
  assert.equal(JSON.stringify(source),before);
  assert.equal(result.v3.handScale,1);
  const max=Math.max(...a.map((p,i)=>distance(p,b[i])));
  assert.ok(max<.00004,`unexpected hand rescale/rest drift: ${max}m`);
});

test('base torso and limbs are fresh candidates rather than mutations of frozen JSON',()=>{
  for(const file of['training-human-v2plus-torso-base.json','training-human-v2plus-limbs-base.json']){
    const source=read('drill-anim/models/'+file),before=JSON.stringify(source),result=model.warpBase(source);
    assert.equal(JSON.stringify(source),before);assert.notStrictEqual(result,source);assert.equal(result.n,source.n);
    assert.equal(result.v3.handScale,1);for(const p of decode(result))assert.ok(p.every(Number.isFinite));
  }
});

test('entry refuses the old hand scale and alternate hand asset instead of silently falling back',()=>{
  const spec={modelProfile:'training-human-v2plus-hands-native',v2plus:{torso:'base',limbs:'base',hands:'base'}};
  assert.strictEqual(model.checkSpec(spec),spec);
  assert.throws(()=>model.checkSpec(spec,{handScale:1.18}),/handScale1/);
  assert.throws(()=>model.checkSpec(spec,{handDir:'hands-native-r3'}),/handScale1/);
  assert.throws(()=>model.checkSpec({...spec,v2plus:{}}),/full native/);
});

test('new boot, viewer and JSON loader point at the same independent recipe',()=>{
  const text=file=>fs.readFileSync(path.join(repo,file),'utf8');
  const dir='drill-anim/models/training-human-v3-armfix-r1/';
  assert.ok(text(dir+'boot.mjs').includes("replace('/src/viewer.js','/src/viewer-armfix-r1.js')"));
  assert.ok(text('runtime/src/viewer-armfix-r1.js').includes("fetch('/coach-v3-armfix-r1/coach-rig.json')"));
  assert.ok(text(dir+'base.mjs').includes("'runtime/public/coach-v3-armfix-r1/coach-rig.json'"));
  assert.ok(text(dir+'base.mjs').includes("path.join(models,'training-human-v3/human-v3.js')"));
});

test('candidate source pins verify',async()=>{assert.equal((await model.verify()).profile,'training-human-v3-armfix');});
