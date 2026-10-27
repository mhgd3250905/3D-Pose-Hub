// Experimental r13: local attenuation of skin rim light around the r8 ankle.
// Preserves the base colors and the muscle-highlight computation. No geometry,
// action, skeleton, or skin-weight changes. Visual QA remains outstanding.
import * as base from '../body-v3-ankle-r8/loader.mjs';
export const PROFILE='body-v3-ankle-r13-experimental',VERSION='0.0.0-r13';
export const {boot}=base;
export async function applyV3(page,spec,options={}){
 const original=await base.applyV3(page,spec,options);
 const result=await page.evaluate(()=>{
  const body=flareInspector.viewer.coach.getObjectByName('Coach_Body');
  if(!body?.isSkinnedMesh||Array.isArray(body.material))throw Error('r13 expects one Coach_Body material');
  const prior=body.material,hook=prior.onBeforeCompile,key=prior.customProgramCacheKey();
  if(!String(key).includes('v2p'))throw Error('r13 expects the v2plus toon material');
  const material=prior.clone();
  material.onBeforeCompile=function(shader,renderer){
   hook.call(this,shader,renderer);
   const marker='lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d)*vRimK;';
   if(!shader.fragmentShader.includes('vV2p')||!shader.fragmentShader.includes(marker))throw Error('r13 missing expected rest position or rim shader hook');
   shader.fragmentShader=shader.fragmentShader.replace(marker,`
    float r13x=abs(vV2p.x);
    float r13ankle=smoothstep(0.060,0.070,vV2p.y)*(1.0-smoothstep(0.155,0.165,vV2p.y))*step(0.020,r13x)*(1.0-step(0.160,r13x));
    lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d)*vRimK*(1.0-r13ankle);
   `);
  };
  material.customProgramCacheKey=()=>key+'|ankle-rim-r13';material.needsUpdate=true;body.material=material;
  return {kind:'local ankle rim attenuation only',restHeightM:[.060,.165],shaderKey:material.customProgramCacheKey()};
 });
 return {profile:PROFILE,version:VERSION,base:original,ankleRim:result};
}
