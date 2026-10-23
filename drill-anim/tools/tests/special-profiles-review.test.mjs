import test from 'node:test';
import assert from 'node:assert/strict';
import {selectProfile,checkPreview,run,VERSION} from '../review-special-profiles-r1.mjs';
import {selectProfile as selectR2} from '../review-special-profiles-r2.mjs';
import {selectProfile as selectR3} from '../review-special-profiles-r3.mjs';
test('explicit per-action profile/version allowlist accepts four known candidates',async()=>{
 for(const id of ['h-wall-palm-lift-rr5','h-kneeling-instep-stretch-rr5','h-bent-knee-calf-raise-rr7','h-chair-single-leg-hip-thrust-rr8']){
  const spec=(await import(`../../specs/${id}.js`)).default;
  assert.ok(selectProfile(spec).folder);
  assert.throws(()=>selectProfile({...spec,id:'new-unreviewed-id'}),/Unsupported/);
  assert.throws(()=>selectProfile({...spec,modelProfile:'training-human-v2plus-grip'}),/Unsupported/);
  assert.throws(()=>selectProfile({...spec,wristSkinning:{version:'unknown'},barefoot:{version:'unknown'},nativeHands:{version:'unknown'}}),/Unsupported/);
 }
});
test('unknown/failed grip cannot silently fall back to base renderer',()=>{
 assert.throws(()=>selectProfile({id:'h-neck-assist-rr6',modelProfile:'training-human-v2plus-grip'}),/Unsupported/);
});
test('full render requires complete matching preview provenance',()=>{
 const expected={tool:VERSION,id:'x',specSha256:'s',manifestSha256:'m',toolSha256:'t'};
 const report={...expected,mode:'preview',complete:true,frames:[0,30,60,90,120,150,180,210,239,240]};
 assert.doesNotThrow(()=>checkPreview(report,expected));
 for(const bad of [{complete:false},{specSha256:'changed'},{manifestSha256:'changed'},{toolSha256:'changed'},{frames:[0,120]}])assert.throws(()=>checkPreview({...report,...bad},expected));
});
test('existing output is rejected before loading spec or browser',async()=>{
 await assert.rejects(run({mode:'preview',file:'missing.js',out:'.'}),/Output exists/);
});
test('r2 permits only the exact reviewed 094 revision with standard profile',async()=>{
 const spec=(await import('../../specs/h-db-overhead-triceps-extension-rr2.js')).default;
 assert.equal(selectR2(spec).exportName,'applyHumanV2plus');
 assert.throws(()=>selectProfile(spec),/Unsupported/);
 assert.throws(()=>selectR2({...spec,id:'h-db-overhead-triceps-extension-rr1'}),/Unsupported/);
 assert.throws(()=>selectR2({...spec,modelProfile:'training-human-v2plus-grip'}),/Unsupported/);
});
test('r2 explicitly accepts the new scoped barefoot/native-hand composition',async()=>{
 const spec=(await import('../../specs/h-kneeling-instep-stretch-rr6.js')).default;
 assert.equal(selectR2(spec).exportName,'applyInstepNative');
 assert.throws(()=>selectR2({...spec,instepNative:{version:'unknown'}}),/Unsupported/);
 assert.throws(()=>selectR2({...spec,id:'h-kneeling-instep-stretch-rr7'}),/Unsupported/);
});
test('r3 admits only scoped successful native grip compositions',async()=>{
 const rod=(await import('../../specs/h-fixed-bar-vertical-pull-rr7.js')).default;
 const overhead=(await import('../../specs/h-db-overhead-triceps-extension-rr3.js')).default;
 assert.equal(selectR3(rod).exportName,'applyNativeGrip');
 assert.equal(selectR3(overhead).exportName,'applyOverheadNative');
 assert.throws(()=>selectR3({...rod,nativeGrip:{version:'failed-r6'}}),/Unsupported/);
 assert.throws(()=>selectR3({...overhead,overheadNative:{version:'unknown'}}),/Unsupported/);
 for(const id of ['h-kneeling-instep-stretch-rr5','h-db-overhead-triceps-extension-rr2'])assert.throws(()=>selectR3({id,modelProfile:'training-human-v2plus'}),/Unsupported/);
});
