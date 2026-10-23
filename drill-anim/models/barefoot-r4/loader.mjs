// Separate loader: existing render.mjs/current-production and original model files remain untouched.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {applyHumanV2plus} from '../../lib/human-v2plus.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export async function applyHumanBarefoot(p,spec){
 if(spec.modelProfile!=='training-human-v2plus-barefoot'||spec.barefoot?.version!=='1.0.0-r4.1')throw new Error('Unsupported isolated barefoot profile');
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
 for(const [rel,expected]of Object.entries(manifest.sourceSha256)){
  const data=fs.readFileSync(path.resolve(here,rel));if(crypto.createHash('sha256').update(data).digest('hex')!==expected)throw new Error('barefoot source SHA mismatch: '+rel);
 }
 await applyHumanV2plus(p,Object.assign({},spec,{modelProfile:'training-human-v2plus'}));
 await p.addScriptTag({content:fs.readFileSync(path.join(here,'feet.js'),'utf8')});
 await p.evaluate(data=>__barefootR4.load(data),JSON.parse(fs.readFileSync(path.join(here,'feet-base.json'),'utf8')));
 return {profile:manifest.id,version:manifest.version,oldProductionUnchanged:true};
}
