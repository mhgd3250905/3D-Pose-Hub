import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyHandsNative} from '../hands-native-r3/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export const PROFILE='training-human-v2plus-native-grip',VERSION='1.0.0-r1';
export function verifyNativeGrip(){
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported native grip manifest');
 for(const[rel,expected]of Object.entries(manifest.sourceSha256)){
  const text=fs.readFileSync(path.resolve(here,'../../..',rel),'utf8').replaceAll('\r\n','\n');
  if(crypto.createHash('sha256').update(text).digest('hex')!==expected)throw Error('Native grip source SHA mismatch: '+rel);
 }
 verifyHandsNative();return manifest;
}
export async function applyNativeGrip(p,spec){
 if(spec.modelProfile!==PROFILE||spec.nativeGrip?.version!==VERSION||spec.id!=='h-fixed-bar-vertical-pull-rr7')throw Error('Explicit scoped native grip version required');
 const manifest=verifyNativeGrip();
 const read=f=>JSON.parse(fs.readFileSync(path.resolve(here,f),'utf8'));
 const rig=read('../hands-native-r3/hands-rig.json');rig.poses['grip-bar']=read('fit.json').targets;
 await p.addScriptTag({content:fs.readFileSync(path.resolve(here,'../../page/human-v2plus.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[rig,read('../training-human-v2plus-outfit.json')]);
 for(const [fn,file]of [['loadTorso','../training-human-v2plus-torso-base.json'],['loadLimbs','../training-human-v2plus-limbs-base.json'],['loadHands','../hands-native-r3/hands-base.json']])await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,read(file)]);
 await p.evaluate(profile=>{const e=__drill,original=e.selectModelProfile.bind(e);e.selectModelProfile=s=>original(s.modelProfile===profile?{...s,modelProfile:'training-human-v2plus'}:s);},PROFILE);
 return manifest;
}
