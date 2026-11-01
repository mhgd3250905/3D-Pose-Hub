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
export const PORT_VERSION = 'v2skin-port-r2';

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
  // r2 look tune (user-approved probe probe-hi3, 2026-10-31): extra uniforms, all default to the unchanged V2 look (uV3In 0, uV3Em 0, uV3RA 0.94)
  ['tune: uniform declarations', 'uniform vec3 uV2pRHi;', 'uniform vec3 uV2pRHi; uniform float uV3In; uniform float uV3Fe; uniform vec3 uV3Em; uniform float uV3RA;'],
  ['tune: highlight mask inward-only with feather (uV3In)', 'return mix(0.5*(s1+s2),s1,k); }', 'return uV3In>0.5 ? s1*smoothstep(0.0,max(uV3Fe,0.5),v2rGp) : mix(0.5*(s1+s2),s1,k); }'],
  ['tune: uniform defaults', "uV2pRHi: { value: [0.94, 1, 251.3] } };", "uV2pRHi: { value: [0.94, 1, 251.3] }, uV3In: { value: 0 }, uV3Fe: { value: 2.5 }, uV3Em: { value: [0,0,0] }, uV3RA: { value: 0.94 } };"],
  ['tune: highlight emissive (uV3Em)', ' if(v2rPaint>0.5) lit*=uV2pRTint;', ' lit+=uV3Em*d; if(v2rPaint>0.5) lit*=uV2pRTint;'],
  ['tune: line glow suppressed over the highlight', 'lit+=uV2pRLine*uV2pRGlow.y*v2rLk', 'lit+=(1.0-uV3In*clamp(d*3.0,0.0,1.0))*uV2pRLine*uV2pRGlow.y*v2rLk'],
  ['tune: unpainted highlight alpha uniform (uV3RA)', 'd*(v2rAct>0.5?uV2pRHi.x:0.94)', 'd*(v2rAct>0.5?uV2pRHi.x:uV3RA)'],
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

const lin = h => [1, 3, 5].map(i => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
// skin.look.v3Tune -> the concrete values the browser applies (colours sRGB hex -> linear, like the probe)
export function resolveTune(t) {
  if (!t) return null;
  return { lwK: t.lineWidthK, laK: t.lineAlphaK, glowK: t.glowK, line: t.lineColor ? lin(t.lineColor) : null, inward: t.inwardMask ? 1 : 0, fe: t.featherPx,
    hi: t.highlight ? { c: lin(t.highlight.color), shade: t.highlight.shade.slice(), a: t.highlight.alpha } : null,
    em: t.emissive ? lin(t.emissive.color).map(c => c * t.emissive.k) : [0, 0, 0] };
}
// r2 look tune. Call AFTER the v2Params snapshot check: the tune edits the live SKINS line / highlight entries (as the approved probe did) and wraps
// __v2p.setSkin so every skin switch (incl. the per-stage selectModelProfile re-apply) ends with the tuned uniforms. Returns the tuned SKINS entries.
export async function applyV3Tunes(page, tunes) {
  return page.evaluate(T => { const V = window.__v2p;
    for (const [n, t] of Object.entries(T)) { const K = V.SKINS[n]; if (!K) throw Error('v3Tune for unknown V2 skin ' + n);
      V.SKINS[n] = { ...K, ...(t.line ? { line: t.line } : {}), hi: { ...K.hi, ...(t.hi || {}) } }; }
    const base = V.setSkin, OFF = { uV3In: 0, uV3Fe: 2.5, uV3Em: [0, 0, 0] };
    V.__v3Tunes = T;
    V.setSkin = function(name) { const r = base.call(this, name), U = V.regions.uni, t = name && T[name], K = name && V.SKINS[name];
      if (t) { U.uV2pRLw.value = K.lw * t.lwK; U.uV2pRLa.value = K.la * t.laK; U.uV2pRGlow.value = [K.glow[0], K.glow[1] * t.glowK];
        U.uV3In.value = t.inward; U.uV3Fe.value = t.fe; U.uV3Em.value = t.em.slice(); }
      else for (const [k, v] of Object.entries(OFF)) U[k].value = Array.isArray(v) ? v.slice() : v;
      return r; };
    return Object.fromEntries(Object.keys(T).map(n => [n, JSON.parse(JSON.stringify(V.SKINS[n]))])); }, tunes);
}
