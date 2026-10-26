// native-open-r2: opt-in successor of native-open-r1 for NEW specs on the fixed native-hand r3 / native-grip r1 models.
// native-open-r1 (and every SHA-pinned source it loads) is not modified; specs rendered through r1 are unchanged.
// A spec selects r2 explicitly with nativeOpen:{entry:'native-open-r2'} in addition to r1's profile + version fields.
// r2 adds, in models/native-open-r2/runtime.js (page side, runtime wrappers only):
//  - palm-floor contact on the native hand's own palmar plane (floor hands: H.mode 'floor');
//  - optional spec.neck = {flex, side, rot} neck channels (degrees or timeline tracks). Absent = untouched.
// Output is a candidate only: reviewed=false, releaseEligible=false.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkSpec as checkR1,verifyOpen as verifyR1,applyNativeOpen as applyR1} from '../native-open-r1/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export const ENTRY='native-open-r2';
const NECK_KEYS=['flex','side','rot'];
export function checkSpec(spec){
 const s=checkR1(spec);
 if(spec.nativeOpen?.entry!==ENTRY)throw Error(`native-open-r2: spec must opt in with nativeOpen:{entry:'${ENTRY}'}`);
 if(spec.neck!==undefined){
  if(!spec.neck||typeof spec.neck!=='object'||Array.isArray(spec.neck))throw Error('native-open-r2: neck must be an object {flex, side, rot}');
  for(const k of Object.keys(spec.neck))if(!NECK_KEYS.includes(k))throw Error(`native-open-r2: unknown neck channel '${k}' (use ${NECK_KEYS.join(', ')})`);
  for(const k of NECK_KEYS){const c=spec.neck[k];if(c===undefined||typeof c==='number')continue;
   const track=typeof c==='string'?c:c?.track;
   if(typeof track!=='string'||!spec.timeline?.tracks?.[track])throw Error(`native-open-r2: neck.${k} must be degrees, a timeline track name or {track, scale, offset}`);}
 }
 return s;
}
export function verifyOpen(spec){checkSpec(spec);return verifyR1(spec);}
export async function applyNativeOpen(p,spec,opts={}){
 checkSpec(spec);
 const manifest=await applyR1(p,spec);
 await p.addScriptTag({content:fs.readFileSync(path.join(here,'runtime.js'),'utf8')});
 const rig=JSON.parse(fs.readFileSync(path.resolve(here,'../hands-native-r3/hands-rig.json'),'utf8'));
 const report=await p.evaluate(([s,o])=>__installNativeOpenR2(s,o),[spec,{...opts,rig:{fingers:rig.fingers}}]);
 console.log('[native-open-r2]',JSON.stringify(report));
 return {...manifest,nativeOpenR2:report};
}
