// PR #12 review checks (2026-10-21), one Chromium, no full renders:
//  1. skins with baked regions: omitted / 'default' / 'realistic' / outline skin, then back to training-human-v2 (state restored)
//  2. forearms-C (kbBottomsUp, relax 0): auto hand pose of the gripping hand + finger bone rotations, and two hand key frames
//   tools/human-v2plus/run.sh tools/human-v2plus/review-check.mjs <outdir>
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.resolve(process.argv[2] || 'output/human-v2plus-review'); fs.mkdirSync(OUT, { recursive: true });
const imp = async f => (await import(pathToFileURL(path.join(REPO, f)).href));
const { boot } = await imp('drill-anim/lib/boot.mjs'); const { loadTheme } = await imp('drill-anim/lib/config.mjs');
const { applyHumanV2plus } = await imp('drill-anim/lib/human-v2plus.mjs');
const spec = id => imp('drill-anim/specs/' + id + '.js').then(m => m.default);
const theme = loadTheme(null), SZ = 540; const res = {};
const { b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] });
const squat = await spec('h-squat'), fc = await spec('forearms-C');
// load v2plus + regions through the real loader (a regions:'baked' spec loads page/human-v2plus-regions.js)
res.load = await applyHumanV2plus(p, { ...squat, modelProfile: 'training-human-v2plus', v2plus: { regions: 'baked' } });
// 1. skins
const cases = [['omitted', { regions: 'baked' }], ['default', { regions: 'baked', skin: 'default' }], ['realistic', { regions: 'baked', skin: 'realistic' }],
  ['tech-white', { regions: 'baked', skin: 'tech-white' }], ['default-after-outline', { regions: 'baked', skin: 'default' }], ['default-no-regions', { skin: 'default' }]];
res.skins = [];
for (const [tag, v2plus] of [...cases, ['exit-to-v2', null]]) {
  res.skins.push(await p.evaluate(([s, tag]) => { try { __drill.selectModelProfile(s); const st = __v2p.skinState?.() || null;
      return { tag, ok: true, v2plusOn: !!__v2p.on, skin: st?.skin, regions: st?.regions }; }
    catch (e) { return { tag, ok: false, error: String(e) }; } },
    [v2plus ? { ...squat, modelProfile: 'training-human-v2plus', v2plus } : { ...squat, modelProfile: 'training-human-v2' }, tag]));
}
// 2. forearms-C: auto mapping (no v2plus.handPose), props as render.mjs adds them
const s2 = { ...fc, size: SZ, modelProfile: 'training-human-v2plus',
  camera: { ...fc.camera, fit: ['rightPalm', 'head'], pad: 0.12, drift: 0 } };   // close on the gripping hand
await p.evaluate(([s, th, SZ]) => { __drill.selectModelProfile(s); __setHighlight(s.highlight); for (const pr of s.props || []) __props.add(th, pr); __drill.setupCamera(s, SZ); }, [s2, theme, SZ]);
for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, 0, null, { size: SZ, full: false }); return 1; }, [s2, SZ]);
res.forearmsC = [];
const D = fc.timeline.duration, fps = fc.fps || 30;
for (const t of [0, +(D / 2).toFixed(2)]) {
  const r = await p.evaluate(([s, t, SZ]) => { const fr = __drill.frame(s, t, Math.round(t * 30), null, { size: SZ, full: true });
    const F = ['thumb', 'index', 'middle', 'ring', 'pinky']; const q = {}; let nonId = 0, n = 0;
    for (const f of F) for (let j = 1; j <= 3; j++) { const bn = __v2p.bones['v2p_R_' + f + j];
      if (!bn) continue; n++; const a = bn.quaternion.toArray().map(x => +x.toFixed(3)); if (Math.abs(a[3]) < 0.9995) nonId++; if (j === 1) q[f + j] = a; }
    return { t, pick: __v2p.pickHandPose(s, 'right'), cur: { ...__v2p.cur }, relaxReq: __v2p.relaxReq, fingerBones: n, nonIdentity: nonId, base: q, img: fr.main }; }, [s2, t, SZ]);
  fs.writeFileSync(path.join(OUT, `forearms-C-t${t}.png`), Buffer.from(r.img.split(',')[1], 'base64')); delete r.img; res.forearmsC.push(r);
}
fs.writeFileSync(path.join(OUT, 'review-check.json'), JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1)); await b.close();
