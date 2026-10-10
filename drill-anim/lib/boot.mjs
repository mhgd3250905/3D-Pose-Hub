// boots the 3D Coach page (served by Vite) in headless chromium and installs the drill-anim page libs
import fs from 'node:fs';import path from 'node:path';import {ROOT,config} from './config.mjs';
const C=config();
const PG=f=>fs.readFileSync(path.join(ROOT,'page',f),'utf8');
export async function boot({size=1080,pr=2,theme,bakeHands=[]}){
  const {chromium}=await import(C.playwright_module);
  const args=C.chromium_args!==undefined?(Array.isArray(C.chromium_args)?C.chromium_args:String(C.chromium_args).split(/\s+/).filter(Boolean)):['--use-gl=swiftshader','--enable-unsafe-swiftshader'];
  const b=await chromium.launch({args,...(C.chromium_channel?{channel:C.chromium_channel}:{})});
  const p=await b.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  p.on('pageerror',e=>console.log('pageerror',e.message));p.on('console',m=>{if(m.type()==='error')console.log('console',m.text().slice(0,300));});
  await p.goto(C.app_url+'/?inspect');await p.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:170000});
  await p.addStyleTag({content:`html,body{background:transparent!important} body *{visibility:hidden!important;} canvas{visibility:visible!important} .msync-canvas{visibility:hidden!important} *::before,*::after{background:transparent!important}`});
  for(const f of ['posedlib.js','toon.js','anim-sideplank.js','engine.js','props.js'])await p.addScriptTag({content:PG(f)});
  await p.addScriptTag({content:'window.__srcHead='+fs.readFileSync(path.join(ROOT,'assets/srchead.json'),'utf8')});await p.addScriptTag({content:PG('head.js')});
  // baked grip data (assets/grip-<side>.json) injected like srchead, so P.bakeGrip never depends on the app server's file layout
  {const gs=fs.readdirSync(path.join(ROOT,'assets')).filter(f=>/^grip-\w+\.json$/.test(f));
   if(gs.length)await p.addScriptTag({content:'window.__gripData={'+gs.map(f=>JSON.stringify(f.slice(5,-5))+':'+fs.readFileSync(path.join(ROOT,'assets',f),'utf8')).join(',')+'}'});}
  // garment textures (optional): read files here, decode in the page
  const tex={};['skin','top','bottom','shoes'].forEach((k,i)=>{const t=theme[k]?.texture;if(t&&t.image){const f=path.resolve(theme.__dir,t.image);tex[i]='data:image/png;base64,'+fs.readFileSync(f).toString('base64');}});
  const SP=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/sideplank-cfg.json'),'utf8'));
  await p.evaluate(async ([th,tex,SP])=>{window.__theme=th;window.__toonCfg=SP;
    window.__texCache={};const ver=(await (await fetch('/src/viewer.js')).text()).match(/three\.js\?v=(\w+)/)[1];const T=await import('/node_modules/.vite/deps/three.js?v='+ver);
    for(const [i,u] of Object.entries(tex)){const t=await new T.TextureLoader().loadAsync(u);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;window.__texCache[i]=t;}
    await __toon(th);},[theme,tex,SP]);
  const hr=await p.evaluate(()=>__mannequinHead4({}));
  await p.evaluate(()=>{const v=flareInspector.viewer;
    v.stageFloor&&(v.stageFloor.visible=false);v.stageGrid&&(v.stageGrid.visible=false);v.stageRing&&(v.stageRing.visible=false);v.movementGuide?.setVisible?.(false);v.trajectoryGuide?.setVisible?.(false);
    if(v.shadowCatcher)v.shadowCatcher.visible=false;v.scene.background=null;v.renderer.setClearColor(0x000000,0);
    v.scene.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)o.visible=false;if(o.isLine||o.isPoints||o.isSprite)o.visible=false;});});
  // v7 order: weld seams, then the relaxed-hand morph (v7 baked it into the left hand)
  const weld=await p.evaluate(()=>__weldSkin(['Mesh005','Mesh005_1','Coach_Body','Mesh001','Coach_Training_Shorts']));
  const HD=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/handdef.json'),'utf8'));
  const hand=await p.evaluate(([c,h,bk])=>{const r={morph:__buildHandRelax(c,h)};const o=flareInspector.viewer.coach.getObjectByName('Coach_Body').geometry;
    // v7-exact relaxed hand: bake permanently (the morph path is kept but does not show on screen yet, see README residuals)
    for(const side of bk){const HH=side==='left'?h:null;if(HH){r.baked=bakeHand(c,HH,'left');o.attributes.position.needsUpdate=true;o.attributes.normal.needsUpdate=true;}}flareInspector.viewer.motion.reset();return r;},[SP,HD,bakeHands]);
  await p.evaluate(([size,pr])=>{const v=flareInspector.viewer;v.resize=()=>{};v.renderer.setPixelRatio(pr);v.renderer.setSize(size,size);v.camera.aspect=1;v.camera.updateProjectionMatrix();v.playing=false;__drill.captureRestBoneQ();__drill.init();
    // custom attributes uploaded before our programs existed do not reach the toon shader until re-uploaded once after a render
    v.renderer.render(v.scene,v.camera);v.coach.traverse(o=>{if(!o.isSkinnedMesh)return;for(const k of ['mmRest','aSink','aHandD','aHandN']){const a=o.geometry.attributes[k];if(a)a.needsUpdate=true;}});v.renderer.render(v.scene,v.camera);},[size,pr]);
  return {b,p,info:{weld,hand,head:hr.head}};
}
