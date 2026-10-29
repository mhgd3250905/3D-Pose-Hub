import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as T from 'three';
import {payload,contactMath,installInPage} from './fixed-band-handles-r1.mjs';
import oldSpec from '../../drill-anim/specs/h-band-biceps-curl-r5.js';
import spec from '../../drill-anim/specs/h-band-biceps-curl-r6.js';
const source=process.argv[2]||'F:/PoseHub-v2-production/template-finalization-20261029/captures/h-band-biceps-curl/attempt02/capture.json';
const output=process.argv[3],data=payload({verifyManifest:false}),math=contactMath(T),cfg=data.config;
const bytes=fs.readFileSync(source),capture=JSON.parse(bytes),rows=capture.metrics;
assert.equal(rows.length,241);assert.equal(capture.complete,true);
for(const key of ['camera','timeline','pose','qa','nativeHands','runtimeModel','highlight','fps'])assert.deepEqual(spec[key],oldSpec[key],key+' changed');
for(let i=0;i<2;i++){const a=structuredClone(spec.props[i]),b=structuredClone(oldSpec.props[i]);delete a.from;delete b.from;assert.deepEqual(a,b,'band/foot anchor changed');}
const result={format:'fixed-band-handles-cpu-r1',candidate:spec.id,source,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),frames:rows.length,sides:{},invariants:'Only handled-band connection and explicit component metadata changed; motion/feet/camera/timing/QA identical.',limits:['CPU reconstruction uses recorded actual-render quaternions with pre-render wrist/ankle origins; live matrix checks remain required.','241 capture samples cover the 8 s loop at 30 fps, not a continuous-time intersection proof.','Exact frozen shaft contact is preserved, not re-certified as zero penetration.','GPU appearance and user acceptance remain pending.'],reviewed:false,releaseEligible:false};
const transforms={};
for(const side of ['left','right']){
 const input=data.sides[side],faces=math.triangles(input.hand),map=new T.Matrix4().fromArray(input.map).transpose(),connector=math.V(cfg.canonicalConnector);
 const geometry={yokeClearancesMm:math.yoke(input.hand,cfg).map(([a,b])=>(math.segmentDistance(a,b,faces)-cfg.yokeRadiusM)*1000),socketClearanceMm:(math.segmentDistance(connector,connector.clone().addScalar(1e-12),faces)-cfg.socketRadiusM)*1000};
 let minimum=Infinity,worstFrame=-1;transforms[side]=[];
 for(const row of rows){
  const pose=row.actualRenderRotations[side],hand=new T.Matrix4().compose(math.V(row.joints[side+'Wrist']),new T.Quaternion(...pose.hand.worldQuaternion),new T.Vector3(1,1,1)),world=hand.clone().multiply(map),foot=new T.Matrix4().compose(math.V(row.joints[side+'Ankle']),new T.Quaternion(...pose.foot.worldQuaternion),new T.Vector3(1,1,1));
  const prop=spec.props.find(p=>p.from.bone===side+'Hand'),end=math.V(prop.to.offset).applyMatrix4(foot),start=connector.clone().applyMatrix4(world);
  assert(start.distanceTo(math.V(prop.from.offset).applyMatrix4(hand))<1e-8);
  const gap=math.segmentDistance(connector,end.clone().applyMatrix4(world.clone().invert()),faces)-cfg.bandRadiusM;
  if(gap<minimum){minimum=gap;worstFrame=row.frame;}transforms[side].push({hand,foot,start,end});
 }
 result.sides[side]={...geometry,minimumBandClearanceMm:minimum*1000,worstFrame,exactShaftSha256:crypto.createHash('sha256').update(JSON.stringify(input.shaft)).digest('hex')};
 assert(Math.min(...geometry.yokeClearancesMm)>0,side+' yoke touches hand');assert(geometry.socketClearanceMm>0,side+' socket touches hand');assert(minimum>=cfg.minimumBandClearanceM,side+' band too close');
 assert(transforms[side][0].start.distanceTo(transforms[side].at(-1).start)<1e-8,side+' connector loop');
}
// Exercise the actual-phase hook without WebGL: old prop geometry must survive both success and throw.
globalThis.window={__toonT:T,__fixedBandContactMath:contactMath,__webxrWristJoin:{active:true}};
const coach=new T.Group(),scene=new T.Scene();scene.add(coach);
for(const side of ['left','right'])for(const [suffix,key]of [['Hand','hand'],['Foot','foot']]){const b=new T.Bone();b.name=side+suffix;b.matrixAutoUpdate=false;b.matrix.copy(transforms[side][0][key]);coach.add(b);}
globalThis.flareInspector={viewer:{coach}};let calls=0,fail=false;
const originals=[];globalThis.__props={list:spec.props.map(s=>{const m=new T.Mesh(new T.BufferGeometry());m.userData.spec=s;originals.push(m.geometry);return m;}),pt:p=>math.V(p.offset).applyMatrix4(coach.getObjectByName(p.bone).matrixWorld)};
const base=()=>{calls++;for(let i=0;i<2;i++)assert.notEqual(__props.list[i].geometry,originals[i]);if(fail)throw Error('test-base-render-failure');return 42;};
window.__fixedWristCorrectionsR1={phase:'ready',gate:{target:base}};
installInPage(data);const api=window.__fixedBandHandlesR1;
for(const frame of [0,54,120,180,240]){for(const side of ['left','right'])for(const [suffix,key]of [['Hand','hand'],['Foot','foot']])coach.getObjectByName(side+suffix).matrix.copy(transforms[side][frame][key]);assert.equal(window.__fixedWristCorrectionsR1.gate.target(),42);assert(api.last.completed);for(let i=0;i<2;i++)assert.equal(__props.list[i].geometry,originals[i]);}
fail=true;assert.throws(()=>window.__fixedWristCorrectionsR1.gate.target(),/test-base-render-failure/);assert.equal(api.last.completed,false);for(let i=0;i<2;i++)assert.equal(__props.list[i].geometry,originals[i]);
assert.equal(api.drawCount,6);api.detach();assert.equal(window.__fixedWristCorrectionsR1.gate.target,base);assert.equal(coach.children.length,4);
result.hookTest={successfulDraws:5,throwDrawRestored:true,drawCount:6,detachRestored:true};result.cpuPassed=true;
if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
