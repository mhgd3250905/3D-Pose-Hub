import fs from 'node:fs';import path from 'node:path';
import {imp,readJson,pinnedRuntime,verifyRuntimeSelection,saveJson,saveImage,sourcePins,initView} from './hand-qa-runtime.mjs';
import {installWristDiagnosticInPage} from './wrist-diagnostic-runtime.mjs';
const [out,runtimeFile,mode='baseline',shareArg='0']=process.argv.slice(2);
if(!out||!runtimeFile||!['baseline','candidate'].includes(mode)||!['0','0.5'].includes(shareArg)||fs.existsSync(out))throw Error('Usage: wrist-diagnostic-preview.mjs <NEW out> <runtime.json> [baseline|candidate] [0|0.5]');
const rt=pinnedRuntime(runtimeFile),share=Number(shareArg);const runtimeSelection=await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs');
const spec={modelProfile:'training-human-v2plus-hands-native',nativeHands:{twistShare:share},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'},props:[]};
const {b,p}=await model.boot({size:640,pr:1,theme:loadTheme()});
const report={format:'pose-hub-wrist-bend-grid@1',mode,twistShare:share,runtimeSelection,sourcePins:sourcePins(),reviewed:false,releaseEligible:false,rows:[],limits:['Rest-pose arm, open fingers; isolated wrist flexion and axial twist. Not full action acceptance.','Area and edge ratios detect severe collapse/stretch; they do not by themselves prove absence of self-intersection.','Samples captured inside scene.onAfterRender before render-time twist/corrective restoration.']};
try{
 report.gpu=await p.evaluate(()=>{const g=flareInspector.viewer.renderer.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);});if(report.gpu!==rt.actualWebGLRenderer)throw Error('GPU mismatch');
 report.setup=await model.applyV3(p,spec);await initView(p);
 if(mode==='candidate'){const fix=await imp('drill-anim/models/hand-wrist-corrective-r1/loader.mjs');report.corrective=await fix.install(p,{enabled:true});}
 report.diagnostic=await p.evaluate(installWristDiagnosticInPage,{seam:readJson('drill-anim/models/hands-native-c1r2-symmetric-r1/hands-base.json').seam,limbSeam:readJson('drill-anim/models/training-human-v2plus-limbs-base.json').seam});
 const source=await p.evaluate(()=>({index:__wristDiagnostic.index,sides:__wristDiagnostic.sides,rest:__wristDiagnostic.rest,limbs:__wristDiagnostic.limbs}));saveJson(path.join(out,'mesh-reference.json'),source);
 for(const twist of [0,-60,60])for(const flex of [-75,-60,-45,-30,0,30,45,60,75]){
  const name='flex-'+flex+'-twist-'+twist;
  const result=await p.evaluate(({flex,twist})=>{const v=flareInspector.viewer,T=__toonT;__wristDiagnostic.pose(flex,twist);v.renderer.clear(true,true,true);v.renderer.render(v.scene,v.camera);const sample=structuredClone(__wristDiagnostic.last),images={};sample.restoreCheck=__wristDiagnostic.assertRestored();
   if(twist===0&&[-75,-60,0,60,75].includes(flex))for(const side of ['left','right']){
    const hand=v.coach.getObjectByName(side+'Hand'),origin=hand.getWorldPosition(new T.Vector3()),sign=side==='left'?1:-1;
    // Stable world views around the wrist so pinching is not hidden by following the bent hand.
    for(const [view,d]of [['front',[0,0,1]],['side',[sign,0,0]],['back',[0,0,-1]]]){const camera=new T.OrthographicCamera(-.11,.11,.11,-.11,.01,5);camera.position.copy(origin).add(new T.Vector3(...d));camera.up.set(0,1,0);camera.lookAt(origin);camera.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,camera);__wristDiagnostic.assertRestored();images[side+'-'+view]=v.renderer.domElement.toDataURL('image/png');}
   }
   return {sample,images};},{flex,twist});
  saveJson(path.join(out,name+'.json'),result.sample);for(const [label,uri]of Object.entries(result.images))saveImage(path.join(out,name+'-'+label+'.png'),uri);
  report.rows.push({name,command:result.sample.command,frames:result.sample.frames,seam:result.sample.seam,restoreCheck:result.sample.restoreCheck});console.log(name);
 }
 saveJson(path.join(out,'report.json'),report);await p.evaluate(()=>__wristDiagnostic.detach());console.log(JSON.stringify({out,mode,share,rows:report.rows.length}));
}catch(error){saveJson(path.join(out,'failure.json'),{error:String(error),stack:error.stack,report});throw error;}finally{await b.close();}
