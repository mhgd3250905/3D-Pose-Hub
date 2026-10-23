import test from 'node:test';
import assert from 'node:assert/strict';
import before from '../specs/h-db-overhead-triceps-extension-rr3.js';
import spec from '../specs/h-db-overhead-triceps-extension-rr4.js';
import {verifyOverheadNative,applyOverheadNative} from '../models/overhead-native-r2/loader.mjs';
import {selectProfile} from '../tools/review-special-profiles-r4.mjs';

test('neutral wrists preserve the elbow arc, both wrist positions and all support geometry',()=>{
 for(const key of ['extension','k0','k1','k2'])assert.deepEqual(spec.timeline.tracks[key],before.timeline.tracks[key]);
 for(const key of ['props','camera','qa','v2plus'])assert.deepEqual(spec[key],before[key]);
 const a=structuredClone(before.pose.base),b=structuredClone(spec.pose.base);
 for(const base of [a,b]){delete base.hands.left.finger;delete base.hands.left.normal;}
 assert.deepEqual(a,b);
 assert.equal(spec.timeline.duration,before.timeline.duration);
});
test('neutral hand frames remain finite, unit and independent throughout the loop',()=>{
 for(const keys of [['k3','k4','k5','k6','k7','k8'],['lf0','lf1','lf2','ln0','ln1','ln2']]){
  for(let i=0;i<241;i++){
   const f=keys.slice(0,3).map(k=>spec.timeline.tracks[k][i][1]),n=keys.slice(3).map(k=>spec.timeline.tracks[k][i][1]);
   assert.ok([...f,...n].every(Number.isFinite));
   assert.ok(Math.abs(Math.hypot(...f)-1)<1e-7);assert.ok(Math.abs(Math.hypot(...n)-1)<1e-7);
   assert.ok(Math.abs(f.reduce((sum,v,k)=>sum+v*n[k],0))<.01);
  }
 }
});
test('final overhead profile rejects the failed initial wrist revision',async()=>{
 assert.equal(verifyOverheadNative().version,'1.0.0-r2');
 assert.equal(selectProfile(spec).exportName,'applyOverheadNative');
 assert.throws(()=>selectProfile(before),/Unsupported/);
 await assert.rejects(applyOverheadNative({},before),/Explicit scoped/);
});
