// Independent transparent capture. Frozen loaders, specs and browser layers are read only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {sourceFingerprint} from '../../drill-anim/tools/v2/source-fingerprint.mjs';

export const VERSION = 'app-test-pack-rgba/1.0.0-r1';
const SELF = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(SELF), '../..');
const LAYERS = ['body', 'highlight', 'shadow'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', {flag:'wx'});
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);
const SPECIAL = {
 'h-wall-palm-lift-rr5': ['training-human-v2plus-contact-wrist', 'wristSkinning', '1.0.0-r5.1', 'contact-r5', 'applyHumanWrist'],
 'h-bent-knee-calf-raise-rr7': ['training-human-v2plus-hands-native', 'nativeHands', '1.0.0-r3', 'hands-native-r3', 'applyHandsNative'],
 'h-chair-single-leg-hip-thrust-rr8': ['training-human-v2plus-hands-native', 'nativeHands', '1.0.0-r3', 'hands-native-r3', 'applyHandsNative'],
 'h-fixed-bar-vertical-pull-rr7': ['training-human-v2plus-native-grip', 'nativeGrip', '1.0.0-r1', 'grip-native-r1', 'applyNativeGrip'],
 'h-db-overhead-triceps-extension-rr4': ['training-human-v2plus-overhead-native', 'overheadNative', '1.0.0-r2', 'overhead-native-r2', 'applyOverheadNative'],
 'h-kneeling-instep-stretch-rr6': ['training-human-v2plus-instep-native', 'instepNative', '1.0.0-r1', 'instep-native-r1', 'applyInstepNative'],
 'h-kneeling-thread-needle-rr1': ['training-human-v2plus-threadneedle-native', 'threadneedleNative', '1.0.0-r1', 'threadneedle-native-r1', 'applyThreadneedle'],
};

export function selectProfile(spec, entry = 'auto') {
 if (!spec || !safeId(spec.id)) throw Error('A safe exact source spec ID is required');
 if (entry === 'native-open-r1') {
  const versions = {'training-human-v2plus-hands-native':['nativeHands','1.0.0-r3'], 'training-human-v2plus-native-grip':['nativeGrip','1.0.0-r1']};
  if (typeof spec.modelProfile !== 'string' || !Object.hasOwn(versions, spec.modelProfile)) throw Error('Unsupported explicit native-open profile');
  const [key, version] = versions[spec.modelProfile];
  if (spec[key]?.version !== version) throw Error('Unsupported native-open version');
  return {profile:spec.modelProfile, version, folder:'native-open-r1', exportName:'applyNativeOpen', mode:'engine'};
 }
 if (!['auto','base-v2plus'].includes(entry)) throw Error('Unknown explicit entry');
 if (Object.hasOwn(SPECIAL, spec.id)) {
  if (entry !== 'auto') throw Error('Special action cannot fall back to the base model');
  const [profile, key, version, folder, exportName] = SPECIAL[spec.id];
  if (spec.modelProfile !== profile || spec[key]?.version !== version) throw Error('Unsupported special profile/version; no base fallback');
  return {profile,version,folder,exportName,mode:folder==='threadneedle-native-r1'?'cpu-threadneedle':'engine'};
 }
 if (![undefined,'training-human-v2','training-human-v2plus','legacy-v7'].includes(spec.modelProfile)) throw Error('Unsupported profile; explicit native-open entry is required for new native specs');
 return {profile:'training-human-v2plus',version:'1.0.0-rc2',folder:null,exportName:'applyHumanV2plus',mode:'engine'};
}

export function capturePlan(spec, {fps=30, frames} = {}) {
 const duration = spec.timeline?.duration, count = duration * fps;
 if (!Number.isFinite(duration) || duration <= 0 || !Number.isInteger(fps) || fps <= 0 || !Number.isSafeInteger(count)) throw Error('Duration * capture fps must be an exact positive frame count');
 const peak = Math.min(count-1, Math.max(0, Math.round((spec.stillAt ?? duration/4)*fps)));
 const keyFrames=(spec.keyFrames||[]).map(t=>Math.round(t*fps)).filter(f=>Number.isInteger(f)&&f>=0&&f<=count);
 const selected = frames ?? [...new Set([0, ...Array.from({length:7},(_,i)=>Math.round(count*(i+1)/8)), ...keyFrames, peak, count-1, count])].sort((a,b)=>a-b);
 if (!selected.length || selected.some((f,i)=>!Number.isInteger(f)||f<0||f>count||(i>0&&f<=selected[i-1]))) throw Error('Preview frames must be unique, increasing and in 0..N');
 if (![0,count-1,count].every(f=>selected.includes(f)) || !selected.some(f=>f>0&&f<count-1)) throw Error('Preview must contain start/interior/end/loop endpoint');
 return {fps,durationSeconds:duration,frameCount:count,peakFrame:peak,previewFrames:selected};
}

export function checkPreview(previous, identity) {
 for (const key of ['tool','toolSha256','sourceSha256','specId','actionId','profile','fps','durationSeconds','frameCount','size','cameraDistanceScale','runtimeSha256']) {
  if (JSON.stringify(previous[key]) !== JSON.stringify(identity[key])) throw Error('Preview provenance mismatch: '+key);
 }
 if (previous.mode !== 'preview' || !previous.complete || previous.error) throw Error('A completed matching transparent preview is required');
 if (![0,identity.frameCount-1,identity.frameCount].every(f=>previous.frames?.includes(f))) throw Error('Preview is missing start/end/loop endpoint');
 for (const layer of LAYERS) if (!previous.sequences?.[layer]) throw Error('Preview is missing '+layer);
}

function fingerprint(specPath, profile) {
 const files = new Set(sourceFingerprint(REPO,specPath).sources.map(r=>path.join(REPO,r.path)));
 const visited = new Set();
 function visit(file) {
  file=path.resolve(file); if(visited.has(file))return; visited.add(file);files.add(file);
  const text=fs.readFileSync(file,'utf8');
  for(const match of text.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) if(match[1].startsWith('.'))visit(path.resolve(path.dirname(file),match[1]));
  if(path.basename(file)==='loader.mjs') {
   const dir=path.dirname(file);
   for(const name of fs.readdirSync(dir)) if(/\.(json|js)$/.test(name))files.add(path.join(dir,name));
   const mf=path.join(dir,'manifest.json');
   if(fs.existsSync(mf)) for(const rel of Object.keys(read(mf).sourceSha256||{})) {
    const candidates=[path.resolve(REPO,rel),path.resolve(dir,rel)];const target=candidates.find(f=>fs.existsSync(f));
    if(!target)throw Error('Missing pinned source '+rel);files.add(target);
   }
  }
 }
 if(profile.folder)visit(path.join(REPO,'drill-anim/models',profile.folder,'loader.mjs'));
 files.add(SELF);files.add(path.join(REPO,'drill-anim/themes/glow-soft.json'));
 const sources=[...files].sort().map(file=>{const raw=fs.readFileSync(file);return {path:path.relative(REPO,file).replaceAll('\\','/'),sha256:hash(raw),bytes:raw.length};});
 return {format:'pose-hub-render-source-manifest@2',sha256:hash(JSON.stringify(sources)),sources};
}

export function verifyBase() {
 let checked=0;
 for(const name of ['training-human-v2','training-human-v2plus']) for(const [rel,expected] of Object.entries(read(path.join(REPO,'drill-anim/models',name+'.json')).sourceSha256)) {
  const file=path.join(REPO,rel),content=rel.endsWith('.glb')?fs.readFileSync(file):fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
  if(hash(content)!==expected)throw Error('Frozen base SHA mismatch: '+rel);
  checked++;
 }
 return checked;
}

function runtimeEnvironment(file) {
 const raw=fs.readFileSync(file), runtime=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
 if(runtime.format!=='pose-hub-render-runtime@1'||!Array.isArray(runtime.chromiumArgs)||!runtime.chromiumArgs.length||!runtime.chromiumArgs.every(a=>typeof a==='string'&&!/\s/.test(a)))throw Error('Explicit approved GPU runtime required');
 if(!/RTX 4080/i.test(runtime.actualWebGLRenderer)||/swiftshader|llvmpipe|software/i.test(runtime.actualWebGLRenderer))throw Error('Runtime must bind the actual RTX 4080');
 for(const ref of [runtime.browserExecutable,runtime.playwrightModule]) {
  if(!ref||!path.isAbsolute(ref.path))throw Error('Runtime executable/module references required');
  const bytes=fs.readFileSync(ref.path);if(hash(bytes)!==ref.sha256||bytes.length!==ref.bytes)throw Error('Runtime reference changed: '+ref.path);
 }
 process.env.CHROMIUM_ARGS=runtime.chromiumArgs.join(' ');
 process.env.PLAYWRIGHT_MODULE=runtime.playwrightModule.path;
 if(runtime.defaultConfig?.appUrl)process.env.APP_URL=runtime.defaultConfig.appUrl;
 if(runtime.defaultConfig?.playwrightBrowsersPath)process.env.PLAYWRIGHT_BROWSERS_PATH=runtime.defaultConfig.playwrightBrowsersPath;
 if(runtime.chromiumChannel)process.env.CHROMIUM_CHANNEL=runtime.chromiumChannel;
 return {runtime,sha256:hash(raw)};
}

// The CPU profile replaces displayed surfaces with ordinary world-position Meshes.
// Its frozen trajectory and shader materials stay intact. Only this process's
// capture adapter substitutes pose diagnostics and supplies the approved mesh-fit camera.
export async function installCpuCapture(p, spec) {
 return p.evaluate(s=>{
  const T=__toonT,v=flareInspector.viewer,E=__drill;
  if(!window.__threadneedle?.source.length)throw Error('Actual CPU Threadneedle surface is missing');
  if((s.camera.drift??0)!==0||s.camera.orbitDegrees||s.camera.frontSweepDegrees)throw Error('CPU capture requires its fixed source camera');
  const direction=new T.Vector3(...s.camera.dir).normalize(),right=new T.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
  const bounds=new T.Box3(),point=new T.Vector3();
  for(let f=0;f<=240;f+=10){__threadneedle.draw(f/30);for(const piece of __threadneedle.source){const a=piece.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)bounds.expandByPoint(point.fromBufferAttribute(a,i));}}
  const center=bounds.getCenter(new T.Vector3()),tan=Math.tan((s.camera.fov||35)*Math.PI/360);let distance=0;
  for(let f=0;f<=240;f+=10){__threadneedle.draw(f/30);for(const piece of __threadneedle.source){const a=piece.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).sub(center);const z=point.dot(direction);distance=Math.max(distance,Math.abs(point.dot(right))/tan+z,Math.abs(point.dot(up))/tan+z);}}}
  distance*=1.12;const camera=new T.PerspectiveCamera(s.camera.fov||35,1,.01,100);camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.updateMatrixWorld();v.camera=camera;
  const select=E.selectModelProfile.bind(E);
  E.selectModelProfile=function(source){
   if(source.modelProfile!==s.modelProfile)throw Error('CPU capture refuses a different profile');
   select({...source,modelProfile:'training-human-v2plus'});
   for(const piece of __threadneedle.source){const original=v.coach.getObjectByName(piece.originalName);if(original)original.visible=false;piece.mesh.visible=true;}
  };
  E.frame=function(source,t,f){
   if(source.modelProfile!==s.modelProfile)throw Error('CPU frame refuses a different profile');
   const row=__threadneedle.draw(t);__props?.update();
   let nonFinite=0,clipped=0,minY=Infinity;const meshes=[];
   for(const joint of Object.values(row.joints))if(Array.isArray(joint))nonFinite+=joint.filter(x=>!Number.isFinite(x)).length;
   for(const piece of __threadneedle.source){const a=piece.mesh.geometry.attributes.position;let low=Infinity;
    for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i);if(!Number.isFinite(point.x+point.y+point.z)){nonFinite++;continue;}low=Math.min(low,point.y);point.project(camera);if(Math.abs(point.x)>1||Math.abs(point.y)>1||Math.abs(point.z)>1)clipped++;}
    minY=Math.min(minY,low);meshes.push({name:piece.mesh.name,vertices:a.count,minY:low});
   }
   if(nonFinite||clipped)throw Error('CPU displayed surface is non-finite/clipped: '+JSON.stringify({frame:f,nonFinite,clipped}));
   return {M:{J:row.joints,params:{q:row.q},x:[],minY,solverDiagnosticsApplicable:false,cpuDisplayedSurface:{method:'actual CPU-authored displayed meshes',minY,meshes,nonFinite,clipped},frame:f}};
  };
  __threadneedle.draw(0);
  return {policy:'unchanged threadneedle-review/1.0.0-r1 mesh-fit camera',center:center.toArray(),direction:direction.toArray(),distance,fov:camera.fov,margin:1.12};
 },spec);
}

export async function run(options) {
 const {mode,specFile,out,runtimeFile,preview,previewReviewed=false,reviewNote='',entry='auto',fps=30,cameraDistanceScale=1}=options;
 if(!['preview','full'].includes(mode)||!specFile||!out||!runtimeFile)throw Error('mode/spec/out/runtime are required');
 if(!Number.isFinite(cameraDistanceScale)||cameraDistanceScale<1||cameraDistanceScale>2)throw Error('Camera distance scale must be 1..2');
 const root=path.resolve(out),file=path.resolve(specFile);
 if(fs.existsSync(root))throw Error('Output exists; choose a new revision directory');
 const source=(await import(pathToFileURL(file))).default,profile=selectProfile(source,entry),plan=capturePlan(source,{fps,frames:options.frames});
 const actionId=options.stableId||source.id;if(!safeId(actionId))throw Error('Invalid stable action ID');
 if(profile.mode==='cpu-threadneedle'&&(plan.frameCount!==240||fps!==30||cameraDistanceScale!==1))throw Error('CPU profile requires its native 240@30 fixed review camera');
 const runtimeBinding=runtimeEnvironment(path.resolve(runtimeFile));verifyBase();
 const production=read(path.join(REPO,'drill-anim/models/current-production.json'));
 // Explicit production appearance override only for ordinary actions. Motion,
 // camera, props, timeline, tracks and source ID are never rewritten.
 const spec=profile.folder?source:{...source,modelProfile:'training-human-v2plus',alignClavicles:false,v2plus:{...production.v2plus,...source.v2plus,skin:'realistic'}};
 const frozen=fingerprint(file,profile),identity={tool:VERSION,toolSha256:hash(fs.readFileSync(SELF)),sourceSha256:frozen.sha256,specId:source.id,actionId,profile,fps,durationSeconds:plan.durationSeconds,frameCount:plan.frameCount,size:1080,cameraDistanceScale,runtimeSha256:runtimeBinding.sha256};
 let previous;
 if(mode==='full') {
  if(!preview||!previewReviewed||!reviewNote.trim())throw Error('Full capture needs --preview, --preview-reviewed and an actual-viewing --review-note');
  previous=read(path.join(preview,'capture.json'));checkPreview(previous,identity);
  for(const item of previous.files){const f=path.resolve(preview,item.path);if(!f.startsWith(path.resolve(preview)+path.sep)||hash(fs.readFileSync(f))!==item.sha256)throw Error('Preview artifact changed: '+item.path);}
 }
 const frames=mode==='full'?Array.from({length:plan.frameCount+1},(_,i)=>i):plan.previewFrames;
 const report={...identity,mode,frames,peakFrame:plan.peakFrame,complete:false,reviewed:false,releaseEligible:false,qaStatus:'pending-user-review',sourceFps:source.fps,files:[],sequences:{},metrics:[],started:new Date().toISOString(),
  ...(previous?{preview:{path:path.resolve(preview),captureSha256:hash(fs.readFileSync(path.join(preview,'capture.json'))),actualViewingNote:reviewNote}}:{}),
  limits:['New test-pack source only; no App publication or whole-action approval.','Legacy contact diagnostics do not certify special shader-deformed surfaces.','CPU profile diagnostics inspect actual displayed meshes; hidden rig solver diagnostics are inapplicable.']};
 fs.mkdirSync(root,{recursive:true});const temp=path.join(root,'work/browser-temp');fs.mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;process.env.TMPDIR=temp;
 const ref=f=>{const raw=fs.readFileSync(f);return {root:'media',path:path.relative(root,f).replaceAll('\\','/'),sha256:hash(raw),bytes:raw.length};};
 const base=path.join(root,mode==='full'?'masters':'qa/preview','realistic',actionId);fs.mkdirSync(base,{recursive:true});write(path.join(base,'source-manifest.json'),frozen);
 const records=Object.fromEntries(LAYERS.map(l=>[l,[]])),endpoints={};let browser;
 try {
  const [{boot},{loadTheme}]=await Promise.all([import('../../drill-anim/lib/boot.mjs'),import('../../drill-anim/lib/config.mjs')]);
  const theme=loadTheme('themes/glow-soft.json'),opened=await boot({size:1080,pr:1,theme,bakeHands:spec.bakeHands||[]});browser=opened.b;const p=opened.p;
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&/shader|compiled|VALIDATE_STATUS/i.test(m.text()))errors.push(m.text());});
  report.runtime=await p.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {unmaskedRenderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,contextLost:gl.isContextLost()};});
  if(browser.version()!==runtimeBinding.runtime.browserVersion||report.runtime.contextLost||report.runtime.unmaskedRenderer!==runtimeBinding.runtime.actualWebGLRenderer)throw Error('Actual browser/GPU differs from approved runtime');
  const loaderFile=profile.folder?path.join(REPO,'drill-anim/models',profile.folder,'loader.mjs'):path.join(REPO,'drill-anim/lib/human-v2plus.mjs');
  const loader=await import(pathToFileURL(loaderFile));report.model=await loader[profile.exportName](p,spec);
  await p.evaluate(([s,t,scale,cpu])=>{const v=flareInspector.viewer;
   v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0x000000,0);if(v.shadowCatcher)v.shadowCatcher.visible=false;
   __setHighlight(s.highlight);__toonUni.uSinkK.value=s.clothSink??1;for(const prop of s.props||[])__props.add(t,prop);
   if(!cpu){if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,1080);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));}
  },[spec,theme,cameraDistanceScale,profile.mode==='cpu-threadneedle']);
  if(profile.mode==='cpu-threadneedle')report.camera=await installCpuCapture(p,spec);
  else report.camera=await p.evaluate(()=>{const v=flareInspector.viewer;return {policy:'source camera recipe; UI insets removed; FOV set before fit',position:__drill.cam0.pos.toArray(),target:__drill.cam0.tgt.toArray(),fov:v.camera.fov};});
  await p.addScriptTag({content:fs.readFileSync(path.join(REPO,'drill-anim/tools/v2/browser-layers.js'),'utf8')});
  for(let i=0;i<3;i++){await p.evaluate(s=>__v2Layers.capture(s,0,0,null,[]),spec);await p.waitForTimeout(100);}
  let warm=null;
  for(const f of frames) {
   const result=await p.evaluate(([s,f,fps,w,cpu])=>{const r=__v2Layers.capture(s,f/fps,f,w,['body','highlight','shadow']);if(cpu)r.metrics.visibleSurface=r.metrics.cpuDisplayedSurface;const gl=flareInspector.viewer.renderer.getContext();if(gl.isContextLost())throw Error('WebGL context lost');return r;},[spec,f,fps,mode==='full'?warm:null,profile.mode==='cpu-threadneedle']);
   if(errors.length)throw Error('Browser/shader errors: '+errors.join('; '));
   if(!Number.isFinite(result.metrics.minY)||Object.values(result.metrics.J||{}).some(j=>Array.isArray(j)&&j.some(v=>!Number.isFinite(v))))throw Error('Non-finite captured pose');
   warm=result.metrics.x;report.metrics.push({frame:f,time:f/fps,...result.metrics});
   for(const layer of LAYERS) {
    const url=result[layer];if(typeof url!=='string'||!url.startsWith('data:image/png;base64,'))throw Error('Missing transparent PNG layer '+layer);
    const bytes=Buffer.from(url.split(',')[1],'base64');if(bytes.readUInt32BE(16)!==1080||bytes.readUInt32BE(20)!==1080||bytes[25]!==6)throw Error('Expected actual 1080 RGBA PNG');
    const folder=mode==='full'&&f===plan.frameCount?path.join(root,'qa/endpoints/realistic',actionId,layer):path.join(base,layer);fs.mkdirSync(folder,{recursive:true});
    const dest=path.join(folder,`${{body:'m',highlight:'k',shadow:'s'}[layer]}-${String(f).padStart(4,'0')}.png`);fs.writeFileSync(dest,bytes,{flag:'wx'});const record={frame:f,...ref(dest)};report.files.push(ref(dest));
    if(mode==='full'&&f===plan.frameCount)endpoints[layer]=record;else records[layer].push(record);
   }
   console.log(JSON.stringify({event:'rgba-frame',actionId,specId:source.id,mode,frame:f,total:plan.frameCount,minY:result.metrics.minY}));
  }
  report.shadowAudit=await p.evaluate(()=>__v2Layers.shadowAudit());
  if(!report.shadowAudit.length||report.shadowAudit.some(x=>x.vertexEquivalent!==true))throw Error('No verified source-vertex shadow casters');
  verifyBase();if(fingerprint(file,profile).sha256!==frozen.sha256)throw Error('Capture sources changed during execution');
  for(const layer of LAYERS){const dest=path.join(base,layer,'index.json');write(dest,{format:'pose-hub-frame-sequence@2',width:1080,height:1080,fps,durationSeconds:plan.durationSeconds,frameCount:records[layer].length,alpha:true,alphaMode:'straight',frames:records[layer]});report.sequences[layer]=ref(dest);report.files.push(ref(dest));}
  const manifest={format:'pose-hub-layer-render@2',actionId,specId:source.id,skin:'realistic',complete:mode==='full',sourceSha256:frozen.sha256,spec:{path:path.relative(REPO,file).replaceAll('\\','/'),sha256:hash(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n'))},model:{id:profile.profile,version:profile.version},width:1080,height:1080,fps,durationSeconds:plan.durationSeconds,frameCount:mode==='full'?plan.frameCount:frames.length,alphaMode:'straight',sequences:report.sequences,qaEndpoint:endpoints,camera:report.camera,sourceCamera:source.camera,cameraDistanceScale,status:'draft-unreviewed',reviewed:false,releaseEligible:false,qaStatus:'pending-user-review',highlight:{encoding:'depth-tested grayscale RGB coverage; foreground alpha',bodyHighlightBaked:false},shadow:{method:'source-vertex-equivalent directional-light-shadow-map',audit:report.shadowAudit},runtime:report.runtime,runtimeSha256:runtimeBinding.sha256};
  write(path.join(base,'layer-manifest.json'),manifest);report.files.push(ref(path.join(base,'layer-manifest.json')));
  write(path.join(base,'metrics.json'),report.metrics);report.files.push(ref(path.join(base,'metrics.json')));
  if(options.framingFile){const recipe=read(options.framingFile);if(!Array.isArray(recipe.crop)||recipe.crop.length!==4||recipe.crop.some(x=>!Number.isFinite(x)))throw Error('Invalid fixed framing');const f=path.join(root,'framing.json');write(f,recipe);report.framing=ref(f);}
  report.complete=true;report.finished=new Date().toISOString();write(path.join(root,'capture.json'),report);console.log(JSON.stringify({event:'rgba-complete',root,actionId,mode,frameCount:report.frameCount}));return report;
 } catch(error) {write(path.join(root,'failed.json'),{...report,error:String(error),finished:new Date().toISOString()});throw error;}
 finally {if(browser)await browser.close();}
}

export function parseArgs(args) {
 const [mode,...rest]=args,options={mode};const keys={'--spec':'specFile','--out':'out','--runtime':'runtimeFile','--stable-id':'stableId','--preview':'preview','--review-note':'reviewNote','--entry':'entry','--fps':'fps','--frames':'frames','--camera-distance-scale':'cameraDistanceScale','--framing':'framingFile','--catalog':'catalogFile','--source-root':'sourceRoot'};
 for(let i=0;i<rest.length;i++){const key=rest[i];if(key==='--preview-reviewed'){options.previewReviewed=true;continue;}if(!Object.hasOwn(keys,key)||rest[i+1]===undefined||rest[i+1].startsWith('--'))throw Error('Unknown/incomplete argument '+key);const value=rest[++i];options[keys[key]]=key==='--frames'?value.split(',').map(Number):['--fps','--camera-distance-scale'].includes(key)?Number(value):value;}
 return options;
}

export async function executionPlan(options) {
 if(!options.catalogFile||!options.sourceRoot||!options.runtimeFile)throw Error('Plan requires --catalog, --source-root and --runtime');
 const catalog=read(options.catalogFile),actions=[];
 for(const row of catalog.actions.filter(a=>a.state==='pending-latest-transparent-full-layers')) {
  const file=path.join(REPO,row.source.spec.path),source=(await import(pathToFileURL(file))).default;
  if(source.id!==row.revision||hash(fs.readFileSync(file))!==row.source.spec.sha256)throw Error('Catalog selected spec changed: '+row.id);
  const entry=row.semanticMetadata?.modelEntry?.includes('native-open-r1')?'native-open-r1':'auto';
  const profile=selectProfile(source,entry),plan=capturePlan(source,{fps:30});
  const family=row.family==='dot'||row.source.selectionFamily?'dot':'pr15';
  // Do not derive a model or a stable ID from a numbered Dot label.
  const group=entry==='native-open-r1'?'dot':family;
  const folder=path.join(path.resolve(options.sourceRoot),group,row.id);
  const common=['--spec',row.source.spec.path,'--stable-id',row.id,'--runtime',path.resolve(options.runtimeFile),'--entry',entry];
  actions.push({id:row.id,specId:source.id,profile,sourceFps:source.fps,deliveryFps:30,durationSeconds:plan.durationSeconds,frameCount:plan.frameCount,
   preview:['node','tools/app-test-pack/render_latest.mjs','preview',...common,'--out',path.join(folder,'preview-r1')],
   fullAfterActualViewing:['node','tools/app-test-pack/render_latest.mjs','full',...common,'--out',path.join(folder,'full-r1'),'--preview',path.join(folder,'preview-r1'),'--preview-reviewed','--review-note','REPLACE with actual inspected frames and findings']});
 }
 return {format:'pose-hub-testpack-source-execution-plan@1',maxConcurrentRenderers:2,jobsPerProcess:1,startsBrowsers:false,actions};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF){const options=parseArgs(process.argv.slice(2));if(options.mode==='plan')console.log(JSON.stringify(await executionPlan(options),null,2));else await run(options);}
