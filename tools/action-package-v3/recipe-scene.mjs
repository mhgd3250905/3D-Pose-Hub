// Recipe -> live browser scene, shared by every v3 package step.
// The install chain is the one remote-keyframes-r1.mjs uses for review (armfix model,
// fixed/native hands, joint corrections, wrist corrective, action correctives, props,
// fixed camera). It is copied here, not imported, so the frozen review runner and its
// recorded runner hash stay untouched. Model loading goes through model-adapters.mjs.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRecipe,fingerprint,capturePlan,REPO} from '../action-completion-v3-r2/render-finalization-r8.mjs';
import {validateSetup} from '../action-completion-v3-r2/remote-keyframes-r1.mjs';
import {installCorrections} from '../action-completion-v3-r2/joint-corrections.mjs';
import {installHighlightMaterial} from '../action-completion-v3-r2/highlight-material.mjs';
import * as fixedCorrections from '../action-completion-v3-r2/fixed-wrist-corrections-r1.mjs';
import * as nativeActionHand from '../action-completion-v3-r2/native-action-hand-pose-r1.mjs';
import * as nativeActionHandR2 from '../action-completion-v3-r2/native-action-hand-pose-r2.mjs';
import {resolveModel,checkModelCompatibility} from './model-adapters.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const V3=path.resolve(HERE,'../action-completion-v3-r2');
const nativeModules={'native-action-hand-pose-r1':nativeActionHand,'native-action-hand-pose-r2':nativeActionHandR2};
export const fail=(ok,message)=>{if(!ok)throw Error(message);};
export function freeGiB(){return os.freemem()/1024**3;}

/** Read and validate a recipe without a browser. Returns everything a frame plan needs. */
export async function loadRecipe(recipeFile,{model}={}){
  const prepared=await prepareRecipe(recipeFile);
  const corrective=validateSetup(prepared);
  if(nativeModules[corrective?.id]){prepared.spec=nativeModules[corrective.id].prepare(prepared.spec);prepared.handSetup={...prepared.handSetup,poses:{...prepared.spec.v2plus.handPose}};}
  const source=prepared.spec;
  if(corrective)source.reviewActionStateKey=corrective.state;
  capturePlan(source); // fixed camera + explicit model checks
  const adapter=resolveModel(model,prepared.recipe);
  return {prepared,corrective,source,adapter,pinned:fingerprint(prepared.specFile,prepared)};
}

/** Boot the model, install every recipe component and set the fixed camera. */
export async function openScene(loaded,{size,theme,report}){
  const {prepared,corrective,source,adapter}=loaded;
  const model=await import(pathToFileURL(path.join(REPO,adapter.loader)));
  await model.verify();model.checkSpec(source);
  const opened=await model.boot({size,pr:1,theme});const browser=opened.b,page=opened.p;
  page.on('pageerror',e=>report.pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&/shader|compiled|VALIDATE_STATUS/i.test(m.text()))report.pageErrors.push(m.text());});
  try{
    report.actualRuntime={platform:process.platform,node:process.version,browserVersion:browser.version(),...await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),contextLost:gl.isContextLost()};})};
    fail(!report.actualRuntime.contextLost,'WebGL context lost');
    report.modelSetup=await model.applyV3(page,source);
    fail(report.modelSetup.profile===adapter.profile&&report.modelSetup.version===adapter.version,'Wrong installed model');
    report.rigCompatibility=await checkModelCompatibility(page,adapter);
    if(source.renderAppearance?.highlight?.material)report.highlightMaterial=await page.evaluate(installHighlightMaterial,source.renderAppearance.highlight.material);
    if(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'){
      if(prepared.recipe.fixedCorrectionStack){
        const elbow=prepared.recipe.fixedCorrectionStack.elbow===true;
        report.fixedCorrectionSetup=await fixedCorrections.install(page,{upperArm:true,ankle:true,elbow,showDumbbells:prepared.handSetup.showDumbbells});
        report.wristSetup=report.fixedCorrectionSetup.wristSetup;
      }else{
        const wrist=await import('../body-v3/webxr-wrist-join-r1/loader.mjs');
        report.wristSetup=await wrist.install(page,{showDumbbells:prepared.handSetup.showDumbbells});
      }
      const hide=prepared.recipe.fixedDumbbellsHidden??[];
      fail(Array.isArray(hide)&&hide.length<=1&&hide.every(s=>s==='left'||s==='right')&&(!hide.length||prepared.handSetup.showDumbbells),'Bad fixedDumbbellsHidden');
      if(hide.length)report.hiddenFixedDumbbells=await page.evaluate(sides=>{const v=flareInspector.viewer,out={};
        for(const side of sides){const g=v.scene.getObjectByName('WebXR_Fixed_Hand_'+side);if(!g)throw Error('no fixed hand group '+side);let k=0;
          g.traverse(o=>{if(o.isMesh&&!o.name.startsWith('WebXR_Clipped_Hand_')&&!/band/i.test(o.name)){o.visible=false;k++;}});out[side]=k;}return out;},hide);
      if(source.props?.some(p=>p.fixedDHandleGrasp!==undefined)){
        const dh=await import(pathToFileURL(path.join(V3,'frozen-dhandle.mjs')));report.frozenDHandleSetup=await dh.installFrozenDHandle(page);
      }
      if(source.props?.some(p=>p.fixedKettlebellGrasp==='webxr-dumbbell-fist')){
        const kettlebell=await import(pathToFileURL(path.join(V3,'kettlebell-grip.mjs')));
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
        const kettlebell=await import(pathToFileURL(path.join(V3,'kettlebell-grip.mjs')));
        report.kettlebellGripSetup=await kettlebell.installKettlebellGrip(page,{models:[...new Set(source.props.filter(p=>p.fixedKettlebellGrasp!==undefined&&p.model).map(p=>p.model))]});
      }
      if(Object.values(prepared.handSetup.modes).includes('support')){const support=await import('../body-v3/armfix-r2/support-install.mjs');report.supportSetup=await support.installSupport(page,data.support,{sourceId:data.handSource});}
      report.restHandSetup=await page.evaluate(({rest,modes})=>{
        const V=__v2p,installed=[];
        if(Object.values(modes).includes('relaxed')){V.poses.relaxed=structuredClone(rest.relaxed);installed.push('relaxed');}
        if(Object.values(modes).includes('assist')){V.poses.open=structuredClone(rest.assist);installed.push('assist-as-open');}
        return {source:'fixed-hand-presets-r1',installed};
      },{rest:data.rest,modes:prepared.handSetup.modes});
    }
    if(!prepared.recipe.fixedCorrectionStack)report.jointCorrections=await installCorrections(page,prepared.recipe);
    else report.jointCorrections=prepared.recipe.jointCorrections;
    if(prepared.recipe.nativeWristCorrective!==undefined){
      fail(prepared.recipe.nativeWristCorrective===true&&!prepared.recipe.fixedCorrectionStack,'Bad nativeWristCorrective');
      const wc=await import('../../drill-anim/models/hand-wrist-corrective-r1/loader.mjs');
      report.nativeWristCorrective=await wc.install(page,{enabled:true});
    }
    if(corrective){
      const module=await import(pathToFileURL(path.join(V3,corrective.file)));
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
    },[source,theme,size,prepared.cameraScale]);
    return {browser,page,model};
  }catch(e){await browser.close();throw e;}
}

/** Solve and stage one time point (no render). Same per-frame steps as the review runner. */
export async function stageAt(page,source,t,warm){
  return page.evaluate(([s,t,w])=>{
    const v=flareInspector.viewer,E=__drill,T=__toonT;
    const solved=E.applyAt(s,t,w);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));
    __toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);__glowU.value=0;
    const h=s.renderAppearance?.highlight;if(h){const pu=Math.min(1,Math.max(0,__toonUni.uPulse.value));window.__pkgHi={color:h.color,shade:h.shade,k:h.intensity[0]+(h.intensity[1]-h.intensity[0])*pu};}const K=window.__v2p?.skinOverride&&__v2p.SKINS?.[__v2p.skinOverride]?.hi;if(h){const pulse=Math.min(1,Math.max(0,__toonUni.uPulse.value)),c=K?new T.Color(K.c[0],K.c[1],K.c[2]):new T.Color(h.color);/* ported V2 skin: its own highlight colour / shade, the recipe's pulse curve */__toonUni.uHiC.value=c.multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*pulse);__toonUni.uHiShade.value=(K?K.shade:h.shade).slice();}
    __props.update();v.coach.updateMatrixWorld(true);v.camera.position.copy(E.cam0.pos);v.camera.lookAt(E.cam0.tgt);v.camera.updateMatrixWorld();
    const joints=v.motion.getMetrics().joints;if(!Object.values(joints).every(p=>!Array.isArray(p)||p.every(Number.isFinite)))throw Error('Non-finite joints');
    if(v.renderer.getContext().isContextLost())throw Error('WebGL context lost');
    return {x:solved.x,warn:solved.warn,joints,pulse:__toonUni.uPulse.value,camera:v.camera.matrixWorld.elements.slice()};
  },[source,t,warm]);
}
