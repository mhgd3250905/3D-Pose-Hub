// Focused two-pose half-kneeling hand/foot geometry export. No source/model mutation or image postprocessing.
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
import {prepare as prepareAction,install as installAction,verify as verifyAction} from './native-action-hand-pose-r1.mjs';
import {measureFootSurfacesInPage} from './foot-surface.mjs';
// Native hand export adapted below for an actual body-part target, not a held prop.
import {measureVisibleBodySurfacesInPage} from './body-surface-floor-probe-r1.mjs';

const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const fail=(ok,message)=>{if(!ok)throw Error(message);};


// Actual corrected posterior ankle/shoe triangles; no synthetic cylinder stands in for contact geometry.
export function exportTargetsInPage(){
 const T=__toonT,v=flareInspector.viewer,ankle=v.coach.getObjectByName('leftFoot').getWorldPosition(new T.Vector3()),meshes=[];
 v.coach.traverse(m=>{if(!m.isSkinnedMesh||!m.visible||!['Coach_Sneakers','Coach_Soles','Coach_Shoe_Details','V2P_Base_Limbs'].includes(m.name))return;for(let a=m.parent;a;a=a.parent)if(!a.visible)return;
  m.skeleton.update();const g=m.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,positions=[],eligible=[];
  for(let i=0;i<p.count;i++){const q=m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);positions.push(q.toArray());let weight=0;for(let k=0;k<4;k++)if(/^left(Foot|Toe|Shin|LowerLeg)$/.test(m.skeleton.bones[si.getComponent(i,k)]?.name||''))weight+=sw.getComponent(i,k);eligible.push(weight>.5&&q.distanceTo(ankle)<.20);}
  const index=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i),faces=[];for(let i=0;i<index.length;i+=3){const f=index.slice(i,i+3);if(f.some(j=>eligible[j]))faces.push(f);}
  const ids=[...new Set(faces.flat())],remap=new Map(ids.map((id,i)=>[id,i]));meshes.push({name:m.name,sourceVertexIds:ids,positionsWorld:ids.map(i=>positions[i]),triangles:faces.map(f=>f.map(i=>remap.get(i))),limitations:['CPU-skinned corrected actual-draw surface; shader-only effects excluded.']});
 });return {stage:'scene.onAfterRender',leftAnkleWorld:ankle.toArray(),meshes};
}

export function exportHalfGripStateInPage({descriptor,sides,rig,frame,fps}) {
  const T = window.__toonT, v = flareInspector.viewer, V = window.__v2p, P = window.__props;
  if (!T || !V?.hands?.on || !V.hands.mesh.visible || window.__armfixR2?.handAsset!=='hands-native-c1r2-symmetric-r1') throw Error('Expected visible c1r2 on armfix');
  const H = V.hands.mesh, g = H.geometry, sk = H.skeleton, bs = sk.bones;
  if (bs.length!==52 || bs.filter(b=>/^v2p_[LR]_(thumb|index|middle|ring|pinky)[123]$/.test(b.name)).length!==30) throw Error('Expected 52 bones and 30 native finger bones');
  v.coach.updateMatrixWorld(true); H.updateMatrixWorld(true); sk.update();
  const indexOf = new Map(bs.map((b,i)=>[b,i]));
  const vector = a => new T.Vector3(...a);
  const attr = name => {const a=g.attributes[name];if(!a)throw Error('Missing hand geometry '+name);const out=[];for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)out.push(a.getComponent(i,k));return out;};
  const positions=attr('position'),normals=attr('normal'),skinIndex=attr('skinIndex'),skinWeight=attr('skinWeight');
  const world=[],q=new T.Vector3();
  for(let i=0;i<g.attributes.position.count;i++){H.getVertexPosition(i,q).applyMatrix4(H.matrixWorld);world.push(...q.toArray());}
  const bones=bs.map((b,i)=>({name:b.name,parentIndex:indexOf.get(b.parent)??-1,parentWorldMatrix:indexOf.has(b.parent)?null:b.parent.matrixWorld.toArray(),position:b.position.toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray(),matrixWorld:b.matrixWorld.toArray(),inverseBind:sk.boneInverses[i].toArray()}));
  const summary={},targets=[];
  for(const side of sides){
    const s=side==='left'?'L':'R',hb=v.coach.getObjectByName(side+'Hand'),inverse=hb.matrixWorld.clone().invert();
    const fingerNames=['thumb','index','middle','ring','pinky'];
    const all=[],palm=[],distal=Object.fromEntries(fingerNames.map(f=>[f,[]]));
    for(let i=0;i<g.attributes.position.count;i++){
      let best=-1,bone=-1;for(let k=0;k<4;k++){const w=skinWeight[4*i+k];if(w>best){best=w;bone=skinIndex[4*i+k];}}
      const name=bs[bone]?.name;if(name!==side+'Hand'&&!name?.startsWith('v2p_'+s+'_'))continue;
      all.push(i);q.fromArray(world,3*i).applyMatrix4(inverse);const longitudinal=q.x*(side==='left'?1:-1);
      if(name===side+'Hand'&&longitudinal>.035)palm.push(i);
      for(const f of fingerNames)if(name==='v2p_'+s+'_'+f+'3'){
        const b=V.bones[name],tip=rig.fingers[f].joints,delta=tip[3].map((x,k)=>(x-tip[2][k])*1*(side==='right'&&k===0?-1:1));
        const a=b.getWorldPosition(new T.Vector3()),end=vector(delta).applyMatrix4(b.matrixWorld).sub(a),d=vector(world.slice(3*i,3*i+3)).sub(a);
        if(d.dot(end)/end.lengthSq()>.55)distal[f].push(i);
      }
    }
    const currentFingerQuaternions={},fingerAnglesDegrees={};
    for(const f of fingerNames)for(let j=1;j<=3;j++){
      const name='v2p_'+s+'_'+f+j,b=V.bones[name];if(!b||!indexOf.has(b))throw Error('Finger reference differs from active hand skeleton');
      const a=b.quaternion.toArray();currentFingerQuaternions[f+j]=a;fingerAnglesDegrees[f+j]=2*Math.acos(Math.min(1,Math.abs(a[3])))*180/Math.PI;
    }
    const grip=P.gripData[side];
    const legacyGrip=grip?{centerWorld:grip.c.clone().applyQuaternion(hb.getWorldQuaternion(new T.Quaternion())).add(hb.getWorldPosition(new T.Vector3())).toArray(),axisWorld:grip.a.clone().applyQuaternion(hb.getWorldQuaternion(new T.Quaternion())).normalize().toArray(),radius:grip.r}:null;
    summary[side]={handBone:side+'Hand',handMatrixWorld:hb.matrixWorld.toArray(),handInverseWorld:inverse.toArray(),currentPose:V.cur[side],selectedByRuntime:V.pickHandPose(descriptor,side),currentFingerQuaternions,fingerAnglesDegrees,vertexGroups:{all,palm,distal},legacyGrip};
  }
  for(const object of P.list){
    const s=object.userData.spec;if(!s)continue;
    if(s.type==='band')for(const endpoint of ['from','to']){
      const ref=s[endpoint];if(!ref||Array.isArray(ref))continue;const side=sides.find(k=>ref.bone===k+'Hand');if(!side)continue;
      const center=P.pt(ref),other=P.pt(s[endpoint==='from'?'to':'from']);
      targets.push({side,kind:'band-end',endpoint,source:s,centerWorld:center.toArray(),leadDirectionWorld:other.clone().sub(center).normalize().toArray(),radius:s.r||.008,intendedGripAxisWorld:summary[side].legacyGrip?.axisWorld||null});
    }
    if(s.type==='dumbbell'){
      const side=sides.find(k=>s.attach===k+'Hand');if(!side)continue;
      const rod=object.children[0];if(rod?.geometry?.type!=='CylinderGeometry')throw Error('Unexpected dumbbell rod');
      targets.push({side,kind:'rod-cylinder',source:s,centerWorld:rod.getWorldPosition(new T.Vector3()).toArray(),axisWorld:new T.Vector3(0,1,0).applyQuaternion(rod.getWorldQuaternion(new T.Quaternion())).normalize().toArray(),radius:rod.geometry.parameters.radiusTop,length:rod.geometry.parameters.height});
    }
    if(s.type==='kettlebell'){
      const side=sides.find(k=>s.attach===k+'Hand');if(!side)continue;const handle=object.children[1],points=[];
      if(!handle?.geometry?.attributes?.position)throw Error('Kettlebell handle geometry missing');
      for(let i=0;i<handle.geometry.attributes.position.count;i++)points.push(...new T.Vector3().fromBufferAttribute(handle.geometry.attributes.position,i).applyMatrix4(handle.matrixWorld).toArray());
      targets.push({side,kind:'kettlebell-handle-mesh',source:s,positionsWorld:points,index:Array.from(handle.geometry.index.array)});
    }
  }
  if(descriptor.id!=='h-half-kneeling-quad-stretch-r6'||sides.length!==1||sides[0]!=='left')throw Error('Only rear-foot diagnostic r6 is supported');
  const rear=window.__halfGripTargets();if(!rear.meshes.length)throw Error('Actual rear-foot target surface missing');
  targets.push({side:'left',kind:'actual-rear-foot-surface',surfaceRecord:'outer contact.targets',ankleWorld:rear.leftAnkleWorld,meshNames:rear.meshes.map(m=>m.name)});
  return {format:'pose-hub-c1r2-grip-input@1',specId:descriptor.id,frame,fps,model:{profile:'training-human-v3-armfix',version:'0.1.0-r2',hand:'hands-native-c1r2-symmetric-r1',handScale:1},poseNames:Object.keys(V.poses),current:summary,targets,mesh:{name:H.name,positions,normals,index:Array.from(g.index.array),skinIndex,skinWeight,bones,bindMatrix:H.bindMatrix.toArray(),bindMatrixInverse:H.bindMatrixInverse.toArray(),matrixWorld:H.matrixWorld.toArray(),positionsWorld:world},rig:{palmar:rig.palmar,fingers:rig.fingers},limits:['World samples are actual CPU-skinned native hand surfaces; camera visibility and final shader displacement are not certified.','Palm and distal groups are index selections for fitting, not a claim of contact or collision pass.','Band end, actual rod and kettlebell handle use measured current prop transforms. A band end is not silently treated as a validated cylindrical handle.','No hand pose, bone, spec, prop or model source was changed by this export.']};
}

export async function runProbe({recipeFile,runtimeFile,out,times=[0,3.8],lane=1}){
  fail([1,2].includes(lane),'Only lane 1 or 2 allowed');
  const root=path.resolve(out),allowed=path.resolve('F:/PoseHub-v2-production/template-finalization-20261029/probes');
  fail(root.startsWith(allowed+path.sep)&&!fs.existsSync(root),'Use a new subdirectory under '+allowed);
  fail(os.freemem()/1024**3>=3.5,'Available physical memory below 3.5 GiB');
  const prepared=await prepareRecipe(recipeFile);verifyAction();const s=prepareAction(prepared.spec);
  fail(['h-half-kneeling-quad-stretch'].includes(prepared.recipe.id),'This diagnostic is restricted to half-kneeling rear-foot grip');
  fail(prepared.handSetup.adapter==='symmetric-native','This probe requires native support/rest hand modes');
  fail(times.length>0&&times.every(t=>Number.isFinite(t)&&t>=0&&t<=s.timeline.duration&&Math.abs(t*30-Math.round(t*30))<1e-8),'Times must be valid 30 FPS frame times');
  const runtime=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(runtime);
  // boot.mjs captures launch configuration at import time: pin it first.
  const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');await model.verify();
  const pins=fingerprint(prepared.specFile,prepared),extra=[fileURLToPath(import.meta.url)];
  extra.push(path.join(REPO,'tools/body-v3/armfix-r2/grip-symmetric-export.mjs'),path.join(REPO,'drill-anim/models/hands-native-c1r2-symmetric-r1/hands-rig.json'),path.join(REPO,'tools/action-completion-v3-r2/body-surface-floor-probe-r1.mjs'));
  extra.push(path.join(REPO,'tools/action-completion-v3-r2/native-action-hand-pose-r1.mjs'),path.join(REPO,'drill-anim/models/native-action-hand-pose-r1/manifest.json'));
  const extraPins=extra.map(p=>({path:path.relative(REPO,p).replaceAll('\\','/'),sha256:sha(fs.readFileSync(p))}));
  fs.mkdirSync(root,{recursive:true});write(path.join(root,'recipe.snapshot.json'),prepared.recipe);write(path.join(root,'effective-spec.snapshot.json'),s);write(path.join(root,'source-manifest.json'),{...pins,extra:extraPins});
  const lock=path.join(config().work_dir,lane===1?'completion-render.lock':'completion-render-lane2.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});
  let browser,owned=false;const report={format:'pose-hub-half-kneeling-native-grip-candidate-probe@2',id:prepared.recipe.id,recipeSha256:prepared.recipeSha256,times,sourceSha256:pins.sha256,extraPins,complete:false,samples:[],pageErrors:[]};
  try{
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,operation:'half-kneeling-grip-input-probe',out:root}),{flag:'wx'});owned=true;
    const temp=path.join(root,'work/browser-temp');fs.mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
    const theme=loadTheme(),opened=await model.boot({size:480,pr:1,theme});browser=opened.b;const page=opened.p;
    page.on('pageerror',e=>report.pageErrors.push(String(e)));
    report.runtime=await page.evaluate(()=>{const gl=flareInspector.viewer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,contextLost:gl.isContextLost()};});
    fail(browser.version()===runtime.browserVersion&&report.runtime.renderer===runtime.actualWebGLRenderer&&!report.runtime.contextLost,'Actual runtime differs from pinned runtime');
    report.model=await model.applyV3(page,s);
    const presets=await import('../../drill-anim/models/fixed-hand-presets-r1/loader.mjs');await presets.verify();const data=presets.data();
    if(Object.values(prepared.handSetup.modes).includes('support')){const support=await import('../body-v3/armfix-r2/support-install.mjs');report.support=await support.installSupport(page,data.support,{sourceId:data.handSource});}
    await page.evaluate(({rest,modes})=>{if(Object.values(modes).includes('relaxed'))__v2p.poses.relaxed=structuredClone(rest.relaxed);if(Object.values(modes).includes('assist'))__v2p.poses.open=structuredClone(rest.assist);},{rest:data.rest,modes:prepared.handSetup.modes});
    report.nativeAction=await installAction(page,s.actionCorrective);
    if(s.renderAppearance?.highlight?.material)report.highlight=await page.evaluate(installHighlightMaterial,s.renderAppearance.highlight.material);
    report.recipeCorrections=await installCorrections(page,prepared.recipe);
    await page.evaluate(rig=>{window.__halfGripRig=rig;},readJson(path.join(REPO,'drill-anim/models/hands-native-c1r2-symmetric-r1/hands-rig.json')));
    await page.addScriptTag({content:'window.__exportHalfGripState='+exportHalfGripStateInPage.toString()+';window.__halfGripTargets='+exportTargetsInPage.toString()+';window.__halfBody='+measureVisibleBodySurfacesInPage.toString()+';'});
    await page.addScriptTag({content:'window.__chairProbeSample = '+sampleActualRender.toString()+';window.__chairProbeFeet = '+measureFootSurfacesInPage.toString()+';'});
    await page.evaluate(([s,theme,scale])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.scene.background=null;v.renderer.setClearColor(0xedf0f4,1);for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;__setHighlight(s.highlight||{groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uSinkK.value=s.clothSink??1;for(const p of s.props||[])__props.add(theme,p);if(s.camera.fov){v.camera.fov=s.camera.fov;v.camera.updateProjectionMatrix();}__drill.setupCamera(s,480);const c=__drill.cam0;c.pos.copy(c.tgt.clone().add(c.pos.clone().sub(c.tgt).multiplyScalar(scale)));v.motion.reset();},[s,theme,prepared.cameraScale]);
    const wanted=new Set(times.map(t=>Math.round(t*30))),end=Math.max(...wanted);let warm=null;
    for(let frame=0;frame<=end;frame++){
      fail(os.freemem()/1024**3>=2,'Available physical memory below 2 GiB');
      const result=await page.evaluate(({s,frame,warm,capture})=>{
        const v=flareInspector.viewer,T=__toonT,E=__drill,t=frame/30,solved=E.applyAt(s,t,warm);__toonUni.uBreath.value=(s.breath??.0018)*Math.sin(2*Math.PI*t/(s.timeline.duration/2));__toonUni.uPulse.value=E.pulseAt(s.highlight,s.timeline,t);
        if(s.renderAppearance?.highlight){const h=s.renderAppearance.highlight,p=Math.min(1,Math.max(0,__toonUni.uPulse.value));__toonUni.uHiC.value=new T.Color(h.color).multiplyScalar(h.intensity[0]+(h.intensity[1]-h.intensity[0])*p);__toonUni.uHiShade.value=h.shade.slice();}
        __props.update();v.coach.updateMatrixWorld(true);if(!capture)return {x:solved.x};
        const c=E.cam0;v.camera.position.copy(c.pos);v.camera.lookAt(c.tgt);v.camera.updateMatrixWorld();
        const actual=window.__chairProbeSample(v,null,()=>({nativeAction:window.__nativeActionHandPoseR1.verifyApplied(),handInput:window.__exportHalfGripState({descriptor:s,sides:['left'],rig:window.__halfGripRig,frame,fps:30}),targets:window.__halfGripTargets(),bodySurface:window.__halfBody(),footSurface:window.__chairProbeFeet(),jointCorrections:{upperArm:window.__upperArmContourR3?.measure()??null,ankle:window.__ankleJoinR5?.last??null}})),views={full:{image:v.renderer.domElement.toDataURL('image/png'),position:c.pos.toArray(),target:c.tgt.toArray(),fov:v.camera.fov}};
        for(const side of ['left','right'])for(const kind of ['front','side','back']){
          const sign=side==='left'?1:-1,at=v.coach.getObjectByName(side+'Hand').getWorldPosition(new T.Vector3()).add(new T.Vector3(0,-.03,0));
          const dir=(kind==='front'?new T.Vector3(sign*.8,.32,1):kind==='back'?new T.Vector3(-sign*.8,.32,-1):new T.Vector3(sign,.18,-.08)).normalize(),cam=new T.PerspectiveCamera(32,1,.01,20);
          cam.position.copy(at).addScaledVector(dir,.68);cam.lookAt(at);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);window.__nativeActionHandPoseR1.verifyApplied();
          views[side+'-'+kind]={image:v.renderer.domElement.toDataURL('image/png'),position:cam.position.toArray(),target:at.toArray(),fov:cam.fov};
        }
        return {x:solved.x,warnings:solved.warn,contact:actual.rotations,views};
      },{s,frame,warm,capture:wanted.has(frame)});warm=result.x;
      fail(!report.pageErrors.length,'Page error: '+report.pageErrors.join('; '));
      if(wanted.has(frame)){
        const stem='frame-'+String(frame).padStart(4,'0');write(path.join(root,stem+'-contact.json'),result.contact);const views={};
        for(const [name,v]of Object.entries(result.views)){const bytes=Buffer.from(v.image.split(',')[1],'base64'),file=stem+'-'+name+'.png';fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});const {image,...camera}=v;views[name]={file,sha256:sha(bytes),...camera};}
        report.samples.push({frame,time:frame/30,warnings:result.warnings,contact:stem+'-contact.json',views});console.log(JSON.stringify({event:'half-kneeling-grip-input-pose',id:report.id,frame}));
      }
    }
    await model.verify();verifyAction();fail(fingerprint(prepared.specFile,prepared).sha256===pins.sha256,'Capture sources changed during probe');for(const p of extraPins)fail(sha(fs.readFileSync(path.join(REPO,p.path)))===p.sha256,'Probe or adapter changed during capture');
    report.complete=true;write(path.join(root,'probe.json'),report);return report;
  }catch(error){write(path.join(root,'failed.json'),{error:String(error),stack:error.stack,report});throw error;}
  finally{if(browser)await browser.close();if(owned)fs.unlinkSync(lock);}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2){fail(args[i].startsWith('--')&&args[i+1]&&!o[args[i]],'Expected unique --key value');o[args[i]]=args[i+1];}
  for(const key of ['--recipe','--runtime','--out'])fail(o[key],key+' required');
  await runProbe({recipeFile:o['--recipe'],runtimeFile:o['--runtime'],out:o['--out'],times:o['--times']?o['--times'].split(',').map(Number):[0,3.8],lane:Number(o['--lane']??1)});
}
