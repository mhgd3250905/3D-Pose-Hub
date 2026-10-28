// r16 fixed-view and highlight-mask comparison against r13 in the same scene.
// One reserved browser only; each image/pose step has a 90s timeout. r13 is
// reproduced by undoing only r16's front-face shader exception temporarily.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('provide a NEW output directory');fs.mkdirSync(out,{recursive:true});
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),root=path.join(repo,'drill-anim'),imp=f=>import(pathToFileURL(path.join(root,f)).href);
const loader=await imp('models/body-v3-ankle-r16/loader.mjs'),{loadTheme}=await imp('lib/config.mjs');
const spec0=async f=>{const s={...structuredClone((await imp('specs/'+f)).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}};s.v2plus={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',...(s.v2plus||{})};return s;};
const {b,p}=await loader.boot({size:360,pr:1,theme:loadTheme()});
const timed=async(label,fn,ms=90000)=>{let id;try{return await Promise.race([fn(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+label)),ms);})]);}finally{clearTimeout(id);}};
try{
 const stand=await spec0('h-squat.js');await timed('applyV3',()=>loader.applyV3(p,stand,{}));
 await p.evaluate(()=>{const material=flareInspector.viewer.coach.getObjectByName('Coach_Body').material,hook=material.onBeforeCompile,key=material.customProgramCacheKey();window.__r16CompileCount=0;window.__r13CompareCompileCount=0;
  material.onBeforeCompile=function(shader,renderer){hook.call(this,shader,renderer);if(!shader.fragmentShader.includes('float r16ankle=')||!shader.fragmentShader.includes('if(!gl_FrontFacing){lit=shc*0.8;fr=0.0;}'))throw Error('r16 compile instrumentation did not find its branch');window.__r16CompileCount++;};
  material.customProgramCacheKey=()=>key+'|r16-compile-audit';material.needsUpdate=true;});
 await p.addScriptTag({content:fs.readFileSync(path.join(root,'tools/v2/browser-layers.js'),'utf8')});
 // Reuse the original audit's geometry dump without altering its source.
 const src=fs.readFileSync(path.join(repo,'tools/body-v3/ankle-r16/jointpreview-r16.mjs'),'utf8');
 const h=src.match(/const H=`([\s\S]*?)`;\s*const b64big=`([\s\S]*?)`;/);
 if(!h)throw Error('cannot locate joint-audit browser helpers');
 await p.addScriptTag({content:h[1].replace('btoa(String.fromCharCode(...new Uint8Array(A.buffer)).slice(0))','__b64(new Uint8Array(A.buffer))')+h[2]});
 const states=[['rest',null,'front'],['squat','a-deep-squat-r3.js','back'],['plank','h-bear-plank.js','front'],['fold','a-seated-fold.js','mouth']];
 for(const [state,file,view] of states){
  const spec=file?await spec0(file):stand;
  await timed(state+' setup',()=>p.evaluate(([s,z])=>{__setHighlight(s.highlight||{groups:[]});__drill.setupCamera(s,z);__drill.selectModelProfile(s);},[spec,360]));
  if(file){console.log(state,'capture');await timed(state+' pose capture',()=>p.evaluate(s=>{__v2Layers.capture(s,0,0,null,[]);return null;},spec));}
  else await p.evaluate(()=>{flareInspector.viewer.motion.reset();for(const side of ['left','right'])__v2p.setHandPose(side,'relaxed');});
  const signature=()=>p.evaluate(async()=>{const v=flareInspector.viewer;v.coach.updateMatrixWorld(true);const meshes={};
   const digest=async attr=>{if(!attr)return null;const bytes=new Uint8Array(attr.array.buffer,attr.array.byteOffset,attr.array.byteLength);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');};
   for(const name of ['Coach_Body','Coach_Sneakers','Coach_Shoe_Details']){const m=v.coach.getObjectByName(name);if(m?.geometry)meshes[name]={position:await digest(m.geometry.attributes.position),skinIndex:await digest(m.geometry.attributes.skinIndex),skinWeight:await digest(m.geometry.attributes.skinWeight)};}
   const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push({name:o.name,parent:o.parent?.name||null,local:o.matrix.toArray(),world:o.matrixWorld.toArray()});});return {meshes,bones};});
  const before=await timed(state+' signature before',signature);
  console.log(state,'geometry');const geometry=await timed(state+' geometry',()=>p.evaluate(()=>__dump()));fs.writeFileSync(path.join(out,state+'.json'),JSON.stringify(geometry),{flag:'wx'});
  const views=state==='fold'?[['left','mouth'],['left','outer'],['right','mouth'],['right','outer']]:[['left',view],['right',view]];
  if(state==='squat'||state==='plank')views.push(['whole','action']);
  for(const [side,direction] of views){
   const result=await timed(state+' '+side+' '+direction,()=>p.evaluate(([side,direction])=>{
    const T=__toonT,v=flareInspector.viewer,body=v.coach.getObjectByName('Coach_Body'),r16=body.material,hook=r16.onBeforeCompile,key=r16.customProgramCacheKey(),r13=r16.clone();
    r13.onBeforeCompile=function(shader,renderer){hook.call(this,shader,renderer);
     const marker='if(!gl_FrontFacing){lit=shc*0.8;fr=0.0;}\n      else if(abs(dot(fN,V))>0.45&&dot(Nn,V)<0.15){lit=mix(shc*0.8,lit,r16ankle);fr*=r16ankle;}';
     if(!shader.fragmentShader.includes(marker))throw Error('cannot restore r13 branch for comparison');
     shader.fragmentShader=shader.fragmentShader.replace(marker,'if(!gl_FrontFacing||(abs(dot(fN,V))>0.45&&dot(Nn,V)<0.15)){lit=shc*0.8;fr=0.0;}');window.__r13CompareCompileCount++;};
    r13.customProgramCacheKey=()=>key+'|reference-r13';r13.needsUpdate=true;v.coach.updateMatrixWorld(true);
    let center=null,camera;
    if(direction==='action')camera=v.camera;
    else {const foot=v.coach.getObjectByName(side+'Foot');center=foot.getWorldPosition(new T.Vector3());const dir=new T.Vector3();
     if(direction==='front'||direction==='back'){dir.set(0,0,1).applyQuaternion(v.coach.getObjectByName('pelvis').getWorldQuaternion(new T.Quaternion()));dir.y=0;dir.normalize();if(direction==='back')dir.negate();}
     else {const shin=v.coach.getObjectByName(side+'Shin').getWorldPosition(new T.Vector3()),up=shin.sub(center).normalize(),outer=new T.Vector3(side==='left'?1:-1,0,0).applyQuaternion(foot.getWorldQuaternion(new T.Quaternion()));outer.addScaledVector(up,-outer.dot(up)).normalize();if(outer.lengthSq()<.5)throw Error('degenerate outer-foot camera');center.addScaledVector(up,.03);dir.copy(outer).multiplyScalar(direction==='mouth'?.6:1).addScaledVector(up,direction==='mouth'?.8:.15).normalize();}
     camera=new T.PerspectiveCamera(22,1,.02,20);camera.position.copy(center).addScaledVector(dir,.42);if(direction==='front'||direction==='back')camera.position.y+=.04;camera.lookAt(center);camera.updateProjectionMatrix();}
    const origGlow=__toonUni.uGlow.value,shots={},R=v.renderer;R.setClearColor(0x101318,1);const take=n=>{R.render(v.scene,camera);shots[n]=R.domElement.toDataURL('image/png');};
    try{body.material=r16;take('r16');__toonUni.uGlow.value=6;take('r16-highlight');__toonUni.uGlow.value=origGlow;body.material=r13;take('r13');__toonUni.uGlow.value=6;take('r13-highlight');}
    finally{__toonUni.uGlow.value=origGlow;body.material=r16;r13.dispose();}
    return {shots,camera:camera.position.toArray(),target:center?.toArray()||null,highlightSelection:__mmUni.uSelN.value};
   },[side,direction]));
   for(const [k,value] of Object.entries(result.shots))fs.writeFileSync(path.join(out,`${state}-${side}-${direction}-${k}.png`),Buffer.from(value.split(',')[1],'base64'),{flag:'wx'});
   delete result.shots;fs.writeFileSync(path.join(out,`${state}-${side}-${direction}-meta.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(state,side,direction);
  }
  const after=await timed(state+' signature after',signature);if(JSON.stringify(before)!==JSON.stringify(after))throw Error(state+' geometry/skin/bone signature changed while comparing shaders');
  fs.writeFileSync(path.join(out,`${state}-signature.json`),JSON.stringify({before,after,identical:true},null,2)+'\n',{flag:'wx'});
 }
 const compilation=await p.evaluate(()=>({r16:window.__r16CompileCount,r13Reference:window.__r13CompareCompileCount}));if(!compilation.r16||!compilation.r13Reference)throw Error('expected shader variants did not both compile');
 fs.writeFileSync(path.join(out,'shader-compilation.json'),JSON.stringify(compilation,null,2)+'\n',{flag:'wx'});
}finally{await b.close();}
