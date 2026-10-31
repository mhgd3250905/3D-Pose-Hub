// V2 skin port: takes the ORIGINAL V2 skin implementation (drill-anim/page/human-v2plus-regions.js, the M9 SKINS + baked
// muscle-region shader) unchanged as the source of truth, and applies a small, asserted set of text patches so it runs on the
// current v3 model (training-human-v3-armfix r2): multi-material meshes (the shared head/neck/torso mesh), the v3 torso material
// keys, and the v3 profile name. Every patch must match exactly once, so a changed V2 source fails loudly instead of drifting.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../../..');
export const V2_SOURCE = 'drill-anim/page/human-v2plus-regions.js';
export const V2_TABLE = 'drill-anim/models/training-human-v2plus-regions.json';
export const PORT_VERSION = 'v2skin-port-r1';

// material keys of the v3 body parts that the V2 skins paint (V2 matched only /^toon-drill1-v2p($|\|)/)
const MAT_RE = '/^(toon-drill1-v2p($|\\||-collar-shared-r27-torso|-inner-collar-refine)|head-neck-toon-r4-[01]($|-collar-shared-r27))/';
const PATCHES = [
  ['meshes(): v3 torso / head-neck keys, multi-material meshes (every matching slot)',
    "function meshes() { const v = flareInspector.viewer, out = []; v.coach.traverse(o => { if (o.isSkinnedMesh && o.material && /^toon-drill1-v2p($|\\|)/.test(o.material.customProgramCacheKey?.() || '')) out.push(o); });",
    `function meshes() { const v = flareInspector.viewer, out = [], re = ${MAT_RE}; v.coach.traverse(o => { if (!o.isSkinnedMesh || !o.material) return; const ms = [o.material].flat().filter(x => re.test(x.customProgramCacheKey?.() || '')); if (ms.length) { o.__v2prMats = ms; out.push(o); } });`],
  ['patch(): every matched material slot', 'function patch(o, tex) { const mat = o.material, ob = mat.onBeforeCompile;',
    'function patch(o, tex) { for (const m of (o.__v2prMats || [o.material])) patch1(o, tex, m); }\nfunction patch1(o, tex, mat) { const ob = mat.onBeforeCompile;'],
  ['patchHolder(): every matched material slot (head)', 'function patchHolder(o, holder) { const mat = o.material, ob = mat.onBeforeCompile; patch(o, null);',
    'function patchHolder(o, holder) { patch(o, null); for (const mat of (o.__v2prMats || [o.material])) {'],
  ['patchHolder(): every matched material slot (tail)', 'mat.__v2prHook = mat.onBeforeCompile; }', 'mat.__v2prHook = mat.onBeforeCompile; } }'],
  ['setRegions(): re-wrap check on every matched slot', 'if (o.material.onBeforeCompile !== o.material.__v2prHook)', 'if ((o.__v2prMats || [o.material]).some(m => m.onBeforeCompile !== m.__v2prHook))'],
  ['meshInfo: first matched slot uuid', 'map(o => o.material.uuid.slice(0, 4)', 'map(o => (o.__v2prMats || [o.material])[0].uuid.slice(0, 4)'],
];

export const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');

export function portedSource() {
  const src = fs.readFileSync(path.join(REPO, V2_SOURCE), 'utf8');
  let out = src;
  for (const [label, from, to] of PATCHES) {
    const n = out.split(from).length - 1;
    if (n !== 1) throw new Error(`v2 skin port: patch "${label}" matched ${n} times (V2 source changed?)`);
    out = out.replace(from, to);
  }
  return { code: out, sourceSha256: sha256(src), portedSha256: sha256(out), patches: PATCHES.map(p => p[0]) };
}

export function regionTable() {
  const buf = fs.readFileSync(path.join(REPO, V2_TABLE));
  return { table: JSON.parse(buf.toString('utf8')), sha256: sha256(buf) };
}

// Install the ported V2 skins into an open recipe scene (after openScene). Bakes once in the rest pose; afterwards
// selectModelProfile (called on every stage) re-applies the chosen skin. Returns the bake info.
export async function installV2Skins(page) {
  const { code } = portedSource();
  const { table } = regionTable();
  await page.addScriptTag({ content: code });
  return page.evaluate(t => { const V = window.__v2p, info = V.loadRegions(t), E = window.__drill, sel = E.selectModelProfile;
    // the V2 profile gate only knows 'training-human-v2plus': after every profile select (each stage, which also resets the theme
    // highlight colours) re-apply every uniform of the chosen skin
    E.selectModelProfile = function(spec) { const r = sel.call(this, spec); if (V.skinOverride) { V.regions.skin = undefined; V.setSkin(V.skinOverride); } return r; };
    return info; }, table);
}

// skin: a V2 SKINS key, or null / 'realistic' for the native look. Must be followed by a re-stage (bake resets the pose).
export async function setV2Skin(page, skin) {
  return page.evaluate(n => window.__v2p.setSkin(n), skin === 'realistic' ? null : skin);
}

export async function v2SkinParams(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__v2p.SKINS)));
}
