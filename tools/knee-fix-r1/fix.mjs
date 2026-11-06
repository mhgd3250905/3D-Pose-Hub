// Knee fix r1 builder: writes <spec>-kn1.js (JSON literal, original untouched) for each action and repoints its recipe.
//   node tools/knee-fix-r1/fix.mjs <actionId>...      (FIX table in plan.mjs; corrections in corr/<id>.json if present)
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { pathToFileURL } from 'node:url';
import { liftPelvis, addPelvisY } from './kn-lib.mjs';
import { PLAN } from './plan.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const RECIPES = [path.join(ROOT, 'catalog/production/remaining219-r1/recipes')];
const G = path.join(ROOT, 'catalog/production/remaining32-r4/groups');
for (const g of fs.readdirSync(G)) RECIPES.push(path.join(G, g));
export const recipePath = id => RECIPES.map(d => path.join(d, id + '.json')).find(f => fs.existsSync(f));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const interp = (pts, t) => { if (!pts.length) return 0; if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, x] = pts[i - 1], [b, y] = pts[i]; return x + (y - x) * (t - a) / (b - a); }
  return pts[pts.length - 1][1]; };
export async function build(id) {
  const rp = recipePath(id), rec = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const from = rec.kneeFix?.r1?.from || rec.spec;          // always rebuild from the pre-fix spec
  const spec = structuredClone((await import(pathToFileURL(path.join(ROOT, from)) + '?' + Date.now())).default);
  const plan = PLAN[id] || {};
  const kind = plan.lift === false ? null : liftPelvis(spec, plan.map);
  if (plan.custom) plan.custom(spec);
  const cf = path.join(ROOT, 'tools/knee-fix-r1/corr', id + '.json');
  const corr = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : null;
  if (corr) addPelvisY(spec, t => interp(corr.dy, t));
  const nid = path.basename(from, '.js') + '-kn1'; spec.id = nid;
  const dst = path.join(path.dirname(from), nid + '.js');
  const note = `knee fix r1 (2026-11-06) of ${path.basename(from)}: pelvis height rescaled to the v3 leg (kn-lib g)${plan.note ? '; ' + plan.note : ''}${corr ? '; per-frame pelvis-y correction kn1y (' + corr.why + ')' : ''}`;
  const txt = `// ${nid}: ${note}\nexport default ${JSON.stringify(spec, null, 2)};\n`;
  fs.writeFileSync(path.join(ROOT, dst), txt);
  rec.spec = dst; rec.specSha256Lf = sha(Buffer.from(txt));
  if (rec.source && 'selectedSpec' in rec.source) rec.source.selectedSpec = dst;
  rec.kneeFix = { r1: { from, to: dst, date: '2026-11-06', branch: 'codex/knee-fix-r1', note } };
  fs.writeFileSync(rp, JSON.stringify(rec, null, 2) + '\n');
  return { id, from, dst, kind: kind?.kind, corr: !!corr };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname))
  for (const id of process.argv.slice(2)) console.log(JSON.stringify(await build(id)));
