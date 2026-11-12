import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readApproved,checkRecipe} from './preview-current-model.mjs';
const {pointer,approved}=readApproved();
for(const [action,adapter,pose] of [['h-squat','symmetric-native','relaxed'],['h-db-curl','webxr-dumbbell-wrist-r1',null],['h-catcow-quad','symmetric-native','palm-floor']]){
 const {version}=await checkRecipe(`catalog/production/remaining219-r1/recipes/${action}.json`);
 assert.equal(version.model.profile,'training-human-v3-armfix');assert.equal(version.model.version,'0.1.0-r2');
 assert.equal(version.hands.adapter,adapter);if(pose)assert.equal(version.hands.poses.left,pose);
}
await assert.rejects(checkRecipe('drill-anim/specs/h-squat-r2-sc1-kn1.js'),/explicit recipe JSON/);
const base=path.resolve(ROOT,'output');fs.mkdirSync(base,{recursive:true});
const temp=fs.mkdtempSync(path.join(base,'approved-look-guard-'));
try{
 for(const rel of ['drill-anim/models/current-approved-look.json',pointer.record,...Object.keys(approved.pinnedSources)]){
  const dst=path.join(temp,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(ROOT,rel),dst);
 }
 assert.equal(readApproved(temp).approved.id,approved.id);
 const runtime=path.join(temp,'tools/eye-socket-soften-r1/runtime.js');fs.appendFileSync(runtime,'\n// accidental drift\n');
 assert.throws(()=>readApproved(temp),/Approved source drift/);
 fs.unlinkSync(runtime);assert.throws(()=>readApproved(temp),/Stale checkout/);
}finally{
 const resolved=path.resolve(temp);if(!resolved.startsWith(base+path.sep+'approved-look-guard-'))throw Error('Unexpected test cleanup target');
 fs.rmSync(resolved,{recursive:true});
}
console.log('PASS: approved source pins, 3 scene hand routes, raw-spec refusal, drift refusal, stale-checkout refusal');
