import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {installCpuCapture,MAX_CAMERA_DISTANCE_SCALE,run} from './render_latest.mjs';

test('CPU shadow framing moves only the real perspective camera and preserves native draw timing',async()=>{
 const keys=['__toonT','flareInspector','__drill','window','__threadneedle','__props'];
 const before=Object.fromEntries(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const spec={modelProfile:'training-human-v2plus-threadneedle-native',camera:{dir:[1,.5,1],fov:35,drift:0}};
 const specBefore=JSON.stringify(spec);
 async function capture(scale){
  const mesh=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,0,-.5,1,0,.5,0,1.5,0],3)));
  const original={visible:true},times=[];
  const native={source:[{mesh,originalName:'body'}],draw:t=>{times.push(t);return {joints:{root:[0,0,0]},q:[]};}};
  const viewer={coach:{getObjectByName:()=>original}};
  Object.assign(globalThis,{__toonT:T,flareInspector:{viewer},__drill:{selectModelProfile:()=>{}},window:{__threadneedle:native},__threadneedle:native,__props:{update:()=>{}}});
  const report=await installCpuCapture({evaluate:(fn,args)=>fn(args)},spec,scale);
  return {report,camera:viewer.camera,times,vertices:mesh.geometry.attributes.position.array.slice()};
 }
 try {
  const base=await capture(),explicit=await capture(1),wide=await capture(1.8);
  assert.deepEqual(explicit.report,base.report);
  assert.deepEqual(explicit.camera.position.toArray(),base.camera.position.toArray());
  assert.deepEqual(wide.report.center,base.report.center);
  assert.deepEqual(wide.report.direction,base.report.direction);
  assert.equal(wide.report.distance,base.report.distance*1.8);
  assert.equal(wide.report.meshFitDistance,base.report.distance);
  assert.equal(wide.camera.fov,base.camera.fov);
  assert.deepEqual(wide.camera.quaternion.toArray().map(x=>Math.round(x*1e12)),base.camera.quaternion.toArray().map(x=>Math.round(x*1e12)));
  assert.deepEqual(wide.times,base.times);
  assert.deepEqual(wide.vertices,base.vertices);
  assert.equal(JSON.stringify(spec),specBefore);
 } finally {
  for(const key of keys){if(before[key])Object.defineProperty(globalThis,key,before[key]);else delete globalThis[key];}
 }
});

test('invalid CPU camera scales are refused before browser evaluation',async()=>{
 const p={evaluate:()=>assert.fail('invalid input reached browser')};
 for(const scale of [0,.99,MAX_CAMERA_DISTANCE_SCALE+.01,Infinity,NaN])await assert.rejects(installCpuCapture(p,{},scale),/Camera distance scale/);
});

test('wider CPU framing retains original diagnostics and native capture timing gates',async()=>{
 const common={mode:'preview',specFile:new URL('../../drill-anim/specs/h-kneeling-thread-needle-rr1.js',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),out:'__unused_cpu_camera_gate__',runtimeFile:'__unused_runtime__',cameraDistanceScale:1.8};
 await assert.rejects(run({...common,technicalDiagnosticsOnly:true}),/does not support the CPU-authored/);
 await assert.rejects(run({...common,fps:24}),/native 240@30/);
});
