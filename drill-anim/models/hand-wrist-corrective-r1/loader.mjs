import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {verify as verifyBase} from '../training-human-v3-armfix-r2/verify.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const VERSION='0.1.1-r2';
export function verify(){verifyBase();const m=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));if(m.version!==VERSION||m.reviewed!==false||m.releaseEligible!==false)throw Error('wrist corrective manifest identity');for(const [p,h]of Object.entries(m.sourceSha256)){const raw=fs.readFileSync(path.join(repo,p),'utf8').replaceAll('\r\n','\n');if(crypto.createHash('sha256').update(raw).digest('hex')!==h)throw Error('wrist corrective SHA mismatch: '+p);}return m;}
export async function install(page,{enabled=true}={}){
 verify();const d=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/hands-native-c1r2-symmetric-r1/hands-base.json'),'utf8'));
 const options={enabled,seamPairs:d.limbsNrm.idx.map((i,k)=>[d.seam.first+k,i])};
 await page.evaluate(x=>{window.__wristCorrectiveOptions=x;},options);
 await page.addScriptTag({content:fs.readFileSync(path.join(here,'kernel.js'),'utf8')});
 await page.addScriptTag({content:fs.readFileSync(path.join(here,'runtime.js'),'utf8')});
 return page.evaluate(()=>({version:__wristCorrective.version,active:__wristCorrective.active,config:__wristCorrective.config}));
}
