import test from 'node:test';
import assert from 'node:assert/strict';
import {selectProfile,capturePlan,checkPreview,parseArgs,executionPlan,verifyBase} from './render_latest.mjs';

test('the actual frozen v2 GLB and both model source manifests verify with their declared hash rules',()=>{
 // Read the real repository files: no fixture/mock can hide binary UTF-8 damage.
 assert.equal(verifyBase(),26);
});

test('actual ten-second lunges retain 300 frames; the source is never stretched',async()=>{
 for(const id of ['h-forward-lunge','h-lateral-step-lunge']){const s=(await import('../../drill-anim/specs/'+id+'.js')).default;const p=capturePlan(s);assert.equal(p.durationSeconds,10);assert.equal(p.frameCount,300);assert.ok(p.previewFrames.includes(299));assert.ok(p.previewFrames.includes(300));}
});
test('the CPU profile is explicitly routed, never sent through hidden-rig diagnostics',async()=>{
 const s=(await import('../../drill-anim/specs/h-kneeling-thread-needle-rr1.js')).default;
 assert.equal(selectProfile(s).mode,'cpu-threadneedle');assert.throws(()=>selectProfile({...s,threadneedleNative:{version:'unknown'}}),/Unsupported/);assert.throws(()=>selectProfile(s,'base-v2plus'),/fall back/);
});
test('all seven exact special revisions retain their separate loader',async()=>{
 const ids=['h-wall-palm-lift-rr5','h-bent-knee-calf-raise-rr7','h-chair-single-leg-hip-thrust-rr8','h-fixed-bar-vertical-pull-rr7','h-db-overhead-triceps-extension-rr4','h-kneeling-instep-stretch-rr6','h-kneeling-thread-needle-rr1'];
 for(const id of ids){const s=(await import('../../drill-anim/specs/'+id+'.js')).default;assert.ok(selectProfile(s).folder);assert.throws(()=>selectProfile({...s,modelProfile:'training-human-v2plus'}),/Unsupported/);}
});
test('new native IDs require an explicit native-open entry and exact versions',()=>{
 const s={id:'new-native',modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}};
 assert.throws(()=>selectProfile(s),/explicit native-open/);assert.equal(selectProfile(s,'native-open-r1').exportName,'applyNativeOpen');
 assert.throws(()=>selectProfile({...s,nativeHands:{version:'old'}},'native-open-r1'),/version/);
 for(const modelProfile of ['toString','constructor','training-human-v2plus-grip',['training-human-v2plus-hands-native']])assert.throws(()=>selectProfile({...s,modelProfile},'native-open-r1'),/profile/);
});
test('preview includes source key phases and rejects duplicate or incomplete sequences',()=>{
 const s={timeline:{duration:8},keyFrames:[1.6,5.6],stillAt:2.4};assert.ok(capturePlan(s).previewFrames.includes(48));assert.ok(capturePlan(s).previewFrames.includes(168));
 assert.throws(()=>capturePlan(s,{frames:[0,60,239,239,240]}),/unique/);assert.throws(()=>capturePlan(s,{frames:[0,60,239]}),/endpoint/);
});
test('full capture gate binds runtime, original spec, output ID and matching transparent preview',()=>{
 const identity={tool:'t',toolSha256:'a',sourceSha256:'b',specId:'s',actionId:'stable',profile:{profile:'p'},fps:30,durationSeconds:8,frameCount:240,size:1080,cameraDistanceScale:1,runtimeSha256:'gpu'};
 const report={...identity,mode:'preview',complete:true,frames:[0,60,239,240],sequences:{body:{},highlight:{},shadow:{}}};checkPreview(report,identity);
 for(const patch of [{runtimeSha256:'other'},{sourceSha256:'other'},{specId:'old'},{actionId:'other'}])assert.throws(()=>checkPreview({...report,...patch},identity),/provenance/);
 assert.throws(()=>checkPreview({...report,sequences:{body:{},highlight:{}}},identity),/shadow/);
});
test('CLI rejects unknown arguments and preserves the actual-viewing flag',()=>{
 assert.throws(()=>parseArgs(['preview','--unknown','x']),/Unknown/);const opts=parseArgs(['full','--preview-reviewed','--fps','30','--frames','0,60,239,240']);assert.equal(opts.previewReviewed,true);assert.equal(opts.fps,30);
});
test('catalog execution plan has dynamic frame totals and explicit native-open sources',async()=>{
 const plan=await executionPlan({catalogFile:new URL('../../catalog/test/app-test-pack-r1.json',import.meta.url),sourceRoot:'F:/PoseHub-v2-production/app-test-pack-r1-source',runtimeFile:'F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json'});
 assert.equal(plan.maxConcurrentRenderers,2);assert.equal(plan.jobsPerProcess,1);assert.equal(plan.actions.length,33);
 assert.equal(plan.actions.find(a=>a.specId==='h-forward-lunge').frameCount,300);assert.equal(plan.actions.filter(a=>a.profile.folder==='native-open-r1').length,7);
});
