import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {tryGpuAdmission,releaseOwn,BOUNDED_POSTPROCESS_STAGES} from './gpu-resource-admission.mjs';
const GiB=1024**3;
test('GPU resource admission preserves per-role exclusivity and memory guard',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pose-hub-admission-'));
 const ownFile=path.join(dir,'heavy.lock'),peerFile=path.join(dir,'cpu-heavy.lock'),guardFile=path.join(dir,'resource-admission.lock');
 const base={ownFile,peerFile,guardFile,action:'isolated-test',stage:'no-render'},memory=(commit,physical=9)=>({availableCommitBytes:commit*GiB,availablePhysicalBytes:physical*GiB});
 const clear=()=>{for(const file of [ownFile,peerFile,guardFile])if(fs.existsSync(file))fs.unlinkSync(file);};
 const peer=()=>fs.writeFileSync(peerFile,JSON.stringify({pid:process.pid,role:'cpu',action:'isolated-peer'}));
 try{
 await t.test('alone accepts4GiB and releases only its own task lock',async()=>{const r=await tryGpuAdmission({...base,probe:async()=>memory(4.2)});assert(r.admitted);assert(!fs.existsSync(guardFile));assert(releaseOwn(ownFile,r.owner));});
 await t.test('live peer requires8GiB commit',async()=>{peer();const r=await tryGpuAdmission({...base,probe:async()=>memory(7.9)});assert(!r.admitted);assert(!fs.existsSync(ownFile));clear();});
 await t.test('live peer requires6GiB physical',async()=>{peer();const r=await tryGpuAdmission({...base,probe:async()=>memory(9,5.9)});assert(!r.admitted);clear();});
 await t.test('safe overlap allows only one GPU and protects token ownership',async()=>{peer();const r=await tryGpuAdmission({...base,probe:async()=>memory(8.2,6.1)});assert(r.admitted);const duplicate=await tryGpuAdmission({...base,probe:async()=>memory(12)});assert(!duplicate.admitted);assert(!releaseOwn(ownFile,{...r.owner,token:'wrong-token'}));assert(releaseOwn(ownFile,r.owner));assert(fs.existsSync(peerFile));clear();});
 await t.test('post-claim threshold drop releases own lock and guard',async()=>{let calls=0;const r=await tryGpuAdmission({...base,probe:async()=>memory(++calls===1?4.2:3.9)});assert(!r.admitted);assert(!fs.existsSync(ownFile));assert(!fs.existsSync(guardFile));});
 await t.test('malformed peer remains untouched for inspection',async()=>{fs.writeFileSync(peerFile,'{');const r=await tryGpuAdmission({...base,probe:async()=>memory(20)});assert(!r.admitted);assert.equal(fs.readFileSync(peerFile,'utf8'),'{');clear();});
 await t.test('dead admission owner remains untouched for inspection',async()=>{const value={pid:2147483647,role:'admission',action:'stale-test',token:'keep'};fs.writeFileSync(guardFile,JSON.stringify(value));const r=await tryGpuAdmission({...base,probe:async()=>memory(20)});assert(!r.admitted);assert.deepEqual(JSON.parse(fs.readFileSync(guardFile,'utf8')),value);clear();});
 }finally{clear();fs.rmdirSync(dir);}
});

test('bounded postprocess is explicit, measured-stage-only and keeps atomic admission',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pose-hub-bounded-'));
 const ownFile=path.join(dir,'heavy.lock'),peerFile=path.join(dir,'cpu-heavy.lock'),guardFile=path.join(dir,'resource-admission.lock');
 const base={ownFile,peerFile,guardFile,action:'isolated-bounded-test',stage:'contact-sheet',resourceClass:'bounded-postprocess'};
 const memory=(commit,physical=2)=>({availableCommitBytes:commit*GiB,availablePhysicalBytes:physical*GiB});
 const clear=()=>{for(const file of [ownFile,peerFile,guardFile])if(fs.existsSync(file))fs.unlinkSync(file);};
 const peer=()=>{const owner={pid:process.pid,role:'cpu',action:'isolated-cpu-peer'};fs.writeFileSync(peerFile,JSON.stringify(owner));return owner;};
 try{
 await t.test('only the three qualified postprocesses are allowed',()=>{assert.deepEqual(BOUNDED_POSTPROCESS_STAGES,['contact-sheet','prepare-metadata','full-margin-audit']);assert(Object.isFrozen(BOUNDED_POSTPROCESS_STAGES));});
 await t.test('live CPU peer accepts exactly4GiB without lowering role exclusion',async()=>{
  const cpu=peer();const r=await tryGpuAdmission({...base,probe:async()=>memory(4)});
  assert(r.admitted);assert.equal(r.minimum.availableCommitBytes,4*GiB);assert.equal(r.minimum.availablePhysicalBytes,0);
  assert.equal(r.owner.role,'gpu');assert.equal(r.owner.resourceClass,'bounded-postprocess');assert(!fs.existsSync(guardFile));
  assert.deepEqual(JSON.parse(fs.readFileSync(peerFile,'utf8')),cpu);
  const second=await tryGpuAdmission({...base,probe:async()=>memory(20)});assert(!second.admitted);assert.equal(second.wait.reason,'awaiting-gpu-role-slot');
  assert(!releaseOwn(ownFile,{...r.owner,token:'wrong-token'}));assert(releaseOwn(ownFile,r.owner));assert(fs.existsSync(peerFile));clear();
 });
 await t.test('below4GiB rejects alone and with CPU peer',async()=>{
  for(const withPeer of [false,true]){if(withPeer)peer();let calls=0;
   const r=await tryGpuAdmission({...base,probe:async()=>{calls++;return memory(3.999);}});
   assert(!r.admitted);assert.equal(calls,1);assert.equal(r.wait.reason,'available-memory-below-admission-threshold');
   assert(!fs.existsSync(ownFile));assert(!fs.existsSync(guardFile));clear();}
 });
 await t.test('post-claim drop below4GiB rolls back own task and guard, preserves CPU',async()=>{
  const cpu=peer();let calls=0;const r=await tryGpuAdmission({...base,probe:async()=>memory(++calls===1?4.1:3.999)});
  assert(!r.admitted);assert.equal(calls,2);assert.equal(r.wait.reason,'available-memory-dropped-during-admission');
  assert(!fs.existsSync(ownFile));assert(!fs.existsSync(guardFile));assert.deepEqual(JSON.parse(fs.readFileSync(peerFile,'utf8')),cpu);clear();
 });
 for(const stage of ['prepare-metadata','full-margin-audit'])await t.test(stage+' accepts4GiB with CPU peer under the same GPU role lock',async()=>{
  const cpu=peer();let calls=0;const r=await tryGpuAdmission({...base,stage,probe:async()=>{calls++;return memory(4);}});
  assert(r.admitted);assert.equal(calls,2);assert.equal(r.minimum.availableCommitBytes,4*GiB);
  assert.equal(r.owner.role,'gpu');assert.equal(r.owner.stage,stage);assert.equal(r.owner.resourceClass,'bounded-postprocess');
  assert(!fs.existsSync(guardFile));assert.deepEqual(JSON.parse(fs.readFileSync(peerFile,'utf8')),cpu);
  assert(releaseOwn(ownFile,r.owner));clear();
 });
 await t.test('preview/full, old floating-point source audit and unknown stages cannot use bounded class',async()=>{
  for(const stage of ['preview','full','source-audit','audit-plan-source-framing','prepare-anything','contact-sheet-copy','unknown',undefined,null]){
   let calls=0;await assert.rejects(tryGpuAdmission({...base,stage,probe:async()=>{calls++;return memory(20);}}),/not allowed for bounded-postprocess/);
   assert.equal(calls,0);assert(!fs.existsSync(ownFile));assert(!fs.existsSync(guardFile));}
  for(const resourceClass of ['light','unknown',null,{},[]])await assert.rejects(tryGpuAdmission({...base,resourceClass,probe:async()=>memory(20)}),/Unknown GPU resourceClass/);
 });
 await t.test('same CAS guard is held for both probes and task claim',async()=>{
  peer();let calls=0;const r=await tryGpuAdmission({...base,probe:async()=>{
   calls++;const guard=JSON.parse(fs.readFileSync(guardFile,'utf8'));assert.equal(guard.role,'admission');assert.equal(guard.action,base.action);
   if(calls===1)assert(!fs.existsSync(ownFile));else assert(fs.existsSync(ownFile));return memory(4.2);}});
  assert(r.admitted);assert.equal(calls,2);assert(!fs.existsSync(guardFile));assert(releaseOwn(ownFile,r.owner));clear();
 });
 await t.test('busy or stale guard is preserved before any memory probe',async()=>{
  const guard={pid:process.pid,role:'admission',token:'foreign',action:'another-task'};
  fs.writeFileSync(guardFile,JSON.stringify(guard));let calls=0;const r=await tryGpuAdmission({...base,probe:async()=>{calls++;return memory(20);}});
  assert(!r.admitted);assert.equal(calls,0);assert.equal(r.wait.reason,'awaiting-resource-admission');assert.deepEqual(JSON.parse(fs.readFileSync(guardFile,'utf8')),guard);clear();
 });
 await t.test('heavy remains the default and keeps8GiB plus6GiB with a CPU peer',async()=>{
  peer();for(const resourceClass of [undefined,'heavy']){
   const r=await tryGpuAdmission({...base,resourceClass,probe:async()=>memory(7.9,10)});
   assert(!r.admitted);assert.equal(r.wait.minimum.availableCommitBytes,8*GiB);assert.equal(r.wait.minimum.availablePhysicalBytes,6*GiB);}
  const r=await tryGpuAdmission({...base,resourceClass:'heavy',stage:'full',probe:async()=>memory(8.1,6.1)});
  assert(r.admitted);assert.equal(r.resourceClass,'heavy');assert(releaseOwn(ownFile,r.owner));clear();
 });
 }finally{clear();fs.rmdirSync(dir);}
});
