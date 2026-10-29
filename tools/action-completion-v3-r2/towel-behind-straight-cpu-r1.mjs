// CPU replay retains the actual engine's post-IK shoulder shifts, then compares with GPU r6.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as T from 'three';
import {createMountainCpuProbe} from './mountain-pose-cpu-r1.mjs';
import {createSideLyingSupportCpu} from './side-lying-support-cpu-r3.mjs';
import {payload,contactMath} from './fixed-band-handles-r1.mjs';
import before from '../../drill-anim/specs/h-towel-behind-r6.js';
import after from '../../drill-anim/specs/h-towel-behind-r7.js';
const folder='F:/PoseHub-v2-production/template-finalization-20261029/';
const captured=JSON.parse(fs.readFileSync(folder+'captures/h-towel-behind/attempt01/capture.json'));
const reference=createMountainCpuProbe(),cpu=await createSideLyingSupportCpu();
const window={__toonT:T,__setRelax:()=>{},__toonUni:{uRelax:{value:null}}};
const context=vm.createContext({window,structuredClone,flareInspector:{viewer:{motion:cpu.motion,coach:cpu.model}}});
vm.runInContext(fs.readFileSync(new URL('../../drill-anim/page/engine.js',import.meta.url),'utf8'),context);
const E=window.__drill;E.R=reference.engine.R;E.L=reference.engine.L;E.footPts=reference.engine.footPts;E.selectModelProfile=()=>{};
const V=a=>new T.Vector3().fromArray(a),deg=180/Math.PI;
const data=payload(),math=contactMath(T),maps=Object.fromEntries(['left','right'].map(s=>[s,new T.Matrix4().fromArray(data.sides[s].map).transpose()]));
function sample(spec,time){
 E.applyAt(spec,time,null);cpu.model.updateMatrixWorld(true);
 const j=Object.assign({},cpu.motion.getMetrics().joints,E._jo||{}),q={};
 for(const s of ['left','right'])q[s]=cpu.model.getObjectByName(s+'Hand').getWorldQuaternion(new T.Quaternion());
 const stored=cpu.motion.getMetrics().joints;const forearm=Object.fromEntries(['left','right'].map(s=>[s,cpu.model.getObjectByName(s+'Forearm').getWorldQuaternion(new T.Quaternion())]));return {j,q,stored,forearm};
}
const report={format:'towel-behind-straight-cpu-r1',candidate:after.id,frames:241,baselineActualAgreementMaxMm:0,baselineHandQuaternionAgreementMaxDeg:0,baselineForearmPreRenderAgreementMaxDeg:0,minBaselineStoredElbow:{left:180,right:180},minBaselineElbow:{left:180,right:180},minCandidateElbow:{left:180,right:180},maxCandidateElbow:{left:0,right:0},minimumReachSlackMm:Infinity,maxWristChangeMm:0,maxUnchangedJointDeltaMm:0,maxHandQuaternionChangeDeg:0,maxAxisAngleDeg:0,maximumLoopJointDeltaMm:0,rows:[],gpuPending:true,userAccepted:false,releaseEligible:false};
for(const k of ['qa','camera','highlight','nativeHands','runtimeModel','keyFrames'])assert.deepEqual(after[k],before[k],k);
assert.equal(after.timeline.duration,before.timeline.duration);assert.deepEqual(after.props,before.props);
let first;
for(let f=0;f<=240;f++){
 const time=f/30,a=sample(before,time),b=sample(after,time),actual=captured.metrics[f],row={frame:f,time,elbow:{}};
 
 for(const [name,p]of Object.entries(a.stored))if(actual.joints[name])report.baselineActualAgreementMaxMm=Math.max(report.baselineActualAgreementMaxMm,V(p).distanceTo(V(actual.joints[name]))*1000);
 for(const [name,p]of Object.entries(b.j))if(!/(?:Elbow|Wrist|Palm)$/.test(name)&&a.j[name])report.maxUnchangedJointDeltaMm=Math.max(report.maxUnchangedJointDeltaMm,V(p).distanceTo(V(a.j[name]))*1000);
 const centers={},world={};
 for(const s of ['left','right']){
  const angle=r=>V(r.j[s+'Shoulder']).sub(V(r.j[s+'Elbow'])).angleTo(V(r.j[s+'Wrist']).sub(V(r.j[s+'Elbow'])))*deg;
  const storedAngle=V(a.stored[s+'Shoulder']).sub(V(a.stored[s+'Elbow'])).angleTo(V(a.stored[s+'Wrist']).sub(V(a.stored[s+'Elbow'])))*deg;report.minBaselineStoredElbow[s]=Math.min(report.minBaselineStoredElbow[s],storedAngle);report.baselineForearmPreRenderAgreementMaxDeg=Math.max(report.baselineForearmPreRenderAgreementMaxDeg,a.forearm[s].angleTo(new T.Quaternion().fromArray(actual.preRenderRotations[s].forearm.worldQuaternion))*deg);row.elbow[s]=angle(b);report.minBaselineElbow[s]=Math.min(report.minBaselineElbow[s],angle(a));report.minCandidateElbow[s]=Math.min(report.minCandidateElbow[s],angle(b));report.maxCandidateElbow[s]=Math.max(report.maxCandidateElbow[s],angle(b));
  report.minimumReachSlackMm=Math.min(report.minimumReachSlackMm,(E.L[s+'UpperArm']+E.L[s+'Forearm']-V(b.j[s+'Shoulder']).distanceTo(V(b.j[s+'Wrist'])))*1000);
  report.maxWristChangeMm=Math.max(report.maxWristChangeMm,V(a.j[s+'Wrist']).distanceTo(V(b.j[s+'Wrist']))*1000);
  report.maxHandQuaternionChangeDeg=Math.max(report.maxHandQuaternionChangeDeg,a.q[s].angleTo(b.q[s])*deg);
  report.baselineHandQuaternionAgreementMaxDeg=Math.max(report.baselineHandQuaternionAgreementMaxDeg,a.q[s].angleTo(new T.Quaternion().fromArray(actual.actualRenderRotations[s].hand.worldQuaternion))*deg);
  world[s]=new T.Matrix4().compose(V(b.j[s+'Wrist']),b.q[s],new T.Vector3(1,1,1)).multiply(maps[s]);centers[s]=V(data.sides[s].hand.cylinder.center).applyMatrix4(world[s]);
 }
 for(const s of ['left','right']){const inv=world[s].clone().invert(),line=centers[s==='left'?'right':'left'].clone().applyMatrix4(inv).sub(centers[s].clone().applyMatrix4(inv)).normalize();report.maxAxisAngleDeg=Math.max(report.maxAxisAngleDeg,Math.acos(Math.min(1,Math.abs(line.dot(V(data.sides[s].hand.cylinder.axis)))))*deg);}
 if(!first)first=b.j;if(f===240)for(const [k,v]of Object.entries(b.j))report.maximumLoopJointDeltaMm=Math.max(report.maximumLoopJointDeltaMm,V(v).distanceTo(V(first[k]))*1000);
 report.rows.push(row);
}
report.passed=report.baselineActualAgreementMaxMm<.01&&report.baselineHandQuaternionAgreementMaxDeg<.02&&report.baselineForearmPreRenderAgreementMaxDeg<.02&&Math.min(...Object.values(report.minCandidateElbow))>=166&&report.minimumReachSlackMm>0&&report.maxUnchangedJointDeltaMm<1e-6&&report.maxAxisAngleDeg<.05&&report.maximumLoopJointDeltaMm<1e-6;
report.sourceSha256Lf=crypto.createHash('sha256').update(fs.readFileSync(new URL('../../drill-anim/specs/h-towel-behind-r7.js',import.meta.url),'utf8').replaceAll('\r\n','\n')).digest('hex');
report.limits=['Actual engine/coach-motion CPU pose, including dynamic shoulder translation; existing GPU r6 is the calibration control.','Fixed hand shaft orientation checked with immutable hand geometry and actual hand bone quaternion; new GPU wrist/elbow skin and prop contact review remains pending.'];
const out=folder+'planning/towel-behind-r7';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/cpu.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined},null,2));assert(report.passed,'CPU candidate did not pass');
