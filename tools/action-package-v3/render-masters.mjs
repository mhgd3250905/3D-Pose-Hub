// Recipe-driven master renderer: one recipe -> transparent master layers for every skin.
//
//   node tools/action-package-v3/render-masters.mjs --recipe <recipe.json> --root <out root> \
//        [--profile default] [--model profile@version] [--skins a,b] [--size 1080] [--frames all|0,30,60]
//
// Writes <root>/masters/<id>/: <skin>/body/*.png, <skin>/body-highlight/*.png, mask/*.png
// (straight-alpha RGBA, fixed camera) plus layer-manifest.json. Frames 0..N-1 are the loop
// (N = duration x fps); frame N is kept only as the loop-closure QA endpoint.
// One pose solve per frame serves every skin (skins are material-only).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,fail,freeGiB} from './recipe-scene.mjs';
import {key} from './model-adapters.mjs';
import {loadProfile,loadSkin} from './profile.mjs';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),REPO=path.resolve(HERE,'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const PREFIX={body:'m','body-highlight':'h',mask:'k'};

export function parseArgs(argv){
  const flags={'--recipe':'recipe','--root':'root','--profile':'profile','--model':'model','--skins':'skins','--size':'size','--frames':'frames','--layers':'layers'};
  const o={profile:'default',frames:'all'};
  for(let i=0;i<argv.length;i+=2){fail(flags[argv[i]]&&argv[i+1]!==undefined&&!argv[i+1].startsWith('--'),'Unknown or missing argument: '+argv[i]);o[flags[argv[i]]]=argv[i+1];}
  fail(o.recipe&&o.root,'--recipe and --root are required');
  return o;
}

export function framePlan(duration,fps,frames){
  const n=Math.round(duration*fps);
  fail(Number.isFinite(duration)&&duration>0&&Math.abs(n-duration*fps)<1e-6,`Duration ${duration}s is not a whole number of ${fps}fps frames`);
  const full=frames==='all';
  const list=full?Array.from({length:n+1},(_,i)=>i):String(frames).split(',').map(Number);
  fail(list.every((f,i)=>Number.isInteger(f)&&f>=0&&f<=n&&(i===0||f>list[i-1])),'Frames must be increasing integers in 0..'+n);
  return {loopFrames:n,frames:list,complete:full,endpoint:n};
}

export async function run(opts){
  const profile=loadProfile(opts.profile);
  const loaded=await loadRecipe(path.resolve(opts.recipe),{model:opts.model??profile.model??undefined});
  const {prepared,source,adapter}=loaded,id=prepared.recipe.id;
  const fps=profile.masters.fps,size=Number(opts.size??profile.masters.size);
  fail(Number.isInteger(size)&&size>=128&&size<=2160,'Bad size');
  const skins=(opts.skins?opts.skins.split(','):profile.skins).map(loadSkin);
  const layers=opts.layers?opts.layers.split(','):profile.masters.layers;
  fail(layers.every(l=>PREFIX[l]),'Unknown layer');
  const plan=framePlan(source.timeline.duration,fps,opts.frames);
  const root=path.resolve(opts.root),out=path.join(root,'masters',id);
  fail(!fs.existsSync(out),'Output exists for '+id+'; use a new --root (outputs are immutable)');
  fail(freeGiB()>=1.25,'Low free memory at start');
  const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
  const cfg=config(),lock=path.join(cfg.work_dir,'package-v3-render.lock');
  for(const name of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock','package-v3-render.lock'])fail(!fs.existsSync(path.join(cfg.work_dir,name)),'Active render lock: '+name);
  fs.mkdirSync(path.dirname(lock),{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out}),{flag:'wx'});
  const report={format:'pose-hub-package-masters@1',actionId:id,started:new Date().toISOString(),
    recipe:{path:path.relative(REPO,prepared.recipeFile).replaceAll('\\','/'),sha256:prepared.recipeSha256},
    authoringModel:key(prepared.recipe.model),productionModel:key(adapter),profile:{id:profile.id,sha256:profile.sha256},
    sourceSha256:loaded.pinned.sha256,rendererSha256:{
      'render-masters.mjs':sha(fs.readFileSync(SELF)),'recipe-scene.mjs':sha(fs.readFileSync(path.join(HERE,'recipe-scene.mjs'))),
      'browser-package-layers.js':sha(fs.readFileSync(path.join(HERE,'browser-package-layers.js')))},
    size,fps,durationSeconds:source.timeline.duration,loopFrames:plan.loopFrames,complete:plan.complete,qaEndpointFrame:plan.endpoint,
    skins:skins.map(s=>({id:s.id,sha256:s.sha256,status:s.status})),layers,alphaMode:'straight',camera:'fixed (recipe camera, fitTimeline)',
    pageErrors:[],frames:[],
    flags:{sampledOnly:!plan.complete,fullCycleValidated:false,userAccepted:false,releaseEligible:false}};
  let browser;
  try{
    fs.mkdirSync(out,{recursive:true});
    fs.copyFileSync(prepared.recipeFile,path.join(out,'recipe.snapshot.json'));
    fs.writeFileSync(path.join(out,'source-manifest.json'),JSON.stringify(loaded.pinned,null,2)+'\n');
    const theme=loadTheme(),scene=await openScene(loaded,{size,theme,report});browser=scene.browser;const page=scene.page;
    await page.addScriptTag({content:fs.readFileSync(path.join(HERE,'browser-package-layers.js'),'utf8')});
    report.layerPatch=await page.evaluate(()=>__pkgLayers.patch());
    fail(report.layerPatch.patched>0,'No materials patched');
    let warm=null;const t0=Date.now();
    for(const f of plan.frames){
      fail(freeGiB()>=.5,'Low free memory at frame '+f);
      const t=f/fps,staged=await stageAt(page,source,t,warm);warm=staged.x;
      const shots=await page.evaluate(([l,s])=>__pkgLayers.render(l,s),[layers,skins.map(s=>({id:s.id,look:s.look}))]);
      fail(!report.pageErrors.length,'Browser/shader errors: '+report.pageErrors[0]);
      const record={frame:f,time:t,endpoint:f===plan.endpoint,pulse:staged.pulse,warn:staged.warn??null,files:{}};
      for(const[name,url]of Object.entries(shots)){
        const [skin,layer]=name.includes('/')?name.split('/'):[null,name];
        const dir=skin?path.join(out,skin,layer):path.join(out,layer);fs.mkdirSync(dir,{recursive:true});
        const bytes=Buffer.from(url.split(',')[1],'base64');
        fail(bytes.readUInt32BE(16)===size&&bytes.readUInt32BE(20)===size,'Wrong image size');
        const file=path.join(dir,`${PREFIX[layer]}-${String(f).padStart(4,'0')}.png`);fs.writeFileSync(file,bytes,{flag:'wx'});
        record.files[name]={path:path.relative(root,file).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length};
      }
      report.frames.push(record);
      console.log(JSON.stringify({event:'frame',id,frame:f,ms:Date.now()-t0}));
    }
    report.renderSeconds=(Date.now()-t0)/1000;
    fail(loadRecipeSourcesUnchanged(loaded),'Recipe sources changed during render');
    report.finished=new Date().toISOString();
    fs.writeFileSync(path.join(out,'layer-manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    return report;
  }catch(e){report.error=String(e?.stack??e);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(report,null,2)+'\n');throw e;}
  finally{try{await browser?.close();}finally{fs.unlinkSync(lock);}}
}
function loadRecipeSourcesUnchanged(loaded){return sha(fs.readFileSync(loaded.prepared.recipeFile))===loaded.prepared.recipeSha256;}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)run(parseArgs(process.argv.slice(2))).then(r=>console.log(JSON.stringify({event:'done',id:r.actionId,frames:r.frames.length,seconds:r.renderSeconds}))).catch(e=>{console.error(e);process.exitCode=1;});
