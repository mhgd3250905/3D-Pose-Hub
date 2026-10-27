// Assemble a deterministic, verified model overlay into a NEW directory.
// This copies frozen source assets; it does not reconstruct mesh edits.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
if(process.argv.length!==3)throw Error('Usage: node build.mjs <new-output-directory>');
const out=path.resolve(process.argv[2]);if(fs.existsSync(out))throw Error('output already exists');
const files=new Map(),visited=new Set();
function resolve(relative){const p=path.resolve(repo,relative);if(!p.startsWith(repo+path.sep))throw Error('invalid input path');return p;}
function canonical(relative){const raw=fs.readFileSync(resolve(relative));return relative.endsWith('.glb')?raw:Buffer.from(new TextDecoder('utf-8',{fatal:true}).decode(raw).replace(/\r\n/g,'\n'),'utf8');}
function add(relative,expected){const bytes=canonical(relative),hash=crypto.createHash('sha256').update(bytes).digest('hex');if(expected&&expected!==hash)throw Error(`SHA mismatch: ${relative}`);const prior=files.get(relative);if(prior&&!prior.equals(bytes))throw Error(`conflicting input: ${relative}`);files.set(relative,bytes);}
function collect(relative){
 if(visited.has(relative))return;visited.add(relative);add(relative);
 const manifest=JSON.parse(fs.readFileSync(resolve(relative),'utf8'));
 if(manifest.hashPolicy!=='utf8-crlf-to-lf-text; binary-raw')throw Error('unsupported hash policy');
 for(const [file,sha]of Object.entries(manifest.sha256))add(file,sha);
 for(const dep of manifest.verifyDependencies||[]){if(!dep.endsWith('/verify.mjs'))throw Error('invalid verifier');add(dep);collect(dep.slice(0,-'verify.mjs'.length)+'manifest.json');}
}
collect('drill-anim/models/training-human-v3-collar-r1/manifest.json');
fs.mkdirSync(out);
for(const [relative,bytes]of [...files].sort(([a],[b])=>a.localeCompare(b))){const target=path.resolve(out,relative);if(!target.startsWith(out+path.sep))throw Error('invalid output path');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});}
console.log(JSON.stringify({out,files:files.size,manifests:visited.size,format:'LF-normalized verified model overlay',limitations:'requires the rest of the existing repository, its dependencies, and a running v3 server'}));
