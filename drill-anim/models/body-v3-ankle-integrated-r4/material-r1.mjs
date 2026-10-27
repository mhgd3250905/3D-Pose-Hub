// The r13/r16 skin and r17 shoe material changes without invoking V3 init.
// This is a new integration candidate and must be compared against r17.
export async function installAnkleMaterials(page){
 return page.evaluate(()=>{
  const T=window.__toonT,v=window.flareInspector.viewer,body=v.coach.getObjectByName('Coach_Body');
  if(!body?.isSkinnedMesh||!body.material||Array.isArray(body.material))throw Error('ankle integrated r1 requires one body material');
  const old=body.material,oldHook=old.onBeforeCompile,oldKey=old.customProgramCacheKey();
  if(!String(oldKey).includes('v2p')||typeof oldHook!=='function')throw Error('ankle integrated r1 needs original v2plus material');
  const rim=old.clone();rim.onBeforeCompile=function(shader,renderer){oldHook.call(this,shader,renderer);
   const marker='lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d)*vRimK;';
   if(!shader.fragmentShader.includes('vV2p')||!shader.fragmentShader.includes(marker))throw Error('r13 missing expected rest position or rim shader hook');
   shader.fragmentShader=shader.fragmentShader.replace(marker,`
    float r13x=abs(vV2p.x);
    float r13ankle=smoothstep(0.060,0.070,vV2p.y)*(1.0-smoothstep(0.155,0.165,vV2p.y))*step(0.020,r13x)*(1.0-step(0.160,r13x));
    lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d)*vRimK*(1.0-r13ankle);
   `);
  };rim.customProgramCacheKey=()=>oldKey+'|ankle-rim-r13';rim.needsUpdate=true;
  const rimHook=rim.onBeforeCompile,rimKey=rim.customProgramCacheKey(),shade=rim.clone();
  shade.onBeforeCompile=function(shader,renderer){rimHook.call(this,shader,renderer);
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
  };shade.customProgramCacheKey=()=>rimKey+'|ankle-frontshade-r16';shade.needsUpdate=true;
  const staged=[];
  for(const name of ['Coach_Sneakers','Coach_Shoe_Details']){
   const mesh=v.coach.getObjectByName(name);if(!mesh?.isSkinnedMesh||!mesh.material||Array.isArray(mesh.material))throw Error('unexpected shoe material '+name);
   const previous=mesh.material,hook=previous.onBeforeCompile,key=previous.customProgramCacheKey();
   if(previous.side!==T.FrontSide||typeof hook!=='function')throw Error('unexpected shoe shader '+name);
   const material=previous.clone();material.side=T.DoubleSide;material.onBeforeCompile=function(sh,r){hook.call(this,sh,r);};material.customProgramCacheKey=()=>key+'|ankle-shoe-inner-r17-'+name;material.needsUpdate=true;
   staged.push({mesh,material,name,key:material.customProgramCacheKey()});
  }
  body.material=shade;for(const x of staged)x.mesh.material=x.material;
  return {bodyKey:shade.customProgramCacheKey(),shoes:staged.map(({name,key,material})=>({name,key,side:material.side}))};
 });
}
