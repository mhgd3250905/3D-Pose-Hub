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
import {install as installFootFollow} from './mountain-airborne-foot-r2.mjs';
import {measureFootSurfacesInPage} from './foot-surface.mjs';
import {measureVisibleBodySurfacesInPage} from './body-surface-floor-probe-r1.mjs';
import candidateSpec from '../../drill-anim/specs/h-mountain-climber-r8.js';
import {install as installBaselineFootFollow} from './mountain-airborne-foot-r1.mjs';

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

export async function runProbe({recipeFile,runtimeFile,out,times=[0,35/30,36/30,48/30,155/30,156/30,168/30],lane=1}){
  fail([1,2].includes(lane),'Only lane 1 or 2 allowed');
  const root=path.resolve(out),allowed=path.resolve('F:/PoseHub-v2-production/template-finalization-20261029/probes');
  fail(root.startsWith(allowed+path.sep)&&!fs.existsSync(root),'Use a new subdirectory under '+allowed);
  fail(os.freemem()/1024**3>=3.5,'Available physical memory below 3.5 GiB');
  const prepared=await prepareRecipe(recipeFile),s=adaptRecipe(candidateSpec,prepared.recipe).spec;
  fail(prepared.recipe.id==='h-mountain-climber','Mountain-only candidate');
  fail(JSON.stringify(s.qa)===JSON.stringify(prepared.spec.qa)&&JSON.stringify(s.timeline)===JSON.stringify(prepared.spec.timeline),'Original QA/timing changed');
  s.id=candidateSpec.id;s.actionCorrective=candidateSpec.actionCorrective;
  fail(prepared.handSetup.adapter!=='webxr-dumbbell-wrist-r1','Fixed grasp needs a composition-aware remapped probe; use the finalization renderer for this path');
  fail(new Set(["h-band-biceps-curl", "h-chair-elbow-triceps-stretch", "h-db-overhead-shrug", "h-db-reverse-curl", "h-db-zottman-curl", "h-half-kneeling-quad-stretch", "h-standing-arm-extension-stretch", "h-supine-cactus-chest", "h-bear-plank", "h-biceps-self", "h-bridge-overhead", "h-crossbody", "h-inner-thigh", "h-kb-swing", "h-mountain-climber", "h-open-book", "h-pike-pushup", "h-reverse-lunge", "h-towel-behind", "h-towel-pass", "h-towel-pulldown", "h-wall-pec", "t-flare-side-hold", "t-lsit-open-close", "t-lsit-tuck", "t-lsit-vsit-circles", "t-lsit-wide", "t-seated-straddle-ext", "t-seated-straddle-lifts", "t-straddle-hold", "t-tuck-planche", "t-vsit"]).has(prepared.recipe.id),'Probe scope is the32 finalization templates');
  fail(times.length>0&&times.every(t=>Number.isFinite(t)&&t>=0&&t<=s.timeline.duration&&Math.abs(t*30-Math.round(t*30))<1e-8),'Times must be valid 30 FPS frame times');
  const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);
  // boot.mjs captures launch configuration at import time: pin it first.
  const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');await model.verify();
  const pins=fingerprint(prepared.specFile,prepared),extra=[fileURLToPath(import.meta.url),path.join(REPO,'tools/action-completion-v3-r2/mountain-airborne-foot-r2.mjs'),path.join(REPO,'drill-anim/specs/h-mountain-climber-r8.js'),path.join(REPO,'tools/action-completion-v3-r2/body-surface-floor-probe-r1.mjs'),path.join(REPO,'tools/action-completion-v3-r2/mountain-airborne-foot-r1.mjs')];
  const extraPins=extra.map(p=>({path:path.relative(REPO,p).replaceAll('\\','/'),sha256:sha(fs.readFileSync(p))}));
  fs.mkdirSync(root,{recursive:true});write(path.join(root,'recipe.snapshot.json'),prepared.recipe);write(path.join(root,'effective-spec.snapshot.json'),s);write(path.join(root,'source-manifest.json'),{...pins,extra:extraPins});
  const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});
  let browser,owned=false;const report={format:'pose-hub-mountain-r8-knee-floor-keyframe-probe@3',id:prepared.recipe.id,recipeSha256:prepared.recipeSha256,times,sourceSha256:pins.sha256,extraPins,complete:false,metrics:[],samples:[],pageErrors:[],componentSource:'recipe.jointCorrections; installed once'};
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
    report.baselineCorrective=await installBaselineFootFollow(page);report.actionCorrective=await installFootFollow(page);
    await page.addScriptTag({content:'window.__mountainMeasureFoot = '+measureFootSurfacesInPage.toString()+';'});
    report.adapter=report.jointCorrections.find(c=>c.profile.startsWith('ankle-join-'))?.setup??null;
    const seam=readJson(path.join(REPO,'drill-anim/models/training-human-v2plus-limbs-base.json')).seam;
    const table=seam.ring.flatMap((r,i)=>/^ankle_(left|right)$/.test(r)?[[r,seam.vid[i],seam.first+i]]:[]);fail(table.length===56,'Expected 56 source seam pairs');
    await page.addScriptTag({content:'window.__ankleProbeRead = '+readAnkleGeometryInPage.toString()+'; window.__ankleProbeSample = '+sampleActualRender.toString()+';'});
    await page.addScriptTag({content:'window.__measureVisibleBodySurfaces = '+measureVisibleBodySurfacesInPage.toString()+';'});
    await page.evaluate(([s,theme,scale])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0xedf0f4,1);for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;__setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uSinkK.value=s.clothSink??1;for(const p of s.props||[])__props.add(theme,p);if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,480);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));v.motion.reset();},[s,theme,prepared.cameraScale]);
    const wanted=new Set(times.map(t=>Math.round(t*30))),end=Math.max(...wanted);let warm={baseline:null,candidate:null};
    for(let frame=0;frame<=end;frame++){
      fail(os.freemem()/1024**3>=2,'Available physical memory below 2 GiB');
      const result=await page.evaluate(({s,baselineSpec,frame,warm,capture,table})=>{
        const v=flareInspector.viewer,T=__toonT,E=__drill,t=frame/30;
        const original=structuredClone(baselineSpec);original.id='h-mountain-climber-r7';
        const baselineSolved=E.applyAt(original,t,warm.baseline),baseline=structuredClone(v.motion.getMetrics().joints);
        const baseFoot=Object.fromEntries(['left','right'].map(side=>[side,v.coach.getObjectByName(side+'Foot').getWorldQuaternion(new T.Quaternion()).toArray()]));
        function sideReference(joints,label){
          const active=frame<120?'right':'left',support=active==='right'?'left':'right',shoulder=new T.Vector3().fromArray(joints.shoulderCenter),hip=new T.Vector3().fromArray(joints.leftHip).add(new T.Vector3().fromArray(joints.rightHip)).multiplyScalar(.5),ankle=new T.Vector3().fromArray(joints[support+'Ankle']),at=new T.Vector3(.6,.34,0),cam=new T.OrthographicCamera(-.82,.82,.82,-.82,.01,10),lines=[];
          for(const [pts,color]of [[[shoulder,ankle],0xe16445],[[shoulder,hip,ankle],0x208bad]]){const g=new T.BufferGeometry().setFromPoints(pts),m=new T.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.85}),line=new T.Line(g,m);line.renderOrder=999;v.scene.add(line);lines.push(line);}
          cam.position.copy(at).add(new T.Vector3(0,0,active==='right'?-3:3));cam.lookAt(at);cam.updateMatrixWorld();let image;try{v.renderer.render(v.scene,cam);image=v.renderer.domElement.toDataURL('image/png');}finally{for(const line of lines){v.scene.remove(line);line.geometry.dispose();line.material.dispose();}}
          return{image,position:cam.position.toArray(),target:at.toArray(),fov:null,label,straightReference:'orange shoulder-support ankle',bodyChain:'blue shoulder-hip-support ankle',referencePoints:{shoulder:shoulder.toArray(),hip:hip.toArray(),supportAnkle:ankle.toArray()}};
        }
        const baselineView=capture?sideReference(baseline,'original-r7'):null;
        const solved=E.applyAt(s,t,warm.candidate);
        if(!solved.params||!window.__mountainFootFollowR2.last)throw Error('Required airborne foot correction did not run');
        const expectedFoot=Object.fromEntries(['left','right'].map(side=>[side,v.coach.getObjectByName(side+'Foot').getWorldQuaternion(new T.Quaternion()).toArray()]));__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));__toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);
        if(s.renderAppearance?.highlight){const h=s.renderAppearance.highlight,p=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*p);__toonUni.uHiShade.value=h.shade.slice();}
        __props.update();v.coach.updateMatrixWorld(true);if(!capture)return {x:{baseline:baselineSolved.x,candidate:solved.x}};
        const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
        const actual=window.__ankleProbeSample(v,window.__webxrWristJoin,()=>{const joints=structuredClone(v.motion.getMetrics().joints),differences={};for(const name of Object.keys(baseline))if(!/Toe|Heel/.test(name))differences[name]=new T.Vector3().fromArray(joints[name]).distanceTo(new T.Vector3().fromArray(baseline[name]))*1000;const feet=Object.fromEntries(['left','right'].map(side=>[side,{worldQuaternion:v.coach.getObjectByName(side+'Foot').getWorldQuaternion(new T.Quaternion()).toArray(),baselineQuaternion:baseFoot[side],expectedQuaternion:expectedFoot[side]}]));return {metric:{frame,time:t,joints,baselineJoints:baseline,jointDifferencesMm:differences,feet,bodySurface:window.__measureVisibleBodySurfaces({planeY:0,kneeRadius:.16}),footSurface:window.__mountainMeasureFoot(),ankle:structuredClone(window.__ankleJoinR5.last),corrective:structuredClone(window.__mountainFootFollowR2.last)}};});
        if(!capture)return {x:{baseline:baselineSolved.x,candidate:solved.x},metric:actual.rotations.metric};
        const views={baselineSide:baselineView,candidateSide:sideReference(actual.rotations.metric.joints,'candidate-r8'),full:{image:v.renderer.domElement.toDataURL('image/png'),position:c.pos.toArray(),target:c.tgt.toArray(),fov:v.camera.fov}};
        const side=frame<120?'right':'left',at=new T.Vector3().fromArray(actual.rotations.metric.joints[side+'Knee']);
        const grid=new T.GridHelper(1.2,24,0xdb4b4b,0xb6bec8);grid.position.set(at.x,0,at.z);grid.material.transparent=true;grid.material.opacity=.45;v.scene.add(grid);
        try{for(const [view,dir]of [['knee-side',[0,.08,side==='right'?-1:1]],['knee-front',[-1,.08,0]]]){
          const cam=new T.OrthographicCamera(-.19,.19,.19,-.19,.01,5);cam.position.copy(at).add(new T.Vector3(...dir).normalize().multiplyScalar(.8));cam.lookAt(at);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);views[view]={image:v.renderer.domElement.toDataURL('image/png'),position:cam.position.toArray(),target:at.toArray(),fov:null,groundGridY:0};
        }}finally{v.scene.remove(grid);grid.geometry.dispose();grid.material.dispose();}
        return {x:{baseline:baselineSolved.x,candidate:solved.x},warnings:solved.warn,metric:actual.rotations.metric,views};
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
  await runProbe({recipeFile:o['--recipe'],runtimeFile:o['--runtime'],out:o['--out'],times:o['--times']?o['--times'].split(',').map(Number):[0,35/30,36/30,48/30,155/30,156/30,168/30],lane:Number(o['--lane']??1)});
}
