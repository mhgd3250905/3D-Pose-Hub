// Lightweight remote inspection only; never a production or full-cycle acceptance runner.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRecipe,MODEL,REPO,fingerprint,sampleActualRender,capturePlan} from './render-finalization-r8.mjs';
import {installCorrections} from './joint-corrections.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
import * as fixedCorrections from './fixed-wrist-corrections-r1.mjs';
import * as nativeActionHand from './native-action-hand-pose-r1.mjs';
import * as nativeActionHandR2 from './native-action-hand-pose-r2.mjs';
const nativeModules={'native-action-hand-pose-r1':nativeActionHand,'native-action-hand-pose-r2':nativeActionHandR2};
const fail=(ok,message)=>{if(!ok)throw Error(message);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const SELF=fileURLToPath(import.meta.url);
const ACTION_PROFILES={
  'native-action-hand-pose-r2':{version:'0.1.0-r2',specIds:nativeActionHandR2.SPEC_IDS,state:'__nativeActionHandPoseR2',adapter:'symmetric-native'},
  'mountain-airborne-foot-r1':{version:'0.1.0-r1',specId:'h-mountain-climber-r7',state:'__mountainFootFollowR1',adapter:'symmetric-native'},
  'mountain-airborne-foot-r2':{version:'0.1.0-r2',specId:'h-mountain-climber-r8',state:'__mountainFootFollowR2',adapter:'symmetric-native'},
  'fixed-band-handles-r1':{version:'0.1.0-r1',specId:'h-band-biceps-curl-r6',state:'__fixedBandHandlesR1',adapter:'webxr-dumbbell-wrist-r1'},
  'native-action-hand-pose-r1':{version:'0.1.0-r1',specIds:nativeActionHand.SPEC_IDS,state:'__nativeActionHandPoseR1',adapter:'symmetric-native'},
};
function actionProfile(spec,adapter){
  const a=spec.actionCorrective;if(!a)return null;const p=ACTION_PROFILES[a.id];
  fail(p&&a.version===p.version&&a.required===true&&(p.specIds?p.specIds.includes(spec.id):spec.id===p.specId)&&adapter===p.adapter,'Unsupported required action corrective');
  return {...p,id:a.id,file:a.id+'.mjs'};
}


export function parseArgs(args){
 const options={size:256,count:4};
 const flags={'--recipe':'recipeFile','--out':'out','--size':'size','--count':'count','--times':'times'};
 for(let i=0;i<args.length;i+=2){fail(flags[args[i]]&&args[i+1]&&!args[i+1].startsWith('--'),'Unknown or missing argument: '+args[i]);options[flags[args[i]]]=args[i+1];}
 fail(options.recipeFile&&options.out,'--recipe and --out are required');
 options.size=Number(options.size);options.count=Number(options.count);
 fail([256,320].includes(options.size),'Size must be 256 or 320');
 fail(Number.isInteger(options.count)&&options.count>=3&&options.count<=6,'Count must be 3..6');
 if(options.times!==undefined)options.times=String(options.times).split(',').map(Number);
 return options;
}
export function sampleTimes(duration,count=4,times){
 const result=times??Array.from({length:count},(_,i)=>duration*i/(count-1));
 fail(result.length>=3&&result.length<=6,'Provide 3..6 sampled times');
 fail(result.every((t,i)=>Number.isFinite(t)&&t>=0&&t<=duration&&(i===0||t>result[i-1])),'Times must be strictly increasing within the action duration');
 return result;
}
export function validateSetup(prepared){
 const a=prepared.handSetup.adapter;
 fail((prepared.recipe.jointCorrections??[]).every(c=>['upper-arm-contour-r3','ankle-join-r5','elbow-dqs-r1'].includes(c.profile)),'Remote runner supports only current r3/r5/DQS corrections');
 fail(['symmetric-native','webxr-dumbbell-wrist-r1'].includes(a),'Unsupported hand adapter');
 if(a==='webxr-dumbbell-wrist-r1'){
  fail(prepared.recipe.fixedCorrectionStack?.profile==='fixed-wrist-corrections-r1'&&prepared.recipe.fixedCorrectionStack.version==='0.1.0-r1','Fixed grip requires the explicit pinned composition');
  const elbow=prepared.recipe.fixedCorrectionStack.elbow===true;
  const want=['upper-arm-contour-r3','ankle-join-r5',...(elbow?['elbow-dqs-r1']:[])];
  fail(JSON.stringify(prepared.recipe.jointCorrections.map(x=>x.profile))===JSON.stringify(want),'Unsupported fixed correction order');
 }else fail(!prepared.recipe.fixedCorrectionStack,'Fixed stack on native recipe');
 return actionProfile(prepared.spec,a);
}
function memory(stage){const freeGiB=os.freemem()/1024**3;fail(freeGiB>=(stage==='start'?1.25:.5),'Low available memory at '+stage);return {stage,freeGiB};}
export async function run(options){
 const {recipeFile,out,size:pixelSize=256,count=4}=options;
 fail([256,320].includes(pixelSize),'Size must be 256 or 320');
 const prepared=await prepareRecipe(recipeFile);
 const corrective=validateSetup(prepared);
 if(nativeModules[corrective?.id]){prepared.spec=nativeModules[corrective.id].prepare(prepared.spec);prepared.handSetup={...prepared.handSetup,poses:{...prepared.spec.v2plus.handPose}};}
 const source=prepared.spec,cameraScale=prepared.cameraScale;
 if(corrective)source.reviewActionStateKey=corrective.state;
 capturePlan(source); // Validate fixed camera and explicit current model. No frame loop is run.
 const times=sampleTimes(source.timeline.duration,count,options.times);
 const root=path.resolve(out);fail(!fs.existsSync(root),'Output exists; choose a new directory');
 const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');
 const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
 const cfg=config();const lock=path.join(cfg.work_dir,'remote-keyframes-r1.lock');
 for(const name of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock'])fail(!fs.existsSync(path.join(cfg.work_dir,name)),'Active render lock: '+name);
 const states=[memory('start')];
 const pinned=fingerprint(prepared.specFile,prepared),runnerSha256=sha(fs.readFileSync(SELF));
 await model.verify();model.checkSpec(source);
 fs.mkdirSync(path.dirname(lock),{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out:root}),{flag:'wx'});
 let browser;
 const report={format:'pose-hub-remote-keyframes@1',sampledOnly:true,complete:false,userAccepted:false,releaseEligible:false,fullCycleValidated:false,
  recipeSha256:prepared.recipeSha256,sourceSha256:pinned.sha256,runnerSha256,model:MODEL,size:pixelSize,times,images:[],samples:[],pageErrors:[],states,
  limits:['Only listed keyframes are rendered; no continuity/loop/contact acceptance.','Camera fitting performs existing bounded CPU timeline samples, not full 30Hz capture.','Sparse solver warm starts can differ from continuous 30Hz solving.','No final content-rectangle union; no video encoding.']};
 try{
  fs.mkdirSync(root);const write=(name,value)=>fs.writeFileSync(path.join(root,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  fs.copyFileSync(prepared.recipeFile,path.join(root,'recipe.snapshot.json'),fs.constants.COPYFILE_EXCL);
  write('effective-spec.snapshot.json',source);write('source-manifest.json',pinned);
  const theme=loadTheme();const opened=await model.boot({size:pixelSize,pr:1,theme});browser=opened.b;const page=opened.p;
  page.on('pageerror',e=>report.pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&/shader|compiled|VALIDATE_STATUS/i.test(m.text()))report.pageErrors.push(m.text());});
  report.actualRuntime={platform:process.platform,node:process.version,browserVersion:browser.version(),...await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),contextLost:gl.isContextLost()};})};
  fail(!report.actualRuntime.contextLost,'WebGL context lost');
  report.playwrightModuleSha256=sha(fs.readFileSync(cfg.playwright_module));
  report.modelSetup=await model.applyV3(page,source);fail(report.modelSetup.profile===MODEL.profile&&report.modelSetup.version===MODEL.version,'Wrong installed model');
  if(source.renderAppearance?.highlight?.material)report.highlightMaterial=await page.evaluate(installHighlightMaterial,source.renderAppearance.highlight.material);
    if(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'){
      if(prepared.recipe.fixedCorrectionStack){
        const profiles=prepared.recipe.jointCorrections.map(c=>c.profile);
        const elbow=prepared.recipe.fixedCorrectionStack.elbow===true;
        fail((prepared.recipe.fixedCorrectionStack.elbow===undefined||typeof prepared.recipe.fixedCorrectionStack.elbow==='boolean')&&profiles.length===(elbow?3:2)&&profiles[0]==='upper-arm-contour-r3'&&profiles[1]==='ankle-join-r5'&&(!elbow||profiles[2]==='elbow-dqs-r1'),'Fixed stack requires explicit pinned component combination');
        report.fixedCorrectionSetup=await fixedCorrections.install(page,{upperArm:true,ankle:true,elbow,showDumbbells:prepared.handSetup.showDumbbells});
        report.wristSetup=report.fixedCorrectionSetup.wristSetup;
      }else{
        const wrist=await import('../body-v3/webxr-wrist-join-r1/loader.mjs');
        report.wristSetup=await wrist.install(page,{showDumbbells:prepared.handSetup.showDumbbells});
      }
      // Single-arm dumbbell actions: the accepted installer mounts a fist + dumbbell on both hands; hide the idle side's dumbbell only.
      const hide=prepared.recipe.fixedDumbbellsHidden??[];
      fail(Array.isArray(hide)&&hide.length<=1&&hide.every(s=>s==='left'||s==='right')&&(!hide.length||prepared.handSetup.showDumbbells),'Bad fixedDumbbellsHidden');
      if(hide.length)report.hiddenFixedDumbbells=await page.evaluate(sides=>{const v=flareInspector.viewer,out={};
        for(const side of sides){const g=v.scene.getObjectByName('WebXR_Fixed_Hand_'+side);if(!g)throw Error('no fixed hand group '+side);let k=0;
          g.traverse(o=>{if(o.isMesh&&!o.name.startsWith('WebXR_Clipped_Hand_')&&!/band/i.test(o.name)){o.visible=false;k++;}});out[side]=k;}return out;},hide);
      if(source.props?.some(p=>p.fixedDHandleGrasp!==undefined)){
        const dh=await import('./frozen-dhandle.mjs');report.frozenDHandleSetup=await dh.installFrozenDHandle(page);
      }
      if(source.props?.some(p=>p.fixedKettlebellGrasp==='webxr-dumbbell-fist')){
        const kettlebell=await import('./kettlebell-grip.mjs');
        report.kettlebellGripSetup=await kettlebell.installKettlebellGrip(page,{pose:'webxr-dumbbell-fist',models:[...new Set(source.props.filter(p=>p.fixedKettlebellGrasp!==undefined&&p.model).map(p=>p.model))]});
      }
    }else{
      const presets=await import('../../drill-anim/models/fixed-hand-presets-r1/loader.mjs');
      await presets.verify();const data=presets.data();
      if(Object.values(source.v2plus.handPose??{}).includes('grasp-32mm')){
        const grip=await import('../body-v3/armfix-r2/grip-symmetric-install.mjs');
        report.nativeGripSetup=await grip.installGrip(page,data.grasp);
      }
      if(source.props?.some(p=>p.fixedKettlebellGrasp!==undefined)){
        const kettlebell=await import('./kettlebell-grip.mjs');
        report.kettlebellGripSetup=await kettlebell.installKettlebellGrip(page,{models:[...new Set(source.props.filter(p=>p.fixedKettlebellGrasp!==undefined&&p.model).map(p=>p.model))]});
      }
      const supportNeeded=Object.values(prepared.handSetup.modes).includes('support');
      if(supportNeeded){const support=await import('../body-v3/armfix-r2/support-install.mjs');report.supportSetup=await support.installSupport(page,data.support,{sourceId:data.handSource});}
      report.restHandSetup=await page.evaluate(({rest,modes})=>{
        const V=__v2p,installed=[];
        if(Object.values(modes).includes('relaxed')){V.poses.relaxed=structuredClone(rest.relaxed);installed.push('relaxed');}
        if(Object.values(modes).includes('assist')){V.poses.open=structuredClone(rest.assist);installed.push('assist-as-open');}
        return {source:'fixed-hand-presets-r1',installed,status:'action-specific-review-pending'};
      },{rest:data.rest,modes:prepared.handSetup.modes});
    }
    if(!prepared.recipe.fixedCorrectionStack)report.jointCorrections=await installCorrections(page,prepared.recipe);
    else report.jointCorrections=prepared.recipe.jointCorrections;
    if(corrective){
      const module=await import(new URL(corrective.file,import.meta.url));
      report.actionCorrectiveSetup={id:corrective.id,...await module.install(page,source.actionCorrective)};
    }
    await page.evaluate(([s,th,size,scale])=>{
      const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};
      v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();
      v.scene.background=null;v.renderer.setClearColor(0x000000,0);
      for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;
      __setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;
      __toonUni.uSinkK.value=s.clothSink??1;
      for(const prop of s.props||[])__props.add(th,prop);
      if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}
      __drill.setupCamera(s,size);
      const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));
      v.motion.reset();
    },[source,theme,pixelSize,cameraScale]);

  await page.addScriptTag({content:'window.__remoteSampleActualRender='+sampleActualRender.toString()+';'});
  let warm=null;
  for(const [i,t]of times.entries()){
   states.push(memory('sample '+i));
   const value=await page.evaluate(([s,t,w])=>{
    const v=flareInspector.viewer,E=__drill,T=__toonT;
    const solved=E.applyAt(s,t,w);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));
    __toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);__glowU.value=0;
    const h=s.renderAppearance?.highlight;if(h){const pulse=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*pulse);__toonUni.uHiShade.value=h.shade.slice();}
    __props.update();v.coach.updateMatrixWorld(true);v.camera.position.copy(E.cam0.pos);v.camera.lookAt(E.cam0.tgt);v.camera.updateMatrixWorld();
    const before=window[s.reviewActionStateKey]?.last?.drawId??0;
    const actual=__remoteSampleActualRender(v,window.__webxrWristJoin,()=>({
     upperArm:window.__upperArmContourR3?.measure?.()??null,
     ankle:structuredClone(window.__ankleJoinR5?.last??null),elbow:structuredClone(window.__elbowDqsR1?.last??null),
     action:s.actionCorrective?.id.startsWith('native-action-hand-pose-')?window[s.reviewActionStateKey].verifyApplied():structuredClone(window[s.reviewActionStateKey]?.last??null)
    }));
    const a=actual.rotations.action;if(s.actionCorrective){if(s.actionCorrective.id.startsWith('native-action-hand-pose-')){if(a?.applied!==true)throw Error('Native hand alias not applied');}
     else if(s.actionCorrective.id==='fixed-band-handles-r1'){if(!a?.completed||!(a.drawId>before))throw Error('Band corrective not applied');}
     else if(!a||Math.abs(a.time-t)>1e-8)throw Error('Action corrective not applied');}
    const joints=v.motion.getMetrics().joints;if(!Object.values(joints).every(p=>!Array.isArray(p)||p.every(Number.isFinite)))throw Error('Non-finite joints');
    if(v.renderer.getContext().isContextLost())throw Error('WebGL context lost');
    return {x:solved.x,warn:solved.warn,joints,actual,fixedRestore:window.__fixedWristCorrectionsR1?.measure?.()??null,png:v.renderer.domElement.toDataURL('image/png')};
   },[source,t,warm]);
   fail(!report.pageErrors.length,'Browser/shader errors');warm=value.x;
   const bytes=Buffer.from(value.png.split(',')[1],'base64'),name='keyframe-'+String(i).padStart(2,'0')+'.png';
   fail(bytes.readUInt32BE(16)===pixelSize&&bytes.readUInt32BE(20)===pixelSize,'Wrong image size');fs.writeFileSync(path.join(root,name),bytes,{flag:'wx'});
   const {png,x,...sample}=value;report.samples.push({time:t,...sample});report.images.push({path:name,time:t,sha256:sha(bytes),bytes:bytes.length});
   console.log(JSON.stringify({event:'remote-keyframe',index:i,time:t}));
  }
  await model.verify();fail(fingerprint(prepared.specFile,prepared).sha256===pinned.sha256&&sha(fs.readFileSync(SELF))===runnerSha256,'Sources changed during run');
  report.complete=true;write('capture.json',report);return report;
 }catch(e){report.error=String(e);if(fs.existsSync(root))fs.writeFileSync(path.join(root,'failure.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});throw e;}
 finally{try{await browser?.close();}finally{fs.unlinkSync(lock);}}
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)run(parseArgs(process.argv.slice(2))).catch(e=>{console.error(e);process.exitCode=1;});
