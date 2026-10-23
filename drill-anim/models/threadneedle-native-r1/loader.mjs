import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyHandsNative} from '../hands-native-r3/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
export const PROFILE='training-human-v2plus-threadneedle-native',VERSION='1.0.0-r1';
export function verifyThreadneedle(){
 const manifest=read(path.join(here,'manifest.json'));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported threadneedle manifest');
 for(const[rel,sha]of Object.entries(manifest.sourceSha256)){
  const text=fs.readFileSync(path.resolve(repo,rel),'utf8').replaceAll('\r\n','\n');
  if(crypto.createHash('sha256').update(text).digest('hex')!==sha)throw Error('Threadneedle source SHA mismatch: '+rel);
 }
 verifyHandsNative();return manifest;
}
export async function applyThreadneedle(p,spec){
 if(spec.id!=='h-kneeling-thread-needle-rr1'||spec.modelProfile!==PROFILE||spec.threadneedleNative?.version!==VERSION)throw Error('Explicit scoped threadneedle profile required');
 const manifest=verifyThreadneedle(),model=f=>read(path.resolve(here,'..',f));
 await p.addScriptTag({content:fs.readFileSync(path.resolve(here,'../../page/human-v2plus.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[model('hands-native-r3/hands-rig.json'),model('training-human-v2plus-outfit.json')]);
 for(const[fn,file]of [['loadTorso','training-human-v2plus-torso-base.json'],['loadLimbs','training-human-v2plus-limbs-base.json'],['loadHands','hands-native-r3/hands-base.json']])await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,model(file)]);
 await p.addScriptTag({content:fs.readFileSync(path.join(here,'runtime.js'),'utf8')});
 const meshes=await p.evaluate(([d,r,s])=>__installThreadneedle(d,r,s),[read(path.join(here,'trajectory.json')),model('hands-native-r3/hands-rig.json'),spec]);
 return {...manifest,meshes};
}
