// Reuse the renderer's descriptor arithmetic without starting a browser or renderer.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';

export function createDescriptorProbe(calibration) {
  let requested = null;
  const ground = (side, finger, at) => {
    const h = calibration.groundHands?.find(x => x.side === side &&
      Math.abs(x.at[0] - at[0]) < 1e-6 && Math.abs(x.at[1] - at[2]) < 1e-6);
    if (!h) throw Error(`Missing calibrated floor hand ${side} ${at}`);
    return h.pose ?? h;
  };
  const motion = {getGroundHandPose:ground, applyPose:p=>{requested=structuredClone(p);}, getMetrics:()=>({warnings:[]})};
  const window = {__toonT:THREE,__setRelax:()=>{},__toonUni:{uRelax:{value:null}}};
  const context = vm.createContext({window,structuredClone,flareInspector:{viewer:{motion,coach:{updateMatrixWorld:()=>{}}}}});
  vm.runInContext(fs.readFileSync(new URL('../../drill-anim/page/engine.js',import.meta.url),'utf8'),context);
  const E=window.__drill;
  E.R=calibration.R; E.L=calibration.L; E.init=()=>E; E.selectModelProfile=()=>{}; E.shiftShoulders=()=>{};
  return (spec,time,warm) => {
    const params=E.sample(spec.timeline,time),result=E.pose(spec,params,warm),B=E.body(result.D,result.x);
    const vec=a=>new THREE.Vector3(...a), reach={};
    for(const side of ['left','right']) {
      const shift=vec(result.D.shoulders?.[side]??result.D.shoulders?.shift??[0,0,0]).applyQuaternion(B.qUpper);
      const shoulder=B.up(E.R[side+'Shoulder']).add(shift), hip=B.low(E.R[side+'Hip']);
      const wrist=vec(requested.limbs[side].wrist),ankle=vec(requested.limbs[side].ankle);
      const a=E.L[side+'UpperArm'],b=E.L[side+'Forearm'],armDistance=shoulder.distanceTo(wrist);
      reach[side]={shoulder:shoulder.toArray(),hip:hip.toArray(),wrist:wrist.toArray(),ankle:ankle.toArray(),
        armDistance,armMaximum:a+b-1e-5,
        requestedElbowDegrees:Math.acos(Math.max(-1,Math.min(1,(a*a+b*b-armDistance*armDistance)/(2*a*b))))*180/Math.PI,
        legDistance:hip.distanceTo(ankle),legMaximum:E.L[side+'Thigh']+E.L[side+'Shin']-1e-7,
        handLocked:requested.limbs[side].handLocked};
    }
    return {time,x:result.x,descriptor:result.D,requested:structuredClone(requested),reach};
  };
}

if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const [calibrationFile,specFile,outFile]=process.argv.slice(2);
  if(!outFile)throw Error('Usage: node thomas-reachability-cpu.mjs CALIBRATION_JSON SPEC_JS OUTPUT_JSON');
  const calibration=JSON.parse(fs.readFileSync(calibrationFile,'utf8'));
  const spec=(await import(pathToFileURL(path.resolve(specFile)).href)).default;
  const probe=createDescriptorProbe(calibration),frames=[];let warm;
  for(let frame=0;frame<=Math.round(spec.timeline.duration*30);frame++){
    const r=probe(spec,frame/30,warm);warm=r.x;
    frames.push({frame,time:r.time,pelvis:r.requested.pelvis,reach:r.reach});
  }
  const sides={};
  for(const side of ['left','right']){
    const r=frames.map(f=>f.reach[side]);
    sides[side]={armExcessMaxMm:1000*Math.max(...r.map(x=>x.armDistance-x.armMaximum)),
      legExcessMaxMm:1000*Math.max(...r.map(x=>x.legDistance-x.legMaximum)),
      unlockedFrames:r.filter(x=>!x.handLocked).length};
  }
  fs.writeFileSync(outFile,JSON.stringify({format:'pose-hub-thomas-reachability-cpu@1',
    scope:'Requested descriptor kinematics only; no runtime clamp, mesh contact or GPU evidence.',calibrationFile,specFile,sides,frames},null,2)+'\n');
  console.log(JSON.stringify({outFile,sides}));
}
