#!/usr/bin/env node
// Jitter fix r1 (2026-11-12): full production re-render of the two fixed actions through the same entry as r2-v12.
//   node tools/joint-opt-r1/produce-jitter-r1.mjs --out <new-directory>
// Per action: render-masters-joint.mjs --shoulder-axilla on --profile default -> <out>/on/masters/<id>/
//             tools/action-package-v3/compose.py --profile default             -> <out>/on/packages/<id>/
// Starts/stops the dev server itself (by PID) when drill-anim/config.json app_url is local and not running.
// Exit codes: 0 done; 1 preflight refused (nothing rendered); 3 a stage failed (see <out>/progress.log). Last line is one JSON.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {spawn,spawnSync,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const ACTIONS=['s-9090','h-lateral-step-lunge'];
const RECIPES='catalog/production/remaining219-r1/recipes';
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const now=()=>new Date().toISOString();
const out1=o=>{console.log(JSON.stringify(o));};
const a=process.argv.slice(2);
if(a.length!==2||a[0]!=='--out'){out1({ok:false,error:'Usage: node tools/joint-opt-r1/produce-jitter-r1.mjs --out <new-directory>'});process.exit(1);}
const out=path.resolve(a[1]);
const pre=m=>{out1({ok:false,preflight:true,error:m});process.exit(1);};
if(fs.existsSync(out))pre('Output directory already exists: '+out);
const g=x=>execFileSync('git',x,{cwd:ROOT,encoding:'utf8'}).trim();
const head=g(['rev-parse','HEAD']);
if(g(['status','--porcelain','--untracked-files=no']))pre('Tracked changes in the worktree');
for(const id of ACTIONS)if(!fs.existsSync(path.join(ROOT,RECIPES,id+'.json')))pre('Missing recipe '+id);
if(spawnSync(PY,['-c','import numpy,PIL;print("ok")'],{encoding:'utf8'}).stdout?.trim()!=='ok')pre('python with numpy+Pillow not found (set $env:PYTHON)');
if(spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status!==0)pre('ffmpeg not on PATH');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'drill-anim/config.json'),'utf8'));
fs.mkdirSync(out,{recursive:true});
const LOG=path.join(out,'progress.log');const log=m=>fs.appendFileSync(LOG,`${now()} ${m}\n`);
async function reachable(u){try{return (await fetch(u+'/src/viewer.js')).ok;}catch{return false;}}
let server=null;
async function ensureServer(appUrl){
  if(await reachable(appUrl))return;
  const u=new URL(appUrl);if(!['127.0.0.1','localhost'].includes(u.hostname))pre('Dev server '+appUrl+' unreachable and not local');
  const vite=path.join(ROOT,'node_modules/vite/bin/vite.js');if(!fs.existsSync(vite))pre('node_modules/vite missing: run npm install');
  const lf=fs.openSync(path.join(out,'vite.log'),'a');
  server=spawn(process.execPath,[vite,'--host',u.hostname,'--port',u.port||'80','--strictPort'],{cwd:ROOT,stdio:['ignore',lf,lf],windowsHide:true});
  const t0=Date.now();while(!(await reachable(appUrl))){if(server.exitCode!==null)pre('Vite exited (port in use?)');if(Date.now()-t0>180000)pre('Vite not ready in 180 s');await new Promise(r=>setTimeout(r,500));}
}
function stopServer(){if(server&&server.exitCode===null){try{if(process.platform==='win32')spawnSync('taskkill',['/T','/F','/PID',String(server.pid)]);else process.kill(server.pid);}catch{}}}
function run(cmd,args,lf){return new Promise(res=>{const fd=fs.openSync(lf,'a');fs.writeSync(fd,`\n# ${now()} ${cmd} ${args.join(' ')}\n`);
  const c=spawn(cmd,args,{cwd:ROOT,stdio:['ignore',fd,fd],windowsHide:true,env:{...process.env,NO_PROXY:['127.0.0.1','localhost',process.env.NO_PROXY].filter(Boolean).join(',')}});
  c.on('error',e=>{fs.closeSync(fd);res(-1);});c.on('exit',code=>{fs.closeSync(fd);res(code??-1);});});}
const result={ok:false,head,out,actions:ACTIONS.length,done:0,failed:[],started:now()};
try{
  await ensureServer(cfg.app_url);
  for(const id of ACTIONS){
    const lf=path.join(out,id+'.log');
    log(id+' on');
    let c=await run(process.execPath,[path.join(HERE,'render-masters-joint.mjs'),'--recipe',path.join(RECIPES,id+'.json'),'--root',path.join(out,'on'),'--shoulder-axilla','on','--profile','default'],lf);
    if(c!==0||!fs.existsSync(path.join(out,'on/masters',id,'layer-manifest.json'))){log(id+' on FAILED '+c);result.failed.push(id+':on');continue;}
    log(id+' compose');
    c=await run(PY,[path.join(ROOT,'tools/action-package-v3/compose.py'),'--root',path.join(out,'on'),'--id',id,'--profile','default'],lf);
    if(c!==0||!fs.existsSync(path.join(out,'on/packages',id,'package.json'))){log(id+' compose FAILED '+c);result.failed.push(id+':compose');continue;}
    log(id+' done');result.done++;
  }
}finally{stopServer();}
result.ok=result.failed.length===0&&result.done===ACTIONS.length;result.finished=now();
fs.writeFileSync(path.join(out,'run-log.json'),JSON.stringify(result,null,1));out1(result);process.exit(result.ok?0:3);
