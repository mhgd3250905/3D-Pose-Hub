// Actual palm-to-forearm contact across all 241 frames, selected closeups only; no model/source mutation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRecipe,REPO,sha,readJson} from './recipe.mjs';
import {fingerprint,sampleActualRender} from './render-finalization-r1.mjs';
import {pinnedRuntime,verifyRuntimeSelection} from '../body-v3/armfix-r2/hand-qa-runtime.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
import {installCorrections} from './joint-corrections.mjs';
import {measureFootSurfacesInPage} from './foot-surface.mjs';
import {install as installContactDiagnostic} from './biceps-contact-diagnostic-r1.mjs';

const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const fail=(ok,message)=>{if(!ok)throw Error(message);};

export async function runProbe({recipeFile,runtimeFile,out,times=[0,2,4.3,8],lane=1}){
  fail([1,2].includes(lane),'Only lane 1 or 2 allowed');
  const root=path.resolve(out),allowed=path.resolve('F:/PoseHub-v2-production/template-finalization-20261029/probes');
  fail(root.startsWith(allowed+path.sep)&&!fs.existsSync(root),'Use a new subdirectory under '+allowed);
  fail(os.freemem()/1024**3>=3.5,'Available physical memory below 3.5 GiB');
  const prepared=await prepareRecipe(recipeFile),s=prepared.spec;
  fail(['h-biceps-self'].includes(prepared.recipe.id),'This diagnostic is restricted to the self-resisted arm contact');
  fail(prepared.handSetup.adapter==='symmetric-native','This probe requires native support/rest hand modes');
  fail(times.length>0&&times.every(t=>Number.isFinite(t)&&t>=0&&t<=s.timeline.duration&&Math.abs(t*30-Math.round(t*30))<1e-8),'Times must be valid 30 FPS frame times');
  const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);
  // boot.mjs captures launch configuration at import time: pin it first.
  const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');await model.verify();
  const pins=fingerprint(prepared.specFile,prepared),extra=[fileURLToPath(import.meta.url)];
  extra.push(path.join(REPO,'tools/action-completion-v3-r2/biceps-contact-diagnostic-r1.mjs'),path.join(REPO,'tools/action-completion-v3-r2/foot-surface.mjs'));
  const extraPins=extra.map(p=>({path:path.relative(REPO,p).replaceAll('\\','/'),sha256:sha(fs.readFileSync(p))}));
  fs.mkdirSync(root,{recursive:true});write(path.join(root,'recipe.snapshot.json'),prepared.recipe);write(path.join(root,'effective-spec.snapshot.json'),s);write(path.join(root,'source-manifest.json'),{...pins,extra:extraPins});
  const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});
  let browser,owned=false;const report={format:'pose-hub-biceps-contact-probe@1',id:prepared.recipe.id,recipeSha256:prepared.recipeSha256,times,sourceSha256:pins.sha256,extraPins,complete:false,samples:[],pageErrors:[]};
  try{
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,operation:'biceps-contact-probe',out:root}),{flag:'wx'});owned=true;
    const temp=path.join(root,'work/browser-temp');fs.mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
    const theme=loadTheme(),opened=await model.boot({size:480,pr:1,theme});browser=opened.b;const page=opened.p;
    page.on('pageerror',e=>report.pageErrors.push(String(e)));
    report.runtime=await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,contextLost:gl.isContextLost()};});
    fail(browser.version()===runtime.browserVersion&&report.runtime.renderer===runtime.actualWebGLRenderer&&!report.runtime.contextLost,'Actual runtime differs from pinned runtime');
    report.model=await model.applyV3(page,s);
    const presets=await import('../../drill-anim/models/fixed-hand-presets-r1/loader.mjs');await presets.verify();const data=presets.data();
    if(Object.values(prepared.handSetup.modes).includes('support')){const support=await import('../body-v3/armfix-r2/support-install.mjs');report.support=await support.installSupport(page,data.support,{sourceId:data.handSource});}
    await page.evaluate(({rest,modes})=>{if(Object.values(modes).includes('relaxed'))__v2p.poses.relaxed=structuredClone(rest.relaxed);if(Object.values(modes).includes('assist'))__v2p.poses.open=structuredClone(rest.assist);},{rest:data.rest,modes:prepared.handSetup.modes});
    if(s.renderAppearance?.highlight?.material)report.highlight=await page.evaluate(installHighlightMaterial,s.renderAppearance.highlight.material);
    report.recipeCorrections=await installCorrections(page,prepared.recipe);
    await installContactDiagnostic(page);
    await page.addScriptTag({content:'window.__bicepsProbeSample = '+sampleActualRender.toString()+';window.__bicepsProbeFeet = '+measureFootSurfacesInPage.toString()+';'});
    await page.evaluate(([s,theme,scale])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0xedf0f4,1);for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;__setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uSinkK.value=s.clothSink??1;for(const p of s.props||[])__props.add(theme,p);if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,480);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));v.motion.reset();},[s,theme,prepared.cameraScale]);
    const wanted=new Set(times.map(t=>Math.round(t*30))),end=Math.max(...wanted);let warm=null;
    for(let frame=0;frame<=end;frame++){
      fail(os.freemem()/1024**3>=2,'Available physical memory below 2 GiB');
      const result=await page.evaluate(({s,frame,warm,capture})=>{
        const v=flareInspector.viewer,T=__toonT,E=__drill,t=frame/30,solved=E.applyAt(s,t,warm);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));__toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);
        if(s.renderAppearance?.highlight){const h=s.renderAppearance.highlight,p=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*p);__toonUni.uHiShade.value=h.shade.slice();}
        __props.update();v.coach.updateMatrixWorld(true);
        const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
        const actual=window.__bicepsProbeSample(v,null,()=>({...window.__measureBicepsContactR1(),footSurface:window.__bicepsProbeFeet(),jointCorrections:{upperArm:window.__upperArmContourR3?.measure()??null,ankle:window.__ankleJoinR5?.last??null}})),views={full:{image:v.renderer.domElement.toDataURL('image/png'),position:c.pos.toArray(),target:c.tgt.toArray(),fov:v.camera.fov}};
        if(capture)for(const side of ['left','right'])for(const kind of ['front','side']){
          const sign=side==='left'?1:-1,at=new T.Vector3(...v.motion.getMetrics().joints.leftPalm);
          const dir=(kind==='front'?new T.Vector3(sign*.5,.25,1):new T.Vector3(sign,.15,.2)).normalize(),cam=new T.PerspectiveCamera(32,1,.01,20);
          cam.position.copy(at).addScaledVector(dir,.52);cam.lookAt(at);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);
          views[side+'-'+kind]={image:v.renderer.domElement.toDataURL('image/png'),position:cam.position.toArray(),target:at.toArray(),fov:cam.fov};
        }
        return {x:solved.x,warnings:solved.warn,contact:actual.rotations,views};
      },{s,frame,warm,capture:wanted.has(frame)});warm=result.x;
      fail(!report.pageErrors.length,'Page error: '+report.pageErrors.join('; '));
      if(true){
        const stem='frame-'+String(frame).padStart(4,'0');write(path.join(root,stem+'-contact.json'),result.contact);const views={};
        if(wanted.has(frame))for(const [name,v]of Object.entries(result.views)){const bytes=Buffer.from(v.image.split(',')[1],'base64'),file=stem+'-'+name+'.png';fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});const {image,...camera}=v;views[name]={file,sha256:sha(bytes),...camera};}
        report.samples.push({frame,time:frame/30,warnings:result.warnings,contact:stem+'-contact.json',views});if(frame%30===0)console.log(JSON.stringify({event:'biceps-contact-probe-pose',id:report.id,frame}));
      }
    }
    await model.verify();fail(fingerprint(prepared.specFile,prepared).sha256===pins.sha256,'Capture sources changed during probe');for(const p of extraPins)fail(sha(fs.readFileSync(path.join(REPO,p.path)))===p.sha256,'Probe or adapter changed during capture');
    report.complete=true;write(path.join(root,'probe.json'),report);return report;
  }catch(error){write(path.join(root,'failed.json'),{error:String(error),stack:error.stack,report});throw error;}
  finally{if(browser)await browser.close();if(owned)fs.unlinkSync(lock);}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2){fail(args[i].startsWith('--')&&args[i+1]&&!o[args[i]],'Expected unique --key value');o[args[i]]=args[i+1];}
  for(const key of ['--recipe','--runtime','--out'])fail(o[key],key+' required');
  await runProbe({recipeFile:o['--recipe'],runtimeFile:o['--runtime'],out:o['--out'],times:o['--times']?o['--times'].split(',').map(Number):[0,2,4.3,8],lane:Number(o['--lane']??1)});
}
