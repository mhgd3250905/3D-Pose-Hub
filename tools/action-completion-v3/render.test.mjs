import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {capturePlan,validateReview,MODEL,parseArgs} from './render.mjs';

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixture=()=>({modelProfile:'training-human-v2plus-hands-native',runtimeModel:{...MODEL},
  camera:{dir:[1,.2,1],drift:0,orbitDegrees:0,frontSweepDegrees:0,fitTimeline:true},
  timeline:{duration:10},stillAt:4,keyFrames:[0,4,8]});

test('capture retains declared ten-second timeline and separate loop endpoint',()=>{
  const plan=capturePlan(fixture());
  assert.equal(plan.frameCount,300);assert.equal(plan.durationSeconds,10);
  for(const frame of [0,120,240,299,300])assert.ok(plan.previewFrames.includes(frame));
  assert.deepEqual([...plan.previewFrames].sort((a,b)=>a-b),plan.previewFrames);
  const longer=fixture();longer.timeline.duration=24;
  assert.equal(capturePlan(longer).frameCount,720);
});

test('fixed-camera contract rejects implicit motion and unapproved runtime fallback',()=>{
  for(const mutate of [s=>delete s.camera.drift,s=>s.camera.orbitDegrees=180,
    s=>s.camera.frontSweepDegrees=20,s=>s.runtimeModel.version='old',s=>s.camera.dir=[0,0,0]]){
    const s=fixture();mutate(s);assert.throws(()=>capturePlan(s));
  }
});

test('CLI rejects duplicate, missing and unnamed options before a capture',()=>{
  assert.throws(()=>parseArgs(['--spec','a','--spec','b']));
  assert.throws(()=>parseArgs(['a','b']));
  assert.throws(()=>parseArgs(['--spec','a','--out','b']));
  const options=parseArgs(['--spec','a','--out','b','--runtime','r','--camera-scale','1.2']);
  assert.equal(options.cameraScale,1.2);
});

test('full capture requires actual viewing receipt bound to source/runtime/camera and image bytes',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pose-completion-review-'));
  try{
    const identity={sourceSha256:'source',specId:'action-r2',runtimeSha256:'runtime',cameraScale:1.15};
    const image=path.join(root,'synthetic-reference.bin'),capture=path.join(root,'capture.json');
    fs.writeFileSync(image,'synthetic fixture, not a viewed image');
    fs.writeFileSync(capture,JSON.stringify({...identity,mode:'preview',complete:true}));
    const receipt={format:'pose-hub-completion-preview-review@1',actualViewing:true,technicalProceed:true,
      reviewedBy:'test-fixture-only',reviewedAt:'2026-10-28T00:00:00Z',...identity,
      preview:{path:capture,sha256:hash(fs.readFileSync(capture))},
      viewedFiles:[{path:image,sha256:hash(fs.readFileSync(image))}]};
    assert.equal(validateReview(receipt,identity).complete,true);
    assert.throws(()=>validateReview({...receipt,actualViewing:false},identity));
    assert.throws(()=>validateReview(receipt,{...identity,sourceSha256:'changed-source'}));
    assert.throws(()=>validateReview(receipt,{...identity,cameraScale:1.3}));
    fs.writeFileSync(image,'changed');assert.throws(()=>validateReview(receipt,identity));
  }finally{
    const resolved=path.resolve(root),parent=path.resolve(os.tmpdir())+path.sep;
    assert.ok(resolved.startsWith(parent)&&path.basename(resolved).startsWith('pose-completion-review-'));
    fs.rmSync(resolved,{recursive:true});
  }
});
