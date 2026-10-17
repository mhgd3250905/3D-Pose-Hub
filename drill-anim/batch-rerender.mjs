// Versioned, resumable media production. Original specs/media are read-only.
// node batch-rerender.mjs --catalog <json> --out <new-dir> [--only id,id] [--workers 2]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {legacyModel} from './lib/legacy-paths.mjs';
import {pathToFileURL,fileURLToPath} from 'node:url';
const TOOL=path.dirname(fileURLToPath(import.meta.url)),REPO=path.resolve(TOOL,'..');
const args=process.argv.slice(2),option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const PY=option('--python','E:/AII-3D/3D-Pose/hark-4080-venv/Scripts/python.exe');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);};
const stamp=()=>new Date().toISOString();
const child=(exe,argv,log)=>new Promise((resolve,reject)=>{
 const stream=fs.createWriteStream(log,{flags:'a'}),p=spawn(exe,argv,{cwd:REPO,windowsHide:true,env:{...process.env,PYTHONUTF8:'1',OMP_NUM_THREADS:'2',OPENBLAS_NUM_THREADS:'2'}});
 p.stdout.pipe(stream,{end:false});p.stderr.pipe(stream,{end:false});p.on('error',e=>{stream.end();reject(e)});
 p.on('close',code=>{stream.end();code===0?resolve():reject(Error(`${path.basename(exe)} exited ${code}; ${log}`));});
});
function verifyModel(model){
 for(const [name,expected]of Object.entries(model.sourceSha256)){
  const bytes=fs.readFileSync(path.join(REPO,name));
  assert.equal(hash(name.endsWith('.glb')?bytes:bytes.toString('utf8').replace(/\r\n/g,'\n')),expected,`Model input drift: ${name}`);
 }
}
function recipe(){
 const files=['batch-rerender.mjs','theme.json','config.json',...['page','lib','assets'].flatMap(d=>fs.readdirSync(path.join(TOOL,d)).filter(n=>/\.(mjs|js|py|json)$/.test(n)).map(n=>d+'/'+n)),...fs.readdirSync(path.join(REPO,'runtime/src')).filter(n=>n.endsWith('.js')).map(n=>'../runtime/src/'+n)];
 const sha256=Object.fromEntries(files.sort().map(n=>[n,hash(fs.readFileSync(path.join(TOOL,n)).toString('utf8').replace(/\r\n/g,'\n'))]));
 return {id:'full-library-r2',contactReference:'legacy authoring surface',placementReference:'legacy same-source silhouette',pairedFullCycleMetrics:true,pixelRatio:2,sha256};
}
function verifyRecipe(expected){assert.deepEqual(recipe(),expected,'Frozen production code changed; use a new batch directory');}
async function prepare(catalog,out){
 fs.mkdirSync(out,{recursive:true});const model=read(path.join(TOOL,'models/training-human-v2.json'));verifyModel(model);
 const {loadTheme}=await import('./lib/config.mjs');const productionRecipe=recipe();
 const previous=fs.existsSync(out+'/plan.json')?read(out+'/plan.json'):null;
 if(previous)assert.equal(JSON.stringify(legacyModel(previous.model)),JSON.stringify(legacyModel(model)),'A different model requires a new batch directory');
 if(previous)assert.deepEqual(previous.recipe,productionRecipe,'A different production recipe requires a new batch directory');
 const jobs=[];
 for(const entry of catalog.jobs){
  assert(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(entry.id));
  let original;
  if(entry.sourceSpecPath.endsWith('.json'))original=read(entry.sourceSpecPath);
  else original=structuredClone((await import(pathToFileURL(entry.sourceSpecPath).href))[entry.sourceSpecExport||'default']);
  assert(original&&original.timeline?.duration>0,entry.id);
  const spec={...original,modelProfile:model.id,alignClavicles:false,size:1080,fps:30};
  const theme=entry.sourceThemePath?loadTheme(entry.sourceThemePath):loadTheme();
  const input={entry,original,spec,theme,modelId:model.id,modelVersion:model.version,recipe:productionRecipe};
  const fingerprint=hash(JSON.stringify(input));const folder=out+'/jobs/'+entry.id;
  if(fs.existsSync(folder+'/input.json'))assert.equal(read(folder+'/input.json').fingerprint,fingerprint,`Frozen job input changed: ${entry.id}`);
  else write(folder+'/input.json',{...input,fingerprint});
  const snapshots={'spec-original.json':original,'spec.json':spec,'theme.json':theme,'source.json':{...entry,sourceSpecSha256:hash(fs.readFileSync(entry.sourceSpecPath)),sourceThemeSha256:entry.sourceThemePath?hash(fs.readFileSync(entry.sourceThemePath)):null,fingerprint}};
  for(const [name,data]of Object.entries(snapshots)){const file=folder+'/'+name;if(fs.existsSync(file))assert.deepEqual(read(file),data,`Frozen snapshot changed: ${entry.id}/${name}`);else write(file,data);}
  jobs.push({id:entry.id,category:entry.category,fingerprint,frames:Math.round(spec.timeline.duration*30),duration:spec.timeline.duration,posterTime:entry.posterTimeSeconds??spec.stillAt??0,folder});
 }
 const plan={schemaVersion:1,createdAt:previous?.createdAt??stamp(),updatedAt:stamp(),model,recipe:productionRecipe,jobs,exclusions:catalog.exclusions||[],outputs:{master:'1080x1080 H.264/yuv420p/30fps CRF18',mobile:'720x720 H.264/yuv420p/30fps CRF20',poster:'540x540 JPEG at original poster time'},preserveOriginals:true};
 write(out+'/plan.json',plan);return plan;
}
function completeFiles(folder,N){
 const rows=read(folder+'/frames/met-cycle.json');assert.equal(rows.length,N+1);
 const real=rows.filter(r=>r.f>=0);assert.equal(real.length,N);
 assert.deepEqual(real.map(r=>r.f),Array.from({length:N},(_,i)=>i));
 for(const f of ['still',...Array.from({length:N},(_,i)=>String(i).padStart(4,'0'))])for(const prefix of ['m','g'])assert(fs.statSync(folder+'/frames/'+prefix+'-'+f+'.png').size>100,`Missing ${prefix}-${f}`);
}
function probe(file,N,size,duration){
 const r=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=codec_name,pix_fmt,width,height,nb_read_frames:format=duration','-of','json',file],{windowsHide:true,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);const v=JSON.parse(r.stdout),s=v.streams[0];
 assert.equal(s.codec_name,'h264');assert.equal(s.pix_fmt,'yuv420p');assert.equal(s.width,size);assert.equal(s.height,size);assert.equal(Number(s.nb_read_frames),N);assert(Math.abs(Number(v.format.duration)-duration)<.02);
 return {...s,duration:Number(v.format.duration),sha256:hash(fs.readFileSync(file)),bytes:fs.statSync(file).size};
}
function resultIsIntact(job,out){
 const file=job.folder+'/result.json';if(!fs.existsSync(file))return false;
 try{
  const r=read(file),statusFile=job.folder+'/status.json';
  if(!fs.existsSync(statusFile)||read(statusFile).phase!==r.status)return false;
  return r.source.fingerprint===job.fingerprint&&['ready','review_required'].includes(r.status)&&r.decodeVerified===true&&r.frames===job.frames&&r.motionInvariance.pass===true&&
   ['master','mobile'].every(n=>{const m=r.media[n],f=path.join(out,m.path);return fs.existsSync(f)&&hash(fs.readFileSync(f))===m.sha256;})&&fs.existsSync(path.join(out,r.poster))&&hash(fs.readFileSync(path.join(out,r.poster)))===r.posterSha256;
 }catch{return false}
}
function qaCoverage(spec,rows){
 const real=rows.filter(r=>r.f>=0),checks=[];
 const when=(r,w)=>{if(!w||w==='always')return true;if(w.startsWith('locked.'))return Boolean(r.locked[w.split('.')[1]]);const m=w.match(/^params\.(\w+)\s*([<>])\s*([\d.]+)$/);if(m)return m[2]==='<'?(r.params[m[1]]??0)<Number(m[3]):(r.params[m[1]]??0)>Number(m[3]);return true;};
 for(const kind of ['pins','jointPins','straight','touch'])for(const c of spec.qa?.[kind]||[]){
  const frames=real.filter(r=>when(r,c.when)&&(kind!=='pins'||Boolean(r.cen?.[c.c]))&&(kind!=='touch'||Boolean(r.handClip))).length;
  checks.push({kind,target:c.c??c.j??c.side,when:c.when??'always',frames});
 }
 return {checks,inactiveChecks:checks.filter(c=>c.frames===0),historicalNoOriginalDrillQa:Boolean(spec.legacyClipId),originalDrillQaAbsent:Boolean(spec.legacyClipId||spec.bakedClipPath),sourceQaScope:spec.bakedClipPath?'baked source; original IK warnings unavailable':spec.legacyClipId?'historical runtime without authored drill checks':'authored drill checks'};
}
async function worker(folder){
 const input=read(folder+'/input.json'),plan=read(path.resolve(folder,'../../plan.json')),spec=input.spec;
 const N=Math.round(spec.timeline.duration*30),log=folder+'/production.log';fs.mkdirSync(folder+'/frames',{recursive:true});fs.mkdirSync(folder+'/composite',{recursive:true});
 const state=(phase,extra={})=>write(folder+'/status.json',{id:input.entry.id,phase,updatedAt:stamp(),fingerprint:input.fingerprint,...extra});
 try{
  verifyModel(plan.model);verifyRecipe(plan.recipe);
  const {fingerprint,...frozen}=input;assert.equal(hash(JSON.stringify(frozen)),fingerprint,'Frozen input fingerprint changed');
  assert.equal(plan.jobs.find(j=>j.id===input.entry.id)?.fingerprint,fingerprint,'Input differs from batch plan');
  assert.deepEqual(read(folder+'/spec-original.json'),input.original,'Original source snapshot diverged');
  assert.deepEqual(read(folder+'/spec.json'),spec,'Render/QA spec diverged');assert.deepEqual(read(folder+'/theme.json'),input.theme,'Render/composite theme diverged');
  assert.equal(hash(fs.readFileSync(input.entry.sourceSpecPath)),read(folder+'/source.json').sourceSpecSha256,'Frozen source changed');
  if(input.entry.sourceThemePath)assert.equal(hash(fs.readFileSync(input.entry.sourceThemePath)),read(folder+'/source.json').sourceThemeSha256,'Frozen theme changed');
  let alreadyRendered=false;
  try{completeFiles(folder,N);assert.equal(read(folder+'/reference/met-cycle.json').length,N+1);assert.equal(read(folder+'/motion-invariance.json').fullCycle.frames,N);alreadyRendered=true;}catch{}
  if(!alreadyRendered){
   state('rendering');process.env.APP_URL=option('--app-url','http://127.0.0.1:8871');process.env.APP_DIR=REPO;
   const {boot}=await import('./lib/boot.mjs');const {b,p,info}=await boot({size:1080,pr:2,theme:input.theme,bakeHands:spec.bakeHands||[]});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   try{
    if(spec.legacyClipId){await p.addScriptTag({content:fs.readFileSync(path.join(TOOL,'page/history-demo-adapter.js'),'utf8')});await p.evaluate(s=>__installHistoricalDemo(s),spec);}
    if(spec.bakedClipPath){await p.addScriptTag({content:fs.readFileSync(path.join(TOOL,'page/flare-v41-demo-adapter.js'),'utf8')});await p.evaluate(s=>__installFlareV41Demo(s),spec);}
    await p.evaluate(([s,th])=>{
     __setHighlight(s.highlight);__toonUni.uSinkK.value=s.clothSink??1;
     for(const prop of s.props||[])__props.add(th,prop);
     // Authoring contact uses its original body surface. Rendering and QA use the
     // accepted new surface; only the existing touch solver receives this cache.
     __setTrainingCollar(false);const reference=__drill.meshCache(),resolve=__drill.touchResolve;
     __setTrainingCollar(true);const actualSurface=__drill.meshCache();
     const select=__drill.selectModelProfile;
     __drill.selectModelProfile=function(s){const r=select.call(this,s);this._mc=window.__trainingCollarReport?.enabled?actualSurface:reference;return r;};
     __drill.touchResolve=function(...a){
      if(!window.__trainingCollarReport?.enabled)return resolve.apply(this,a);
      const actual=this._mc;this._mc=reference;
      try{return resolve.apply(this,a)}finally{this._mc=actual}
     };
     __drill.setupCamera({...s,modelProfile:'legacy-v7',trainingCollar:false},1080);
    },[spec,input.theme]);
    // Compare the exact same source in both profiles, with the same null solver seed.
    const times=[...new Set([0,...(spec.keyFrames||[]),spec.timeline.duration*.25,spec.timeline.duration*.5,spec.timeline.duration*.75])].filter(t=>t>=0&&t<spec.timeline.duration);
    const invariants=[];
    for(const t of times){
     const check=await p.evaluate(([s,t])=>{
      const v=flareInspector.viewer,capture=()=>{v.coach.updateMatrixWorld(true);const bones={};v.coach.traverse(o=>{if(o.isBone)bones[o.name]=o.matrixWorld.toArray()});return {bones,J:structuredClone(v.motion.getMetrics().joints)}};
      const old={...s,modelProfile:'legacy-v7',trainingCollar:false};__drill.applyAt(old,t,null);const before=capture();
      __drill.applyAt(s,t,null);const after=capture();let boneDelta=0,jointMm=0;
      for(const name of Object.keys(before.bones))for(let k=0;k<16;k++)boneDelta=Math.max(boneDelta,Math.abs(before.bones[name][k]-after.bones[name][k]));
      for(const name of Object.keys(before.J))for(let k=0;k<3;k++)jointMm=Math.max(jointMm,Math.abs(before.J[name][k]-after.J[name][k])*1000);
      return {t,boneDelta,jointMm,profile:__trainingCollarReport.profileId};
     },[spec,t]);
     assert(check.boneDelta<1e-8&&check.jointMm<1e-5,`Appearance changed motion: ${input.entry.id} ${JSON.stringify(check)}`);assert.equal(check.profile,spec.modelProfile);invariants.push(check);
    }
    write(folder+'/motion-invariance.json',{pass:true,contactReference:'original authoring surface only inside touch solving; QA uses visible new surface',comparedTo:'same frozen source with legacy profile; does not assert old downloaded movie pixel equality',records:invariants});
    const reference=await p.evaluate(s=>__drill.frame({...s,modelProfile:'legacy-v7',trainingCollar:false},s.stillAt??0,-1,null,{size:1080,full:true}),spec);
    fs.mkdirSync(folder+'/reference',{recursive:true});
    fs.writeFileSync(folder+'/reference/g-still.png',Buffer.from(reference.glow.split(',')[1],'base64'));
    write(folder+'/reference/metrics.json',reference.M);
    await child(PY,['-c',"import json,sys,numpy as np;from PIL import Image;s=json.load(open(sys.argv[2]));a=np.array(Image.open(sys.argv[1]))[...,3];y,x=np.nonzero(a>10);x0,x1,y0,y1=map(int,(x.min(),x.max(),y.min(),y.max()));p=s.get('frame',{'mode':'v7','width':750,'left':165,'top':300});k=s.get('size',1080)/1024;p={'mode':'fit','width':1024*(x1-x0)/a.shape[1],'cx':1024*(x0+x1)/2/a.shape[1],'cy':1024*(y0+y1)/2/a.shape[0]} if p['mode']=='canvas' else p;z=p['width']*k/(x1-x0) if p['mode']=='v7' else min(p['width']*k/(x1-x0),p.get('height',9999)*k/(y1-y0));ox=p['left']*k-x0*z if p['mode']=='v7' else p.get('cx',512)*k-(x0+x1)/2*z;oy=p['top']*k-y0*z if p['mode']=='v7' else p.get('cy',512)*k-(y0+y1)/2*z;json.dump({'s':z,'ox':ox,'oy':oy,'reference':'frozen original-profile silhouette','bbox':[x0,y0,x1,y1]},open(sys.argv[3],'w'))",folder+'/reference/g-still.png',folder+'/spec.json',folder+'/composite/place.json'],log);
    for(let k=0;k<2;k++)await p.evaluate(s=>{__drill.frame(s,0,0,null,{size:1080,full:false});return true},spec);
    const metrics=[],baseline=[],cycleChecks=[];let warm=null;
    for(let f=-1;f<N;f++){
     const t=f<0?(spec.stillAt??0):f/30;
     const r=await p.evaluate(([s,t,f,w])=>{
      const E=__drill,v=flareInspector.viewer,old={...s,modelProfile:'legacy-v7',trainingCollar:false};
      const bones=()=>{v.coach.updateMatrixWorld(true);const all={};v.coach.traverse(o=>{if(o.isBone)all[o.name]=o.matrixWorld.toArray()});return all;};
      const solved=E.applyAt(old,t,w),M=E.metrics(old,true),hc=E.handClip(['left','right'],{exclude:s.qa?.handClipExclude}),before=bones();
      M.handClip={left:hc.left.minMm,right:hc.right.minMm,leftBone:hc.left.bone||null,rightBone:hc.right.bone||null};
      M.touch=solved.touch||{};M.locked=solved.locked;M.x=solved.x;M.solverWarn=solved.warn;M.params=solved.params;M.J=M.joints;delete M.joints;
      const shot=E.frame(s,t,f,w,{size:1080,full:true}),after=bones();let boneDelta=0,jointMm=0;
      for(const n of Object.keys(before))for(let k=0;k<16;k++)boneDelta=Math.max(boneDelta,Math.abs(before[n][k]-after[n][k]));
      for(const n of Object.keys(M.J))for(let k=0;k<3;k++)jointMm=Math.max(jointMm,Math.abs(M.J[n][k]-shot.M.J[n][k])*1000);
      return {...shot,baseline:M,comparison:{f,t,boneDelta,jointMm}};
     },[spec,t,f,warm]);warm=r.M.x;
     assert(r.comparison.boneDelta<1e-8&&r.comparison.jointMm<1e-5,`Cycle motion changed: ${input.entry.id} ${JSON.stringify(r.comparison)}`);
     const name=f<0?'still':String(f).padStart(4,'0');
     for(const [prefix,data]of [['m',r.main],['g',r.glow]])fs.writeFileSync(folder+'/frames/'+prefix+'-'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
     metrics.push({f,t,...r.M});
     baseline.push({f,t,...r.baseline});cycleChecks.push(r.comparison);
     if(f>=0&&f%30===0)state('rendering',{completedFrames:f+1,totalFrames:N});
    }
    assert.deepEqual(errors,[],'Browser error');write(folder+'/frames/met-cycle.json',metrics);write(folder+'/reference/met-cycle.json',baseline);
    const invariance=read(folder+'/motion-invariance.json');invariance.fullCycle={frames:N,checkedIncludingStill:cycleChecks.length,boneDeltaMax:Math.max(...cycleChecks.map(c=>c.boneDelta)),jointMmMax:Math.max(...cycleChecks.map(c=>c.jointMm)),pass:true};write(folder+'/motion-invariance.json',invariance);
    write(folder+'/renderer.json',{info,errors,profile:await p.evaluate(()=>__trainingCollarReport),sampler:await p.evaluate(()=>({historical:window.__historicalDemoInfo??null,baked:window.__flareV41DemoInfo??null})),completeFrames:N});
   }finally{await b.close();}
   completeFiles(folder,N);
  }
  state('compositing');
  const ranges=['still',...Array.from({length:4},(_,k)=>`${Math.floor(N*k/4)}:${Math.floor(N*(k+1)/4)}`)];
  await Promise.all(ranges.map((range,k)=>child(PY,[path.join(TOOL,'lib/comp.py'),folder+'/frames',folder+'/spec.json',folder+'/theme.json',folder+'/composite',range],folder+`/composite-${k}.log`)));
  for(let f=0;f<N;f++)assert(fs.statSync(folder+'/composite/'+String(f).padStart(4,'0')+'.png').size>100);
  state('checking');
  await child(PY,[path.join(TOOL,'lib/qa.py'),folder+'/frames',folder+'/spec.json',folder+'/qa.json',folder+'/composite'],log);
  await child(PY,[path.join(TOOL,'lib/qa.py'),folder+'/reference',folder+'/spec.json',folder+'/baseline-qa.json'],folder+'/baseline-qa.log');
  const qa=read(folder+'/qa.json');assert.equal(qa.frames_complete,true);assert.equal(qa.frames,N);
  state('encoding');
  const pending=folder+'/pending';fs.mkdirSync(pending,{recursive:true});
  const encode=(name,scale,crf)=>child('ffmpeg',['-y','-v','error','-framerate','30','-i',folder+'/composite/%04d.png','-frames:v',String(N),...(scale?['-vf',`scale=${scale}:${scale}:flags=lanczos`]:[]),'-c:v','libx264','-threads','2','-preset','medium','-crf',String(crf),'-pix_fmt','yuv420p','-movflags','+faststart',pending+'/'+name+'.mp4'],log);
  await encode('master',null,18);await encode('mobile',720,20);
  const posterFrame=Math.min(N-1,Math.max(0,Math.round((input.entry.posterTimeSeconds??spec.stillAt??0)*30)));
  await child(PY,['-c',"from PIL import Image;import sys;Image.open(sys.argv[1]).convert('RGB').resize((540,540),Image.Resampling.LANCZOS).save(sys.argv[2],quality=92)",folder+'/composite/'+String(posterFrame).padStart(4,'0')+'.png',pending+'/poster.jpg'],log);
  const videos={master:probe(pending+'/master.mp4',N,1080,spec.timeline.duration),mobile:probe(pending+'/mobile.mp4',N,720,spec.timeline.duration)};
  for(const name of ['master','mobile'])await child('ffmpeg',['-v','error','-i',pending+'/'+name+'.mp4','-f','null','-'],log);
  const result={id:input.entry.id,name:spec.name??input.entry.name,category:input.entry.category,modelProfile:spec.modelProfile,modelVersion:plan.model.version,frames:N,fps:30,duration:spec.timeline.duration,posterTime:posterFrame/30,motionInvariance:read(folder+'/motion-invariance.json'),qa,media:videos,source:read(folder+'/source.json'),status:qa.pass?'ready':'review_required',knownLimitations:input.entry.knownLimitations||[],completedAt:stamp()};
  const oldQa=read(folder+'/baseline-qa.json');
  const bodyFlags=q=>({belowFloor:q.below_floor,capsule:!q.self_clip.ok,knee:!q.limits.knee_flex_backward,elbow:!q.limits.elbow_flex_forward,hip:!q.limits.hip_ok,waist:!q.limits.waist_ok,...Object.fromEntries(Object.entries(q.hand_clip).filter(([,v])=>v&&typeof v==='object').map(([k,v])=>['hand:'+k,v.ok===false])),...Object.fromEntries(Object.entries(q.pins).map(([k,v])=>['pin:'+k,v.ok===false])),...Object.fromEntries(Object.entries(q.straight).map(([k,v])=>['straight:'+k,!v.ok]))});
  const prior=bodyFlags(oldQa),current=bodyFlags(qa);
  result.baselineComparison={sameFrozenSource:true,oldQaPass:oldQa.pass,newQaPass:qa.pass,oldSolverWarningFrames:oldQa.solver_warning_frames,newSolverWarningFrames:qa.solver_warning_frames,newBodyFlags:Object.keys(current).filter(k=>current[k]&&!prior[k]),inheritedBodyFlags:Object.keys(current).filter(k=>current[k]&&prior[k]),frameEdgeCheckedOnNewRender:true};
  // Preserve complete material even with old numeric issues, but never label it ready.
  result.qaCoverage=qaCoverage(spec,read(folder+'/frames/met-cycle.json'));
  if(result.qaCoverage.inactiveChecks.length)result.status='review_required';
  const collection=result.status==='ready'?'media':'review-required';
  for(const name of ['master','mobile']){const dest=path.resolve(folder,'../..',collection,name,input.entry.id+'.mp4');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(pending+'/'+name+'.mp4',dest);result.media[name].path=path.relative(path.resolve(folder,'../..'),dest).replaceAll('\\','/');}
  const poster=path.resolve(folder,'../..',collection,'posters',input.entry.id+'.jpg');fs.mkdirSync(path.dirname(poster),{recursive:true});fs.copyFileSync(pending+'/poster.jpg',poster);result.poster=path.relative(path.resolve(folder,'../..'),poster).replaceAll('\\','/');
  result.posterSha256=hash(fs.readFileSync(poster));result.decodeVerified=true;result.productionRecipe=plan.recipe.id;
  write(folder+'/result.json',result);state(result.status,{frames:N,qaPass:qa.pass,solverWarningFrames:qa.solver_warning_frames});console.log(JSON.stringify({id:input.entry.id,status:result.status,frames:N}));
 }catch(error){state('failed',{error:error.message});throw error;}
}
async function main(){
 if(args.includes('--worker')){await worker(path.resolve(option('--worker')));return;}
 const out=path.resolve(option('--out')),catalog=read(path.resolve(option('--catalog'))),plan=await prepare(catalog,out);
 if(args.includes('--prepare')){console.log(JSON.stringify({planned:plan.jobs.length,frames:plan.jobs.reduce((n,j)=>n+j.frames,0)}));return;}
 const only=option('--only')?.split(','),queue=plan.jobs.filter(j=>!only||only.includes(j.id));
 if(only)assert(only.length&&only.every(id=>plan.jobs.some(j=>j.id===id)),'--only contains an unknown job id');
 const requestedWorkers=Number(option('--workers','2'));assert(Number.isInteger(requestedWorkers)&&requestedWorkers>0,'--workers must be a positive integer');
 const workers=Math.min(2,requestedWorkers),failures=[];
 let next=0;
 const summary=()=>{
  const states=plan.jobs.map(j=>fs.existsSync(j.folder+'/status.json')?read(j.folder+'/status.json'):{id:j.id,phase:'queued'});
  const totals={};for(const s of states)totals[s.phase]=(totals[s.phase]||0)+1;
  write(out+'/progress.json',{updatedAt:stamp(),planned:plan.jobs.length,totals,states});return totals;
 };
 async function lane(){
  while(next<queue.length){
   const job=queue[next++];
   if(resultIsIntact(job,out)){summary();continue;}
   try{await child(process.execPath,[fileURLToPath(import.meta.url),'--worker',job.folder,'--python',PY,'--app-url',option('--app-url','http://127.0.0.1:8871')],job.folder+'/worker.log');}
   catch(e){failures.push({id:job.id,error:e.message});}
   console.log(JSON.stringify({id:job.id,totals:summary()}));
  }
 }
 const timer=setInterval(()=>summary(),10000);
 try{await Promise.all(Array.from({length:workers},()=>lane()));}finally{clearInterval(timer);summary();}
 const results=plan.jobs.filter(j=>resultIsIntact(j,out)).map(j=>read(j.folder+'/result.json'));
 write(out+'/catalog.json',{model:plan.model,generatedAt:stamp(),planned:plan.jobs.length,results,failures});
 console.log(JSON.stringify({finished:results.length,planned:plan.jobs.length,failures,totals:summary()}));if(failures.length)process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
