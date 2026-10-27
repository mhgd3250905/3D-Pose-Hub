// hands-native r8: anatomical per-axis size for this body (length x0.978, width x0.79, palm thickness x0.59 of r3), r7 28 mm root blend + curled free-hand pose, r5 wrist-twist runtime. r3-r7 frozen.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v2plus-hands-native';
export const VERSION='1.0.0-r8';
const text=f=>fs.readFileSync(f,'utf8');
const hash=f=>crypto.createHash('sha256').update(text(f).replaceAll('\r\n','\n')).digest('hex');
export function verifyHandsNativeR8(){
 const manifest=JSON.parse(text(path.join(here,'manifest.json')));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported native hand r8 manifest');
 for(const [rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Native hand r8 source SHA mismatch: '+rel);
 const base=JSON.parse(text(path.join(repo,'drill-anim/models/training-human-v2plus.json')));
 for(const [rel,expected]of Object.entries(base.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Frozen base source SHA mismatch: '+rel);
 return manifest;
}
export const RUNTIME=path.join(here,'../hands-native-r5/wrist-twist.js');
