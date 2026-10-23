import test from 'node:test';
import assert from 'node:assert/strict';
import previous from '../specs/h-kneeling-instep-stretch-rr5.js';
import spec from '../specs/h-kneeling-instep-stretch-rr6.js';
import {verifyInstepNative,applyInstepNative,PROFILE,VERSION} from '../models/instep-native-r1/loader.mjs';
test('instep composition preserves exact R5 body, foot and hand-target trajectory',()=>{
 for(const key of ['pose','timeline','props','camera','v2plus','barefoot','qa'])assert.deepEqual(spec[key],previous[key],key);
});
test('both frozen source chains remain intact and new combination is scoped',()=>{
 const m=verifyInstepNative();assert.equal(m.id,PROFILE);assert.equal(m.version,VERSION);
 assert.deepEqual(m.scope,[spec.id]);
 for(const key of ['reviewed','releaseEligible','defaultForNewDrills'])assert.equal(m[key],false);
});
test('loader rejects unrelated or unversioned specs before accessing browser',async()=>{
 await assert.rejects(applyInstepNative(null,previous),/Explicit scoped/);
 await assert.rejects(applyInstepNative(null,{...spec,nativeHands:{version:'other'}}),/Pinned hand/);
});
