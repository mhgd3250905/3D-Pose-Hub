// Local, read-only preview server for three explicitly selected public assets.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import {REPO} from './hand-qa-runtime.mjs';
const [root]=process.argv.slice(2);if(!root)throw Error('Preview root required');
const assets=new Map(['webxr-left.glb','webxr-right.glb','mpfb-hm08-body-preview.glb'].map(n=>['/assets/'+n,path.join(root,'source',n)]));
const threeRoot=path.join(REPO,'node_modules/three');
const server=http.createServer((req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1'),rel=decodeURIComponent(url.pathname);let file;
 if(rel==='/'||rel==='/index.html')file=path.join(root,'viewer/index.html');else if(assets.has(rel))file=assets.get(rel);else if(rel.startsWith('/three/')){file=path.resolve(threeRoot,rel.slice(7));if(!file.startsWith(threeRoot+path.sep))throw Error('Outside module root');}else{res.writeHead(404);res.end();return;}
 const data=fs.readFileSync(file),ext=path.extname(file);res.writeHead(200,{'Content-Type':ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript':ext==='.glb'?'model/gltf-binary':'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(e){res.writeHead(404);res.end('Not found');}});
server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port+'/';fs.writeFileSync(path.join(root,'viewer/server-info.json'),JSON.stringify({url,pid:process.pid,purpose:'User-requested official model preview; read-only loopback'},null,2),{flag:'wx'});console.log(url);});
