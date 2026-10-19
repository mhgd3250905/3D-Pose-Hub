// Opt-in loader for the training-human-v2plus prototype profile (page/human-v2plus.js + models/training-human-v2plus-hands.json).
// lib/render.mjs calls it only for specs with modelProfile:'training-human-v2plus'; call after boot(), before props are added.
import fs from 'node:fs';import path from 'node:path';import {ROOT} from './config.mjs';
export async function applyHumanV2plus(p){
  await p.addScriptTag({content:fs.readFileSync(path.join(ROOT,'page/human-v2plus.js'),'utf8')});
  const meta=JSON.parse(fs.readFileSync(path.join(ROOT,'models/training-human-v2plus-hands.json'),'utf8'));
  const r=await p.evaluate(m=>__v2p.load(m),meta);if(!r||!r.patched)throw new Error('human-v2plus: no toon material patched');return r;
}
