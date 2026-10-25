import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const GiB=1024**3;
function inspect(file,role){
 if(!fs.existsSync(file))return {state:'missing'};
 let owner;try{owner=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){return {state:'invalid',error:String(error)};}
 if(!owner||Array.isArray(owner)||owner.role!==role||!Number.isInteger(owner.pid)||owner.pid<=0||typeof owner.action!=='string'||!owner.action)return {state:'invalid',owner};
 try{process.kill(owner.pid,0);return {state:'alive',owner};}catch(error){return {state:error.code==='ESRCH'?'dead':'unknown',owner,error:String(error)};}
}
function writeExclusive(file,owner){const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,JSON.stringify(owner)+'\n');}finally{fs.closeSync(fd);}}
export function releaseOwn(file,owner){
 if(!owner||!fs.existsSync(file))return false;
 let current;try{current=JSON.parse(fs.readFileSync(file,'utf8'));}catch{return false;}
 if(!isDeepStrictEqual(current,owner))return false;fs.unlinkSync(file);return true;
}
function releaseGuard(file,owner){
 let current;try{current=JSON.parse(fs.readFileSync(file,'utf8'));}catch{return false;}
 if(current.pid!==owner.pid||current.token!==owner.token||current.role!=='admission')return false;fs.unlinkSync(file);return true;
}
function threshold(peer){return {availableCommitBytes:(peer?8:4)*GiB,availablePhysicalBytes:peer?6*GiB:0};}
function sufficient(memory,minimum){return Number.isFinite(memory.availableCommitBytes)&&Number.isFinite(memory.availablePhysicalBytes)&&memory.availableCommitBytes>=minimum.availableCommitBytes&&memory.availablePhysicalBytes>=minimum.availablePhysicalBytes;}
export async function tryGpuAdmission({ownFile,peerFile,guardFile,action,stage,probe}){
 const guard={pid:process.pid,role:'admission',token:randomUUID(),action,createdAt:new Date().toISOString()};
 try{writeExclusive(guardFile,guard);}catch(error){
  if(error.code!=='EEXIST')throw error;const existing=inspect(guardFile,'admission');return {admitted:false,wait:{reason:existing.state==='alive'?'awaiting-resource-admission':'awaiting-admission-lock-inspection',lock:guardFile,...existing}};
 }
 let owner;
 try{
  const own=inspect(ownFile,'gpu');if(own.state!=='missing')return {admitted:false,wait:{reason:own.state==='alive'?'awaiting-gpu-role-slot':'awaiting-gpu-lock-inspection',lock:ownFile,...own}};
  const peer=inspect(peerFile,'cpu');if(!['missing','alive'].includes(peer.state))return {admitted:false,wait:{reason:'awaiting-cpu-lock-inspection',lock:peerFile,...peer}};
  const minimum=threshold(peer.state==='alive'),memory=await probe();
  if(!sufficient(memory,minimum))return {admitted:false,memory,wait:{reason:'available-memory-below-admission-threshold',peer:peer.owner||null,minimum,...memory}};
  owner={pid:process.pid,role:'gpu',token:randomUUID(),action,stage,createdAt:new Date().toISOString()};
  try{writeExclusive(ownFile,owner);}catch(error){if(error.code==='EEXIST')return {admitted:false,wait:{reason:'awaiting-gpu-role-slot',lock:ownFile,...inspect(ownFile,'gpu')}};throw error;}
  const after=await probe();if(!sufficient(after,minimum)){releaseOwn(ownFile,owner);owner=undefined;return {admitted:false,memory:after,wait:{reason:'available-memory-dropped-during-admission',peer:peer.owner||null,minimum,...after}};}
  return {admitted:true,owner,memory:after,peer:peer.owner||null,minimum};
 }catch(error){if(owner)releaseOwn(ownFile,owner);throw error;}
 finally{releaseGuard(guardFile,guard);}
}
