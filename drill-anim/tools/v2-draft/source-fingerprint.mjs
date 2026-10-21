import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {sourceFingerprint as legacyFingerprint} from '../v2/source-fingerprint.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function sourceFingerprint(repo,spec){
 const legacy=legacyFingerprint(repo,spec),sources=[...legacy.sources];
 for(const dir of ['drill-anim/tools/v2-draft','tools/action-library-v2-draft'])for(const e of fs.readdirSync(path.join(repo,dir))){
  if(!/\.(mjs|js)$/.test(e))continue;const name=dir+'/'+e,b=fs.readFileSync(path.join(repo,name));sources.push({path:name,bytes:b.length,sha256:sha(b)});
 }
 sources.sort((a,b)=>a.path.localeCompare(b.path));return {format:'pose-hub-draft-render-source@1',status:'draft-unreviewed',reviewed:false,modelOverride:'resolve current + 1080 / 30 fps / alignClavicles false; native eight seconds only',sha256:sha(JSON.stringify(sources)),sources};
}
