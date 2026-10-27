// training-human-v3 loader (phase 1, candidate for review): boots with boot-v3.mjs (viewer-v3.js warps the glb + v3 rig before the
// coach motion exists), then loads the v2plus torso/limbs and the r8 hands warped to v3 proportions with the same mapping
// (runtime/src/body-warp-v3.js) in the reset pose they are authored in, plus the r5 wrist-twist runtime.
// Frozen v2/v2plus/hand files are read only. Optional handScale (e.g. 1.18) scales the r8 hand about the wrist (comparison only).
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {verifyHandsNativeR8,RUNTIME as TWIST} from '../hands-native-r8/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),models=path.resolve(here,'..'),repo=path.resolve(here,'../../..');
const W=await import(pathToFileURL(path.join(repo,'runtime/src/body-warp-v3.js')).href);
const json=f=>JSON.parse(fs.readFileSync(path.join(models,f),'utf8'));
export const PROFILE='training-human-v3',VERSION='0.1.0-phase1';
export {boot} from './boot-v3.mjs';
const RIG=JSON.parse(fs.readFileSync(path.join(repo,'runtime/public/coach-v3/coach-rig-v3.json'),'utf8'));
const J=JSON.parse(fs.readFileSync(path.join(repo,'tools/body-v3/reset-joints-v2.json'),'utf8')),N=W.chainJoints(J,RIG.v3);
export const RESET_JOINTS={v2:J,v3:N};
function decode(d){const q=new Uint16Array(Buffer.from(d.pos.u16,'base64').buffer.slice(0));const jt=Buffer.from(d.joints.u8,'base64'),wt=Buffer.from(d.weights.u8,'base64');return {q,jt,wt};}
export function warpBase(d,{handScale=1}={}){
 const o=structuredClone(d),{q,jt,wt}=decode(d),n=d.n,lo=d.pos.lo,sc=d.pos.scale,X=new Float64Array(n*3);
 const kind=new Map(d.bones.map(b=>[b,W.boneKind(b)]));const kindOf=b=>kind.get(b)??null;
 for(let i=0;i<n;i++){const p=[0,1,2].map(k=>lo[k]+q[i*3+k]*sc[k]),inf=[];let hw=0,side=null;
  for(let k=0;k<4;k++){const b=d.bones[jt[i*4+k]],w=wt[i*4+k]/255;inf.push([b,w]);const kd=kindOf(b);if(kd?.rigid==='Wrist'){hw+=w;side=kd.side;}}
  let r=W.warpVertex(p,inf,kindOf,J,N);
  if(handScale!==1&&hw>0){const c=N[side+'Wrist'];r=r.map((x,k)=>c[k]+(x-c[k])*(1+(handScale-1)*hw));}
  X.set(r,i*3);}
 const mn=[0,1,2].map(k=>{let m=Infinity;for(let i=0;i<n;i++)m=Math.min(m,X[i*3+k]);return m;}),mx=[0,1,2].map(k=>{let m=-Infinity;for(let i=0;i<n;i++)m=Math.max(m,X[i*3+k]);return m;});
 const s2=mx.map((x,k)=>(x-mn[k])/65535||1e-9),u=new Uint16Array(n*3);for(let i=0;i<n*3;i++){const k=i%3;u[i]=Math.round((X[i]-mn[k])/s2[k]);}
 o.pos={lo:mn,scale:s2,u16:Buffer.from(u.buffer).toString('base64')};o.v3={warped:true,handScale};return o;
}
// plane n.x=w crossing segment a->b: move it with the warped crossing point
function movePlane(pl,a,b,kind){const n=pl.slice(0,3),w=pl[3],da=n[0]*a[0]+n[1]*a[1]+n[2]*a[2]-w,db=n[0]*b[0]+n[1]*b[1]+n[2]*b[2]-w,t=da/(da-db);
 const x=[0,1,2].map(k=>a[k]+(b[k]-a[k])*Math.min(1,Math.max(0,t))),x2=W.mapPoint(x,kind,J,N);return [n[0],n[1],n[2],n[0]*x2[0]+n[1]*x2[1]+n[2]*x2[2]];}
export async function applyV3(p,spec,{handScale=1,handDir='hands-native-r8'}={}){
 verifyHandsNativeR8();if(handDir!=='hands-native-r8')(await import('../'+handDir+'/loader.mjs')).verify();
 const rig=json(handDir+'/hands-rig.json');if(handScale!==1)for(const f of Object.values(rig.fingers))f.joints=f.joints.map(j=>j.map(x=>x*handScale));
 const outfit=json('training-human-v2plus-outfit.json');
 for(const s of['left','right'])if(outfit.cuffPlanes?.[s])outfit.cuffPlanes[s]=movePlane(outfit.cuffPlanes[s],J[s+'Shoulder'],J[s+'Elbow'],W.boneKind(s+'UpperArm'));
 await p.addScriptTag({content:fs.readFileSync(path.join(here,'human-v3.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[rig,outfit]);
 for(const [fn,file]of [['loadTorso','training-human-v2plus-torso-base.json'],['loadLimbs','training-human-v2plus-limbs-base.json'],['loadHands',handDir+'/hands-base.json']])
  await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,warpBase(json(file),fn==='loadHands'?{handScale}:{})]);
 await p.evaluate(()=>{const e=__drill,original=e.selectModelProfile.bind(e);e.selectModelProfile=s=>original({...s,modelProfile:'training-human-v2plus'});});
 const share=spec.nativeHands?.twistShare??0.5;await p.evaluate(x=>{window.__wristTwistShare=x;},share);await p.addScriptTag({content:fs.readFileSync(TWIST,'utf8')});
 return {profile:PROFILE,version:VERSION,hands:handDir,handScale};
}
