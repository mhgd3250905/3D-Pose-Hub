// One-action foot-direction correction: replay saved body targets, change feet only.
// Original 94-item production and portable package are immutable inputs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.join(repo,'output/training-human-v2-library-final-20261013/jobs/erectors-B');
const revision=path.join(repo,'tools/drill-anim/revisions/erectors-B-footfix-20261013');
const out=path.join(repo,'output/training-human-v2-erectors-B-footfix-20261013');
const py='E:/AII-3D/3D-Pose/hark-4080-venv/Scripts/python.exe';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
assert(!fs.existsSync(out),'Choose a new output; completed media is never overwritten');
const original=read(source+'/spec.json'),authored=read(revision+'/spec.json');
const spec={...authored,modelProfile:'training-human-v2',alignClavicles:false,size:1080,fps:30};
const expected=structuredClone(original);for(const side of ['left','right'])expected.pose.base.feet[side].heading=90;expected.props.find(p=>p.type==='wall').at[0]=-0.545584;
assert.deepEqual(spec,expected,'Only two foot headings and wall support face may change');
const model=read(path.join(repo,'tools/drill-anim/models/training-human-v2.json'));
for(const [p,sha]of Object.entries(model.sourceSha256)){
 const bytes=fs.readFileSync(path.join(repo,p));assert.equal(crypto.createHash('sha256').update(p.endsWith('.glb')?bytes:bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex'),sha,p);
}
const protectedFiles=['spec.json','input.json','result.json','frames/met-cycle.json','composite/place.json','theme.json'];
const sourceHashes=Object.fromEntries(protectedFiles.map(p=>[p,hash(source+'/'+p)]));
const rows=read(source+'/frames/met-cycle.json');assert.equal(rows.length,241);assert.deepEqual(rows.filter(r=>r.f>=0).map(r=>r.f),Array.from({length:240},(_,i)=>i));
const modelHash=hash(path.join(repo,'tools/drill-anim/models/training-human-v2.json'));
fs.mkdirSync(out+'/frames',{recursive:true});fs.mkdirSync(out+'/composite');fs.mkdirSync(out+'/media');
write(out+'/spec.json',spec);write(out+'/model.json',model);fs.copyFileSync(source+'/theme.json',out+'/theme.json');fs.copyFileSync(source+'/composite/place.json',out+'/composite/place.json');
write(out+'/status.json',{phase:'rendering',completedFrames:0,totalFrames:240});
write(out+'/source.json',{sourceRoot:source,sourceHashes,revisionSpecSha256:hash(revision+'/spec.json'),modelHash,rendererSha256:hash(fileURLToPath(import.meta.url)),sourceReplay:'Exact saved solver x and final wrist targets; original waveform/camera/pulse/props retained apart from wall face. Body-joint equality checked at every sample; original touch solve compared at 3 real key frames.'});
process.env.APP_URL='http://127.0.0.1:8871';process.env.APP_DIR=repo;
const {boot}=await import('./lib/boot.mjs');
const theme=read(out+'/theme.json');const {b,p,info}=await boot({size:1080,pr:2,theme});
const browserErrors=[];p.on('pageerror',e=>browserErrors.push(e.message));
const checks=[],metrics=[],golden=[];
try{
 await p.evaluate(([old,fixed,rows,th])=>{
  const E=__drill,v=flareInspector.viewer;
  __setHighlight(fixed.highlight);for(const prop of fixed.props)__props.add(th,prop);
  __setTrainingCollar(false);const reference=E.meshCache(),resolve=E.touchResolve;
  __setTrainingCollar(true);const actual=E.meshCache(),select=E.selectModelProfile;
  E.selectModelProfile=function(s){const r=select.call(this,s);this._mc=__trainingCollarReport.enabled?actual:reference;return r};
  const realTouch=function(...args){const prior=this._mc;this._mc=reference;try{return resolve.apply(this,args)}finally{this._mc=prior}};
  const realApply=E.applyAt;
  window.__footfix={row:null,rows,realTouch,bodyBones:()=>{const all={};v.coach.updateMatrixWorld(true);v.coach.traverse(o=>{if(o.isBone&&!/Foot|Toe/.test(o.name))all[o.name]=o.matrixWorld.toArray()});return all}};
  E.solve=function(){if(!__footfix.row)throw Error('Source row not selected');return structuredClone(__footfix.row.x)};
  E.applyAt=function(s,t,w){const i=Math.round(t*30);__footfix.row=__footfix.rows.find(r=>r.f===i);if(!__footfix.row||Math.abs(__footfix.row.t-t)>1e-8)throw Error('Only exact source sample times are allowed');return realApply.call(this,s,t,w)};
  E.touchResolve=function(pose,s,tc,w,after){pose.limbs[s].wrist=__footfix.row.J[s+'Wrist'].slice();v.motion.applyPose(pose,{playback:false});v.coach.updateMatrixWorld(true);after?.();return __footfix.row.touch[s]};
  window.__footfix.replayTouch=E.touchResolve;
  E.setupCamera({...old,modelProfile:'legacy-v7',trainingCollar:false},1080);
 },[original,spec,rows,theme]);
 for(const t of [0,2,3.2]){
  const proof=await p.evaluate(([s,t])=>{const E=__drill,F=__footfix;E.touchResolve=F.realTouch;E.applyAt(s,t,null);const real=F.bodyBones();E.touchResolve=F.replayTouch;E.applyAt(s,t,null);const replay=F.bodyBones();let max=0;for(const n in real)for(let k=0;k<16;k++)max=Math.max(max,Math.abs(real[n][k]-replay[n][k]));return{t,nonFootBoneDelta:max}},[original,t]);
  assert(proof.nonFootBoneDelta<1e-8,'Saved wrist replay differs from original actual touch solve');golden.push(proof);
 }
 for(let f=-1;f<240;f++){
  const t=f<0?original.stillAt:f/30;
  const r=await p.evaluate(([old,fixed,f,t])=>{
   const E=__drill,F=__footfix,v=flareInspector.viewer,T=__toonT;
   E.applyAt(old,t,null);const before=F.bodyBones();
   const shot=E.frame(fixed,t,f,null,{size:1080,full:true}),after=F.bodyBones();let boneDelta=0,jointMm=0;
   for(const n in before)for(let k=0;k<16;k++)boneDelta=Math.max(boneDelta,Math.abs(before[n][k]-after[n][k]));
   for(const n in F.row.J)if(!/Toe/.test(n))for(let k=0;k<3;k++)jointMm=Math.max(jointMm,Math.abs(F.row.J[n][k]-shot.M.J[n][k])*1000);
   const feet={left:{minX:9,minY:9,vertices:0},right:{minX:9,minY:9,vertices:0}};
   v.coach.traverse(o=>{if(!o.isSkinnedMesh||!o.visible||!/Sneaker|Sole/.test(o.name))return;o.skeleton.update();const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,point=new T.Vector3();for(let i=0;i<g.attributes.position.count;i++){let a=0;for(let k=1;k<4;k++)if(sw.getComponent(i,k)>sw.getComponent(i,a))a=k;const bn=o.skeleton.bones[si.getComponent(i,a)].name;if(!/Foot/.test(bn))continue;const q=feet[bn.startsWith('left')?'left':'right'];o.getVertexPosition(i,point);point.applyMatrix4(o.matrixWorld);q.minX=Math.min(q.minX,point.x);q.minY=Math.min(q.minY,point.y);q.vertices++}});
   const wall=fixed.props.find(p=>p.type==='wall').at[0];for(const [s,q]of Object.entries(feet)){q.wallGapMm=(q.minX-wall)*1000;q.toeDirectionX=shot.M.J[s+'Toe'][0]-shot.M.J[s+'Ankle'][0]}
   return{...shot,proof:{f,t,nonFootBoneDelta:boneDelta,bodyJointMm:jointMm,feet}};
  },[original,spec,f,t]);
  assert(r.proof.nonFootBoneDelta<1e-8&&r.proof.bodyJointMm<1e-5,'Existing body motion changed');
  for(const q of Object.values(r.proof.feet))assert(q.vertices>8900&&q.minY>=-1e-6&&q.minY<1e-5&&q.wallGapMm>=0&&q.wallGapMm<2&&q.toeDirectionX>0,'Foot direction/floor/wall validation failed');
  const name=f<0?'still':String(f).padStart(4,'0');for(const [key,prefix]of[['main','m'],['glow','g']])fs.writeFileSync(out+'/frames/'+prefix+'-'+name+'.png',Buffer.from(r[key].split(',')[1],'base64'));
  checks.push(r.proof);metrics.push({f,t,...r.M});
  if(f>=0&&f%30===0){write(out+'/status.json',{phase:'rendering',completedFrames:f+1,totalFrames:240});console.log('rendered '+(f+1)+'/240')}
 }
 assert.deepEqual(browserErrors,[]);write(out+'/renderer.json',{info,errors:browserErrors,profile:await p.evaluate(()=>__trainingCollarReport)});
}finally{await b.close()}
write(out+'/frames/met-cycle.json',metrics);write(out+'/footfix-preservation.json',{pass:true,frames:240,checkedIncludingStill:241,originalActualTouchGoldenChecks:golden,nonFootBoneDeltaMax:Math.max(...checks.map(c=>c.nonFootBoneDelta)),bodyJointMmMax:Math.max(...checks.map(c=>c.bodyJointMm)),sourceHashes,checks});
const child=(exe,args,log)=>new Promise((resolve,reject)=>{const stream=fs.createWriteStream(out+'/'+log,{flags:'a'}),p=spawn(exe,args,{cwd:repo,windowsHide:true,env:{...process.env,PYTHONUTF8:'1',OMP_NUM_THREADS:'2',OPENBLAS_NUM_THREADS:'2'}});p.stdout.pipe(stream);p.stderr.pipe(stream);p.on('error',reject);p.on('close',c=>{stream.end();c===0?resolve():reject(Error(exe+' exited '+c))})});
write(out+'/status.json',{phase:'compositing'});
await Promise.all(['still','0:60','60:120','120:180','180:240'].map((range,i)=>child(py,['tools/drill-anim/lib/comp.py',out+'/frames',out+'/spec.json',out+'/theme.json',out+'/composite',range],'composite-'+i+'.log')));
await child(py,['tools/drill-anim/lib/qa.py',out+'/frames',out+'/spec.json',out+'/qa.json',out+'/composite'],'qa.log');
const qa=read(out+'/qa.json');assert(qa.frames_complete&&qa.frames===240&&!qa.below_floor&&qa.frame_edge_touch_frames===0);
write(out+'/status.json',{phase:'encoding'});
const media={};for(const [name,size,crf]of[['master',1080,18],['mobile',720,20]]){
 const file=out+'/media/erectors-B-'+name+'.mp4';await child('ffmpeg',['-v','error','-framerate','30','-i',out+'/composite/%04d.png','-frames:v','240',...(size===720?['-vf','scale=720:720:flags=lanczos']:[]),'-c:v','libx264','-threads','2','-crf',String(crf),'-pix_fmt','yuv420p','-movflags','+faststart',file],'encode-'+name+'.log');
 const probe=spawnSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=codec_name,width,height,pix_fmt,nb_read_frames:format=duration','-of','json',file],{windowsHide:true,encoding:'utf8'});assert.equal(probe.status,0);const data=JSON.parse(probe.stdout),s=data.streams[0];assert.equal(s.codec_name,'h264');assert.equal(s.pix_fmt,'yuv420p');assert.equal(s.width,size);assert.equal(s.height,size);assert.equal(Number(s.nb_read_frames),240);assert.equal(Number(data.format.duration),8);
 await child('ffmpeg',['-v','error','-xerror','-threads','1','-i',file,'-f','null','-'],'decode-'+name+'.log');media[name]={path:path.relative(out,file).replaceAll('\\','/'),sha256:hash(file),bytes:fs.statSync(file).size,decodeVerified:true,probe:data};
}
await child(py,['-c',"from PIL import Image;import sys;Image.open(sys.argv[1]).convert('RGB').resize((540,540),Image.Resampling.LANCZOS).save(sys.argv[2],quality=92)",out+'/composite/still.png',out+'/media/erectors-B-poster.jpg'],'poster.log');
assert.deepEqual(Object.fromEntries(protectedFiles.map(p=>[p,hash(source+'/'+p)])),sourceHashes);assert.equal(hash(path.join(repo,'tools/drill-anim/models/training-human-v2.json')),modelHash);
write(out+'/result.json',{id:'erectors-B',name:'瑞士球背伸',revision:'footfix-20261013',frames:240,duration:8,fps:30,modelProfile:model.id,modelVersion:model.version,sourceHashes,preservation:'footfix-preservation.json',qa,media,poster:{path:'media/erectors-B-poster.jpg',sha256:hash(out+'/media/erectors-B-poster.jpg'),time:2},status:qa.pass&&qa.solver_warning_frames===0?'ready':'review_required'});
write(out+'/status.json',{phase:'complete',complete:true});console.log('Completed foot correction '+out);
