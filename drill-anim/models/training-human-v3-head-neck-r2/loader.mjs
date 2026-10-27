// Experimental v3 loader with the independently stored, ID-restored P2 fragment.
// Preserves the original v3 loader and every frozen asset.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as v3 from '../training-human-v3/loader.mjs';
export { boot } from '../training-human-v3/loader.mjs';
export const PROFILE = 'training-human-v3-head-neck', VERSION = '1.0.0-r2';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const json = file => JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8'));
const browserUrl = file => '/@fs/' + path.join(repo, file).replaceAll('\\', '/');
export async function verify() {
  const visited = new Set();
  function check(manifestFile) {
    const resolved = path.resolve(repo, manifestFile);
    if (!resolved.startsWith(repo + path.sep)) throw new Error('invalid manifest path');
    if (visited.has(resolved)) return;
    visited.add(resolved); const manifest = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    if (manifest.hashPolicy !== 'utf8-crlf-to-lf-text; binary-raw') throw new Error('unsupported hash policy');
    for (const [relative, expected] of Object.entries(manifest.sha256)) {
      const file = path.resolve(repo, relative); if (!file.startsWith(repo + path.sep)) throw new Error('invalid asset path');
      const bytes = fs.readFileSync(file), data = relative.endsWith('.glb') ? bytes : Buffer.from(new TextDecoder('utf-8', {fatal:true}).decode(bytes).replace(/\r\n/g, '\n'), 'utf8');
      if (crypto.createHash('sha256').update(data).digest('hex') !== expected) throw new Error(`training-human-v3-head-neck-r2: SHA mismatch ${relative}`);
    }
    for (const verifier of manifest.verifyDependencies || []) {
      if (!verifier.endsWith('/verify.mjs')) throw new Error('invalid verifier path');
      check(verifier.slice(0, -'verify.mjs'.length) + 'manifest.json');
    }
  }
  const relative = 'drill-anim/models/training-human-v3-head-neck-r2/manifest.json'; check(relative);
  const manifest = json(relative); return {version:manifest.version,status:manifest.status,manifests:visited.size};
}
export async function applyV3(page, spec, options = {}) {
  await verify();
  if (spec?.v2plus?.head) throw new Error('training-human-v3-head-neck-r2: alternative head is unsupported');
  if (await page.evaluate(() => !!window.__v3HeadNeckFragment)) throw new Error('training-human-v3-head-neck-r2: already installed');
  const result = await v3.applyV3(page, spec, options);
  await page.evaluate(s => { __drill.selectModelProfile(s); flareInspector.viewer.motion.reset(); }, spec);
  const binary = fs.readFileSync(path.join(repo, 'drill-anim/models/head-neck-fragment-r3/head-neck.glb')).toString('base64');
  const asset = json('drill-anim/models/head-neck-toon-r4/asset.json');
  const attached = await page.evaluate(async ([data, url, asset]) => {
    const v = flareInspector.viewer, raw = atob(data), bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const neck = v.coach.getObjectByName('Mesh001'), head = v.coach.getObjectByName('Toon_Mannequin_Head_v5'), body = v.coach.getObjectByName('Coach_Body');
    if (!neck || !head || !body?.skeleton || !window.__toonUni || !window.__mmUni || !window.__v2p?.uni)
      throw new Error('training-human-v3-head-neck-r2: missing v3 scene components');
    const {attachHeadNeckFragment} = await import(url);
    const fragment = await attachHeadNeckFragment({binary:bytes.buffer, parent:head.parent, skeleton:body.skeleton, toonAsset:asset,
      uniforms:{toon:window.__toonUni,muscle:window.__mmUni,v2p:window.__v2p.uni}, hide:[neck,head]});
    const engine = window.__drill, originalSelect = engine.selectModelProfile;
    function select(spec) {
      if (spec?.v2plus?.head) throw new Error('training-human-v3-head-neck-r2: alternative head is unsupported');
      const result = originalSelect.call(this, spec);
      neck.visible = false; head.visible = false; fragment.mesh.visible = true;
      return result;
    }
    engine.selectModelProfile = select;
    window.__v3HeadNeckFragment = { fragment, neck, head, engine, originalSelect, select };
    return {bones:fragment.bones,materials:fragment.materials,seamEdges:fragment.seamEdges};
  }, [binary, browserUrl('drill-anim/models/head-neck-fragment-r3/loader.mjs'), asset]);
  return {...result, fragment: attached, fragmentProfile: PROFILE, fragmentVersion: VERSION};
}
export async function detach(page) {
  return page.evaluate(() => {
    const state = window.__v3HeadNeckFragment; if (!state) return false;
    if (state.engine.selectModelProfile !== state.select) throw new Error('training-human-v3-head-neck-r2: profile wrapper was replaced; refusing unsafe detach');
    state.engine.selectModelProfile = state.originalSelect; state.fragment.dispose(); delete window.__v3HeadNeckFragment; return true;
  });
}