import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readApproved} from '../preview-current-model.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
export function verify(){
 const {approved}=readApproved(),manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(manifest.id!=='skin-coverage'||manifest.version!=='0.1.0-r1'||manifest.approvedBase!==approved.id)throw Error('Skin coverage/base version mismatch');
 for(const [rel,expected] of Object.entries(manifest.sources)){
  const full=path.resolve(root,rel),inside=path.relative(root,full);
  if(inside.startsWith('..')||path.isAbsolute(inside))throw Error('Source outside checkout');
  const actual=createHash('sha256').update(fs.readFileSync(full,'utf8').replace(/\r\n/g,'\n')).digest('hex');
  if(actual!==expected)throw Error('Skin coverage source drift: '+rel);
 }
 return {manifest};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){console.log(JSON.stringify(verify()));}
