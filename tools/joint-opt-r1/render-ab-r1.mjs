// shoulder-axilla-r1 product-look A/B renderer (joint-opt r1). One command, no decisions:
//   node tools/joint-opt-r1/render-ab-r1.mjs --out <new-directory>
// Everything (actions, times, sides, cameras, size, layer, skin) is fixed in render-ab-r1.plan.json.
// Pipeline = the product one: approved-look checks (same as tools/preview-current-model.mjs), current skin
// pointer checks (same as tools/preview-current-skins.mjs), recipe scene + the skin pointer's install()
// (pkg layers, pump highlight, body polish, head smooth, eye-socket soften, skin coverage), realistic skin,
// body-highlight layer on the dark theme background. shoulder-axilla-r1 is installed disabled; every camera
// renders the same staged pose off, then on. Read-only on the repo: writes only into --out (and the usual
// render lock in config work_dir). Exit code 0 only when every image was written without page errors.
// Hidden test flags (sandbox only, never needed locally): --width <px>, --only <action,action>.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),ROOT=path.resolve(HERE,'../..');
const PLAN_FILE=path.join(HERE,'render-ab-r1.plan.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
const shaLf=f=>sha(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'));
const rel=f=>path.relative(ROOT,f).replaceAll('\\','/');
const inside=r=>{const f=path.resolve(ROOT,r),x=path.relative(ROOT,f);if(x.startsWith('..')||path.isAbsolute(x))throw Error('Path outside checkout: '+r);return f;};
const fail=(ok,m)=>{if(!ok)throw Error(m);};
const USAGE='Usage: node tools/joint-opt-r1/render-ab-r1.mjs --out <new-directory>';

function parse(argv){
  const o={};
  for(let i=0;i<argv.length;i+=2){
    const k=argv[i],val=argv[i+1];
    fail(['--out','--width','--only'].includes(k)&&val&&!val.startsWith('--')&&!(k in o),USAGE);
    o[k]=val;
  }
  fail(o['--out'],USAGE);
  if(o['--width']!==undefined)fail(/^\d+$/.test(o['--width'])&&+o['--width']>=96&&+o['--width']<=2160,'--width must be an integer 96..2160');
  return o;
}

function gitHead(){
  try{
    const head=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
    const branch=execFileSync('git',['rev-parse','--abbrev-ref','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
    const dirty=execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:ROOT,encoding:'utf8'}).split('\n').filter(Boolean).length;
    return {head,branch,trackedChanges:dirty};
  }catch(e){return {head:null,branch:null,trackedChanges:null,error:'git unavailable: '+e.message};}
}

// ---- preflight: identical checks to preview-current-model.mjs + preview-current-skins.mjs ----
async function preflight(plan,recipeFiles){
  const {readApproved,checkRecipe}=await import(pathToFileURL(path.join(ROOT,'tools/preview-current-model.mjs')).href);
  const {pointer,approved}=readApproved(ROOT);
  const recipes={};
  for(const [id,file] of Object.entries(recipeFiles)){
    fail(fs.existsSync(file),'Missing recipe '+rel(file));
    const state=await checkRecipe(file);
    recipes[id]={file:rel(file),sha256:sha(fs.readFileSync(file)),model:state.version.model,hands:state.version.hands,spec:state.version.spec};
  }
  // approved previewEntry layer verifier (the eye-socket preview runs it before rendering)
  const entry=inside(approved.previewEntry),entryVerify=path.join(path.dirname(entry),'verify.mjs');
  fail(fs.existsSync(entry)&&fs.existsSync(entryVerify),'Approved previewEntry or its verify.mjs missing');
  await (await import(pathToFileURL(entryVerify).href)).verify();
  // current skin pointer
  const sp=JSON.parse(fs.readFileSync(inside('drill-anim/models/current-skin-coverage.json'),'utf8'));
  const manifestFile=inside(sp.manifest);
  fail(fs.existsSync(manifestFile),'Stale checkout: current skin repair sources missing; use the documented model worktree. Never fall back to old skins.');
  fail(shaLf(manifestFile)===sp.sha256Lf,'Skin repair manifest changed; create a new version');
  const {verify}=await import(pathToFileURL(inside(sp.verifyEntry)).href);
  const {manifest}=verify();
  fail(sp.id===manifest.id&&sp.version===manifest.version,'Skin repair identity mismatch');
  fail(sp.approvedLookUnchanged===approved.id&&manifest.approvedBase===approved.id,'Skin pointer is not based on the current approved look');
  const install=path.join(path.dirname(inside(manifest.productionEntry)),'install.mjs');
  fail(Object.keys(manifest.sources).includes(rel(install)),'Skin install entry is not pinned by the skin manifest');
  const skinId=approved.skin;fail(manifest.skins.includes(skinId),'Approved skin not in skin manifest');
  const moduleFile=inside(plan.module);
  return {
    approvedPointer:{id:pointer.id,sha256Lf:pointer.sha256Lf,record:pointer.record},
    skinPointer:{id:sp.id,version:sp.version,sha256Lf:sp.sha256Lf,manifest:sp.manifest,visualApproval:sp.visualApproval??null},
    approved:{id:approved.id,sourceCommit:approved.sourceCommit,baseModel:approved.baseModel,previewEntry:approved.previewEntry,skin:skinId},
    installEntry:install,skinId,recipes,
    module:{file:rel(moduleFile),sha256Lf:shaLf(moduleFile)},
    renderer:{file:rel(SELF),sha256Lf:shaLf(SELF),plan:rel(PLAN_FILE),planSha256Lf:shaLf(PLAN_FILE)},
  };
}

// ---- dev server: reuse a running one, otherwise start the repo's Vite and stop it (by PID) at the end ----
async function reachable(url){try{const r=await fetch(url+'/src/viewer.js');return r.ok;}catch{return false;}}
async function ensureServer(appUrl,out){
  if(await reachable(appUrl))return {started:false,url:appUrl};
  const u=new URL(appUrl);
  fail(['127.0.0.1','localhost'].includes(u.hostname),'Dev server '+appUrl+' unreachable and not local; start it first');
  const vite=path.join(ROOT,'node_modules/vite/bin/vite.js');
  fail(fs.existsSync(vite),'Dev server not running and node_modules/vite missing: run `npm install` in the repo root');
  const log=fs.openSync(path.join(out,'vite.log'),'a');
  const child=spawn(process.execPath,[vite,'--host',u.hostname,'--port',u.port||'80','--strictPort'],{cwd:ROOT,stdio:['ignore',log,log],windowsHide:true});
  let exited=null;child.on('exit',c=>{exited=c;});
  const t0=Date.now();
  while(!(await reachable(appUrl))){
    if(exited!==null)throw Error('Vite exited with code '+exited+' (see vite.log; is port '+u.port+' in use?)');
    if(Date.now()-t0>180000){try{process.kill(child.pid);}catch{}throw Error('Vite did not become ready in 180 s');}
    await new Promise(r=>setTimeout(r,500));
  }
  return {started:true,url:appUrl,pid:child.pid,child};
}

// ---- in-page helpers ----
const PAGE_HELPERS=()=>{
  const v=flareInspector.viewer,T=__toonT;
  const named=n=>{let r=null;v.coach.traverse(x=>{if(x.isBone&&x.name===n&&!r)r=x;});if(!r)throw Error('missing bone '+n);return r;};
  const B={neck:named('neck'),pelvis:named('pelvis'),left:[named('leftUpperArm'),named('leftForearm')],right:[named('rightUpperArm'),named('rightForearm')]};
  const P=b=>b.getWorldPosition(new T.Vector3());
  const ss=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
  function elevation(side){const d=P(B.pelvis).sub(P(B.neck)),u=P(B[side][1]).sub(P(B[side][0]));return d.angleTo(u)*180/Math.PI;}
  function joints(){
    v.coach.updateMatrixWorld(true);const cfg=window.__shoulderAxillaR1.config,o={};
    for(const s of ['left','right']){const e=elevation(s);o[s]={elevationDeg:e,gate:ss((e-cfg.elevStartDeg)/(cfg.elevFullDeg-cfg.elevStartDeg)),joint:P(B[s][0]).toArray()};}
    return o;
  }
  // close-up camera for one side, computed from the joint world position
  function closeup(side,mode,c){
    v.coach.updateMatrixWorld(true);
    const j=P(B[side][0]),up=P(B.neck).sub(P(B.pelvis)).normalize();
    const R=P(B.right[0]).sub(P(B.left[0]));R.addScaledVector(up,-R.dot(up)).normalize();
    const lateral=side==='right'?R.clone():R.clone().negate();
    const forward=new T.Vector3().crossVectors(up,R).normalize();
    // aim point = centroid of the module's axilla region vertices (current skinned pose, module off)
    const A=window.__shoulderAxillaR1;let mesh=null;v.scene.traverse(x=>{if(x.isSkinnedMesh&&x.name===A.config.mesh&&!mesh)mesh=x;});
    if(!mesh)throw Error('axilla mesh not found');mesh.skeleton.update();mesh.updateMatrixWorld(true);
    const ids=A.vertexIds()[side],q=new T.Vector3(),target=new T.Vector3();
    for(const i of ids)target.add(mesh.getVertexPosition(i,q).applyMatrix4(mesh.matrixWorld));target.divideScalar(ids.length);
    const into=target.clone().sub(j);const intoLen=into.length();into.normalize();
    const outward=forward.clone().add(lateral).normalize();
    const axilla=forward.clone().multiplyScalar(c.axillaDir.forward).addScaledVector(lateral,c.axillaDir.lateral).addScaledVector(up,c.axillaDir.up).addScaledVector(into,c.axillaDir.jointToRegion).normalize();
    let dir,used=mode,fallback=null;
    if(mode==='stageB'){
      const cam=v.camera.getWorldPosition(new T.Vector3());dir=cam.sub(target).normalize();
      if(dir.dot(outward)<0.1){dir=axilla;used='axilla';fallback='production direction faces the axilla from behind (dot '+dir.dot(outward).toFixed(2)+')';}
    }else if(mode==='axilla')dir=axilla;
    else throw Error('Unknown closeupView '+mode);
    const fov=2*Math.atan(c.halfHeightM/c.distanceM)*180/Math.PI;
    return {target:target.toArray(),position:target.clone().addScaledVector(dir,c.distanceM).toArray(),up:up.toArray(),fov,near:Math.max(0.01,c.distanceM-c.clipFrontM),far:c.distanceM+3,used,fallback,regionVertices:ids.length,regionCentroidFromJointMm:+(intoLen*1e3).toFixed(1),viewDotForward:dir.dot(forward),viewDotLateral:dir.dot(lateral)};
  }
  // render one layer; optional camera override (restored afterwards)
  function shot({enabled,camera,layers,skin}){
    const A=window.__shoulderAxillaR1,c=v.camera,saved={m:c.matrixWorld.clone(),fov:c.fov,near:c.near,far:c.far,up:c.up.clone()};
    A.enabled=enabled;A.last=null;
    let images;
    try{
      if(camera){c.fov=camera.fov;c.near=camera.near;c.far=camera.far;c.up.fromArray(camera.up);c.position.fromArray(camera.position);c.lookAt(new T.Vector3().fromArray(camera.target));c.updateProjectionMatrix();c.updateMatrixWorld();}
      images=__pkgLayers.render(layers,[skin]);
    }finally{
      A.enabled=false;c.fov=saved.fov;c.near=saved.near;c.far=saved.far;c.up.copy(saved.up);saved.m.decompose(c.position,c.quaternion,c.scale);c.updateProjectionMatrix();c.updateMatrixWorld();
    }
    const last=A.last?JSON.parse(JSON.stringify(A.last)):null;
    const errors=[...(window.__pkgPumpErr||[]),...(window.__eyeSocketSoften?.errors||[])];
    return {uris:Object.fromEntries(layers.map(l=>[l,images[skin.id+'/'+l]])),last,errors,contextLost:v.renderer.getContext().isContextLost()};
  }
  window.__abR1={joints,closeup,shot};
  return true;
};

// composite straight-alpha PNG onto the theme background; return PNG + body coverage
const COMPOSITE=async ([uri,bg])=>{
  const img=new Image();img.src=uri;await img.decode();
  const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const g=cv.getContext('2d');
  g.drawImage(img,0,0);const a=g.getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<a.length;i+=4)if(a[i]>127)n++;
  g.globalCompositeOperation='destination-over';g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);
  return {png:cv.toDataURL('image/png'),coverage:n/(cv.width*cv.height),w:cv.width,h:cv.height};
};

// side-by-side sheet: one row per (t, camera); title fitted to the row width (shrink, then wrap)
const SHEET=async ({title,rows,quality,bg})=>{
  const load=async u=>{const i=new Image();i.src=u;await i.decode();return i;};
  const imgs=[];for(const r of rows)imgs.push([await load(r.off),await load(r.on)]);
  const W=imgs[0][0].width,H=imgs[0][0].height,gap=Math.max(4,Math.round(W/60)),width=2*W+3*gap;
  const base=Math.max(9,Math.round(W/26));
  const ctx=document.createElement('canvas').getContext('2d');
  const fit=(text,size,maxW,weight='')=>{let s=size;for(;s>8;s--){ctx.font=`${weight} ${s}px sans-serif`;if(ctx.measureText(text).width<=maxW)return {lines:[text],size:s};}
    ctx.font=`${weight} 8px sans-serif`;const words=text.split(' '),lines=[];let cur='';
    for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width<=maxW||!cur)cur=t;else{lines.push(cur);cur=w;}}if(cur)lines.push(cur);
    return {lines:lines.map(l=>{let x=l;while(x.length>1&&ctx.measureText(x).width>maxW)x=x.slice(0,-2)+'…';return x;}),size:8};};
  const head=fit(title,Math.round(base*1.25),width-2*gap,'bold');
  const labs=rows.map(r=>fit(r.label,base,width-2*gap));
  const tag=fit('OFF',base,W-2*gap,'bold');
  const lh=s=>Math.round(s*1.35);
  let height=gap+head.lines.length*lh(head.size)+gap;
  for(const l of labs)height+=l.lines.length*lh(l.size)+gap+H+gap;
  const cv=document.createElement('canvas');cv.width=width;cv.height=height;const g=cv.getContext('2d');
  g.fillStyle='#1b1b20';g.fillRect(0,0,width,height);g.textBaseline='top';
  let y=gap;g.fillStyle='#ffffff';g.font=`bold ${head.size}px sans-serif`;for(const l of head.lines){g.fillText(l,gap,y);y+=lh(head.size);}y+=gap;
  rows.forEach((r,k)=>{
    const l=labs[k];g.fillStyle='#d8d8e0';g.font=`${l.size}px sans-serif`;for(const s of l.lines){g.fillText(s,gap,y);y+=lh(l.size);}y+=gap;
    imgs[k].forEach((im,j)=>{const x=gap+j*(W+gap);g.fillStyle=bg;g.fillRect(x,y,W,H);g.drawImage(im,x,y);
      g.font=`bold ${tag.size}px sans-serif`;const t=j?'ON':'OFF',tw=g.measureText(t).width;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x+gap/2,y+gap/2,tw+gap,lh(tag.size)+gap/2);
      g.fillStyle=j?'#7fe08a':'#ff9a8a';g.fillText(t,x+gap,y+gap*.75);});
    y+=H+gap;
  });
  return cv.toDataURL('image/jpeg',quality);
};

async function main(){
  const args=parse(process.argv.slice(2));
  const out=path.resolve(args['--out']);
  fail(!fs.existsSync(out),'Output exists: '+out+' (use a new directory; nothing is overwritten)');
  process.chdir(ROOT);
  const plan=JSON.parse(fs.readFileSync(PLAN_FILE,'utf8'));
  fail(plan.format==='pose-hub-shoulder-axilla-render-ab-plan@1','Bad plan format');
  const width=args['--width']?+args['--width']:plan.width;
  const only=args['--only']?args['--only'].split(','):null;
  const entries=plan.entries.filter(e=>!only||only.includes(e.action));
  fail(entries.length,'No plan entries selected');
  if(only)fail(only.every(a=>plan.entries.some(e=>e.action===a)),'--only names an action not in the plan');
  const actions=[...new Set(entries.map(e=>e.action))];
  const recipeFiles=Object.fromEntries(actions.map(a=>[a,inside(path.join(plan.recipesDir,a+'.json'))]));

  const pre=await preflight(plan,recipeFiles);          // throws -> exit 1 before anything is written
  const git=gitHead();
  const {loadRecipe,openScene,stageAt,freeGiB}=await import(pathToFileURL(path.join(ROOT,'tools/action-package-v3/recipe-scene.mjs')).href);
  const {config,loadTheme}=await import(pathToFileURL(path.join(ROOT,'drill-anim/lib/config.mjs')).href);
  const {loadSkin}=await import(pathToFileURL(path.join(ROOT,'tools/action-package-v3/profile.mjs')).href);
  const {install:installSkins}=await import(pathToFileURL(pre.installEntry).href);
  const shoulder=await import(pathToFileURL(inside(plan.module)).href);
  const cfg=config(),theme=loadTheme();

  const work=cfg.work_dir,lock=path.join(work,'package-v3-render.lock');
  for(const n of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock','package-v3-render.lock'])
    fail(!fs.existsSync(path.join(work,n)),'Active rendering lock: '+path.join(work,n)+' (another render is running, or a crashed one left it; delete it only if no render is running)');
  fs.mkdirSync(out,{recursive:true});
  for(const d of ['png','sheets'])fs.mkdirSync(path.join(out,d));
  fs.mkdirSync(work,{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out,entry:rel(SELF)}),{flag:'wx'});

  const log={format:'pose-hub-shoulder-axilla-render-ab-log@1',started:new Date().toISOString(),git,
    command:'node '+rel(SELF)+' --out <dir>'+(args['--width']?' --width '+width:'')+(only?' --only '+only.join(','):''),
    testMode:!!(args['--width']||only),width,fullLayers:plan.fullLayers.map(l=>l.layer),closeupLayers:plan.closeupLayers.map(l=>l.layer),background:plan.background,
    pointers:{approvedLook:pre.approvedPointer,skinCoverage:pre.skinPointer},approved:pre.approved,module:pre.module,renderer:pre.renderer,
    recipes:pre.recipes,closeupConfig:plan.closeup,runtime:null,moduleSetup:{},images:[],sheets:[],failures:[],pageErrors:0,
    userAccepted:false};
  const writeLog=()=>fs.writeFileSync(path.join(out,'ab-log.json'),JSON.stringify(log,null,2)+'\n');
  let server=null;
  const stopServer=()=>{if(server?.started&&server.pid){try{process.kill(server.pid);}catch{}server.started=false;}};
  process.on('SIGINT',()=>{stopServer();try{fs.unlinkSync(lock);}catch{}process.exit(130);});
  try{
    server=await ensureServer(cfg.app_url,out);
    log.devServer={url:server.url,startedByScript:server.started,pid:server.pid??null};
    for(const action of actions){
      const list=entries.filter(e=>e.action===action);
      let browser;const report={pageErrors:[]};
      try{
        fail(freeGiB()>=1.25,'Low free memory ('+freeGiB().toFixed(2)+' GiB) before '+action);
        const loaded=await loadRecipe(path.resolve(recipeFiles[action]));
        const scene=await openScene(loaded,{size:width,theme,report});browser=scene.browser;const page=scene.page;
        log.runtime??=report.actualRuntime;
        const setup=await installSkins(page);
        const want=loadSkin(pre.skinId),installed=setup.skins.find(s=>s.id===pre.skinId);
        fail(installed&&installed.sha256===want.sha256,'Skin differs from the current skin version: '+pre.skinId);
        const skin={id:installed.id,look:installed.look};
        const modCfg=await shoulder.install(page,{enabled:false});
        log.moduleSetup[action]=modCfg;
        await page.evaluate(PAGE_HELPERS);
        const sheetRows=[];let warm=null;
        const times=[...new Set(list.map(e=>e.t))].sort((a,b)=>a-b);
        for(const t of times){
          const at=list.filter(e=>e.t===t),sides=at.flatMap(e=>e.sides),group=at[0].group;
          const staged=await stageAt(page,loaded.source,t,warm);warm=staged.x;
          const joints=await page.evaluate(()=>__abR1.joints());
          const cams=[{id:'full',side:null,camera:null,view:'production'}];
          for(const e of at)for(const side of e.sides){
            const cu=await page.evaluate(([s,m,c])=>__abR1.closeup(s,m,c),[side,e.closeupView,plan.closeup]);
            cams.push({id:'closeup-'+side,side,camera:cu,view:cu.used});
          }
          for(const cam of cams){
            const layers=cam.side?plan.closeupLayers:plan.fullLayers,pair={};
            for(const state of ['off','on']){
              const before=report.pageErrors.length;
              const r=await page.evaluate(a=>__abR1.shot(a),{enabled:state==='on',camera:cam.camera,layers:layers.map(l=>l.layer),skin});
              fail(!r.contextLost,'WebGL context lost');
              if(state==='on')fail(r.last,'shoulder-axilla-r1 did not run while enabled');
              const pe=report.pageErrors.length-before+r.errors.length;log.pageErrors+=pe;
              const sideKeys=cam.side?[cam.side]:sides;
              for(const L of layers){
                fail(r.uris[L.layer],'Layer '+L.layer+' not rendered');
                const comp=await page.evaluate(COMPOSITE,[r.uris[L.layer],plan.background]);
                const name=`${action}_t${t.toFixed(2)}_${cam.id}_${state}${L.suffix}.png`;
                fs.writeFileSync(path.join(out,'png',name),Buffer.from(comp.png.split(',')[1],'base64'),{flag:'wx'});
                const rec={file:'png/'+name,action,group,t,frame:Math.round(t*30),camera:cam.id,side:cam.side,coveredSides:sideKeys,view:cam.view,state,
                  layer:L.layer,layerLabel:L.label,width:comp.w,height:comp.h,bodyCoverage:+comp.coverage.toFixed(4),
                  elevationDeg:Object.fromEntries(sideKeys.map(x=>[x,+joints[x].elevationDeg.toFixed(2)])),
                  gate:Object.fromEntries(sideKeys.map(x=>[x,state==='on'?+(r.last?.sides?.[x]?.gate??NaN).toFixed(4):0])),
                  gateIfEnabled:Object.fromEntries(sideKeys.map(x=>[x,+joints[x].gate.toFixed(4)])),
                  verticesWritten:state==='on'?(r.last?.written??null):0,
                  verticesWrittenBySide:Object.fromEntries(['left','right'].map(x=>[x,state==='on'&&r.last?.sides?.[x]?.gate>0?modCfg.sides[x].vertices:0])),
                  maxMoveMm:state==='on'?+(r.last?.maxMoveMm??NaN).toFixed(2):0,
                  pageErrors:pe,pageErrorText:[...report.pageErrors.slice(before),...r.errors].slice(0,5),
                  closeupCamera:cam.camera,warnings:[],
                  approvedLook:{id:pre.approvedPointer.id,sha256Lf:pre.approvedPointer.sha256Lf},
                  skinCoverage:{id:pre.skinPointer.id,version:pre.skinPointer.version,sha256Lf:pre.skinPointer.sha256Lf},head:git.head};
                if(cam.camera?.fallback)rec.warnings.push('closeup fallback: '+cam.camera.fallback);
                if(cam.camera&&comp.coverage<plan.closeup.minBodyCoverage)rec.warnings.push('closeup body coverage '+comp.coverage.toFixed(3)+' < '+plan.closeup.minBodyCoverage);
                log.images.push(rec);
                (pair[L.layer]??={})[state]=comp.png;
              }
              fail(!pe,'Page errors: '+[...report.pageErrors.slice(before),...r.errors].slice(0,5).join(' | '));
            }
            const g=joints[cam.side??sides[0]];
            const sideTxt=cam.side?cam.side+' shoulder':sides.join('+')+' (full body)';
            const angle=cam.side?`elev ${g.elevationDeg.toFixed(0)}°  gate ${g.gate.toFixed(2)}`:`elev ${sides.map(x=>joints[x].elevationDeg.toFixed(0)+'°').join('/')}  gate ${sides.map(x=>joints[x].gate.toFixed(2)).join('/')}`;
            for(const L of layers)sheetRows.push({off:pair[L.layer].off,on:pair[L.layer].on,
              label:`t=${t.toFixed(2)}s  ${sideTxt}  ${cam.id==='full'?'production camera':'close-up ('+cam.view+')'}  ${L.label}  ${angle}`});
          }
          console.log(JSON.stringify({action,t,cameras:cams.map(c=>c.id),ok:true}));
        }
        if(report.pageErrors.length)throw Error('Page errors: '+report.pageErrors.join(';'));
        const jpg=await page.evaluate(SHEET,{title:`${action} [${list[0].group}]  shoulder-axilla-r1  OFF | ON  (${pre.approvedPointer.id} + ${pre.skinPointer.id}@${pre.skinPointer.version}, ${(git.head||'').slice(0,7)})`,rows:sheetRows,quality:plan.jpegQuality,bg:plan.background});
        const sheet=`sheets/${action}_ab.jpg`;fs.writeFileSync(path.join(out,sheet),Buffer.from(jpg.split(',')[1],'base64'),{flag:'wx'});
        log.sheets.push({action,file:sheet,rows:sheetRows.map(r=>r.label)});
      }catch(e){
        log.failures.push({action,error:String(e.message||e).slice(0,2000)});
        console.error('FAIL '+action+': '+String(e.message||e).slice(0,500));
      }finally{
        if(browser)await browser.close().catch(()=>{});
        writeLog();
      }
    }
    // sources must not drift during the run
    try{const again=await preflight(plan,recipeFiles);
      fail(JSON.stringify([again.approvedPointer,again.skinPointer,again.module,again.recipes])===JSON.stringify([pre.approvedPointer,pre.skinPointer,pre.module,pre.recipes]),'Sources changed during rendering');}
    catch(e){log.failures.push({action:'*',error:'post-run check: '+e.message});}
  }finally{
    stopServer();
    try{fs.unlinkSync(lock);}catch{}
    log.finished=new Date().toISOString();writeLog();
  }
  const imagesOk=log.images.filter(i=>!i.pageErrors).length;
  const summary={ok:!log.failures.length,images:imagesOk,sheets:log.sheets.length,failed:log.failures.map(f=>f.action),pageErrors:log.pageErrors,
    warnings:log.images.reduce((n,i)=>n+i.warnings.length,0),out,head:git.head};
  console.log(JSON.stringify(summary));
  if(log.failures.length)process.exitCode=1;
}

main().catch(e=>{console.log(JSON.stringify({ok:false,images:0,failed:['setup'],pageErrors:0,error:String(e.message||e)}));console.error(e.stack||e);process.exitCode=1;});
