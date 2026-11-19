// V5 master frames for one action (2026-11-17). Same CLI shape, master layout and layer-manifest as
// tools/joint-opt-r1/render-masters-joint.mjs, so tools/action-package-v3/compose.py packs it unchanged:
//   node tools/v5/render-masters-v5.mjs --recipe <recipe.json> --root <run-dir> [--profile tools/v5/profile-v5.json] [--frames all|0,30,60] [--size N]
// Per frame: the hub recipe scene solves the pose (stageAt: applyAt + props + fixed recipe camera, exactly as V4), then
// tools/v5/runtime/v5-hub.js copies the solved pose onto the V5 model (coach-v3r3-wristfix + toon r6, bald, hard ground shadow)
// and renders it with the hub body hidden. Output: masters/<id>/v5-toon/body/m-NNNN.png (straight alpha), layer-manifest.json,
// v5-pose.json (per-frame V5 local pose + diagnostics for checks). No body-highlight/mask layers: V5 has no muscle highlight,
// so compose.py's highlight-on and highlight-off images are the same picture.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseArgs,framePlan} from '../action-package-v3/render-masters.mjs';
import {loadRecipe,openScene,stageAt,fail,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {key} from '../action-package-v3/model-adapters.mjs';
import {checkRecipe} from '../preview-current-model.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),REPO=path.resolve(HERE,'../..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const relative=file=>path.relative(REPO,file).replaceAll('\\','/');
const RT=path.join(HERE,'runtime');
// browser modules injected into the hub page (blob URLs; bare 'three' imports are bound to the page's own Vite three)
const MODULES=['vendor/meshopt_decoder.module.js','wristfix-r2.js','toon-r6.js','v5-hub.js'];
const MODEL='model/coach-v3r3-wristfix.glb';
const SOURCES=['tools/v5/render-masters-v5.mjs','tools/v5/profile-v5.json','tools/action-package-v3/skins/v5-toon.json',
  ...MODULES.map(m=>'tools/v5/runtime/'+m),'tools/v5/runtime/'+MODEL,
  'tools/action-package-v3/render-masters.mjs','tools/action-package-v3/recipe-scene.mjs'];
const SHADOW_MARGIN_PX=4,SHADOW_FRUSTUM_MARGIN_M=0.1;   // guard margins (px of a 1080 master; metres in light space)
// Per-action view window (px of the recipe camera's own 1080 view): same camera position, fov and perspective; only the image
// window moves/widens (camera.setViewOffset), i.e. a crop of a wider render, as the Thomas fix (d983e9d). Every action not listed
// renders the recipe camera's own view, unchanged.
//  h-open-book (2026-11-17): the floor-side hand's finger shadows reach y=1078.5 of 1080 on frames ~80-160 (open hold; body+shadow
//  union x 98..948, y 225..1078.5) -> window moved 20 px down: shadow bottom ~1058.5 (21.5 px headroom), body top ~205.
// Scapula translation (spec v5.scapulaShift === true, opt-in per action; Thomas supplement r2 2026-11-19): see tools/v5/runtime/v5-hub.js
// header. Every action without that spec field installs V5 exactly as before (same call, same report).
const VIEW_WINDOW={'h-open-book':{x:0,y:20,w:1080},'triceps-C':{x:0,y:40,w:1080}};
const sourceHashes=()=>Object.fromEntries(SOURCES.map(f=>[f,sha(fs.readFileSync(path.join(REPO,f)))]));
export function loadV5Profile(p){
  const file=path.resolve(p??path.join(HERE,'profile-v5.json')),bytes=fs.readFileSync(file),data=JSON.parse(bytes);
  fail(data.format==='pose-hub-package-profile@1'&&data.id==='v5','Not the V5 profile: '+file);
  fail(data.masters?.fps===30&&Number.isInteger(data.masters.size)&&JSON.stringify(data.masters.layers)==='["body"]','V5 profile masters must be fps 30, body layer only');
  fail(data.skins.length===1&&data.skins[0]==='v5-toon','V5 profile has exactly one skin: v5-toon');
  const sf=path.join(REPO,'tools/action-package-v3/skins/v5-toon.json'),sb=fs.readFileSync(sf),skin=JSON.parse(sb);
  fail(skin.format==='pose-hub-package-skin@1'&&skin.id==='v5-toon'&&skin.look?.mode==='toon-v5','Bad v5-toon skin');
  return {profile:{...data,sha256:sha(bytes),file},skin:{...skin,sha256:sha(sb)}};
}

export async function run(opts){
  const recipeFile=path.resolve(opts.recipe),approved=await checkRecipe(recipeFile);
  const {profile,skin}=loadV5Profile(opts.profile);
  const loaded=await loadRecipe(recipeFile,{model:undefined});
  const {prepared,source,adapter}=loaded,id=prepared.recipe.id;
  fail(key(adapter)===key(approved.approved.baseModel),'Recipe model differs from the approved base');
  fail(/^[a-z0-9][a-z0-9_-]*$/i.test(id),'Unsafe action id');
  const fps=profile.masters.fps,size=Number(opts.size??profile.masters.size);
  fail(Number.isInteger(size)&&size>=128&&size<=2160,'Bad size');
  const plan=framePlan(source.timeline.duration,fps,opts.frames??'all');
  const root=path.resolve(opts.root),out=path.join(root,'masters',id);
  fail(!fs.existsSync(out),'Output exists for '+id+'; use a new --root (outputs are immutable)');
  fail(freeGiB()>=1.25,'Low free memory at start');
  const hashes=sourceHashes();
  const report={format:'pose-hub-package-masters@1',actionId:id,started:new Date().toISOString(),
    recipe:{path:relative(recipeFile),sha256:prepared.recipeSha256},
    authoringModel:key(prepared.recipe.model),productionModel:'coach-v3r3-wristfix@v5-toon (pose solved on '+key(adapter)+')',
    profile:{id:profile.id,sha256:profile.sha256},sourceSha256:loaded.pinned.sha256,rendererSha256:hashes,
    v5:{entry:relative(SELF),look:skin.look,model:'tools/v5/runtime/'+MODEL,wristTwistShareOnV5:0},
    modelVersion:approved.version,handSelection:prepared.handSetup,
    size,fps,durationSeconds:source.timeline.duration,loopFrames:plan.loopFrames,complete:plan.complete,qaEndpointFrame:plan.endpoint,
    skins:[{id:skin.id,sha256:skin.sha256,status:skin.status}],layers:['body'],alphaMode:'straight',camera:'fixed (recipe camera, fitTimeline)',
    pageErrors:[],frames:[],flags:{sampledOnly:!plan.complete,fullCycleValidated:false,userAccepted:false,releaseEligible:false}};
  const work=config().work_dir,lock=path.join(work,'package-v3-render.lock');
  for(const name of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock','package-v3-render.lock'])
    fail(!fs.existsSync(path.join(work,name)),'Active render lock: '+name);
  fs.mkdirSync(work,{recursive:true});
  const lockContent=JSON.stringify({pid:process.pid,out,entry:relative(SELF),started:report.started});
  fs.writeFileSync(lock,lockContent,{flag:'wx'});
  let browser;
  try{
    fs.mkdirSync(out,{recursive:true});
    fs.copyFileSync(recipeFile,path.join(out,'recipe.snapshot.json'));
    fs.writeFileSync(path.join(out,'source-manifest.json'),JSON.stringify(loaded.pinned,null,2)+'\n',{flag:'wx'});
    const scene=await openScene(loaded,{size,theme:loadTheme(),report});browser=scene.browser;
    const page=scene.page;
    const mods=Object.fromEntries(MODULES.map(m=>[m,fs.readFileSync(path.join(RT,m),'utf8')]));
    const glb=fs.readFileSync(path.join(RT,MODEL)).toString('base64');
    report.v5.setup=await page.evaluate(async ({mods,glb,scapulaShift})=>{
      const src=await (await fetch('/src/viewer.js')).text(),v=src.match(/three\.js\?v=(\w+)/)[1],O=location.origin;
      const map={'three':O+'/node_modules/.vite/deps/three.js?v='+v,'three/addons/loaders/GLTFLoader.js':O+'/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js?v='+v,
        'three/addons/GLTFLoader.js':O+'/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js?v='+v};
      const T=await import(map.three);if(T.REVISION!==__toonT.REVISION||T.Quaternion!==__toonT.Quaternion)throw Error('page three instance mismatch');
      const url={};
      for(const [name,code] of Object.entries(mods)){
        const fixed=code.replace(/(from\s*|import\s*\(\s*)(['"])([^'"]+)\2/g,(m,pre,q,spec)=>{
          if(map[spec])return pre+q+map[spec]+q;
          const rel=spec.replace(/^\.\//,'');if(url[rel])return pre+q+url[rel]+q;
          throw Error('V5 module '+name+' imports unknown '+spec);});
        url[name]=URL.createObjectURL(new Blob([fixed],{type:'text/javascript'}));
      }
      const bin=Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer;
      const m=await import(url['v5-hub.js']);return await m.installV5(scapulaShift?{glb:bin,scapulaShift}:{glb:bin});
    },{mods,glb,scapulaShift:source.v5?.scapulaShift===true});
    fail(report.v5.setup.hair==='none'&&report.v5.setup.wristSides.length===2,'V5 setup incomplete');
    const win=VIEW_WINDOW[id];
    if(win){
      fail(win.w>=1080&&Number.isFinite(win.x)&&Number.isFinite(win.y),'Bad view window for '+id);
      report.v5.viewWindow={...win,unit:'px of the recipe camera 1080 view',view:await page.evaluate(([s,w])=>{const c=flareInspector.viewer.camera,k=s/1080;
        c.setViewOffset(s,s,w.x*k,w.y*k,w.w*k,w.w*k);c.updateProjectionMatrix();return {...c.view};},[size,win])};
      report.camera+=`; view window x${win.x} y${win.y} w${win.w}`;
    }
    const poses=[];let warm=null;const started=Date.now();
    for(const frame of plan.frames){
      fail(freeGiB()>=.5,'Low free memory at frame '+frame);
      const time=frame/fps,staged=await stageAt(page,source,time,warm);warm=staged.x;
      const record={frame,time,endpoint:frame===plan.endpoint,pulse:staged.pulse,warn:staged.warn??null,files:{}};
      const mg=SHADOW_MARGIN_PX*size/1080;
      const r=await page.evaluate(([size,mg])=>{const d=window.__v5.pose();const ext=window.__v5.extent(size,mg);const url=window.__v5.render();
        // the border lines (and the lines 3 px in) of the frame just rendered, only for the sides the shadow reaches
        const border={};for(const k of Object.keys(ext.edgeSpan))border[k]=[window.__v5.borderAlpha(k,0),window.__v5.borderAlpha(k,3)];
        return {d,ext,border,edge:window.__v5.edge,url,view:(c=>c.view&&c.view.enabled?{...c.view}:null)(flareInspector.viewer.camera),contextLost:flareInspector.viewer.renderer.getContext().isContextLost()};},[size,mg]);
      fail(!r.contextLost,'WebGL context lost');
      fail(JSON.stringify(r.view)===JSON.stringify(report.v5.viewWindow?.view??null),'Camera view window changed at frame '+frame);
      // shadow guard: the whole ground shadow (analytic: every sampled caster vertex projected along the V5 sun onto the shadow
      // plane) must lie inside the master canvas with a margin, and casters + shadow inside the V5 sun's shadow frustum.
      // One exception (2026-11-17, erectors-A): on a side the shadow reaches, it may leave the canvas where it lies on an opaque prop
      // that leaves the canvas there too (the exercise mat, cut at the same edge in V4): over the shadow's span on that side the
      // rendered border must be opaque (alpha > 64), and no border pixel of that side may be free shadow (0 < alpha <= 64 on the
      // border and 3 px in, as tools/v5/check-shadow.py). Anything else still fails. The rendered image is not changed by this.
      const sh=r.ext.shadow,inside=sh[0]>=mg&&sh[1]>=mg&&sh[2]<=size-mg&&sh[3]<=size-mg,shadowEdge={};
      if(r.ext.shadowPoints>0&&!inside)for(const [k,[y0,y1]] of Object.entries(r.ext.edgeSpan)){
        const [line,inner]=r.border[k],s=v=>v>0&&v<=64,i0=Math.max(0,Math.round(y0)),i1=Math.min(size-1,Math.round(y1));
        let opaque=true;for(let i=i0;i<=i1;i++)if(line[i]<=64)opaque=false;
        const free=line.reduce((n,v,i)=>n+(s(v)&&s(inner[i])?1:0),0);
        shadowEdge[k]={span:[y0,y1],underOpaque:opaque&&i0<=i1,freeShadowPx:free};
      }
      const sideOk=e=>e.underOpaque&&e.freeShadowPx===0;
      fail(r.ext.shadowPoints===0||inside||(Object.keys(shadowEdge).length>0&&Object.values(shadowEdge).every(sideOk)),
        `Ground shadow reaches the master canvas edge at frame ${frame}: ${JSON.stringify(sh)} ${JSON.stringify(shadowEdge)}`);
      fail(r.ext.lightHalfNeeded<=r.ext.lightHalf-SHADOW_FRUSTUM_MARGIN_M,`Shadow casters leave the V5 sun shadow frustum at frame ${frame}: needs ±${r.ext.lightHalfNeeded} m of ±${r.ext.lightHalf}`);
      fail(r.ext.otherShadowLights===0||report.v5.setup.mutedShadowLights.length===r.ext.otherShadowLights,'Unexpected extra shadow light');
      fail(!report.pageErrors.length,'Browser/shader errors: '+report.pageErrors.join(';'));
      const dir=path.join(out,skin.id,'body');fs.mkdirSync(dir,{recursive:true});
      const bytes=Buffer.from(r.url.split(',')[1],'base64');
      fail(bytes.length>24&&bytes.readUInt32BE(16)===size&&bytes.readUInt32BE(20)===size,'Wrong image size');
      const file=path.join(dir,`m-${String(frame).padStart(4,'0')}.png`);fs.writeFileSync(file,bytes,{flag:'wx'});
      record.files[skin.id+'/body']={path:path.relative(root,file).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length};
      record.v5={posErr:r.d.posErr,posErrBone:r.d.posErrBone,spineErrBefore:+r.d.spine.e0.toFixed(5),spineErrAfter:+r.d.spine.e.toFixed(5),
        shadowBox:sh,...(Object.keys(shadowEdge).length?{shadowEdge}:{}),bodyBox:r.ext.body,lightHalfNeeded:r.ext.lightHalfNeeded,lightHalf:r.ext.lightHalf,edgeAlpha:r.edge};
      report.frames.push(record);poses.push({frame,...r.d});
      console.log(JSON.stringify({event:'frame',id,frame,ms:Date.now()-started}));
    }
    report.renderSeconds=(Date.now()-started)/1000;
    fail(sha(fs.readFileSync(recipeFile))===prepared.recipeSha256,'Recipe changed during render');
    fail(JSON.stringify(sourceHashes())===JSON.stringify(hashes),'Renderer source changed during render');
    const mx=k=>Math.max(...report.frames.map(f=>f.v5[k]));
    report.v5.summary={maxPosErr:mx('posErr'),maxSpineErrBefore:mx('spineErrBefore'),maxSpineErrAfter:mx('spineErrAfter'),
      maxAngleDiffDeg:Math.max(...poses.flatMap(p=>Object.keys(p.angHub).map(k=>Math.abs(p.angHub[k]-p.angV5[k])))),
      wristWraps:poses.at(-1).wrist.wraps,wristSeeks:poses.at(-1).wrist.seeks,
      shadow:{box:[Math.min(...report.frames.map(f=>f.v5.shadowBox[0])),Math.min(...report.frames.map(f=>f.v5.shadowBox[1])),Math.max(...report.frames.map(f=>f.v5.shadowBox[2])),Math.max(...report.frames.map(f=>f.v5.shadowBox[3]))],
        minEdgeGapPx:+Math.min(...report.frames.map(f=>Math.min(f.v5.shadowBox[0],f.v5.shadowBox[1],size-f.v5.shadowBox[2],size-f.v5.shadowBox[3]))).toFixed(1),
        ...(report.frames.some(f=>f.v5.shadowEdge)?{edgeUnderOpaquePropFrames:report.frames.filter(f=>f.v5.shadowEdge).length}:{}),
        maxLightHalfNeeded:mx('lightHalfNeeded'),lightHalf:report.frames[0].v5.lightHalf,mutedShadowLights:report.v5.setup.mutedShadowLights,
        edgeAlphaFrames:report.frames.filter(f=>Object.values(f.v5.edgeAlpha).some(e=>e[0]>0)).length}};
    fs.writeFileSync(path.join(out,'v5-pose.json'),JSON.stringify({format:'pose-hub-v5-pose@1',actionId:id,fps,bones:Object.keys(poses[0].q),frames:poses}));
    report.finished=new Date().toISOString();
    fs.writeFileSync(path.join(out,'layer-manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    return report;
  }catch(error){
    report.error=String(error?.stack??error);fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});throw error;
  }finally{
    try{await browser?.close();}finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lockContent)fs.unlinkSync(lock);}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF){
  const a=process.argv.slice(2),i=a.indexOf('--profile');let prof;if(i>=0){prof=a[i+1];a.splice(i,2);}
  run({...parseArgs(a),profile:prof}).then(r=>console.log(JSON.stringify({event:'done',id:r.actionId,frames:r.frames.length,seconds:r.renderSeconds,v5:r.v5.summary})))
    .catch(error=>{console.error(error);process.exitCode=1;});
}
