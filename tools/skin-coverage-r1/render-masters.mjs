// Versioned appearance entry. Frozen package renderer, recipes and model sources
// remain unchanged; its CLI and master-layer layout are reused here.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseArgs,framePlan} from '../action-package-v3/render-masters.mjs';
import {loadRecipe,openScene,stageAt,fail,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {key} from '../action-package-v3/model-adapters.mjs';
import {loadProfile,loadSkin} from '../action-package-v3/profile.mjs';
import {checkRecipe} from '../preview-current-model.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';
import {install} from './install.mjs';

export {parseArgs,framePlan};
const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),REPO=path.resolve(HERE,'../..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const relative=file=>path.relative(REPO,file).replaceAll('\\','/');
const PREFIX={body:'m','body-highlight':'h',mask:'k'};
const SOURCES=['tools/skin-coverage-r1/render-masters.mjs','tools/skin-coverage-r1/install.mjs',
  'tools/skin-coverage-r1/runtime.js','tools/skin-coverage-r1/port.mjs','tools/skin-coverage-r1/verify.mjs',
  'tools/action-package-v3/render-masters.mjs','tools/action-package-v3/recipe-scene.mjs',
  'tools/action-package-v3/browser-package-layers.js','tools/action-package-v3/native-highlight.mjs'];
const sourceHashes=()=>Object.fromEntries(SOURCES.map(file=>[file,sha(fs.readFileSync(path.join(REPO,file)))]));
async function verifyAppearance(){
  const {verify}=await import('./verify.mjs');
  fail(typeof verify==='function','Appearance verifier must export verify()');
  const result=await verify();
  fail(result&&typeof result==='object','Appearance verifier returned no manifest evidence');
  return result;
}

export async function run(opts){
  // Fail closed before a browser or output lock: both the approved geometric
  // base and the new versioned appearance sources must resolve in this checkout.
  const recipeFile=path.resolve(opts.recipe),approved=await checkRecipe(recipeFile);
  const appearance=await verifyAppearance(),profile=loadProfile(opts.profile);
  const loaded=await loadRecipe(recipeFile,{model:opts.model??profile.model??undefined});
  const {prepared,source,adapter}=loaded,id=prepared.recipe.id;
  fail(key(adapter)===key(approved.approved.baseModel),'Requested model differs from the approved appearance base');
  fail(/^[a-z0-9][a-z0-9_-]*$/i.test(id),'Unsafe action id');
  const fps=profile.masters.fps,size=Number(opts.size??profile.masters.size);
  fail(Number.isInteger(size)&&size>=128&&size<=2160,'Bad size');
  const skins=(opts.skins?opts.skins.split(','):profile.skins).map(loadSkin);
  fail(skins.length&&new Set(skins.map(s=>s.id)).size===skins.length,'Skin list must be nonempty and unique');
  const layers=opts.layers?opts.layers.split(','):profile.masters.layers;
  fail(layers.length&&new Set(layers).size===layers.length&&layers.every(l=>Object.hasOwn(PREFIX,l)),'Unknown, empty or duplicate layer');
  const plan=framePlan(source.timeline.duration,fps,opts.frames??'all');
  const root=path.resolve(opts.root),out=path.join(root,'masters',id);
  fail(!fs.existsSync(out),'Output exists for '+id+'; use a new --root (outputs are immutable)');
  fail(freeGiB()>=1.25,'Low free memory at start');
  const hashes=sourceHashes();
  const report={format:'pose-hub-package-masters@1',actionId:id,started:new Date().toISOString(),
    recipe:{path:relative(recipeFile),sha256:prepared.recipeSha256},
    authoringModel:key(prepared.recipe.model),productionModel:key(adapter),profile:{id:profile.id,sha256:profile.sha256},
    sourceSha256:loaded.pinned.sha256,rendererSha256:hashes,
    appearance:{entry:relative(SELF),verification:appearance,approvedBase:approved.approved.id,
      approvedSourceCommit:approved.approved.sourceCommit,approvedPointer:approved.pointer},
    modelVersion:approved.version,handSelection:prepared.handSetup,
    size,fps,durationSeconds:source.timeline.duration,loopFrames:plan.loopFrames,complete:plan.complete,qaEndpointFrame:plan.endpoint,
    skins:skins.map(s=>({id:s.id,sha256:s.sha256,status:s.status})),layers,alphaMode:'straight',camera:'fixed (recipe camera, fitTimeline)',
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
    fs.writeFileSync(path.join(out,'appearance-manifest.json'),JSON.stringify(report.appearance,null,2)+'\n',{flag:'wx'});
    const scene=await openScene(loaded,{size,theme:loadTheme(),report});browser=scene.browser;
    const page=scene.page,setup=await install(page);
    for(const skin of skins){
      const installed=setup.skins.find(s=>s.id===skin.id);
      fail(installed&&installed.sha256===skin.sha256,'Skin differs from this appearance version: '+skin.id);
      skin.look=installed.look;
    }
    report.appearanceSetup=setup;report.skinLooks=skins.map(s=>({id:s.id,look:s.look}));
    let warm=null;const started=Date.now();
    for(const frame of plan.frames){
      fail(freeGiB()>=.5,'Low free memory at frame '+frame);
      const time=frame/fps,staged=await stageAt(page,source,time,warm);warm=staged.x;
      const record={frame,time,endpoint:frame===plan.endpoint,pulse:staged.pulse,warn:staged.warn??null,files:{},skinEvidence:[]};
      // Render each selected skin on the same staged pose. Capture material and
      // visible-hand evidence inside onAfterRender, before the layer API clears
      // the skin override and the wrist adapter restores its transient geometry.
      for(const [index,skin] of skins.entries()){
        const requested=layers.filter(layer=>layer!=='mask'||index===0);
        if(!requested.length)continue;
        const result=await page.evaluate(({layers,skin})=>{
          const v=flareInspector.viewer,previous=v.scene.onAfterRender,witnesses=[];
          v.scene.onAfterRender=function(...args){
            const meshes=[];
            v.scene.traverse(o=>{
              if(!o.isMesh||!o.geometry?.attributes.position||o.geometry.drawRange.count===0)return;
              for(let a=o;a;a=a.parent)if(!a.visible)return;
              if(!/Hand|Wrist|head|neck/i.test(o.name)&&!o.isSkinnedMesh)return;
              meshes.push({name:o.name,vertices:o.geometry.attributes.position.count,indexCount:o.geometry.index?.count??0,
                materials:[o.material].flat().map(m=>({uuid:m.uuid,key:m.customProgramCacheKey?.()??''}))});
            });
            witnesses.push({skin:window.__v2p.skinOverride??null,rimStrength:window.__rimU.value,hologram:window.__v2p.regions.uni.uV2pRHolo.value.slice(),handPose:{...window.__v2p.cur},visibleMeshes:meshes,
              coverage:window.__skinCoverage.report(),eye:window.__eyeSocketSoften.report(),
              wristRestore:window.__webxrWristJoin?.lastRestoreCheck??null});
            return previous?.apply(this,args);
          };
          let images;
          try{images=window.__pkgLayers.render(layers,[skin]);}finally{v.scene.onAfterRender=previous;}
          const errors=[...(window.__pkgPumpErr||[]),...(window.__eyeSocketSoften.errors||[])];
          const target=skin.look.mode==='v2-port'?skin.look.v2Skin:null;
          const witness=witnesses.find(w=>w.skin===target)??witnesses.at(-1);
          return {images,witness,renderedSkins:witnesses.map(w=>w.skin),errors,contextLost:v.renderer.getContext().isContextLost()};
        },{layers:requested,skin:{id:skin.id,look:skin.look}});
        fail(!result.contextLost,'WebGL context lost');
        fail(!report.pageErrors.length&&!result.errors.length,'Browser/shader errors: '+[...report.pageErrors,...result.errors].join(';'));
        fail(result.witness,'No render-time material evidence');
        if(skin.look.mode==='v2-port')fail(result.witness.rimStrength===0&&result.witness.hologram[2]===0,'Non-default edge light must be off');
        if(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'){
          const coverage=result.witness.coverage;
          fail(coverage.enabled&&coverage.materialCount===4&&coverage.materials.every(m=>m.compiled),'Fixed hand skin coverage missing');
        }
        record.skinEvidence.push({id:skin.id,renderedSkins:result.renderedSkins,...result.witness});
        for(const [name,url]of Object.entries(result.images)){
          const [skinId,layer]=name.includes('/')?name.split('/'):[null,name];
          fail(Object.hasOwn(PREFIX,layer)&&(!skinId||skinId===skin.id),'Unexpected rendered layer '+name);
          const dir=skinId?path.join(out,skinId,layer):path.join(out,layer);fs.mkdirSync(dir,{recursive:true});
          const bytes=Buffer.from(url.split(',')[1],'base64');
          fail(bytes.length>24&&bytes.readUInt32BE(16)===size&&bytes.readUInt32BE(20)===size,'Wrong image size');
          const file=path.join(dir,`${PREFIX[layer]}-${String(frame).padStart(4,'0')}.png`);fs.writeFileSync(file,bytes,{flag:'wx'});
          record.files[name]={path:path.relative(root,file).replaceAll('\\','/'),sha256:sha(bytes),bytes:bytes.length};
        }
      }
      report.frames.push(record);
      console.log(JSON.stringify({event:'frame',id,frame,ms:Date.now()-started}));
    }
    report.renderSeconds=(Date.now()-started)/1000;
    fail(sha(fs.readFileSync(recipeFile))===prepared.recipeSha256,'Recipe changed during render');
    const refreshed=await loadRecipe(recipeFile,{model:key(adapter)});
    fail(refreshed.pinned.sha256===loaded.pinned.sha256,'Recipe sources changed during render');
    const finalApproved=await checkRecipe(recipeFile),finalAppearance=await verifyAppearance();
    fail(JSON.stringify(finalApproved.pointer)===JSON.stringify(approved.pointer),'Approved appearance pointer changed during render');
    fail(JSON.stringify(finalAppearance)===JSON.stringify(appearance),'Appearance verification changed during render');
    fail(JSON.stringify(sourceHashes())===JSON.stringify(hashes),'Renderer source changed during render');
    report.finished=new Date().toISOString();
    fs.writeFileSync(path.join(out,'layer-manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    return report;
  }catch(error){
    report.error=String(error?.stack??error);fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});throw error;
  }finally{
    try{await browser?.close();}finally{
      // Do not remove a lock another owner replaced while this job was running.
      if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lockContent)fs.unlinkSync(lock);
    }
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)
  run(parseArgs(process.argv.slice(2))).then(r=>console.log(JSON.stringify({event:'done',id:r.actionId,frames:r.frames.length,seconds:r.renderSeconds})))
    .catch(error=>{console.error(error);process.exitCode=1;});
