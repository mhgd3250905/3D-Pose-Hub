import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import{REPO}from'./hand-qa-runtime.mjs';
const[input,viewer]=process.argv.slice(2),threeRoot=path.join(REPO,'node_modules/three');if(!input||!viewer)throw Error('Input folder and viewer folder required');
const server=http.createServer((req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);let file;
 if(rel==='/'||rel==='/index.html')file=path.join(viewer,'index.html');else if(['/left-grasp.json','/right-grasp.json'].includes(rel))file=path.join(input,rel.slice(1));else if(rel.startsWith('/three/')){file=path.resolve(threeRoot,rel.slice(7));if(!file.startsWith(threeRoot+path.sep))throw Error('Path');}else throw Error('Route');
 const ext=path.extname(file);res.writeHead(200,{'Content-Type':ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript':'application/json','Cache-Control':'no-store'});res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(404);res.end('Not found');}});
server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port+'/';fs.writeFileSync(path.join(viewer,'server-info.json'),JSON.stringify({url,pid:process.pid,input,purpose:'Fixed WebXR hand grasp review'},null,2),{flag:'wx'});console.log(url);});
