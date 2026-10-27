// Usage: node verify-wrist-head-neck-r1.mjs reference|combined NEW_OUTPUT_DIR
// Run reference then combined serially, one browser in the whole machine slot.
import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath,pathToFileURL} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'), [mode,out]=process.argv.slice(2);
if(!['reference','combined'].includes(mode)||!out||fs.existsSync(out))throw Error('expected reference|combined and a new output directory');fs.mkdirSync(out);
const imp=f=>import(pathToFileURL(path.join(repo,f)).href), {loadTheme}=await imp('drill-anim/lib/config.mjs');
const wrapper=await imp(mode==='reference'?'drill-anim/models/training-human-v3-head-neck-r2/loader.mjs':'drill-anim/models/training-human-v3-wrist-head-neck-r2/loader.mjs');
const source=structuredClone((await imp('drill-anim/specs/h-squat.js')).default);
const base={...source,modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
let deadline;function stage(name){clearTimeout(deadline);console.log(new Date().toISOString(),'stage:',name);deadline=setTimeout(()=>{console.error(new Date().toISOString(),'stage timeout:',name);process.exit(2);},90000);}
stage('boot');const {b,p}=await wrapper.boot({size:420,pr:1,theme:loadTheme()}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.text().startsWith('DIAG '))console.log(new Date().toISOString(),m.text());});
const script=`window.__wristHeadNeckShot=(kind)=>{const T=__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);let c;if(kind==='neck'){const n=v.coach.getObjectByName('neck').getWorldPosition(new T.Vector3()), target=n.clone().add(new T.Vector3(0,.10,0));c=new T.PerspectiveCamera(35,1,.02,20);c.position.copy(target).add(new T.Vector3(.8,0,0));c.lookAt(target);}else{const h=v.coach.getObjectByName(kind+'Hand'),hf=(x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(h.matrixWorld);c=new T.PerspectiveCamera(22,1,.02,20);c.position.copy(hf(-.005,.32,0));c.up.copy(hf(-1,0,0).sub(hf(0,0,0)));c.lookAt(hf(-.005,0,0));}c.updateProjectionMatrix();v.renderer.setClearColor(0x101318,1);console.log('DIAG render begin '+kind+' programs='+v.renderer.info.programs.length);v.renderer.render(v.scene,c);console.log('DIAG render end '+kind+' programs='+v.renderer.info.programs.length);console.log('DIAG png begin '+kind);const url=v.renderer.domElement.toDataURL('image/png');console.log('DIAG png end '+kind);return url;};`;
const save=async name=>{stage('shot '+name);const data=await p.evaluate(k=>__wristHeadNeckShot(k),name.split('-').at(-1));fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'),{flag:'wx'});};
try{
 stage('GPU info');const gpu=await p.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR)};});console.log('GPU:',JSON.stringify(gpu));
 stage('apply');const setup=await wrapper.applyV3(p,base,{handDir:'hands-native-c1r2'});await p.addScriptTag({content:script});const report={mode,setup,gpu,cases:[],pageErrors:errors};
 const cases=[['long-flex','long',[1,0,0],40],['short-flex','short',[1,0,0],40],['long-ext','long',[1,0,0],-35],['long-rot','long',[0,1,0],65]];
 for(const [name,sleeve,axis,deg] of cases){
  stage('profile '+name); const spec={...base,v2plus:{...base.v2plus,sleeve}};await p.evaluate(s=>{__drill.selectModelProfile(s);},spec);
  stage('pose '+name); const state=await p.evaluate(([axis,deg,mode,sleeve])=>{
   const T=__toonT,v=flareInspector.viewer;v.motion.reset();for(const side of ['left','right'])__v2p.setHandPose(side,'relaxed');
   const nk=v.coach.getObjectByName('neck'),pivot=nk.getWorldPosition(new T.Vector3()),axw=new T.Vector3(...axis).applyQuaternion(v.coach.getObjectByName('torso').getWorldQuaternion(new T.Quaternion()));
   for(const [name,f] of [['neck',.5],['head',1]]){const bn=v.coach.getObjectByName(name),q=new T.Quaternion().setFromAxisAngle(axw,deg*f*Math.PI/180),wp=bn.getWorldPosition(new T.Vector3()).sub(pivot).applyQuaternion(name==='head'?new T.Quaternion().setFromAxisAngle(axw,deg*.5*Math.PI/180):q).add(pivot),wq=q.clone().multiply(bn.getWorldQuaternion(new T.Quaternion())),pq=bn.parent.getWorldQuaternion(new T.Quaternion()).invert();bn.position.copy(bn.parent.worldToLocal(wp));bn.quaternion.copy(pq.multiply(wq));bn.updateMatrixWorld(true);}
   v.coach.updateMatrixWorld(true);const q=window.__v3HeadNeckFragment,m=q.fragment.mesh,g=m.geometry,index=g.index.array,sets=g.groups.map(x=>new Set(index.slice(x.start,x.start+x.count))),common=[...sets[0]].filter(i=>sets[1].has(i));
   const h=__v2p.hands.mesh,patched=!!h.material.userData.bodyV3WristGradientR2;
   if(!m.visible||q.neck.visible||q.head.visible||common.length!==162||!__v2p.hands.on||patched!==(mode==='combined')||__v2p.uni.uV2pOut.value!==1||__v2p.uni.uV2pSleeve.value!==(sleeve==='short'?1:0))throw Error('combined state mismatch');
   return {seamVertices:common.length,fragmentVisible:m.visible,originalNeckVisible:q.neck.visible,originalHeadVisible:q.head.visible,handsOn:__v2p.hands.on,wristHook:patched,sleeve:__v2p.uni.uV2pSleeve.value,outfit:__v2p.uni.uV2pOut.value};
  },[axis,deg,mode,sleeve]);
  for(const view of ['neck','left','right'])await save(name+'-'+view);report.cases.push({name,sleeve,angleDeg:deg,...state});
 }
 if(mode==='combined'){
  stage('duplicate guard');let rejected=false;try{await wrapper.applyV3(p,base,{handDir:'hands-native-c1r2'});}catch(e){if(!/already installed/.test(e.message))throw e;rejected=true;}if(!rejected)throw Error('duplicate installation accepted');report.duplicateRejected=true;
 }
 stage('detach');await p.evaluate(()=>{const q=window.__v3HeadNeckFragment,m=q.fragment.mesh,s=m.skeleton;s.update();window.__lifecycleSnapshot={mesh:m,skeleton:s,bones:s.bones.slice(),matrices:Array.from(s.boneMatrices),select:q.originalSelect};});
 report.detached=await (mode==='combined'?wrapper.detachHeadNeck(p):wrapper.detach(p));
 report.lifecycle=await p.evaluate(mode=>{const x=window.__lifecycleSnapshot,s=x.skeleton;s.update();const sameBones=s.bones.length===x.bones.length&&s.bones.every((b,i)=>b===x.bones[i]),sameMatrices=s.boneMatrices.every((n,i)=>n===x.matrices[i]);const wristHook=!!__v2p.hands.mesh.material.userData.bodyV3WristGradientR2;return {fragmentGone:!window.__v3HeadNeckFragment,meshDetached:x.mesh.parent===null,profileRestored:__drill.selectModelProfile===x.select,sameBones,sameMatrices,wristHook};},mode);
 if(!report.detached||!report.lifecycle.fragmentGone||!report.lifecycle.meshDetached||!report.lifecycle.profileRestored||!report.lifecycle.sameBones||!report.lifecycle.sameMatrices||report.lifecycle.wristHook!==(mode==='combined'))throw Error('detach lifecycle mismatch: '+JSON.stringify(report.lifecycle));
 if(mode==='combined'){
  stage('reapply after detach');let rejected=false;try{await wrapper.applyV3(p,base,{handDir:'hands-native-c1r2'});}catch(e){if(!/already installed/.test(e.message))throw e;rejected=true;}
  if(!rejected||await p.evaluate(()=>!!window.__v3HeadNeckFragment))throw Error('unsafe reapply after partial detach');report.reapplyAfterPartialDetachRejected=true;
 }
 if(errors.length)throw Error('page errors: '+errors.join('; '));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});
}finally{clearTimeout(deadline);await b.close();}
