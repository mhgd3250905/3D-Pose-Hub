// Shoulder-axilla regression OFF / r1 / r2 + product-look A/B images. One command, no decisions:
//   node tools/joint-opt-r1/regress-r2.mjs --out <new-directory>
//   (interrupted: node tools/joint-opt-r1/regress-r2.mjs --resume <same-directory>)
// Everything (actions, frames, thresholds, modules, image plan) is fixed in regress-r2.plan.json.
// Measurement = stage-A shoulder metrics on CPU-skinned geometry read at the outermost scene.onAfterRender of the
// production recipe scene (loadRecipe/openScene/stageAt), ported to JS in regress-r2-measure.mjs.
// Per action and frame: base (no module), then r1 and r2 installed disabled ("off" must equal base exactly),
// r1 enabled, r2 enabled, both disabled again ("offAfter" must equal base). Region-outside displacement, rest-pose
// reproduction and detach are checked too. One JSON line per action is appended to actions.jsonl right after the
// action is measured (resume skips finished actions); regression.json / summary.txt are written at the end.
// Then render-ab-r1.mjs runs with render-ab-r2.plan.json + the 3 most-changed actions (out/render/).
// Read-only on the repo. Hidden sandbox flags: --only <a,b>, --no-render, --render-width <px>.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepare,measureFrame} from './regress-r2-measure.mjs';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const PLAN_FILE=path.join(HERE,'regress-r2.plan.json');
const sha=b=>createHash('sha256').update(b).digest('hex'),shaLf=f=>sha(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'));
const rel=f=>path.relative(ROOT,f).replaceAll('\\','/');
const fail=(ok,m)=>{if(!ok)throw Error(m);};
const USAGE='Usage: node tools/joint-opt-r1/regress-r2.mjs --out <new-directory>   |   --resume <existing-directory>';
const EXIT={ok:0,failedActions:2,interrupted:3,setup:1};

function parse(argv){const o={};for(let i=0;i<argv.length;i++){const k=argv[i];
    if(k==='--no-render'){o[k]=true;continue;}
    fail(['--out','--resume','--only','--render-width'].includes(k)&&argv[i+1]&&!argv[i+1].startsWith('--')&&!(k in o),USAGE);o[k]=argv[++i];}
  fail(!!o['--out']!==!!o['--resume'],USAGE);return o;}
function gitHead(){try{return {head:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),
  trackedChanges:execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:ROOT,encoding:'utf8'}).split('\n').filter(Boolean).length};}catch(e){return {head:null,trackedChanges:null,error:e.message};}}
async function reachable(url){try{return (await fetch(url+'/src/viewer.js')).ok;}catch{return false;}}
async function ensureServer(appUrl,out){ // same policy as render-ab-r1.mjs
  if(await reachable(appUrl))return {started:false,url:appUrl};
  const u=new URL(appUrl);fail(['127.0.0.1','localhost'].includes(u.hostname),'Dev server '+appUrl+' unreachable and not local');
  const vite=path.join(ROOT,'node_modules/vite/bin/vite.js');fail(fs.existsSync(vite),'Dev server not running and node_modules/vite missing: run `npm install`');
  const log=fs.openSync(path.join(out,'vite.log'),'a');
  const child=spawn(process.execPath,[vite,'--host',u.hostname,'--port',u.port||'80','--strictPort'],{cwd:ROOT,stdio:['ignore',log,log],windowsHide:true});
  let exited=null;child.on('exit',c=>{exited=c;});const t0=Date.now();
  while(!(await reachable(appUrl))){if(exited!==null)throw Error('Vite exited '+exited);if(Date.now()-t0>180000){try{process.kill(child.pid);}catch{}throw Error('Vite not ready in 180 s');}await new Promise(r=>setTimeout(r,500));}
  return {started:true,url:appUrl,pid:child.pid};
}

// ---- page capture (stage-A probe, unchanged semantics) ----
const PAGE_SETUP=()=>{
  const v=flareInspector.viewer,T=__toonT;
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const role=o=>{if(/^WebXR_(Clipped_Hand|Wrist_Bridge)_/.test(o.name))return 'body';let inCoach=false;for(let p=o;p;p=p.parent)if(p===v.coach)inCoach=true;return inCoach?'body':'prop';};
  const meshes=[];v.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position&&visible(o)&&!(o.material?.isShadowMaterial))meshes.push(o);});
  const bones=new Map();v.coach.traverse(o=>{if(o.isBone&&!bones.has(o.name))bones.set(o.name,o);});
  const P=o=>o.getWorldPosition(new T.Vector3());
  const joints=[];for(const [n,b] of bones){if(/^v2p_/.test(n))continue;if(b.parent&&b!==v.coach)joints.push(n);}
  const st={armed:null,result:null};
  // rest snapshot of every bone, taken right after openScene (motion.reset() alone does not undo every bone the
  // solver/hand installs touch after staging, which made the old rest-on check compare against a non-rest pose)
  const restBones=[];v.scene.traverse(o=>{if(o.isBone)restBones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
  function skinNormalMat(m,i,M){const si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight,bm=m.skeleton.boneMatrices,e=M.elements;e.fill(0);
    for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;const o=si.getComponent(i,k)*16;for(let j=0;j<16;j++)e[j]+=w*bm[o+j];}}
  function jpos(){const jp={};for(const n of joints)jp[n]=P(bones.get(n)).toArray();return jp;}
  function b64(f){const u=new Uint8Array(f.buffer,f.byteOffset,f.byteLength);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
  function geomDump(){const res=[];const p=new T.Vector3(),n=new T.Vector3(),M=new T.Matrix4(),S=new T.Matrix4(),N3=new T.Matrix3();
    for(const m of meshes){const g=m.geometry,cnt=g.attributes.position.count,pos=new Float32Array(cnt*3),nor=new Float32Array(cnt*3),na=g.attributes.normal;m.updateMatrixWorld(true);
      const nm=new T.Matrix3().getNormalMatrix(m.matrixWorld);
      if(m.isSkinnedMesh){m.skeleton.update();for(let i=0;i<cnt;i++){m.getVertexPosition(i,p).applyMatrix4(m.matrixWorld);pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;
          if(na){skinNormalMat(m,i,M);S.copy(m.bindMatrixInverse).multiply(M).multiply(m.bindMatrix);N3.setFromMatrix4(S);n.fromBufferAttribute(na,i).applyMatrix3(N3).applyMatrix3(nm).normalize();nor[i*3]=n.x;nor[i*3+1]=n.y;nor[i*3+2]=n.z;}}}
      else{for(let i=0;i<cnt;i++){p.fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld);pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;if(na){n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor[i*3]=n.x;nor[i*3+1]=n.y;nor[i*3+2]=n.z;}}}
      res.push({name:m.name||m.uuid.slice(0,8),pos:b64(pos),nor:b64(nor)});}
    return res;}
  const prevAfter=v.scene.onAfterRender;
  v.scene.onAfterRender=function(...a){prevAfter?.apply(this,a);if(!st.armed)return;st.armed=null;
    const mods={};for(const g of window.__regressR2Globals||[])mods[g]=window[g]?.last?JSON.parse(JSON.stringify(window[g].last)):null;
    st.result={pos:jpos(),geom:geomDump(),mods,restore:window.__webxrWristJoin?.lastRestoreCheck?{p:window.__webxrWristJoin.lastRestoreCheck.positionsNormalsExact,b:window.__webxrWristJoin.lastRestoreCheck.boneTransformsExact,c:window.__webxrWristJoin.lastRestoreCheck.cacheExact}:null};};
  window.__regressR2={capture(){st.result=null;st.armed=true;v.renderer.render(v.scene,v.camera);if(!st.result)throw Error('onAfterRender not reached');return st.result;},
    rest(){v.motion.reset();for(const [o,p,q,s] of restBones){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}v.scene.updateMatrixWorld(true);return this.capture();},
    topology(){return meshes.map(m=>{const g=m.geometry,idx=g.index?Array.from(g.index.array):null;let dom=null;
      if(m.isSkinnedMesh){const si=g.attributes.skinIndex,sw=g.attributes.skinWeight;dom=new Array(g.attributes.position.count);for(let i=0;i<dom.length;i++){let bw=-1,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}dom[i]=m.skeleton.bones[bi].name;}}
      return {name:m.name||m.uuid.slice(0,8),role:role(m),n:g.attributes.position.count,index:idx,drawRange:[g.drawRange.start,Number.isFinite(g.drawRange.count)?g.drawRange.count:null],domBone:dom};});},
    camera(){const c=v.camera;return {proj:c.projectionMatrix.elements.slice(),world:c.matrixWorld.elements.slice()};}};
  return {meshes:meshes.map(m=>m.name)};
};
const decodeGeom=r=>{const g={};for(const m of r.geom){const b=Buffer.from(m.pos,'base64'),c=Buffer.from(m.nor,'base64');
  g[m.name]={pos:new Float32Array(b.buffer,b.byteOffset,b.byteLength/4).slice(),nor:new Float32Array(c.buffer,c.byteOffset,c.byteLength/4).slice()};}return g;};
function maxDiff(a,b,skip){ // max |a-b| over positions and normals of every mesh; skip: {meshName:Set(vertex)} excluded
  let d=0;for(const n of Object.keys(b)){fail(a[n],'mesh missing '+n);const S=skip?.[n];
    for(const k of ['pos','nor']){const x=a[n][k],y=b[n][k];fail(x.length===y.length,'length mismatch '+n);for(let i=0;i<x.length;i++){if(S&&S.has((i/3)|0))continue;const e=Math.abs(x[i]-y[i]);if(e>d||e!==e)d=e!==e?Infinity:e;}}}
  return d;}

const AREA=['flagVisibleAreaMm2','invFoldVisibleAreaMm2','shadeDevVisibleAreaMm2'];
function summarize(plan,lines){
  const W=plan.worseRule,variants=['off','r1','r2'];
  const acts=lines.filter(l=>!l.error);
  const issueActs=Object.fromEntries(variants.map(v=>[v,acts.filter(a=>a.frames.some(f=>['left','right'].some(s=>f.sides[s][v].issue))).map(a=>a.id)]));
  const issueSides=Object.fromEntries(variants.map(v=>[v,{left:acts.filter(a=>a.frames.some(f=>f.sides.left[v].issue)).length,right:acts.filter(a=>a.frames.some(f=>f.sides.right[v].issue)).length}]));
  const issueFrameSides=Object.fromEntries(variants.map(v=>[v,acts.reduce((n,a)=>n+a.frames.reduce((m,f)=>m+['left','right'].filter(s=>f.sides[s][v].issue).length,0),0)]));
  const worse={r1:[],r2:[],r2VsR1:[]};
  for(const a of acts)for(const f of a.frames)for(const s of ['left','right'])for(const k of AREA){
    const x=f.sides[s];
    for(const [key,from,to] of [['r1','off','r1'],['r2','off','r2'],['r2VsR1','r1','r2']]){const p=x[from][k],q=x[to][k];if(q>p*(1+W.relative)&&q-p>W.absoluteMm2)worse[key].push({action:a.id,t:f.t,side:s,metric:k,from:p,to:q});}}
  const total=v=>acts.reduce((n,a)=>n+a.frames.reduce((m,f)=>m+f.sides.left[v].flagVisibleAreaMm2+f.sides.right[v].flagVisibleAreaMm2,0),0);
  const change=acts.map(a=>{let best=null;let tot=0;for(const f of a.frames)for(const s of ['left','right']){const d=f.sides[s].off.flagVisibleAreaMm2-f.sides[s].r2.flagVisibleAreaMm2;tot+=Math.abs(d);if(!best||Math.abs(d)>Math.abs(best.d))best={t:f.t,side:s,d};}return {id:a.id,absChangeMm2:+tot.toFixed(1),worst:best};}).sort((x,y)=>y.absChangeMm2-x.absChangeMm2);
  const checks={offVsBaseMax:Math.max(0,...acts.map(a=>a.checks.offVsBaseMax)),offAfterVsBaseMax:Math.max(0,...acts.map(a=>a.checks.offAfterVsBaseMax)),
    outsideRegionMax:{r1:Math.max(0,...acts.map(a=>a.checks.outsideRegionMax.r1)),r2:Math.max(0,...acts.map(a=>a.checks.outsideRegionMax.r2))},
    restOnVsRestMax:{r1:Math.max(0,...acts.map(a=>a.checks.restOnVsRestMax.r1)),r2:Math.max(0,...acts.map(a=>a.checks.restOnVsRestMax.r2))},
    restResetDriftMax:Math.max(0,...acts.map(a=>a.checks.restOffVsRestMax??0)),
    detachVsBaseMax:Math.max(0,...acts.map(a=>a.checks.detachVsBaseMax)),pageErrors:acts.reduce((n,a)=>n+a.pageErrors,0)};
  return {actionsMeasured:acts.length,actionsFailed:lines.filter(l=>l.error).map(l=>({id:l.id,error:l.error})),framesMeasured:acts.reduce((n,a)=>n+a.frames.length,0),
    issueActions:Object.fromEntries(variants.map(v=>[v,issueActs[v].length])),issueActionIds:issueActs,issueSides,issueFrameSides,
    visibleFlaggedAreaTotalMm2:Object.fromEntries(variants.map(v=>[v,+total(v).toFixed(1)])),
    shadeDevVisibleAreaTotalMm2:Object.fromEntries(variants.map(v=>[v,+acts.reduce((n,a)=>n+a.frames.reduce((m,f)=>m+f.sides.left[v].shadeDevVisibleAreaMm2+f.sides.right[v].shadeDevVisibleAreaMm2,0),0).toFixed(1)])),worse,largestChangeOffToR2:change.slice(0,10),checks};
}

async function main(){
  const args=parse(process.argv.slice(2));const resume=!!args['--resume'];
  const out=path.resolve(args['--out']||args['--resume']);
  if(resume)fail(fs.existsSync(path.join(out,'regress-state.json')),'--resume: '+out+' has no regress-state.json');
  else fail(!fs.existsSync(out),'Output exists: '+out+' (use a new directory, or --resume to continue an interrupted run)');
  process.chdir(ROOT);
  const plan=JSON.parse(fs.readFileSync(PLAN_FILE,'utf8'));fail(plan.format==='pose-hub-shoulder-axilla-regress-plan@1','Bad plan format');
  let only=args['--only']?args['--only'].split(','):null;
  if(resume&&!only){const st0=JSON.parse(fs.readFileSync(path.join(out,'regress-state.json'),'utf8'));if(st0.only)only=st0.only;} // a resumed test run keeps its action subset
  if(only)fail(only.every(a=>plan.actions.some(x=>x.id===a)),'--only names an action not in the plan');
  const actions=plan.actions.filter(a=>!only||only.includes(a.id));
  const git=gitHead();
  const sources=Object.fromEntries([SELF,PLAN_FILE,path.join(HERE,'regress-r2-measure.mjs'),path.join(HERE,'render-ab-r1.mjs'),path.join(ROOT,plan.render.plan),...Object.values(plan.variants).map(v=>path.join(ROOT,v.module))].map(f=>[rel(f),shaLf(f)]));
  if(resume){const st=JSON.parse(fs.readFileSync(path.join(out,'regress-state.json'),'utf8'));
    fail(st.git.head===git.head,'--resume: HEAD changed ('+st.git.head+' -> '+git.head+'); start a new --out');
    fail(JSON.stringify(st.sources)===JSON.stringify(sources),'--resume: sources changed; start a new --out');}
  else{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'regress-state.json'),JSON.stringify({format:'pose-hub-shoulder-axilla-regress-state@1',started:new Date().toISOString(),git,sources,testMode:!!(only||args['--no-render']||args['--render-width']),only},null,2));}
  const log=m=>{const s=new Date().toISOString()+' '+m;console.log(s);fs.appendFileSync(path.join(out,'progress.log'),s+'\n');};
  const JL=path.join(out,'actions.jsonl');
  const readLines=()=>fs.existsSync(JL)?fs.readFileSync(JL,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean):[];
  const done=new Set(readLines().filter(l=>!l.error).map(l=>l.id));
  const {loadRecipe,openScene,stageAt,freeGiB}=await import(pathToFileURL(path.join(ROOT,'tools/action-package-v3/recipe-scene.mjs')).href);
  const {config,loadTheme}=await import(pathToFileURL(path.join(ROOT,'drill-anim/lib/config.mjs')).href);
  const mods=Object.fromEntries(await Promise.all(Object.entries(plan.variants).map(async([k,v])=>[k,{...v,mod:await import(pathToFileURL(path.join(ROOT,v.module)).href)}])));
  const cfg=config(),theme=loadTheme(),T=plan.thresholds;
  const work=cfg.work_dir,lock=path.join(work,'package-v3-render.lock');
  for(const n of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock','package-v3-render.lock'])
    fail(!fs.existsSync(path.join(work,n)),'Active rendering lock: '+path.join(work,n)+' (another render is running, or a crashed one left it)');
  fs.mkdirSync(work,{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out,entry:rel(SELF)}),{flag:'wx'});
  let server=null;const stopServer=()=>{if(server?.started&&server.pid){try{process.kill(server.pid);}catch{}server.started=false;}};
  let interrupted=false;
  process.on('SIGINT',()=>{interrupted=true;stopServer();try{fs.unlinkSync(lock);}catch{}process.exit(EXIT.interrupted);});
  try{
    server=await ensureServer(cfg.app_url,out);log('server '+server.url+(server.started?' started pid '+server.pid:' reused'));
    for(const a of actions){
      if(done.has(a.id)){log('skip '+a.id+' (done)');continue;}
      if(freeGiB()<1.25){log('low free memory '+freeGiB().toFixed(2)+' GiB: stop (resume later)');interrupted=true;break;}
      const t0=Date.now();let browser;const report={pageErrors:[]};
      try{
        const loaded=await loadRecipe(path.join(ROOT,plan.recipesDir,a.id+'.json'));
        const sc=await openScene(loaded,{size:plan.probeSize,theme,report});browser=sc.browser;const page=sc.page;
        await page.evaluate(g=>{window.__regressR2Globals=g;},Object.values(plan.variants).map(v=>v.global));
        await page.evaluate(PAGE_SETUP);
        const topo=await page.evaluate(()=>__regressR2.topology());
        const rest=await page.evaluate(()=>__regressR2.rest());const restG=decodeGeom(rest);
        const st=prepare(topo,restG,rest.pos);
        const times=[...a.t].sort((x,y)=>x-y),src=loaded.source,base={};let warm=null;
        for(const t of times){const s=await stageAt(page,src,t,warm);warm=s.x;const r=await page.evaluate(()=>__regressR2.capture());base[t]={g:decodeGeom(r),pos:r.pos,camera:s.camera,restore:r.restore};}
        const modCfg={};for(const [k,v] of Object.entries(mods))modCfg[k]=await v.mod.install(page,{enabled:false});
        const region=await page.evaluate(gs=>Object.fromEntries(gs.map(([k,g])=>[k,{mesh:window[g].config.mesh,ids:Object.values(window[g].vertexIds()).flat()}])),Object.entries(plan.variants).map(([k,v])=>[k,v.global]));
        const setEn=(g,on)=>page.evaluate(([g,on])=>{window[g].enabled=on;},[g,on]);
        const checks={offVsBaseMax:0,offAfterVsBaseMax:0,outsideRegionMax:{},restOnVsRestMax:{},detachVsBaseMax:null,webxrRestore:[]};
        // rest checks: restOffVsRestMax = framework drift (rest after staging vs initial rest, modules off);
        // restOnVsRestMax = module on vs module off at the SAME rest capture (the module's own effect at rest; must be 0)
        checks.restOffVsRestMax=maxDiff(decodeGeom(await page.evaluate(()=>__regressR2.rest())),restG);
        for(const [k,v] of Object.entries(mods)){const restOff=decodeGeom(await page.evaluate(()=>__regressR2.rest()));await setEn(v.global,true);checks.restOnVsRestMax[k]=maxDiff(decodeGeom(await page.evaluate(()=>__regressR2.rest())),restOff);await setEn(v.global,false);checks.outsideRegionMax[k]=0;}
        const proj=(await page.evaluate(()=>__regressR2.camera())).proj;
        const frames=[];warm=null;
        for(const t of times){const s=await stageAt(page,src,t,warm);warm=s.x;const B=base[t];
          const off=await page.evaluate(()=>__regressR2.capture());checks.offVsBaseMax=Math.max(checks.offVsBaseMax,maxDiff(decodeGeom(off),B.g));
          const res={},diag={};
          for(const [k,v] of Object.entries(mods)){await setEn(v.global,true);const r=await page.evaluate(()=>__regressR2.capture());await setEn(v.global,false);
            const g=decodeGeom(r);diag[k]=r.mods[v.global];checks.webxrRestore.push(r.restore);
            checks.outsideRegionMax[k]=Math.max(checks.outsideRegionMax[k],maxDiff(g,B.g,{[region[k].mesh]:new Set(region[k].ids)}));res[k]=g;}
          const offb=await page.evaluate(()=>__regressR2.capture());checks.offAfterVsBaseMax=Math.max(checks.offAfterVsBaseMax,maxDiff(decodeGeom(offb),B.g));
          const m={off:measureFrame(st,B.g,B.pos,B.camera,proj,T)};for(const k of Object.keys(mods))m[k]=measureFrame(st,res[k],B.pos,B.camera,proj,T);
          const sides={};for(const side of ['left','right'])sides[side]=Object.fromEntries(Object.entries(m).map(([k,x])=>[k,x[side]]));
          frames.push({t,frame:Math.round(t*(loaded.prepared.recipe.output?.fps??30)),warn:s.warn,sides,modules:diag});}
        // detach both (last installed first) and re-capture the last frame: must equal base
        for(const k of Object.keys(mods).reverse())await page.evaluate(g=>window[g].detach(),mods[k].global);
        {let w=null;for(const t of times){const s=await stageAt(page,src,t,w);w=s.x;} // same warm-start chain as the base pass
          const t=times[times.length-1];checks.detachVsBaseMax=maxDiff(decodeGeom(await page.evaluate(()=>__regressR2.capture())),base[t].g);}
        const line={id:a.id,group:a.group,t:times,frames,checks,modules:Object.fromEntries(Object.entries(modCfg).map(([k,c])=>[k,{version:c.version,sides:c.sides,restReproductionErrorMm:c.restReproductionErrorMm,restNormalDeviation:c.restNormalDeviation??null,symmetry:c.symmetry??null}])),
          pageErrors:report.pageErrors.length,pageErrorText:report.pageErrors.slice(0,5),sec:+((Date.now()-t0)/1000).toFixed(1)};
        fs.appendFileSync(JL,JSON.stringify(line)+'\n');
        const brief=v=>frames.map(f=>['left','right'].map(s=>f.sides[s][v].flagVisible+'/'+Math.round(f.sides[s][v].flagVisibleAreaMm2)+'~'+Math.round(f.sides[s][v].shadeDevVisibleAreaMm2)).join(' ')).join(' | ');
        log(`ok ${a.id} ${line.sec}s off[${brief('off')}] r1[${brief('r1')}] r2[${brief('r2')}] offEq=${checks.offVsBaseMax} outside=${JSON.stringify(checks.outsideRegionMax)}`);
      }catch(e){fs.appendFileSync(JL,JSON.stringify({id:a.id,error:String(e.message||e).slice(0,1500)})+'\n');log('FAIL '+a.id+': '+String(e.message||e).slice(0,300));}
      finally{if(browser)await browser.close().catch(()=>{});}
    }
  }finally{stopServer();try{fs.unlinkSync(lock);}catch{}}
  const lines=readLines();const latest=new Map();for(const l of lines)if(!latest.has(l.id)||!l.error)latest.set(l.id,l);
  const planned=actions.map(a=>latest.get(a.id)).filter(Boolean);
  const summary=summarize(plan,planned);
  const complete=!interrupted&&actions.every(a=>latest.get(a.id)&&!latest.get(a.id).error);
  const reg={format:'pose-hub-shoulder-axilla-regression@1',finished:new Date().toISOString(),complete,git,sources,thresholds:T,worseRule:plan.worseRule,
    actionsPlanned:actions.length,...summary,perAction:planned.map(l=>l.error?{id:l.id,error:l.error}:{id:l.id,group:l.group,
      frames:l.frames.map(f=>({t:f.t,sides:Object.fromEntries(['left','right'].map(s=>[s,Object.fromEntries(['off','r1','r2'].map(v=>[v,{n:f.sides[s][v].flagVisible,mm2:f.sides[s][v].flagVisibleAreaMm2,invFoldMm2:f.sides[s][v].invFoldVisibleAreaMm2,shadeDevN:f.sides[s][v].shadeDevVisible,shadeDevMm2:f.sides[s][v].shadeDevVisibleAreaMm2,issue:f.sides[s][v].issue,elev:f.sides[s][v].elevDeg}]))]))}))})};
  fs.writeFileSync(path.join(out,'regression.json'),JSON.stringify(reg,null,1)+'\n');
  const S=summary,txt=[`shoulder-axilla regression OFF / r1 / r2   HEAD ${git.head}`,`actions ${S.actionsMeasured}/${actions.length} measured, frames ${S.framesMeasured}, failed ${S.actionsFailed.length}`,
    `issue actions  OFF ${S.issueActions.off}  r1 ${S.issueActions.r1}  r2 ${S.issueActions.r2}`,
    `issue sides (actions)  OFF L${S.issueSides.off.left}/R${S.issueSides.off.right}  r1 L${S.issueSides.r1.left}/R${S.issueSides.r1.right}  r2 L${S.issueSides.r2.left}/R${S.issueSides.r2.right}`,
    `visible flagged area total mm2  OFF ${S.visibleFlaggedAreaTotalMm2.off}  r1 ${S.visibleFlaggedAreaTotalMm2.r1}  r2 ${S.visibleFlaggedAreaTotalMm2.r2}`,
    `supplementary shading-normal deviation >45 deg, visible area total mm2  OFF ${S.shadeDevVisibleAreaTotalMm2.off}  r1 ${S.shadeDevVisibleAreaTotalMm2.r1}  r2 ${S.shadeDevVisibleAreaTotalMm2.r2}`,
    `worse vs OFF (>50% and >50 mm2): r1 ${S.worse.r1.length}  r2 ${S.worse.r2.length}`,...S.worse.r2.map(w=>`  r2 worse: ${w.action} t=${w.t} ${w.side} ${w.metric} ${w.from} -> ${w.to}`),
    `checks: off==base ${S.checks.offVsBaseMax}  offAfter==base ${S.checks.offAfterVsBaseMax}  outside region r1 ${S.checks.outsideRegionMax.r1} r2 ${S.checks.outsideRegionMax.r2}  rest on r1 ${S.checks.restOnVsRestMax.r1} r2 ${S.checks.restOnVsRestMax.r2} (vs rest with module off)  rest framework drift ${S.checks.restResetDriftMax}  detach ${S.checks.detachVsBaseMax}  pageErrors ${S.checks.pageErrors}`].join('\n');
  fs.writeFileSync(path.join(out,'summary.txt'),txt+'\n');log('measurement '+(complete?'complete':'INCOMPLETE'));
  // ---- images: render plan + top changed actions ----
  let render={skipped:true};
  if(complete&&!args['--no-render']){
    const rp=JSON.parse(fs.readFileSync(path.join(ROOT,plan.render.plan),'utf8'));const have=new Set(rp.entries.map(e=>e.action));
    const extra=S.largestChangeOffToR2.filter(c=>!have.has(c.id)&&c.worst&&c.absChangeMm2>0).slice(0,plan.render.addTopChanged);
    for(const c of extra)rp.entries.push({action:c.id,group:'regression-top-change',t:c.worst.t,sides:['right','left'],closeupView:'stageB',why:`largest OFF->r2 change ${c.absChangeMm2} mm2`});
    const derived=path.join(out,'render-plan.json');fs.writeFileSync(derived,JSON.stringify(rp,null,1)+'\n');
    const rdir=path.join(out,'render');
    if(fs.existsSync(path.join(rdir,'ab-log.json'))){const l=JSON.parse(fs.readFileSync(path.join(rdir,'ab-log.json'),'utf8'));if(l.finished&&!l.failures.length)render={skipped:false,reused:true,ok:true};}
    if(!render.reused){
      if(fs.existsSync(rdir)){let k=1;while(fs.existsSync(rdir+'-attempt'+k))k++;fs.renameSync(rdir,rdir+'-attempt'+k);}
      const ra=[path.join(HERE,'render-ab-r1.mjs'),'--plan',derived,'--out',rdir];if(args['--render-width'])ra.push('--width',args['--render-width']);
      if(only){const sel=rp.entries.map(e=>e.action).filter(x=>only.includes(x));if(sel.length)ra.push('--only',[...new Set(sel)].join(','));} // sandbox test subset
      log('render: node '+ra.map(x=>rel(x).startsWith('..')?x:rel(x)).join(' '));
      const r=spawnSync(process.execPath,ra,{cwd:ROOT,stdio:['ignore','inherit','inherit']});render={skipped:false,exitCode:r.status,ok:r.status===0,extra:extra.map(c=>c.id)};}
  }
  reg.render=render;fs.writeFileSync(path.join(out,'regression.json'),JSON.stringify(reg,null,1)+'\n');
  const final={ok:complete&&(render.skipped||render.ok)&&!S.actionsFailed.length,complete,actions:S.actionsMeasured,failed:S.actionsFailed.map(f=>f.id),
    issueActions:S.issueActions,worse:{r1:S.worse.r1.length,r2:S.worse.r2.length},offEqualsBase:S.checks.offVsBaseMax===0&&S.checks.offAfterVsBaseMax===0,
    outsideRegionMax:S.checks.outsideRegionMax,render,out,head:git.head};
  console.log(JSON.stringify(final));
  process.exitCode=!complete?EXIT.interrupted:(S.actionsFailed.length||(!render.skipped&&!render.ok))?EXIT.failedActions:EXIT.ok;
}
main().catch(e=>{console.log(JSON.stringify({ok:false,error:String(e.message||e)}));console.error(e.stack||e);process.exitCode=EXIT.setup;});
