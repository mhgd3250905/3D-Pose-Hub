// Experimental mesh/material attribution; preserves each toon vertex shader,
// depth test and morph path. Diagnostic colors only while mode=1.
(function () {
 const colors={Coach_Body:[[1,0,0]],Mesh005:[[0,1,0]],Mesh005_1:[[1,0,1]],V2P_Base_Torso:[[1,1,0]],V2P_Base_Limbs:[[0,0,1]],V2P_Base_Hands:[[0,1,1]]};
 window.__installShoulderMeshIdR1=function(){
  if(window.__shoulderMeshIdR1)throw Error('shoulder mesh ID already installed');
  const coach=window.flareInspector?.viewer?.coach;if(!coach)throw Error('shoulder mesh ID missing coach');
  const mode={value:0},entries=[],seen=new Set(),compiled=[];const shared=window.__collarShared?.mesh;
  coach.traverse(mesh=>{
   if(!mesh.isSkinnedMesh||!mesh.material)return;
   const col=mesh===shared?[[1,0.5,0],[0,1,1],[1,1,0]]:colors[mesh.name];if(!col)return;
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   materials.forEach((material,i)=>{
    if(seen.has(material))throw Error('shoulder mesh ID duplicate material');seen.add(material);
    const prior=material.onBeforeCompile,key=material.customProgramCacheKey,c=(col[i]||col[0]).map(x=>Number(x).toFixed(2)).join(',');
    function hook(shader,renderer){
     prior.call(this,shader,renderer);const anchor='#include <opaque_fragment>';if(!shader.fragmentShader.includes(anchor))throw Error('shoulder mesh ID opaque anchor missing: '+mesh.name);
     shader.fragmentShader='uniform float shoulderIdMode;\n'+shader.fragmentShader.replace(anchor,`if(shoulderIdMode>0.5) outgoingLight=vec3(${c});\n${anchor}`);
     shader.uniforms.shoulderIdMode=mode;compiled.push({mesh:mesh.name,material:i,color:col[i]||col[0]});
    }
    material.onBeforeCompile=hook;material.customProgramCacheKey=function(){return key.call(this)+'|shoulder-mesh-id-r1';};material.needsUpdate=true;entries.push({mesh:mesh.name,material,i,prior,key,hook});
   });
  });
  if(!entries.length)throw Error('shoulder mesh ID no recognized meshes');window.__shoulderMeshIdR1={mode,entries,compiled};
  return {materials:entries.map(e=>({mesh:e.mesh,material:e.i})),legend:{...colors,shared:['neck orange','head cyan','torso yellow']}};
 };
 window.__removeShoulderMeshIdR1=function(){
  const state=window.__shoulderMeshIdR1;if(!state)return false;
  for(const e of state.entries)if(e.material.onBeforeCompile!==e.hook)throw Error('shoulder mesh ID hook changed');
  for(const e of state.entries){e.material.onBeforeCompile=e.prior;e.material.customProgramCacheKey=e.key;e.material.needsUpdate=true;}
  delete window.__shoulderMeshIdR1;return true;
 };
})();
