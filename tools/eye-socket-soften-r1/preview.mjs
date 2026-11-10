import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verify} from './verify.mjs';
import {inspectModelVersion} from '../model-version.mjs';
import {loadRecipe,openScene,stageAt} from '../action-package-v3/recipe-scene.mjs';
import {loadSkin} from '../action-package-v3/profile.mjs';
import {installPumpHighlight} from '../action-package-v3/native-highlight.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
await verify();
const [recipe,outArg]=process.argv.slice(2);
if(!recipe||!outArg)throw Error('Usage: preview.mjs <recipe.json> <new-output-directory>');
const out=path.resolve(outArg),version=await inspectModelVersion(recipe),loaded=await loadRecipe(path.resolve(root,recipe));
if(fs.existsSync(out))throw Error('Output must be new');
const sha=data=>createHash('sha256').update(data).digest('hex');
const inputs=['tools/eye-socket-soften-r1/preview.mjs','tools/eye-socket-soften-r1/runtime.js','tools/eye-socket-soften-r1/verify.mjs','tools/head-surface-smooth-r1/runtime.js','tools/human-polish-v3/runtime.js'];
const sources=Object.fromEntries(inputs.map(f=>[f,sha(fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n'))]));
const work=config().work_dir,lock=path.join(work,'package-v3-render.lock');
for(const name of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock','package-v3-render.lock'])if(fs.existsSync(path.join(work,name)))throw Error('Active rendering lock');
fs.mkdirSync(work,{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out}),{flag:'wx'});
const report={version,sources,component:{profile:'eye-socket-soften',version:'0.1.0-r1',status:'preview-candidate'},pageErrors:[],frames:[],userAccepted:false};
let browser;
try{
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'source-manifest.json'),JSON.stringify(loaded.pinned,null,2));fs.copyFileSync(loaded.prepared.recipeFile,path.join(out,'recipe.snapshot.json'));
 const scene=await openScene(loaded,{size:900,theme:loadTheme(),report});browser=scene.browser;const page=scene.page;
 console.log('Recipe scene loaded');
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'tools/action-package-v3/browser-package-layers.js'),'utf8')});await page.evaluate(()=>__pkgLayers.patch());await installPumpHighlight(page);
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'tools/human-polish-v3/runtime.js'),'utf8')});await page.evaluate(()=>__bodyPolish.enable(true));
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'tools/head-surface-smooth-r1/runtime.js'),'utf8')});await page.evaluate(()=>__headSurfaceSmooth.enable(true));
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'tools/eye-socket-soften-r1/runtime.js'),'utf8')});report.setup=await page.evaluate(()=>__eyeSocketSoften.report());
 const skin=loadSkin('realistic');report.skin=skin;
 let warm;
 for(const frame of [0,36]){
  const staged=await stageAt(page,loaded.source,frame/30,warm);warm=staged.x;
  const views=frame===0?['front','three-quarter','side','full']:['full'];
  for(const view of views){
   const pair=[];
   for(const candidate of [false,true]){
    const result=await page.evaluate(([candidate,view,skin])=>{
     const v=flareInspector.viewer,T=__toonT,c=v.camera, saved={matrix:c.matrixWorld.clone(),fov:c.fov};
     __eyeSocketSoften.enable(candidate);
     if(view!=='full'){const directions={front:[0,0,1],side:[1,0,0], 'three-quarter':[.8,.06,1]};c.fov=35;c.position.copy(new T.Vector3(0,1.604,.025).add(new T.Vector3(...directions[view]).normalize().multiplyScalar(.60)));c.lookAt(0,1.604,.025);c.updateProjectionMatrix();c.updateMatrixWorld();}
     // Compare all visible meshes, including the head: only normals and eye cavity shading may change.
     let witness;const previous=v.scene.onAfterRender;
     v.scene.onAfterRender=function(...args){const meshes=[];v.scene.traverse(m=>{if(!m.isMesh||!m.geometry?.attributes.position)return;let visible=true;for(let p=m;p;p=p.parent)visible&&=p.visible;if(!visible)return;const points=[];const ids=Array.from({length:m.geometry.attributes.position.count},(_,i)=>i);for(const i of ids){const p=new T.Vector3();m.getVertexPosition(i,p);points.push(...p.applyMatrix4(m.matrixWorld).toArray());}meshes.push({name:m.name,points});});witness=meshes;return previous?.apply(this,args);};
     let images;try{images=__pkgLayers.render(['body','body-highlight'],[{id:'realistic',look:skin.look}]);}finally{v.scene.onAfterRender=previous;c.fov=saved.fov;saved.matrix.decompose(c.position,c.quaternion,c.scale);c.updateProjectionMatrix();c.updateMatrixWorld();}
     return {images,witness,errors:[...__eyeSocketSoften.errors,...(__pkgPumpErr||[])],hands:{...__v2p.cur},head:__eyeSocketSoften.report()};
    },[candidate,view,skin]);
    const label=candidate?'candidate':'baseline';
    for(const [layer,uri] of Object.entries(result.images))fs.writeFileSync(path.join(out,`${frame}-${view}-${label}-${layer.replace('/','-')}.png`),Buffer.from(uri.split(',')[1],'base64'),{flag:'wx'});
    if(result.errors.length)throw Error(result.errors.join(';'));
    pair.push({label,eyeSocket:result.head,allVerticesSha256:sha(JSON.stringify(result.witness)),hands:result.hands});
   }
   if(pair[0].allVerticesSha256!==pair[1].allVerticesSha256||JSON.stringify(pair[0].hands)!==JSON.stringify(pair[1].hands))throw Error('Geometry/hand pose changed');
   report.frames.push({frame,view,pair,allVerticesUnchanged:true});console.log(JSON.stringify({frame,view,allVerticesUnchanged:true}));
  }
 }
 if(report.pageErrors.length)throw Error(report.pageErrors.join(';'));
 if((await loadRecipe(loaded.prepared.recipeFile)).pinned.sha256!==loaded.pinned.sha256)throw Error('Recipe changed during rendering');
 report.ok=true;
}catch(e){report.ok=false;report.error=String(e.stack||e);throw e;}
finally{if(fs.existsSync(out))fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser?.close();fs.unlinkSync(lock);}
