import candidateSpec from '../../drill-anim/specs/h-inner-thigh-r6.js';
// Independent 32-template finalization probe. Recipe-selected components are installed exactly once.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRecipe,adaptRecipe,REPO,sha,readJson} from './recipe.mjs';
import {fingerprint,sampleActualRender} from './render.mjs';
import {pinnedRuntime,verifyRuntimeSelection} from '../body-v3/armfix-r2/hand-qa-runtime.mjs';
import {config,loadTheme} from '../../drill-anim/lib/config.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
import {installCorrections} from './joint-corrections.mjs';

import {measureFootSurfacesInPage} from './foot-surface.mjs';
import {measureVisibleBodySurfacesInPage} from './body-surface-floor-probe-r1.mjs';



const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const fail=(ok,message)=>{if(!ok)throw Error(message);};

// Called during scene.onAfterRender, including the installed ankle hooks.
export function readAnkleGeometryInPage(table,stage='unsampled-neutral-read'){
  const T=__toonT,v=flareInspector.viewer,q=new T.Vector3();v.coach.updateMatrixWorld(true);
  const feet={};for(const side of ['left','right']){
    const bone=v.coach.getObjectByName(side+'Foot');if(!bone)throw Error('Missing '+side+'Foot');feet[side]=bone.getWorldPosition(new T.Vector3());
  }
  const bones={};v.coach.traverse(b=>{if(b.isBone&&/^(left|right)(Shin|LowerLeg|Foot|Toe|UpperLeg|Thigh)/.test(b.name))bones[b.name]={parent:b.parent?.name,position:b.position.toArray(),worldPosition:b.getWorldPosition(new T.Vector3()).toArray(),localQuaternion:b.quaternion.toArray(),worldQuaternion:b.getWorldQuaternion(new T.Quaternion()).toArray(),matrixWorld:b.matrixWorld.toArray()};});
  const meshes={};v.coach.traverse(m=>{
    if(!m.isSkinnedMesh)return;for(let a=m;a;a=a.parent)if(!a.visible)return;
    if(!/Coach_Body|V2P_Base_Limbs|Sneaker|Shoe|Sole/.test(m.name))return;
    m.skeleton.update();const g=m.geometry,p=g.attributes.position,sw=g.attributes.skinWeight,si=g.attributes.skinIndex;
    const selected=new Set(),posed=[];
    for(let i=0;i<p.count;i++){m.getVertexPosition(i,q).applyMatrix4(m.matrixWorld);posed.push(q.toArray());if(Math.min(q.distanceTo(feet.left),q.distanceTo(feet.right))<.30)selected.add(i);}
    const count=g.index?.count??p.count,at=i=>g.index?g.index.getX(i):i,faces=[];
    for(let i=0;i<count;i+=3){const f=[at(i),at(i+1),at(i+2)];if(f.some(j=>selected.has(j)))faces.push(f);}
    for(const f of faces)for(const i of f)selected.add(i);
    const normalMatrix=new T.Matrix3().getNormalMatrix(m.matrixWorld),boneMatrix=new T.Matrix4(),weighted=new T.Matrix4();
    const skinnedNormal=i=>{if(!g.attributes.normal)return null;weighted.elements.fill(0);for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;boneMatrix.fromArray(m.skeleton.boneMatrices,si.getComponent(i,k)*16);for(let j=0;j<16;j++)weighted.elements[j]+=w*boneMatrix.elements[j];}const objectSkin=m.bindMatrixInverse.clone().multiply(weighted).multiply(m.bindMatrix);return new T.Vector3().fromBufferAttribute(g.attributes.normal,i).applyMatrix3(new T.Matrix3().setFromMatrix4(objectSkin)).applyMatrix3(normalMatrix).normalize().toArray();};
    const ids=[...selected].sort((a,b)=>a-b),vertices=ids.map(i=>({id:i,rest:[p.getX(i),p.getY(i),p.getZ(i)],world:posed[i],normal:g.attributes.normal?[g.attributes.normal.getX(i),g.attributes.normal.getY(i),g.attributes.normal.getZ(i)]:null,normalWorldSkinned:skinnedNormal(i),weights:Array.from({length:4},(_,k)=>({bone:m.skeleton.bones[si.getComponent(i,k)]?.name,weight:sw.getComponent(i,k)})).filter(w=>w.weight>0)}));
    meshes[m.name]={uuid:m.uuid,vertexCount:p.count,indexCount:count,drawRange:{...g.drawRange},material:Array.isArray(m.material)?m.material.map(x=>({name:x.name,side:x.side})): {name:m.material.name,side:m.material.side},vertices,facesOriginalIndices:faces};
  });
  const body=v.coach.getObjectByName('Coach_Body'),limb=__v2p.limbs.mesh;body.skeleton.update();limb.skeleton.update();
  const pos=(m,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);
  const seams=table.map(([side,bi,li])=>{const a=pos(body,bi),b=pos(limb,li);return {side,bodyId:bi,limbId:li,bodyWorld:a.toArray(),limbWorld:b.toArray(),gapMm:a.distanceTo(b)*1000};});
  return {capturedAt:stage,jointCorrections:{ankle:window.__ankleJoinR6?.last??window.__ankleJoinR5?.last??window.__ankleJoinR4?.last??null,elbow:window.__elbowDqsR1?.last??null},bones,footCenters:Object.fromEntries(Object.entries(feet).map(([s,x])=>[s,x.toArray()])),meshes,seams,seamMaxGapMm:Math.max(...seams.map(x=>x.gapMm)),limitations:['CPU-skinned positions and world normals exclude shader-only displacement/normal edits.','An intact source seam does not prove absence of foot/skin/shoe self-intersection.']};
}

export async function runProbe({recipeFile,runtimeFile,out,times=[0,1.4],lane=1}){
  fail([1,2].includes(lane),'Only lane 1 or 2 allowed');
  const root=path.resolve(out),allowed=path.resolve('F:/PoseHub-v2-production/template-finalization-20261029/probes');
  fail(root.startsWith(allowed+path.sep)&&!fs.existsSync(root),'Use a new subdirectory under '+allowed);
  fail(os.freemem()/1024**3>=3.5,'Available physical memory below 3.5 GiB');
  const prepared=await prepareRecipe(recipeFile),s=adaptRecipe(candidateSpec,prepared.recipe).spec;s.id=candidateSpec.id;
  fail(prepared.recipe.id==='h-inner-thigh','Inner-thigh-only probe');
  fail(JSON.stringify(s.qa)===JSON.stringify(prepared.spec.qa)&&s.timeline.duration===prepared.spec.timeline.duration&&JSON.stringify(s.timeline.tracks.open)===JSON.stringify(prepared.spec.timeline.tracks.open),'Original QA/timing changed');
  
  fail(prepared.handSetup.adapter!=='webxr-dumbbell-wrist-r1','Fixed grasp needs a composition-aware remapped probe; use the finalization renderer for this path');
  fail(new Set(["h-band-biceps-curl", "h-chair-elbow-triceps-stretch", "h-db-overhead-shrug", "h-db-reverse-curl", "h-db-zottman-curl", "h-half-kneeling-quad-stretch", "h-standing-arm-extension-stretch", "h-supine-cactus-chest", "h-bear-plank", "h-biceps-self", "h-bridge-overhead", "h-crossbody", "h-inner-thigh", "h-kb-swing", "h-mountain-climber", "h-open-book", "h-pike-pushup", "h-reverse-lunge", "h-towel-behind", "h-towel-pass", "h-towel-pulldown", "h-wall-pec", "t-flare-side-hold", "t-lsit-open-close", "t-lsit-tuck", "t-lsit-vsit-circles", "t-lsit-wide", "t-seated-straddle-ext", "t-seated-straddle-lifts", "t-straddle-hold", "t-tuck-planche", "t-vsit"]).has(prepared.recipe.id),'Probe scope is the32 finalization templates');
  fail(times.length>0&&times.every(t=>Number.isFinite(t)&&t>=0&&t<=s.timeline.duration&&Math.abs(t*30-Math.round(t*30))<1e-8),'Times must be valid 30 FPS frame times');
  const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);
  // boot.mjs captures launch configuration at import time: pin it first.
  const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');await model.verify();
  const pins=fingerprint(prepared.specFile,prepared),extra=[fileURLToPath(import.meta.url),path.join(REPO,'drill-anim/specs/h-inner-thigh-r6.js'),path.join(REPO,'tools/action-completion-v3-r2/body-surface-floor-probe-r1.mjs')];
  const extraPins=extra.map(p=>({path:path.relative(REPO,p).replaceAll('\\','/'),sha256:sha(fs.readFileSync(p))}));
  fs.mkdirSync(root,{recursive:true});write(path.join(root,'recipe.snapshot.json'),prepared.recipe);write(path.join(root,'effective-spec.snapshot.json'),s);write(path.join(root,'source-manifest.json'),{...pins,extra:extraPins});
  const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});
  let browser,owned=false;const report={format:'pose-hub-inner-thigh-support-keyframe-probe@2',id:prepared.recipe.id,recipeSha256:prepared.recipeSha256,times,sourceSha256:pins.sha256,extraPins,complete:false,metrics:[],samples:[],pageErrors:[],componentSource:'recipe.jointCorrections; installed once'};
  try{
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,operation:'ankle-probe',out:root}),{flag:'wx'});owned=true;
    const temp=path.join(root,'work/browser-temp');fs.mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
    const theme=loadTheme(),opened=await model.boot({size:480,pr:1,theme});browser=opened.b;const page=opened.p;
    page.on('pageerror',e=>report.pageErrors.push(String(e)));
    report.runtime=await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,contextLost:gl.isContextLost()};});
    fail(browser.version()===runtime.browserVersion&&report.runtime.renderer===runtime.actualWebGLRenderer&&!report.runtime.contextLost,'Actual runtime differs from pinned runtime');
    report.model=await model.applyV3(page,s);
    if(s.renderAppearance?.highlight?.material)report.highlight=await page.evaluate(installHighlightMaterial,s.renderAppearance.highlight.material);
    if(prepared.handSetup.adapter==='webxr-dumbbell-wrist-r1'){
      const wrist=await import('../body-v3/webxr-wrist-join-r1/loader.mjs');report.wristSetup=await wrist.install(page,{showDumbbells:prepared.handSetup.showDumbbells});
    }else{
      const presets=await import('../../drill-anim/models/fixed-hand-presets-r1/loader.mjs');await presets.verify();const data=presets.data();
      if(Object.values(s.v2plus.handPose??{}).includes('grasp-32mm')){const grip=await import('../body-v3/armfix-r2/grip-symmetric-install.mjs');report.nativeGripSetup=await grip.installGrip(page,data.grasp);}
      if(s.props?.some(p=>p.fixedKettlebellGrasp!==undefined)){const kettlebell=await import('./kettlebell-grip.mjs');report.kettlebellGripSetup=await kettlebell.installKettlebellGrip(page);}
      if(Object.values(prepared.handSetup.modes).includes('support')){const support=await import('../body-v3/armfix-r2/support-install.mjs');report.support=await support.installSupport(page,data.support,{sourceId:data.handSource});}
      await page.evaluate(({rest,modes})=>{if(Object.values(modes).includes('relaxed'))__v2p.poses.relaxed=structuredClone(rest.relaxed);if(Object.values(modes).includes('assist'))__v2p.poses.open=structuredClone(rest.assist);},{rest:data.rest,modes:prepared.handSetup.modes});
    }
    report.jointCorrections=await installCorrections(page,prepared.recipe);
    
    await page.addScriptTag({content:'window.__mountainMeasureFoot = '+measureFootSurfacesInPage.toString()+';'});
    report.adapter=report.jointCorrections.find(c=>c.profile.startsWith('ankle-join-'))?.setup??null;
    const seam=readJson(path.join(REPO,'drill-anim/models/training-human-v2plus-limbs-base.json')).seam;
    const table=seam.ring.flatMap((r,i)=>/^ankle_(left|right)$/.test(r)?[[r,seam.vid[i],seam.first+i]]:[]);fail(table.length===56,'Expected 56 source seam pairs');
    await page.addScriptTag({content:'window.__ankleProbeRead = '+readAnkleGeometryInPage.toString()+'; window.__ankleProbeSample = '+sampleActualRender.toString()+';'});
    await page.addScriptTag({content:'window.__measureVisibleBodySurfaces = '+measureVisibleBodySurfacesInPage.toString()+';'});
    await page.evaluate(([s,theme,scale,baselineSpec])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0xedf0f4,1);for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;__setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uSinkK.value=s.clothSink??1;for(const p of s.props||[])__props.add(theme,p);window.__candidateProps=__props.list.slice();window.__baselineProps=[];for(const p of baselineSpec.props||[]){const o=__props.add(theme,p);o.visible=false;window.__baselineProps.push(o);}if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,480);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));v.motion.reset();},[s,theme,prepared.cameraScale,prepared.spec]);
    const wanted=new Set(times.map(t=>Math.round(t*30))),end=Math.max(...wanted);let warm={baseline:null,candidate:null};
    for(let frame=0;frame<=end;frame++){
      fail(os.freemem()/1024**3>=2,'Available physical memory below 2 GiB');
      const result=await page.evaluate(({s,baselineSpec,frame,warm,capture,table})=>{
        const v=flareInspector.viewer,T=__toonT,E=__drill,t=frame/30;
        function images(label,joints){
          const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();v.renderer.render(v.scene,v.camera);
          const views={[label+'-full']:{image:v.renderer.domElement.toDataURL('image/png'),position:c.pos.toArray(),target:c.tgt.toArray()}};
          const at=new T.Vector3().fromArray(joints.leftShoulder).lerp(new T.Vector3().fromArray(joints.leftElbow),.35),grid=new T.GridHelper(1.2,24,0xdb4b4b,0xb6bec8);grid.position.set(-.30,0,.18);v.scene.add(grid);
          try{for(const [name,dir]of [['arm-side',[1,.05,.05]],['arm-front',[.05,.12,1]],['support-side',[0,.02,1]],['hand-side',[1,.04,.05]],['hand-palm',[0,1,.02]]]){const target=name==='support-side'?new T.Vector3(-.30,.25,.18):name.startsWith('hand-')?new T.Vector3().fromArray(joints.leftWrist).add(new T.Vector3(0,0,.06)):at,extent=name==='support-side'?.78:name.startsWith('hand-')?.13:.27,cam=new T.OrthographicCamera(-extent,extent,extent,-extent,.01,5);cam.position.copy(target).add(new T.Vector3(...dir).normalize().multiplyScalar(1.2));cam.lookAt(target);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);views[label+'-'+name]={image:v.renderer.domElement.toDataURL('image/png'),position:cam.position.toArray(),target:target.toArray(),groundGridY:0};}}finally{v.scene.remove(grid);grid.geometry.dispose();grid.material.dispose();}return views;
        }
        const baselineSolved=E.applyAt(baselineSpec,t,warm.baseline),baseline=structuredClone(v.motion.getMetrics().joints);
        __props.update();for(const o of window.__candidateProps)o.visible=false;for(const o of window.__baselineProps)o.visible=true;const baselineViews=capture?images('baseline-r5',baseline):{};
        const baselineSurface=capture?window.__ankleProbeSample(v,window.__webxrWristJoin,()=>window.__measureVisibleBodySurfaces({planeY:0,kneeRadius:.16})).rotations:null;
        for(const o of window.__candidateProps)o.visible=true;for(const o of window.__baselineProps)o.visible=false;const solved=E.applyAt(s,t,warm.candidate);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));__toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);if(s.renderAppearance?.highlight){const h=s.renderAppearance.highlight,u=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*u);__toonUni.uHiShade.value=h.shade.slice();}__props.update();v.coach.updateMatrixWorld(true);
        if(!capture)return{x:{baseline:baselineSolved.x,candidate:solved.x}};
        function handDetail(){const mesh=__v2p.hands.mesh,a=mesh.geometry.attributes,q=new T.Vector3(),vertices=[];mesh.skeleton.update();for(let id=0;id<a.position.count;id++){const weights=[];for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(id,k);if(w)weights.push({bone:mesh.skeleton.bones[a.skinIndex.getComponent(id,k)].name,weight:w});}if(!weights.some(w=>/^(left|v2p_L_)/.test(w.bone)))continue;mesh.getVertexPosition(id,q).applyMatrix4(mesh.matrixWorld);vertices.push({id,world:q.toArray(),weights});}vertices.sort((a,b)=>a.world[1]-b.world[1]);const bones={};v.coach.traverse(b=>{if(b.isBone&&(/^(leftHand|leftForearm|v2p_L_)/.test(b.name)))bones[b.name]={worldPosition:b.getWorldPosition(new T.Vector3()).toArray(),worldQuaternion:b.getWorldQuaternion(new T.Quaternion()).toArray()};});return{lowestVertices:vertices.slice(0,24),bones,mesh:mesh.name,limitations:['Native hand lowest-vertex subset, not full triangle collision.']};}
        function supportRegions(){const out={},q=new T.Vector3(),visible=new Set(window.__measureVisibleBodySurfaces().meshes.map(m=>m.name));v.coach.traverse(m=>{if(!m.isSkinnedMesh||!visible.has(m.name))return;for(let o=m;o;o=o.parent)if(!o.visible)return;m.skeleton.update();const g=m.geometry,a=g.attributes,materials=Array.isArray(m.material)?m.material:[m.material],visibleMaterial=x=>x&&x.visible!==false&&x.colorWrite!==false&&!(x.transparent&&x.opacity<=0),count=g.index?.count??a.position.count,start=Math.max(0,g.drawRange.start),end=Math.min(count,start+g.drawRange.count),ranges=Array.isArray(m.material)?g.groups.filter(x=>visibleMaterial(materials[x.materialIndex])):[{start:0,count}],drawn=new Set();for(const range of ranges)for(let k=Math.max(start,range.start);k<Math.min(end,range.start+range.count);k++)drawn.add(g.index?g.index.getX(k):k);for(const id of drawn){let dominant=null,weight=-1;for(let k=0;k<4;k++)if(a.skinWeight.getComponent(id,k)>weight){weight=a.skinWeight.getComponent(id,k);dominant=m.skeleton.bones[a.skinIndex.getComponent(id,k)].name;}if(!['head','leftThigh','leftUpperArm','leftForearm','leftHand'].includes(dominant))continue;m.getVertexPosition(id,q).applyMatrix4(m.matrixWorld);if(!out[dominant]||q.y<out[dominant].minY)out[dominant]={minY:q.y,world:q.toArray(),mesh:m.name,id};}});return out;}
        const actual=window.__ankleProbeSample(v,window.__webxrWristJoin,()=>({joints:structuredClone(v.motion.getMetrics().joints),bodySurface:window.__measureVisibleBodySurfaces({planeY:0,kneeRadius:.16}),ankle:structuredClone(window.__ankleJoinR5.last),upperArm:window.__upperArmContourR3.measure(),support: supportRegions(),handDetail:handDetail()})).rotations;
        const views={...baselineViews,...images('candidate-r6',actual.joints)};
        return{x:{baseline:baselineSolved.x,candidate:solved.x},warnings:solved.warn,metric:{frame,time:t,...actual,baselineJoints:baseline,baselineSurface},views};
      },{s,baselineSpec:prepared.spec,frame,warm,capture:wanted.has(frame),table});warm=result.x;if(result.metric)report.metrics.push(result.metric);
      fail(!report.pageErrors.length,'Page error: '+report.pageErrors.join('; '));
      if(wanted.has(frame)){
        const stem='frame-'+String(frame).padStart(4,'0');write(path.join(root,stem+'-surface.json'),result.metric.bodySurface);const views={};
        for(const [name,v]of Object.entries(result.views)){const bytes=Buffer.from(v.image.split(',')[1],'base64'),file=stem+'-'+name+'.png';fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});const {image,...camera}=v;views[name]={file,sha256:sha(bytes),...camera};}
        report.samples.push({frame,time:frame/30,warnings:result.warnings,surface:stem+'-surface.json',seamMaxGapMm:result.metric.ankle.seamMaxGapMm,views});console.log(JSON.stringify({event:'ankle-probe-pose',id:report.id,frame,seamMaxGapMm:result.metric.ankle.seamMaxGapMm,bodyMinY:result.metric.bodySurface.minY}));
      }
    }
    await model.verify();fail(fingerprint(prepared.specFile,prepared).sha256===pins.sha256,'Capture sources changed during probe');for(const p of extraPins)fail(sha(fs.readFileSync(path.join(REPO,p.path)))===p.sha256,'Probe or adapter changed during capture');
    report.complete=true;write(path.join(root,'probe.json'),report);return report;
  }catch(error){write(path.join(root,'failed.json'),{error:String(error),stack:error.stack,report});throw error;}
  finally{if(browser)await browser.close();if(owned)fs.unlinkSync(lock);}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2){fail(args[i].startsWith('--')&&args[i+1]&&!o[args[i]],'Expected unique --key value');o[args[i]]=args[i+1];}
  fail(!o['--adapter'],'Do not pass --adapter: joint components are selected by the recipe and installed exactly once');
  for(const key of ['--recipe','--runtime','--out'])fail(o[key],key+' required');
  await runProbe({recipeFile:o['--recipe'],runtimeFile:o['--runtime'],out:o['--out'],times:o['--times']?o['--times'].split(',').map(Number):[0,1.4],lane:Number(o['--lane']??1)});
}
