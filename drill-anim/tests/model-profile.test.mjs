import test from 'node:test';
import assert from 'node:assert/strict';
import {productionModel,resolveModelSpec} from '../lib/model-profile.mjs';

test('historical v2 and unversioned specs keep their exact recipe unless explicitly overridden',()=>{
  for(const source of [{id:'legacy',pose:{x:1}}, {id:'v2',modelProfile:'training-human-v2',alignClavicles:false}])assert.equal(resolveModelSpec(source),source);
});
test('production adoption selects the updated original appearance without changing the action',()=>{
  const source={id:'old',modelProfile:'training-human-v2',pose:{base:{hips:[1,2,3]}},timeline:{duration:8},camera:{dir:[1,0,1]}};
  const resolved=resolveModelSpec(source,{profile:'current'});
  assert.equal(productionModel().modelProfile,'training-human-v2plus');
  assert.equal(resolved.v2plus.skin,'realistic');
  assert.deepEqual(resolved.v2plus,{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'});
  assert.equal(resolved.pose,source.pose);assert.equal(resolved.timeline,source.timeline);assert.equal(resolved.camera,source.camera);
  assert.equal(source.modelProfile,'training-human-v2');assert.equal(source.v2plus,undefined);
});
test('new v2plus specs inherit production geometry and preserve deliberate skin or hand options',()=>{
  const source={modelProfile:'training-human-v2plus',v2plus:{handPose:{left:'open'},skin:'neon-night'}};
  const resolved=resolveModelSpec(source);
  assert.equal(resolved.v2plus.torso,'base');assert.equal(resolved.v2plus.skin,'neon-night');assert.deepEqual(resolved.v2plus.handPose,{left:'open'});
  assert.equal(resolveModelSpec(source,{skin:'tech-white'}).v2plus.skin,'tech-white');
});
test('a skin cannot silently apply to a legacy model',()=>{
  assert.throws(()=>resolveModelSpec({modelProfile:'training-human-v2'},{skin:'tech-white'}),/requires training-human-v2plus/);
  assert.throws(()=>resolveModelSpec({}, {profile:'made-up-model'}),/Unknown model profile/);
});
