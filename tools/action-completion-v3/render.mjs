// Explicit r7/r5 capture for the completion batch. Frozen model sources stay unchanged.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {sourceFingerprint} from '../../drill-anim/tools/v2/source-fingerprint.mjs';

const SELF = fileURLToPath(import.meta.url);
export const REPO = path.resolve(path.dirname(SELF), '../..');
export const MODEL = {profile:'training-human-v3-contact', version:'0.1.0-r5'};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2)+'\n', {flag:'wx'});
const fail = (condition, message) => {if (!condition) throw Error(message);};

export function capturePlan(spec, fps=30) {
  fail(spec?.runtimeModel?.profile === MODEL.profile && spec.runtimeModel.version === MODEL.version, 'Explicit frozen r7/r5 runtime is required');
  fail(spec.modelProfile === 'training-human-v2plus-hands-native', 'Native-hand descriptor is required');
  fail(spec.camera?.drift === 0 && spec.camera.orbitDegrees === 0 && spec.camera.frontSweepDegrees === 0, 'Automatic camera motion must be disabled');
  fail(spec.camera.fitTimeline === true, 'Whole-cycle camera fitting is required');
  fail(Array.isArray(spec.camera.dir) && spec.camera.dir.length === 3 && spec.camera.dir.every(Number.isFinite) && Math.hypot(...spec.camera.dir)>0, 'Camera direction must be finite and nonzero');
  const duration = spec.timeline?.duration, count = duration * fps;
  fail(Number.isFinite(duration) && duration>0 && duration<=60 && Number.isSafeInteger(count) && Number.isInteger(fps) && fps>0, 'Invalid capture duration/fps');
  const key = (spec.keyFrames||[]).map(t=>Math.round(t*fps));
  const frames = [...new Set([0,count-1,count,Math.round((spec.stillAt??duration/2)*fps),...key,...Array.from({length:9},(_,i)=>Math.round(count*i/8))])]
    .filter(f=>Number.isInteger(f)&&f>=0&&f<=count).sort((a,b)=>a-b);
  return {durationSeconds:duration,fps,frameCount:count,previewFrames:frames,
    extraViewFrames:[...new Set([0,Math.min(count-1,Math.round((spec.stillAt??duration/2)*fps)),count-1])].sort((a,b)=>a-b)};
}

function fingerprint(specFile) {
  const prior=sourceFingerprint(REPO,specFile),names=new Set(prior.sources.map(x=>x.path));
  names.add(path.relative(REPO,SELF).replaceAll('\\','/'));
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
  if(r.playwrightBrowsersPath)process.env.PLAYWRIGHT_BROWSERS_PATH=r.playwrightBrowsersPath;
  if(r.chromiumChannel)process.env.CHROMIUM_CHANNEL=r.chromiumChannel;
  return {value:r,sha256:sha(raw)};
}

export function validateReview(review,identity) {
  fail(review?.format==='pose-hub-completion-preview-review@1'&&review.actualViewing===true&&review.technicalProceed===true,'Actual preview viewing receipt is required');
  fail(typeof review.reviewedBy==='string'&&review.reviewedBy.trim()&&Number.isFinite(Date.parse(review.reviewedAt)),'Reviewer identity/time is required');
  for(const key of ['sourceSha256','specId','runtimeSha256','cameraScale'])fail(review[key]===identity[key],'Preview review identity changed: '+key);
  fail(Array.isArray(review.viewedFiles)&&review.viewedFiles.length>0,'Viewed image references are required');
  for(const ref of review.viewedFiles){fail(path.isAbsolute(ref.path),'Absolute reviewed image path is required');fail(sha(fs.readFileSync(ref.path))===ref.sha256,'Reviewed image changed');}
  fail(review.preview?.path&&review.preview.sha256===sha(fs.readFileSync(review.preview.path)),'Preview report changed');
  const preview=json(review.preview.path);
  fail(preview.complete===true&&preview.mode==='preview','Incomplete preview cannot start full capture');
  for(const key of ['sourceSha256','specId','runtimeSha256','cameraScale'])fail(preview[key]===identity[key],'Preview provenance changed: '+key);
  return preview;
}

function memory(stage,browserOpen=false) {
  const freeGiB=os.freemem()/1024**3,min=browserOpen?2:3.5;
  fail(freeGiB>=min,`Available physical memory below ${min} GiB before ${stage}`);
  return {stage,freePhysicalGiB:freeGiB};
}

export async function run({specFile,out,runtimeFile,mode='preview',reviewFile,cameraScale=1.15,size}) {
  fail(['preview','full'].includes(mode),'Expected preview or full phase');
  fail(Number.isFinite(cameraScale)&&cameraScale>=1&&cameraScale<=3,'Camera scale must be 1..3');
  const root=path.resolve(out),file=path.resolve(specFile);
  fail(!fs.existsSync(root),'Output already exists; use a new attempt directory');
  const source=(await import(pathToFileURL(file).href)).default,plan=capturePlan(source);
  const runtime=runtimeEnvironment(path.resolve(runtimeFile));
  const model=await import(pathToFileURL(path.join(REPO,'drill-anim/models/training-human-v3-contact-r5/loader.mjs')).href);
  const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
  model.checkSpec(source);await model.verify();
  const pinned=fingerprint(file),identity={sourceSha256:pinned.sha256,specId:source.id,runtimeSha256:runtime.sha256,cameraScale};
  if(mode==='full')validateReview(json(path.resolve(reviewFile)),identity);
  const pixelSize=size??(mode==='preview'?480:1080);
  fail(Number.isInteger(pixelSize)&&pixelSize>=240&&pixelSize<=1080,'Capture size must be 240..1080');
  const states=[memory('start')];
  fs.mkdirSync(root,{recursive:true});
  const lock=path.join(config().work_dir,'completion-render.lock');
  fs.mkdirSync(path.dirname(lock),{recursive:true});
  let owned=false,browser;
  const report={format:'pose-hub-completion-capture@1',...identity,mode,complete:false,size:pixelSize,
    plan,runtimeModel:MODEL,sourceFps:source.fps,sourceSpec:path.relative(REPO,file).replaceAll('\\','/'),
    groundShadow:false,cameraMotion:false,reviewed:false,releaseEligible:false,states,images:[],metrics:[],pageErrors:[],
    limits:['Sampled preview images are not full action acceptance.','Solver/joint diagnostics are not visible mesh penetration proof.','No ground shadow; model self shading and required props remain.']};
  try {
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
    report.camera=await page.evaluate(()=>({position:__drill.cam0.pos.toArray(),target:__drill.cam0.tgt.toArray(),fov:flareInspector.viewer.camera.fov}));
    const frames=mode==='full'?new Set(Array.from({length:plan.frameCount+1},(_,i)=>i)):new Set(plan.previewFrames);
    const extra=mode==='preview'?new Set(plan.extraViewFrames):new Set();
    let warm=null;
    for(let f=0;f<=plan.frameCount;f++){
      const value=await page.evaluate(([s,f,fps,w,render,extra])=>{
        const v=flareInspector.viewer,E=__drill,T=__toonT,t=f/fps;
        const solved=E.applyAt(s,t,w);__toonUni.uBreath.value=(s.breath??0.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));
        __toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);__glowU.value=0;
        __props?.update();v.coach.updateMatrixWorld(true);
        const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
        const metrics=v.motion.getMetrics();
        const result={x:solved.x,warn:solved.warn,finiteJoints:Object.values(metrics.joints).every(p=>!Array.isArray(p)||p.every(Number.isFinite)),images:{}};
        if(render){
          v.renderer.render(v.scene,v.camera);result.images.main=v.renderer.domElement.toDataURL('image/png');
          if(extra)for(const [name,angle]of [['opposite',Math.PI],['side',Math.PI/2]]){
            const offset=c.pos.clone().sub(c.tgt).applyAxisAngle(new T.Vector3(0,1,0),angle);
            v.camera.position.copy(c.tgt).add(offset);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
            v.renderer.render(v.scene,v.camera);result.images[name]=v.renderer.domElement.toDataURL('image/png');
          }
        }
        if(v.renderer.getContext().isContextLost())throw Error('WebGL context lost; diagnose before resuming');
        return result;
      },[source,f,plan.fps,warm,frames.has(f),extra.has(f)]);
      fail(value.finiteJoints,'Non-finite joint at frame '+f);warm=value.x;
      fail(!report.pageErrors.length,'Browser/shader errors');
      report.metrics.push({frame:f,time:f/plan.fps,solverWarn:value.warn,finiteJoints:value.finiteJoints});
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
    await model.verify();fail(fingerprint(file).sha256===pinned.sha256,'Capture sources changed during run');
    write(path.join(root,'source-manifest.json'),pinned);
    report.complete=true;write(path.join(root,'capture.json'),report);
    console.log(JSON.stringify({event:'completion-capture-done',specId:source.id,mode,images:report.images.length,out:root}));
    return report;
  }catch(error){write(path.join(root,'failed.json'),{...report,error:String(error),cause:String(error.cause||'')});throw error;}
  finally{if(browser)await browser.close();if(owned){const current=json(lock);if(current.pid===process.pid)fs.unlinkSync(lock);}}
}

export function parseArgs(args){
  const options={};const flags={'--spec':'specFile','--out':'out','--runtime':'runtimeFile','--phase':'mode','--review':'reviewFile','--camera-scale':'cameraScale','--size':'size'};
  for(let i=0;i<args.length;i+=2){fail(flags[args[i]]&&args[i+1]&&!args[i+1].startsWith('--'),'Expected named option/value pairs');fail(options[flags[args[i]]]===undefined,'Duplicate option');options[flags[args[i]]]=args[i+1];}
  for(const key of ['cameraScale','size'])if(options[key]!==undefined)options[key]=Number(options[key]);
  fail(options.specFile&&options.out&&options.runtimeFile,'--spec, --out and --runtime are required');
  return options;
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)await run(parseArgs(process.argv.slice(2)));
