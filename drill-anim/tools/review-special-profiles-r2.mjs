// Explicit review-only entrypoint. Frozen render/model sources are not changed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {boot} from '../lib/boot.mjs';
import {loadTheme} from '../lib/config.mjs';

export const VERSION='special-profile-review/1.0.0-r2';
const here=path.dirname(fileURLToPath(import.meta.url));
const choices={
 'h-kneeling-instep-stretch-rr6':['training-human-v2plus-instep-native','instepNative','1.0.0-r1','instep-native-r1','applyInstepNative'],
 'h-db-overhead-triceps-extension-rr2':['training-human-v2plus',null,'1.0.0-rc2','../lib','applyHumanV2plus'],
 'h-wall-palm-lift-rr5':['training-human-v2plus-contact-wrist','wristSkinning','1.0.0-r5.1','contact-r5','applyHumanWrist'],
 'h-kneeling-instep-stretch-rr5':['training-human-v2plus-barefoot-bridge','barefoot','1.0.0-r5.2','barefoot-r5','applyHumanBarefootBridge'],
 'h-bent-knee-calf-raise-rr7':['training-human-v2plus-hands-native','nativeHands','1.0.0-r3','hands-native-r3','applyHandsNative'],
 'h-chair-single-leg-hip-thrust-rr8':['training-human-v2plus-hands-native','nativeHands','1.0.0-r3','hands-native-r3','applyHandsNative'],
};
export function selectProfile(spec){
 const row=choices[spec.id];
 if(!row||spec.modelProfile!==row[0]||(row[1]!==null&&spec[row[1]]?.version!==row[2]))throw Error('Unsupported action/profile/version; no fallback to the base model');
 if(![15,30].includes(spec.fps)||spec.timeline?.duration!==8)throw Error('Only validated 8-second actions are supported');
 return {profile:row[0],version:row[2],folder:row[3],exportName:row[4]};
}
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fileHash=file=>hash(fs.readFileSync(file));
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
export function checkPreview(report,expected){
 for(const key of ['tool','id','specSha256','manifestSha256','toolSha256'])if(report[key]!==expected[key])throw Error('Preview provenance mismatch: '+key);
 if(report.mode!=='preview'||report.complete!==true||report.frames?.join(',')!=='0,30,60,90,120,150,180,210,239,240')throw Error('A completed preview from this entrypoint is required');
}
export async function run({file,out,mode,preview}){
 if(!['preview','full'].includes(mode))throw Error('Mode must be preview or full');
 if(fs.existsSync(out))throw Error('Output exists; choose a new directory');
 const spec=(await import(pathToFileURL(path.resolve(file)))).default,profile=selectProfile(spec);
 const manifestFile=profile.profile==='training-human-v2plus'?path.join(here,'../models/training-human-v2plus.json'):path.join(here,'../models',profile.folder,'manifest.json');
 const provenance={tool:VERSION,id:spec.id,specSha256:hash(JSON.stringify(spec)),manifestSha256:fileHash(manifestFile),toolSha256:fileHash(fileURLToPath(import.meta.url))};
 const verifyBase=()=>{if(profile.profile!=='training-human-v2plus')return;
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  for(const [rel,sha] of Object.entries(manifest.sourceSha256)){
   const data=fs.readFileSync(path.resolve(here,'../..',rel),'utf8').replaceAll('\r\n','\n');
   if(hash(data)!==sha)throw Error('Frozen base source hash mismatch: '+rel);
  }
 };verifyBase();
 if(mode==='full'){
  if(!preview)throw Error('Full capture requires --preview <completed preview directory>');
  const report=JSON.parse(fs.readFileSync(path.join(preview,'review.json'),'utf8'));
  checkPreview(report,provenance);
  for(const item of report.files)if(fileHash(path.join(preview,item.path))!==item.sha256)throw Error('Preview artifact changed: '+item.path);
  if(spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status!==0)throw Error('ffmpeg is required for full capture');
 }
 fs.mkdirSync(out,{recursive:true});
 const frames=mode==='full'?Array.from({length:241},(_,i)=>i):[0,30,60,90,120,150,180,210,239,240];
 const report={...provenance,profile,mode,frames,complete:false,reviewed:false,releaseEligible:false,reviewCameraDistanceScale:1.08,sourceFps:spec.fps,fps:30,durationSeconds:8,width:720,height:720,
  limits:['Local review only; original skin on dark background, no floor-shadow pass.',
   'All captured poses receive legacy joint/capsule diagnostics. This is not exhaustive mesh contact or self-intersection certification; special shader deformation is not covered by the legacy handClip metric.',
   'The endpoint frame 240 verifies loop closure and is excluded from the 240-frame video.'],metrics:[],files:[]};
 let browser;
 try{
  const theme=loadTheme('themes/glow-soft.json'),{b,p}=await boot({size:720,pr:1,theme});browser=b;
  const pageErrors=[];p.on('pageerror',error=>pageErrors.push(String(error)));
  const loader=await import(pathToFileURL(profile.profile==='training-human-v2plus'?path.join(here,'../lib/human-v2plus.mjs'):path.join(here,'../models',profile.folder,'loader.mjs')));
  await loader[profile.exportName](p,spec);
  await p.evaluate(([s,t])=>{const v=flareInspector.viewer;
   // App control-panel insets are not part of the saved action camera recipe.
   v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();
   __setHighlight(s.highlight);for(const prop of s.props||[])__props.add(t,prop);__drill.setupCamera(s,720);v.renderer.setClearColor(0x101013,1);
   // Joint-fit boxes do not include the crown/fingertip mesh. Keep a review-only margin.
   const cam=__drill.cam0;cam.pos.copy(cam.tgt.clone().add(cam.pos.clone().sub(cam.tgt).multiplyScalar(1.08)));
  },[spec,theme]);
  // Match frozen renderer warm-up and then start the recorded loop from a cold solver.
  for(let i=0;i<3;i++){await p.evaluate(s=>__drill.applyAt(s,0,null),spec);await p.waitForTimeout(400);}
  let warm=null;
  for(const frame of frames){
   const result=await p.evaluate(([s,f,w])=>{
    const v=flareInspector.viewer,render=v.renderer.render,toDataURL=v.renderer.domElement.toDataURL;
    let result;v.renderer.render=()=>{};v.renderer.domElement.toDataURL=()=>'';
    try{result=__drill.frame(s,f/30,f,w,{size:720,full:true});}
    finally{v.renderer.render=render;v.renderer.domElement.toDataURL=toDataURL;__glowU.value=0;}
    v.renderer.render(v.scene,v.camera);
    return {metrics:result.M,png:v.renderer.domElement.toDataURL('image/png')};
   },[spec,frame,mode==='full'?warm:null]);
   if(Object.values(result.metrics.J).some(v=>Array.isArray(v)&&v.some(n=>!Number.isFinite(n))))throw Error('Non-finite joint at frame '+frame);
   if(pageErrors.length)throw Error('Browser errors: '+pageErrors.join('; '));
   warm=result.metrics.x;report.metrics.push({frame,...result.metrics});
   const name=`frame-${String(frame).padStart(4,'0')}.png`,bytes=Buffer.from(result.png.split(',')[1],'base64');
   fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});report.files.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
   if(frame%30===0)console.log(`${spec.id} ${mode} ${frame}/240`);
  }
  await browser.close();browser=null;
  if(fileHash(manifestFile)!==provenance.manifestSha256)throw Error('Manifest changed during capture');
  verifyBase();
  const a=report.metrics[0].J,z=report.metrics.at(-1).J;
  report.loopJointErrorMm=Math.max(...Object.keys(a).filter(k=>Array.isArray(a[k])&&Array.isArray(z[k])).map(k=>Math.hypot(...a[k].map((v,i)=>v-z[k][i]))*1000));
  report.loopPngIdentical=report.files[0].sha256===report.files.at(-1).sha256;
  report.solverWarningFrames=report.metrics.filter(m=>m.solverWarn?.length).map(m=>m.frame);
  report.diagnosticWarningFrames=report.metrics.filter(m=>m.warn?.length).map(m=>m.frame);
  if(mode==='full'){
   const video='review.mp4';
   const result=spawnSync('ffmpeg',['-v','error','-nostdin','-framerate','30','-i',path.join(out,'frame-%04d.png'),'-frames:v','240','-an','-c:v','libx264','-threads','2','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-n',path.join(out,video)],{encoding:'utf8'});
   if(result.status!==0)throw Error('Video encoding failed: '+result.stderr);
   const probe=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_streams','-of','json',path.join(out,video)],{encoding:'utf8'});
   if(probe.status!==0)throw Error('Video verification failed: '+probe.stderr);
   report.video=JSON.parse(probe.stdout).streams[0];
   if(+report.video.nb_frames!==240||report.video.width!==720||report.video.height!==720||report.video.r_frame_rate!=='30/1')throw Error('Unexpected encoded video properties');
   report.files.push({path:video,bytes:fs.statSync(path.join(out,video)).size,sha256:fileHash(path.join(out,video))});
  }
  report.complete=true;write(path.join(out,'review.json'),report);return report;
 }catch(error){report.error=String(error);write(path.join(out,'failed.json'),report);throw error;}
 finally{if(browser)await browser.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,file,out,...args]=process.argv.slice(2);
 if(!file||!out)throw Error('Usage: node review-special-profiles-r2.mjs preview|full spec.js new-out-dir [--preview preview-dir]');
 const unknown=args.filter((v,i)=>i%2===0&&v!=='--preview');if(unknown.length||args.length%2)throw Error('Unknown/incomplete arguments');
 await run({mode,file,out,preview:args[0]==='--preview'?args[1]:undefined});
}
