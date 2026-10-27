// Experimental r17: r16 ankle shading + visible inner shoe-shell surfaces.
// Only Coach_Sneakers and Coach_Shoe_Details receive cloned double-sided
// materials; geometry, skin weights, bone rig, actions, and skin materials
// are unchanged. This remains a review candidate, not a release model.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as base from '../body-v3-ankle-r16/loader.mjs';

export const PROFILE='body-v3-ankle-r17-experimental',VERSION='0.0.0-r17';
export const {boot}=base;
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export function verify(){
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('unsupported ankle r17 manifest');
 for(const [rel,expected] of Object.entries(manifest.sourceSha256)){
  const data=fs.readFileSync(path.join(repo,rel));
  const content=manifest.binarySources.includes(rel)?data:Buffer.from(data.toString('utf8').replaceAll('\r\n','\n'));
  if(crypto.createHash('sha256').update(content).digest('hex')!==expected)throw Error('ankle r17 source SHA mismatch: '+rel);
 }
 return manifest;
}
export async function applyV3(page,spec,options={}){
 verify();const original=await base.applyV3(page,spec,options);
 const shoes=await page.evaluate(()=>{
  const T=window.__toonT,v=window.flareInspector.viewer,names=['Coach_Sneakers','Coach_Shoe_Details'],report=[];
  for(const name of names){
   const mesh=v.coach.getObjectByName(name);
   if(!mesh?.isSkinnedMesh||!mesh.material||Array.isArray(mesh.material))throw Error('r17 unexpected shoe mesh/material: '+name);
   const previous=mesh.material,originalSide=previous.side,hook=previous.onBeforeCompile,key=previous.customProgramCacheKey();
   if(originalSide!==T.FrontSide||typeof hook!=='function')throw Error('r17 unexpected original shoe material: '+name);
   const material=previous.clone();material.side=T.DoubleSide;
   material.onBeforeCompile=function(shader,renderer){hook.call(this,shader,renderer);};
   material.customProgramCacheKey=()=>key+'|ankle-shoe-inner-r17-'+name;
   material.needsUpdate=true;mesh.material=material;
   report.push({name,originalSide,side:material.side,previousKey:key,cacheKey:material.customProgramCacheKey()});
  }
  return report;
 });
 return {profile:PROFILE,version:VERSION,base:original,shoeInner:shoes};
}
