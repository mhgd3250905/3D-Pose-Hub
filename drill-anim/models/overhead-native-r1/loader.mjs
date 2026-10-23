import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyNativeGrip} from '../grip-native-r1/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export const PROFILE='training-human-v2plus-overhead-native',VERSION='1.0.0-r1';
export function verifyOverheadNative(){
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported overhead native manifest');
 for(const[rel,expected]of Object.entries(manifest.sourceSha256)){
  const text=fs.readFileSync(path.resolve(here,'../../..',rel),'utf8').replaceAll('\r\n','\n');
  if(crypto.createHash('sha256').update(text).digest('hex')!==expected)throw Error('Overhead native source SHA mismatch: '+rel);
 }
 verifyNativeGrip();return manifest;
}
export async function applyOverheadNative(p,s){
 if(s.modelProfile!==PROFILE||s.overheadNative?.version!==VERSION||s.id!=='h-db-overhead-triceps-extension-rr3')throw Error('Explicit scoped overhead native version required');
 const manifest=verifyOverheadNative(),read=f=>JSON.parse(fs.readFileSync(path.resolve(here,f),'utf8'));
 const rig=read('../hands-native-r3/hands-rig.json');rig.poses['grip-bar']=read('../grip-native-r1/fit.json').targets;
 await p.addScriptTag({content:fs.readFileSync(path.resolve(here,'../../page/human-v2plus.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[rig,read('../training-human-v2plus-outfit.json')]);
 for(const[fn,file]of [['loadTorso','../training-human-v2plus-torso-base.json'],['loadLimbs','../training-human-v2plus-limbs-base.json'],['loadHands','../hands-native-r3/hands-base.json']])await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,read(file)]);
 await p.evaluate(profile=>{const E=__drill,select=E.selectModelProfile.bind(E);E.selectModelProfile=s=>select(s.modelProfile===profile?{...s,modelProfile:'training-human-v2plus'}:s);},PROFILE);
 return manifest;
}
