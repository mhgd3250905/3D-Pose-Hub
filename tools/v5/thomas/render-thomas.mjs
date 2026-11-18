#!/usr/bin/env node
// V5 托马斯全旋 loop (2026-11-17): Pose Studio v3r7 default flare-arm8legs, spiky hair, fx.js on, + v3r8b wrist fix.
//   node tools/v5/thomas/render-thomas.mjs --out <run-dir> [--size 1080]
// 1) headless page tools/v5/runtime/thomas.html (static server on the repo root, no Vite needed): 81 video frames at 30 fps =
//    one full rotation at the app's default 0.5x playback (video frame k = anim frame 2k of 162 @120 fps). Three passes per frame:
//    body+fx over the opaque light and dark theme colours (two-background matte keeps the additive fx glow), and the fx hard shadow alone.
// 2) tools/v5/thomas/merge-shadow.py: shadow pass -> translucent two-tone shadow under the body -> masters/<id>/v5-toon/body/m-NNNN.png
//    + layer-manifest.json (same layout as V5 action masters).
// 3) tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json -> packages/<id>/ (transparent webm, dark/light mp4, covers,
//    thumbnails, keyframes: same set/sizes/names as part A).
// Resumable per step: finished masters are kept; packages/<id>/package.json = done. Last stdout line = one JSON with "report".
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import crypto from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../../..');
const ID='thomas-flare-arm8legs',FPS=30,STEP=2,N=81;   // 81 frames x 2 anim frames = 162 = one loop
// image window (px of the app's 1080 view of anim.cams.v0): loop extent body+fx+shadow measured x 54..1154, y 230..1050 -> centred, 30 px margin
const WIN={x:24,y:60,w:1160};
const {config}=await import(pathToFileURL(path.join(ROOT,'drill-anim/lib/config.mjs')).href);const C=config();
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:undefined;};
const done=(o,code)=>{console.log(JSON.stringify(o));process.exit(code);};
if(!opt('--out'))done({ok:false,report:'用法: node tools/v5/thomas/render-thomas.mjs --out <run-dir>'},1);
const out=path.resolve(opt('--out')),size=+(opt('--size')||1080),noPush=args.includes('--no-push');
const QA_BRANCH='qa/v5-render-1117';
const pkgJson=path.join(out,'packages',ID,'package.json');
if(fs.existsSync(pkgJson))done({ok:true,skipped:true,out,report:`V5 托马斯：已完成（${path.join(out,'packages',ID)}），未重复渲染。`},0);
const mdir=path.join(out,'masters',ID),work=path.join(out,'_thomas-work');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const t0=Date.now();
const {light:TH_L,dark:TH_D}=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/v5/profile-v5.json'),'utf8')).derivatives.themes;
if(!fs.existsSync(path.join(mdir,'layer-manifest.json'))){
  // half-made masters are moved aside, never deleted
  if(fs.existsSync(mdir)){const q=path.join(out,'_quarantine',`${ID}_${new Date().toISOString().replace(/[:.]/g,'-')}`);fs.mkdirSync(q,{recursive:true});fs.renameSync(mdir,path.join(q,'masters'));}
  fs.mkdirSync(work,{recursive:true});
  const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary'};
  const srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname);const f=path.join(ROOT,u);
    if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
  if(C.playwright_browsers_path)process.env.PLAYWRIGHT_BROWSERS_PATH=C.playwright_browsers_path;
  const {chromium}=await import(pathToFileURL(C.playwright_module).href);
  const cargs=Array.isArray(C.chromium_args)?C.chromium_args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'];
  const b=await chromium.launch({args:cargs,...(C.chromium_channel?{channel:C.chromium_channel}:{})});
  const errs=[];const poses=[];
  try{
    const p=await b.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&!/GPU stall|GL Driver/.test(m.text()))errs.push(m.text());});
    await p.goto(`http://127.0.0.1:${srv.address().port}/tools/v5/runtime/thomas.html?hair=spiky&size=${size}&vx=${WIN.x*size/1080}&vy=${WIN.y*size/1080}&vw=${WIN.w*size/1080}&bgL=${encodeURIComponent(TH_L)}&bgD=${encodeURIComponent(TH_D)}`);
    await p.waitForFunction(()=>window.__T?.ready,null,{timeout:170000});
    const info=await p.evaluate(()=>({...__T.info,count:__T.count,fps:__T.fps}));
    if(info.count!==N*STEP||info.fps!==120||info.hair!=='spiky'||!info.shadow||info.wrist?.length!==2)throw Error('unexpected page state '+JSON.stringify(info));
    fs.writeFileSync(path.join(work,'info.json'),JSON.stringify(info));
    for(let k=0;k<=N;k++){const f=(k*STEP)%info.count;
      for(const pass of ['bodyL','bodyD','shadow']){const fn=path.join(work,`${pass}-${String(k).padStart(4,'0')}.png`);
        const url=await p.evaluate(([f,pass])=>__T.frame(f,pass),[f,pass]);fs.writeFileSync(fn,Buffer.from(url.split(',')[1],'base64'));}
      poses.push({frame:k,anim:f,...await p.evaluate(f=>__T.pose(f),f)});
      if(errs.length)throw Error('page errors: '+errs.join(' | '));
      console.log(JSON.stringify({event:'frame',id:ID,frame:k,ms:Date.now()-t0}));}
  }finally{await b.close();srv.close();}
  const mx=Math.max(...poses.map(x=>x.spread));fs.writeFileSync(path.join(work,'spread.json'),JSON.stringify(poses.map(x=>+(x.spread/mx).toFixed(6))));
  fs.writeFileSync(path.join(work,'pose.json'),JSON.stringify({format:'pose-hub-v5-pose@1',actionId:ID,fps:FPS,frames:poses}));
  const m=spawnSync(PY,[path.join(HERE,'merge-shadow.py'),'--work',work,'--bg-light',TH_L,'--bg-dark',TH_D,'--root',out,'--id',ID,'--frames',String(N),'--size',String(size)],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  if(m.status!==0)done({ok:false,report:'V5 托马斯：合成投影失败 '+(m.stderr||'').slice(-300)},3);
}
// a package dir without package.json = compose was interrupted: move it aside (never delete), like produce-v5.mjs
const pdir=path.join(out,'packages',ID);
if(fs.existsSync(pdir)){const q=path.join(out,'_quarantine',`${ID}_pkg_${new Date().toISOString().replace(/[:.]/g,'-')}`);fs.mkdirSync(q,{recursive:true});fs.renameSync(pdir,path.join(q,'packages'));}
const c=spawnSync(PY,[path.join(ROOT,'tools/action-package-v3/compose.py'),'--root',out,'--id',ID,'--profile',path.join(ROOT,'tools/v5/profile-v5.json')],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
if(c.status!==0||!fs.existsSync(pkgJson))done({ok:false,report:'V5 托马斯：打包失败 '+(c.stderr||'').slice(-300)},3);
const mins=Math.round((Date.now()-t0)/60000);
// QA preview: light/dark cover + start/peak/end -> <out>/_qa/thomas.jpg, pushed with the whole _qa folder (results only)
const qa=path.join(out,'_qa');fs.mkdirSync(qa,{recursive:true});
const sh=spawnSync(PY,['-c',`import sys;from PIL import Image
r=sys.argv[1];o=sys.argv[2];fs=['light/start.720.png','light/peak.720.png','light/end.720.png','dark/cover.720.jpg']
im=Image.new('RGB',(4*360,360));[im.paste(Image.open(r+'/'+f).convert('RGB').resize((360,360)),(i*360,0)) for i,f in enumerate(fs)];im.save(o,quality=85)`,path.join(out,'packages',ID,'v5-toon'),path.join(qa,'thomas.jpg')],{encoding:'utf8'});
let pushed=null,pushErr=sh.status===0?null:'preview sheet failed';
if(!noPush&&!pushErr){try{
  const g=(x,o={})=>execFileSync('git',x,{cwd:ROOT,encoding:'utf8',...o}).trim();
  const env={...process.env,GIT_INDEX_FILE:path.join(work,'qa.index')};
  const G=path.resolve(ROOT,g(['rev-parse','--git-common-dir']));
  const gq=x=>execFileSync('git',['--git-dir',G,'--work-tree',qa,...x],{cwd:ROOT,encoding:'utf8',env}).trim();
  gq(['add','-A','.']);const tree=gq(['write-tree']);
  const remote=g(['ls-remote','origin','refs/heads/'+QA_BRANCH]).split(/\s+/)[0];
  if(remote)g(['fetch','-q','origin',`+refs/heads/${QA_BRANCH}:refs/remotes/origin/${QA_BRANCH}`]);
  const c=gq(['commit-tree',tree,...(remote?['-p',remote]:[]),'-m','qa: V5 thomas loop (results only)']);
  g(['push','origin',`${c}:refs/heads/${QA_BRANCH}`]);pushed=c;fs.rmSync(path.join(work,'qa.index'),{force:true});
}catch(e){pushErr=String(e.message||e).slice(0,300);}}
const url=`https://github.com/mhgd3250905/3D-Pose-Hub/blob/${QA_BRANCH}/thomas.jpg`;
done({ok:true,out,id:ID,minutes:mins,qaCommit:pushed,error:pushErr,report:`V5 托马斯全旋完成：${N} 帧（30fps，2.7 s 一圈循环），用时 ${mins} 分钟；成片在 ${path.join(out,'packages',ID)}。`+(pushed?`预览：${url}`:`预览推送失败：${pushErr??'未推送'}`)},pushErr&&!noPush?4:0);
