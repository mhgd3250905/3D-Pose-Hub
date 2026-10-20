// base-mesh head + neck (v2plus.head:'base', M10) key-frame check: head / neck close-ups with torso + limbs + hands:'base' + head:'base',
// skins (realistic default, tech-white, neon-night) and the joint max diff vs the same spec without head (must be 0). Key frames only.
//   tools/human-v2plus/run.sh tools/human-v2plus/head-poses.mjs <outdir> [--size 360] [--only id,...]
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus-head'); fs.mkdirSync(OUT, { recursive: true });
const SZ = +opt('--size', '360'), SET = opt('--set', 'poses'), ONLY = opt('--only', null)?.split(','), SLEEVE = opt('--sleeve', null);
const theme = loadTheme(null); const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
const { b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] }); log('boot ok');
p.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text().slice(0, 400)); });
p.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 400)));
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
log('v2plus', JSON.stringify(await p.evaluate(([m, o]) => __v2p.load(m, o), [R('training-human-v2plus-hands.json'), R('training-human-v2plus-outfit.json')])));
log('torso', JSON.stringify(await p.evaluate(d => __v2p.loadTorso(d), R('training-human-v2plus-torso-base.json'))));
log('limbs', JSON.stringify(await p.evaluate(d => __v2p.loadLimbs(d), R('training-human-v2plus-limbs-base.json'))));
log('hands', JSON.stringify(await p.evaluate(d => __v2p.loadHands(d), process.env.HANDS_JSON ? JSON.parse(fs.readFileSync(process.env.HANDS_JSON, 'utf8')) : R('training-human-v2plus-hands-base.json'))));
log('head', JSON.stringify(await p.evaluate(d => __v2p.loadHead(d), process.env.HEAD_JSON ? JSON.parse(fs.readFileSync(process.env.HEAD_JSON, 'utf8')) : R('training-human-v2plus-head-base.json'))));
const REG = true;
if (REG) { await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8') });
  log('regions', JSON.stringify(await p.evaluate(d => __v2p.loadRegions(d), R('training-human-v2plus-regions.json')))); }
await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT;
  window.__aim = (box, dir, k) => { const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
    v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
    v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld(); }; });
const SETS = { m10: [
  // [spec id, t, skin, views [name, dir, joint, box]]
  ['h-squat', 0.0, null, [['head-34', [0.75, 0.08, 0.66], 'head', 0.36], ['head-side', [1, 0.02, 0.02], 'head', 0.36], ['seam-side', [1, 0.12, -0.35], 'neck', 0.24], ['seam-front', [0.15, 0.1, 1], 'neck', 0.2]]],
  ['chest-A', 1.15, null, [['neck-flex', [1, 0.12, -0.05], 'neck', 0.5]]],
  ['scapular-B', 1.9, null, [['neck-hang', [0.6, 0.1, 0.8], 'neck', 0.45]]],
  ['h-squat', 0.0, 'tech-white', [['tw-34', [0.75, 0.08, 0.66], 'head', 0.5]]],
  ['h-squat', 0.0, 'neon-night', [['nn-34', [0.75, 0.08, 0.66], 'head', 0.5]]],
],
  // M10b mannequin face: front / 3/4 / side close-ups (default skin) + tech-white + neon-night (--set m10b; VIEWS=a,b filters views)
  m10b: [
  ['h-squat', 0.0, null, [['head-front', [0.0, 0.06, 1], 'head', 0.3], ['head-34', [0.75, 0.08, 0.66], 'head', 0.3], ['head-side', [1, 0.02, 0.02], 'head', 0.3]]],
  ['h-squat', 0.0, 'tech-white', [['tw-34', [0.75, 0.08, 0.66], 'head', 0.36]]],
  ['h-squat', 0.0, 'neon-night', [['nn-34', [0.75, 0.08, 0.66], 'head', 0.36]]],
],
  // M10c faceless egg head: front / 3/4 / side / back 3/4 from above (default skin) + tech-white + neon-night (--set m10c)
  m10c: [
  ['h-squat', 0.0, null, [['head-front', [0.0, 0.06, 1], 'head', 0.3], ['head-34', [0.75, 0.08, 0.66], 'head', 0.3], ['head-side', [1, 0.02, 0.02], 'head', 0.3], ['head-back34', [-0.6, 0.55, -0.6], 'head', 0.3]]],
  ['h-squat', 0.0, 'tech-white', [['tw-34', [0.75, 0.08, 0.66], 'head', 0.36]]],
  ['h-squat', 0.0, 'neon-night', [['nn-34', [0.75, 0.08, 0.66], 'head', 0.36]]],
],
  // M10d fabric-wrap face: front / side / back matching the reference three-view, 3/4 (default skin) + tech-white + neon-night (--set m10d)
  m10d: [
  ['h-squat', 0.0, null, [['head-front', [0.0, 0.02, 1], 'head', 0.25], ['head-side', [1, 0.02, 0.0], 'head', 0.25], ['head-back', [0.0, 0.02, -1], 'head', 0.25], ['head-34', [0.75, 0.08, 0.66], 'head', 0.25]]],
  ['h-squat', 0.0, 'tech-white', [['tw-34', [0.75, 0.08, 0.66], 'head', 0.36]]],
  ['h-squat', 0.0, 'neon-night', [['nn-34', [0.75, 0.08, 0.66], 'head', 0.36]]],
] };
const JD = {}; const VIEWS = process.env.VIEWS?.split(',');
for (const [id, t, skin, views] of SETS[SETS[SET] ? SET : 'm10']) { if (ONLY && !ONLY.includes(id)) continue;
  const s0 = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
  for (const vname of (skin ? ['head'] : ['old', 'head'])) {
    const v2plus = Object.assign({ outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base' }, vname === 'head' ? { head: 'base' } : {}, skin ? { skin } : {});
    const spec = Object.assign({}, s0, { modelProfile: 'training-human-v2plus', v2plus, highlight: { groups: [] } });
    await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
      __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
    for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
    JD[id + t + vname] = await p.evaluate(([s, t, SZ]) => { __drill.frame(s, t, -1, null, { size: SZ, full: false }); return flareInspector.viewer.motion.getMetrics().joints; }, [spec, t, SZ]);
    if (vname === 'old') continue;
    for (const [vn, dir, jn, sz] of views) { if (VIEWS && !VIEWS.includes(vn)) continue;
      const img = await p.evaluate(([s, t, dir, jn, sz, SZ]) => { __setHighlight({ groups: [], side: 'both' }); __toonUni.uPulse.value = 1; __drill.frame(s, t, -1, null, { size: SZ, full: false });
        const v = flareInspector.viewer, T = window.__toonT; const J = Object.assign({}, v.motion.getMetrics().joints, __drill._jo || {});
        const box = new T.Box3().setFromCenterAndSize(new T.Vector3(...J[jn]), new T.Vector3(sz, sz, sz));
        __aim(box, dir, 0.9); v.renderer.setSize(SZ, SZ, false); v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/jpeg', 0.9); }, [spec, t, dir, jn, sz, SZ]);
      fs.writeFileSync(path.join(OUT, `${id}-t${t.toFixed(2)}-${vn}.jpg`), Buffer.from(img.split(',')[1], 'base64'));
      log(id, t, vn, JSON.stringify(await p.evaluate(() => __v2p.outfitState))); }
  }
  const A0 = JD[id + t + 'old'], A1 = JD[id + t + 'head'];
  if (A0 && A1) { let mx = 0; for (const k in A0) for (let c = 0; c < 3; c++) mx = Math.max(mx, Math.abs(A0[k][c] - A1[k][c])); log(id, t, 'joint max diff mm (no head vs head)', (mx * 1000).toFixed(4)); } }
log('regions', JSON.stringify(await p.evaluate(() => ({ present: __v2p.regions?.bakeInfo?.present, meshes: __v2p.regions?.meshInfo }))));
// joint check: the solve must not depend on hands (same joints with / without)
log('done'); await b.close();
