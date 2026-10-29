// Versioned composition only. Frozen deformation kernels and wrist checks stay intact.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {install as installContour} from './upper-arm-contour-r3.mjs';
import {install as installWrist,verify as verifyWrist} from '../body-v3/webxr-wrist-join-r1/loader.mjs';
import {makeAnkleJoinMath,fairAnkleContours,makeAnkleSectionField,installAnkleJoinInPage} from './ankle-join-r5.mjs';
import {install as installElbow} from './elbow-dqs-r1.mjs';

export function remapRequiredSourceIds(records,required,sourceCount){
  const found=new Map();
  for(let i=0;i<records.length;i++){
    const source=records[i]?.source;
    if(!Array.isArray(source)||!source.length)throw Error('Missing vertex source mapping');
    let sum=0;for(const row of source){if(!Array.isArray(row)||row.length!==2||!Number.isInteger(row[0])||row[0]<0||row[0]>=sourceCount||!Number.isFinite(row[1])||row[1]<0)throw Error('Invalid vertex source mapping');sum+=row[1];}
    if(Math.abs(sum-1)>1e-8)throw Error('Non-unit source mapping');
    if(source.length===1&&source[0][1]===1){const id=source[0][0];if(!found.has(id))found.set(id,[]);found.get(id).push(i);}
  }
  return Object.fromEntries([...new Set(required)].map(id=>{if(found.get(id)?.length!==1)throw Error('Required seam source must map one-to-one: '+id);return [id,found.get(id)[0]];}));
}

// Install the wrist around gate.forward, then install dynamic wrappers around
// base. gate.target becomes that dynamic chain: wrist -> dynamic -> base.
// Thus dynamic finally/restore completes before wrist finally/hash checks.
export function createRenderGate(base){
  const gate={base,target:base,depth:0};
  gate.forward=function(...args){gate.depth++;try{return gate.target.apply(this,args);}finally{gate.depth--;}};
  return gate;
}

export function assertBoundaryUnchanged(before,after){
  if(before.length!==after.length||before.some((v,i)=>!Number.isFinite(v)||v!==after[i]))throw Error('Contour changed protected wrist boundary');
  return true;
}

export function verify(){
  const manifest=JSON.parse(fs.readFileSync(new URL('../../drill-anim/models/fixed-wrist-corrections-r1/manifest.json',import.meta.url),'utf8'));
  for(const [file,want]of Object.entries(manifest.sha256Lf)){
    const text=fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8').replaceAll('\r\n','\n');
    if(crypto.createHash('sha256').update(text).digest('hex')!==want)throw Error('Fixed composition source pin changed: '+file);
  }
  return manifest;
}

export async function install(page,{upperArm=true,ankle=true,elbow=false,showDumbbells=true}={}){
  verify();
  const payload=verifyWrist(),recipe=payload.recipe;
  const limbs=JSON.parse(fs.readFileSync(new URL('../../drill-anim/models/training-human-v2plus-limbs-base.json',import.meta.url),'utf8'));
  const torso=JSON.parse(fs.readFileSync(new URL('../../drill-anim/models/training-human-v2plus-torso-base.json',import.meta.url),'utf8'));
  const ls=limbs.seam,ts=torso.seam;
  const anklePairs=ls.ring.flatMap((name,i)=>/^ankle_(left|right)$/.test(name)?[[name.slice(6),ls.vid[i],ls.first+i]]:[]);
  const lookup=new Map(ls.vid.map((id,i)=>[ls.mesh[i]+':'+id,ls.first+i]));
  const possibleCuff=ts.vid.flatMap((id,i)=>lookup.has(ts.mesh[i]+':'+id)?[[ts.first+i,lookup.get(ts.mesh[i]+':'+id)]]:[]);
  const boundaryOutputIds=[...new Set(Object.values(recipe.meshes.limbs.boundary).flatMap(x=>x.coincidentVertexIds?.flat()??x.vertexIds))];
  const boundarySources=[...new Set(boundaryOutputIds.flatMap(i=>recipe.meshes.limbs.vertices[i].source.map(x=>x[0])))];
  // Some torso seam rows belong to clipped wrists; select upper-arm pairs below
  // before asking for a bijective map. Ankle pairs are always retained.
  await page.addScriptTag({content:'window.__fixedCorrectionGateFactory='+createRenderGate.toString()+';window.__fixedCorrectionBoundaryCheck='+assertBoundaryUnchanged.toString()+';'});
  const initial=await page.evaluate(({torsoCount,possibleCuff,boundarySources})=>{
    const v=flareInspector.viewer,L=__v2p.limbs.mesh,T=__collarShared.mesh;
    if(window.__fixedWristCorrectionsR1||window.__webxrWristJoin||window.__upperArmContourR1||window.__upperArmContourR2||window.__upperArmContourR3||window.__ankleJoinR5||window.__elbowDqsR1)throw Error('Fixed composition requires fresh armfix page');
    const offset=T.geometry.attributes.position.count-torsoCount,a=T.geometry.attributes;
    const pairs=possibleCuff.flatMap(([ti,li])=>{ti+=offset;const w=[];for(let k=0;k<4;k++)if(a.skinWeight.getComponent(ti,k)>1e-8)w.push([T.skeleton.bones[a.skinIndex.getComponent(ti,k)].name,a.skinWeight.getComponent(ti,k)]);return w.length===1&&/^(left|right)UpperArm$/.test(w[0][0])?[[w[0][0].replace('UpperArm',''),ti,li]]:[];});
    if(pairs.length!==56)throw Error('Expected 56 original cuff pairs');
    const boundary=()=>boundarySources.flatMap(i=>['position','normal'].flatMap(n=>[0,1,2].map(k=>L.geometry.attributes[n].getComponent(i,k))));
    window.__fixedWristCorrectionsR1={phase:'preparing',sourceGeometry:L.geometry,boundaryBefore:boundary(),boundaryRead:boundary,pairs,gate:__fixedCorrectionGateFactory(v.renderer.render),originalBefore:v.scene.onBeforeRender,originalAfter:v.scene.onAfterRender};
    return {pairs,sourceCount:L.geometry.attributes.position.count};
  },{torsoCount:torso.n,possibleCuff,boundarySources});
  if(initial.sourceCount!==recipe.sourcePins.limbs.sourceVertices)throw Error('Fixed composition source vertex count mismatch');
  const mapping=remapRequiredSourceIds(recipe.meshes.limbs.vertices,[...(upperArm?initial.pairs.map(x=>x[2]):[]),...(ankle?anklePairs.map(x=>x[2]):[])],initial.sourceCount);
  const setup={profile:'fixed-wrist-corrections-r1',version:'0.1.0-r1',upperArm,ankle,elbow,showDumbbells};
  try{
    if(upperArm)setup.upperArmSetup=await installContour(page);
    await page.evaluate(()=>{const s=__fixedWristCorrectionsR1;__fixedCorrectionBoundaryCheck(s.boundaryBefore,s.boundaryRead());s.contour=window.__upperArmContourR3??null;s.contourMeasure=s.contour?.measure;flareInspector.viewer.renderer.render=s.gate.forward;});
    setup.wristSetup=await installWrist(page,{showDumbbells});
    await page.evaluate(({mapping,outputCount})=>{
      const s=__fixedWristCorrectionsR1,v=flareInspector.viewer,L=__v2p.limbs.mesh,T=window.__toonT;
      if(L.geometry===s.sourceGeometry||L.geometry.attributes.position.count!==outputCount)throw Error('Unexpected fixed wrist topology');
      s.wristRender=v.renderer.render;s.wristBefore=v.scene.onBeforeRender;s.wristAfter=v.scene.onAfterRender;
      s.mappedPairs=s.pairs.map(([side,ti,li])=>[side,ti,mapping[li]]);
      if(s.contour){s.contour.measure=()=>{
        const torso=__collarShared.mesh;v.coach.updateMatrixWorld(true);for(const m of [torso,L]){m.updateMatrixWorld(true);m.skeleton.update();}
        let maxSeamGapMm=0;for(const [,ti,li]of s.mappedPairs){const a=torso.getVertexPosition(ti,new T.Vector3()).applyMatrix4(torso.matrixWorld),b=L.getVertexPosition(li,new T.Vector3()).applyMatrix4(L.matrixWorld);maxSeamGapMm=Math.max(maxSeamGapMm,a.distanceTo(b)*1000);}
        if(!Number.isFinite(maxSeamGapMm)||maxSeamGapMm>.01)throw Error('Mapped cuff seam exceeded 0.01 mm');
        return {maxSeamGapMm,seamPairs:s.mappedPairs.length,stress:false,maxRestMoveMm:s.contour.config.maxMoveMm,topology:'fixed-wrist-one-to-one-remap'};
      };s.contour.measure();}
      // Dynamic wrappers must close over base, not wrist. Scene hooks still
      // chain wrist.before/after, so measurements see all current deformations.
      v.renderer.render=s.gate.base;s.phase='installing-dynamic';
    },{mapping,outputCount:recipe.meshes.limbs.vertices.length});
    if(ankle){
      await page.addScriptTag({content:'window.__makeAnkleJoinMath='+makeAnkleJoinMath.toString()+';window.__fairAnkleContours='+fairAnkleContours.toString()+';window.__makeAnkleSectionField='+makeAnkleSectionField.toString()+';'});
      setup.ankleSetup=await page.evaluate(installAnkleJoinInPage,{pairs:anklePairs.map(([side,bi,li])=>[side,bi,mapping[li]])});
    }
    if(elbow)setup.elbowSetup=await installElbow(page);
    return await page.evaluate(setup=>{
      const s=__fixedWristCorrectionsR1,v=flareInspector.viewer;
      s.dynamicRender=v.renderer.render;s.gate.target=s.dynamicRender;v.renderer.render=s.wristRender;s.phase='ready';s.config=setup;
      s.measure=()=>{if(s.phase!=='ready')throw Error('Composition not ready');const wrist=__webxrWristJoin.lastRestoreCheck;if(wrist&&(!wrist.positionsNormalsExact||!wrist.boneTransformsExact||!wrist.cacheExact))throw Error('Frozen wrist restore checks failed');return {upperArm:s.contour?.measure()??null,wristRestore:wrist??null,phase:s.phase};};
      s.detach=()=>{
        if(s.gate.depth)throw Error('Cannot detach while rendering');if(v.renderer.render!==s.wristRender)throw Error('Detach later render hooks first');
        v.renderer.render=s.dynamicRender;
        if(setup.elbow){__elbowDqsR1.detach();delete window.__elbowDqsR1;}
        if(setup.ankle){__ankleJoinR5.detach();delete window.__ankleJoinR5;}
        v.renderer.render=s.wristRender;__webxrWristJoin.detach();
        v.renderer.render=s.gate.base;
        if(s.contour){s.contour.measure=s.contourMeasure;s.contour.detach();}
        s.phase='detached';delete window.__fixedWristCorrectionsR1;return {detached:true};
      };
      return {...setup,cuffPairsRemapped:s.contour?s.mappedPairs.length:0,protectedWristBoundaryUnchanged:true,renderOrder:'wrist -> dynamic corrections -> original render; restore reverses order',reviewed:false};
    },setup);
  }catch(error){
    // An installer can fail before exposing its closure. Such a page must be
    // discarded; never pretend an incomplete installation is reusable.
    await page.evaluate(()=>{if(window.__fixedWristCorrectionsR1)__fixedWristCorrectionsR1.phase='failed-discard-page';}).catch(()=>{});
    throw Error('Fixed correction installation failed; discard this page: '+error.message,{cause:error});
  }
}
