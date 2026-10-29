// Baseline candidate: four authored shapes on the corrected legacy source.
// Scene-specific replacement meshes may supersede each shape independently.
// No calibration imported here.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verify as verifyBody} from '../training-human-v3-armfix-r2/loader.mjs';
import {installGrip,validateGripPreset} from '../../../tools/body-v3/armfix-r2/grip-symmetric-install.mjs';
import {installSupport} from '../../../tools/body-v3/armfix-r2/support-install.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(dir,'../../..');
export const VERSION='0.1.0-r1';
export function data(){return JSON.parse(fs.readFileSync(path.join(dir,'presets.json'),'utf8'));}
export async function verify(){
 await verifyBody();const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 if(m.version!==VERSION||m.reviewed!==false||m.releaseEligible!==false)throw Error('Fixed hands manifest identity');
 for(const [rel,hash]of Object.entries(m.sha256)){
  const file=path.resolve(repo,rel);if(!file.startsWith(repo+path.sep))throw Error('Invalid fixed hands source');
  const raw=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');if(crypto.createHash('sha256').update(raw).digest('hex')!==hash)throw Error('Fixed hands changed: '+rel);
 }
 const d=data();if(d.format!=='pose-hub-fixed-hand-presets@1'||d.handSource!=='hands-native-c1r2-symmetric-r1'||d.version!==VERSION||d.handScale!==1||d.reviewed!==false||d.releaseEligible!==false)throw Error('Fixed hand data identity');
 validateGripPreset(d.grasp);return {version:VERSION,names:d.names,handSource:d.handSource};
}
export async function install(page){
 await verify();const d=data();
 const state=await page.evaluate(()=>({source:window.__armfixR2?.handAsset,already:!!window.__fixedHandPresets}));
 if(state.source!==d.handSource||state.already)throw Error('Fixed hands require a fresh symmetric r2 model');
 try{
  await installSupport(page,d.support,{sourceId:d.handSource});await installGrip(page,d.grasp);
  await page.evaluate(({rest,names,version})=>{
   const V=__v2p,keys=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j));
   for(const name of ['relaxed','assist']){const pose=rest[name];if(Object.keys(pose).sort().join('|')!==keys.slice().sort().join('|')||keys.some(k=>pose[k].length!==4||pose[k].some(x=>!Number.isFinite(x))||Math.abs(pose[k].reduce((n,x)=>n+x*x,0)-1)>1e-6))throw Error('Fixed hand pose malformed');V.poses[name]=structuredClone(pose);}
   window.__fixedHandPresets={version,names,source:'hands-native-c1r2-symmetric-r1',liveFitting:false};
  },d);
  return {version:VERSION,names:d.names,liveFitting:false};
 }catch(cause){throw new Error('Fixed hand installation failed; discard page',{cause});}
}
export function select(spec,{left='relaxed',right='relaxed'}={}){
 const allowed=new Set(data().names);if(!allowed.has(left)||!allowed.has(right))throw Error('Unknown fixed hand shape');
 const result=structuredClone(spec);result.nativeHands={...(result.nativeHands?.twistShare===undefined?{}:{twistShare:result.nativeHands.twistShare})};
 result.runtimeModel={profile:'training-human-v3-armfix',version:'0.1.0-r2'};result.v2plus={...result.v2plus,handPose:{left,right}};
 result.props=(result.props||[]).map(p=>p.type==='dumbbell'&&((p.attach==='leftHand'&&left==='grasp-32mm')||(p.attach==='rightHand'&&right==='grasp-32mm'))?{...p,fixedGrasp:'grasp-32mm'}:p);
 return result;
}
