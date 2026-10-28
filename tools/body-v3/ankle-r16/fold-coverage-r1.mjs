// Controlled fold view: sequential baseline and r16 scenes, same stored
// perspective cameras. Bright background and a white coverage override test
// whether dark regions contain visible geometry; front/back colors show face
// orientation. These are render diagnostics, never production materials.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const [out,reference]=process.argv.slice(2);if(!reference||!out||fs.existsSync(out))throw Error('provide NEW output dir and r16 compare directory');fs.mkdirSync(out,{recursive:true});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../drill-anim'),imp=f=>import(pathToFileURL(path.join(root,f)).href);
const {loadTheme}=await imp('lib/config.mjs'),spec=structuredClone((await imp('specs/a-seated-fold.js')).default);
spec.modelProfile='training-human-v2plus-hands-native';spec.nativeHands={version:'1.0.0-r3'};spec.v2plus={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',...(spec.v2plus||{})};
const ref=JSON.parse(fs.readFileSync(path.join(reference,'fold.json'))),views=[];
for(const side of ['left','right'])for(const mode of ['mouth','outer'])views.push([side,mode,JSON.parse(fs.readFileSync(path.join(reference,`fold-${side}-${mode}-meta.json`)))]);
const timed=async(label,fn,ms=90000)=>{let id;try{return await Promise.race([fn(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+label)),ms);})]);}finally{clearTimeout(id);}};
for(const [name,loaderName] of [['baseline','models/training-human-v3/loader.mjs'],['r16','models/body-v3-ankle-r16/loader.mjs']]){
 const loader=await imp(loaderName),{b,p}=await loader.boot({size:360,pr:1,theme:loadTheme()});
 try{
  await timed(name+' apply',()=>loader.applyV3(p,spec,{}));await p.addScriptTag({content:fs.readFileSync(path.join(root,'tools/v2/browser-layers.js'),'utf8')});
  await p.evaluate(([s,z])=>{__setHighlight(s.highlight||{groups:[]});__drill.setupCamera(s,z);__drill.selectModelProfile(s);},[spec,360]);
  console.log(name,'fold capture');await timed(name+' capture',()=>p.evaluate(s=>{__v2Layers.capture(s,0,0,null,[]);return null;},spec));
  const bones=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);const data={};for(const n of ['leftFoot','rightFoot','leftShin','rightShin'])data[n]=v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray();return data;});
  for(const n of Object.keys(bones))if(Math.hypot(...bones[n].map((x,i)=>x-ref.bones[n][i]))>1e-5)throw Error(name+' did not reproduce the reference fold pose');
  for(const [side,mode,meta] of views){
   const r=await timed(name+' '+side+' '+mode,()=>p.evaluate(([name,meta])=>{
    const T=__toonT,v=flareInspector.viewer,R=v.renderer,c=new T.PerspectiveCamera(22,1,.02,20);c.position.fromArray(meta.camera);c.lookAt(new T.Vector3().fromArray(meta.target));c.updateProjectionMatrix();
    const oldBg=v.scene.background,oldOverride=v.scene.overrideMaterial,oldColor=R.getClearColor(new T.Color()),oldAlpha=R.getClearAlpha(),shots={};
    const take=k=>{R.render(v.scene,c);shots[k]=R.domElement.toDataURL('image/png');};let coverage,orientation;
    try{v.scene.background=null;R.setClearColor(0x101318,1);take('normal');if(name==='r16'){
      R.setClearColor(0xff00ff,1);take('bright');
      coverage=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide});v.scene.overrideMaterial=coverage;take('coverage');
      orientation=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide});orientation.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=gl_FrontFacing?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);\n#include <opaque_fragment>');};orientation.customProgramCacheKey=()=> 'fold-face-orientation-debug-r1';v.scene.overrideMaterial=orientation;take('orientation');}}
    finally{v.scene.background=oldBg;v.scene.overrideMaterial=oldOverride;R.setClearColor(oldColor,oldAlpha);coverage?.dispose();orientation?.dispose();}
    return shots;
   },[name,meta]));
   for(const [kind,value] of Object.entries(r))fs.writeFileSync(path.join(out,`${name}-${side}-${mode}-${kind}.png`),Buffer.from(value.split(',')[1],'base64'),{flag:'wx'});
   console.log(name,side,mode);
  }
  fs.writeFileSync(path.join(out,name+'-bones.json'),JSON.stringify(bones,null,2)+'\n',{flag:'wx'});
 }finally{await b.close();}
}
