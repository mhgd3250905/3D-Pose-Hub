// Experimental unified v3 P2/P3 entry; source models remain untouched.
import * as headNeck from '../training-human-v3-head-neck-r2/loader.mjs';
import * as collar from '../collar-weld-r25/loader.mjs';
import * as garment from '../collar-garment-refine-r5/loader.mjs';
import {verify} from './verify.mjs';
export {boot} from '../training-human-v3-head-neck-r2/loader.mjs';
export {verify} from './verify.mjs';
export const PROFILE='training-human-v3-collar', VERSION='1.0.0-r1';

export async function applyV3(page,spec,options={}){
 await verify();
 if(spec?.v2plus?.torso!=='base')throw Error('training-human-v3-collar-r1: initial torso must be base');
 let fragmentAttached=false,collarAttached=false,garmentAttached=false;
 try{
  const result=await headNeck.applyV3(page,spec,options);fragmentAttached=true;
  const seam=await collar.applyCollarShared(page);collarAttached=true;
  const lining=await garment.applyGarmentRefinement(page);garmentAttached=true;
  return {...result,collar:seam,lining,collarProfile:PROFILE,collarVersion:VERSION};
 }catch(error){
  if(garmentAttached)await garment.detachGarmentRefinement(page);
  if(collarAttached)await collar.detachCollarShared(page);
  if(fragmentAttached)await headNeck.detach(page);
  throw error;
 }
}
export async function detach(page){
 await garment.detachGarmentRefinement(page);
 await collar.detachCollarShared(page);
 return headNeck.detach(page);
}
