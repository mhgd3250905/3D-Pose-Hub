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
import {verifyHandsNativeR4,VERSION as HANDS_R4_VERSION} from '../hands-native-r4/loader.mjs';
import {verifyHandsNativeR5,VERSION as HANDS_R5_VERSION,RUNTIME as R5_RUNTIME} from '../hands-native-r5/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),models=path.resolve(here,'..');
const json=f=>JSON.parse(fs.readFileSync(path.join(models,f),'utf8'));
export const ENTRY='native-open-r1';
export const SUPPORTED={[HANDS_PROFILE]:{key:'nativeHands',version:HANDS_VERSION},[GRIP_PROFILE]:{key:'nativeGrip',version:GRIP_VERSION}};
// Extra exact versions per profile (r4 = proportion-scaled r3). r3 stays the SUPPORTED default; every version must match exactly.
export const VERSIONS={[HANDS_PROFILE]:{[HANDS_VERSION]:'hands-native-r3',[HANDS_R4_VERSION]:'hands-native-r4',[HANDS_R5_VERSION]:'hands-native-r5'},[GRIP_PROFILE]:{[GRIP_VERSION]:'hands-native-r3'}};
// Presets with reviewed evidence on these models; anything else loads with a warning.
const VALIDATED={[HANDS_PROFILE]:['free-hand (no contact)'],[GRIP_PROFILE]:['grip-bar (fixed pull-up bar, 32 mm rod)']};
export function checkSpec(spec){
 const profile=spec?.modelProfile;
 if(typeof profile!=='string'||!Object.hasOwn(SUPPORTED,profile))throw Error(`native-open-r1: modelProfile must be one of ${Object.keys(SUPPORTED).join(', ')}`);
 const s=SUPPORTED[profile];
 const v=spec[s.key]?.version;if(!Object.hasOwn(VERSIONS[profile],v))throw Error(`native-open-r1: ${spec.modelProfile} requires ${s.key}.version one of ${Object.keys(VERSIONS[profile]).map(x=>`'${x}'`).join(', ')}`);
 return {...s,version:v,handDir:VERSIONS[profile][v]};
}
export function verifyOpen(spec){const c=checkSpec(spec);return spec.modelProfile===GRIP_PROFILE?verifyNativeGrip():c.handDir==='hands-native-r5'?verifyHandsNativeR5():c.handDir==='hands-native-r4'?verifyHandsNativeR4():verifyHandsNative();}
export async function applyNativeOpen(p,spec){
 const sel=checkSpec(spec);
 const manifest=verifyOpen(spec);
 console.warn(`[native-open-r1] ${spec.id}: candidate on ${spec.modelProfile}; validated presets: ${VALIDATED[spec.modelProfile].join(', ')}. Other contacts (palm-floor, dumbbell grip, hand-to-hand) are UNVALIDATED - check contact metrics and close-ups.`);
 const rig=json(sel.handDir+'/hands-rig.json');
 if(spec.modelProfile===GRIP_PROFILE)rig.poses['grip-bar']=json('grip-native-r1/fit.json').targets;
 await p.addScriptTag({content:fs.readFileSync(path.resolve(models,'../page/human-v2plus.js'),'utf8')});
 await p.evaluate(([r,o])=>__v2p.load(r,o),[rig,json('training-human-v2plus-outfit.json')]);
 for(const [fn,file]of [['loadTorso','training-human-v2plus-torso-base.json'],['loadLimbs','training-human-v2plus-limbs-base.json'],['loadHands',sel.handDir+'/hands-base.json']])await p.evaluate(([fn,d])=>__v2p[fn](d),[fn,json(file)]);
 await p.evaluate(profile=>{const e=__drill,original=e.selectModelProfile.bind(e);e.selectModelProfile=s=>original(s.modelProfile===profile?{...s,modelProfile:'training-human-v2plus'}:s);},spec.modelProfile);
 if(sel.handDir==='hands-native-r5'){const share=spec.nativeHands?.twistShare??0.5;if(!(share>=0&&share<=1))throw Error('native-open-r1: nativeHands.twistShare must be 0..1');await p.evaluate(x=>{window.__wristTwistShare=x;},share);await p.addScriptTag({content:fs.readFileSync(R5_RUNTIME,'utf8')});}
 return manifest;
}
