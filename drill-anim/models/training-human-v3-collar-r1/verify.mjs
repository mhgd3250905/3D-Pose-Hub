// Portable recursive manifest verification: normalize text line endings only.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export function verify(){
 const visited=new Set();
 function check(relative){
  const file=path.resolve(repo,relative);if(!file.startsWith(repo+path.sep))throw Error('invalid manifest path');
  if(visited.has(file))return;visited.add(file);
  const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
  if(manifest.hashPolicy!=='utf8-crlf-to-lf-text; binary-raw')throw Error('unsupported hash policy');
  for(const [name,expected]of Object.entries(manifest.sha256)){
   const target=path.resolve(repo,name);if(!target.startsWith(repo+path.sep))throw Error('invalid asset path');
   const bytes=fs.readFileSync(target),data=name.endsWith('.glb')?bytes:Buffer.from(new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/\r\n/g,'\n'),'utf8');
   if(crypto.createHash('sha256').update(data).digest('hex')!==expected)throw Error('training-human-v3-collar-r1: SHA mismatch '+name);
  }
  for(const dependency of manifest.verifyDependencies||[]){if(!dependency.endsWith('/verify.mjs'))throw Error('invalid dependency');check(dependency.slice(0,-'verify.mjs'.length)+'manifest.json');}
 }
 check('drill-anim/models/training-human-v3-collar-r1/manifest.json');
 return {version:'1.0.0-r1',status:'experimental-candidate',manifests:visited.size};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(verify()));
