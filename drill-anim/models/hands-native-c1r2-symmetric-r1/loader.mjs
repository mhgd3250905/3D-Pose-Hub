// Independently versioned hand repair; frozen c1r2 remains untouched.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verify as verifyFrozen} from '../hands-native-c1r2/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v2plus-hands-native';
export const VERSION='1.0.0-c1r2-symmetric-r1';
export const RUNTIME=path.resolve(here,'../hands-native-r5/wrist-twist.js');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')).digest('hex');
export function verify(){
 verifyFrozen();
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(manifest.id!==PROFILE||manifest.version!==VERSION)throw Error('Unsupported symmetric hand manifest');
 for(const [rel,expected]of Object.entries(manifest.sourceSha256))if(hash(path.resolve(repo,rel))!==expected)throw Error('Symmetric hand source SHA mismatch: '+rel);
 const mesh=JSON.parse(fs.readFileSync(path.join(here,'hands-base.json'),'utf8'));
 const audit=JSON.parse(fs.readFileSync(path.join(here,'cpu-audit.json'),'utf8'));
 if(mesh.n!==13398||mesh.seam.first!==13332||mesh.bones.length!==52||!audit.passed)throw Error('Symmetric hand structural audit mismatch');
 return manifest;
}
