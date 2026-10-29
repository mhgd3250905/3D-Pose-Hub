// Focused three-pose diagnostic. No source/model mutation or image postprocessing.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRecipe,REPO,sha,readJson} from './recipe.mjs';
import {fingerprint,sampleActualRender} from './render.mjs';
import {pinnedRuntime,verifyRuntimeSelection} from '../body-v3/armfix-r2/hand-qa-runtime.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
import {installCorrections} from './joint-corrections.mjs';

const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const fail=(ok,message)=>{if(!ok)throw Error(message);};

// Called during scene.onAfterRender, including render-time forearm roll and elbow hooks.
export function readElbowGeometryInPage(table){
  const T=__toonT,v=flareInspector.viewer,q=new T.Vector3();v.coach.updateMatrixWorld(true);
  const feet={};for(const side of ['left','right']){
    const bone=v.coach.getObjectByName(side+'Forearm');if(!bone)throw Error('Missing '+side+'Forearm');feet[side]=bone.getWorldPosition(new T.Vector3());
  }
  const bones={};v.coach.traverse(b=>{if(b.isBone&&/^(left|right)(UpperArm|Forearm|Hand)/.test(b.name))bones[b.name]={parent:b.parent?.name,position:b.position.toArray(),worldPosition:b.getWorldPosition(new T.Vector3()).toArray(),localQuaternion:b.quaternion.toArray(),worldQuaternion:b.getWorldQuaternion(new T.Quaternion()).toArray(),matrixWorld:b.matrixWorld.toArray()};});
  const meshes={};v.coach.traverse(m=>{
    if(!m.isSkinnedMesh)return;for(let a=m;a;a=a.parent)if(!a.visible)return;
    // Include every visible skin: the reported sleeve-side surface may be torso/garment.

    m.skeleton.update();const g=m.geometry,p=g.attributes.position,sw=g.attributes.skinWeight,si=g.attributes.skinIndex;
    const selected=new Set(),posed=[];
    for(let i=0;i<p.count;i++){m.getVertexPosition(i,q).applyMatrix4(m.matrixWorld);posed.push(q.toArray());if(Math.min(q.distanceTo(feet.left),q.distanceTo(feet.right))<.30)selected.add(i);}
    const count=g.index?.count??p.count,at=i=>g.index?g.index.getX(i):i,faces=[];
    for(let i=0;i<count;i+=3){const f=[at(i),at(i+1),at(i+2)];if(f.some(j=>selected.has(j)))faces.push(f);}
    for(const f of faces)for(const i of f)selected.add(i);
    const ids=[...selected].sort((a,b)=>a-b),blend=new T.Matrix4(),boneMatrix=new T.Matrix4();
    const vertices=ids.map(i=>{
      const weights=Array.from({length:4},(_,k)=>({bone:m.skeleton.bones[si.getComponent(i,k)]?.name,weight:sw.getComponent(i,k)})).filter(w=>w.weight>0);
      let skinLinearDeterminant=null;
      if(weights.length>1&&weights.every(w=>/^(left|right)(UpperArm|Forearm)$/.test(w.bone))){
        const e=blend.elements.fill(0);for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;boneMatrix.fromArray(m.skeleton.boneMatrices,si.getComponent(i,k)*16);for(let j=0;j<16;j++)e[j]+=w*boneMatrix.elements[j];}
        skinLinearDeterminant=new T.Matrix3().setFromMatrix4(blend).determinant();
      }
      return {id:i,rest:[p.getX(i),p.getY(i),p.getZ(i)],world:posed[i],normal:g.attributes.normal?[g.attributes.normal.getX(i),g.attributes.normal.getY(i),g.attributes.normal.getZ(i)]:null,weights,skinLinearDeterminant};
    });
    meshes[meshes[m.name]?m.name+"#"+m.uuid:m.name]={uuid:m.uuid,name:m.name,parent:m.parent?.name,vertexCount:p.count,indexCount:count,drawRange:{...g.drawRange},material:Array.isArray(m.material)?m.material.map(x=>({name:x.name,side:x.side})): {name:m.material.name,side:m.material.side},vertices,facesOriginalIndices:faces};
  });
  const body=v.coach.getObjectByName('Coach_Body'),limb=__v2p.limbs.mesh;body.skeleton.update();limb.skeleton.update();
  const pos=(m,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);
  const seams=table.map(([side,bi,li])=>{const a=pos(body,bi),b=pos(limb,li);return {side,bodyId:bi,limbId:li,bodyWorld:a.toArray(),limbWorld:b.toArray(),gapMm:a.distanceTo(b)*1000};});
  return {upperArmCorrective:window.__upperArmContourR2?.measure?.()??window.__upperArmContourR1?.measure?.()??null,corrective:window.__elbowDqsR1?.last??null,forearmTwist:structuredClone(window.__wristTwistStats?.applied??{}),bones,elbowCenters:Object.fromEntries(Object.entries(feet).map(([s,x])=>[s,x.toArray()])),meshes,seams,seamPairsChecked:table.length,seamMaxGapMm:Math.max(0,...seams.map(x=>x.gapMm)),limitations:['CPU-skinned positions exclude shader-only displacement.','The elbow is inside a continuous piece; this probe does not establish absence of self-intersection.']};
}

export async function runProbe({recipeFile,runtimeFile,out,times=[0,2,4],adapterFile,lane=1}){
  fail([1,2].includes(lane),'Only lane 1 or 2 allowed');
  const root=path.resolve(out),allowed=path.resolve('F:/PoseHub-v2-production/elbow-review-20261029');
  fail(root.startsWith(allowed+path.sep)&&!fs.existsSync(root),'Use a new subdirectory under '+allowed);
  fail(os.freemem()/1024**3>=3.5,'Available physical memory below 3.5 GiB');
  const prepared=await prepareRecipe(recipeFile),s=prepared.spec;
  fail(['h-bear-plank','h-bridge-overhead','h-standing-arm-extension-stretch'].includes(prepared.recipe.id),'This diagnostic is restricted to the reported bear support-arm contour');
  fail(prepared.handSetup.adapter==='symmetric-native','This probe requires native support/rest hand modes');
  fail(times.length>0&&times.every(t=>Number.isFinite(t)&&t>=0&&t<=s.timeline.duration&&Math.abs(t*30-Math.round(t*30))<1e-8),'Times must be valid 30 FPS frame times');
  const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);
  // boot.mjs captures launch configuration at import time: pin it first.
  const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');await model.verify();
  const pins=fingerprint(prepared.specFile,prepared),extra=[fileURLToPath(import.meta.url)];
  let adapter;
  if(adapterFile){const f=path.resolve(adapterFile);fail(f.startsWith(REPO+path.sep)&&fs.statSync(f).isFile(),'Adapter must be a repository file');adapter=await import(pathToFileURL(f).href);fail(typeof adapter.install==='function','Adapter must export install(page)');
    const visit=p=>{if(extra.includes(p))return;extra.push(p);for(const m of fs.readFileSync(p,'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))visit(path.resolve(path.dirname(p),m[1]));};visit(f);
  }
  const extraPins=extra.map(p=>({path:path.relative(REPO,p).replaceAll('\\','/'),sha256:sha(fs.readFileSync(p))}));
  fs.mkdirSync(root,{recursive:true});write(path.join(root,'recipe.snapshot.json'),prepared.recipe);write(path.join(root,'effective-spec.snapshot.json'),s);write(path.join(root,'source-manifest.json'),{...pins,extra:extraPins});
  const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});
  let browser,owned=false;const report={format:'pose-hub-elbow-probe@1',id:prepared.recipe.id,recipeSha256:prepared.recipeSha256,times,sourceSha256:pins.sha256,extraPins,complete:false,samples:[],pageErrors:[],candidateAdapter:adapterFile??null};
  try{
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,operation:'elbow-probe',out:root}),{flag:'wx'});owned=true;
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
    const effectiveRecipe=structuredClone(prepared.recipe);
    if(adapterFile){
      fail(/^upper-arm-contour-r\d+\.mjs$/.test(path.basename(adapterFile)),'Fullness trial must explicitly replace an upper-arm contour module');
      report.replacedRecipeCorrections=effectiveRecipe.jointCorrections.filter(x=>x.profile.startsWith('upper-arm-contour-'));
      effectiveRecipe.jointCorrections=effectiveRecipe.jointCorrections.filter(x=>!x.profile.startsWith('upper-arm-contour-'));
    }
    report.recipeCorrections=await installCorrections(page,effectiveRecipe);
    if(adapter)report.adapter=await adapter.install(page);
    report.sleeveColorControl=await page.evaluate(()=>{
      const u=window.__v2p?.uni,L=u?.uV2pCuffL?.value,R=u?.uV2pCuffR?.value;
      if(!L?.isVector4||!R?.isVector4)throw Error('Expected shared cuff planes');
      const originalPlanes={left:L.toArray(),right:R.toArray()};
      L.w=-1000;R.w=-1000;
      return {kind:'upper-arm-cuff-color-boundary-only',originalPlanes,trialPlaneW:-1000,geometryChanged:false,description:'Display arm-weighted upper-arm surface as skin and remove the cuff dark band; keep actual mesh/pose/camera unchanged.'};
    });
    const seam=readJson(path.join(REPO,'drill-anim/models/training-human-v2plus-limbs-base.json')).seam;
    const table=[];
    await page.addScriptTag({content:'window.__elbowProbeRead = '+readElbowGeometryInPage.toString()+'; window.__elbowProbeSample = '+sampleActualRender.toString()+';'});
    report.rest=await page.evaluate(table=>{flareInspector.viewer.motion.reset();return window.__elbowProbeRead(table);},table);
    await page.evaluate(([s,theme,scale])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0xedf0f4,1);for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;__setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uSinkK.value=s.clothSink??1;for(const p of s.props||[])__props.add(theme,p);if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,480);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));v.motion.reset();},[s,theme,prepared.cameraScale]);
    const wanted=new Set(times.map(t=>Math.round(t*30))),end=Math.max(...wanted);let warm=null;
    for(let frame=0;frame<=end;frame++){
      fail(os.freemem()/1024**3>=2,'Available physical memory below 2 GiB');
      const result=await page.evaluate(({s,frame,warm,capture,table})=>{
        const v=flareInspector.viewer,T=__toonT,E=__drill,t=frame/30,solved=E.applyAt(s,t,warm);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));__toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);
        if(s.renderAppearance?.highlight){const h=s.renderAppearance.highlight,p=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*p);__toonUni.uHiShade.value=h.shade.slice();}
        __props.update();v.coach.updateMatrixWorld(true);if(!capture)return {x:solved.x};
        const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
        const actual=window.__elbowProbeSample(v,null,()=>window.__elbowProbeRead(table)),views={full:{image:v.renderer.domElement.toDataURL('image/png'),position:c.pos.toArray(),target:c.tgt.toArray(),fov:v.camera.fov}};
        for(const [name,side,local]of [['left-front','left',[-.15,.08,-1]],['left-back','left',[-.65,.08,-1]],['left-inner','left',[.25,.03,-1]],['right-front','right',[-.15,.08,1]],['right-back','right',[-.65,.08,1]],['right-inner','right',[.25,.03,1]]]){
          const elbow=v.coach.getObjectByName(side+'Forearm'),at=elbow.getWorldPosition(new T.Vector3()).lerp(v.coach.getObjectByName(side+'UpperArm').getWorldPosition(new T.Vector3()),.20),dir=new T.Vector3(...local).normalize(),cam=new T.PerspectiveCamera(28,1,.01,20);
          cam.position.copy(at).addScaledVector(dir,.98);cam.lookAt(at);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);views[name]={image:v.renderer.domElement.toDataURL('image/png'),position:cam.position.toArray(),target:at.toArray(),fov:cam.fov};
        }
        return {x:solved.x,warnings:solved.warn,geometry:actual.rotations,views};
      },{s,frame,warm,capture:wanted.has(frame),table});warm=result.x;
      fail(!report.pageErrors.length,'Page error: '+report.pageErrors.join('; '));
      if(wanted.has(frame)){
        const stem='frame-'+String(frame).padStart(4,'0');write(path.join(root,stem+'-geometry.json'),result.geometry);const views={};
        for(const [name,v]of Object.entries(result.views)){const bytes=Buffer.from(v.image.split(',')[1],'base64'),file=stem+'-'+name+'.png';fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});const {image,...camera}=v;views[name]={file,sha256:sha(bytes),...camera};}
        report.samples.push({frame,time:frame/30,warnings:result.warnings,geometry:stem+'-geometry.json',seamMaxGapMm:result.geometry.seamMaxGapMm,views});console.log(JSON.stringify({event:'elbow-probe-pose',id:report.id,frame,seamMaxGapMm:result.geometry.seamMaxGapMm}));
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
  await runProbe({recipeFile:o['--recipe'],runtimeFile:o['--runtime'],out:o['--out'],times:o['--times']?o['--times'].split(',').map(Number):[0,2,4],adapterFile:o['--adapter'],lane:Number(o['--lane']??1)});
}
