// An explicit, separately versioned hand model. Frozen production files stay intact.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v2plus-hands-native';
export const VERSION='1.0.0-r3';
const text=f=>fs.readFileSync(f,'utf8');
const hash=f=>crypto.createHash('sha256').update(text(f).replaceAll('\r\n','\n')).digest('hex');
export function verifyHandsNative(){
 const manifest=JSON.parse(text(path.join(here,'manifest.json')));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported native hand manifest');
 for(const [rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Native hand source SHA mismatch: '+rel);
 const base=JSON.parse(text(path.join(repo,'drill-anim/models/training-human-v2plus.json')));
 for(const [rel,expected]of Object.entries(base.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Frozen base source SHA mismatch: '+rel);
 return manifest;
}
export async function applyHandsNative(p,spec){
 if(spec.modelProfile!==PROFILE||spec.nativeHands?.version!==VERSION)throw Error('Explicit versioned native hand profile required');
 if(!['h-bent-knee-calf-raise-rr7','h-chair-single-leg-hip-thrust-rr8'].includes(spec.id))throw Error('Native hand candidate is currently scoped to the two reviewed free-hand actions');
 const manifest=verifyHandsNative(),data=f=>JSON.parse(text(path.join(repo,'drill-anim/models',f)));
 await p.addScriptTag({content:text(path.join(repo,'drill-anim/page/human-v2plus.js'))});
 await p.evaluate(([rig,outfit])=>__v2p.load(rig,outfit),[JSON.parse(text(path.join(here,'hands-rig.json'))),data('training-human-v2plus-outfit.json')]);
 await p.evaluate(d=>__v2p.loadTorso(d),data('training-human-v2plus-torso-base.json'));
 await p.evaluate(d=>__v2p.loadLimbs(d),data('training-human-v2plus-limbs-base.json'));
 await p.evaluate(d=>__v2p.loadHands(d),JSON.parse(text(path.join(here,'hands-base.json'))));
 await p.evaluate(profile=>{const E=__drill,select=E.selectModelProfile.bind(E);E.selectModelProfile=s=>select(s.modelProfile===profile?{...s,modelProfile:'training-human-v2plus'}:s);},PROFILE);
 return manifest;
}
