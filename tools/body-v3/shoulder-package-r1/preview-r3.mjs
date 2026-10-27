// Fresh-page preview of the final P5 entry; no archived reference is needed.
// Only selected PNG frames are rendered. This is not a comparison or acceptance.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const [out,flag,values]=process.argv.slice(2);
if(!out||fs.existsSync(out)||(flag&&flag!=='--frames')||(flag&&!values))throw Error('Usage: node preview-r3.mjs <NEW output directory> [--frames 0.1,0.65,2,3.6]');
const frames=(values||'0.1,0.65,2,3.6').split(',').map(Number);
if(!frames.length||frames.some(t=>!Number.isFinite(t)||t<0||t>=8)||new Set(frames).size!==frames.length)throw Error('bear preview times must be unique seconds in [0,8)');
fs.mkdirSync(out,{recursive:true});const imp=f=>import(pathToFileURL(path.join(repo,f)).href);
const model=await imp('drill-anim/models/training-human-v3-shoulder-completed-r3/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs');
const spec={...structuredClone((await imp('drill-anim/specs/h-bear-plank.js')).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
async function timed(name,run){let id;console.log(name);try{return await Promise.race([run(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+name)),90000);})]);}finally{clearTimeout(id);}}
const {b,p}=await timed('boot',()=>model.boot({size:480,pr:1,theme:loadTheme()})),errors=[];p.on('pageerror',e=>errors.push(String(e)));
try{
 const setup=await timed('apply',()=>model.applyV3(p,spec));const report={profile:setup.profile,version:setup.version,baseVersion:setup.baseVersion,frames:[],pageErrors:errors,scope:'preview only; no reference comparisons or acceptance inferred'};
 for(const t of frames){
  await timed('pose '+t,()=>p.evaluate(([s,t])=>{__drill.selectModelProfile(s);__drill.applyAt(s,t,null);__setHighlight({groups:[],side:'both'});__glowU.value=0;__rimU.value=1;flareInspector.viewer.coach.updateMatrixWorld(true);},[spec,t]));
  for(const side of ['left','right'])for(const view of ['outer','front','back']){
   const filename=`t${String(t).replace('.','_')}-${side}-${view}.png`;
   const image=await timed(filename,()=>p.evaluate(([side,view])=>{const T=__toonT,v=flareInspector.viewer,point=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()),center=point(side+'UpperArm'),torso=point('torso'),pelvis=point('pelvis'),direction=center.clone().sub(torso).normalize(),up=torso.clone().sub(pelvis);up.addScaledVector(direction,-up.dot(direction)).normalize();const tangent=new T.Vector3().crossVectors(up,direction).normalize(),camera=new T.PerspectiveCamera(30,1,.02,20);camera.position.copy(center).addScaledVector(direction,.65).addScaledVector(tangent,view==='front'?.28:view==='back'?-.28:0);camera.up.copy(up);camera.lookAt(center);camera.updateProjectionMatrix();v.renderer.setClearColor(0x101318,1);v.renderer.render(v.scene,camera);return v.renderer.domElement.toDataURL('image/png');},[side,view]));
   fs.writeFileSync(path.join(out,filename),Buffer.from(image.split(',')[1],'base64'),{flag:'wx'});report.frames.push({t,side,view,file:filename});
  }
 }
 if(errors.length)throw Error('page errors: '+JSON.stringify(errors));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});
}finally{await b.close();}
