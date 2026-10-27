// hands-native-c1r2: c1 (MakeHuman hm08 CC0) + Loop subdivision, monotone rebuilt wrist transition, recomputed seam-shared normals; r5 wrist twist. Candidate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v2plus-hands-native';
export const VERSION='1.0.0-c1r2';
const text=f=>fs.readFileSync(f,'utf8');
const hash=f=>crypto.createHash('sha256').update(text(f).replaceAll('\r\n','\n')).digest('hex');
export function verifyHandsNativeC1R2(){
 const manifest=JSON.parse(text(path.join(here,'manifest.json')));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported native hand c1r2 manifest');
 for(const [rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Native hand c1r2 source SHA mismatch: '+rel);
 const base=JSON.parse(text(path.join(repo,'drill-anim/models/training-human-v2plus.json')));
 for(const [rel,expected]of Object.entries(base.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Frozen base source SHA mismatch: '+rel);
 return manifest;
}
export const RUNTIME=path.join(here,'../hands-native-r5/wrist-twist.js');

export const verify=verifyHandsNativeC1R2;
