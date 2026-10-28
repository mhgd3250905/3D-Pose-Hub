import fs from 'node:fs';import path from 'node:path';
import{imp,pinnedRuntime,verifyRuntimeSelection,saveJson,initView}from'../armfix-r2/hand-qa-runtime.mjs';
const[out,runtimeFile]=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('New output and pinned runtime required');
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs');
const spec={modelProfile:'training-human-v2plus-hands-native',nativeHands:{twistShare:.5},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'},props:[]};
const{b,p}=await model.boot({size:720,pr:1,theme:loadTheme()});
try{
 await model.applyV3(p,spec);await initView(p);
 const data=await p.evaluate(()=>{
  const T=__toonT,v=flareInspector.viewer,V=__v2p;v.motion.reset();V.restHands();v.coach.updateMatrixWorld(true);
  const gl=v.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),result={format:'pose-hub-webxr-wrist-source@1',capturedAt:'scene.onAfterRender',gpu:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)};
  const previous=v.scene.onAfterRender;
  v.scene.onAfterRender=function(...args){previous?.apply(this,args);const L=V.limbs.mesh,H=V.hands.mesh;L.updateMatrixWorld(true);L.skeleton.update();
   const q=new T.Vector3(),positions=[];for(let i=0;i<L.geometry.attributes.position.count;i++)positions.push(...L.getVertexPosition(i,q).applyMatrix4(L.matrixWorld).toArray());
   const describe=mesh=>({name:mesh.name,vertices:mesh.geometry.attributes.position.count,faces:mesh.geometry.index.count/3,attributes:Object.fromEntries(Object.entries(mesh.geometry.attributes).map(([name,a])=>[name,{itemSize:a.itemSize,count:a.count,normalized:a.normalized,arrayType:a.array.constructor.name}])),materialType:mesh.material.type,materialUniforms:Object.keys(mesh.material.uniforms||{}),meshMatrixWorld:mesh.matrixWorld.toArray()});
   result.limbs={...describe(L),positions,index:Array.from(L.geometry.index.array)};result.hands=describe(H);result.frames={};
   for(const side of ['left','right']){const h=v.coach.getObjectByName(side+'Hand'),f=v.coach.getObjectByName(side+'Forearm');result.frames[side]={handMatrixWorld:h.matrixWorld.toArray(),forearmMatrixWorld:f.matrixWorld.toArray(),handLocalQuaternion:h.quaternion.toArray(),forearmLocalQuaternion:f.quaternion.toArray()};}
  };
  try{v.renderer.render(v.scene,v.camera);}finally{v.scene.onAfterRender=previous;}
  return result;
 });
 if(data.gpu!==rt.actualWebGLRenderer)throw Error('GPU mismatch');saveJson(path.join(out,'source.json'),data);console.log(JSON.stringify({file:path.join(out,'source.json'),limbs:data.limbs.vertices,hands:data.hands.vertices,materials:[data.limbs.materialType,data.hands.materialType],limbAttributes:Object.keys(data.limbs.attributes)},null,2));
}finally{await b.close();}
