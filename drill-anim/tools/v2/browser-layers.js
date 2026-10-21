/* Runtime-only v2 layer adapter. Frozen model and renderer sources stay unchanged. */
(() => {
  const T = __toonT, v = flareInspector.viewer;
  const pass = { value: 0 }; // 0: unhighlighted body, 1: canonical grayscale coverage
  const patches = new WeakMap(), depths = new WeakMap(), depthReports = new Map();
  function patch() {
    v.scene.traverse(o => {
      if (!o.isMesh || !o.material || o === v.shadowCatcher) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (patches.get(m) === m.onBeforeCompile) continue;
        const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
        const hook = function(sh, renderer) {
          prev.call(this, sh, renderer);
          sh.uniforms.uV2LayerPass = pass;
          // Profile/neck/region hooks may wrap this hook again; inject shader text only once.
          if (sh.fragmentShader.includes('uniform float uV2LayerPass;')) return;
          sh.fragmentShader = 'uniform float uV2LayerPass;\n' + sh.fragmentShader;
          const needle = 'lit=mix(lit,cyl,d*';
          if (sh.fragmentShader.includes(needle)) {
            sh.fragmentShader = sh.fragmentShader.replace(needle,
              'float v2LayerMask=d; if(uV2LayerPass<0.5) d=0.0; lit=mix(lit,cyl,d*');
            sh.fragmentShader = sh.fragmentShader.replace(/}\s*$/, '\nif(uV2LayerPass>0.5) gl_FragColor=vec4(vec3(v2LayerMask),1.0);\n}');
          } else {
            // Props and unselected head meshes keep their depth; they occlude selected surfaces.
            sh.fragmentShader = sh.fragmentShader.replace(/}\s*$/, '\nif(uV2LayerPass>0.5) gl_FragColor=vec4(0.0,0.0,0.0,1.0);\n}');
          }
        };
        m.onBeforeCompile = hook;
        // The region loader recognizes its outer hook by identity; retain that contract
        // to prevent a new region wrapper/program cache key on every material switch.
        if(m.__v2prHook===prev)m.__v2prHook=hook;
        m.customProgramCacheKey = () => key.call(m) + '|v2-separate-layers';
        patches.set(m, hook); m.needsUpdate = true;
      }
    });
  }
  const shot = () => { v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); };
  const effectiveVisible = o => { for (let q=o;q;q=q.parent) if (!q.visible) return false; return true; };
  function prepareDepth(o) {
    const source=Array.isArray(o.material)?o.material[0]:o.material;
    const previous=depths.get(o);
    if(previous?.hook===source.onBeforeCompile){o.customDepthMaterial=previous.depth;return;}
    const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});
    depth.onBeforeCompile=function(sh,renderer){
      // Build exactly the active material's vertex program using its unchanged hook.
      const original={vertexShader:T.ShaderLib.toon.vertexShader,fragmentShader:T.ShaderLib.toon.fragmentShader,
        uniforms:T.UniformsUtils.clone(T.ShaderLib.toon.uniforms)};
      source.onBeforeCompile(original,renderer);
      Object.assign(sh.uniforms,original.uniforms);
      // Depth programs have no light/shadow-matrix uniform arrays. These chunks
      // only compute lighting varyings and never modify the vertex position.
      const vertex=original.vertexShader.replace(/#include <(?:shadowmap_pars_vertex|shadowmap_vertex|fog_pars_vertex|fog_vertex)>/g,'');
      sh.vertexShader='varying vec2 vHighPrecisionZW;\n'+vertex.replace(/}\s*$/,'\nvHighPrecisionZW=gl_Position.zw;\n}');
      depthReports.set(o,{name:o.name,sourceVertex:original.vertexShader,vertexEquivalent:true,
        breathing:original.vertexShader.includes('uBreath'),clothSink:original.vertexShader.includes('uSinkK'),fieldOn:original.uniforms.uFieldOn?.value,
        drawRange:{start:o.geometry?.drawRange.start,count:o.geometry?.drawRange.count},omittedChunks:'lighting-only shadow coordinates and fog varyings'});
    };
    depth.customProgramCacheKey=()=>source.customProgramCacheKey()+'|v2-source-vertex-depth';
    depth.polygonOffset=source.polygonOffset;depth.polygonOffsetFactor=source.polygonOffsetFactor;depth.polygonOffsetUnits=source.polygonOffsetUnits;
    o.customDepthMaterial=depth;depths.set(o,{hook:source.onBeforeCompile,depth});previous?.depth.dispose();
  }
  function shadow({occlude=true}={}) {
    const saved=[];v.scene.traverse(o=>{if(!o.isMesh||!effectiveVisible(o)||o===v.shadowCatcher)return;
      saved.push([o,o.castShadow]);o.castShadow=true;prepareDepth(o);
    });
    const mats=new Map();for(const [o]of saved)for(const m of Array.isArray(o.material)?o.material:[o.material])if(!mats.has(m)){
      mats.set(m,[m.colorWrite,m.depthWrite]);m.colorWrite=false;if(!occlude)m.depthWrite=false;
    }
    const catcher=v.shadowCatcher,vis=catcher.visible;catcher.visible=true;v.renderer.shadowMap.needsUpdate=true;
    const result=shot();catcher.visible=vis;
    for(const[m,[c,d]]of mats){m.colorWrite=c;m.depthWrite=d;}for(const[o,c]of saved)o.castShadow=c;
    return result;
  }
  function pose(spec,t,f,warm,full){
    const renderer=v.renderer,canvas=renderer.domElement,render=renderer.render,toDataURL=canvas.toDataURL;
    // Reuse the frozen frame's pose/camera/QA logic, without its unused legacy PNG pass.
    renderer.render=()=>{};canvas.toDataURL=()=>'';let r;
    try{r=__drill.frame(spec,t,f,warm,{size:1080,full,mask:true});}
    finally{renderer.render=render;canvas.toDataURL=toDataURL;__glowU.value=0;}
    return {...r.M,camera:{world:v.camera.matrixWorld.elements.slice(),projection:v.camera.projectionMatrix.elements.slice()}};
  }
  function visibleSurface(){
    const result={method:'all visible indexed CPU-skinned vertices including finger bones',minY:Infinity,minMesh:null,
      hands:{left:{minY:Infinity,vertices:0},right:{minY:Infinity,vertices:0}},meshes:[]};
    v.coach.updateMatrixWorld(true);v.coach.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
    v.coach.traverse(o=>{if(!o.isSkinnedMesh||!effectiveVisible(o))return;const g=o.geometry;if(g.drawRange.count===0)return;
      const first=g.drawRange.start,last=Math.min(g.index?g.index.count:g.attributes.position.count,first+g.drawRange.count),used=new Set();
      for(let i=first;i<last;i++)used.add(g.index?g.index.getX(i):i);
      const p=new T.Vector3();let minY=Infinity;
      for(const i of used){o.getVertexPosition(i,p).applyMatrix4(o.matrixWorld);minY=Math.min(minY,p.y);
        if(o.name==='V2P_Base_Hands'){
          let left=0,right=0;for(let k=0;k<4;k++){const bone=o.skeleton.bones[g.attributes.skinIndex.getComponent(i,k)].name,w=g.attributes.skinWeight.getComponent(i,k);
            if(/(^left|^v2p_L_)/i.test(bone))left+=w;if(/(^right|^v2p_R_)/i.test(bone))right+=w;}
          if(left+right<.5)throw new Error('Hand vertex has no recognized left/right skeleton weights');
          const side=left>=right?'left':'right';result.hands[side].vertices++;result.hands[side].minY=Math.min(result.hands[side].minY,p.y);
        }
      }
      result.meshes.push({name:o.name,drawnVertices:used.size,minY});if(minY<result.minY){result.minY=minY;result.minMesh=o.name;}
    });
    return result;
  }
  window.__v2Layers = {
    patch,
    materialBody(spec){__drill.selectModelProfile(spec);__setHighlight(spec.highlight);pass.value=0;__glowU.value=0;patch();return shot();},
    async shadowAudit(){const result=[];for(const[o,r]of depthReports){const bytes=new TextEncoder().encode(r.sourceVertex);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
      result.push({name:o.name,sourceVertexShaderSha256:hash,vertexEquivalent:r.vertexEquivalent,breathing:r.breathing,clothSink:r.clothSink,
        fieldOn:r.fieldOn,drawRange:r.drawRange,omittedChunks:r.omittedChunks});}return result;},
    shadowProbe(){const U=__toonUni,old=[U.uBreath.value,U.uSinkK.value];U.uBreath.value=0;U.uSinkK.value=0;const zero=shadow({occlude:false});
      U.uBreath.value=.04;U.uSinkK.value=8;const displaced=shadow({occlude:false});
      U.uBreath.value=0;U.uSinkK.value=0;const oldX=v.coach.position.x;v.coach.position.x+=.08;v.coach.updateMatrixWorld(true);
      const translated=shadow({occlude:false});v.coach.position.x=oldX;v.coach.updateMatrixWorld(true);U.uBreath.value=old[0];U.uSinkK.value=old[1];
      return {zero,displaced,translated,parameters:{zero:{breath:0,sinkK:0},displaced:{breath:.04,sinkK:8},translated:{worldX:.08}},foregroundDepthOcclusion:false};},
    capture(spec, t, f, warm, layers) {
      pass.value=0; patch();
      const metrics=pose(spec,t,f,warm,f%30===0);metrics.visibleSurface=visibleSurface();patch();
      const result={metrics};
      if(layers.includes('body')) result.body=shot();
      if(layers.includes('highlight')) {
        // The designed analytic muscle selection is canonical across material skins.
        // The profile changes shader uniforms only: pose, camera and scene depth are retained.
        __drill.selectModelProfile({...spec,v2plus:{...spec.v2plus,skin:'realistic',regions:undefined}});
        __setHighlight(spec.highlight); patch(); pass.value=1;
        result.highlight=shot(); pass.value=0;
        __drill.selectModelProfile(spec); __setHighlight(spec.highlight); patch();
      }
      if(layers.includes('shadow')) result.shadow=shadow();
      return result;
    },
    async geometry(scope='body') {
      const digest = async a => {
        const b=ArrayBuffer.isView(a)?new Uint8Array(a.buffer,a.byteOffset,a.byteLength):new TextEncoder().encode(JSON.stringify(a));
        return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
      };
      const objects=[];v.scene.updateMatrixWorld(true);
      (scope==='scene'?v.scene:v.coach).traverse(o=>{if(o.isMesh&&o!==v.shadowCatcher&&effectiveVisible(o)&&o.geometry.drawRange.count!==0)objects.push(o);});
      const meshes=[];
      for(const o of objects){const g=o.geometry, attrs={};
        for(const k of ['position','normal','skinIndex','skinWeight','aSink','aHandD','aHandN'])if(g.attributes[k]){
          const a=g.attributes[k], vals=[];for(let i=0;i<a.count;i++)for(let c=0;c<a.itemSize;c++)vals.push(a.getComponent(i,c));
          attrs[k]={itemSize:a.itemSize,count:a.count,sha256:await digest(new Float64Array(vals))};
        }
        meshes.push({name:o.name,attributes:attrs,index:g.index?await digest(g.index.array):null,
          drawRange:{start:g.drawRange.start,count:Number.isFinite(g.drawRange.count)?g.drawRange.count:null},
          groups:g.groups,bindMatrix:o.bindMatrix?.elements||null,bones:o.skeleton?.bones.map(b=>b.name)||null,
          boneInverses:o.skeleton?.boneInverses.map(m=>m.elements)||null,
          ...(scope==='scene'?{matrixWorld:o.matrixWorld.elements,depth:(Array.isArray(o.material)?o.material:[o.material]).map(m=>({depthTest:m.depthTest,depthWrite:m.depthWrite,side:m.side,alphaTest:m.alphaTest||0,canonicalMaskOutput:'opaque grayscale/frontmost surface'}))}:{})});
      }
      meshes.sort((a,b)=>a.name.localeCompare(b.name));const camera=scope==='scene'?{world:v.camera.matrixWorld.elements,projection:v.camera.projectionMatrix.elements}:undefined;
      return {sha256:await digest(camera?{meshes,camera}:meshes),meshes,...(camera?{camera}:{})};
    }
  };
})();
