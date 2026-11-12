// Joint production trial (shoulder-axilla r2 in the production master chain). One command, no decisions:
//   node tools/joint-opt-r1/produce-joint-r2.mjs --out <new-directory>
//   node tools/joint-opt-r1/produce-joint-r2.mjs --resume <same-directory>      (only after exit code 3)
// Everything (actions, frames, skins, sizes) is fixed in produce-joint-r2.plan.json. Per action, strictly serial,
// one Chromium at a time (each render is a child process; it is waited for before the next starts):
//   1 on      render-masters-joint.mjs --shoulder-axilla on   -> <out>/on/masters/<id>/   (full production masters)
//   2 compose tools/action-package-v3/compose.py              -> <out>/on/packages/<id>/  (mp4 / webm / keyframes / covers)
//   3 offref  render-masters-joint.mjs --shoulder-axilla off  -> <out>/off-ref/masters/<id>/ (sheet frames only, realistic)
//   4 sheet   keyframe-sheet.py                               -> <out>/sheets/<id>.jpg + .json (OFF | ON + zoom)
// Then <out>/_qa/ = the push set (see plan.qa). Writes only into <out> (plus the usual render lock in config work_dir
// and, if the script started it, the Vite dev server, stopped by PID at the end).
// Exit codes: 0 every action complete and _qa built; 1 preflight refused (nothing rendered: output exists, dirty
// checkout, missing python/ffmpeg/node_modules, dev server); 2 renders complete but building _qa failed;
// 3 incomplete (an action failed, low memory, or interrupted) -> run --resume once (done stages are skipped,
// half-written stage folders are moved to <out>/_quarantine/); --resume refuses if HEAD or a source changed.
// Hidden sandbox flags (never needed locally; they mark the run testMode): --only <a,b>, --size <px>, --frames-on <list>.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const PLAN_FILE=path.join(HERE,'produce-joint-r2.plan.json');
const USAGE='Usage: node tools/joint-opt-r1/produce-joint-r2.mjs --out <new-directory> | --resume <directory>';
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const SOURCES=['tools/joint-opt-r1/produce-joint-r2.mjs','tools/joint-opt-r1/produce-joint-r2.plan.json','tools/joint-opt-r1/render-masters-joint.mjs',
  'tools/joint-opt-r1/joint-production.mjs','tools/joint-opt-r1/shoulder-axilla-production.json','tools/joint-opt-r1/shoulder-axilla-r2.mjs',
  'tools/joint-opt-r1/keyframe-sheet.py','tools/skin-coverage-r1/render-masters.mjs','tools/action-package-v3/compose.py','tools/action-package-v3/profiles/default.json'];
const shaLf=f=>createHash('sha256').update(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex');
const fail=(ok,m)=>{if(!ok)throw Object.assign(Error(m),{preflight:true});};
const now=()=>new Date().toISOString();
const freeGiB=()=>os.freemem()/1024**3;

function parse(argv){
  const o={};
  for(let i=0;i<argv.length;i+=2){const k=argv[i],v=argv[i+1];
    fail(['--out','--resume','--only','--size','--frames-on'].includes(k)&&v&&!v.startsWith('--')&&!(k in o),USAGE);o[k]=v;}
  fail(!!o['--out']!==!!o['--resume'],USAGE);
  if(o['--size'])fail(/^\d+$/.test(o['--size'])&&+o['--size']>=128&&+o['--size']<=2160,'--size must be 128..2160');
  if(o['--frames-on'])fail(/^\d+(,\d+)*$/.test(o['--frames-on']),'--frames-on must be a comma list of frames');
  return o;
}
function gitHead(){
  const g=a=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8'}).trim();
  return {head:g(['rev-parse','HEAD']),branch:g(['rev-parse','--abbrev-ref','HEAD']),
    trackedChanges:g(['status','--porcelain','--untracked-files=no']).split('\n').filter(Boolean).length};
}
async function reachable(url){try{const r=await fetch(url+'/src/viewer.js');return r.ok;}catch{return false;}}
async function ensureServer(appUrl,out){
  if(await reachable(appUrl))return {started:false,url:appUrl};
  const u=new URL(appUrl);
  fail(['127.0.0.1','localhost'].includes(u.hostname),'Dev server '+appUrl+' unreachable and not local; start it first');
  const vite=path.join(ROOT,'node_modules/vite/bin/vite.js');
  fail(fs.existsSync(vite),'Dev server not running and node_modules/vite missing: run `npm install` in the repo root');
  const log=fs.openSync(path.join(out,'vite.log'),'a');
  const child=spawn(process.execPath,[vite,'--host',u.hostname,'--port',u.port||'80','--strictPort'],{cwd:ROOT,stdio:['ignore',log,log],windowsHide:true});
  let exited=null;child.on('exit',c=>{exited=c;});const t0=Date.now();
  while(!(await reachable(appUrl))){
    if(exited!==null)fail(false,'Vite exited with code '+exited+' (see vite.log; is port '+u.port+' in use?)');
    if(Date.now()-t0>180000){try{process.kill(child.pid);}catch{}fail(false,'Vite did not become ready in 180 s');}
    await new Promise(r=>setTimeout(r,500));
  }
  return {started:true,url:appUrl,pid:child.pid};
}
const pidAlive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};

let current=null; // running child (killed by PID on SIGINT)
function run(cmd,args,logFile){
  return new Promise(resolve=>{
    const fd=fs.openSync(logFile,'a');fs.writeSync(fd,`\n# ${now()} ${cmd} ${args.join(' ')}\n`);
    const child=spawn(cmd,args,{cwd:ROOT,stdio:['ignore',fd,fd],windowsHide:true,env:{...process.env,NO_PROXY:['127.0.0.1','localhost',process.env.NO_PROXY].filter(Boolean).join(',')}});
    current=child;
    child.on('error',e=>{current=null;fs.closeSync(fd);resolve({code:-1,error:String(e)});});
    child.on('exit',(code,signal)=>{current=null;fs.closeSync(fd);resolve({code:code??-1,signal});});
  });
}
const tail=f=>{try{return fs.readFileSync(f,'utf8').split('\n').filter(Boolean).slice(-6).join('\n').slice(-1500);}catch{return '';}};

async function main(){
  const args=parse(process.argv.slice(2));
  const resume=!!args['--resume'],out=path.resolve(args['--resume']??args['--out']);
  process.chdir(ROOT);
  const plan=JSON.parse(fs.readFileSync(PLAN_FILE,'utf8'));
  fail(plan.format==='pose-hub-joint-production-trial-plan@1','Bad plan format');
  const only=args['--only']?args['--only'].split(','):null;
  if(only)fail(only.every(a=>plan.actions.some(x=>x.id===a)),'--only names an action not in the plan');
  const testMode=!!(only||args['--size']||args['--frames-on']);
  const framesOn=args['--frames-on']?args['--frames-on'].split(',').map(Number):null;
  const actions=plan.actions.filter(a=>!only||only.includes(a.id)).map(a=>({...a,sheetFrames:framesOn?a.frames.filter(f=>framesOn.includes(f)):a.frames}));
  if(framesOn)fail(actions.every(a=>a.sheetFrames.length),'--frames-on must include at least one plan frame of every selected action');
  const git=gitHead();
  fail(git.trackedChanges===0,'Checkout has tracked changes ('+git.trackedChanges+'); use a clean checkout of the given commit');
  const sources=Object.fromEntries(SOURCES.map(s=>[s,shaLf(path.join(ROOT,s))]));
  for(const a of actions)fail(fs.existsSync(path.join(ROOT,plan.recipesDir,a.id+'.json')),'Missing recipe '+a.id);
  const stateFile=path.join(out,'run-state.json');
  let state;
  if(resume){
    fail(fs.existsSync(stateFile),'--resume: no run-state.json in '+out);
    state=JSON.parse(fs.readFileSync(stateFile,'utf8'));
    fail(state.git.head===git.head,'--resume: HEAD changed ('+state.git.head.slice(0,7)+' -> '+git.head.slice(0,7)+'); start a new --out');
    fail(JSON.stringify(state.sources)===JSON.stringify(sources),'--resume: a source file changed; start a new --out');
    fail(JSON.stringify(state.options)===JSON.stringify({only,size:args['--size']??null,framesOn}),'--resume: different test options');
    const lk=path.join(out,'.driver.lock');
    if(fs.existsSync(lk)){const pid=+fs.readFileSync(lk,'utf8');fail(!pidAlive(pid),'Another run is active in '+out+' (pid '+pid+')');fs.unlinkSync(lk);}
    state.resumes=(state.resumes??0)+1;
  }else{
    fail(!fs.existsSync(out),'Output exists: '+out+' (use a new directory; nothing is overwritten)');
  }
  // tools
  const py=spawnSync(PY,['-c','import numpy,PIL;print("ok")'],{encoding:'utf8'});
  fail(py.status===0,'Python with numpy/Pillow not found as "'+PY+'" (set PYTHON=<python.exe> or fix PATH)');
  const ff=spawnSync('ffmpeg',['-version'],{encoding:'utf8'});
  fail(ff.status===0,'ffmpeg not on PATH');
  const {config}=await import(pathToFileURL(path.join(ROOT,'drill-anim/lib/config.mjs')).href);
  const cfg=config();
  if(!resume){
    fs.mkdirSync(out,{recursive:true});
    state={format:'pose-hub-joint-production-trial-state@1',plan:plan.id,started:now(),git,sources,options:{only,size:args['--size']??null,framesOn},testMode,
      python:PY,actions:Object.fromEntries(actions.map(a=>[a.id,{group:a.group,stages:{}}])),resumes:0};
  }
  for(const d of ['logs','sheets','_quarantine'])fs.mkdirSync(path.join(out,d),{recursive:true});
  fs.writeFileSync(path.join(out,'.driver.lock'),String(process.pid),{flag:'wx'});
  const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,1)+'\n');save();
  const prog=m=>{const l=`${now()} ${m}`;fs.appendFileSync(path.join(out,'progress.log'),l+'\n');console.log(l);};
  let server=null,interrupted=false;
  const cleanup=()=>{if(server?.started&&server.pid){try{process.kill(server.pid);}catch{}server.started=false;}try{fs.unlinkSync(path.join(out,'.driver.lock'));}catch{}};
  process.on('SIGINT',()=>{interrupted=true;if(current?.pid){try{process.kill(current.pid);}catch{}}});
  prog(`${resume?'resume #'+state.resumes:'start'} HEAD ${git.head.slice(0,7)} actions ${actions.length}${testMode?' (testMode)':''}`);
  try{
    server=await ensureServer(cfg.app_url,out); // failure -> exit 1 (preflight)
    state.devServer={url:server.url,startedByScript:server.started,pid:server.pid??null};save();
    const R=id=>path.join(plan.recipesDir,id+'.json');
    const entry=path.join(ROOT,plan.entry);
    for(const a of actions){
      if(interrupted)break;
      const S=state.actions[a.id];
      const stages=[
        {name:'on',done:path.join(out,'on/masters',a.id,'layer-manifest.json'),partial:path.join(out,'on/masters',a.id),
          cmd:process.execPath,args:[entry,'--recipe',R(a.id),'--root',path.join(out,'on'),'--shoulder-axilla','on','--profile',plan.on.profile,
            ...(args['--size']?['--size',args['--size']]:[]),...(framesOn?['--frames',framesOn.join(',')]:[])]},
        {name:'compose',done:path.join(out,'on/packages',a.id,'package.json'),partial:path.join(out,'on/packages',a.id),
          cmd:PY,args:[path.join(ROOT,'tools/action-package-v3/compose.py'),'--root',path.join(out,'on'),'--id',a.id,'--profile',plan.on.profile,
            ...(testMode?['--allow-partial','--sizes-from-masters']:[])]},
        {name:'offref',done:path.join(out,'off-ref/masters',a.id,'layer-manifest.json'),partial:path.join(out,'off-ref/masters',a.id),
          cmd:process.execPath,args:[entry,'--recipe',R(a.id),'--root',path.join(out,'off-ref'),'--shoulder-axilla','off','--profile',plan.offReference.profile,
            '--skins',plan.offReference.skins,'--layers',plan.offReference.layers,'--frames',a.sheetFrames.join(','),...(args['--size']?['--size',args['--size']]:[])]},
        {name:'sheet',done:path.join(out,'sheets',a.id+'.json'),partial:path.join(out,'sheets',a.id+'.jpg'),
          cmd:PY,args:[path.join(HERE,'keyframe-sheet.py'),'--on',path.join(out,'on/masters',a.id),'--off',path.join(out,'off-ref/masters',a.id),
            '--frames',a.sheetFrames.join(','),'--skin',plan.sheet.skin,'--layer',plan.sheet.layer,'--background',plan.sheet.background,
            '--cell',String(plan.sheet.cell),'--threshold',String(plan.sheet.threshold),'--label',`${a.id} (${a.group})`,
            '--out',path.join(out,'sheets',a.id+'.jpg'),'--json',path.join(out,'sheets',a.id+'.json')]}];
      let ok=true;
      for(const st of stages){
        if(interrupted){ok=false;break;}
        if(fs.existsSync(st.done)){S.stages[st.name]??={status:'done'};continue;}
        if(fs.existsSync(st.partial)){const q=path.join(out,'_quarantine',`${st.name}-${a.id}-${Date.now()}`);fs.renameSync(st.partial,q);prog(`quarantined half-written ${st.name} of ${a.id} -> ${path.relative(out,q)}`);}
        if(freeGiB()<1.25){prog(`STOP low free memory ${freeGiB().toFixed(2)} GiB before ${a.id}/${st.name}`);interrupted=true;ok=false;break;}
        const log=path.join(out,'logs',`${a.id}-${st.name}.log`),t0=Date.now();
        prog(`${a.id} ${st.name} ...`);
        const r=await run(st.cmd,st.args,log);
        const sec=+((Date.now()-t0)/1000).toFixed(1);
        if(r.code===0&&fs.existsSync(st.done)){S.stages[st.name]={status:'done',seconds:sec,finished:now()};prog(`${a.id} ${st.name} ok ${sec}s`);save();continue;}
        S.stages[st.name]={status:'failed',seconds:sec,exitCode:r.code,signal:r.signal??null,error:r.error??tail(log),log:path.relative(out,log)};
        prog(`${a.id} ${st.name} FAILED (exit ${r.code}${r.signal?' '+r.signal:''}) see ${path.relative(out,log)}`);save();ok=false;break;
      }
      S.complete=ok&&stages.every(st=>fs.existsSync(st.done));save();
    }
  }finally{cleanup();}
  // ---- run-log + push set ----
  const complete=!interrupted&&actions.every(a=>state.actions[a.id].complete);
  state.finished=now();state.complete=complete;save();
  let qaOk=true;
  try{buildQa(out,plan,actions,state);}catch(e){qaOk=false;prog('QA set failed: '+(e.stack??e));}
  const done=actions.filter(a=>state.actions[a.id].complete).length;
  const failed=actions.filter(a=>Object.values(state.actions[a.id].stages).some(s=>s.status==='failed')).map(a=>a.id);
  const code=!complete?3:qaOk?0:2;
  prog(`end exit ${code}: complete ${done}/${actions.length}${failed.length?' failed '+failed.join(','):''}${interrupted?' (interrupted)':''}`);
  console.log(JSON.stringify({ok:code===0,complete,actions:actions.length,done,failed,interrupted,exitCode:code,testMode,out,head:git.head,qa:qaOk?path.join(out,'_qa'):null}));
  process.exitCode=code;
}

function buildQa(out,plan,actions,state){
  const qa=path.join(out,'_qa');
  if(fs.existsSync(qa))fs.rmSync(qa,{recursive:true}); // derived folder, rebuilt from the immutable outputs
  for(const d of ['sheets','manifests','videos'])fs.mkdirSync(path.join(qa,d),{recursive:true});
  const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
  let videoTotal=0;const rows=[];
  for(const a of actions){
    const S=state.actions[a.id],row={id:a.id,group:a.group,complete:!!S.complete,stages:S.stages,sheetFrames:a.sheetFrames};
    const sj=path.join(out,'sheets',a.id+'.json');
    if(fs.existsSync(sj)){const s=read(sj);row.sheet={file:'sheets/'+a.id+'.jpg',frames:s.frames.map(f=>({frame:f.frame,changedPixels:f.changedPixels,maxDiff:f.maxDiff,bytesIdentical:f.bytesIdentical}))};
      fs.copyFileSync(path.join(out,'sheets',a.id+'.jpg'),path.join(qa,'sheets',a.id+'.jpg'));fs.copyFileSync(sj,path.join(qa,'sheets',a.id+'.json'));}
    const lm=path.join(out,'on/masters',a.id,'layer-manifest.json');
    if(fs.existsSync(lm)){const m=read(lm);
      const diag=m.frames.map(f=>f.jointOpt?.shoulderAxilla).filter(Boolean);
      const gate=s=>Math.max(0,...diag.map(d=>d.sides?.[s]?.gate??0));
      row.masters={size:m.size,frames:m.frames.length,complete:m.complete,skins:m.skins.map(s=>s.id),layers:m.layers,renderSeconds:m.renderSeconds,pageErrors:m.pageErrors.length,
        flags:m.flags,shoulderAxilla:{enabled:m.jointOpt?.shoulderAxilla?.enabled,version:m.jointOpt?.shoulderAxilla?.setup?.version??null,
          framesWritten:diag.filter(d=>d.written>0).length,maxGate:{left:gate('left'),right:gate('right')},
          maxMoveMm:Math.max(0,...diag.map(d=>d.maxMoveMm??0)),maxNormalChangeDeg:Math.max(0,...diag.map(d=>d.maxNormalChangeDeg??0))}};
      fs.writeFileSync(path.join(qa,'manifests',a.id+'.masters-summary.json'),JSON.stringify({actionId:a.id,recipe:m.recipe,productionModel:m.productionModel,
        profile:m.profile,rendererSha256:m.rendererSha256,appearance:{approvedBase:m.appearance?.approvedBase,approvedPointer:m.appearance?.approvedPointer},
        jointOpt:m.jointOpt,size:m.size,fps:m.fps,loopFrames:m.loopFrames,complete:m.complete,skins:m.skins,layers:m.layers,flags:m.flags,pageErrors:m.pageErrors,
        renderSeconds:m.renderSeconds,frames:m.frames.map(f=>({frame:f.frame,warn:f.warn,jointOpt:f.jointOpt}))},null,1)+'\n');}
    const pk=path.join(out,'on/packages',a.id,'package.json');
    if(fs.existsSync(pk)){fs.copyFileSync(pk,path.join(qa,'manifests',a.id+'.package.json'));
      const v=path.join(out,'on/packages',a.id,plan.qa.video);
      if(fs.existsSync(v)){const b=fs.statSync(v).size;row.video={local:path.relative(out,v).replaceAll('\\','/'),bytes:b,pushed:false};
        if(b<=plan.qa.maxVideoBytes&&videoTotal+b<=plan.qa.maxTotalVideoBytes){fs.copyFileSync(v,path.join(qa,'videos',a.id+'.realistic-dark.mp4'));videoTotal+=b;row.video.pushed=true;}}}
    rows.push(row);
  }
  const log={format:'pose-hub-joint-production-trial-log@1',plan:plan.id,started:state.started,finished:state.finished,complete:state.complete,testMode:state.testMode,
    git:state.git,sources:state.sources,resumes:state.resumes,devServer:state.devServer,out,actions:rows,
    totals:{actions:rows.length,complete:rows.filter(r=>r.complete).length,videosPushedBytes:videoTotal},
    notes:'Videos/masters not in _qa stay at <out>/on/ on this machine. Flags userAccepted/releaseEligible stay false; nothing uploaded, no pointer changed.'};
  fs.writeFileSync(path.join(out,'run-log.json'),JSON.stringify(log,null,1)+'\n');
  for(const f of ['run-log.json','run-state.json','progress.log'])if(fs.existsSync(path.join(out,f)))fs.copyFileSync(path.join(out,f),path.join(qa,f));
  fs.copyFileSync(PLAN_FILE,path.join(qa,'plan.json'));
}

main().catch(e=>{console.error(e?.stack??e);console.log(JSON.stringify({ok:false,error:String(e?.message??e),exitCode:e?.preflight?1:3}));process.exitCode=e?.preflight?1:3;});
