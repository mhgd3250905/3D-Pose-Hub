// Experimental adapter for the knee layer's one existing render extension.
// No second renderer wrapper; teardown precedes knee/P5 detach.
(function(){
 window.__attachHipKneeExtensionR1=async function(mask){
  const knee=window.__kneeNormalCandidateR2,v=window.flareInspector?.viewer;if(!knee?.registerBeforeRenderExtension||!v?.renderer||window.__hipKneeExtensionR1)throw Error('hip extension: knee not active or already attached');
  const hip=window.__installHipNormalR1(mask),name='hip-normal-r1',update=(scene,camera)=>hip.update(scene,camera);let registered=false;
  try{
   knee.registerBeforeRenderExtension(name,update);registered=true;window.__hipKneeExtensionR1={name,update,hip,knee};
   // Resolve actual material shader/uniforms before the first corrected draw.
   await v.renderer.compileAsync(v.scene,v.camera);if(!hip.shader)throw Error('hip extension: slot2 shader not compiled');const initial=hip.update(v.scene,v.camera);if(initial.skipped)throw Error('hip extension: initial normal unavailable: '+initial.skipped);
   return {name,initial,shaderReady:true,knee:knee.report()};
  }catch(e){if(registered)knee.unregisterBeforeRenderExtension(name,update);try{hip.detach();}catch{}delete window.__hipKneeExtensionR1;throw e;}
 };
 window.__detachHipKneeExtensionR1=function(){const x=window.__hipKneeExtensionR1;if(!x||window.__kneeNormalCandidateR2!==x.knee||window.__hipNormalR1!==x.hip)throw Error('hip extension: active owner changed');x.knee.unregisterBeforeRenderExtension(x.name,x.update);const removed=x.hip.detach();delete window.__hipKneeExtensionR1;return {removed,remaining:x.knee.report().extensions};};
})();
