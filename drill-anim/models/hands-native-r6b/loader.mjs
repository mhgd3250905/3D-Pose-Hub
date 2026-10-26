// hands-native r6b: r3 hand scaled uniformly 0.76, palm thickness 0.8 (option B: smaller), wrist-band narrowing 0.87; wrist twist shared via ../hands-native-r5/wrist-twist.js. Separately versioned; r3/r5 frozen.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v2plus-hands-native';
export const VERSION='1.0.0-r6b';
const text=f=>fs.readFileSync(f,'utf8');
const hash=f=>crypto.createHash('sha256').update(text(f).replaceAll('\r\n','\n')).digest('hex');
export function verifyHandsNativeR6B(){
 const manifest=JSON.parse(text(path.join(here,'manifest.json')));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported native hand r6b manifest');
 for(const [rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Native hand r6b source SHA mismatch: '+rel);
 const base=JSON.parse(text(path.join(repo,'drill-anim/models/training-human-v2plus.json')));
 for(const [rel,expected]of Object.entries(base.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Frozen base source SHA mismatch: '+rel);
 return manifest;
}
export const RUNTIME=path.join(here,'../hands-native-r5/wrist-twist.js');
