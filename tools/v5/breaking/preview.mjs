#!/usr/bin/env node
// Quick look for a breaking anim: node tools/v5/breaking/preview.mjs --anim <repo-relative json> --out <dir> [--frames 0,24,48,72] [--size 720] [--pass bodyL]
// Renders the given anim frames on tools/v5/breaking/move.html (V5 toon + wrist fix + fx, spiky hair) and writes f-NNNN.png.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {pathToFileURL,fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const C=JSON.parse(fs.readFileSync(path.join(ROOT,'drill-anim/config.json'),'utf8'));
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d;};
const anim=opt('--anim'),out=path.resolve(opt('--out')),size=+opt('--size',720),pass=opt('--pass','bodyL');
const frames=opt('--frames','0').split(',').map(Number);fs.mkdirSync(out,{recursive:true});
if(C.playwright_browsers_path)process.env.PLAYWRIGHT_BROWSERS_PATH=C.playwright_browsers_path;
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(new URL(q.url,'http://x').pathname).replace('/tools/v5/breaking/model/','/tools/v5/runtime/model/');
  const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
const {chromium}=await import(pathToFileURL(C.playwright_module).href);
const b=await chromium.launch({args:C.chromium_args});const errs=[];
try{const p=await b.newPage({viewport:{width:size,height:size}});p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(`http://127.0.0.1:${srv.address().port}/tools/v5/breaking/move.html?hair=spiky&size=${size}&anim=/${anim}`);
  await p.waitForFunction(()=>window.__T?.ready||false,null,{timeout:170000}).catch(e=>{throw Error('not ready: '+errs.join('|'))});
  for(const f of frames){const url=await p.evaluate(([f,pass])=>__T.frame(f,pass),[f,pass]);
    fs.writeFileSync(path.join(out,`f-${String(f).padStart(4,'0')}.png`),Buffer.from(url.split(',')[1],'base64'));}
  console.log(JSON.stringify({ok:true,frames,errs,info:await p.evaluate(()=>__T.info.fx?.params)}));
}finally{await b.close();srv.close();}
