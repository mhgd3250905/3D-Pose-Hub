// Experimental composition of the locked P2 and wrist candidates. The P2
// loader owns v3 initialization; install only the wrist material hook after it
// so the base model and skeleton are not initialized twice.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as neck from '../training-human-v3-head-neck-r2/loader.mjs';
import * as wrist from '../training-human-v3-wrist-r1/loader.mjs';
export { boot } from '../training-human-v3-head-neck-r2/loader.mjs';
export { RESET_JOINTS, warpBase } from '../training-human-v3/loader.mjs';
export const PROFILE = 'training-human-v3-wrist-head-neck', VERSION = '1.0.0-r2';
const here=path.dirname(fileURLToPath(import.meta.url)), repo=path.resolve(here,'../../..');
const patch='tools/body-v3/wrist-gradient-r2.js';
export async function verify() {
  const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
  if (manifest.id!==PROFILE || manifest.version!==VERSION || manifest.hashPolicy!=='utf8-crlf-to-lf-text; binary-raw') throw new Error('unsupported combined manifest');
  for (const [relative,expected] of Object.entries(manifest.sha256)) {
    const target=path.resolve(repo,relative); if(!target.startsWith(repo+path.sep)) throw new Error('invalid source path');
    const bytes=fs.readFileSync(target), data=relative.endsWith('.glb')?bytes:Buffer.from(new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/\r\n/g,'\n'),'utf8');
    if(crypto.createHash('sha256').update(data).digest('hex')!==expected) throw new Error('combined candidate SHA mismatch: '+relative);
  }
  const headNeck=await neck.verify(), wristManifest=wrist.verify();
  return {id:PROFILE,version:VERSION,status:manifest.status,headNeck,wrist:wristManifest.version};
}
export async function applyV3(page,spec,options={}) {
  await verify();
  if(spec?.v2plus?.head) throw new Error('combined candidate: alternative head is unsupported');
  if((options.handDir??'hands-native-c1r2')!=='hands-native-c1r2') throw new Error('combined candidate requires hands-native-c1r2');
  const already=await page.evaluate(()=>({fragment:!!window.__v3HeadNeckFragment,wrist:!!(window.__v2p?.hands?.mesh?.material?.userData?.bodyV3WristGradientR1||window.__v2p?.hands?.mesh?.material?.userData?.bodyV3WristGradientR2)}));
  if(already.fragment||already.wrist) throw new Error('combined candidate: fragment or wrist patch already installed');
  // head-neck-r2 selects a profile and resets the motion as part of setup.
  const result=await neck.applyV3(page,spec,{...options,handDir:'hands-native-c1r2'});
  await page.addScriptTag({content:fs.readFileSync(path.join(repo,patch),'utf8')});
  const wristResult=await page.evaluate(()=>window.__installBodyV3WristGradientR2());
  return {...result,profile:PROFILE,version:VERSION,wrist:wristResult};
}
// This only removes the head-neck fragment; the wrist material hook remains.
export const detachHeadNeck = neck.detach;
