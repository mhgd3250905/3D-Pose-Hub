// Experimental P4 normal-only candidate, not a released model.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import * as base from '../training-human-v3-shoulder-completed-r3/loader.mjs';
import {buildTopology,updateNormals} from '../../../tools/body-v3/knee-normal-r1/kernel.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const PROFILE='training-human-v3-knee-normal-candidate',VERSION='0.0.0-r2';
export async function boot(options){return base.boot(options);}
export async function installOnInitialized(page){
  await page.addScriptTag({content:`window.__buildKneeNormalTopology=${buildTopology.toString()};window.__updateKneeNormals=${updateNormals.toString()};`});
  const data=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/training-human-v2plus-limbs-base.json'),'utf8'));
  const rest=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/training-human-v3-shoulder-completed-r3/rest-meta.json'),'utf8'));
  return page.evaluate(({seamFirst,expectedRest})=>{
   const T=window.__toonT,v=window.flareInspector?.viewer,V=window.__v2p,renderer=v?.renderer,mesh=V?.limbs?.mesh,p5=window.__shoulderLifecycleR1;
   if(!T||!renderer||!V.limbs.on||!mesh?.isSkinnedMesh||!mesh.visible||!p5||window.__kneeNormalCandidateR2||window.__kneeNormalCandidateUsedR2)throw Error('knee normal: expected fresh active full P5 baseline');
   const geom=mesh.geometry,mat=mesh.material;if(Array.isArray(mat)||!mat?.isMeshToonMaterial||geom.attributes.aP4KneeNormal||geom.attributes.aP4KneeMask||!geom.index)throw Error('knee normal: unsupported mesh/material');
   const names=mesh.skeleton.bones.map(b=>b.name);if(new Set(names).size!==names.length)throw Error('knee normal: duplicate bones');
   const bone=Object.fromEntries(['leftThigh','leftShin','rightThigh','rightShin'].map(n=>[n,v.coach.getObjectByName(n)]));if(Object.values(bone).some(x=>!x?.isBone))throw Error('knee normal: missing gate bones');
   v.coach.updateMatrixWorld(true);mesh.skeleton.update();const expected=new Map(expectedRest.map(b=>[b.name,b.matrix]));if(expected.size!==names.length||names.some(n=>!expected.has(n)))throw Error('knee normal: rest skeleton mismatch');let restMax=0;for(let i=0;i<names.length;i++)for(let j=0;j<16;j++)restMax=Math.max(restMax,Math.abs(mesh.skeleton.boneMatrices[16*i+j]-expected.get(names[i])[j]));if(restMax>1e-5)throw Error('knee normal: installation requires effective rest pose, max matrix difference '+restMax);
   const q1=new T.Quaternion(),q2=new T.Quaternion(),tmp=new T.Quaternion(),restRelative={};for(const side of ['left','right'])restRelative[side]=bone[side+'Thigh'].getWorldQuaternion(q1).invert().multiply(bone[side+'Shin'].getWorldQuaternion(q2)).clone();
   if(!V.limbs.world||V.limbs.world.length!==geom.attributes.position.count*3)throw Error('knee normal: missing rest-world inputs');const world=Float32Array.from(V.limbs.world);
   const knee={};for(const side of ['left','right'])knee[side]=bone[side+'Shin'].getWorldPosition(new T.Vector3()).toArray();
   let topology,normalAttr,maskAttr,lastSources,previousSignature=null;const mLocal=new T.Matrix4(),mWorld=new T.Matrix4(),boneM=new T.Matrix4(),normalM=new T.Matrix3(),toLocal=new T.Matrix3(),normalEnable={value:1},warnings=[];
   const skinWorld=new Float64Array(mesh.skeleton.bones.length*16),skinLocal=new Float64Array(mesh.skeleton.bones.length*16);
   const originalRender=renderer.render,originalCompile=mat.onBeforeCompile,originalKey=mat.customProgramCacheKey;
   const extensions=new Map();
   function runExtensions(scene,camera){for(const update of extensions.values())update(scene,camera);}
   const copy=(a,size,C=Float32Array)=>{const x=new C(a.count*size);for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)x[i*size+k]=a.getComponent(i,k);return x;};
   function sources(){const a=geom.attributes;return [a.position,a.normal,a.skinIndex,a.skinWeight,geom.index];}
   function versions(){return sources().map(a=>a?.version??a?.data?.version??0);}
   function rebuild(){const [p,n,j,w,index]=sources();if(!p||!n||!j||!w||!index||p.count!==world.length/3||geom.morphAttributes.position?.length||geom.morphAttributes.normal?.length)throw Error('knee normal: unsupported source/morph layout');
    topology=window.__buildKneeNormalTopology({positions:copy(p,3),normals:copy(n,3),indices:copy(index,1,Uint32Array),joints:copy(j,4,Uint16Array),weights:copy(w,4),restWorld:world,seamFirst,leftKnee:knee.left,rightKnee:knee.right,drawStart:geom.drawRange.start||0,drawCount:geom.drawRange.count});
    if(!topology.targets.length)throw Error('knee normal: empty support');if(normalAttr&&maskAttr){if(normalAttr.count!==p.count||maskAttr.count!==p.count)throw Error('knee normal: changed vertex count');topology.normal=normalAttr.array;topology.mask=maskAttr.array;topology.normal.fill(0);topology.mask.fill(0);normalAttr.needsUpdate=true;maskAttr.needsUpdate=true;}else{normalAttr=new T.BufferAttribute(topology.normal,3);maskAttr=new T.BufferAttribute(topology.mask,1);geom.setAttribute('aP4KneeNormal',normalAttr);geom.setAttribute('aP4KneeMask',maskAttr);}lastSources=sources();previousSignature=null;
   }
   function gate(side){const parent=bone[side+'Thigh'].getWorldQuaternion(q1),child=bone[side+'Shin'].getWorldQuaternion(q2),degrees=tmp.copy(parent).invert().multiply(child).angleTo(restRelative[side])*180/Math.PI,x=Math.max(0,Math.min(1,(degrees-30)/40));return {degrees,amount:x*x*(3-2*x)};}
   const state={mesh,geom,mat,renderer,normalEnable,stats:{calls:0,recomputes:0,cacheHits:0,skipped:0,validations:0},warnings,active:true,userEnabled:true,lastGate:null,lastResult:null,textureValid:null,uniforms:null,textureState:null};
   function validateTextures(uniforms){const vt=uniforms.uVR?.value,mt=uniforms.uMMT?.value,vr=vt?.image?.data,mm=mt?.image?.data,field=uniforms.uFieldOn?.value;let valid=!!vr&&!!mm&&Number.isFinite(field)&&vr.length>=world.length/3*4&&mm.length>=world.length/3*4;
    if(valid)for(const id of topology.needed){const a=mm[4*id+3],x=vr[4*id],y=vr[4*id+1],z=vr[4*id+2];if(!Number.isFinite(a)||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z)||Math.abs(a)>1e-12||Math.abs(x-world[3*id])>1e-6||Math.abs(y-world[3*id+1])>1e-6||Math.abs(z-world[3*id+2])>1e-6){valid=false;break;}}
    state.stats.validations++;state.textureValid=valid;state.textureState={vt,mt,vr,mm,vtVersion:vt?.version,mtVersion:mt?.version,field};normalEnable.value=valid&&state.userEnabled?1:0;if(!valid&&warnings.at(-1)!=='unsupported live uVR/uMMT/uFieldOn; candidate disabled')warnings.push('unsupported live uVR/uMMT/uFieldOn; candidate disabled');return valid;
   }
   function hook(shader,render){originalCompile.call(this,shader,render);const anchor='#include <skinnormal_vertex>',normal='#include <normal_vertex>',begin='#include <begin_vertex>',a=shader.vertexShader.indexOf(anchor),n=shader.vertexShader.indexOf(normal),z=shader.vertexShader.indexOf(begin);if(a<0||n<=a||z<=n)throw Error('knee normal: invalid shader anchor ordering');
    // Change only the normal varying: breath and post-skin sink read the saved
    // original objectNormal, so this correction never changes vertex position.
    shader.uniforms.uP4KneeEnable=normalEnable;shader.vertexShader='attribute vec3 aP4KneeNormal;attribute float aP4KneeMask;uniform float uP4KneeEnable;\n'+shader.vertexShader.replace(anchor,anchor+'\nvec3 p4OriginalSkinnedNormal=objectNormal;if(uP4KneeEnable>0.5&&aP4KneeMask>0.5) objectNormal=aP4KneeNormal;').replace(begin,'objectNormal=p4OriginalSkinnedNormal;\n'+begin);
    state.uniforms=shader.uniforms;validateTextures(shader.uniforms);
   }
   function cacheKey(){return originalKey.call(this)+'|knee-posed-normal-candidate-r1';}
   function render(scene,camera){
    state.stats.calls++;if(window.__shoulderLifecycleR1!==p5||mesh.geometry!==geom||mesh.material!==mat||mat.onBeforeCompile!==hook||renderer.render!==render||geom.attributes.aP4KneeNormal!==normalAttr||geom.attributes.aP4KneeMask!==maskAttr)throw Error('knee normal: P5, source or hook changed; discard page');
    scene.updateMatrixWorld();v.coach.updateMatrixWorld(true);
    if(!state.active||!V.limbs.on||!mesh.visible){normalEnable.value=0;state.stats.skipped++;runExtensions(scene,camera);return originalRender.call(this,scene,camera);}normalEnable.value=state.userEnabled&&state.textureValid!==false?1:0;
    mesh.skeleton.update();
    const a=sources();if(a.some((x,i)=>x!==lastSources[i]))throw Error('knee normal: source attribute object replaced; discard page');
    const gL=gate('left'),gR=gate('right'),breath=state.uniforms?.uBreath?.value??window.__toonUni?.uBreath?.value??0,fieldOn=state.uniforms?.uFieldOn?.value??1;
    if(!Number.isFinite(breath))throw Error('knee normal: invalid breath');
    // Any source data or draw-range version change rebuilds static topology.
    const vrs=versions(),draw=[geom.drawRange.start||0,geom.drawRange.count];if(!state.sourceVersions||vrs.some((x,i)=>x!==state.sourceVersions[i])||draw.some((x,i)=>x!==state.draw[i])){rebuild();state.sourceVersions=vrs;state.draw=draw;if(state.uniforms)validateTextures(state.uniforms);}
    if(state.uniforms){const u=state.uniforms,s=state.textureState,vt=u.uVR?.value,mt=u.uMMT?.value;if(!s||vt!==s.vt||mt!==s.mt||vt?.image?.data!==s.vr||mt?.image?.data!==s.mm||vt?.version!==s.vtVersion||mt?.version!==s.mtVersion||u.uFieldOn?.value!==s.field)validateTextures(u);}
    const signature=[...mesh.skeleton.boneMatrices.slice(0,mesh.skeleton.bones.length*16),...mesh.matrixWorld.elements,...mesh.bindMatrix.elements,...mesh.bindMatrixInverse.elements,gL.amount,gR.amount,breath,fieldOn,state.textureState?.vtVersion??-1,state.textureState?.mtVersion??-1,normalEnable.value];
    let changed=!previousSignature||signature.length!==previousSignature.length;if(!changed)for(let i=0;i<signature.length;i++)if(signature[i]!==previousSignature[i]){changed=true;break;}
    state.lastGate={left:gL,right:gR};
    if(changed){for(let i=0;i<mesh.skeleton.bones.length;i++){boneM.fromArray(mesh.skeleton.boneMatrices,16*i);mLocal.copy(mesh.bindMatrixInverse).multiply(boneM).multiply(mesh.bindMatrix);mWorld.copy(mesh.matrixWorld).multiply(mLocal);skinLocal.set(mLocal.elements,i*16);skinWorld.set(mWorld.elements,i*16);}
     normalM.getNormalMatrix(mesh.matrixWorld);toLocal.setFromMatrix4(mesh.matrixWorld).transpose();const result=window.__updateKneeNormals(topology,{skinWorld,skinLocal,worldNormal:normalM.elements,worldToLocal:toLocal.elements,gateLeft:gL.amount,gateRight:gR.amount,breath,fieldOn,orientation:mesh.matrixWorld.determinant()<0?-1:1});normalAttr.needsUpdate=true;maskAttr.needsUpdate=true;previousSignature=signature;state.stats.recomputes++;state.lastResult={active:result.active,breath};
    }else state.stats.cacheHits++;
    runExtensions(scene,camera);
    return originalRender.call(this,scene,camera);
   }
   function remove(){if(extensions.size)throw Error('knee normal: remove extensions first');if(renderer.render!==render||mat.onBeforeCompile!==hook||mat.customProgramCacheKey!==cacheKey||mesh.geometry!==geom||mesh.material!==mat||geom.attributes.aP4KneeNormal!==normalAttr||geom.attributes.aP4KneeMask!==maskAttr)throw Error('knee normal: hook/geometry changed; discard page');
    state.active=false;renderer.render=originalRender;mat.onBeforeCompile=originalCompile;mat.customProgramCacheKey=originalKey;mat.needsUpdate=true;geom.deleteAttribute('aP4KneeNormal');geom.deleteAttribute('aP4KneeMask');geom.dispose();delete window.__kneeNormalCandidateR2;return {removed:true,geometryDisposedOnceForGpuCache:true};}
   state.registerBeforeRenderExtension=(name,update)=>{if(!state.active||typeof name!=='string'||!name.trim()||typeof update!=='function')throw Error('knee normal: invalid extension');if(extensions.size)throw Error('knee normal: extension slot occupied '+name);extensions.set(name,update);};
   state.unregisterBeforeRenderExtension=(name,update)=>{if(!extensions.has(name)||extensions.get(name)!==update)throw Error('knee normal: extension identity mismatch '+name);extensions.delete(name);};
   rebuild();state.sourceVersions=versions();state.draw=[geom.drawRange.start||0,geom.drawRange.count];mat.onBeforeCompile=hook;mat.customProgramCacheKey=cacheKey;mat.needsUpdate=true;renderer.render=render;state.remove=remove;state.setEnabled=value=>{state.userEnabled=!!value;normalEnable.value=state.userEnabled&&state.textureValid!==false?1:0;};state.report=()=>({stats:{...state.stats},gate:state.lastGate,result:state.lastResult,topology:topology.stats,textureValid:state.textureValid,warnings:state.warnings.slice(),enabled:normalEnable.value,userEnabled:state.userEnabled,extensions:[...extensions.keys()]});window.__kneeNormalCandidateR2=state;window.__kneeNormalCandidateUsedR2=true;
   return {topology:topology.stats,kneeCenters:knee,restMatrixMaxDifference:restMax,gateThresholdDegrees:[30,70],lifecycle:'render wrapper; remove before P5/base geometry detach'};
  },{seamFirst:data.seam.first,expectedRest:rest.bones});
}
export async function applyV3(page,spec,options={}){
 let ready=false;try{
  const previous=await base.applyV3(page,spec,options);ready=true;
  if(previous.profile!=='training-human-v3-shoulder-completed'||previous.version!=='1.0.0-r3')throw Error('knee normal: unexpected base profile/version');
  const installed=await installOnInitialized(page);
  return {...previous,baseProfile:previous.profile,baseVersion:previous.version,profile:PROFILE,version:VERSION,kneeNormal:installed,scope:'experimental; no P4 visual acceptance'};
 }catch(error){if(ready){try{await page.evaluate(()=>window.__kneeNormalCandidateR2?.remove());}catch{}try{await base.detachGeometryLayers(page);}catch{}}throw new Error('knee normal setup failed; discard page',{cause:error});}
}
export async function report(page){return page.evaluate(()=>window.__kneeNormalCandidateR2?.report()??null);}
export async function setEnabled(page,value){return page.evaluate(v=>{const s=window.__kneeNormalCandidateR2;if(!s)throw Error('knee normal candidate not active');s.setEnabled(v);},value);}
export async function detachGeometryLayers(page){const knee=await page.evaluate(()=>{const x=window.__kneeNormalCandidateR2;if(!x)throw Error('knee normal candidate not active');return x.remove();});const rest=await base.detachGeometryLayers(page);return {knee,base:rest,lifecycle:'base ankle, normal and wrist hooks persist; new page required'};}
