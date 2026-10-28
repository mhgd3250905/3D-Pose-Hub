// Actual r17 candidate versus same-scene r16 front-side comparison.
// One browser, no saved source/model changes. Diagnostic materials are
// temporary. Fixed cameras come from compare-four-r1; all poses remain frame 0.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const [out,reference]=process.argv.slice(2);if(!out||!reference||fs.existsSync(out))throw Error('pass NEW output and r16 comparison directory');fs.mkdirSync(out,{recursive:true});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../drill-anim'),imp=f=>import(pathToFileURL(path.join(root,f)).href);
const loader=await imp('models/body-v3-ankle-r17/loader.mjs'),{loadTheme}=await imp('lib/config.mjs');
const spec0=async f=>{const s={...structuredClone((await imp('specs/'+f)).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}};s.v2plus={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',...(s.v2plus||{})};return s;};
const states=[['rest',null,'front'],['squat','a-deep-squat-r3.js','back'],['plank','h-bear-plank.js','front'],['fold','a-seated-fold.js','mouth']];
const {b,p}=await loader.boot({size:360,pr:1,theme:loadTheme()});
const timed=async(label,fn,ms=90000)=>{let id;try{return await Promise.race([fn(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+label)),ms);})]);}finally{clearTimeout(id);}};
try{
 const stand=await spec0('h-squat.js');await timed('apply',()=>loader.applyV3(p,stand,{}));await p.addScriptTag({content:fs.readFileSync(path.join(root,'tools/v2/browser-layers.js'),'utf8')});
 for(const [state,file,view] of states){
  const spec=file?await spec0(file):stand;await timed(state+' setup',()=>p.evaluate(([s,z])=>{__setHighlight(s.highlight||{groups:[]});__drill.setupCamera(s,z);__drill.selectModelProfile(s);},[spec,360]));
  if(file){console.log(state,'capture');await timed(state+' capture',()=>p.evaluate(s=>{__v2Layers.capture(s,0,0,null,[]);return null;},spec));}
  else await p.evaluate(()=>{flareInspector.viewer.motion.reset();for(const side of ['left','right'])__v2p.setHandPose(side,'relaxed');});
  const bones=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);return Object.fromEntries(['leftFoot','rightFoot','leftShin','rightShin'].map(n=>[n,v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray()]));});
  const baseline=JSON.parse(fs.readFileSync(path.join(reference,state+'.json')));for(const n in bones)if(Math.hypot(...bones[n].map((x,i)=>x-baseline.bones[n][i]))>1e-5)throw Error(state+' pose mismatch');
  const views=state==='fold'?[['left','mouth'],['left','outer'],['right','mouth'],['right','outer']]:[['left',view],['right',view]];
  for(const [side,direction] of views){
   const meta=JSON.parse(fs.readFileSync(path.join(reference,`${state}-${side}-${direction}-meta.json`)));
   const result=await timed(state+' '+side+' '+direction,()=>p.evaluate(([meta,debug])=>{
    const T=__toonT,v=flareInspector.viewer,R=v.renderer,cam=new T.PerspectiveCamera(22,1,.02,20);cam.position.fromArray(meta.camera);cam.lookAt(new T.Vector3().fromArray(meta.target));cam.updateProjectionMatrix();
    const shoeNames=['Coach_Sneakers','Coach_Shoe_Details'],shoes=shoeNames.map(n=>v.coach.getObjectByName(n));if(shoes.some(x=>!x?.isSkinnedMesh||Array.isArray(x.material)))throw Error('unexpected shoe material');
    const prior=shoes.map(x=>x.material),refs=[];v.coach.traverse(m=>{if(m.isMesh&&!shoes.includes(m)&&prior.includes(m.material))refs.push(m.name);});if(refs.length)throw Error('r17 material shared with other meshes: '+refs);
    if(prior.some(m=>m.side!==T.DoubleSide))throw Error('r17 shoe sides were not applied');
    const candidateKeys=prior.map(m=>m.customProgramCacheKey());
    for(let i=0;i<prior.length;i++){const m=prior[i];if(m.userData.__r17Audit)continue;const hook=m.onBeforeCompile,key=m.customProgramCacheKey(),name=shoeNames[i];
     m.onBeforeCompile=function(sh,r){hook.call(this,sh,r);const keys=['uBase','uShadeC','uRimC','uGlow','uRim'];const entry={name,shoeUniform:sh.uniforms.uShoe?.value,themeShared:keys.every(k=>sh.uniforms[k]===window.__toonUni[k])};if(entry.shoeUniform!==1||!entry.themeShared)throw Error('shoe toon/theme uniforms are not preserved: '+name);(window.__r17UniformAudit??=[]).push(entry);};
     m.customProgramCacheKey=()=>key+'|r17-uniform-audit';m.needsUpdate=true;m.userData.__r17Audit=true;}
    const double=prior.map((mat,j)=>{const out=mat.clone(),hook=mat.onBeforeCompile,key=mat.customProgramCacheKey();out.side=T.FrontSide;out.onBeforeCompile=function(sh,r){hook.call(this,sh,r);window.__shoeFrontCompiles=(window.__shoeFrontCompiles||0)+1;};out.customProgramCacheKey=()=>key+'|shoe-front-ref-r1-'+j;out.needsUpdate=true;return out;});
    const oldColor=R.getClearColor(new T.Color()),oldAlpha=R.getClearAlpha(),shots={},take=k=>{R.render(v.scene,cam);shots[k]=R.domElement.toDataURL('image/png');};
    try{R.setClearColor(0x101318,1);take('r17');shoes.forEach((m,i)=>m.material=double[i]);take('r16');shoes.forEach((m,i)=>m.material=prior[i]);
     if(debug){
      const saved=[],temps=[];v.coach.traverse(m=>{if(!m.isMesh||!m.visible)return;const map={Coach_Body:[[0,0,1],[0,1,1]],Coach_Sneakers:[[1,0,0],[1,1,0]],Coach_Shoe_Details:[[0,1,0],[1,0,1]],Coach_Soles:[[1,.5,0],[.5,0,1]]};const [front,back]=map[m.name]||[[.4,.4,.4],[.2,.2,.2]];
       const mat=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide});mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight=gl_FrontFacing?vec3(${front.join(',')}):vec3(${back.join(',')});\n#include <opaque_fragment>`);};mat.customProgramCacheKey=()=>`shoe-id-${m.name}-r1`;mat.needsUpdate=true;saved.push([m,m.material]);temps.push(mat);m.material=mat;});
      try{R.setClearColor(0x000000,1);take('gpu-id-face');}finally{saved.forEach(([m,x])=>m.material=x);temps.forEach(x=>x.dispose());}}
    }finally{shoes.forEach((m,i)=>m.material=prior[i]);R.setClearColor(oldColor,oldAlpha);double.forEach(m=>m.dispose());}
    return {shots,r17Sides:prior.map(m=>m.side),frontSide:T.FrontSide,shoeFrontCompiles:window.__shoeFrontCompiles||0,otherSharedMaterialRefs:refs,candidateKeys,uniformAudit:window.__r17UniformAudit||[]};
   },[meta,state==='fold'&&direction==='mouth']));
   for(const [k,v] of Object.entries(result.shots))fs.writeFileSync(path.join(out,`${state}-${side}-${direction}-${k}.png`),Buffer.from(v.split(',')[1],'base64'),{flag:'wx'});delete result.shots;
   fs.writeFileSync(path.join(out,`${state}-${side}-${direction}-meta.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(state,side,direction);
  }
 }
}finally{await b.close();}
