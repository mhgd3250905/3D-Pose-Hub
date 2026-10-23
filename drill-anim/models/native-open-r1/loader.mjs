// Open entry for NEW specs on the fixed native-hand r3 / native-grip r1 models.
// The frozen r3 and grip-r1 loaders (and their SHA-pinned sources) are not modified;
// their ID allowlists keep guarding the reviewed actions. This entry loads the same
// pinned data for any spec that explicitly selects a supported profile + version.
// Output is a candidate only: reviewed=false, releaseEligible=false.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyHandsNative,PROFILE as HANDS_PROFILE,VERSION as HANDS_VERSION} from '../hands-native-r3/loader.mjs';
import {verifyNativeGrip,PROFILE as GRIP_PROFILE,VERSION as GRIP_VERSION} from '../grip-native-r1/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),models=path.resolve(here,'..');
const json=f=>JSON.parse(fs.readFileSync(path.join(models,f),'utf8'));
export const ENTRY='native-open-r1';
export const SUPPORTED={[HANDS_PROFILE]:{key:'nativeHands',version:HANDS_VERSION},[GRIP_PROFILE]:{key:'nativeGrip',version:GRIP_VERSION}};
// Presets with reviewed evidence on these models; anything else loads with a warning.
const VALIDATED={[HANDS_PROFILE]:['free-hand (no contact)'],[GRIP_PROFILE]:['grip-bar (fixed pull-up bar, 32 mm rod)']};
export function checkSpec(spec){
 const s=SUPPORTED[spec.modelProfile];
 if(!s)throw Error(`native-open-r1: modelProfile must be one of ${Object.keys(SUPPORTED).join(', ')}`);
 if(spec[s.key]?.version!==s.version)throw Error(`native-open-r1: ${spec.modelProfile} requires ${s.key}.version='${s.version}'`);
 return s;
}
export function verifyOpen(spec){checkSpec(spec);return spec.modelProfile===GRIP_PROFILE?verifyNativeGrip():verifyHandsNative();}
export async function applyNativeOpen(p,spec){
 checkSpec(spec);
 const manifest=verifyOpen(spec);
 console.warn(`[native-open-r1] ${spec.id}: candidate on ${spec.modelProfile}; validated presets: ${VALIDATED[spec.modelProfile].join(', ')}. Other contacts (palm-floor, dumbbell grip, hand-to-hand) are UNVALIDATED - check contact metrics and close-ups.`);
 const rig=json('hands-native-r3/hands-rig.json');
 if(spec.modelProfile===GRIP_PROFILE)rig.poses['grip-bar']=json('grip-native-r1/fit.json').targets;
 await p.addScriptTag({content:fs.readFileSync(path.resolve(models,'../page/human-v2plus.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[rig,json('training-human-v2plus-outfit.json')]);
 for(const [fn,file]of [['loadTorso','training-human-v2plus-torso-base.json'],['loadLimbs','training-human-v2plus-limbs-base.json'],['loadHands','hands-native-r3/hands-base.json']])await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,json(file)]);
 await p.evaluate(profile=>{const e=__drill,original=e.selectModelProfile.bind(e);e.selectModelProfile=s=>original(s.modelProfile===profile?{...s,modelProfile:'training-human-v2plus'}:s);},spec.modelProfile);
 return manifest;
}
