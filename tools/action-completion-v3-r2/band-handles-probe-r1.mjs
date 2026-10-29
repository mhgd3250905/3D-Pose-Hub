// Focused handled-band diagnostic. No GPU work occurs when this module is imported.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {prepareRecipe,REPO,sha} from './recipe.mjs';
import {fingerprint,sampleActualRender} from './render-finalization-r1.mjs';
import {pinnedRuntime,verifyRuntimeSelection} from '../body-v3/armfix-r2/hand-qa-runtime.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
import * as fixed from './fixed-wrist-corrections-r1.mjs';
import * as handles from './fixed-band-handles-r1.mjs';
const fail=(ok,message)=>{if(!ok)throw Error(message);};
const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
export async function runProbe({recipeFile,runtimeFile,out,lane=1,frames=[0,54,120,180,240]}){
 fail([1,2].includes(lane),'Use lane 1 or 2');
 const root=path.resolve(out),allowed=path.resolve('F:/PoseHub-v2-production/template-finalization-20261029/probes');
 fail(root.startsWith(allowed+path.sep)&&!fs.existsSync(root),'Use a fresh subdirectory of '+allowed);
 fail(os.freemem()/1024**3>=3.5,'Available physical memory below 3.5 GiB');
 const prepared=await prepareRecipe(recipeFile),s=prepared.spec;
 fail(prepared.recipe.id==='h-band-biceps-curl'&&s.id==='h-band-biceps-curl-r6','This probe only accepts the handled-band r6 candidate');
 fail(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'&&!prepared.handSetup.showDumbbells,'Require fixed grasp with hidden dumbbells');
 fail(prepared.recipe.fixedCorrectionStack?.profile==='fixed-wrist-corrections-r1','Require fixed correction composition');
 fail(JSON.stringify(prepared.recipe.jointCorrections.map(x=>x.profile))===JSON.stringify(['upper-arm-contour-r3','ankle-join-r5']),'Unexpected correction stack');
 fail(frames.length>0&&frames.every(f=>Number.isInteger(f)&&f>=0&&f<=s.timeline.duration*30),'Invalid 30 FPS frame list');
 const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);
 const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
 const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');await model.verify();handles.verify();
 const pins=fingerprint(prepared.specFile,prepared),extras=[fileURLToPath(import.meta.url),path.join(REPO,'tools/action-completion-v3-r2/fixed-band-handles-r1.mjs'),path.join(REPO,'drill-anim/models/fixed-band-handles-r1/manifest.json'),path.join(REPO,'drill-anim/models/fixed-band-handles-r1/config.json')].map(file=>({path:path.relative(REPO,file).replaceAll('\\','/'),sha256:sha(fs.readFileSync(file))}));
 fs.mkdirSync(root,{recursive:true});write(path.join(root,'recipe.snapshot.json'),prepared.recipe);write(path.join(root,'effective-spec.snapshot.json'),s);write(path.join(root,'source-manifest.json'),{...pins,extras});
 const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});
 const report={format:'pose-hub-band-handles-probe@1',id:prepared.recipe.id,specId:s.id,lane,frames,sourceSha256:pins.sha256,recipeSha256:prepared.recipeSha256,complete:false,samples:[],pageErrors:[],reviewed:false,releaseEligible:false};let browser,owned=false;
 try{
  fs.writeFileSync(lock,JSON.stringify({pid:process.pid,operation:'band-handles-probe',out:root}),{flag:'wx'});owned=true;
  const temp=path.join(root,'work/browser-temp');fs.mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
  const theme=loadTheme(),opened=await model.boot({size:480,pr:1,theme});browser=opened.b;const page=opened.p;
  page.on('pageerror',e=>report.pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/shader|compiled|VALIDATE_STATUS/i.test(m.text()))report.pageErrors.push(m.text());});
  report.runtime=await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,contextLost:gl.isContextLost()};});
  fail(browser.version()===runtime.browserVersion&&report.runtime.renderer===runtime.actualWebGLRenderer&&!report.runtime.contextLost,'Actual browser/GPU differs from runtime pin');
  report.model=await model.applyV3(page,s);
  if(s.renderAppearance?.highlight?.material)report.highlight=await page.evaluate(installHighlightMaterial,s.renderAppearance.highlight.material);
  report.fixedCorrectionSetup=await fixed.install(page,{upperArm:true,ankle:true,elbow:false,showDumbbells:false});
  report.handles=await handles.install(page,s.actionCorrective);
  await page.addScriptTag({content:'window.__bandProbeSample='+sampleActualRender.toString()+';'});
  await page.evaluate(([s,theme,scale])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0xedf0f4,1);for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;__setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uSinkK.value=s.clothSink??1;for(const p of s.props||[])__props.add(theme,p);if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,480);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));v.motion.reset();},[s,theme,prepared.cameraScale]);
  const wanted=new Set(frames);let warm=null;
  for(let frame=0;frame<=Math.max(...frames);frame++){
   fail(os.freemem()/1024**3>=2,'Available physical memory below 2 GiB');
   const value=await page.evaluate(({s,frame,warm,capture})=>{
    const v=flareInspector.viewer,T=__toonT,E=__drill,t=frame/30,solved=E.applyAt(s,t,warm);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));__toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);
    if(s.renderAppearance?.highlight){const h=s.renderAppearance.highlight,p=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*p);__toonUni.uHiShade.value=h.shade.slice();}
    __props.update();v.coach.updateMatrixWorld(true);if(!capture)return {x:solved.x};
    const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();const views={},diagnostics={};
    function draw(name,camera){
     const before=__fixedBandHandlesR1.drawCount,oldCamera=v.camera;let actual;
     try{v.camera=camera;actual=__bandProbeSample(v,__webxrWristJoin,()=>({left:__webxrWristJoin.capture('left').diagnostics,right:__webxrWristJoin.capture('right').diagnostics}));}finally{v.camera=oldCamera;}
     const state=structuredClone(__fixedBandHandlesR1.last);if(!state?.completed||state.drawId<=before)throw Error('Handled-band hook did not complete for '+name);
     const restore=__fixedWristCorrectionsR1.measure();if(!restore.wristRestore?.positionsNormalsExact||!restore.wristRestore?.boneTransformsExact||!restore.wristRestore?.cacheExact)throw Error('Wrist restoration failed');
     views[name]={image:v.renderer.domElement.toDataURL('image/png'),position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov};diagnostics[name]={handles:state,restore,actualWrist:actual};return state;
    }
    const main=draw('main',v.camera);
    for(const side of ['left','right'])for(const view of ['front','back']){
     const group=v.coach.getObjectByName('fixed_band_handle_'+side),map=group.matrix.clone(),world=new T.Matrix4().fromArray(main.sides[side].handMatrixWorld).multiply(map),target=new T.Vector3(0,.07612368052316226,-.0075082223763424).applyMatrix4(world),dir=new T.Vector3(0,.2,view==='front'?1:-1).transformDirection(world),camera=new T.PerspectiveCamera(38,1,.01,20);
     camera.position.copy(target).addScaledVector(dir,.52);camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld();draw(side+'-'+view,camera);
    }
    return {x:solved.x,warnings:solved.warn,views,diagnostics};
   },{s,frame,warm,capture:wanted.has(frame)});warm=value.x;
   fail(!report.pageErrors.length,'Page errors: '+report.pageErrors.join('; '));
   if(wanted.has(frame)){
    const stem='frame-'+String(frame).padStart(4,'0'),views={};write(path.join(root,stem+'-contact.json'),value.diagnostics);
    for(const [name,v]of Object.entries(value.views)){const bytes=Buffer.from(v.image.split(',')[1],'base64'),file=stem+'-'+name+'.png';fail(bytes.readUInt32BE(16)===480&&bytes.readUInt32BE(20)===480,'Expected 480 px actual PNG');fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});const {image,...camera}=v;views[name]={file,sha256:sha(bytes),...camera};}
    report.samples.push({frame,time:frame/30,warnings:value.warnings,contact:stem+'-contact.json',views});console.log(JSON.stringify({event:'band-handles-probe-pose',frame}));
   }
  }
  await model.verify();handles.verify();fail(fingerprint(prepared.specFile,prepared).sha256===pins.sha256,'Sources changed during probe');for(const p of extras)fail(sha(fs.readFileSync(path.join(REPO,p.path)))===p.sha256,'Probe dependency changed');
  report.complete=true;write(path.join(root,'probe.json'),report);return report;
 }catch(error){write(path.join(root,'failed.json'),{error:String(error),stack:error.stack,report});throw error;}
 finally{if(browser)await browser.close();if(owned){const current=JSON.parse(fs.readFileSync(lock,'utf8'));if(current.pid===process.pid)fs.unlinkSync(lock);}}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),o={},allowed=new Set(['--recipe','--runtime','--out','--frames','--lane']);
 for(let i=0;i<args.length;i+=2){fail(allowed.has(args[i])&&args[i+1]&&!o[args[i]],'Expected unique --key value');o[args[i]]=args[i+1];}
 for(const key of ['--recipe','--runtime','--out'])fail(o[key],key+' required');
 await runProbe({recipeFile:o['--recipe'],runtimeFile:o['--runtime'],out:o['--out'],lane:Number(o['--lane']??1),frames:o['--frames']?o['--frames'].split(',').map(Number):undefined});
}
