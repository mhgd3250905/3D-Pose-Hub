// Independent coverage adapter. Frozen v2skin-port-r2 and approved model sources stay intact.
import {
  portedSource as originalPortedSource, regionTable, sha256,
} from '../action-package-v3/v2-skins/port.mjs';

export {
  REPO, V2_SOURCE, V2_TABLE, regionTable, resolveTune, applyV3Tunes,
  setV2Skin, v2SkinParams, sha256,
} from '../action-package-v3/v2-skins/port.mjs';
export const PORT_VERSION = 'v2skin-coverage-r1';

function replaceOnce(source, label, from, to) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw Error(`skin coverage: ${label} matched ${count} times`);
  return source.replace(from, to);
}

export function portedSource() {
  const original = originalPortedSource();
  let code = original.code;
  const patches = [];
  const replace = (label, from, to) => {
    code = replaceOnce(code, label, from, to); patches.push(label);
  };
  // Eye softening swaps material slot 1. Keep the legacy diagnostic field current,
  // but never use it as the source of truth for live material objects.
  replace('live material slots',
    'function meshes() { const v = flareInspector.viewer, out = [], re = ',
    `function liveMaterials(o) {
  const re = /^(toon-drill1-v2p($|\\||-collar-shared-r27-torso|-inner-collar-refine)|head-neck-toon-r4-[01]($|\\||-collar-shared-r27))/;
  const ms = [o.material].flat().filter(m => m && re.test(m.customProgramCacheKey?.() || ''));
  o.__v2prMats = ms; return ms;
}
function meshes() { const v = flareInspector.viewer, out = [], re = `);
  replace('initial scan uses live slots',
    "const ms = [o.material].flat().filter(x => re.test(x.customProgramCacheKey?.() || ''));",
    'const ms = liveMaterials(o);');
  replace('patch uses live slots',
    'function patch(o, tex) { for (const m of (o.__v2prMats || [o.material])) patch1(o, tex, m); }',
    'function patch(o, tex) { for (const m of liveMaterials(o)) patch1(o, tex, m); }');
  // Package/head wrappers can prepend declarations before VS. An inherited clone
  // already has the region shader: rebind its holder without injecting it twice.
  replace('idempotence through outer wrappers',
    'if (sh.vertexShader.startsWith(VS)) return;',
    'if (sh.vertexShader.includes(VS)) return;');
  replace('only rewrap changed live materials',
    'function patchHolder(o, holder) { patch(o, null); for (const mat of (o.__v2prMats || [o.material])) {',
    `function patchHolder(o, holder) { for (const mat of liveMaterials(o)) {
  if (mat.onBeforeCompile === mat.__v2prHook && mat.__v2prHolder === holder) continue;
  patch1(o, null, mat);`);
  replace('remember holder identity',
    'mat.__v2prHook = mat.onBeforeCompile; } }',
    'mat.__v2prHook = mat.onBeforeCompile; mat.__v2prHolder = holder; } }');
  replace('refresh live slot hooks on skin switch',
    'if ((o.__v2prMats || [o.material]).some(m => m.onBeforeCompile !== m.__v2prHook)) patchHolder(o, h);',
    'if (liveMaterials(o).some(m => m.onBeforeCompile !== m.__v2prHook || m.__v2prHolder !== h)) patchHolder(o, h);');
  replace('diagnostics report current material',
    "(o.__v2prMats || [o.material])[0].uuid.slice(0, 4)",
    "(liveMaterials(o)[0]?.uuid || 'none').slice(0, 4)");
  return { ...original, code, portedSha256: sha256(code),
    basePortedSha256: original.portedSha256,
    patches: [...original.patches, ...patches] };
}

// Prefer installation after the approved look/eye clone and before the first
// skin bake. Later same-geometry material clones are also rebound on setSkin.
// As with r2, re-stage after the initial bake because baking resets the pose.
export async function installV2Skins(page) {
  const { code } = portedSource(), { table } = regionTable();
  await page.addScriptTag({ content: code });
  return page.evaluate(t => {
    const V = window.__v2p, info = V.loadRegions(t), E = window.__drill, sel = E.selectModelProfile;
    E.selectModelProfile = function(spec) {
      const result = sel.call(this, spec);
      if (V.skinOverride) { V.regions.skin = undefined; V.setSkin(V.skinOverride); }
      return result;
    };
    return info;
  }, table);
}
