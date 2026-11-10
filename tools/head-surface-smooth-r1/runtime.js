// Original head/face geometry, normals and skinning are retained exactly.
// Only the original head material's quantized light transition is softened.
(() => {
 if(window.__headSurfaceSmooth||window.__armfixR2?.profile!=='training-human-v3-armfix'||__armfixR2.version!=='0.1.0-r2')throw Error('Unexpected head/model lifecycle');
 const uniform={value:0},errors=[],compiled=new Set(),materials=new Set();
 flareInspector.viewer.scene.traverse(mesh=>{
  for(const mat of [mesh.material].flat().filter(Boolean)){
   if(materials.has(mat)||!mat.customProgramCacheKey?.().startsWith('head-neck-toon-r4-1'))continue;
   materials.add(mat);const previous=mat.onBeforeCompile,key=mat.customProgramCacheKey;
   mat.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    const needle='vec3 lit=mix(shc,alb,b);';
    if(!shader.fragmentShader.includes(needle)){errors.push('Missing original head light transition');return;}
    shader.uniforms.uHeadSurfaceSmooth=uniform;
    shader.fragmentShader='uniform float uHeadSurfaceSmooth;\n'+shader.fragmentShader.replace(needle,'vec3 lit=mix(shc,alb,mix(b,smoothstep(-0.25,0.85,nl),uHeadSurfaceSmooth));');
    compiled.add(mat.uuid);
   };
   mat.customProgramCacheKey=()=>key.call(mat)+'|head-surface-smooth-r1';mat.needsUpdate=true;
  }
 });
 if(!materials.size)throw Error('Original head material missing');
 window.__headSurfaceSmooth={errors,enable(on){uniform.value=on?1:0;},report(){return {profile:'head-surface-smooth',version:'0.1.0-r1',materials:materials.size,compiled:compiled.size,geometryChanged:false,normalsChanged:false,errors:[...errors]};}};
})();
