// Validate this composition and the independently frozen P2/P3/L1/L2 chains.
import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {verify as verifyCollar} from '../training-human-v3-collar-r1/verify.mjs';
import {verify as verifyBaseNormals} from '../training-human-v3-normals-r1/loader.mjs';
import {verify as verifyPieceNormals} from '../training-human-v3-normals-r3/loader.mjs';
import {verify as verifyWrist} from '../training-human-v3-wrist-r1/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export async function verify(){
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(manifest.hashPolicy!=='utf8-crlf-to-lf-text; binary-raw')throw Error('unsupported completed-v3 hash policy');
 for(const [relative,expected]of Object.entries(manifest.sha256)){
  const file=path.resolve(repo,relative);if(!file.startsWith(repo+path.sep))throw Error('invalid source path');
  const bytes=fs.readFileSync(file),canonical=relative.endsWith('.glb')?bytes:Buffer.from(new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/\r\n/g,'\n'),'utf8');
  if(crypto.createHash('sha256').update(canonical).digest('hex')!==expected)throw Error('completed-v3 SHA mismatch: '+relative);
 }
 const collar=verifyCollar(),base=verifyBaseNormals(),piece=verifyPieceNormals(),wrist=verifyWrist();
 return {version:manifest.version,status:manifest.status,collar,base:base.version,piece:piece.version,wrist:wrist.version};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await verify()));
