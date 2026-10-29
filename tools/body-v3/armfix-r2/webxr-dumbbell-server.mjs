import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import{REPO}from'./hand-qa-runtime.mjs';
const[assets,viewer]=process.argv.slice(2),threeRoot=path.join(REPO,'node_modules/three');if(!assets||!viewer)throw Error('Asset and viewer directories required');
const publicAssets=new Set(['left-hand-with-dumbbell.glb','right-hand-with-dumbbell.glb','template.mjs','manifest.json']);
const server=http.createServer((req,res)=>{try{
 const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);let file;
 if(rel==='/'||rel==='/index.html')file=path.join(viewer,'index.html');
 else if(rel.startsWith('/assets/')&&publicAssets.has(rel.slice(8)))file=path.join(assets,rel.slice(8));
 else if(rel.startsWith('/three/')){file=path.resolve(threeRoot,rel.slice(7));if(!file.startsWith(threeRoot+path.sep))throw Error('Invalid path');}
 else throw Error('Not found');
 const ext=path.extname(file),type=ext==='.html'?'text/html; charset=utf-8':['.js','.mjs'].includes(ext)?'text/javascript':ext==='.json'?'application/json':'model/gltf-binary';
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(fs.readFileSync(file));
}catch{res.writeHead(404);res.end('Not found');}});
server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port+'/';fs.writeFileSync(path.join(viewer,'server-info.json'),JSON.stringify({url,pid:process.pid,assets,purpose:'Reusable WebXR hand with project-sized dumbbell review'},null,2),{flag:'wx'});console.log(url);});
