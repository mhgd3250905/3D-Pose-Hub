// Recipe-driven armfix-r2 capture. Frozen source specs and models stay unchanged.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {sourceFingerprint} from '../../drill-anim/tools/v2/source-fingerprint.mjs';
import {prepareRecipe,MODEL} from './recipe.mjs';
export {prepareRecipe,MODEL} from './recipe.mjs';
import {rotationPathSummary} from './rotation-path.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
import {measureFootSurfacesInPage} from './foot-surface.mjs';
import {resolveCorrections,installCorrections} from './joint-corrections.mjs';
import * as fixedCorrections from './fixed-wrist-corrections-r1.mjs';
import * as mountainFoot from './mountain-airborne-foot-r1.mjs';
import {measureVisibleBodySurfacesInPage} from './body-surface-floor-probe-r1.mjs';

const SELF = fileURLToPath(import.meta.url);
export const REPO = path.resolve(path.dirname(SELF), '../..');

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2)+'\n', {flag:'wx'});
const fail = (condition, message) => {if (!condition) throw Error(message);};

export function capturePlan(spec, fps=30, previewFps=12) {
  fail(spec?.runtimeModel?.profile === MODEL.profile && spec.runtimeModel.version === MODEL.version, 'Explicit armfix-r2 runtime is required');
  fail(spec.modelProfile === 'training-human-v2plus-hands-native', 'Native-hand descriptor is required');
  fail(spec.camera?.drift === 0 && spec.camera.orbitDegrees === 0 && spec.camera.frontSweepDegrees === 0, 'Automatic camera motion must be disabled');
  fail(spec.camera.fitTimeline === true, 'Whole-cycle camera fitting is required');
  fail(Array.isArray(spec.camera.dir) && spec.camera.dir.length === 3 && spec.camera.dir.every(Number.isFinite) && Math.hypot(...spec.camera.dir)>0, 'Camera direction must be finite and nonzero');
  const duration = spec.timeline?.duration, count = duration * fps;
  fail(Number.isFinite(duration) && duration>0 && duration<=60 && Number.isSafeInteger(count) && Number.isInteger(fps) && fps>0, 'Invalid capture duration/fps');
  fail(Number.isInteger(previewFps)&&previewFps>0&&previewFps<=fps&&Number.isInteger(duration*previewFps),'Preview playback FPS must divide the duration into whole frames and remain <= solve FPS');
  const previewPlaybackFrames=Array.from({length:duration*previewFps},(_,i)=>Math.round(i*fps/previewFps));
  const key = (spec.keyFrames||[]).map(t=>Math.round(t*fps));
  const frames = [...new Set([0,count-1,count,Math.round((spec.stillAt??duration/2)*fps),...key,...previewPlaybackFrames,...Array.from({length:9},(_,i)=>Math.round(count*i/8))])]
    .filter(f=>Number.isInteger(f)&&f>=0&&f<=count).sort((a,b)=>a-b);
  return {durationSeconds:duration,fps,frameCount:count,previewFps,previewPlaybackFrames,previewFrames:frames,
    extraViewFrames:[...new Set([0,Math.min(count-1,Math.round((spec.stillAt??duration/2)*fps)),count-1])].sort((a,b)=>a-b)};
}

export function fingerprint(specFile, prepared) {
  const prior=sourceFingerprint(REPO,specFile),names=new Set(prior.sources.map(x=>x.path));
  if(prepared.recipe.fixedCorrectionStack){
    const m=fixedCorrections.verify();
    if(prepared.recipe.fixedCorrectionStack.profile!==m.profile||prepared.recipe.fixedCorrectionStack.version!==m.version)throw Error('Fixed correction stack identity mismatch');
    names.add('drill-anim/models/fixed-wrist-corrections-r1/manifest.json');
    for(const f of Object.keys(m.sha256Lf))names.add(f);
  }
  const add=file=>names.add(path.relative(REPO,file).replaceAll('\\','/'));
  const tree=folder=>{for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())tree(file);else add(file);}};
  add(SELF);add(path.join(path.dirname(SELF),'recipe.mjs'));add(path.join(path.dirname(SELF),'rotation-path.mjs'));
  add(path.join(path.dirname(SELF),'body-surface-floor-probe-r1.mjs'));
  if(prepared.spec.actionCorrective)add(path.join(path.dirname(SELF),'mountain-airborne-foot-r1.mjs'));
  add(path.join(path.dirname(SELF),'highlight-material.mjs'));
  add(path.join(path.dirname(SELF),'joint-corrections.mjs'));
  for(const correction of resolveCorrections(prepared.recipe)){
    add(correction.manifestFile);for(const file of correction.files)add(file);
  }
  if(prepared.recipe.diagnostics?.measureFootSurface)add(path.join(path.dirname(SELF),'foot-surface.mjs'));
  if(prepared.spec.props?.some(p=>p.fixedKettlebellGrasp!==undefined))add(path.join(path.dirname(SELF),'kettlebell-grip.mjs'));
  add(prepared.recipeFile);
  if(prepared.poseAdapterFile){
    const visit=file=>{const name=path.relative(REPO,file).replaceAll('\\','/');if(names.has(name))return;add(file);for(const m of fs.readFileSync(file,'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))visit(path.resolve(path.dirname(file),m[1]));};
    visit(prepared.poseAdapterFile);
  }
  // Read the fixed model's complete pin sets, including tools referenced outside model folders.
  for(const folder of fs.readdirSync(path.join(REPO,'drill-anim/models'))){
    const mf=path.join(REPO,'drill-anim/models',folder,'manifest.json');if(!fs.existsSync(mf))continue;
    if(!/^training-human-v3|^hands-native-c1r2|^head-neck-/.test(folder))continue;
    const manifest=json(mf);for(const name of Object.keys(manifest.sha256||manifest.sourceSha256||{}))if(fs.existsSync(path.join(REPO,name)))add(path.join(REPO,name));
  }
  if(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'){
    tree(path.join(REPO,'drill-anim/models/webxr-dumbbell-wrist-r1'));
    for(const name of ['loader.mjs','runtime.js'])add(path.join(REPO,'tools/body-v3/webxr-wrist-join-r1',name));
  }
  if(prepared.handSetup.adapter==='symmetric-native'){
    for(const name of ['loader.mjs','presets.json','manifest.json'])add(path.join(REPO,'drill-anim/models/fixed-hand-presets-r1',name));
    for(const name of ['support-install.mjs','support-runtime.js'])add(path.join(REPO,'tools/body-v3/armfix-r2',name));
    for(const name of Object.keys(json(path.join(REPO,'drill-anim/models/fixed-hand-presets-r1/manifest.json')).sha256))add(path.join(REPO,name));
  }
  // Include the complete adapter/manifest closure; verify() also checks these recursively.
  for (const folder of fs.readdirSync(path.join(REPO,'drill-anim/models'))) {
    if (!/^training-human-v3|^head-neck-|^hands-native-c1r2/.test(folder)) continue;
    const root=path.join(REPO,'drill-anim/models',folder);
    if(!fs.statSync(root).isDirectory())continue;
    for(const name of fs.readdirSync(root))if(/\.(js|mjs|json|glb)$/.test(name))names.add('drill-anim/models/'+folder+'/'+name);
  }
  const sources=[...names].sort().map(name=>{const raw=fs.readFileSync(path.join(REPO,name));return {path:name,bytes:raw.length,sha256:sha(raw)};});
  return {sha256:sha(JSON.stringify(sources)),sources};
}

function runtimeEnvironment(file) {
  const raw=fs.readFileSync(file),r=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
  fail(r.format==='pose-hub-render-runtime@1' && Array.isArray(r.chromiumArgs), 'Pinned render runtime is required');
  fail(/RTX 4080/i.test(r.actualWebGLRenderer) && !/swiftshader|software/i.test(r.actualWebGLRenderer), 'Hardware runtime is required');
  for(const ref of [r.browserExecutable,r.playwrightModule]){
    fail(ref && path.isAbsolute(ref.path),'Runtime executable/module reference is required');
    const bytes=fs.readFileSync(ref.path);fail(bytes.length===ref.bytes&&sha(bytes)===ref.sha256,'Pinned runtime file changed');
  }
  process.env.PLAYWRIGHT_MODULE=r.playwrightModule.path;
  process.env.CHROMIUM_ARGS=r.chromiumArgs.join(' ');
  const browsersPath=r.playwrightBrowsersPath??r.defaultConfig?.playwrightBrowsersPath;
  if(browsersPath)process.env.PLAYWRIGHT_BROWSERS_PATH=browsersPath;
  if(r.chromiumChannel)process.env.CHROMIUM_CHANNEL=r.chromiumChannel;
  return {value:r,sha256:sha(raw)};
}

export function validateReview(review,identity) {
  fail(review?.format==='pose-hub-completion-preview-review@1'&&review.actualViewing===true&&review.technicalProceed===true,'Actual preview viewing receipt is required');
  fail(typeof review.reviewedBy==='string'&&review.reviewedBy.trim()&&Number.isFinite(Date.parse(review.reviewedAt)),'Reviewer identity/time is required');
  for(const key of ['sourceSha256','specId','runtimeSha256','cameraScale','recipeSha256'])fail(review[key]===identity[key],'Preview review identity changed: '+key);
  fail(Array.isArray(review.viewedFiles)&&review.viewedFiles.length>0,'Viewed image references are required');
  for(const ref of review.viewedFiles){fail(path.isAbsolute(ref.path),'Absolute reviewed image path is required');fail(sha(fs.readFileSync(ref.path))===ref.sha256,'Reviewed image changed');}
  fail(review.preview?.path&&review.preview.sha256===sha(fs.readFileSync(review.preview.path)),'Preview report changed');
  const preview=json(review.preview.path);
  fail(preview.complete===true&&preview.mode==='preview','Incomplete preview cannot start full capture');
  for(const key of ['sourceSha256','specId','runtimeSha256','cameraScale','recipeSha256'])fail(preview[key]===identity[key],'Preview provenance changed: '+key);
  return preview;
}

function memory(stage,browserOpen=false) {
  const freeGiB=os.freemem()/1024**3,min=browserOpen?2:3.5;
  fail(freeGiB>=min,`Available physical memory below ${min} GiB before ${stage}`);
  return {stage,freePhysicalGiB:freeGiB};
}

// Runs while temporary renderer wrappers are still active. Kept self-contained
// so the same implementation is installed in the page and exercised by CPU tests.
export function sampleActualRender(viewer,wrist,readRotations) {
  if(wrist?.active){
    return wrist.sample(()=>({capturedAt:'scene.onAfterRender',rotations:readRotations(),sides:structuredClone(wrist.last)}));
  }
  const scene=viewer.scene,previous=scene.onAfterRender;
  let value,called=false;
  function sample(...args){
    previous?.apply(this,args);
    value={capturedAt:'scene.onAfterRender',rotations:readRotations(),sides:null};called=true;
  }
  scene.onAfterRender=sample;
  try{viewer.renderer.render(scene,viewer.camera);}
  finally{scene.onAfterRender=previous;}
  if(!called)throw Error('Rotation sample did not reach scene.onAfterRender');
  return value;
}

export async function run({recipeFile,out,runtimeFile,mode='preview',reviewFile,size,previewFps=12,lane=1}) {
  fail(lane===1||lane===2,'Only render lanes 1 and 2 are permitted');
  const prepared=await prepareRecipe(recipeFile),{spec:source,specFile:file,cameraScale}=prepared;
  if(source.actionCorrective)fail(source.id==='h-mountain-climber-r7'&&source.actionCorrective.id==='mountain-airborne-foot-r1'&&source.actionCorrective.version==='0.1.0-r1'&&source.actionCorrective.required===true&&prepared.handSetup.adapter==='symmetric-native','Unsupported required action corrective');
  const detailJoints={
    'h-band-biceps-curl':['leftWrist','rightWrist'],
    'h-biceps-self':['leftWrist','rightWrist','leftElbow','rightElbow'],
    'h-half-kneeling-quad-stretch':['leftWrist','rightWrist'],
    'h-chair-elbow-triceps-stretch':['leftElbow','rightElbow'],
    'h-kb-swing':['leftWrist','rightWrist'],
    'h-pike-pushup':['leftWrist','rightWrist','leftElbow','rightElbow'],
    'h-wall-pec':['leftWrist','rightWrist'],
  }[prepared.recipe.id]??[];
  source.reviewDetailJoints=detailJoints;
  fail(['preview','full'].includes(mode),'Expected preview or full phase');
  fail(Number.isFinite(cameraScale)&&cameraScale>=1&&cameraScale<=3,'Camera scale must be 1..3');
  const root=path.resolve(out);
  fail(!fs.existsSync(root),'Output already exists; use a new attempt directory');
  const plan=capturePlan(source,30,previewFps);
  plan.coverFrame=Math.min(plan.frameCount-1,Math.max(0,Math.round((source.stillAt??source.timeline.duration/2)*plan.fps)));
  const runtime=runtimeEnvironment(path.resolve(runtimeFile));
  const model=await import(pathToFileURL(path.join(REPO,'drill-anim/models/training-human-v3-armfix-r2/loader.mjs')).href);
  const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
  model.checkSpec(source);await model.verify();
  const pinned=fingerprint(file,prepared),identity={sourceSha256:pinned.sha256,specId:source.id,runtimeSha256:runtime.sha256,cameraScale,recipeSha256:prepared.recipeSha256};
  // Preserve the verified attempt inputs before GPU work, including failed runs.
  // The effective spec is the actual plain-data descriptor sent to the browser.
  const snapshots={
    recipe:{path:'recipe.snapshot.json',bytes:fs.readFileSync(prepared.recipeFile)},
    effectiveSpec:{path:'effective-spec.snapshot.json',bytes:Buffer.from(JSON.stringify(source,null,2)+'\n')},
    sourceSpec:{path:'source-spec.snapshot.js',bytes:fs.readFileSync(file)},
  };
  fail(sha(snapshots.recipe.bytes)===prepared.recipeSha256,'Recipe changed before snapshot');
  const sourcePin=pinned.sources.find(row=>row.path===path.relative(REPO,file).replaceAll('\\','/'));
  fail(sourcePin?.sha256===sha(snapshots.sourceSpec.bytes),'Source spec changed before snapshot');
  if(mode==='full')validateReview(json(path.resolve(reviewFile)),identity);
  const pixelSize=size??(mode==='preview'?480:1080);
  fail(Number.isInteger(pixelSize)&&pixelSize>=240&&pixelSize<=1080,'Capture size must be 240..1080');
  fail(mode!=='preview'||pixelSize<=480,'Review previews are limited to 480px; full production is a separate phase');
  const states=[memory('start')];
  fs.mkdirSync(root,{recursive:true});
  const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');
  fs.mkdirSync(path.dirname(lock),{recursive:true});
  let owned=false,browser;
    const report={format:'pose-hub-completion-capture@1',...identity,mode,lane,complete:false,size:pixelSize,
    recipeFile:prepared.recipeFile,stableId:prepared.recipe.id,handSetup:prepared.handSetup,poseAdapterReport:prepared.poseAdapterReport,sourceRuntimeModel:prepared.sourceRuntimeModel,adaptation:prepared.recipe.adaptation??null,
    appearance:source.renderAppearance??null,
    purpose:mode==='preview'?'low-resolution-complete-loop-review':'full-resolution-production-candidate',
    rotationSampling:{primary:'scene.onAfterRender',secondary:'pre-render-solver',everySolvedFrame:true,
      notes:'Primary rotations include temporary render-time forearm twist; joint positions retain their solver-stage identity.'},
    plan,runtimeModel:MODEL,sourceFps:source.fps,sourceSpec:path.relative(REPO,file).replaceAll('\\','/'),
    groundShadow:false,cameraMotion:false,reviewed:false,releaseEligible:false,states,images:[],metrics:[],pageErrors:[],
    limits:['Sampled preview images are not full action acceptance.','Solver/joint diagnostics are not visible mesh penetration proof.','No ground shadow; model self shading and required props remain.']};
  try {
    report.snapshots={};
    for(const [kind,snapshot]of Object.entries(snapshots)){
      fs.writeFileSync(path.join(root,snapshot.path),snapshot.bytes,{flag:'wx'});
      report.snapshots[kind]={path:snapshot.path,bytes:snapshot.bytes.length,sha256:sha(snapshot.bytes)};
    }
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,spec:source.id,out:root}),{flag:'wx'});owned=true;
    const temporary=path.join(root,'work/browser-temp');fs.mkdirSync(temporary,{recursive:true});
    process.env.TEMP=temporary;process.env.TMP=temporary;
    const theme=loadTheme();
    const opened=await model.boot({size:pixelSize,pr:1,theme});browser=opened.b;const page=opened.p;
    page.on('pageerror',e=>report.pageErrors.push(String(e)));
    page.on('console',m=>{if(m.type()==='error'&&/shader|compiled|VALIDATE_STATUS/i.test(m.text()))report.pageErrors.push(m.text());});
    report.actualRuntime=await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,contextLost:gl.isContextLost()};});
    fail(browser.version()===runtime.value.browserVersion&&report.actualRuntime.renderer===runtime.value.actualWebGLRenderer&&!report.actualRuntime.contextLost,'Actual browser/GPU differs from runtime pin');
    states.push(memory('model apply',true));
    report.modelSetup=await model.applyV3(page,source);
    fail(report.modelSetup.profile===MODEL.profile&&report.modelSetup.version===MODEL.version,'Wrong installed runtime model');
    if(source.renderAppearance?.highlight?.material){
      report.highlightMaterial=await page.evaluate(installHighlightMaterial,source.renderAppearance.highlight.material);
    }
    if(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'){
      if(prepared.recipe.fixedCorrectionStack){
        const profiles=prepared.recipe.jointCorrections.map(c=>c.profile);
        fail(profiles.length===2&&profiles[0]==='upper-arm-contour-r3'&&profiles[1]==='ankle-join-r5','Fixed stack requires the pinned r3/r5 combination');
        report.fixedCorrectionSetup=await fixedCorrections.install(page,{upperArm:true,ankle:true,elbow:false,showDumbbells:prepared.handSetup.showDumbbells});
        report.wristSetup=report.fixedCorrectionSetup.wristSetup;
      }else{
        const wrist=await import('../body-v3/webxr-wrist-join-r1/loader.mjs');
        report.wristSetup=await wrist.install(page,{showDumbbells:prepared.handSetup.showDumbbells});
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
        report.kettlebellGripSetup=await kettlebell.installKettlebellGrip(page);
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
    if(source.actionCorrective)report.actionCorrectiveSetup=await mountainFoot.install(page);
    else report.jointCorrections=prepared.recipe.jointCorrections;
    if(prepared.recipe.diagnostics?.rigCalibration){
      report.rigCalibration=await page.evaluate(()=>{
        const E=__drill,m=flareInspector.viewer.motion; m.reset();
        const groundHands=[];
        for(const [x,z,fx,fz]of [[.075,.24,.25,1],[.075,.21,.25,1],[.26,-.11,.9,.3],[.235,-.025,.25,1]])for(const side of ['left','right']){
          const sign=side==='left'?1:-1,at=[x*sign,z];groundHands.push({side,at,pose:m.getGroundHandPose(side,[fx*sign,0,fz],[at[0],0,at[1]])});
        }
        return JSON.parse(JSON.stringify({R:E.R,L:E.L,groundHands,handPts:E.handPts}));
      });
      write(path.join(root,'rig-calibration.json'),report.rigCalibration);
    }
    await page.addScriptTag({content:'window.__completionSampleActualRender = '+sampleActualRender.toString()+';'});
    await page.addScriptTag({content:'window.__completionBodySurface = '+measureVisibleBodySurfacesInPage.toString()+';'});
    if(prepared.recipe.diagnostics?.measureFootSurface){
      await page.addScriptTag({content:'window.__completionMeasureFootSurface = '+measureFootSurfacesInPage.toString()+';'});
      report.footSurfaceDiagnostic={method:'CPU skinning of visible foot/toe vertices',shaderDisplacementIncluded:false};
    }
    report.rotationBones=await page.evaluate(()=>{
      const names=[];flareInspector.viewer.coach.traverse(o=>{if(o.isBone&&/^(left|right)(Hand|Forearm|Foot|LowerLeg|Shin|Calf|Ankle|Leg)$/.test(o.name))names.push(o.name);});return names;
    });
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
    report.camera={...await page.evaluate(()=>({position:__drill.cam0.pos.toArray(),target:__drill.cam0.tgt.toArray(),fov:flareInspector.viewer.camera.fov})),extraViewDistanceScale:1.15};
    const frames=mode==='full'?new Set(Array.from({length:plan.frameCount+1},(_,i)=>i)):new Set(plan.previewFrames);
    const extra=mode==='preview'?new Set([...plan.extraViewFrames,...(source.keyFrames??[]).map(t=>Math.round(t*plan.fps))]):new Set();
    let warm=null;
    for(let f=0;f<=plan.frameCount;f++){
      const value=await page.evaluate(([s,f,fps,w,render,extra])=>{
        const v=flareInspector.viewer,E=__drill,T=__toonT,t=f/fps;
        const solved=E.applyAt(s,t,w);__toonUni.uBreath.value=(s.breath??0.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));
        __toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);__glowU.value=0;
        let actualHighlight=null;
        if(s.renderAppearance?.highlight){
          const h=s.renderAppearance.highlight,pulse=Math.min(1,Math.max(0,__toonUni.uPulse.value));
          const intensity=h.intensity[0]+(h.intensity[1]-h.intensity[0])*pulse;
          __toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(intensity);
          __toonUni.uHiShade.value=h.shade.slice();
          actualHighlight={color:h.color,linearColor:__toonUni.uHiC.value.toArray(),shade:__toonUni.uHiShade.value.slice(),pulse,intensity,
            material:window.__reviewHighlightMaterial?structuredClone(window.__reviewHighlightMaterial):null,
            method:'sRGB hex to linear color multiplied by intensity; existing shader light/shade and pulse modulation retained'};
        }
        __props?.update();v.coach.updateMatrixWorld(true);
        const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
        const metrics=v.motion.getMetrics();
        const readRotations=()=>{
          const rotations={};
          for(const side of ['left','right']){
            const bone=part=>v.coach.getObjectByName(side+part);
            const hand=bone('Hand'),forearm=bone('Forearm'),foot=bone('Foot')||bone('Ankle'),lower=bone('LowerLeg')||bone('Shin')||bone('Calf')||bone('Leg');
            const record=b=>b?{name:b.name,localQuaternion:b.quaternion.toArray(),worldQuaternion:b.getWorldQuaternion(new T.Quaternion()).toArray(),localEuler:[b.rotation.x,b.rotation.y,b.rotation.z],eulerOrder:b.rotation.order}:null;
            const relative=(child,parent)=>child&&parent?parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(child.getWorldQuaternion(new T.Quaternion())).toArray():null;
            rotations[side]={hand:record(hand),forearm:record(forearm),foot:record(foot),lowerLeg:record(lower),handRelativeForearm:relative(hand,forearm),footRelativeLowerLeg:relative(foot,lower)};
          }
          return rotations;
        };
        const preRenderRotations=readRotations();
        // Render all solved frames for actual rotation QA, including frames whose
        // PNG is not stored. The sampled render also supplies the main image.
        let footSurface=null,jointCorrections=null,bodySurface=null;
        const actual=window.__completionSampleActualRender(v,window.__webxrWristJoin,()=>{
          footSurface=window.__completionMeasureFootSurface?.()??null;
          bodySurface=window.__completionBodySurface();
          jointCorrections={ankle:window.__ankleJoinR5?.last??window.__ankleJoinR4?.last??window.__ankleJoinR2?.last??window.__ankleJoinR1?.last??null,elbow:window.__elbowDqsR1?.last??null,upperArm:window.__upperArmContourR3?.measure?.()??window.__upperArmContourR2?.measure?.()??window.__upperArmContourR1?.measure?.()??null};
          return readRotations();
        });
        const fixedCorrectionRestore=window.__fixedWristCorrectionsR1?.measure?.()??null;
        const actionCorrective=s.actionCorrective?structuredClone(window.__mountainFootFollowR1?.last??null):null;
        if(s.actionCorrective&&(!actionCorrective||Math.abs(actionCorrective.time-t)>1e-8))throw Error('Required action corrective did not run for this frame');
        const requestedTargets=s.templateDiagnostics?JSON.parse(JSON.stringify({descriptor:E.currentDescriptor,poseTargets:E.poseTargets})):null;
        const result={actionCorrective,fixedCorrectionRestore,requestedTargets,x:solved.x,warn:solved.warn,joints:metrics.joints,preRenderRotations,actualHighlight,
          bodySurface,footSurface,jointCorrections,
          actualRenderRotations:actual.rotations,actualRenderWristDiagnostics:actual.sides,
          rotationCapturedAt:actual.capturedAt,finiteJoints:Object.values(metrics.joints).every(p=>!Array.isArray(p)||p.every(Number.isFinite)),images:{}};
        if(render){
          result.images.main=v.renderer.domElement.toDataURL('image/png');
          if(extra)for(const [name,angle]of [['opposite',Math.PI],['side',Math.PI/2]]){
            const offset=c.pos.clone().sub(c.tgt).applyAxisAngle(new T.Vector3(0,1,0),angle).multiplyScalar(1.15);
            v.camera.position.copy(c.tgt).add(offset);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
            v.renderer.render(v.scene,v.camera);result.images[name]=v.renderer.domElement.toDataURL('image/png');
          }
          if(extra)for(const joint of s.reviewDetailJoints??[]){
            const target=new T.Vector3(...metrics.joints[joint]);
            for(const [view,xyz]of [['front',[1,.35,1]],['back',[-1,.35,-1]],['side',[1,.2,-1]]]){
              const cam=new T.PerspectiveCamera(28,1,.01,20);
              cam.position.copy(target).addScaledVector(new T.Vector3(...xyz).normalize(),.85);
              cam.lookAt(target);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);
              result.images['detail-'+joint+'-'+view]=v.renderer.domElement.toDataURL('image/png');
            }
          }
        }
        if(v.renderer.getContext().isContextLost())throw Error('WebGL context lost; diagnose before resuming');
        return result;
      },[source,f,plan.fps,warm,frames.has(f),extra.has(f)]);
      fail(value.finiteJoints,'Non-finite joint at frame '+f);warm=value.x;
      fail(!report.pageErrors.length,'Browser/shader errors');
      report.metrics.push({frame:f,time:f/plan.fps,solverWarn:value.warn,finiteJoints:value.finiteJoints,
        actionCorrective:value.actionCorrective,
        fixedCorrectionRestore:value.fixedCorrectionRestore,requestedTargets:value.requestedTargets,
        jointSamplingStage:'pre-render-solver',joints:value.joints,preRenderRotations:value.preRenderRotations,
        actualHighlight:value.actualHighlight,bodySurface:value.bodySurface,footSurface:value.footSurface,jointCorrections:value.jointCorrections,
        actualRenderRotations:value.actualRenderRotations,actualRenderWristDiagnostics:value.actualRenderWristDiagnostics,
        rotationCapturedAt:value.rotationCapturedAt});
      for(const [view,url]of Object.entries(value.images)){
        const bytes=Buffer.from(url.split(',')[1],'base64');
        fail(bytes.readUInt32BE(16)===pixelSize&&bytes.readUInt32BE(20)===pixelSize&&bytes[25]===6,'Expected actual RGBA PNG');
        const folder=f===plan.frameCount?'endpoint':view;
        fs.mkdirSync(path.join(root,folder),{recursive:true});
        const relative=folder+'/'+view+'-'+String(f).padStart(4,'0')+'.png';
        fs.writeFileSync(path.join(root,relative),bytes,{flag:'wx'});
        report.images.push({frame:f,view,path:relative,bytes:bytes.length,sha256:sha(bytes)});
      }
      if(f%30===0){states.push(memory('frame '+f,true));console.log(JSON.stringify({event:'completion-frame',specId:source.id,mode,frame:f,total:plan.frameCount}));}
    }
    await model.verify();fail(fingerprint(file,prepared).sha256===pinned.sha256,'Capture sources changed during run');
    report.rotationPath={...rotationPathSummary(report.metrics.map(row=>({...row,rotations:row.actualRenderRotations}))),
      capturedAt:'scene.onAfterRender',sourceField:'metrics[].actualRenderRotations'};
    write(path.join(root,'rotation-path.json'),report.rotationPath);
    write(path.join(root,'source-manifest.json'),pinned);
    report.complete=true;write(path.join(root,'capture.json'),report);
    console.log(JSON.stringify({event:'completion-capture-done',specId:source.id,mode,images:report.images.length,out:root}));
    return report;
  }catch(error){write(path.join(root,'failed.json'),{...report,error:String(error),cause:String(error.cause||'')});throw error;}
  finally{if(browser)await browser.close();if(owned){const current=json(lock);if(current.pid===process.pid)fs.unlinkSync(lock);}}
}

export function parseArgs(args){
  const options={};const flags={'--recipe':'recipeFile','--out':'out','--runtime':'runtimeFile','--phase':'mode','--review':'reviewFile','--size':'size','--preview-fps':'previewFps','--lane':'lane'};
  for(let i=0;i<args.length;i+=2){fail(flags[args[i]]&&args[i+1]&&!args[i+1].startsWith('--'),'Expected named option/value pairs');fail(options[flags[args[i]]]===undefined,'Duplicate option');options[flags[args[i]]]=args[i+1];}
  for(const key of ['size','previewFps','lane'])if(options[key]!==undefined)options[key]=Number(options[key]);
  fail(options.recipeFile&&options.out&&options.runtimeFile,'--recipe, --out and --runtime are required');
  return options;
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)await run(parseArgs(process.argv.slice(2)));
