// Opt-in hook for highlight v2 "soft" (page/soft-highlight.js). Call after boot() and before the first frame.
// A theme without highlight.soft returns null and changes nothing (old batches/themes render exactly as before).
import fs from 'node:fs';import path from 'node:path';import {ROOT} from './config.mjs';
export async function applySoftHighlight(p,theme){
  const soft=theme?.highlight?.soft;if(!soft||soft.on===false)return null;
  await p.addScriptTag({content:fs.readFileSync(path.join(ROOT,'page/soft-highlight.js'),'utf8')});
  const r=await p.evaluate(s=>__softHighlight(s),soft);
  if(!r||!r.patched)throw new Error('soft-highlight: no toon material patched');
  return {version:'soft-v1',patched:r.patched,params:r.params};
}
