// training-human-v3 prototype: legacy vs v3 side-by-side stills, muscle-ID sheets and LBS/DQS close-ups.
// Usage (repo root, Vite dev server already on config.app_port; see run-compare.sh):
//   node tools/human-v3/compare.mjs <outdir> [--scale 0.97] [--only id,...]
// Writes raw transparent PNG passes (<outdir>/raw/*.png) + metrics.json; tools/human-v3/sheet.py composes the sheets.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const REPO = path.resolve(HERE, '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v3'); fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
const SCALE = +opt('--scale', '1'); const SZ = 900;
// three representative drills: floor support, bar grip, deep hip flexion. t = seconds into the loop.
const DRILLS = [
  { id: 'triceps-A', t: [0.0, 2.1], label: '窄距俯卧撑 floor support' },
  { id: 'scapular-B', t: [0.4, 1.9], label: '单杠肩胛引体 bar hang' },
  { id: 'h-squat', t: [0.2, 1.2], label: '徒手深蹲 deep squat' },
];
const only = opt('--only', null); const list = only ? DRILLS.filter(d => only.split(',').includes(d.id)) : DRILLS;
const theme = loadTheme(null); const meta = JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models/training-human-v3.json'), 'utf8'));
const t0 = Date.now(); const { b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] });
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
log('boot ok');
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v3.js'), 'utf8') });
log('v3 load', JSON.stringify(await p.evaluate(([m, s]) => __v3.load({ metaData: m, scale: s }), [meta, SCALE])));
await p.evaluate(() => { window.__v3aim = (box, dir, k) => { const v = flareInspector.viewer, T = window.__toonT; const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
  v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
  v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld(); }; });
const shot = async (file) => { const d = await p.evaluate(() => { const v = flareInspector.viewer; v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); });
  fs.writeFileSync(path.join(OUT, 'raw', file), Buffer.from(d.split(',')[1], 'base64')); };
const metrics = {};
for (const d of list) {
  const spec = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', d.id + '.js')).href)).default;
  await p.evaluate(([spec, th, SZ]) => { __v3.setVisible(false); (__props.list||[]).forEach(o=>o.parent?.remove(o)); if(__props.list) __props.list.length=0; __setHighlight(spec.highlight); __toonUni.uSinkK.value = spec.clothSink ?? 1;
    for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
  for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
  for (const t of d.t) {
    const tag = `${d.id}-t${t.toFixed(2)}`;
    // per-key-time framing (legacy joints + v3 bones of this frame), shared by both renders
    await p.evaluate(([s, t]) => { const v = flareInspector.viewer, T = window.__toonT; __drill.applyAt(s, t, null); __v3.follow(s);
      const box = new T.Box3(); const J = Object.assign({}, v.motion.getMetrics().joints, __drill._jo || {}); for (const k in J) box.expandByPoint(new T.Vector3(...J[k]));
      for (const b of Object.values(__v3.bones)) box.expandByPoint(b.getWorldPosition(new T.Vector3()));
      box.expandByScalar(0.08); __v3aim(box, s.camera.dir, 1.0);
      __drill.cam0 = { pos: v.camera.position.clone(), tgt: v.controls.target.clone() }; }, [spec, t]);
    // legacy
    const old = await p.evaluate(([s, t, SZ]) => { __v3.setVisible(false); const r = __drill.frame(s, t, -1, null, { size: SZ, full: false }); return { main: r.main, elbow: r.M.elbow, knee: r.M.knee }; }, [spec, t, SZ]);
    fs.writeFileSync(path.join(OUT, 'raw', `${tag}-old.png`), Buffer.from(old.main.split(',')[1], 'base64'));
    // v3 (same legacy solve, same camera, same props)
    const r = await p.evaluate(([s, t]) => { __drill.applyAt(s, t, null); const f = __v3.follow(s); __v3.setHighlight(s.highlight); __v3.uni.uPulse.value = __toonUni.uPulse.value; __v3.setVisible(true); __props.update?.(); const v = flareInspector.viewer; v.camera.position.copy(__drill.cam0.pos); v.camera.lookAt(__drill.cam0.tgt); v.camera.updateMatrixWorld(); return f; }, [spec, t]);
    await shot(`${tag}-v3.png`);
    metrics[tag] = { legacy: { elbow: old.elbow, knee: old.knee }, v3: r };
    log(tag, JSON.stringify(r));
  }
  await p.evaluate(() => { __v3.setVisible(false); (__props.list||[]).forEach(o=>o.parent?.remove(o)); if(__props.list) __props.list.length=0; });
}
if (list.length) fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 1));
if (!only || only.includes('sheet')) {
  // muscle-ID sheet: standing (h-squat t=0), front / back, all IDs coloured + four single-group highlights
  const spec = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs/h-squat.js')).href)).default;
  await p.evaluate(([s]) => { __drill.applyAt(s, 0.0, null); __v3.follow(s); __v3.setVisible(true);
    const v = flareInspector.viewer, T = window.__toonT; const box = new T.Box3().setFromObject(__v3.mesh); box.expandByScalar(0.02);
    window.__v3cam = dir => __v3aim(box, dir, 0.92); }, [spec]);
  for (const [view, dir] of [['front', [0, 0.05, 1]], ['back', [0, 0.05, -1]], ['side', [1, 0.05, 0.25]]]) {
    await p.evaluate(dir => { __v3cam(dir); __v3.uni.uIdView.value = 1; __v3.setHighlight({ groups: [] }); }, dir); await shot(`ids-${view}.png`);
    await p.evaluate(() => { __v3.uni.uIdView.value = 0; });
    for (const g of ['deltoids', 'chest', 'abs', 'lats', 'glute-max', 'quadriceps', 'hamstrings', 'obliques', 'scapular', 'triceps', 'rotator-cuff', 'hip-flexors']) {
      await p.evaluate(g => { __v3.setHighlight({ groups: [g], side: 'both' }); __v3.uni.uPulse.value = 1; }, g); await shot(`hl-${g}-${view}.png`); }
  }
  // LBS vs DQS close-ups: squat bottom (knee / hip) and push-up bottom (elbow)
  for (const [id, t, joint, dir] of [['h-squat', 1.2, 'lowerleg01_L', [1, 0.15, 0.4]], ['triceps-A', 2.1, 'lowerarm01_L', [1, 0.3, 0.6]], ['scapular-B', 1.9, 'upperarm01_R', [-0.6, 0.1, 1]]]) {
    const spec = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
    for (const dqs of [0, 1, 2]) {
      await p.evaluate(([s, t, joint, dir, dqs]) => { __v3.setHighlight({ groups: [] }); __drill.applyAt(s, t, null); __v3.follow(s); __v3.setVisible(true); __v3.setDQS(dqs);
        const v = flareInspector.viewer, T = window.__toonT; const c = __v3.bones[joint].getWorldPosition(new T.Vector3());
        const box = new T.Box3().setFromCenterAndSize(c, new T.Vector3(0.34, 0.34, 0.34)); __v3aim(box, dir, 0.95); }, [spec, t, joint, dir, dqs]);
      await shot(`skin-${id}-${['lbs', 'hybrid', 'dqs'][dqs]}.png`);
    }
    await p.evaluate(() => __v3.setDQS(0));
  }
}
log('done'); await b.close();
