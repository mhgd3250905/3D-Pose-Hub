/* Runtime-only package layer + skin adapter for v3 recipe scenes. No model source changes.
 * pass 0 body            : highlight forced off (d=0), skin applied, straight alpha
 * pass 1 mask            : highlighted coverage d as grayscale; everything else black (keeps depth)
 * pass 2 body-highlight  : the recipe's own highlight look (incl. translucent-glow material), skin applied
 * Skins are material-only: a luminance ramp + rim on the body materials. They never touch
 * geometry, pose, camera or props, so one pose solve serves every skin.
 */
(() => {
  const T=__toonT,v=flareInspector.viewer;
  const U={uPkgPass:{value:0},uPkgSkin:{value:0},uPkgDark:{value:new T.Color(0,0,0)},uPkgLight:{value:new T.Color(1,1,1)},
    uPkgRim:{value:new T.Color(0,0,0)},uPkgRimPow:{value:2},uPkgLo:{value:0},uPkgHi:{value:1},uPkgMix:{value:1},uPkgGamma:{value:1}};
  const needle='lit=mix(lit,cyl,d*';
  const done=new WeakSet(),state={patched:0,withHighlight:0,compiledBody:0,compiledOther:0};
  const isCoach=o=>{for(let q=o;q;q=q.parent)if(q===v.coach)return true;return false;};
  function patch(){
    v.scene.traverse(o=>{
      if(!o.isMesh||!o.material||o===v.shadowCatcher)return;
      const skinnable=isCoach(o);
      for(const m of [o.material].flat()){
        if(done.has(m))continue;done.add(m);state.patched++;
        const prev=m.onBeforeCompile,key=m.customProgramCacheKey;
        m.onBeforeCompile=function(sh,renderer){
          prev?.call(this,sh,renderer);
          if(sh.fragmentShader.includes('uniform float uPkgPass;'))return;
          Object.assign(sh.uniforms,U);
          let f='uniform float uPkgPass;uniform float uPkgSkin;uniform vec3 uPkgDark;uniform vec3 uPkgLight;uniform vec3 uPkgRim;uniform float uPkgRimPow;uniform float uPkgLo;uniform float uPkgHi;uniform float uPkgMix;uniform float uPkgGamma;\nfloat pkgMask=0.0;\n'+sh.fragmentShader;
          const hasHi=f.includes(needle);
          if(hasHi){f=f.replace(needle,'pkgMask=d; if(uPkgPass<0.5) d=0.0; '+needle);state.compiledBody++;}else state.compiledOther++;
          const skin=skinnable?`
  if(uPkgSkin>0.5&&uPkgPass!=1.0){
    vec3 pkgC=gl_FragColor.rgb;float pkgL=pow(clamp(dot(pkgC,vec3(0.299,0.587,0.114)),0.0,1.0),uPkgGamma);
    vec3 pkgS=mix(uPkgDark,uPkgLight,smoothstep(uPkgLo,uPkgHi,pkgL));
    #ifndef FLAT_SHADED
    float pkgEdge=pow(1.0-clamp(abs(dot(normalize(vNormal),normalize(vViewPosition))),0.0,1.0),uPkgRimPow);pkgS+=uPkgRim*pkgEdge;
    #endif
    if(uPkgPass>1.5)pkgS=mix(pkgS,pkgC,clamp(pkgMask,0.0,1.0));
    gl_FragColor.rgb=mix(pkgC,pkgS,uPkgMix);
  }`:'';
          f=f.replace(/}\s*$/,`${skin}
  if(uPkgPass>0.5&&uPkgPass<1.5) gl_FragColor=vec4(vec3(${hasHi?'pkgMask':'0.0'}),1.0);
}`);
          sh.fragmentShader=f;
        };
        if(m.__v2prHook===prev)m.__v2prHook=m.onBeforeCompile;
        m.customProgramCacheKey=()=>(key?key.call(m):'')+'|pkg-v3-layers'+(skinnable?'-skin':'');
        m.needsUpdate=true;
      }
    });
    return {...state};
  }
  function setSkin(s){
    if(!s||s.mode==='native'){U.uPkgSkin.value=0;return;}
    if(s.mode!=='luma-ramp')throw Error('Unsupported skin mode '+s.mode);
    U.uPkgSkin.value=1;U.uPkgDark.value.set(s.dark);U.uPkgLight.value.set(s.light);U.uPkgRim.value.set(s.rim?.color??'#000000');
    U.uPkgRim.value.multiplyScalar(s.rim?.strength??0);U.uPkgRimPow.value=s.rim?.power??2;
    U.uPkgLo.value=s.ramp?.[0]??0;U.uPkgHi.value=s.ramp?.[1]??1;U.uPkgMix.value=s.mix??1;U.uPkgGamma.value=s.gamma??1;
  }
  const shot=()=>{v.renderer.render(v.scene,v.camera);return v.renderer.domElement.toDataURL('image/png');};
  window.__pkgLayers={
    patch,state:()=>({...state}),
    /** Render the requested layers for the already staged pose. */
    render(layers,skins){
      patch();const out={};
      for(const skin of skins){
        setSkin(skin.look);
        if(layers.includes('body')){U.uPkgPass.value=0;out[skin.id+'/body']=shot();}
        if(layers.includes('body-highlight')){U.uPkgPass.value=2;out[skin.id+'/body-highlight']=shot();}
      }
      if(layers.includes('mask')){setSkin(null);U.uPkgPass.value=1;out['mask']=shot();}
      U.uPkgPass.value=0;setSkin(null);
      return out;
    }
  };
})();
