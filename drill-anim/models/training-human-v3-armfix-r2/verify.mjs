import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import * as base from '../training-human-v3-armfix-r1/verify.mjs';
import * as original from '../training-human-v3-completed-r7/loader.mjs';
import {verify as verifyHands} from '../hands-native-c1r2-symmetric-r1/loader.mjs';
import {HAND_SOURCE} from './recipe.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v3-armfix',VERSION='0.1.0-r2';
export async function verify(){
 await base.verify();await original.verify();await verifyHands();
 const m=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 if(m.profile!==PROFILE||m.version!==VERSION||m.hashPolicy!=='utf8-crlf-to-lf-text; binary-raw'||m.stage!=='P1-P3-L2'||m.status!=='candidate-unreviewed')throw Error('armfix-r2 identity');
 if(m.recipe?.handDir!==HAND_SOURCE||m.recipe.handScale!==1||m.recipe.upperArmScale!==1||m.recipe.forearmScale!==1||m.reviewed!==false||m.releaseEligible!==false)throw Error('armfix-r2 fixed recipe/status');
 const required=['base.mjs','proportion-base.mjs','recipe.mjs','loader.mjs','collar.mjs','normal-sync.mjs','verify.mjs','armfix.test.mjs'];
 if(required.some(f=>!m.sha256['drill-anim/models/training-human-v3-armfix-r2/'+f])||!m.sha256['drill-anim/models/'+HAND_SOURCE+'/manifest.json'])throw Error('armfix-r2 missing required source pins');
 for(const[rel,sha]of Object.entries(m.sha256)){const f=path.resolve(repo,rel);if(!f.startsWith(repo+path.sep))throw Error('armfix-r2 path');const raw=fs.readFileSync(f),data=rel.endsWith('.glb')?raw:Buffer.from(raw.toString('utf8').replaceAll('\r\n','\n'));if(crypto.createHash('sha256').update(data).digest('hex')!==sha)throw Error('armfix-r2 SHA '+rel);}
 return {profile:PROFILE,version:VERSION,stage:m.stage,files:Object.keys(m.sha256).length,status:'candidate-unreviewed'};
}
