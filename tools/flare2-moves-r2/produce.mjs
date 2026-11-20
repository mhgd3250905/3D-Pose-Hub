#!/usr/bin/env node
// Flare 2.0 moves r2 batch 1 (2026-11-21, branch codex/flare2-moves-r2): V5 render of the 6 r2 actions ONLY (tools/flare2-moves-r2/actions.json
// "actions"; t-child-pose-side-reach is in "deferred" and is not rendered).
// Copy of tools/flare2-moves/produce.mjs (same masters -> compose flow, resume, quarantine, timeouts, stall kill, stale-lock cleanup); differences:
//   - plan = tools/flare2-moves-r2/actions.json, recipes catalog/production/flare2-moves-r2/recipes/; no other action is ever rendered;
//   - masters renderer = tools/flare2-moves-r2/v5/render-masters-v5r2.mjs (copy of tools/v5/render-masters-v5.mjs + the opt-in V5
//     extension v5r2-ext.js for head rotation / finger poses; tools/v5 is untouched);
//   - preflight: (a) only paths this branch ADDS may differ from the base 4dde699 (codex/flare2-publish, r2-v20 published), so every
//     existing action, the V5 runtime, engine and props are byte-identical; (b) the render content must equal RENDER (the commit
//     whose content was reported; only this file and README.md / the task cards may differ after it);
//   - samples (default): 720p light loop per action in <out>/samples, QA overview to orphan branch qa/flare2-moves-r2;
//     --final: production render, same command and outputs, refuses --only, default --out ..._flare2-r2-final_<RENDER>, QA to
//     qa/flare2-moves-r2-final. Use --final only after 开哥 has approved the samples rendered from the same RENDER commit.
//   node tools/flare2-moves-r2/produce.mjs [--final] [--out <run-dir>] [--only id,id] [--no-push] [--vite-force]
// Nothing here uploads media, publishes a pack, moves a pointer, merges or tags.
// Exit: 0 all done; 1 preflight refused (nothing rendered); 3 some action failed (others done); 4 QA push failed (renders fine).
// The last stdout line is one JSON whose "report" field is the text to post.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {spawn,spawnSync,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {config} from '../../drill-anim/lib/config.mjs';
const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const PLAN0=JSON.parse(fs.readFileSync(path.join(HERE,'actions.json'),'utf8'));
const PLAN={actions:PLAN0.actions.map(a=>({id:a.id,recipe:`catalog/production/flare2-moves-r2/recipes/${a.id}.json`}))};
const args0=process.argv.slice(2),FINAL=args0.includes('--final');
// RENDER = the commit whose render content was reported (samples and --final both render exactly this content)
const RENDER='138e3e935788db70752387687366e37a41df464d',RS=RENDER.slice(0,7);
// paths that may differ from RENDER (none of them is read by the renderer)
// tools/flare2-moves-r2/publish = r2-v21 publish tooling (codex/flare2-r2-publish; build/voice/verify/preflight/task card), never read by the renderer
const RENDER_EXCLUDE=['tools/flare2-moves-r2/produce.mjs','tools/flare2-moves-r2/README.md','tools/flare2-moves-r2/cards','tools/flare2-moves-r2/publish','catalog/production/flare2-moves-r2/text'];
const BASE='4dde699290bc9abe2603caaed0b26c5c0dd15e83',QA_BRANCH=FINAL?'qa/flare2-moves-r2-final':'qa/flare2-moves-r2';
const TOTAL=PLAN.actions.length;
if(!/^[0-9a-f]{40}$/.test(RENDER))throw Error('RENDER not pinned');
const DEFAULT_OUT=FINAL?`F:/PoseHub-v3/runs/2026-11-21_flare2-r2-final_${RS}`:'F:/PoseHub-v3/runs/2026-11-21_flare2-moves-r2';
// files this branch adds on top of BASE; every other path must equal BASE (old actions, V5 runtime, engine, props byte-identical)
// (actions.json "deferred" = new ids drafted on this branch but not rendered in this batch; their specs are new files too)
const EXCLUDE=['tools/flare2-moves-r2','catalog/production/flare2-moves-r2','drill-anim/lib/flare2-r2.mjs',...PLAN0.actions.map(a=>a.spec),...(PLAN0.deferred||[]).map(a=>a.spec)];
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const now=()=>new Date().toISOString();const stamp=()=>now().replace(/[:.]/g,'-');
const out1=o=>console.log(JSON.stringify(o));
const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:undefined;};
const KIND=FINAL?'正式渲染':'样片';
const pre=m=>{try{if(typeof LOCK!=="undefined"&&fs.existsSync(LOCK)&&fs.readFileSync(LOCK,"utf8")===String(process.pid))fs.rmSync(LOCK);}catch{}out1({ok:false,preflight:true,error:m,report:`Flare 2.0 r2 新动作 V5 ${KIND}预检未通过，未开始渲染：${m}`});process.exit(1);};
if(args.some((x,i)=>x.startsWith('--')&&!['--out','--only','--no-push','--vite-force','--final'].includes(x)))pre('用法: node tools/flare2-moves-r2/produce.mjs [--final] [--out <run-dir>] [--only id,id] [--no-push] [--vite-force]');
if(FINAL&&args.includes('--only'))pre(`--final 不接受 --only：正式渲染 ${PLAN0.actions.length} 个动作必须同一次跑完（中断后原命令重跑会跳过已完成的）`);
const viteForce=args.includes('--vite-force');   // README: after a Vite 504 Outdated Optimize Dep, delete node_modules/.vite and rerun once with this
const out=path.resolve(opt('--out')??DEFAULT_OUT),noPush=args.includes('--no-push'),only=opt('--only');
const PROFILE=path.join(ROOT,'tools/v5/profile-v5.json');
const g=(x,o={})=>execFileSync('git',x,{cwd:ROOT,encoding:'utf8',...o}).trim();
// ---- preflight
const head=g(['rev-parse','HEAD']);
if(g(['status','--porcelain','--untracked-files=no']))pre('仓库有未提交的改动');
if(spawnSync('git',['cat-file','-e',BASE+'^{commit}'],{cwd:ROOT}).status!==0)pre('本地没有基准提交 4dde699（先 git fetch origin）');
if(spawnSync('git',['diff','--quiet',BASE,'HEAD','--','.',...EXCLUDE.map(p=>':(exclude)'+p)],{cwd:ROOT}).status!==0)pre('当前提交除本分支新增的 Flare 2.0 r2 新动作文件外与基准 4dde699 不一致');
for(const a of PLAN.actions)if(!fs.existsSync(path.join(ROOT,a.recipe)))pre('缺少配方 '+a.recipe);
// every excluded path must be NEW on this branch (an excluded path that exists in BASE could hide a change to an existing action)
for(const p of EXCLUDE)if(spawnSync('git',['cat-file','-e',`${BASE}:${p}`],{cwd:ROOT}).status===0)pre('排除列表里的 '+p+' 在基准 4dde699 已存在（只允许本分支新增文件不同）');
if(spawnSync('git',['cat-file','-e',RENDER+'^{commit}'],{cwd:ROOT}).status!==0)pre(`本地没有渲染内容提交 ${RS}（先 git fetch origin）`);
if(spawnSync('git',['diff','--quiet',RENDER,'HEAD','--','.',...RENDER_EXCLUDE.map(p=>':(exclude)'+p)],{cwd:ROOT}).status!==0)pre(`渲染内容与 ${RS} 不一致（只能渲染已报告的提交）`);
for(const f of ['tools/v5/profile-v5.json','tools/action-package-v3/skins/v5-toon.json','tools/v5/runtime/model/coach-v3r3-wristfix.glb','tools/v5/runtime/v5-hub.js'])if(!fs.existsSync(path.join(ROOT,f)))pre('缺少 V5 文件 '+f);
if(spawnSync(PY,['-c','import numpy,PIL;print("ok")'],{encoding:'utf8'}).stdout?.trim()!=='ok')pre('找不到带 numpy+Pillow 的 python（设 $env:PYTHON）');
if(spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status!==0)pre('PATH 上没有 ffmpeg');
fs.mkdirSync(out,{recursive:true});
const LOCK=path.join(out,'_run','LOCK');fs.mkdirSync(path.dirname(LOCK),{recursive:true});
if(fs.existsSync(LOCK)){const pid=+fs.readFileSync(LOCK,'utf8');let alive=false;try{process.kill(pid,0);alive=true;}catch{}if(alive)pre('另一个 Flare 2.0 r2 渲染正在运行 (PID '+pid+')');}
fs.writeFileSync(LOCK,String(process.pid));
const STATE=path.join(out,'_run','state.json');
const state=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{format:'pose-hub-flare2-moves-run@1',base:BASE,render:RENDER,started:now(),actions:{},batches:{}};
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
const t0=Date.now();const res={ok:false,head,base:BASE,renderCommit:RENDER,out,batch:label,ids:list.map(a=>a.id),done:[],skipped:[],failed:[],rerendered:[],started:now(),...(FINAL?{final:true}:{})};
{const fj=path.join(out,'_run','render.json');const prev=fs.existsSync(fj)?JSON.parse(fs.readFileSync(fj,'utf8')):null;
  if(prev&&(prev.renderCommit!==RENDER||!!prev.final!==FINAL))pre('这个输出目录是别的提交或别的模式的渲染：'+prev.renderCommit+(prev.final?' (final)':' (样片)'));
  fs.writeFileSync(fj,JSON.stringify({format:'flare2-r2-render@1',renderCommit:RENDER,final:FINAL,heads:[...new Set([...(prev?.heads||[]),head])],firstStarted:prev?.firstStarted||now()},null,1));}
try{
  await ensureServer(cfg.app_url);
  for(const a of list){
    const id=a.id;
    // r1 fix (2026-11-20): an action whose recipe changed after it was rendered (spec edited -> specSha256Lf in the recipe changes)
    // is not "done": its masters/package are moved to _quarantine (never deleted) and it renders again with the same command.
    {const mf=path.join(out,'masters',id,'layer-manifest.json');let stale=false;
      try{if(fs.existsSync(mf))stale=JSON.parse(fs.readFileSync(mf,'utf8')).recipe?.sha256!==sha256(fs.readFileSync(path.join(ROOT,a.recipe)));}catch{stale=true;}
      if(stale){quarantine(id,'recipe changed since this render (new commit): re-render');res.rerendered.push(id);}}
    if(isDone(id)){res.skipped.push(id);continue;}
    const lf=path.join(out,'_run','logs',id+'.log');fs.mkdirSync(path.dirname(lf),{recursive:true});
    const ts=Date.now();const mDone=fs.existsSync(path.join(out,'masters',id,'layer-manifest.json'));
    if(!mDone)quarantine(id,'incomplete masters before re-render');
    else if(fs.existsSync(path.join(out,'packages',id))){const q=path.join(out,'_quarantine',`${id}_${stamp()}`);fs.mkdirSync(q,{recursive:true});fs.renameSync(path.join(out,'packages',id),path.join(q,'packages'));log(`${id} partial package quarantined`);}
    let ok=true;
    if(!mDone){log(id+' masters');
      const margs=[path.join(ROOT,'tools/flare2-moves-r2/v5/render-masters-v5r2.mjs'),'--recipe',a.recipe,'--root',out,'--profile',PROFILE];
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
fs.copyFileSync(path.join(out,'_run','render.json'),path.join(qa,'render.json'));
let pushed=null,pushErr=null;
if(!noPush){try{
  const env={...process.env,GIT_INDEX_FILE:path.join(out,'_run','qa.index')};
  const G=path.resolve(ROOT,g(['rev-parse','--git-common-dir']));
  const gq=x=>execFileSync('git',['--git-dir',G,'--work-tree',qa,...x],{cwd:ROOT,encoding:'utf8',env}).trim();
  gq(['add','-A','.']);const tree=gq(['write-tree']);
  const remote=g(['ls-remote','origin','refs/heads/'+QA_BRANCH]).split(/\s+/)[0];
  if(remote)g(['fetch','-q','origin',`+refs/heads/${QA_BRANCH}:refs/remotes/origin/${QA_BRANCH}`]);
  const c=gq(['commit-tree',tree,...(remote?['-p',remote]:[]),'-m',`qa: flare2-moves-r2 ${FINAL?'V5 final render':'V5 samples'} of ${RS} (${res.done.length} done, ${res.failed.length} failed; overview only)`]);
  g(['push','origin',`${c}:refs/heads/${QA_BRANCH}`]);pushed=c;
  fs.rmSync(path.join(out,'_run','qa.index'),{force:true});
}catch(e){pushErr=String(e.message||e).slice(0,300);log('push FAILED '+pushErr);}}
fs.rmSync(LOCK,{force:true});
res.ok=res.failed.length===0;res.finished=now();res.minutes=mins;res.allDone=allDone;res.total=TOTAL;res.freeGB=freeGB();res.qaCommit=pushed;
const url=`https://github.com/mhgd3250905/3D-Pose-Hub/blob/${QA_BRANCH}/overview.jpg`;
res.report=`Flare 2.0 r2 新动作（${RS}）V5 ${KIND}完成：本次 ${list.length} 个，成功 ${res.done.length}${res.rerendered.length?'（其中配方已更新重渲 '+res.rerendered.length+' 个：'+res.rerendered.join('、')+'）':''}，跳过（已做过）${res.skipped.length}，失败 ${res.failed.length}${res.failed.length?'（'+res.failed.join('、')+'）':''}；用时 ${mins} 分钟；累计 ${allDone}/${TOTAL}；${FINAL?'成片包在 '+path.join(out,'packages'):'样片在 '+path.join(out,'samples')}；磁盘剩余 ${res.freeGB} GB。`+(pushed?`总览：${url}`:`总览推送失败：${pushErr??'未推送'}`);
out1(res);process.exit(pushErr?4:(res.ok?0:3));
