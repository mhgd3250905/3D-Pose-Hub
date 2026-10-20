// base-mesh hands (v2plus.hands:'base') key-frame check: each frame rendered with limbs:'base' (current) and with
// limbs:'base' + hands:'base', same solve / camera, whole body + both hands close up; prints the joint max diff (must be 0). Key frames only (no clips). Run through run.sh (private Vite + one Chromium):
//   tools/human-v2plus/run.sh tools/human-v2plus/hands-poses.mjs <outdir> [--size 480] [--set poses|regions] [--only id,...] [--sleeve long]
// --set regions: regions:'baked' plain (no highlight) + region outlines, standing front / back, limbs on only (+ anchors check)
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus-hands'); fs.mkdirSync(OUT, { recursive: true });
const SZ = +opt('--size', '480'), SET = opt('--set', 'poses'), ONLY = opt('--only', null)?.split(','), SLEEVE = opt('--sleeve', null);
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
const REG = SET === 'regions';
if (REG) { await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8') });
  log('regions', JSON.stringify(await p.evaluate(d => __v2p.loadRegions(d), R('training-human-v2plus-regions.json')))); }
await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT;
  window.__aim = (box, dir, k) => { const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
    v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
    v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld(); }; });
const HV = [['lhand', [0.9, 0.3, 0.6], 'leftWrist', 0.32], ['rhand', [-0.9, 0.3, 0.6], 'rightWrist', 0.32]];
const SETS = {
  poses: [
    ['h-db-rdl', 1.2, [['side', [1, 0.15, -0.5], null], ...HV, ['lhand-in', [0.2, -0.4, 1], 'leftWrist', 0.3]]],
    ['scapular-B', 1.9, [['back', [0.25, 0.0, -1], null], ...HV, ['hands-up', [0.3, 0.8, 0.6], 'leftWrist', 0.35]]],
    ['chest-A', 1.15, [['side', [0.3, 0.5, 1], null], ['rhand', [0.6, 0.5, 1], 'rightWrist', 0.3], ['rhand-top', [0.1, 1, 0.2], 'rightWrist', 0.28]]],
    ['h-squat', 1.2, [['side', [1, 0.15, 0.5], null], ...HV]],
  ],
  // M8 fix check (hands only): thenar at rest, wrist weld close-ups, chest-A left hand from outside the body
  fix: [
    ['h-squat', 0.0, [['lhand-thenar', [0.5, -0.1, 1], 'leftWrist', 0.22], ['lhand-weld', [1, 0.1, -0.3], 'leftWrist', 0.13], ['rhand-weld', [-0.3, 0.2, 1], 'rightWrist', 0.13]]],
    ['chest-A', 1.15, [['lhand-out', [1, 0.35, 0.5], 'leftWrist', 0.28], ['lhand-front', [0.4, 0.5, 1], 'leftWrist', 0.28]]],
  ],
  regions: [['h-squat', 0.0, [['front', [0, 0.05, 1], null], ['back', [0, 0.05, -1], null], ['lhand', [0.8, 0.1, 0.6], 'leftWrist', 0.3]]]],
};
const VARS = REG || SET === 'fix' ? [['hands', 'base']] : [['limbs', null], ['hands', 'base']]; const JD = {};
for (const [id, t, views] of SETS[SET]) { if (ONLY && !ONLY.includes(id)) continue;
  const s0 = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
  for (const [vname, limbs] of VARS) {
    const v2plus = Object.assign({ outfit: 'compression', torso: 'base', limbs: 'base' }, limbs ? { hands: limbs } : {}, REG ? { regions: 'baked' } : {}, SLEEVE ? { sleeve: SLEEVE } : {});
    const spec = Object.assign({}, s0, { modelProfile: 'training-human-v2plus', v2plus }, REG ? {} : { highlight: { groups: [] } });
    await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
      __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
    for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
    for (const [vn, dir, jn, sz] of views) {
      const img = await p.evaluate(([s, t, dir, jn, sz, SZ, reg]) => { __setHighlight({ groups: [], side: 'both' }); __toonUni.uPulse.value = 1; __drill.frame(s, t, -1, null, { size: SZ, full: false });
        const v = flareInspector.viewer, T = window.__toonT; const J = Object.assign({}, v.motion.getMetrics().joints, __drill._jo || {});
        let box; if (jn) box = new T.Box3().setFromCenterAndSize(new T.Vector3(...J[jn]), new T.Vector3(sz, sz, sz)); else { box = new T.Box3(); for (const k in J) box.expandByPoint(new T.Vector3(...J[k])); box.expandByScalar(0.1); }
        __aim(box, dir, jn ? 0.9 : 0.95); v.renderer.setSize(SZ, SZ, false); v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/jpeg', 0.9); }, [spec, t, dir, jn, sz, SZ, REG]);
      fs.writeFileSync(path.join(OUT, `${id}-t${t.toFixed(2)}-${vn}-${vname}.jpg`), Buffer.from(img.split(',')[1], 'base64'));
      log(id, t, vn, vname, JSON.stringify(await p.evaluate(() => __v2p.outfitState))); }
    JD[vname] = await p.evaluate(([s, t, SZ]) => { __drill.frame(s, t, -1, null, { size: SZ, full: false }); return flareInspector.viewer.motion.getMetrics().joints; }, [spec, t, SZ]);
    if (REG) log('regions state', JSON.stringify(await p.evaluate(() => ({ info: __v2p.regions?.bakeInfo?.present, meshes: __v2p.regions?.meshInfo }))));
  }
  if (JD.limbs && JD.hands) { let mx = 0; for (const k in JD.limbs) for (let c = 0; c < 3; c++) mx = Math.max(mx, Math.abs(JD.limbs[k][c] - JD.hands[k][c])); log(id, t, 'joint max diff mm (limbs vs hands)', (mx * 1000).toFixed(4)); } }
// joint check: the solve must not depend on hands (same joints with / without)
log('done'); await b.close();
