#!/usr/bin/env node
// V4 full production (2026-11-12): all 249 actions x 5 skins through the same entry as r2-v12/r2-v13,
// in batches of 10, so the render machine reports after every batch.
//   node tools/v4/produce-v4.mjs --out <run-dir> --batch <1..25|retry> [--no-push]
// Per action: tools/joint-opt-r1/render-masters-joint.mjs --shoulder-axilla on --profile default -> <out>/masters/<id>/
//             tools/action-package-v3/compose.py --profile default                             -> <out>/packages/<id>/
// Resumable: an action whose packages/<id>/package.json exists is skipped. Half-made outputs are MOVED to
// <out>/_quarantine/<id>_<time>/ (never deleted). After the batch: <out>/_qa/batch-NN.jpg (+json) and the whole
// <out>/_qa folder is pushed as one commit to origin qa/v4-render-1112 (results only, no masters/packages).
// Exit: 0 batch done; 1 preflight refused (nothing rendered); 3 some action failed (others done, report and go on);
//       4 QA push failed (renders are fine). The last stdout line is one JSON whose "report" field is the text to post.
import fs from 'node:fs';import path from 'node:path';
import {spawn,spawnSync,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const PLAN=JSON.parse(fs.readFileSync(path.join(HERE,'v4-actions.json'),'utf8'));
const BASE='d6fb47cf5ea8768a73cec0594fd1bfbcbfe85cdc',QA_BRANCH='qa/v4-render-1112',SIZE=PLAN.batchSize;
const TOTAL=PLAN.actions.length,BATCHES=Math.ceil(TOTAL/SIZE);
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const now=()=>new Date().toISOString();const stamp=()=>now().replace(/[:.]/g,'-');
const out1=o=>console.log(JSON.stringify(o));
const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:undefined;};
const pre=m=>{try{if(typeof LOCK!=="undefined"&&fs.existsSync(LOCK)&&fs.readFileSync(LOCK,"utf8")===String(process.pid))fs.rmSync(LOCK);}catch{}out1({ok:false,preflight:true,error:m,report:`V4 渲染预检未通过，未开始渲染：${m}`});process.exit(1);};
if(!opt('--out')||!opt('--batch'))pre('用法: node tools/v4/produce-v4.mjs --out <run-dir> --batch <1..'+BATCHES+'|retry>');
const out=path.resolve(opt('--out')),bArg=opt('--batch'),noPush=args.includes('--no-push');
const g=(x,o={})=>execFileSync('git',x,{cwd:ROOT,encoding:'utf8',...o}).trim();
// ---- preflight
const head=g(['rev-parse','HEAD']);
if(g(['status','--porcelain','--untracked-files=no']))pre('仓库有未提交的改动');
if(spawnSync('git',['diff','--quiet',BASE,'HEAD','--','.',':(exclude)tools/v4'],{cwd:ROOT}).status!==0)pre('当前提交与 V4 基准 main d6fb47c 的渲染内容不一致');
for(const a of PLAN.actions)if(!fs.existsSync(path.join(ROOT,a.recipe)))pre('缺少配方 '+a.recipe);
if(spawnSync(PY,['-c','import numpy,PIL;print("ok")'],{encoding:'utf8'}).stdout?.trim()!=='ok')pre('找不到带 numpy+Pillow 的 python（设 $env:PYTHON）');
if(spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status!==0)pre('PATH 上没有 ffmpeg');
fs.mkdirSync(out,{recursive:true});
const LOCK=path.join(out,'_run','LOCK');fs.mkdirSync(path.dirname(LOCK),{recursive:true});
if(fs.existsSync(LOCK)){const pid=+fs.readFileSync(LOCK,'utf8');let alive=false;try{process.kill(pid,0);alive=true;}catch{}if(alive)pre('另一个 V4 批次正在运行 (PID '+pid+')');}
fs.writeFileSync(LOCK,String(process.pid));
const STATE=path.join(out,'_run','state.json');
const state=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{format:'pose-hub-v4-run@1',base:BASE,started:now(),actions:{},batches:{}};
const saveState=()=>fs.writeFileSync(STATE,JSON.stringify(state,null,1));
const isDone=id=>fs.existsSync(path.join(out,'packages',id,'package.json'));
let list;
if(bArg==='retry')list=PLAN.actions.filter(a=>!isDone(a.id));
else{const b=+bArg;if(!(b>=1&&b<=BATCHES))pre('批次号须为 1..'+BATCHES+' 或 retry');list=PLAN.actions.slice((b-1)*SIZE,b*SIZE);}
const freeGB=()=>{try{const s=fs.statfsSync(out);return +(s.bavail*s.bsize/1e9).toFixed(1);}catch{return null;}};
const doneSizes=Object.values(state.actions).filter(x=>x.status==='done'&&x.bytes).map(x=>x.bytes);
const avgGB=doneSizes.length?doneSizes.reduce((s,x)=>s+x,0)/doneSizes.length/1e9:null;
const need=Math.max(60,avgGB?avgGB*list.length*1.5:0);
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
  server=spawn(process.execPath,[vite,'--host',u.hostname,'--port',u.port||'80','--strictPort'],{cwd:ROOT,stdio:['ignore',lf,lf],windowsHide:true});
  const t0=Date.now();while(!(await reachable(appUrl))){if(server.exitCode!==null)pre('Vite 退出（端口被占？）');if(Date.now()-t0>180000)pre('Vite 180 秒内未就绪');await new Promise(r=>setTimeout(r,500));}
}
function stopServer(){if(server&&server.exitCode===null){try{if(process.platform==='win32')spawnSync('taskkill',['/T','/F','/PID',String(server.pid)]);else process.kill(server.pid);}catch{}}}
const TIMEOUT_MIN=+(process.env.V4_ACTION_TIMEOUT_MIN||90);
function killTree(pid){try{if(process.platform==='win32')spawnSync('taskkill',['/T','/F','/PID',String(pid)]);else process.kill(pid,'SIGKILL');}catch{}}
function run(cmd,a,lf){return new Promise(res=>{const fd=fs.openSync(lf,'a');fs.writeSync(fd,`\n# ${now()} ${cmd} ${a.join(' ')}\n`);
  const c=spawn(cmd,a,{cwd:ROOT,stdio:['ignore',fd,fd],windowsHide:true,env:{...process.env,NO_PROXY:['127.0.0.1','localhost',process.env.NO_PROXY].filter(Boolean).join(',')}});
  const timer=setTimeout(()=>{log(`timeout ${TIMEOUT_MIN} min, killing PID ${c.pid}`);killTree(c.pid);},TIMEOUT_MIN*60000);
  c.on('error',()=>{clearTimeout(timer);fs.closeSync(fd);res(-1);});c.on('exit',code=>{clearTimeout(timer);fs.closeSync(fd);res(code??-1);});});}
function quarantine(id,why){const q=path.join(out,'_quarantine',`${id}_${stamp()}`);let moved=false;
  for(const sub of ['masters','packages']){const s=path.join(out,sub,id);if(fs.existsSync(s)){fs.mkdirSync(q,{recursive:true});fs.renameSync(s,path.join(q,sub));moved=true;}}
  if(moved){fs.writeFileSync(path.join(q,'WHY.txt'),why+'\n');log(`${id} quarantined -> ${q}`);}}
function dirBytes(d){let n=0;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);n+=e.isDirectory()?dirBytes(p):fs.statSync(p).size;}return n;}
// ---- batch
const label=bArg==='retry'?'retry':String(+bArg).padStart(2,'0');
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
      const c=await run(process.execPath,[path.join(ROOT,'tools/joint-opt-r1/render-masters-joint.mjs'),'--recipe',a.recipe,'--root',out,'--shoulder-axilla','on','--profile','default'],lf);
      if(c!==0||!fs.existsSync(path.join(out,'masters',id,'layer-manifest.json'))){log(`${id} masters FAILED ${c}`);res.failed.push(id+':masters');ok=false;}}
    if(ok){log(id+' compose');
      const c=await run(PY,[path.join(ROOT,'tools/action-package-v3/compose.py'),'--root',out,'--id',id,'--profile','default'],lf);
      if(c!==0||!isDone(id)){log(`${id} compose FAILED ${c}`);res.failed.push(id+':compose');ok=false;}}
    const bytes=ok?dirBytes(path.join(out,'masters',id))+dirBytes(path.join(out,'packages',id)):null;
    state.actions[id]={status:ok?'done':'failed',seconds:Math.round((Date.now()-ts)/1000),bytes,at:now(),batch:label};saveState();
    if(ok){res.done.push(id);log(id+' done');}
  }
}finally{stopServer();}
// ---- QA sheet + push
const qa=path.join(out,'_qa');fs.mkdirSync(qa,{recursive:true});
const sheet=spawnSync(PY,[path.join(HERE,'batch-sheet.py'),'--root',out,'--out',path.join(qa,`batch-${label}.jpg`),'--ids',list.map(a=>a.id).join(',')],{encoding:'utf8'});
if(sheet.status!==0)log('sheet FAILED '+sheet.stderr);
const allDone=PLAN.actions.filter(a=>isDone(a.id)).length;
const mins=Math.round((Date.now()-t0)/60000);
const secs=Object.values(state.actions).filter(x=>x.status==='done').map(x=>x.seconds);
const remainH=secs.length?((TOTAL-allDone)*secs.reduce((s,x)=>s+x,0)/secs.length/3600).toFixed(1):'?';
state.batches[label]={...res,finished:now(),minutes:mins,freeGB:freeGB()};saveState();
fs.writeFileSync(path.join(qa,`batch-${label}.json`),JSON.stringify(state.batches[label],null,1));
fs.copyFileSync(STATE,path.join(qa,'state.json'));fs.copyFileSync(LOG,path.join(qa,'progress.log'));
let pushed=null,pushErr=null;
if(!noPush){try{
  const env={...process.env,GIT_INDEX_FILE:path.join(out,'_run','qa.index')};
  const G=path.resolve(ROOT,g(['rev-parse','--git-common-dir']));
  const gq=x=>execFileSync('git',['--git-dir',G,'--work-tree',qa,...x],{cwd:ROOT,encoding:'utf8',env}).trim();
  gq(['add','-A','.']);const tree=gq(['write-tree']);
  const remote=g(['ls-remote','origin','refs/heads/'+QA_BRANCH]).split(/\s+/)[0];
  if(remote)g(['fetch','-q','origin',`+refs/heads/${QA_BRANCH}:refs/remotes/origin/${QA_BRANCH}`]);
  const c=gq(['commit-tree',tree,...(remote?['-p',remote]:[]),'-m',`qa: V4 batch ${label} (${res.done.length} done, ${res.failed.length} failed; results only)`]);
  g(['push','origin',`${c}:refs/heads/${QA_BRANCH}`]);pushed=c;
  fs.rmSync(path.join(out,'_run','qa.index'),{force:true});
}catch(e){pushErr=String(e.message||e).slice(0,300);log('push FAILED '+pushErr);}}
fs.rmSync(LOCK,{force:true});
res.ok=res.failed.length===0;res.finished=now();res.minutes=mins;res.allDone=allDone;res.total=TOTAL;res.freeGB=freeGB();res.qaCommit=pushed;
const url=`https://github.com/mhgd3250905/3D-Pose-Hub/blob/${QA_BRANCH}/batch-${label}.jpg`;
res.report=`V4 渲染 第 ${label}/${BATCHES} 批完成：本批 ${list.length} 个，成功 ${res.done.length}，跳过（已做过）${res.skipped.length}，失败 ${res.failed.length}${res.failed.length?'（'+res.failed.join('、')+'）':''}；本批用时 ${mins} 分钟；累计 ${allDone}/${TOTAL}；磁盘剩余 ${res.freeGB} GB；预计还需约 ${remainH} 小时。`+(pushed?`预览：${url}`:`预览推送失败：${pushErr??'未推送'}`);
out1(res);process.exit(pushErr?4:(res.ok?0:3));
