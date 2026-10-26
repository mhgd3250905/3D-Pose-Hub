// hands-native r6a: r3 hand scaled 0.82, extra width 0.85, palm thickness 0.7 (option A: slimmer), wrist-band narrowing 0.87; wrist twist shared via ../hands-native-r5/wrist-twist.js. Separately versioned; r3/r5 frozen.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v2plus-hands-native';
export const VERSION='1.0.0-r6a';
const text=f=>fs.readFileSync(f,'utf8');
const hash=f=>crypto.createHash('sha256').update(text(f).replaceAll('\r\n','\n')).digest('hex');
export function verifyHandsNativeR6A(){
 const manifest=JSON.parse(text(path.join(here,'manifest.json')));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported native hand r6a manifest');
 for(const [rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Native hand r6a source SHA mismatch: '+rel);
 const base=JSON.parse(text(path.join(repo,'drill-anim/models/training-human-v2plus.json')));
 for(const [rel,expected]of Object.entries(base.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Frozen base source SHA mismatch: '+rel);
 return manifest;
}
export const RUNTIME=path.join(here,'../hands-native-r5/wrist-twist.js');
