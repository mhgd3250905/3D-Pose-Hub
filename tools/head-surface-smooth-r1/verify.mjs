import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verify as verifyBase} from '../../drill-anim/models/training-human-v3-armfix-r2/verify.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function verify(){
 const manifest=JSON.parse(fs.readFileSync(new URL('./manifest.json',import.meta.url)));
 if(manifest.profile!=='head-surface-smooth'||manifest.version!=='0.1.0-r1'||manifest.status!=='preview-candidate')throw Error('Wrong head appearance version');
 await verifyBase();
 for(const [file,expected] of Object.entries(manifest.sources)){
  const actual=createHash('sha256').update(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n')).digest('hex');
  if(actual!==expected)throw Error('Head appearance source changed: '+file);
 }
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await verify();console.log('Original head and smoothing source pins verified');}
