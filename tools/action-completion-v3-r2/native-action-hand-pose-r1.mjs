// Action-owned native finger quaternions. Frozen presets, source meshes and setters remain unchanged.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const PROFILE='native-action-hand-pose-r1', VERSION='0.1.0-r1';
export const SPEC_IDS=['h-biceps-self-r7','h-half-kneeling-quad-stretch-r6'];
export function verify(){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),m=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/'+PROFILE+'/manifest.json'),'utf8'));
  if(m.profile!==PROFILE||m.version!==VERSION||JSON.stringify(m.specIds)!==JSON.stringify(SPEC_IDS))throw Error('Native action manifest identity differs');
  for(const [name,want]of Object.entries(m.sha256Lf)){const got=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name),'utf8').replaceAll('\r\n','\n')).digest('hex');if(got!==want)throw Error('Native action source changed: '+name);}
  return m;
}
const JOINTS=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j));
export function validate(descriptor){
  const d=descriptor;
  if(d?.id!==PROFILE||d.version!==VERSION||d.required!==true||!SPEC_IDS.includes(d.specId))throw Error('Explicit action native pose identity required');
  if(!d.poses||!Object.keys(d.poses).length||Object.keys(d.poses).some(s=>!['left','right'].includes(s)))throw Error('Explicit native pose sides required');
  for(const [side,pose] of Object.entries(d.poses)){
    if(typeof d.basePoses?.[side]!=='string'||!d.basePoses[side])throw Error('Explicit source pose required');
    if(!pose||!Object.keys(pose).length)throw Error('Empty native joint override');
    for(const [joint,q] of Object.entries(pose))if(!JOINTS.includes(joint)||!Array.isArray(q)||q.length!==4||q.some(x=>!Number.isFinite(x))||Math.abs(q.reduce((n,x)=>n+x*x,0)-1)>1e-6)throw Error('Invalid native quaternion '+joint);
  }
  return structuredClone(d);
}
export function aliases(descriptor){return Object.fromEntries(Object.keys(descriptor.poses).map(s=>[s,`action-native-r1:${descriptor.specId}:${s}`]));}
export function prepare(spec){
  const out=structuredClone(spec),d=validate(out.actionCorrective);
  if(d.specId!==out.id)throw Error('Native pose bound to another action revision');
  for(const side of Object.keys(d.poses))if(out.v2plus?.handPose?.[side]!==d.basePoses[side])throw Error('Native source pose differs from prepared recipe');
  out.v2plus={...out.v2plus,handPose:{...out.v2plus.handPose,...aliases(d)}};
  return out;
}
export async function install(page,descriptor){
  const d=validate(descriptor);
  return page.evaluate(installInPage,{descriptor:d,aliases:aliases(d)});
}
export function installInPage({descriptor:d,aliases}){
  const V=window.__v2p,joints=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j));
  if(!V?.hands?.on||!V.hands.mesh?.visible||window.__nativeActionHandPoseR1)throw Error('Fresh visible native hand runtime required');
  const records={};
  for(const [side,overrides] of Object.entries(d.poses)){
    const base=d.basePoses[side],source=V.poses[base],alias=aliases[side];
    if(!source||Object.hasOwn(V.poses,alias))throw Error('Missing base or occupied action alias');
    const pose={...structuredClone(source),...structuredClone(overrides)};
    for(const key of joints){const q=pose[key],name='v2p_'+(side==='left'?'L':'R')+'_'+key;
      if(!Array.isArray(q)||q.length!==4||q.some(x=>!Number.isFinite(x))||Math.abs(q.reduce((n,x)=>n+x*x,0)-1)>1e-6||!V.bones?.[name])throw Error('Incomplete action pose/bone '+name);
    }
    records[side]={base,alias,pose,sourceJson:JSON.stringify(source)};
  }
  // Only publish once every side has passed validation; a partial install is never retained.
  for(const r of Object.values(records))V.poses[r.alias]=structuredClone(r.pose);
  const setter=V.setHandPose;
  const api={id:d.id,version:d.version,specId:d.specId,aliases:{...aliases},verifyApplied({requireApplied=true}={}){
    if(V.setHandPose!==setter)throw Error('Native hand setter changed after action installation');
    const sides={};
    for(const [side,r]of Object.entries(records)){
      if(JSON.stringify(V.poses[r.base])!==r.sourceJson||JSON.stringify(V.poses[r.alias])!==JSON.stringify(r.pose))throw Error('Native action/base pose changed');
      let maxQuaternionDistance=0;
      for(const key of joints){const expected=r.pose[key].slice();if(side==='right'){expected[1]*=-1;expected[2]*=-1;}const actual=V.bones['v2p_'+(side==='left'?'L':'R')+'_'+key].quaternion.toArray();
        const minus=Math.sqrt(actual.reduce((n,x,i)=>n+(x-expected[i])**2,0)),plus=Math.sqrt(actual.reduce((n,x,i)=>n+(x+expected[i])**2,0));maxQuaternionDistance=Math.max(maxQuaternionDistance,Math.min(minus,plus));
      }
      const applied=V.cur?.[side]===r.alias&&maxQuaternionDistance<1e-6;
      sides[side]={alias:r.alias,selected:V.cur?.[side]??null,applied,maxQuaternionDistance};
      if(requireApplied&&!applied)throw Error('Action native pose not applied: '+side);
    }
    return {id:d.id,version:d.version,specId:d.specId,sides,applied:Object.values(sides).every(x=>x.applied)};
  }};
  window.__nativeActionHandPoseR1=api;
  return api.verifyApplied({requireApplied:false});
}
