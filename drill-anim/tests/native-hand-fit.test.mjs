import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {verifyHandsNative as verifyR1} from '../models/hands-native-r1/loader.mjs';
import {verifyHandsNative as verifyR2} from '../models/hands-native-r2/loader.mjs';
import {verifyHandsNative as verifyR3, PROFILE, VERSION} from '../models/hands-native-r3/loader.mjs';

const read=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(new URL(rel,import.meta.url),'utf8').replaceAll('\r\n','\n')).digest('hex');
const sourceRatio=.7569905244626751;
const asset=revision=>read(`../models/hands-native-${revision}/hands-base.json`);
const coordinates=mesh=>{
  const bytes=Buffer.from(mesh.pos.u16,'base64');
  return Array.from({length:mesh.n},(_,i)=>[0,1,2].map(k=>bytes.readUInt16LE(i*6+k*2)*mesh.pos.scale[k]+mesh.pos.lo[k]));
};
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const rotate=(v,[x,y,z,w])=>{
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const uv=cross([x,y,z],v),uuv=cross([x,y,z],uv);
  return v.map((n,i)=>n+2*(w*uv[i]+uuv[i]));
};

test('Whole-hand fit preserves frozen candidates and remains scoped, unapproved and non-default',()=>{
  assert.equal(verifyR1().version,'1.0.0-r1');
  assert.equal(verifyR2().version,'1.0.0-r2');
  const manifest=verifyR3();
  assert.equal(manifest.id,PROFILE);
  assert.equal(manifest.version,VERSION);
  assert.equal(VERSION,'1.0.0-r3');
  for(const flag of ['reviewed','releaseEligible','defaultForNewDrills'])assert.equal(manifest[flag],false,flag);
  assert.deepEqual(manifest.scope,['h-bent-knee-calf-raise-rr7','h-chair-single-leg-hip-thrust-rr8']);
  for(const rel of ['hands-base.json','hands-rig.json','loader.mjs','preview.mjs','build-report.json']) {
    const key=`drill-anim/models/hands-native-r3/${rel}`;
    assert.equal(manifest.sourceSha256[key],sha(`../models/hands-native-r3/${rel}`),key);
  }
  assert.equal(manifest.sourceSha256['tools/human-v2plus/hands-native/fit_hand.py'],sha('../../tools/human-v2plus/hands-native/fit_hand.py'));
  const production=read('../models/current-production.json');
  assert.notEqual(production.modelProfile,PROFILE);
});

test('The entire finger rig follows source scale, without reusing oversized joint locations',()=>{
  const previous=read('../models/hands-native-r1/hands-rig.json');
  const revision=read('../models/hands-native-r3/hands-rig.json');
  const report=read('../models/hands-native-r3/build-report.json');
  assert.equal(report.sourceToOldFingerLengthRatio,sourceRatio);
  assert.equal(report.uniformSourceScale,1);
  assert.equal(revision.sourceNative.sourceToOldFingerLengthRatio,sourceRatio);
  assert.equal(revision.sourceNative.uniformSourceScale,1);
  assert.equal(revision.sourceNative.openIsIdentity,true);
  assert.equal(revision.sourceNative.noOldJointRetarget,true);
  for(const finger of ['thumb','index','middle','ring','pinky']) {
    for(let joint=0;joint<4;joint++)assert.ok(distance(revision.fingers[finger].joints[joint],previous.fingers[finger].joints[joint].map(v=>v*sourceRatio))<1e-12,`${finger} joint ${joint}`);
    assert.ok(distance(revision.fingers[finger].flexAxis,previous.fingers[finger].flexAxis)<1e-12,`${finger} flex axis`);
  }
  for(const [pose,bones]of Object.entries(previous.poses))for(const [bone,q]of Object.entries(bones))assert.ok(distance(revision.poses[pose][bone],q)<1e-12,`${pose}/${bone} rotation`);
});

test('The fixed forearm seam retains source owner identities, positions and skin weights',()=>{
  const previous=asset('r1'),revision=asset('r3');
  assert.deepEqual(revision.bones,previous.bones);
  const positions=[coordinates(previous),coordinates(revision)];
  const owners=mesh=>new Map(mesh.seam.vid.map((vid,i)=>[`${mesh.seam.mesh[i]}:${vid}`,i]));
  const ownerMaps=[owners(previous),owners(revision)];
  assert.equal(ownerMaps[0].size,66);
  assert.equal(ownerMaps[1].size,66);
  assert.deepEqual([...ownerMaps[1].keys()].sort(),[...ownerMaps[0].keys()].sort());
  const quantizationTolerance=(Math.hypot(...previous.pos.scale)+Math.hypot(...revision.pos.scale))/2+1e-9;
  const joints=[previous,revision].map(mesh=>Buffer.from(mesh.joints.u8,'base64'));
  const weights=[previous,revision].map(mesh=>Buffer.from(mesh.weights.u8,'base64'));
  for(const [key,oldIndex]of ownerMaps[0]) {
    const newIndex=ownerMaps[1].get(key),indices=[previous.seam.first+oldIndex,revision.seam.first+newIndex];
    assert.equal(revision.seam.ring[newIndex],previous.seam.ring[oldIndex],key);
    assert.ok(distance(positions[0][indices[0]],positions[1][indices[1]])<=quantizationTolerance,key);
    const dense=indices.map((index,version)=>{
      const result=new Array(previous.bones.length).fill(0);
      for(let k=0;k<4;k++)result[joints[version][index*4+k]]+=weights[version][index*4+k];
      return result;
    });
    assert.deepEqual(dense[1],dense[0],`${key} skin weights`);
  }
});

test('Distal palm and fingers scale with the matching rig on both hands',()=>{
  const previous=asset('r1'),revision=asset('r3');
  const before=coordinates(previous),after=coordinates(revision);
  const frames=read('../models/hands-native-r2/refine-report.json').handFrames;
  const tolerance=(Math.hypot(...previous.pos.scale)*sourceRatio+Math.hypot(...revision.pos.scale))/2+1e-8;
  const key=v=>v.map(n=>Math.floor(n/tolerance)).join(',');
  const grid=new Map();
  for(const point of after) {
    const k=key(point),bucket=grid.get(k)||[];
    bucket.push(point);grid.set(k,bucket);
  }
  const checked={left:0,right:0};
  for(const point of before) {
    const side=point[0]>0?'left':'right',frame=frames[side],q=frame.q;
    const local=rotate(point.map((v,i)=>v-frame.p[i]),[-q[0],-q[1],-q[2],q[3]]);
    // The joining band may change topology; the distal palm and fingers must
    // retain the exact source shape, within the two assets' quantization error.
    if(local[0]*(side==='left'?1:-1)<.060)continue;
    const expected=rotate(local.map(v=>v*sourceRatio),q).map((v,i)=>v+frame.p[i]);
    const cell=expected.map(v=>Math.floor(v/tolerance));
    let nearest=Infinity;
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++) {
      const candidates=grid.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))||[];
      for(const candidate of candidates)nearest=Math.min(nearest,distance(expected,candidate));
    }
    assert.ok(nearest<=tolerance,`${side} source surface does not match the scaled rig: ${nearest} m`);
    checked[side]++;
  }
  assert.ok(checked.left>5000&&checked.right>5000,JSON.stringify(checked));
});

for(const [previousId,revisionId]of [
  ['h-bent-knee-calf-raise-rr6','h-bent-knee-calf-raise-rr7'],
  ['h-chair-single-leg-hip-thrust-rr7','h-chair-single-leg-hip-thrust-rr8'],
])test(`${revisionId} changes only the version, id and symmetric finger direction`,async()=>{
  const {default:previous}=await import(`../specs/${previousId}.js`);
  const snapshot=structuredClone(previous);
  const {default:revision}=await import(`../specs/${revisionId}.js`);
  assert.deepEqual(previous,snapshot);
  const expected=structuredClone(snapshot);
  expected.id=revisionId;
  expected.nativeHands={version:VERSION};
  expected.pose.base.hands.left.finger=[-.12,-.95,.34];
  expected.pose.base.hands.right.finger=[.12,-.95,.34];
  assert.deepEqual(revision,expected);
  const entry=read('../data/home-pr-candidates.json').specs[revisionId+'.js'];
  assert.equal(entry.sha256,sha(`../specs/${revisionId}.js`));
  assert.equal(entry.reviewed,false);
  assert.equal(entry.releaseEligible,false);
});
