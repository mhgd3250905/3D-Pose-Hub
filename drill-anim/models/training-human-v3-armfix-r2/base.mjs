// Independent proportion candidate. It does not reuse the old proportion loader or old contact calibration.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as base from './proportion-base.mjs';
import {HAND_SOURCE,checkOptions} from './recipe.mjs';
import {verify,PROFILE,VERSION} from './verify.mjs';
export {verify,PROFILE,VERSION} from './verify.mjs';
export {RESET_JOINTS,warpBase} from './proportion-base.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=rel=>fs.readFileSync(path.join(repo,rel),'utf8');
export async function boot(options){await verify();return base.boot(options);}
export function checkSpec(spec,options={}){
  checkOptions(options);
  if(spec?.modelProfile!=='training-human-v2plus-hands-native'||['torso','limbs','hands'].some(k=>spec?.v2plus?.[k]!=='base'))throw Error('armfix-r2 requires explicit full native profile');
  if(spec.v2plus.head)throw Error('armfix-r2 alternative head unsupported');
  const share=spec.nativeHands?.twistShare??0.5;
  if(!Number.isFinite(share)||share<0||share>1)throw Error('armfix-r2 invalid twistShare');
  if(spec.nativeHands&&Object.keys(spec.nativeHands).some(k=>k!=='twistShare'))throw Error('armfix-r2 unsupported nativeHands option');
  return spec;
}
export async function applyV3(page,spec,options={}){
  checkSpec(spec,options);await verify();
  await page.evaluate(()=>{
    if(window.__armfixR2Init||window.__armfixR1||window.__armfixR2||window.__v2p)throw Error('armfix-r2 requires a fresh page');
    if(!flareInspector.viewer.__bodyV3ArmNormalsR1)throw Error('armfix-r2 requires its own boot before apply');
    window.__armfixR2Init={phase:'installing'};
  });
  let fragment;
  try{
    const setup=await base.applyV3(page,spec,{...options,handScale:1,handDir:HAND_SOURCE});
    await page.evaluate(s=>{__drill.selectModelProfile(s);flareInspector.viewer.motion.reset();},spec);
    const binary=fs.readFileSync(path.join(repo,'drill-anim/models/head-neck-fragment-r3/head-neck.glb')).toString('base64');
    const asset=JSON.parse(read('drill-anim/models/head-neck-toon-r4/asset.json'));
    const url='/@fs/'+path.join(repo,'drill-anim/models/head-neck-fragment-r3/loader.mjs').replaceAll('\\','/');
    fragment=await page.evaluate(async([binary,url,asset])=>{
      const v=flareInspector.viewer,raw=atob(binary),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const neck=v.coach.getObjectByName('Mesh001'),head=v.coach.getObjectByName('Toon_Mannequin_Head_v5'),body=v.coach.getObjectByName('Coach_Body');
      const {attachHeadNeckFragment}=await import(url);
      const f=await attachHeadNeckFragment({binary:bytes.buffer,parent:head.parent,skeleton:body.skeleton,toonAsset:asset,uniforms:{toon:__toonUni,muscle:__mmUni,v2p:__v2p.uni},hide:[neck,head]});
      // The retained fragment may use only unchanged head/neck/trunk/shoulder pivots.
      const g=f.mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
      for(let i=0;i<si.count;i++)for(let k=0;k<4;k++)if(sw.getComponent(i,k)>1e-8&&/^(left|right)(Forearm|Hand)$|^v2p_[LR]_/.test(f.mesh.skeleton.bones[si.getComponent(i,k)].name)){f.dispose();throw Error('armfix-r2 P2 fragment depends on changed arm/finger pivots');}
      const previous=__drill.selectModelProfile;
      function select(s){const r=previous.call(this,s);neck.visible=false;head.visible=false;f.mesh.visible=true;return r;}
      __drill.selectModelProfile=select;window.__armfixHeadNeckR2={fragment:f,previous,select};
      return {bones:f.bones,materials:f.materials,seamEdges:f.seamEdges,changedArmInfluences:0};
    },[binary,url,asset]);
    await page.addScriptTag({content:read('tools/body-v3/wrist-gradient-r2.js')});
    const wrist=await page.evaluate(()=>window.__installBodyV3WristGradientR2());
    await page.evaluate(()=>{window.__armfixR2Init.phase='base-ready';});
    return {...setup,profile:PROFILE,version:VERSION,handScale:1,fragment,wrist,
      retained:['symmetric c1r2 wrist geometry','P2 shared head-neck fragment','L1 wrist color gradient','v3 legs/trunk recipe'],
      notMigrated:['r7 P1 ankle corrections','r7 P3 collar refinement','r7 P4 hip/knee normal corrections','r7 P5 shoulder corrective','r7 L2 arm/piece normal recomputation','r5 palm-floor/contact calibration','r5 neck channel'],
      scope:'Arm proportions and compatible head/neck/wrist candidate only; not the complete r7 repair profile or production-ready model. Old absolute action targets require retargeting and visual checks.',
      lifecycle:'Fresh page per candidate; discard page after failure. No frozen source modified.'};
  }catch(cause){await page.evaluate(()=>{window.__armfixR2Init.phase='failed';}).catch(()=>{});throw new Error('armfix-r2 setup failed; discard page',{cause});}
}
