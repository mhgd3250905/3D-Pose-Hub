import fs from 'node:fs';
import {SOURCE,sourcePins,sha} from './hand-qa-runtime.mjs';
export const POSE='grasp-32mm';
// Fixed pose from the already fitted left hand; both new hands require fresh QA.
// This diagnostic installer does not confer acceptance on the copied fit.
export function makeGripPreset(){
 const file=new URL('./grip-fit-32mm.json',import.meta.url),raw=fs.readFileSync(file),fit=JSON.parse(raw);
 // The cylinder fit is invariant along its axis. Center the finite handle on
 // the measured closed-hand envelope so its plates cannot intersect the hand.
 // props.js rotates cylinder +Y to group -X, so its exported cylinder axis
 // is the NEGATIVE of fit.axis (the group's +X alignment).
 const axialOffsetM=.03125955,center=fit.center.map((x,i)=>x+fit.axis[i]*axialOffsetM);
 return {format:'pose-hub-fixed-grasp@1',sourceId:SOURCE,sourcePins:sourcePins(),handScale:1,radius:fit.radius,targets:fit.targets,center,axis:fit.axis,axialOffsetM,finiteHandle:{lengthM:.165,plateInnerHalfGapM:.081,measuredOriginalBoundsM:[-.09940552,.03688523]},derivedFrom:{file:'tools/body-v3/armfix-r2/grip-fit-32mm.json',sha256:sha(raw)},reviewed:false,releaseEligible:false};
}
export async function installGrip(page,data=makeGripPreset()){
 validateGripPreset(data);
 return page.evaluate(({fit,pose})=>{
  const V=__v2p,P=__props,T=__toonT,v=flareInspector.viewer;
  if(__armfixR2.handAsset!==fit.sourceId||!V.hands.on||window.__fixedGrasp||V.poses[pose])throw Error('Grasp requires fresh symmetric r2');
  if(fit.handScale!==1||fit.radius!==.016)throw Error('Unsupported grasp size');
  V.poses[pose]=structuredClone(fit.targets);const previous=P.place;
  P.place=function(o){const s=o.userData.spec;if(!s?.fixedGrasp)return previous.call(this,o);
   if(s.fixedGrasp!==pose||s.type!=='dumbbell'||!['leftHand','rightHand'].includes(s.attach))throw Error('Unsupported explicit fixed grasp prop');
   const side=s.attach.startsWith('left')?'left':'right',mirror=x=>x.map((n,i)=>side==='right'&&i===0?-n:n),b=v.coach.getObjectByName(s.attach),q=b.getWorldQuaternion(new T.Quaternion());
   const rod=o.children[0];if(rod.geometry.type!=='CylinderGeometry'||Math.abs(rod.geometry.parameters.radiusTop-fit.radius)>1e-9)throw Error('Grasp radius mismatch');
   const axis=new T.Vector3(...mirror(fit.axis)).normalize(),rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),axis);
   o.position.copy(new T.Vector3(...mirror(fit.center)).applyQuaternion(q).add(b.getWorldPosition(new T.Vector3())));o.quaternion.copy(q).multiply(rot);o.updateMatrixWorld(true);
  };
  window.__fixedGrasp={pose,fit};return {pose,radius:fit.radius,source:fit.sourceId};
 },{fit:data,pose:POSE});
}
export function validateGripPreset(data){
 const actual=sourcePins(),keys=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j));
 if(data?.format!=='pose-hub-fixed-grasp@1'||data.sourceId!==SOURCE||!Array.isArray(data.sourcePins)||data.sourcePins.length!==actual.length||data.sourcePins.some((s,i)=>s.path!==actual[i].path||s.bytes!==actual[i].bytes||s.sha256!==actual[i].sha256))throw Error('Grasp source changed');
 if(data.handScale!==1||data.radius!==.016||Object.keys(data.targets||{}).sort().join('|')!==keys.sort().join('|')||keys.some(k=>!Array.isArray(data.targets[k])||data.targets[k].length!==4||data.targets[k].some(x=>!Number.isFinite(x))||Math.abs(data.targets[k].reduce((n,x)=>n+x*x,0)-1)>1e-6))throw Error('Malformed fixed grasp');
 if([data.center,data.axis].some(a=>!Array.isArray(a)||a.length!==3||a.some(x=>!Number.isFinite(x)))||Math.abs(Math.hypot(...data.axis)-1)>1e-6)throw Error('Malformed grasp target');
 return data;
}
export function prepareGripSpec(source){
 const spec=structuredClone(source);spec.runtimeModel={profile:'training-human-v3-armfix',version:'0.1.0-r2'};spec.nativeHands={};
 const sides=[];spec.props=spec.props.map(p=>{if(p.type==='dumbbell'&&['leftHand','rightHand'].includes(p.attach)){sides.push(p.attach.startsWith('left')?'left':'right');return {...p,fixedGrasp:POSE};}return p;});
 if(!sides.length)throw Error('No supported fixed grasp prop');spec.v2plus.handPose=Object.fromEntries(sides.map(side=>[side,POSE]));return spec;
}
