// Read-only loopback review of an existing actual GPU capture. No browser launch.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../../..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pin=file=>{const b=fs.readFileSync(file);return {sha256:sha(b),bytes:b.length};};
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));

export function prepareReview(captureDirectory,reviewDirectory,{qaPath}={}){
 const captureDir=fs.realpathSync(captureDirectory),reviewDir=path.resolve(reviewDirectory);
 if(fs.existsSync(reviewDir))throw Error('Review output must be a NEW directory: '+reviewDir);
 const reviewRelative=path.relative(captureDir,reviewDir);
 if(reviewRelative!==''&&!reviewRelative.startsWith('..'+path.sep)&&reviewRelative!=='..'&&!path.isAbsolute(reviewRelative))throw Error('Review output must be outside the read-only capture directory');
 const routes=new Map();
 const include=(relative,type='application/json; charset=utf-8')=>{
  if(typeof relative!=='string'||!relative)throw Error('Capture manifest contains an invalid file reference');
  const file=fs.realpathSync(path.resolve(captureDir,relative)),within=path.relative(captureDir,file);
  if(within==='..'||within.startsWith('..'+path.sep)||path.isAbsolute(within)||!fs.statSync(file).isFile())throw Error('Capture reference escapes its directory');
  const url='/capture/'+encodeURIComponent(within.split(path.sep).join('/'));
  routes.set(url,{file,type});return {url,file:within.split(path.sep).join('/'),...pin(file)};
 };
 const reportFile=path.join(captureDir,'report.json'),report=read(reportFile);
 const qa=qaPath?read(qaPath):null;
 if(qa&&fs.realpathSync(qa.sourceDirectory)!==captureDir)throw Error('QA does not describe this actual capture');
 if(!report.references||!Array.isArray(report.rows)||!report.rows.length)throw Error('Expected actual-capture references and at least one captured row');
 const references=Object.fromEntries(['left','right'].map(side=>[side,include(report.references[side])]));
 const pngNames=fs.readdirSync(captureDir,{withFileTypes:true}).filter(e=>e.isFile()&&e.name.toLowerCase().endsWith('.png')).map(e=>e.name).sort();
 const rows=report.rows.map((row,i)=>{
  const file=include(row.file),name=String(row.name||path.basename(row.file,'.json'));
  const command=row.command||{};const flex=Number(command.flexDeg??command.flex),twist=Number(command.twistDeg??command.twist);
  const images=Object.fromEntries(['left','right'].map(side=>[side,pngNames.filter(n=>n.startsWith(name+'-'+side+'-')).map(n=>({...include(n,'image/png'),view:n.slice((name+'-'+side+'-').length,-4)}))]));
  return {id:String(i),name,file,command:{flexDeg:Number.isFinite(flex)?flex:null,twistDeg:Number.isFinite(twist)?twist:null},
   classification:Number.isFinite(flex)&&Math.abs(flex)>60?'stress':'primary',repeatOf:row.repeatOf||command.repeatOf||null,images,
   qa:qa?Object.fromEntries(Object.entries(qa.rows.find(r=>r.name===name)?.sides||{}).map(([s,x])=>[s,{checks:x.checks,passed:Object.entries(x.checks).every(([k,v])=>v===true||(k==='repeatWithoutAccumulation'&&v===null)),selfIntersections:x.selfIntersection.properCount+x.selfIntersection.coplanarCount,minimumAreaRatio:x.qualityVsActualNeutral.minimumAreaRatio}])):null};
 });
 const overviewImages=pngNames.filter(n=>/^flex-0-twist-0-body(?:-.*)?\.png$/i.test(n)).map(n=>({...include(n,'image/png'),label:'中立位 · 整个人体接入（GPU 原材质）',appliesTo:'neutral-only'}));
 const manifest={format:'webxr-wrist-readonly-review@1',captureDirectory:captureDir,captureReport:{file:'report.json',...pin(reportFile)},
  captureFormat:report.format||null,gpu:report.gpu||null,mode:report.mode||null,references,rows,overviewImages,qa:qa?{file:path.resolve(qaPath),...pin(qaPath),summary:qa.summary}:null,
  reviewPolicy:{geometry:'Only positions/indices from the selected actual captured sample; no animation, interpolation, rebending or fabricated intermediate states.',
   material:'Three-dimensional view uses diagnostic materials and recomputed display normals only; original GPU PNGs are the appearance reference.',
   acceptance:'Neutral full-body GPU images are shown separately; they do not replace selected-pose images or certify whole-action acceptance.'}};
 const three=path.join(repo,'node_modules/three');
 for(const [url,relative]of [['/vendor/three.module.js','build/three.module.js'],['/vendor/OrbitControls.js','examples/jsm/controls/OrbitControls.js']]){
  const file=fs.realpathSync(path.join(three,relative));routes.set(url,{file,type:'text/javascript; charset=utf-8'});
 }
 fs.mkdirSync(reviewDir,{recursive:true});
 const index=path.join(reviewDir,'index.html'),manifestFile=path.join(reviewDir,'review-manifest.json');
 fs.writeFileSync(index,fs.readFileSync(path.join(here,'review.html')),{flag:'wx'});
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 routes.set('/',{file:index,type:'text/html; charset=utf-8'});routes.set('/index.html',routes.get('/'));
 routes.set('/review-manifest.json',{file:manifestFile,type:'application/json; charset=utf-8'});
 return {captureDir,reviewDir,manifest,routes};
}

export async function startReview(captureDirectory,reviewDirectory,{port=0,qaPath}={}){
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('Port must be an integer0..65535');
 const prepared=prepareReview(captureDirectory,reviewDirectory,{qaPath});
 const server=http.createServer((request,response)=>{
  const deny=(code,text)=>{response.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});response.end(text);};
  if(!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress))return deny(403,'Loopback only');
  const actual=server.address().port,hosts=new Set(['127.0.0.1:'+actual,'localhost:'+actual]);
  if(!hosts.has(request.headers.host))return deny(403,'Unexpected host');
  if(request.headers.origin&&!['http://127.0.0.1:'+actual,'http://localhost:'+actual].includes(request.headers.origin))return deny(403,'Unexpected origin');
  if(!['GET','HEAD'].includes(request.method))return deny(405,'Read-only: GET/HEAD only');
  let url;try{url=new URL(request.url,'http://127.0.0.1:'+actual);}catch{return deny(400,'Invalid URL');}
  const target=prepared.routes.get(url.pathname);if(!target)return deny(404,'Not in this capture review whitelist');
  try{
   const stat=fs.statSync(target.file);response.writeHead(200,{'Content-Type':target.type,'Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'"});
   if(request.method==='HEAD')return response.end();
   fs.createReadStream(target.file).on('error',()=>response.destroy()).pipe(response);
  }catch{return deny(404,'Capture file unavailable');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {...prepared,server,url:'http://127.0.0.1:'+server.address().port+'/'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [captureDir,reviewDir,portArg,qaPath]=process.argv.slice(2);
 if(!captureDir||!reviewDir)throw Error('Usage: node serve-review.mjs CAPTURE_DIR NEW_REVIEW_DIR [PORT] [QA_JSON]');
 const started=await startReview(captureDir,reviewDir,{port:portArg===undefined?0:Number(portArg),qaPath});
 console.log(JSON.stringify({url:started.url,captureDirectory:started.captureDir,reviewDirectory:started.reviewDir,poses:started.manifest.rows.length,readOnly:true,browserLaunched:false},null,2));
 const close=()=>started.server.close(()=>process.exit(0));process.once('SIGINT',close);process.once('SIGTERM',close);
}
