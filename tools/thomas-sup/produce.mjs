#!/usr/bin/env node
// Thomas supplement r1 (2026-11-19): V5 720p SAMPLE render of the 12 new Thomas-library actions (branch codex/thomas-supplement-r1).
// Copied from tools/v5/produce-v5.mjs (same masters -> compose flow, resume, quarantine, timeouts); differences:
//   - plan = tools/thomas-sup/actions.json (12 recipes under catalog/production/thomas-supplement-r1/recipes/), one run, no batches;
//   - preflight baseline = main 94ff057 (V5 r2-v18 merge), with ONLY this branch's new/changed files excluded (EXCLUDE below);
//   - outputs: <out>/masters/<id>/ + <out>/packages/<id>/ (V5 package files, as V5) + <out>/samples/<id>.720.mp4 (copy of the
//     light loop.720.mp4) + <out>/_qa/overview.jpg (light start/peak/end + dark cover, one row per action);
//   - QA push: <out>/_qa (overview jpg + json + state + log; no video/png masters) to the orphan branch qa/thomas-supplement-r1.
//   node tools/thomas-sup/produce.mjs [--out <run-dir>] [--only id,id] [--no-push] [--vite-force]
//   default --out F:/PoseHub-v3/runs/2026-11-19_thomas-supplement-r1
// Samples only: nothing here uploads media, publishes a pack, moves a pointer, merges or tags.
// Exit: 0 all done; 1 preflight refused (nothing rendered); 3 some action failed (others done); 4 QA push failed (renders fine).
// The last stdout line is one JSON whose "report" field is the text to post.
import fs from 'node:fs';import path from 'node:path';
import {spawn,spawnSync,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {config} from '../../drill-anim/lib/config.mjs';
const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const PLAN0=JSON.parse(fs.readFileSync(path.join(HERE,'actions.json'),'utf8'));
const PLAN={actions:PLAN0.actions.map(a=>({id:a.id,recipe:`catalog/production/thomas-supplement-r1/recipes/${a.id}.json`}))};
const BASE='94ff057a5444d822094dea204cf7629f9ff2a30e',QA_BRANCH='qa/thomas-supplement-r1';
const TOTAL=PLAN.actions.length;
const DEFAULT_OUT='F:/PoseHub-v3/runs/2026-11-19_thomas-supplement-r1';
// files this branch adds/changes on top of BASE; every other path must equal BASE (render content = main 94ff057)
const EXCLUDE=['tools/thomas-sup','catalog/production/thomas-supplement-r1','drill-anim/data/home-pr-candidates.json','drill-anim/verify.mjs',
  'drill-anim/specs/_thomas-sup-wrist-r1.mjs','drill-anim/specs/_thomas-sup-wrist-r2.mjs',...PLAN0.actions.map(a=>a.spec),
  // r2 (2026-11-19): opt-in V5 scapula translation (spec v5.scapulaShift; set by t-pushup-plus / t-frog-stand / t-planche-lean and, batch 2, t-kneeling-scap-pushup / t-seated-shoulder-ext-slide / t-hanging-leg-raise / t-straddle-planche / t-pbar-support-swing); v5.headFlexDeg (opt-in head flexion, batch 2: t-seated-shoulder-ext-slide), same files; v5.groundShadow=false (opt-in no ground shadow for close-ups, batch 3: t-self-resisted-wrist-flexion / t-self-resisted-wrist-extension), same files.
  // Off for every other action: old-action masters + v5-pose.json byte-identical to main (serratus-A, h-open-book; evidence in tools/thomas-sup/standards/README.md, re-checked for batch 3).
  'tools/v5/runtime/v5-hub.js','tools/v5/render-masters-v5.mjs'];
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const now=()=>new Date().toISOString();const stamp=()=>now().replace(/[:.]/g,'-');
const out1=o=>console.log(JSON.stringify(o));
const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:undefined;};
const pre=m=>{try{if(typeof LOCK!=="undefined"&&fs.existsSync(LOCK)&&fs.readFileSync(LOCK,"utf8")===String(process.pid))fs.rmSync(LOCK);}catch{}out1({ok:false,preflight:true,error:m,report:`托马斯补充 V5 样片预检未通过，未开始渲染：${m}`});process.exit(1);};
if(args.some((x,i)=>x.startsWith('--')&&!['--out','--only','--no-push','--vite-force'].includes(x)))pre('用法: node tools/thomas-sup/produce.mjs [--out <run-dir>] [--only id,id] [--no-push] [--vite-force]');
const viteForce=args.includes('--vite-force');   // README: after a Vite 504 Outdated Optimize Dep, delete node_modules/.vite and rerun once with this
const out=path.resolve(opt('--out')??DEFAULT_OUT),noPush=args.includes('--no-push'),only=opt('--only');
const PROFILE=path.join(HERE,'profile-v5.json');
const g=(x,o={})=>execFileSync('git',x,{cwd:ROOT,encoding:'utf8',...o}).trim();
// ---- preflight
const head=g(['rev-parse','HEAD']);
if(g(['status','--porcelain','--untracked-files=no']))pre('仓库有未提交的改动');
if(spawnSync('git',['cat-file','-e',BASE+'^{commit}'],{cwd:ROOT}).status!==0)pre('本地没有基准提交 94ff057（先 git fetch origin）');
if(spawnSync('git',['diff','--quiet',BASE,'HEAD','--','.',...EXCLUDE.map(p=>':(exclude)'+p)],{cwd:ROOT}).status!==0)pre('当前提交除托马斯补充新文件外与基准 main 94ff057 不一致');
for(const a of PLAN.actions)if(!fs.existsSync(path.join(ROOT,a.recipe)))pre('缺少配方 '+a.recipe);
for(const f of ['tools/v5/profile-v5.json','tools/action-package-v3/skins/v5-toon.json','tools/v5/runtime/model/coach-v3r3-wristfix.glb','tools/v5/runtime/v5-hub.js'])if(!fs.existsSync(path.join(ROOT,f)))pre('缺少 V5 文件 '+f);
if(spawnSync(PY,['-c','import numpy,PIL;print("ok")'],{encoding:'utf8'}).stdout?.trim()!=='ok')pre('找不到带 numpy+Pillow 的 python（设 $env:PYTHON）');
if(spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status!==0)pre('PATH 上没有 ffmpeg');
fs.mkdirSync(out,{recursive:true});
const LOCK=path.join(out,'_run','LOCK');fs.mkdirSync(path.dirname(LOCK),{recursive:true});
if(fs.existsSync(LOCK)){const pid=+fs.readFileSync(LOCK,'utf8');let alive=false;try{process.kill(pid,0);alive=true;}catch{}if(alive)pre('另一个托马斯补充渲染正在运行 (PID '+pid+')');}
fs.writeFileSync(LOCK,String(process.pid));
const STATE=path.join(out,'_run','state.json');
const state=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{format:'pose-hub-thomas-sup-run@1',base:BASE,started:now(),actions:{},batches:{}};
const saveState=()=>fs.writeFileSync(STATE,JSON.stringify(state,null,1));
const isDone=id=>fs.existsSync(path.join(out,'packages',id,'package.json'));
let list;
if(only){list=only.split(',').map(i=>PLAN.actions.find(a=>a.id===i)??pre('未知动作 '+i));}
else list=PLAN.actions;
const freeGB=()=>{try{const s=fs.statfsSync(out);return +(s.bavail*s.bsize/1e9).toFixed(1);}catch{return null;}};
const doneSizes=Object.values(state.actions).filter(x=>x.status==='done'&&x.bytes).map(x=>x.bytes);
const avgGB=doneSizes.length?doneSizes.reduce((s,x)=>s+x,0)/doneSizes.length/1e9:null;
const need=Math.max(15,avgGB?avgGB*list.length*1.5:0);
const f0=freeGB();if(f0!==null&&f0<need)pre(`磁盘剩余 ${f0} GB，本批至少需要 ${need.toFixed(0)} GB`);
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'drill-anim/config.json'),'utf8'));
const LOG=path.join(out,'_run','progress.log');const log=m=>fs.appendFileSync(LOG,`${now()} ${m}\n`);
// ---- dev server (started/stopped by PID)
async function reachable(u){try{return (await fetch(u+'/src/viewer.js')).ok;}catch{return false;}}
let server=null;
async function ensureServer(appUrl){
  if(await reachable(appUrl))return;
  const u=new URL(appUrl);if(!['127.0.0.1','localhost'].includes(u.hostname))pre('开发服务器 '+appUrl+' 不可达且不是本机');
  const vite=path.join(ROOT,'node_modules/vite/bin/vite.js');if(!fs.existsSync(vite))pre('缺 node_modules/vite：先 npm install');
  const lf=fs.openSync(path.join(out,'_run','vite.log'),'a');
  server=spawn(process.execPath,[vite,'--host',u.hostname,'--port',u.port||'80','--strictPort',...(viteForce?['--force']:[])],{cwd:ROOT,stdio:['ignore',lf,lf],windowsHide:true});
  const t0=Date.now();while(!(await reachable(appUrl))){if(server.exitCode!==null)pre('Vite 退出（端口被占？）');if(Date.now()-t0>180000)pre('Vite 180 秒内未就绪');await new Promise(r=>setTimeout(r,500));}
}
function stopServer(){if(server&&server.exitCode===null){try{if(process.platform==='win32')spawnSync('taskkill',['/T','/F','/PID',String(server.pid)]);else process.kill(server.pid);}catch{}}}
// 2026-11-17 batches 15/16: a masters run hung after a few frames (no output for 90 min); taskkill /F skips its finally, so its
// package-v3-render.lock stayed and every later action of the batch failed at once ("Active render lock"). Now: the longest good
// action took 700 s, so the hard limit is 25 min; a run whose log stops growing for STALL_MIN is killed too; after any kill the
// lock is removed if (and only if) it names the killed PID; a masters run that was killed is tried once more.
const TIMEOUT_MIN=+(process.env.V5_ACTION_TIMEOUT_MIN||25),STALL_MIN=+(process.env.V5_STALL_MIN||6);
const RENDER_LOCK=path.join(config().work_dir,'package-v3-render.lock');
function clearStaleLock(pid){try{if(fs.existsSync(RENDER_LOCK)&&JSON.parse(fs.readFileSync(RENDER_LOCK,'utf8')).pid===pid){fs.unlinkSync(RENDER_LOCK);log(`removed stale render lock of PID ${pid}`);}}catch(e){log('stale lock check failed: '+e);}}
function killTree(pid){try{if(process.platform==='win32')spawnSync('taskkill',['/T','/F','/PID',String(pid)]);else process.kill(pid,'SIGKILL');}catch{}}
function run(cmd,a,lf){return new Promise(res=>{const fd=fs.openSync(lf,'a');fs.writeSync(fd,`\n# ${now()} ${cmd} ${a.join(' ')}\n`);
  const c=spawn(cmd,a,{cwd:ROOT,stdio:['ignore',fd,fd],windowsHide:true,env:{...process.env,NO_PROXY:['127.0.0.1','localhost',process.env.NO_PROXY].filter(Boolean).join(',')}});
  let killed=false;const kill=why=>{if(killed)return;killed=true;log(`${why}, killing PID ${c.pid}`);killTree(c.pid);};
  const timer=setTimeout(()=>kill(`timeout ${TIMEOUT_MIN} min`),TIMEOUT_MIN*60000);
  let size=-1,since=Date.now();const watch=setInterval(()=>{let n=-1;try{n=fs.statSync(lf).size;}catch{}
    if(n!==size){size=n;since=Date.now();}else if(Date.now()-since>STALL_MIN*60000)kill(`no output for ${STALL_MIN} min`);},15000);
  const end=code=>{clearTimeout(timer);clearInterval(watch);try{fs.closeSync(fd);}catch{}if(killed)clearStaleLock(c.pid);res({code:code??-1,killed});};
  c.on('error',()=>end(-1));c.on('exit',code=>end(code));});}
function quarantine(id,why){const q=path.join(out,'_quarantine',`${id}_${stamp()}`);let moved=false;
  for(const sub of ['masters','packages']){const s=path.join(out,sub,id);if(fs.existsSync(s)){fs.mkdirSync(q,{recursive:true});fs.renameSync(s,path.join(q,sub));moved=true;}}
  if(moved){fs.writeFileSync(path.join(q,'WHY.txt'),why+'\n');log(`${id} quarantined -> ${q}`);}}
function dirBytes(d){let n=0;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);n+=e.isDirectory()?dirBytes(p):fs.statSync(p).size;}return n;}
// ---- batch
const label=only?'only':'all';
const t0=Date.now();const res={ok:false,head,base:BASE,out,batch:label,ids:list.map(a=>a.id),done:[],skipped:[],failed:[],started:now()};
try{
  await ensureServer(cfg.app_url);
  for(const a of list){
    const id=a.id;if(isDone(id)){res.skipped.push(id);continue;}
    const lf=path.join(out,'_run','logs',id+'.log');fs.mkdirSync(path.dirname(lf),{recursive:true});
    const ts=Date.now();const mDone=fs.existsSync(path.join(out,'masters',id,'layer-manifest.json'));
    if(!mDone)quarantine(id,'incomplete masters before re-render');
    else if(fs.existsSync(path.join(out,'packages',id))){const q=path.join(out,'_quarantine',`${id}_${stamp()}`);fs.mkdirSync(q,{recursive:true});fs.renameSync(path.join(out,'packages',id),path.join(q,'packages'));log(`${id} partial package quarantined`);}
    let ok=true;
    if(!mDone){log(id+' masters');
      const margs=[path.join(ROOT,'tools/v5/render-masters-v5.mjs'),'--recipe',a.recipe,'--root',out,'--profile',PROFILE];
      let r=await run(process.execPath,margs,lf);
      if(r.killed){log(id+' masters killed, one more try');quarantine(id,'killed masters run before retry');r=await run(process.execPath,margs,lf);}
      const c=r.code;
      if(c!==0||!fs.existsSync(path.join(out,'masters',id,'layer-manifest.json'))){log(`${id} masters FAILED ${c}`);res.failed.push(id+':masters');ok=false;}}
    if(ok){log(id+' compose');
      const c=(await run(PY,[path.join(ROOT,'tools/action-package-v3/compose.py'),'--root',out,'--id',id,'--profile',PROFILE],lf)).code;
      if(c!==0||!isDone(id)){log(`${id} compose FAILED ${c}`);res.failed.push(id+':compose');ok=false;}}
    const bytes=ok?dirBytes(path.join(out,'masters',id))+dirBytes(path.join(out,'packages',id)):null;
    state.actions[id]={status:ok?'done':'failed',seconds:Math.round((Date.now()-ts)/1000),bytes,at:now(),batch:label};saveState();
    if(ok){const mp4=path.join(out,'packages',id,'v5-toon','light','loop.720.mp4');
      if(fs.existsSync(mp4)){fs.mkdirSync(path.join(out,'samples'),{recursive:true});fs.copyFileSync(mp4,path.join(out,'samples',id+'.720.mp4'));}
      else log(id+' WARNING no light/loop.720.mp4 in package');
      res.done.push(id);log(id+' done');}
  }
}finally{stopServer();}
// ---- QA sheet + push
const qa=path.join(out,'_qa');fs.mkdirSync(qa,{recursive:true});
const sheetIds=PLAN.actions.filter(a=>isDone(a.id)).map(a=>a.id);
const sheet=sheetIds.length?spawnSync(PY,[path.join(ROOT,'tools/v5/batch-sheet.py'),'--root',out,'--out',path.join(qa,'overview.jpg'),'--ids',sheetIds.join(',')],{encoding:'utf8'}):{status:1,stderr:'no finished action'};
if(sheet.status!==0)log('sheet FAILED '+sheet.stderr);
const allDone=PLAN.actions.filter(a=>isDone(a.id)).length;
const mins=Math.round((Date.now()-t0)/60000);
const secs=Object.values(state.actions).filter(x=>x.status==='done').map(x=>x.seconds);
state.batches[label]={...res,finished:now(),minutes:mins,freeGB:freeGB()};saveState();
fs.writeFileSync(path.join(qa,`run-${label}.json`),JSON.stringify(state.batches[label],null,1));
fs.copyFileSync(STATE,path.join(qa,'state.json'));fs.copyFileSync(LOG,path.join(qa,'progress.log'));
let pushed=null,pushErr=null;
if(!noPush){try{
  const env={...process.env,GIT_INDEX_FILE:path.join(out,'_run','qa.index')};
  const G=path.resolve(ROOT,g(['rev-parse','--git-common-dir']));
  const gq=x=>execFileSync('git',['--git-dir',G,'--work-tree',qa,...x],{cwd:ROOT,encoding:'utf8',env}).trim();
  gq(['add','-A','.']);const tree=gq(['write-tree']);
  const remote=g(['ls-remote','origin','refs/heads/'+QA_BRANCH]).split(/\s+/)[0];
  if(remote)g(['fetch','-q','origin',`+refs/heads/${QA_BRANCH}:refs/remotes/origin/${QA_BRANCH}`]);
  const c=gq(['commit-tree',tree,...(remote?['-p',remote]:[]),'-m',`qa: thomas-supplement-r1 V5 samples (${res.done.length} done, ${res.failed.length} failed; overview only)`]);
  g(['push','origin',`${c}:refs/heads/${QA_BRANCH}`]);pushed=c;
  fs.rmSync(path.join(out,'_run','qa.index'),{force:true});
}catch(e){pushErr=String(e.message||e).slice(0,300);log('push FAILED '+pushErr);}}
fs.rmSync(LOCK,{force:true});
res.ok=res.failed.length===0;res.finished=now();res.minutes=mins;res.allDone=allDone;res.total=TOTAL;res.freeGB=freeGB();res.qaCommit=pushed;
const url=`https://github.com/mhgd3250905/3D-Pose-Hub/blob/${QA_BRANCH}/overview.jpg`;
res.report=`托马斯补充 V5 样片完成：本次 ${list.length} 个，成功 ${res.done.length}，跳过（已做过）${res.skipped.length}，失败 ${res.failed.length}${res.failed.length?'（'+res.failed.join('、')+'）':''}；用时 ${mins} 分钟；累计 ${allDone}/${TOTAL}；样片在 ${path.join(out,'samples')}；磁盘剩余 ${res.freeGB} GB。`+(pushed?`总览：${url}`:`总览推送失败：${pushErr??'未推送'}`);
out1(res);process.exit(pushErr?4:(res.ok?0:3));
