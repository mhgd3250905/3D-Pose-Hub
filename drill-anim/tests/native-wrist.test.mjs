import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {verifyHandsNative as verifyR1} from '../models/hands-native-r1/loader.mjs';
import {verifyHandsNative as verifyR2} from '../models/hands-native-r2/loader.mjs';

const read=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const asset=version=>read(`../models/hands-native-${version}/hands-base.json`);
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(new URL(rel,import.meta.url),'utf8').replaceAll('\r\n','\n')).digest('hex');

test('Wrist refinement preserves r1 manifest and stays explicitly unapproved',()=>{
  assert.equal(verifyR1().version,'1.0.0-r1');
  const manifest=verifyR2();
  assert.equal(manifest.version,'1.0.0-r2');
  assert.equal(manifest.reviewed,false);
  assert.equal(manifest.releaseEligible,false);
  assert.equal(manifest.defaultForNewDrills,false);
});

test('Wrist refinement preserves protected palm/fingers byte for byte and the live seam',()=>{
  const previous=asset('r1'),revision=asset('r2');
  const report=read('../models/hands-native-r2/refine-report.json');
  assert.equal(report.parameters.protect_x,.035);
  assert.deepEqual(revision.pos.lo,previous.pos.lo);
  assert.deepEqual(revision.pos.scale,previous.pos.scale);
  assert.deepEqual(revision.bones,previous.bones);
  assert.deepEqual(revision.index,previous.index);
  assert.deepEqual(revision.seam,previous.seam);
  const streams=[['pos','u16',6],['weights','u8',4],['joints','u8',4],['nrm','i8',3]];
  const buffers=streams.map(([key,encoding,stride])=>({key,stride,before:Buffer.from(previous[key][encoding],'base64'),after:Buffer.from(revision[key][encoding],'base64')}));
  for(const stream of buffers)assert.equal(stream.before.length,stream.after.length,stream.key);
  const position=buffers[0].before;
  let protectedCount=0;
  for(let i=0;i<position.length/6;i++) {
    const p=[0,1,2].map(k=>position.readUInt16LE(i*6+k*2)*previous.pos.scale[k]+previous.pos.lo[k]);
    const side=p[0]>0?'left':'right',frame=report.handFrames[side];
    const [x,y,z,w]=frame.q;
    const axis=[1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y)];
    const localX=p.reduce((sum,v,k)=>sum+(v-frame.p[k])*axis[k],0)*(side==='left'?1:-1);
    const protectedVertex=localX>=.035;
    const seamVertex=i>=previous.seam.first;
    if(protectedVertex)protectedCount++;
    for(const stream of buffers)if(protectedVertex||(seamVertex&&stream.key!=='nrm')) {
      assert.deepEqual(stream.after.subarray(i*stream.stride,(i+1)*stream.stride),stream.before.subarray(i*stream.stride,(i+1)*stream.stride),`${stream.key} vertex ${i}`);
    }
  }
  assert.ok(protectedCount>1000,'The protected region must include the existing palm/finger mesh');
});

for(const [previousId,revisionId]of [
  ['h-bent-knee-calf-raise-rr5','h-bent-knee-calf-raise-rr6'],
  ['h-chair-single-leg-hip-thrust-rr6','h-chair-single-leg-hip-thrust-rr7'],
])test(`${revisionId} changes only id and explicit native-hand version`,async()=>{
  const {default:previous}=await import(`../specs/${previousId}.js`);
  const snapshot=structuredClone(previous);
  const {default:revision}=await import(`../specs/${revisionId}.js`);
  assert.deepEqual(previous,snapshot);
  assert.deepEqual(revision,{...snapshot,id:revisionId,nativeHands:{version:'1.0.0-r2'}});
  const entry=read('../data/home-pr-candidates.json').specs[revisionId+'.js'];
  assert.equal(entry.sha256,sha(`../specs/${revisionId}.js`));
  assert.equal(entry.reviewed,false);
  assert.equal(entry.releaseEligible,false);
});
