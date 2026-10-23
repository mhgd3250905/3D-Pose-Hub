import test from 'node:test';
import assert from 'node:assert/strict';
import previous from '../specs/h-db-overhead-triceps-extension-rr2.js';
import spec from '../specs/h-db-overhead-triceps-extension-rr3.js';
import {verifyOverheadNative,applyOverheadNative} from '../models/overhead-native-r1/loader.mjs';
test('native overhead grip leaves every body and wrist trajectory intact',()=>{
 for(const key of ['pose','timeline','v2plus','camera','qa'])assert.deepEqual(spec[key],previous[key],key);
 const before=previous.props.find(p=>p.type==='dumbbell'),after=spec.props.find(p=>p.type==='dumbbell');
 for(const key of ['type','length','plate','attach'])assert.equal(after[key],before[key]);
 assert.deepEqual(spec.props.filter(p=>p.type!=='dumbbell'),previous.props.filter(p=>p.type!=='dumbbell'));
});
test('scoped composite preserves both source chains and publication gates',()=>{
 const m=verifyOverheadNative();assert.deepEqual(m.scope,[spec.id]);
 for(const key of ['reviewed','releaseEligible','defaultForNewDrills'])assert.equal(m[key],false);
});
test('overhead loader rejects a different action before using browser',async()=>{
 await assert.rejects(applyOverheadNative(null,previous),/Explicit scoped/);
});
