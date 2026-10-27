// Experimental composition of completed P2/P3/L1/L2 only.
// Boot and apply the base v3 model exactly once per page.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import * as baseNormals from '../training-human-v3-normals-r1/loader.mjs';
import * as normals from '../training-human-v3-normals-r3/loader.mjs';
import * as wrist from '../training-human-v3-wrist-r1/loader.mjs';
import * as headNeck from '../training-human-v3-head-neck-r2/loader.mjs';
import * as collar from '../collar-weld-r26/loader.mjs';
import * as garment from '../collar-garment-refine-r7/loader.mjs';
import * as sync from '../completed-profile-normal-sync-r4/loader.mjs';
import {verify} from './verify.mjs';
export {verify} from './verify.mjs';
export const PROFILE='training-human-v3-completed',VERSION='1.0.0-r4';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>fs.readFileSync(path.join(repo,p),'utf8');
const full=spec=>['torso','limbs','hands'].every(name=>spec?.v2plus?.[name]==='base');

export async function boot(options){await verify();return baseNormals.boot(options);}
export async function applyV3(page,spec,options={}){
 await verify();
 if(!full(spec))throw Error('completed v3: initial torso, limbs and hands must be base');
 if(spec?.v2plus?.head)throw Error('completed v3: alternative head unsupported');
 if((options.handDir??'hands-native-c1r2')!=='hands-native-c1r2')throw Error('completed v3: c1r2 hands required');
 const before=await page.evaluate(()=>({baseNormals:!!flareInspector.viewer.__bodyV3ArmNormalsR1,fragment:!!window.__v3HeadNeckFragment,collar:!!window.__collarShared,garment:!!window.__collarGarmentRefinement,piece:!!window.__v2p?.__pieceNormalsR1,wrist:!!window.__v2p?.hands?.mesh?.material?.userData?.bodyV3WristGradientR2,completed:!!window.__completedV3R4}));
 if(!before.baseNormals||before.fragment||before.collar||before.garment||before.piece||before.wrist||before.completed)throw Error('completed v3: page is not a fresh normals-r1 boot '+JSON.stringify(before));
 let fragment=false,bridge=false,lining=false,normalSync=false,wristAttempted=false,pieceAttempted=false;
 try{
  const result=await headNeck.applyV3(page,spec,{...options,handDir:'hands-native-c1r2'});fragment=true;
  await page.addScriptTag({content:read('tools/body-v3/wrist-gradient-r2.js')});wristAttempted=true;
  const wristResult=await page.evaluate(()=>window.__installBodyV3WristGradientR2());
  const seams=Object.fromEntries([['torso','training-human-v2plus-torso-base.json'],['limbs','training-human-v2plus-limbs-base.json'],['hands','hands-native-c1r2/hands-base.json']].map(([key,file])=>[key,JSON.parse(read('drill-anim/models/'+file)).seam]));
  await page.addScriptTag({content:read('tools/body-v3/piece-normals-r1.js')});pieceAttempted=true;
  const pieceNormals=await page.evaluate(data=>window.__fixBodyV3PieceNormalsR1(data),seams);
  const collarResult=await collar.applyCollarShared(page);bridge=true;
  const garmentResult=await garment.applyGarmentRefinement(page);lining=true;
  const syncResult=await sync.install(page);normalSync=true;
  await page.evaluate(()=>{window.__completedV3R4={geometryAttached:true,permanent:['base-arm-normals','piece-normals','wrist-material-hook']};});
  return {...result,profile:PROFILE,version:VERSION,wrist:wristResult,pieceNormals,collar:collarResult,garment:garmentResult,normalSync:syncResult,lifecycle:'base and piece normals and wrist hook persist for page lifetime'};
 }catch(cause){
  const cleaned=[];
  if(normalSync){await sync.detach(page);cleaned.push('normal-sync');}
  if(lining){await garment.detachGarmentRefinement(page);cleaned.push('garment');}
  if(bridge){await collar.detachCollarShared(page);cleaned.push('collar');}
  if(fragment){await headNeck.detach(page);cleaned.push('head-neck');}
  throw new Error('completed v3 setup failed; geometry layers restored: '+cleaned.join(',')+'; base normals persist, wrist/piece may remain if attempted: '+JSON.stringify({wristAttempted,pieceAttempted}),{cause});
 }
}

// Deliberately not called "detach": the normal buffers and wrist/piece hooks
// are permanent for this page. Do not initialize this candidate a second time.
export async function detachGeometryLayers(page){
 const state=await page.evaluate(()=>window.__completedV3R4?.geometryAttached===true);
 if(!state)return {removed:false,retained:['base-arm-normals','piece-normals','wrist-material-hook']};
 await sync.detach(page);await garment.detachGarmentRefinement(page);await collar.detachCollarShared(page);await headNeck.detach(page);
 await page.evaluate(()=>{window.__completedV3R4.geometryAttached=false;});
 return {removed:true,retained:['base-arm-normals','piece-normals','wrist-material-hook'],reuse:'new page required for a fresh initialization'};
}
