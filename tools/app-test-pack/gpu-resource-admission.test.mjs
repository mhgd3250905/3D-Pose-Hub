import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {tryGpuAdmission,releaseOwn} from './gpu-resource-admission.mjs';
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
