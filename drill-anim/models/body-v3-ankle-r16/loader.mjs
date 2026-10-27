// Experimental ankle shading: preserve the established compression back-face
// protection, but feather its front-facing normal-mismatch override locally.
// No model geometry, skin weights, action, skin color or highlight mask edits.
import * as base from '../body-v3-ankle-r13/loader.mjs';
export const PROFILE='body-v3-ankle-r16-experimental',VERSION='0.0.0-r16';
export const {boot}=base;
export async function applyV3(page,spec,options={}){
 const original=await base.applyV3(page,spec,options);
 const result=await page.evaluate(()=>{
  const body=flareInspector.viewer.coach.getObjectByName('Coach_Body');
  if(!body?.isSkinnedMesh||Array.isArray(body.material))throw Error('r16 expects one Coach_Body material');
  const prior=body.material,hook=prior.onBeforeCompile,key=prior.customProgramCacheKey(),material=prior.clone();
  material.onBeforeCompile=function(shader,renderer){
   hook.call(this,shader,renderer);
   const marker='if(uV2pOut>0.5){ vec3 fN=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition))); if(!gl_FrontFacing||(abs(dot(fN,V))>0.45&&dot(Nn,V)<0.15)){ lit=shc*0.8; fr=0.0; } }';
   if(!shader.fragmentShader.includes('vV2p')||!shader.fragmentShader.includes(marker))throw Error('r16 expected compression shading branch is absent');
   shader.fragmentShader=shader.fragmentShader.replace(marker,`
    float r16x=abs(vV2p.x);
    float r16ankle=smoothstep(0.060,0.070,vV2p.y)*(1.0-smoothstep(0.155,0.165,vV2p.y))*step(0.020,r16x)*(1.0-step(0.160,r16x));
    if(uV2pOut>0.5){ vec3 fN=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition)));
      if(!gl_FrontFacing){lit=shc*0.8;fr=0.0;}
      else if(abs(dot(fN,V))>0.45&&dot(Nn,V)<0.15){lit=mix(shc*0.8,lit,r16ankle);fr*=r16ankle;}
    }
   `);
  };
  material.customProgramCacheKey=()=>key+'|ankle-frontshade-r16';material.needsUpdate=true;body.material=material;
  return {kind:'front-face-only local shading exception',restHeightM:[.060,.165]};
 });
 return {profile:PROFILE,version:VERSION,base:original,ankleShade:result};
}
