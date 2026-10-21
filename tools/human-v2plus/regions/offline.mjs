// Offline region labelling (no browser): re-evaluates the shapes in drill-anim/page/human-v2plus-regions.js on a rest-pose dump
// (tools/human-v2plus/regions.mjs --dump) and writes per-vertex labels. Fast iteration on shapes; the browser bake is the same argmin.
//   node tools/human-v2plus/regions/offline.mjs <dump.json> <out labels.json>
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
globalThis.window = { __v2p: {} };
new Function(fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8'))();
const { S, charts, MID } = window.__v2p.regions._dev;
const T = JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models/training-human-v2plus-regions.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const pos = x => Math.max(0, x);
const out = D.map(m => { const lab = new Int16Array(m.n); const fns = T.base.map(k => S[k]);
  for (let i = 0; i < m.n; i++) { const x = m.rd[i * 4], c = charts(x, m.rd[i * 4 + 1], m.rd[i * 4 + 2], m.rd[i * 4 + 3]); let best = 1e9, bi = 0;
    for (let b = 0; b < fns.length; b++) { const v = fns[b](c); const l = v + MID * pos(-x), r = v + MID * pos(x); if (l < best) { best = l; bi = 2 * b; } if (r < best) { best = r; bi = 2 * b + 1; } }
    lab[i] = bi; }
  return { name: m.name, lab: Array.from(lab) }; });
fs.writeFileSync(process.argv[3], JSON.stringify(out)); console.log('ok', out.map(o => o.name + ':' + o.lab.length).join(' '));
