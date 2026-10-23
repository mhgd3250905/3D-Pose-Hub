import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyHandsNative, PROFILE, VERSION} from '../models/hands-native-r1/loader.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const hash=rel=>{
  const bytes=fs.readFileSync(path.join(root,rel));
  return crypto.createHash('sha256').update(rel.endsWith('.glb')?bytes:bytes.toString('utf8').replaceAll('\r\n','\n')).digest('hex');
};

test('Native hands are explicitly versioned, source-pinned and unapproved',()=>{
  const manifest=verifyHandsNative();
  assert.equal(manifest.id,PROFILE);
  assert.equal(manifest.version,VERSION);
  assert.equal(manifest.reviewed,false);
  assert.equal(manifest.releaseEligible,false);
  for(const rel of [
    'drill-anim/models/hands-native-r1/hands-base.json',
    'drill-anim/models/hands-native-r1/hands-rig.json',
    'drill-anim/models/hands-native-r1/loader.mjs',
    'drill-anim/models/hands-native-r1/preview.mjs',
    'tools/human-v2plus/hands-native/build.py',
    'tools/human-v2plus/hands-native/check.py',
  ]) assert.equal(manifest.sourceSha256[rel],hash(rel),rel);
});

test('Native relaxed finger rotations curl toward the palmar side',()=>{
  const rig=read('drill-anim/models/hands-native-r1/hands-rig.json');
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  for(const finger of ['index','middle','ring','pinky']) {
    const joint=rig.fingers[finger].joints;
    const direction=joint[1].map((v,i)=>v-joint[0][i]);
    const q=rig.poses.relaxed[finger+'1'];
    const u=q.slice(0,3),uv=cross(u,direction),uuv=cross(u,uv);
    const rotated=direction.map((v,i)=>v+2*(q[3]*uv[i]+uuv[i]));
    assert.ok(rotated[1]<direction[1],`${finger}: relaxed curl must move toward local -Y, not extend dorsally`);
  }
});

for(const profile of ['training-human-v2','training-human-v2plus']) {
  test(`${profile}: all frozen model inputs retain their pinned hashes`,()=>{
    const manifest=read(`drill-anim/models/${profile}.json`);
    for(const [rel,expected]of Object.entries(manifest.sourceSha256))assert.equal(hash(rel),expected,rel);
  });
}

for(const [previousId,revisionId]of [
  ['h-bent-knee-calf-raise-rr4','h-bent-knee-calf-raise-rr5'],
  ['h-chair-single-leg-hip-thrust-rr5','h-chair-single-leg-hip-thrust-rr6'],
]) {
  test(`${revisionId}: only the model selection changes`,async()=>{
    const {default:previous}=await import(`../specs/${previousId}.js`);
    const snapshot=structuredClone(previous);
    const {default:revision}=await import(`../specs/${revisionId}.js`);
    assert.deepEqual(previous,snapshot);
    assert.deepEqual(revision,{...snapshot,id:revisionId,modelProfile:PROFILE,nativeHands:{version:VERSION}});
    const entry=read('drill-anim/data/home-pr-candidates.json').specs[revisionId+'.js'];
    assert.equal(entry.sha256,hash(`drill-anim/specs/${revisionId}.js`));
    assert.equal(entry.reviewed,false);
    assert.equal(entry.releaseEligible,false);
  });
}
