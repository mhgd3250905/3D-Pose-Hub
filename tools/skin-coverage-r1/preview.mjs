import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {checkRecipe} from '../preview-current-model.mjs';
import {loadRecipe,openScene,stageAt} from '../action-package-v3/recipe-scene.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';
import {install} from './install.mjs';
import {verify} from './verify.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),[recipe,outArg]=process.argv.slice(2);
if(!recipe||!outArg)throw Error('Usage: preview.mjs <action-recipe.json> <new-output-directory>');
const state=await checkRecipe(recipe),loaded=await loadRecipe(path.resolve(root,recipe)),out=path.resolve(outArg);
const appearance=verify();
if(fs.existsSync(out))throw Error('Output exists; use a new directory');
const sha=x=>createHash('sha256').update(x).digest('hex');
const work=config().work_dir,lock=path.join(work,'package-v3-render.lock');
for(const n of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock','package-v3-render.lock'])if(fs.existsSync(path.join(work,n)))throw Error('Active rendering lock: '+n);
fs.mkdirSync(work,{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out}),{flag:'wx'});
const report={format:'pose-hub-skin-coverage-qa@1',version:'0.1.0-r1',appearance,approvedBase:state.approved.id,model:state.version,sourceManifest:loaded.pinned,pageErrors:[],frames:[],userAccepted:false,fullCycleValidated:false};
let browser;
try{
 fs.mkdirSync(out,{recursive:true});fs.copyFileSync(loaded.prepared.recipeFile,path.join(out,'recipe.snapshot.json'));
 const scene=await openScene(loaded,{size:800,theme:loadTheme(),report});browser=scene.browser;const page=scene.page;
 console.log('Recipe loaded '+loaded.prepared.recipe.id);
 const setup=await install(page);report.setup=setup;
 // Observe the actual compiled, currently visible material slots, including cloned heads.
 await page.evaluate(()=>{
  window.__coverageObserve=()=>{flareInspector.viewer.scene.traverse(o=>{if(!o.isMesh)return;for(const m of [o.material].flat()){
   if(!m||m.__coverageObserved)continue;m.__coverageObserved=true;const hook=m.onBeforeCompile,key=m.customProgramCacheKey;
   m.onBeforeCompile=function(sh,r){hook.call(this,sh,r);m.__coverageShader=sh;};if(m.__v2prHook===hook)m.__v2prHook=m.onBeforeCompile;
   m.customProgramCacheKey=()=>key.call(m)+'|coverage-observer-r1';m.needsUpdate=true;
  }});};__coverageObserve();
 });
 let warm;
 for(const frame of [0,36]){
  const staged=await stageAt(page,loaded.source,frame/30,warm);warm=staged.x;
  const views=frame===0?['full','neck','hands']:['full'];
  for(const view of views){
   const baseline={};let expectedGeometry;
   const cases=[...setup.skins.filter(s=>['realistic','hologram'].includes(s.id)).map(s=>({skin:s,enabled:false})),...setup.skins.map(s=>({skin:s,enabled:true})),{skin:setup.skins[0],enabled:true,roundtrip:true}];
   for(const test of cases){
    const r=await page.evaluate(({test,view})=>{
     const v=flareInspector.viewer,T=__toonT,c=v.camera,saved={matrix:c.matrixWorld.clone(),fov:c.fov};
     __skinCoverage.enable(test.enabled);__coverageObserve();
     if(view!=='full'){
      let at=new T.Vector3(0,1.57,0),distance=.77;
      if(view==='hands'){at=v.coach.getObjectByName('leftHand').getWorldPosition(new T.Vector3());distance=.47;}
      c.fov=35;c.position.copy(at).add(new T.Vector3(.65,.12,1).normalize().multiplyScalar(distance));c.lookAt(at);c.updateProjectionMatrix();c.updateMatrixWorld();
     }
     let witness,materials,rimStrength;const previous=v.scene.onAfterRender;
     v.scene.onAfterRender=function(...args){
      rimStrength=__rimU.value;let h=2166136261;const buf=new Float64Array(3),bytes=new Uint8Array(buf.buffer),p=new T.Vector3();materials=[];
      v.scene.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position||o.geometry.drawRange.count===0)return;for(let a=o;a;a=a.parent)if(!a.visible)return;
       for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,p).applyMatrix4(o.matrixWorld);buf.set(p.toArray());for(const b of bytes)h=Math.imul(h^b,16777619);}
       for(const [slot,m] of [o.material].flat().entries()){const s=m.__coverageShader,u=s?.uniforms||{};
        materials.push({mesh:o.name,slot,uuid:m.uuid,key:m.customProgramCacheKey(),region:!!u.uV2pR,paint:u.uV2pRSk?.value,regionOn:u.uV2pRon?.value,modelOn:u.uV2pOn?.value,holo:u.uV2pRHolo?.value,grey:u.uV2pRGrey?.value,join:!!u.joinRegionSkin,joinPaint:u.joinRegionSkin?.value,joinOn:u.joinRegionOn?.value,cacheCurrent:!o.__v2prMats||o.__v2prMats.includes(m)});
       }
      });witness=(h>>>0).toString(16);return previous?.apply(this,args);
     };
     let images;try{images=__pkgLayers.render(['body','body-highlight'],[{id:test.skin.id,look:test.skin.look}]);}finally{v.scene.onAfterRender=previous;c.fov=saved.fov;saved.matrix.decompose(c.position,c.quaternion,c.scale);c.updateProjectionMatrix();c.updateMatrixWorld();}
     return {images,witness,materials,rimStrength,coverage:__skinCoverage.report(),eyes:__eyeSocketSoften.report(),hands:{...__v2p.cur},errors:[...__eyeSocketSoften.errors,...(__pkgPumpErr||[])]};
    },{test,view});
    if(r.errors.length)throw Error(r.errors.join(';'));
    if(test.skin.id!=='realistic'&&(r.rimStrength!==0||r.materials.some(m=>m.holo&&m.holo[2]!==0)))throw Error('Non-default edge light is still enabled');
    expectedGeometry??=r.witness;if(expectedGeometry!==r.witness)throw Error('Skin changed geometry');
    const hashes=Object.fromEntries(Object.entries(r.images).map(([k,uri])=>[k.split('/')[1],sha(Buffer.from(uri.split(',')[1],'base64'))]));
    if(!test.enabled)baseline[test.skin.id]=hashes;
    if(test.enabled&&test.skin.id==='realistic'&&JSON.stringify(baseline.realistic)!==JSON.stringify(hashes))throw Error('Approved realistic pixels changed');
    const label=!test.enabled?'baseline':test.roundtrip?'roundtrip':'candidate';
    for(const [layer,uri] of Object.entries(r.images))fs.writeFileSync(path.join(out,`${frame}-${view}-${label}-${layer.replace('/','-')}.png`),Buffer.from(uri.split(',')[1],'base64'),{flag:'wx'});
    delete r.images;report.frames.push({frame,view,skin:test.skin.id,label,hashes,...r});
   }
   console.log(JSON.stringify({frame,view,geometryUnchanged:true,realisticPixelsUnchanged:true}));
  }
 }
 if(report.pageErrors.length)throw Error(report.pageErrors.join(';'));
 if((await loadRecipe(loaded.prepared.recipeFile)).pinned.sha256!==loaded.pinned.sha256)throw Error('Recipe source drift');
 if(JSON.stringify(verify())!==JSON.stringify(appearance))throw Error('Appearance source drift');
 report.ok=true;
}catch(e){report.ok=false;report.error=String(e.stack||e);throw e;}
finally{if(fs.existsSync(out))fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser?.close();fs.unlinkSync(lock);}
