import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import source from '../../docs/diagnostics/122/attempt-2.mjs';
import spec from '../specs/h-fixed-bar-vertical-pull-rr7.js';
import {verifyNativeGrip,applyNativeGrip,PROFILE,VERSION} from '../models/grip-native-r1/loader.mjs';
const fit=JSON.parse(fs.readFileSync(new URL('../models/grip-native-r1/fit.json',import.meta.url),'utf8'));

test('Native grip keeps the fixed native rod, vertical movement, support and loop timing',()=>{
 const old=structuredClone(source),next=structuredClone(spec);
 for(const s of [old,next]){
  delete s.id;delete s.modelProfile;delete s.nativeGrip;
  for(const side of ['left','right'])for(const key of ['wrist','finger','normal'])delete s.pose.base.hands[side][key];
 }
 assert.deepEqual(next,old);
 for(const side of ['left','right'])for(const key of ['wrist','finger','normal'])assert.ok(spec.pose.base.hands[side][key].every(Number.isFinite));
});
test('Native grip source chain is fixed and explicitly scoped',()=>{
 const m=verifyNativeGrip();assert.equal(m.id,PROFILE);assert.equal(m.version,VERSION);
 assert.deepEqual(m.scope,['h-fixed-bar-vertical-pull-rr7']);
 assert.equal(m.defaultForNewDrills,false);assert.equal(m.releaseEligible,false);
 assert.equal(Object.keys(fit.targets).length,15);
 for(const q of Object.values(fit.targets))assert.ok(Math.abs(Math.hypot(...q)-1)<1e-10);
 assert.equal(fit.qa.left.pairs,0);assert.equal(fit.worstPenetrationM,0);
 for(const key of ['thumb','index','middle','ring','pinky','palm'])assert.ok(fit.contact[key]>=0&&fit.contact[key]<.001);
});
test('Native grip cannot silently accept a base or unsupported model',async()=>{
 await assert.rejects(applyNativeGrip({},source),/Explicit scoped/);
 await assert.rejects(applyNativeGrip({},{...spec,nativeGrip:{version:'unknown'}}),/Explicit scoped/);
 await assert.rejects(applyNativeGrip({},{...spec,id:'unreviewed-action'}),/Explicit scoped/);
});
