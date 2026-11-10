import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verify as verifyBase} from '../../drill-anim/models/training-human-v3-armfix-r2/verify.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function verify(){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/head-detail-simplify-r1/manifest.json')));
 if(manifest.profile!=='head-detail-simplify'||manifest.version!=='0.1.0-r1'||manifest.status!=='preview-candidate')throw Error('Unexpected faceless component identity');
 await verifyBase();
 for(const [file,pin] of Object.entries(manifest.sources)){
  const bytes=fs.readFileSync(path.join(root,file));
  const actual=createHash('sha256').update(pin.encoding==='lf'?bytes.toString('utf8').replace(/\r\n/g,'\n'):bytes).digest('hex');
  if(actual!==pin.sha256)throw Error('Faceless source drift: '+file);
 }
 const geometry=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/head-detail-simplify-r1/geometry.json')));
 if(geometry.sourceRestSha256!==manifest.sourceRestSha256||geometry.version!==manifest.version)throw Error('Wrong source rest geometry');
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await verify();console.log('head-detail-simplify 0.1.0-r1: base, geometry and source pins verified');
}
