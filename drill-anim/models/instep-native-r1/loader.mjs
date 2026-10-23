// Composition only: accepted native hands + unchanged R5 barefoot bridge.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyHandsNative} from '../hands-native-r3/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../../..');
const text=f=>fs.readFileSync(f,'utf8');
const read=f=>JSON.parse(text(f));
const hash=f=>crypto.createHash('sha256').update(text(f).replaceAll('\r\n','\n')).digest('hex');
export const PROFILE='training-human-v2plus-instep-native';
export const VERSION='1.0.0-r1';
export function verifyInstepNative(){
 const manifest=read(path.join(here,'manifest.json'));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported composite profile');
 for(const[rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Instep native source SHA mismatch: '+rel);
 verifyHandsNative();
 for(const revision of ['barefoot-r4','barefoot-r5']) {
  const dir=path.resolve(here,'..',revision),m=read(path.join(dir,'manifest.json'));
  for(const[rel,expected]of Object.entries(m.sourceSha256)) {
   const bytes=fs.readFileSync(path.resolve(dir,rel));
   if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Frozen barefoot source SHA mismatch: '+revision+'/'+rel);
  }
 }
 return manifest;
}
export async function applyInstepNative(p,s){
 if(s.modelProfile!==PROFILE||s.instepNative?.version!==VERSION||s.id!=='h-kneeling-instep-stretch-rr6')throw Error('Explicit scoped instep native revision required');
 if(s.nativeHands?.version!=='1.0.0-r3'||s.barefoot?.version!=='1.0.0-r5.2')throw Error('Pinned hand and foot versions required');
 const manifest=verifyInstepNative(),data=f=>read(path.resolve(here,'..',f));
 await p.addScriptTag({content:text(path.join(repo,'drill-anim/page/human-v2plus.js'))});
 await p.evaluate(([rig,outfit])=>__v2p.load(rig,outfit),[data('hands-native-r3/hands-rig.json'),data('training-human-v2plus-outfit.json')]);
 await p.evaluate(d=>__v2p.loadTorso(d),data('training-human-v2plus-torso-base.json'));
 await p.evaluate(d=>__v2p.loadLimbs(d),data('training-human-v2plus-limbs-base.json'));
 await p.evaluate(d=>__v2p.loadHands(d),data('hands-native-r3/hands-base.json'));
 await p.addScriptTag({content:text(path.resolve(here,'../barefoot-r4/feet.js'))});
 await p.evaluate(d=>__barefootR4.load(d),data('barefoot-r4/feet-base.json'));
 await p.addScriptTag({content:text(path.resolve(here,'../barefoot-r5/feet.js'))});
 await p.evaluate(a=>__barefootR5.load(...a),[data('barefoot-r5/feet-base-f32.json'),data('barefoot-r5/runtime-recipe.json'),data('barefoot-r5/toe-delta.json'),data('training-human-v2plus-limbs-base.json')]);
 await p.evaluate(profile=>{
  const E=__drill,select=E.selectModelProfile.bind(E),pose=E.pose.bind(E);
  const map=s=>s.modelProfile===profile?{...s,modelProfile:'training-human-v2plus-barefoot-bridge'}:s;
  E.selectModelProfile=s=>select(map(s));
  E.pose=(s,p,w)=>pose(map(s),p,w);
 },PROFILE);
 return manifest;
}
