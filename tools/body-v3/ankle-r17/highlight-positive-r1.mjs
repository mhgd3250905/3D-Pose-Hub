// Active-highlight positive control: same r17 scene and r16 front-sided shoe
// shader for comparison. Uses tight orthographic thigh/calf cameras, not the
// unsuitable action-camera default. Explicit group names are existing v2p
// groups. Never claims success when the diagnostic mask has no signal.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('provide a NEW output directory');fs.mkdirSync(out,{recursive:true});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../drill-anim'),imp=f=>import(pathToFileURL(path.join(root,f)).href);
const loader=await imp('models/body-v3-ankle-r17/loader.mjs'),{loadTheme}=await imp('lib/config.mjs');
const spec0=async f=>{const s={...structuredClone((await imp('specs/'+f)).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}};s.v2plus={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',...(s.v2plus||{})};return s;};
const {b,p}=await loader.boot({size:360,pr:1,theme:loadTheme()});
const timed=async(label,fn,ms=90000)=>{let id;try{return await Promise.race([fn(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+label)),ms);})]);}finally{clearTimeout(id);}};
try{
 const stand=await spec0('h-squat.js');await timed('applyV3',()=>loader.applyV3(p,stand,{}));await p.addScriptTag({content:fs.readFileSync(path.join(root,'tools/v2/browser-layers.js'),'utf8')});
 await p.evaluate(()=>{const m=flareInspector.viewer.coach.getObjectByName('V2P_Base_Limbs').material,h=m.onBeforeCompile,k=m.customProgramCacheKey();window.__limbShaderProbe=null;
  m.onBeforeCompile=function(sh,r){h.call(this,sh,r);window.__limbShaderProbe=sh;};m.customProgramCacheKey=()=>k+'|highlight-uniform-probe-r2';m.needsUpdate=true;});
 const results={};
 for(const [state,file,group,view] of [['rest_quad','h-squat.js','quadriceps','front'],['rest_calf','h-squat.js','calves','back']]){
  const spec=await spec0(file);await p.evaluate(([s,z])=>{__drill.setupCamera(s,z);__drill.selectModelProfile(s);},[spec,360]);
  await timed(state+' pose',()=>p.evaluate(()=>{flareInspector.viewer.motion.reset();flareInspector.viewer.coach.updateMatrixWorld(true);return null;}));
  const result=await timed(state+' highlight',()=>p.evaluate(([group,view])=>{
   const T=__toonT,v=flareInspector.viewer,shoes=['Coach_Sneakers','Coach_Shoe_Details'].map(n=>v.coach.getObjectByName(n)),r17=shoes.map(m=>m.material);
   const r16=r17.map((old,i)=>{const mat=old.clone(),hook=old.onBeforeCompile,key=old.customProgramCacheKey();mat.side=T.FrontSide;mat.onBeforeCompile=function(sh,r){hook.call(this,sh,r);};mat.customProgramCacheKey=()=>key+'|shoe-front-highlight-r3-'+i;mat.needsUpdate=true;return mat;});
   const selected=__setHighlight({groups:[group],side:'both'});v.coach.updateMatrixWorld(true);
   const point=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3());const p0=point(group==='calves'?'leftShin':'leftThigh'),p1=point(group==='calves'?'leftFoot':'leftShin'),center=p0.lerp(p1,.46);
   const dir=new T.Vector3(0,0,1).applyQuaternion(v.coach.getObjectByName('pelvis').getWorldQuaternion(new T.Quaternion()));dir.y=0;dir.normalize();if(view==='back')dir.negate();
   const c=new T.OrthographicCamera(-.38,.38,.38,-.38,.02,20);c.position.copy(center).addScaledVector(dir,1.5);c.lookAt(center);c.updateProjectionMatrix();
   const R=v.renderer,old=__toonUni.uGlow.value,shots={},counts={},uniformsDuringDebug={};R.setClearColor(0x000000,1);
   const take=(name,debug)=>{__toonUni.uGlow.value=debug?6:old;R.render(v.scene,c);shots[name]=R.domElement.toDataURL('image/png');
    if(debug){const sh=window.__limbShaderProbe;uniformsDuringDebug[name]=sh?Object.fromEntries(['uGlow','uV2pOn','uSelN','uMapGate','uV2pSel'].map(k=>[k,sh.uniforms[k]?.value??null])):null;const canvas=document.createElement('canvas');canvas.width=360;canvas.height=360;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(R.domElement,0,0);const x=ctx.getImageData(0,0,360,360).data;let n=0;for(let i=0;i<x.length;i+=4)if(x[i]>5&&x[i]===x[i+1]&&x[i]===x[i+2])n++;counts[name]=n;}};
   try{shoes.forEach((m,i)=>m.material=r17[i]);take('r17',false);take('r17-mask',true);shoes.forEach((m,i)=>m.material=r16[i]);take('r16',false);take('r16-mask',true);}
   finally{__toonUni.uGlow.value=old;shoes.forEach((m,i)=>m.material=r17[i]);r16.forEach(m=>m.dispose());}
   return {shots,counts,uniformsDuringDebug,selected,group,view,camera:c.position.toArray(),target:center.toArray(),v2pOn:__v2p.on,v2pUniform:__v2p.uni.uV2pOn.value,v2pSelected:__v2p.uni.uV2pSel.value,legacySelection:__mmUni.uSelN.value,limbShaderUniforms:window.__limbShaderProbe?Object.fromEntries(['uGlow','uV2pOn','uSelN','uMapGate','uV2pSel'].map(k=>[k,window.__limbShaderProbe.uniforms[k]?.value??null])):null};
  },[group,view]));
  for(const [name,data] of Object.entries(result.shots))fs.writeFileSync(path.join(out,`${state}-${group}-${name}.png`),Buffer.from(data.split(',')[1],'base64'),{flag:'wx'});
  delete result.shots;results[state]=result;console.log(state,group,JSON.stringify(result.counts));
 }
 fs.writeFileSync(path.join(out,'report-r1.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
 for(const [state,r] of Object.entries(results))if(!r.counts['r16-mask']||!r.counts['r17-mask'])throw Error(state+' has no positive highlight mask; comparison is inconclusive');
}finally{await b.close();}
