// Review the actual CPU-authored meshes. Legacy handClip/hidden rig is unused.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {boot} from '../lib/boot.mjs';
import {loadTheme} from '../lib/config.mjs';
import {applyThreadneedle,verifyThreadneedle} from '../models/threadneedle-native-r1/loader.mjs';
export const VERSION='threadneedle-review/1.0.0-r1';
const here=path.dirname(fileURLToPath(import.meta.url));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fileHash=file=>hash(fs.readFileSync(file));
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
export async function run(mode,file,out,preview){
 if(!['preview','full'].includes(mode))throw Error('Mode must be preview or full');
 if(fs.existsSync(out))throw Error('Output exists; choose a new directory');
 const spec=(await import(pathToFileURL(path.resolve(file)))).default;
 if(spec.id!=='h-kneeling-thread-needle-rr1'||spec.modelProfile!=='training-human-v2plus-threadneedle-native'||spec.threadneedleNative?.version!=='1.0.0-r1'||spec.timeline.duration!==8)throw Error('Explicit scoped threadneedle revision required');
 verifyThreadneedle();
 const manifestFile=path.join(here,'../models/threadneedle-native-r1/manifest.json');
 const identity={tool:VERSION,id:spec.id,specSha256:hash(JSON.stringify(spec)),manifestSha256:fileHash(manifestFile),toolSha256:fileHash(fileURLToPath(import.meta.url))};
 if(mode==='full'){
  if(!preview)throw Error('A completed matching preview is required');
  const previous=JSON.parse(fs.readFileSync(path.join(preview,'review.json'),'utf8'));
  for(const key of Object.keys(identity))if(previous[key]!==identity[key])throw Error('Preview provenance mismatch: '+key);
  if(previous.mode!=='preview'||!previous.complete||previous.clippedFrames.length||previous.nonFiniteFrames.length)throw Error('Preview did not pass capture checks');
  for(const item of previous.files)if(fileHash(path.join(preview,item.path))!==item.sha256)throw Error('Preview artifact changed: '+item.path);
 }
 fs.mkdirSync(out,{recursive:true});
 const frames=mode==='full'?Array.from({length:241},(_,i)=>i):[0,30,60,90,120,150,180,210,239,240];
 const report={...identity,mode,complete:false,profile:{profile:spec.modelProfile,version:spec.threadneedleNative.version},frames,
  fps:30,sourceFps:30,durationSeconds:8,width:720,height:720,reviewed:false,releaseEligible:false,
  solverDiagnosticsApplicable:false,solverWarningFrames:[],diagnosticWarningFrames:[],clippedFrames:[],nonFiniteFrames:[],files:[],metrics:[],
  limits:['Precomputed independent trajectory; legacy solver and handClip diagnostics are not applicable.',
   'Every displayed mesh is checked for finite coordinates and framing. Actual surface contact and intersection QA is recorded separately.',
   'Local review video; publication and user acceptance remain pending.']};
 let browser;
 try{
  const theme=loadTheme('themes/glow-soft.json'),{b,p}=await boot({size:720,pr:1,theme});browser=b;
  const errors=[];p.on('pageerror',error=>errors.push(String(error)));
  await applyThreadneedle(p,spec);
  report.camera=await p.evaluate(([s,t])=>{
   const T=__toonT,v=flareInspector.viewer;__setHighlight(s.highlight);for(const prop of s.props||[])__props.add(t,prop);
   const direction=new T.Vector3(...s.camera.dir).normalize(),right=new T.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
   const bounds=new T.Box3(),point=new T.Vector3();
   for(let frame=0;frame<=240;frame+=10){__threadneedle.draw(frame/30);for(const piece of __threadneedle.source){const p=piece.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(point.fromBufferAttribute(p,i));}}
   const center=bounds.getCenter(new T.Vector3()),tan=Math.tan((s.camera.fov||35)*Math.PI/360);let distance=0;
   for(let frame=0;frame<=240;frame+=10){__threadneedle.draw(frame/30);for(const piece of __threadneedle.source){const p=piece.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).sub(center);const z=point.dot(direction);distance=Math.max(distance,Math.abs(point.dot(right))/tan+z,Math.abs(point.dot(up))/tan+z);}}}
   distance*=1.12;const camera=new T.PerspectiveCamera(s.camera.fov||35,1,.01,100);camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.updateMatrixWorld();
   window.__tnReviewCamera=camera;v.renderer.setClearColor(0x101013,1);__glowU.value=0;
   return {center:center.toArray(),direction:direction.toArray(),distance,fov:camera.fov,margin:1.12,source:'actual displayed mesh bounds sampled at 25 poses'};
  },[spec,theme]);
  for(const frame of frames){
   const result=await p.evaluate(f=>{
    const row=__threadneedle.draw(f/30),v=flareInspector.viewer,camera=__tnReviewCamera,T=__toonT,point=new T.Vector3();let clipped=0,nonFinite=0;
    for(const joint of Object.values(row.joints))if(Array.isArray(joint))nonFinite+=joint.filter(x=>!Number.isFinite(x)).length;
    for(const piece of __threadneedle.source){const positions=piece.mesh.geometry.attributes.position;for(let i=0;i<positions.count;i++){
     point.fromBufferAttribute(positions,i);if(!Number.isFinite(point.x+point.y+point.z)){nonFinite++;continue;}point.project(camera);if(Math.abs(point.x)>1||Math.abs(point.y)>1||Math.abs(point.z)>1)clipped++;
    }}
    v.renderer.render(v.scene,camera);return {J:row.joints,q:row.q,clipped,nonFinite,png:v.renderer.domElement.toDataURL('image/png')};
   },frame);
   if(errors.length)throw Error('Page errors: '+errors.join('; '));
   if(result.clipped)report.clippedFrames.push(frame);if(result.nonFinite)report.nonFiniteFrames.push(frame);
   const bytes=Buffer.from(result.png.split(',')[1],'base64'),name=`frame-${String(frame).padStart(4,'0')}.png`;
   fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});report.files.push({path:name,bytes:bytes.length,sha256:hash(bytes)});delete result.png;report.metrics.push({frame,...result});
   if(frame%30===0)console.log(spec.id,mode,frame+'/240');
  }
  await browser.close();browser=null;
  verifyThreadneedle();if(fileHash(manifestFile)!==identity.manifestSha256)throw Error('Profile changed during capture');
  const a=report.metrics[0].J,z=report.metrics.at(-1).J;
  report.loopJointErrorMm=Math.max(...Object.keys(a).filter(k=>Array.isArray(a[k])&&Array.isArray(z[k])).map(k=>Math.hypot(...a[k].map((v,i)=>v-z[k][i]))*1000));
  report.loopPngIdentical=report.files[0].sha256===report.files.at(-1).sha256;
  if(report.clippedFrames.length||report.nonFiniteFrames.length||!report.loopPngIdentical||!Number.isFinite(report.loopJointErrorMm)||report.loopJointErrorMm>1e-4)throw Error('Framing, finite geometry or loop checks failed');
  if(mode==='full'){
   const video=path.join(out,'review.mp4'),encoded=spawnSync('ffmpeg',['-v','error','-nostdin','-framerate','30','-i',path.join(out,'frame-%04d.png'),'-frames:v','240','-an','-c:v','libx264','-threads','2','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-n',video],{encoding:'utf8'});
   if(encoded.status!==0)throw Error('Encoding failed: '+encoded.stderr);
   const probe=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_streams','-of','json',video],{encoding:'utf8'});
   if(probe.status!==0)throw Error('Video probe failed');
   const stream=JSON.parse(probe.stdout).streams[0];
   if(stream.codec_name!=='h264'||stream.width!==720||stream.height!==720||stream.nb_frames!=='240'||Number(stream.duration)!==8)throw Error('Video properties mismatch');
   report.files.push({path:'review.mp4',bytes:fs.statSync(video).size,sha256:fileHash(video)});
  }
  report.complete=true;write(path.join(out,'review.json'),report);
 }catch(error){write(path.join(out,'failed.json'),{...report,error:String(error)});throw error;}
 finally{if(browser)await browser.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,file,out,...rest]=process.argv.slice(2),i=rest.indexOf('--preview');
 await run(mode,file,out,i<0?null:rest[i+1]);
}
