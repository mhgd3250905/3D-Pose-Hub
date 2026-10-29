// Opt-in surface overlay. Keep body alpha/depth opaque; reveal original shading
// through the highlight layer instead of revealing the far side of the body.
export function installHighlightMaterial(options) {
  const anchor='lit=mix(lit,cyl,d*0.94);';
  const uniforms={uReviewHiOpacity:{value:options.opacity},uReviewHiEmission:{value:options.emission},uReviewHiFresnel:{value:options.fresnel}};
  const state={version:'translucent-glow-r1',params:{...options},patched:0,compiled:0,skipped:0};
  const seen=new Set();
  flareInspector.viewer.coach.traverse(object=>{
    for(const material of [object.material].flat().filter(Boolean)){
      if(seen.has(material)||!material.isMeshToonMaterial)continue;
      seen.add(material);
      const previous=material.onBeforeCompile,cache=material.customProgramCacheKey;
      material.onBeforeCompile=function(shader,renderer){
        previous.call(this,shader,renderer);
        if(!shader.fragmentShader.includes(anchor)){state.skipped++;return;}
        Object.assign(shader.uniforms,uniforms);
        shader.fragmentShader='uniform float uReviewHiOpacity;uniform float uReviewHiEmission;uniform float uReviewHiFresnel;\n'+shader.fragmentShader.replace(anchor,`
          lit=mix(lit,cyl,d*uReviewHiOpacity);
          float reviewEdge=pow(1.0-clamp(dot(Nn,V),0.0,1.0),2.0);
          lit+=cy*d*(uReviewHiEmission+uReviewHiFresnel*reviewEdge)*(0.90+0.20*uPulse);
        `);
        state.compiled++;
      };
      const oldKey=cache.call(material);
      material.customProgramCacheKey=()=>oldKey+'-review-translucent-glow-r1';
      material.needsUpdate=true;state.patched++;
    }
  });
  if(!state.patched)throw Error('No toon materials available for highlight overlay');
  window.__reviewHighlightMaterial=state;
  return {...state,bodyAlpha:'opaque',layer:'surface-color-blend-plus-emission'};
}
