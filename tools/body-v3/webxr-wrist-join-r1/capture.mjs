import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {imp,pinnedRuntime,verifyRuntimeSelection,saveJson,saveImage,initView} from '../armfix-r2/hand-qa-runtime.mjs';
import {install} from './loader.mjs';

const [out,runtimeFile,recipePath,mode='pilot']=process.argv.slice(2);
if(!out||!runtimeFile||!recipePath||fs.existsSync(out))throw Error('New output, pinned runtime and recipe required');
const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);fs.mkdirSync(out,{recursive:true});
const sourceFiles=['capture.mjs','loader.mjs','runtime.js'].map(name=>{const file=fileURLToPath(new URL(name,import.meta.url)),bytes=fs.readFileSync(file);fs.writeFileSync(path.join(out,'source-'+name),bytes,{flag:'wx'});return {file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
const model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs');
const spec={modelProfile:'training-human-v2plus-hands-native',nativeHands:{twistShare:.5},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'},props:[]};
const {b,p}=await model.boot({size:900,pr:1,theme:loadTheme()});
const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await model.applyV3(p,spec);await initView(p);
 const installed=await install(p,{recipePath});
 const gpu=await p.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(x.UNMASKED_RENDERER_WEBGL);});
 if(gpu!==runtime.actualWebGLRenderer)throw Error('GPU differs from pinned runtime');
 const refs=await p.evaluate(()=>{const a=__webxrWristJoin;a.setDiagnosticPose(0,0);return a.sample(()=>Object.fromEntries(['left','right'].map(s=>[s,a.reference(s)])));});
 for(const side of ['left','right'])saveJson(path.join(out,'reference-'+side+'.json'),refs[side]);
 const commands=mode==='grid'?[...[0,-60,60].flatMap(twistDeg=>[0,-30,30,-60,60,-75,75].map(flexDeg=>({flexDeg,twistDeg}))),{flexDeg:0,twistDeg:0,repeatOf:'flex-0-twist-0'},{flexDeg:60,twistDeg:60,repeatOf:'flex-60-twist-60'}]:[{flexDeg:0,twistDeg:0},{flexDeg:60,twistDeg:0},{flexDeg:-60,twistDeg:0},{flexDeg:0,twistDeg:0,repeatOf:'flex-0-twist-0'}];
 const skin=await p.evaluate(()=>({state:__v2p.skinState?.(),base:__toonUni.uBase.value[0],shade:__toonUni.uShadeC.value[0],regionGrey:__v2p.regions?.uni?.uV2pRGrey?.value,regionShade:__v2p.regions?.uni?.uV2pRShade?.value,regionTint:__v2p.regions?.uni?.uV2pRTint?.value}));
 const report={format:'webxr-wrist-gpu-capture@1',gpu,installed,mode,skin,sourceFiles,references:{left:'reference-left.json',right:'reference-right.json'},rows:[],errors};
 for(const command of commands){
  const name=`flex-${command.flexDeg}-twist-${command.twistDeg}${command.repeatOf?'-repeat':''}`;
  const sample=await p.evaluate(c=>{const a=__webxrWristJoin;a.setDiagnosticPose(c.flexDeg,c.twistDeg);const result=a.sample(()=>a.capture());return {...result,capturedAt:'scene.onAfterRender',command:c,restoreCheck:a.lastRestoreCheck};},command);
  saveJson(path.join(out,name+'.json'),sample);report.rows.push({name,file:name+'.json',command,...(command.repeatOf?{repeatOf:command.repeatOf}:{})});
  if(!command.repeatOf&&(mode==='pilot'||command.twistDeg===0)){
   const pictures=await p.evaluate(refs=>{
    const a=__webxrWristJoin,v=flareInspector.viewer,T=__toonT,images={},visible=[];
    v.scene.traverse(o=>{if(o.isMesh)visible.push([o,o.visible]);});
    try{for(const side of ['left','right']){
     for(const [o,on]of visible)o.visible=on&&(o===a.meshes.limbs||o===a.meshes.hands[side]||o===a.meshes.bridges[side]);
     const hand=v.coach.getObjectByName(side+'Hand'),sign=side==='left'?1:-1,q=hand.getWorldQuaternion(new T.Quaternion());
     // Neutral bone frame holds the camera still while the hand flexes.
     const ref=refs[side],m=new T.Matrix4().fromArray(ref.neutralHandWorld||ref.handMatrixWorld),basis=new T.Quaternion().setFromRotationMatrix(m),center=new T.Vector3(sign*.025,0,0).applyMatrix4(m);
     for(const [view,d]of [['palm',[0,-1,.08]],['back',[0,1,.08]],['edge',[0,0,1]],['oblique',[.25,-.6,1]]]){
      const c=new T.OrthographicCamera(-.19,.19,.19,-.19,.01,10);c.position.copy(center).add(new T.Vector3(...d).applyQuaternion(basis));c.up.set(sign,0,0).applyQuaternion(basis);c.lookAt(center);c.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,c);images[side+'-'+view]=v.renderer.domElement.toDataURL('image/png');
     }
     for(const [o,on]of visible)if(o.name?.startsWith('wrist_join_'+side+'_'))o.visible=on;
     const c=new T.OrthographicCamera(-.22,.22,.22,-.22,.01,10);c.position.copy(center).add(new T.Vector3(.25,-.6,1).applyQuaternion(basis));c.up.set(sign,0,0).applyQuaternion(basis);c.lookAt(center);c.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,c);images[side+'-dumbbell']=v.renderer.domElement.toDataURL('image/png');
    }}finally{for(const [o,on]of visible)o.visible=on;}
    return images;
   },refs);
   for(const [view,uri]of Object.entries(pictures))saveImage(path.join(out,name+'-'+view+'.png'),uri);
   if(command.flexDeg===0){const uri=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer,c=new T.OrthographicCamera(-1,1,1,-1,.01,10);c.position.set(1.7,1.2,3.7);c.up.set(0,1,0);c.lookAt(0,.9,0);c.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,c);return v.renderer.domElement.toDataURL('image/png');});saveImage(path.join(out,name+'-body.png'),uri);}
  }
  console.log(JSON.stringify({name,restore:sample.restoreCheck,diagnostics:Object.fromEntries(Object.entries(sample.sides).map(([s,d])=>[s,d.diagnostics]))}));
 }
 const detach=await p.evaluate(()=>__webxrWristJoin.detach());report.detach=detach;
 saveJson(path.join(out,'report.json'),report);
 if(errors.length)throw Error('Browser errors: '+errors.join('\n'));
 console.log(JSON.stringify({output:out,samples:report.rows.length,gpu,detach}));
}finally{await b.close();}
