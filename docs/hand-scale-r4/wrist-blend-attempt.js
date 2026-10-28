// hands-native r7 page runtime: soft colour transition across the wrist seam. The long-sleeve paint (top colour on arm-weighted
// pixels) is extended over the first few mm of the hand and faded out to skin by ~24 mm past the wrist weld plane, so the sleeve
// no longer ends in a hard light/dark break. Shader-only (geometry/weights untouched); injected by native-open-r1 for 1.0.0-r7 only.
(function(){
 const E=window.__drill,v=flareInspector.viewer;if(!E||E.__wristBlendR7)return;
 const OLD='float g=smoothstep(0.0,0.05,vV2p.w);';
 const NEW='vec4 r7pl=vV2p.x>0.0?uV2pWristL:uV2pWristR; float r7d=abs(dot(vV2p.xyz,r7pl.xyz)-r7pl.w);'+
  ' float r7n=1.0-smoothstep(0.07,0.09,distance(vV2p.xyz,vec3(sign(vV2p.x)*0.2525,0.8916,0.0295)));'+
  ' float g=max(smoothstep(0.0,0.05,vV2p.w),(1.0-smoothstep(0.004,0.024,r7d))*r7n);';
 const patch=m=>{const ob=m.onBeforeCompile;if(!ob||ob.__r7)return;
  const hook=function(sh,r){ob.call(this,sh,r);if(sh.fragmentShader.includes(OLD))sh.fragmentShader=sh.fragmentShader.replace(OLD,NEW);};hook.__r7=true;
  const key=m.customProgramCacheKey;m.onBeforeCompile=hook;m.customProgramCacheKey=function(){return (key?key.call(this):'')+'|r7wb';};m.needsUpdate=true;};
 const R=v.renderer,render=R.render.bind(R);
 R.render=function(scene,camera){scene.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(patch);});return render(scene,camera);};
 E.__wristBlendR7=true;
})();
