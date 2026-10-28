// Independent armfix appearance candidate. Frozen r1 and original r7 remain unchanged.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import * as base from './base.mjs';
import * as ankle from '../body-v3-ankle-integrated-r4/install.mjs';
import * as collar from './collar.mjs';
import * as garment from '../collar-garment-refine-r7/loader.mjs';
import * as normalSync from './normal-sync.mjs';
import {HAND_SOURCE} from './recipe.mjs';
import {verify,PROFILE,VERSION} from './verify.mjs';
export {verify,PROFILE,VERSION} from './verify.mjs';
export {RESET_JOINTS,warpBase,checkSpec} from './base.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=f=>fs.readFileSync(path.join(repo,f),'utf8');
const json=f=>JSON.parse(read(f));
export async function boot(options){
 await verify();const result=await base.boot(options);
 try{await result.p.addScriptTag({content:read('tools/body-v3/arm-normals-r1.js')});
  result.appearanceBase=await result.p.evaluate(()=>window.__fixBodyV3ArmNormalsR1());return result;
 }catch(error){await result.b.close();throw error;}
}
export async function applyV3(page,spec,options={}){
 await verify();const result=await base.applyV3(page,spec,options);
 try{
  await page.evaluate(s=>{const V=window.__v2p;if(!flareInspector.viewer.__bodyV3ArmNormalsR1)throw Error('armfix-r2 requires its own boot before apply');
   __drill.selectModelProfile({...s,v2plus:{}});if(V.torso.on||V.limbs.on||V.hands.on)throw Error('armfix-r2 pieces remain active');if(V.on)V.enable(false);flareInspector.viewer.motion.reset();},spec);
  const p1=await ankle.install(page);
  await page.evaluate(s=>{__drill.selectModelProfile(s);flareInspector.viewer.motion.reset();},spec);
  await page.addScriptTag({content:read('tools/body-v3/piece-normals-r1.js')});
  const seams={torso:json('drill-anim/models/training-human-v2plus-torso-base.json').seam,limbs:json('drill-anim/models/training-human-v2plus-limbs-base.json').seam,hands:json('drill-anim/models/hands-native-c1r2-symmetric-r1/hands-base.json').seam};
  const l2=await page.evaluate(s=>window.__fixBodyV3PieceNormalsR1(s),seams);
  const p3=await collar.applyCollarShared(page),cloth=await garment.applyGarmentRefinement(page),sync=await normalSync.install(page);
  const retained=['independent short-arm proportions/symmetric hands/P2 head-neck/L1 wrist','P1 ankle geometry and seamless replacement limbs','L2 geometry-derived base and replacement normals','P3 shared collar topology and garment refinement','profile/garment normal synchronization'];
  await page.evaluate(handAsset=>{window.__armfixR2={profile:'training-human-v3-armfix',version:'0.1.0-r2',stage:'P1-P3-L2',handScale:1,handAsset};window.__armfixR2Init.phase='ready';},HAND_SOURCE);
  return {...result,baseProfile:result.profile,baseVersion:result.version,profile:PROFILE,version:VERSION,p1,l2,p3,cloth,sync,retained,
   notMigrated:['P4 hip/knee live normals','P5 shoulder corrective','r5 contact/neck calibration'],
   scope:'Incremental appearance candidate; fresh GPU/pose validation required. Production acceptance remains pending.'};
 }catch(cause){await page.evaluate(()=>{window.__armfixR2Init.phase='failed';}).catch(()=>{});throw new Error('armfix-r2 appearance setup failed; discard page',{cause});}
}
export async function detachGeometryLayers(page){
 const sync=await normalSync.detach(page),cloth=await garment.detachGarmentRefinement(page),p3=await collar.detachCollarShared(page);
 return {sync,cloth,p3,lifecycle:'Persistent P1/L1/L2 and independent r2 base remain. Discard page before another installation.'};
}
