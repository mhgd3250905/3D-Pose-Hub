// Standalone new calibration on the independently verified scale-1 armfix base.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verify as verifyBase} from '../../../drill-anim/models/training-human-v3-armfix-r1/verify.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const json=rel=>JSON.parse(fs.readFileSync(path.join(repo,rel),'utf8'));
const digest=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const pin=rel=>{const raw=fs.readFileSync(path.join(repo,rel));return {path:rel,bytes:raw.length,sha256:digest(raw)};};
export const CONTACT_ENTRY='training-human-v3-armfix-contact-r2';

export function checkSpec(spec,{handScale=1,neckShare=.5}={}){
  if(handScale!==1||!spec||spec.modelProfile!=='training-human-v2plus-hands-native'||['torso','limbs','hands'].some(k=>spec.v2plus?.[k]!=='base'))throw Error('armfix-contact requires scale-1 full native descriptor');
  if(!Number.isFinite(neckShare)||neckShare<0||neckShare>1)throw Error('armfix-contact invalid neckShare');
  if(spec.neck!==undefined){
    if(!spec.neck||typeof spec.neck!=='object'||Array.isArray(spec.neck))throw Error('armfix-contact neck must be an object');
    for(const[key,value]of Object.entries(spec.neck)){
      if(!['flex','side','rot'].includes(key))throw Error('armfix-contact unknown neck channel');
      if(typeof value==='number'){if(!Number.isFinite(value))throw Error('armfix-contact nonfinite neck angle');continue;}
      const track=typeof value==='string'?value:value?.track;
      if(typeof track!=='string'||!spec.timeline?.tracks?.[track])throw Error('armfix-contact missing neck track');
      if(typeof value==='object'&&(!Number.isFinite(value.scale??1)||!Number.isFinite(value.offset??0)))throw Error('armfix-contact invalid neck transform');
    }
  }
  return spec;
}

export function independentGuardInputs(){
  const meshPath='drill-anim/models/hands-native-c1r2/hands-base.json',rigPath='drill-anim/models/hands-native-c1r2/hands-rig.json';
  const mesh=json(meshPath),rig=json(rigPath),reset=json('tools/body-v3/reset-joints-v2.json');
  const recipe=json('runtime/public/coach-v3-armfix-r1/coach-rig.json');
  if(recipe.v3.segmentScale.upperArm!==1||recipe.v3.segmentScale.forearm!==1||recipe.v3.armfix.handScale!==1)throw Error('armfix-contact authority is not scale1');
  const fingerRest={},armVectors={};
  for(const side of['left','right']){
    const sign=side==='left'?1:-1;fingerRest[side]={};
    for(const[finger,data]of Object.entries(rig.fingers))for(let j=0;j<3;j++){
      const position=data.joints[j].map((value,k)=>(value-(j?data.joints[j-1][k]:0))*(k===0?sign:1));
      fingerRest[side][finger+(j+1)]={position,parent:j?'v2p_'+(side==='left'?'L':'R')+'_'+finger+j:side+'Hand'};
    }
    armVectors[side]={upperArm:reset[side+'Elbow'].map((x,k)=>x-reset[side+'Shoulder'][k]),forearm:reset[side+'Wrist'].map((x,k)=>x-reset[side+'Elbow'][k])};
  }
  const sourcePaths=[meshPath,rigPath,'tools/body-v3/reset-joints-v2.json','runtime/public/coach-v3-armfix-r1/coach-rig.json','drill-anim/models/training-human-v3-armfix-r1/manifest.json'];
  return {guard:{format:'pose-hub-armfix-contact-guard@1',handScale:1,boneNames:mesh.bones,
    handMesh:{n:mesh.n,u16:mesh.pos.u16,lo:mesh.pos.lo,scale:mesh.pos.scale,seamFirst:mesh.seam.first},
    fingerRest,armVectors,palmPose:rig.poses['palm-floor'],sourcePins:sourcePaths.map(pin)},
    rig:{palmar:rig.palmar,fingers:Object.fromEntries(Object.entries(rig.fingers).map(([name,f])=>[name,{flexAxis:f.flexAxis,joints:f.joints}]))}};
}

export async function install(page,spec,options={}){
  checkSpec(spec,options);await verifyBase();
  const inputs=independentGuardInputs(),neckShare=options.neckShare??.5;
  const before=await page.evaluate(()=>{
    const H=window.__v2p?.hands?.mesh;
    if(!H||window.__armfixContactUsedR2||window.__v3ContactR5)throw Error('armfix-contact requires fresh scale-1 base');
    window.__armfixContactInstallSnapshot={mesh:H,bones:H.skeleton.bones.slice(),parents:H.skeleton.bones.map(b=>b.parent),
      local:H.skeleton.bones.map(b=>[b.position.toArray(),b.quaternion.toArray(),b.scale.toArray()]),cur:__v2p.cur,curJson:JSON.stringify(__v2p.cur),
      ground:flareInspector.viewer.motion.getGroundHandPose,pose:__drill.pose,setHandPose:__v2p.setHandPose,palm:__v2p.poses['palm-floor'],poseKeys:Object.keys(__v2p.poses).sort().join('|')};
    return {bones:H.skeleton.bones.length};
  });
  try{
    await page.addScriptTag({content:fs.readFileSync(path.join(here,'contact-guard-runtime.js'),'utf8')});
    await page.addScriptTag({content:fs.readFileSync(path.join(here,'contact-runtime.js'),'utf8')});
    const report=await page.evaluate(([s,o])=>window.__installArmfixContactR2(s,o),[spec,{...inputs,handScale:1,neckShare}]);
    const invariants=await page.evaluate(()=>{
      const a=window.__armfixContactInstallSnapshot,H=__v2p.hands.mesh,b=H.skeleton.bones;
      if(H!==a.mesh||b.length!==52||b.some((bone,i)=>bone!==a.bones[i]||bone.parent!==a.parents[i]||[bone.position.toArray(),bone.quaternion.toArray(),bone.scale.toArray()].some((arr,j)=>arr.some((x,k)=>Math.abs(x-a.local[i][j][k])>1e-10))))throw Error('armfix-contact installation changed bone identity/rest');
      if(__v2p.cur!==a.cur||JSON.stringify(__v2p.cur)!==a.curJson)throw Error('armfix-contact installation changed hand selection');
      delete window.__armfixContactInstallSnapshot;
      return {verifiedBones:52,verifiedFingerBones:30,localTransformsReferencesAndSelectionUnchanged:true};
    });
    return {...report,sourceFiles:[...inputs.guard.sourcePins,pin('tools/body-v3/armfix-r2/contact-guard-runtime.js'),pin('tools/body-v3/armfix-r2/contact-runtime.js')],invariants,
      calibration:'New independent scale-1 live-mesh fit; no old r5 fit/rest result reused.',
      acceptance:'Pending real world-space palm/heel/each distal finger and neck sample checks.'};
  }catch(cause){
    try{await page.evaluate(()=>{
      const a=window.__armfixContactInstallSnapshot;
      try{window.__armfixContactR2?.remove();}finally{if(a){
        __drill.pose=a.pose;flareInspector.viewer.motion.getGroundHandPose=a.ground;__v2p.setHandPose=a.setHandPose;__v2p.poses['palm-floor']=a.palm;
        for(const key of Object.keys(__v2p.poses))if(!a.poseKeys.split('|').includes(key))delete __v2p.poses[key];
        a.bones.forEach((b,i)=>{b.position.fromArray(a.local[i][0]);b.quaternion.fromArray(a.local[i][1]);b.scale.fromArray(a.local[i][2]);});
        __v2p.cur=a.cur;Object.assign(a.cur,JSON.parse(a.curJson));delete window.__armfixContactInstallSnapshot;flareInspector.viewer.coach.updateMatrixWorld(true);
      }}
    });}catch{}
    throw new Error('armfix-contact setup failed; discard page',{cause});
  }
}

export async function remove(page){return page.evaluate(()=>{if(!window.__armfixContactR2)throw Error('armfix-contact not installed');return window.__armfixContactR2.remove();});}
