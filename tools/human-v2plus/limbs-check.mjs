// base-mesh limbs headless checks (no images): joints identical with / without limbs:'base' at key frames (max |diff| mm),
// and the region label anchors in the limbs bake state (anchorsByState) resolve, are not stale and sit on the right meshes.
//   tools/human-v2plus/run.sh tools/human-v2plus/limbs-check.mjs
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const theme = loadTheme(null); const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const { b, p } = await boot({ size: 320, pr: 1, theme, bakeHands: [] });
p.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
for (const f of ['human-v2plus.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page', f), 'utf8') });
await p.evaluate(([m, o]) => __v2p.load(m, o), [R('training-human-v2plus-hands.json'), R('training-human-v2plus-outfit.json')]);
await p.evaluate(d => __v2p.loadTorso(d), R('training-human-v2plus-torso-base.json')); await p.evaluate(d => __v2p.loadLimbs(d), R('training-human-v2plus-limbs-base.json'));
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8') });
await p.evaluate(d => __v2p.loadRegions(d), R('training-human-v2plus-regions.json'));
const out = {};
for (const [id, t] of [['h-squat', 1.2], ['scapular-B', 1.9], ['h-db-rdl', 2.3], ['chest-A', 1.15]]) {
  const s0 = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default; const J = {};
  for (const limbs of [null, 'base']) { const spec = Object.assign({}, s0, { modelProfile: 'training-human-v2plus', v2plus: Object.assign({ outfit: 'compression', torso: 'base', regions: 'baked' }, limbs ? { limbs } : {}) });
    await p.evaluate(([spec, th]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
      __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, 320); }, [spec, theme]);
    J[limbs || 'torso'] = await p.evaluate(([s, t]) => { for (let k = 0; k < 2; k++) __drill.frame(s, 0, -1, null, { size: 320, full: false }); __drill.frame(s, t, -1, null, { size: 320, full: false });
      const r = { joints: flareInspector.viewer.motion.getMetrics().joints, state: __v2p.outfitState };
      if (s.v2plus.limbs) { const L = []; for (let i = 0; i < 84; i++) { const a = __v2p.getRegionAnchor(i); if (a) L.push([a.mesh, a.stale]); } r.anchors = { n: L.length, stale: L.filter(x => x[1]).length, limbsMesh: L.filter(x => x[0] === 'V2P_Base_Limbs').length }; }
      return r; }, [spec, t]); }
  let mx = 0; for (const k in J.torso.joints) for (let c = 0; c < 3; c++) mx = Math.max(mx, Math.abs(J.torso.joints[k][c] - J.base.joints[k][c]));
  out[id + '@' + t] = { jointMaxDiffMm: +(mx * 1000).toFixed(4), anchors: J.base.anchors, state: J.base.state };
}
console.log(JSON.stringify(out, null, 1)); await b.close();
