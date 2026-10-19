// Opt-in loader for the training-human-v2plus prototype profile (page/human-v2plus.js + models/training-human-v2plus-hands.json).
// lib/render.mjs calls it only for specs with modelProfile:'training-human-v2plus'; call after boot(), before props are added.
// The compression outfit data (models/training-human-v2plus-outfit.json) is prepared too; it shows only for specs with v2plus.outfit:'compression'.
// The base-mesh torso (Blender Human Base Meshes, CC0; models/training-human-v2plus-torso-base.json) is loaded only when the spec sets v2plus.torso:'base'.
import fs from 'node:fs';import path from 'node:path';import {ROOT} from './config.mjs';
export async function applyHumanV2plus(p,spec){
  await p.addScriptTag({content:fs.readFileSync(path.join(ROOT,'page/human-v2plus.js'),'utf8')});
  const meta=JSON.parse(fs.readFileSync(path.join(ROOT,'models/training-human-v2plus-hands.json'),'utf8'));
  const outfit=JSON.parse(fs.readFileSync(path.join(ROOT,'models/training-human-v2plus-outfit.json'),'utf8'));
  const r=await p.evaluate(([m,o])=>__v2p.load(m,o),[meta,outfit]);if(!r||!r.patched)throw new Error('human-v2plus: no toon material patched');
  // opt-in base-mesh torso (v2plus.torso:'base'): only loaded for specs that ask for it
  if(spec?.v2plus?.torso){const torso=JSON.parse(fs.readFileSync(path.join(ROOT,'models/training-human-v2plus-torso-base.json'),'utf8'));r.torso=await p.evaluate(d=>__v2p.loadTorso(d),torso);}
  return r;
}
