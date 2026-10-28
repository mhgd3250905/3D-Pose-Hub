// Independent r2 pieces: one fixed symmetric hand source, one finger-chain initialization.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {verify as verifyHands} from '../hands-native-c1r2-symmetric-r1/loader.mjs';
import {HAND_SOURCE,checkOptions} from './recipe.mjs';
const TWIST=new URL('../hands-native-r5/wrist-twist.js',import.meta.url);
const here=path.dirname(fileURLToPath(import.meta.url)),models=path.resolve(here,'..'),repo=path.resolve(here,'../../..');
const W=await import(pathToFileURL(path.join(repo,'runtime/src/body-warp-v3.js')).href);
const json=f=>JSON.parse(fs.readFileSync(path.join(models,f),'utf8'));
export const PROFILE='training-human-v3-armfix-base',VERSION='0.1.0-r2';
export {boot} from '../training-human-v3-armfix-r1/boot.mjs';
const RIG=JSON.parse(fs.readFileSync(path.join(repo,'runtime/public/coach-v3-armfix-r1/coach-rig.json'),'utf8'));
const J=JSON.parse(fs.readFileSync(path.join(repo,'tools/body-v3/reset-joints-v2.json'),'utf8')),N=W.chainJoints(J,RIG.v3);
export const RESET_JOINTS={v2:J,v3:N};
function decode(d){const bytes=Buffer.from(d.pos.u16,'base64'),q=new Uint16Array(d.n*3);if(bytes.length!==q.length*2)throw Error('armfix-r2 position byte count');for(let i=0;i<q.length;i++)q[i]=bytes.readUInt16LE(i*2);const jt=Buffer.from(d.joints.u8,'base64'),wt=Buffer.from(d.weights.u8,'base64');if(jt.length!==d.n*4||wt.length!==d.n*4)throw Error('armfix-r2 influence byte count');return {q,jt,wt};}
export function warpBase(d,options={}){
 checkOptions(options);const handScale=1;if(d.v3?.warped)throw Error('armfix-r2 refuses already warped data');
 const o=structuredClone(d),{q,jt,wt}=decode(d),n=d.n,lo=d.pos.lo,sc=d.pos.scale,X=new Float64Array(n*3);
 const kind=new Map(d.bones.map(b=>[b,W.boneKind(b)]));const kindOf=b=>kind.get(b)??null;
 for(let i=0;i<n;i++){const p=[0,1,2].map(k=>lo[k]+q[i*3+k]*sc[k]),inf=[];
  for(let k=0;k<4;k++){const b=d.bones[jt[i*4+k]],w=wt[i*4+k]/255;inf.push([b,w]);if(w&&b===undefined)throw Error('armfix-r2 invalid influence bone');}
  let r=W.warpVertex(p,inf,kindOf,J,N);
  if(!r.every(Number.isFinite))throw Error('armfix-r2 nonfinite warped point');
  X.set(r,i*3);}
 const mn=[0,1,2].map(k=>{let m=Infinity;for(let i=0;i<n;i++)m=Math.min(m,X[i*3+k]);return m;}),mx=[0,1,2].map(k=>{let m=-Infinity;for(let i=0;i<n;i++)m=Math.max(m,X[i*3+k]);return m;});
 const s2=mx.map((x,k)=>(x-mn[k])/65535||1e-9),u=new Uint16Array(n*3);for(let i=0;i<n*3;i++){const k=i%3;u[i]=Math.round((X[i]-mn[k])/s2[k]);}
 o.pos={lo:mn,scale:s2,u16:Buffer.from(u.buffer).toString('base64')};o.v3={warped:true,handScale};return o;
}
// plane n.x=w crossing segment a->b: move it with the warped crossing point
function movePlane(pl,a,b,kind){const n=pl.slice(0,3),w=pl[3],da=n[0]*a[0]+n[1]*a[1]+n[2]*a[2]-w,db=n[0]*b[0]+n[1]*b[1]+n[2]*b[2]-w,t=da/(da-db);
 const x=[0,1,2].map(k=>a[k]+(b[k]-a[k])*Math.min(1,Math.max(0,t))),x2=W.mapPoint(x,kind,J,N);return [n[0],n[1],n[2],n[0]*x2[0]+n[1]*x2[1]+n[2]*x2[2]];}
export async function applyV3(p,spec,options={}){
 checkOptions(options);verifyHands();const handScale=1;
 await p.evaluate(()=>{
  const state=window.__armfixR2Init;
  if(state?.phase!=='installing'||window.__v2p)throw Error('armfix-r2 requires fresh claimed initialization');
  const v=flareInspector.viewer,k=v.rigData?.v3?.segmentScale;
  if(!v.bodyV3||k?.upperArm!==1||k?.forearm!==1||v.rigData.v3.armfix?.handScale!==1)throw Error('armfix-r2 wrong boot rig');
  let fingers=0;v.coach.traverse(o=>{if(o.isBone&&/^v2p_[LR]_/.test(o.name))fingers++;});
  if(fingers)throw Error('armfix-r2 finger chain already exists');
 });
 const rig=json(HAND_SOURCE+'/hands-rig.json');
 const outfit=json('training-human-v2plus-outfit.json');
 for(const s of['left','right'])if(outfit.cuffPlanes?.[s])outfit.cuffPlanes[s]=movePlane(outfit.cuffPlanes[s],J[s+'Shoulder'],J[s+'Elbow'],W.boneKind(s+'UpperArm'));
 await p.addScriptTag({content:fs.readFileSync(path.join(models,'training-human-v3/human-v3.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[rig,outfit]);
 for(const [fn,file]of [['loadTorso','training-human-v2plus-torso-base.json'],['loadLimbs','training-human-v2plus-limbs-base.json'],['loadHands',HAND_SOURCE+'/hands-base.json']])
  await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,warpBase(json(file),fn==='loadHands'?{handScale}:{})]);
 await p.evaluate(()=>{const e=__drill,original=e.selectModelProfile.bind(e);e.selectModelProfile=s=>original({...s,modelProfile:'training-human-v2plus'});});
 const share=spec.nativeHands?.twistShare??0.5;await p.evaluate(x=>{window.__wristTwistShare=x;},share);await p.addScriptTag({content:fs.readFileSync(TWIST,'utf8')});
 const initialization=await p.evaluate(()=>{
  const names=[];flareInspector.viewer.coach.traverse(o=>{if(o.isBone&&/^v2p_[LR]_/.test(o.name))names.push(o.name);});
  if(names.length!==30||new Set(names).size!==30)throw Error('armfix-r2 requires exactly one 30-bone finger chain');
  if(!__v2p.loaded||!__v2p.hands?.mesh)throw Error('armfix-r2 hand installation incomplete');
  window.__armfixR2Init.fingerBones=names.length;return {fingerBones:names.length,meshInstallations:1};
 });
 return {profile:PROFILE,version:VERSION,hands:HAND_SOURCE,handAsset:HAND_SOURCE,handScale,initialization};
}
