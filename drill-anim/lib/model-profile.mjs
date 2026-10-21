// Production defaults apply to newly authored v2plus specs or an explicit override.
// Existing v2/legacy specs retain their original profile when no override is given.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './config.mjs';
export function productionModel() {
  return JSON.parse(fs.readFileSync(path.join(ROOT,'models/current-production.json'),'utf8'));
}
export function resolveModelSpec(source,{profile,skin}={}) {
  const defaults=productionModel();
  const chosen=profile==='current'?defaults.modelProfile:(profile||source.modelProfile);
  if(profile&&!['current','legacy-v7','training-human-v2','training-human-v2plus'].includes(profile))throw new Error('Unknown model profile: '+profile);
  if(skin&&chosen!=='training-human-v2plus')throw new Error('--skin requires training-human-v2plus');
  if(chosen==='training-human-v2plus')return {...source,modelProfile:chosen,alignClavicles:false,v2plus:{...defaults.v2plus,...source.v2plus,...(skin?{skin}:{})}};
  if(!profile)return source;
  return {...source,modelProfile:chosen,...(chosen==='training-human-v2'?{alignClavicles:false}:{})};
}
