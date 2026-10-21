// training-human-v2plus prototype: v2 vs v2plus stills (same spec, same solve, same camera), 12-group highlight sheet and
// hand close-ups. Run through run.sh (private Vite + one Chromium):
//   tools/human-v2plus/run.sh tools/human-v2plus/compare.mjs <outdir> [--only drills|sheet|hands]
// Writes raw PNGs to <outdir>/raw + metrics.json; tools/human-v2plus/sheet.py composes the JPG sheets.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus'); fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
const ONLY = (opt('--only', 'drills,sheet,hands')).split(','); const SZ = +opt('--size', '900');
// same three drills and key times as PR #9 (tools/human-v3/compare.mjs)
const DRILLS = [{ id: 'triceps-A', t: [0.0, 2.1] }, { id: 'scapular-B', t: [0.4, 1.9] }, { id: 'h-squat', t: [0.2, 1.2] }];
const theme = loadTheme(null); const meta = JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models/training-human-v2plus-hands.json'), 'utf8'));
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
// a fresh browser per drill: v2's P.bakeGrip edits the hand vertices permanently, so a gripping drill would leak its fist
// into the next drill's v2 render. One browser at a time (closed before the next boots).
let b, p;
async function start() {
  if (b) await b.close(); ({ b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] })); log('boot ok');
  await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
  log('v2plus load', JSON.stringify(await p.evaluate(m => __v2p.load(m), meta)));
await p.evaluate(() => { window.__aim = (box, dir, k) => { const v = flareInspector.viewer, T = window.__toonT; const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
  v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
  v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld();
  __drill.cam0 = { pos: v.camera.position.clone(), tgt: v.controls.target.clone() }; }; });
}
const save = (file, d) => fs.writeFileSync(path.join(OUT, 'raw', file), Buffer.from(d.split(',')[1], 'base64'));
const shot = async (file) => save(file, await p.evaluate(() => { const v = flareInspector.viewer; v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); }));
const loadSpec = async id => (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
const withProfile = (s, prof) => Object.assign({}, s, { modelProfile: prof });
async function setupDrill(spec) {
  await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
    __setHighlight(spec.highlight); __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
  for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
}
const metrics = {};
const DSEL = opt('--drills', null); if (ONLY.includes('drills')) for (const d of DRILLS.filter(d => !DSEL || DSEL.split(',').includes(d.id))) {
  await start(); const spec0 = await loadSpec(d.id); const s2 = withProfile(spec0, 'training-human-v2'), sp = withProfile(spec0, 'training-human-v2plus');
  await setupDrill(s2);
  for (const t of d.t) {
    const tag = `${d.id}-t${t.toFixed(2)}`;
    // framing per key time from the (shared) joints of this frame, as PR #9
    await p.evaluate(([s, t]) => { const v = flareInspector.viewer, T = window.__toonT; __drill.applyAt(s, t, null);
      const box = new T.Box3(); const J = Object.assign({}, v.motion.getMetrics().joints, __drill._jo || {}); for (const k in J) box.expandByPoint(new T.Vector3(...J[k]));
      box.expandByScalar(0.08); __aim(box, s.camera.dir, 1.0); }, [s2, t]);
    const r2 = await p.evaluate(([s, t, SZ]) => { const r = __drill.frame(s, t, -1, null, { size: SZ, full: false }); return { main: r.main, J: r.M.J }; }, [s2, t, SZ]);
    save(`${tag}-v2.png`, r2.main);
    const rp = await p.evaluate(([s, t, SZ]) => { const r = __drill.frame(s, t, -1, null, { size: SZ, full: false }); return { main: r.main, J: r.M.J, hands: { ...__v2p.cur } }; }, [sp, t, SZ]);
    save(`${tag}-v2plus.png`, rp.main);
    let maxJ = 0; for (const k in r2.J) { const a = r2.J[k], q = rp.J[k]; if (a && q) maxJ = Math.max(maxJ, Math.hypot(a[0] - q[0], a[1] - q[1], a[2] - q[2])); }
    metrics[tag] = { maxJointDiffMm: +(maxJ * 1000).toFixed(3), handPoses: rp.hands }; log(tag, JSON.stringify(metrics[tag]));
  }
  // hand close-ups for the floor and bar drills (v2 | v2plus)
  if (d.id !== 'h-squat') { const t = d.t[0];
    for (const side of ['left', 'right']) {
      for (const [s, nm] of [[s2, 'v2'], [sp, 'v2plus']]) {
        await p.evaluate(([s, t, side, SZ]) => { const v = flareInspector.viewer, T = window.__toonT; __drill.applyAt(s, t, null); v.coach.updateMatrixWorld(true);
          const h = v.coach.getObjectByName(side + 'Hand').getWorldPosition(new T.Vector3()); const mc = __v2p.bones['v2p_' + side[0].toUpperCase() + '_middle1'].getWorldPosition(new T.Vector3());
          const c = h.clone().lerp(mc, 0.8);
          const box = new T.Box3().setFromCenterAndSize(c, new T.Vector3(0.22, 0.22, 0.22)); const dir = s.id === 'scapular-B' ? [side === 'left' ? 0.5 : -0.5, -0.15, 1] : [side === 'left' ? 0.6 : -0.6, 0.8, 0.5];
          __aim(box, dir, 0.9); __drill.frame(s, t, -1, null, { size: SZ, full: false }); }, [s, t, side, SZ]);
        await shot(`hand-${d.id}-${side}-${nm}.png`);
      }
    }
  }
}
if (Object.keys(metrics).length) fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 1));
if (ONLY.includes('sheet') || ONLY.includes('hands')) await start();
if (ONLY.includes('sheet')) {
  // 12 groups on the standing body (h-squat t=0), front and back, v2plus regions
  const spec = withProfile(await loadSpec('h-squat'), 'training-human-v2plus'); await setupDrill(spec);
  await p.evaluate(([s]) => { __drill.applyAt(s, 0.0, null); const v = flareInspector.viewer, T = window.__toonT; v.coach.updateMatrixWorld(true);
    const box = new T.Box3(); const J = v.motion.getMetrics().joints; for (const k in J) box.expandByPoint(new T.Vector3(...J[k])); box.expandByScalar(0.12);
    window.__sheetCam = dir => __aim(box, dir, 0.86); __toonUni.uPulse.value = 1; }, [spec]);
  for (const [view, dir] of [['front', [0, 0.04, 1]], ['back', [0, 0.04, -1]]]) {
    for (const g of ['deltoids', 'chest', 'abs', 'lats', 'glute-max', 'quadriceps', 'hamstrings', 'obliques', 'scapular', 'triceps', 'rotator-cuff', 'hip-flexors']) {
      await p.evaluate(([g, dir]) => { __sheetCam(dir); __setHighlight({ groups: [g], side: 'both' }); __toonUni.uPulse.value = 1; }, [g, dir]); await shot(`hl-${g}-${view}.png`); }
  }
  // extra groups used by specs (overview, front/back)
  for (const [view, dir] of [['front', [0, 0.04, 1]], ['back', [0, 0.04, -1]]]) for (const g of ['hip-abductors', 'adductors', 'erectors', 'serratus', 'biceps', 'forearms', 'calves', 'traps']) {
    await p.evaluate(([g, dir]) => { __sheetCam(dir); __setHighlight({ groups: [g], side: 'both' }); __toonUni.uPulse.value = 1; }, [g, dir]); await shot(`hlx-${g}-${view}.png`); }
  // close-up of a border (crispness check): chest + abs + obliques front, lats + scapular back, at 2x zoom
  for (const [nm, groups, dir, c] of [['zoom-front', ['chest', 'abs', 'obliques'], [0.3, 0.05, 1], [0.06, 1.1, 0.1]], ['zoom-back', ['lats', 'scapular', 'glute-max'], [-0.3, 0.05, -1], [0.06, 1.05, -0.05]]]) {
    await p.evaluate(([groups, dir, c]) => { const T = window.__toonT; __setHighlight({ groups, side: 'both' }); __toonUni.uPulse.value = 1;
      __aim(new T.Box3().setFromCenterAndSize(new T.Vector3(...c), new T.Vector3(0.36, 0.36, 0.36)), dir, 0.9); }, [groups, dir, c]); await shot(`hl-${nm}.png`); }
}
if (ONLY.includes('hands')) {
  // named hand poses on the standing body, close-up of the left hand (palm side) and right hand (back side)
  const spec = withProfile(await loadSpec('h-squat'), 'training-human-v2plus'); await setupDrill(spec);
  for (const pose of ['rest', 'open', 'relaxed', 'palm-floor', 'grip-bar', 'band-grip']) for (const [side, dir] of [['front', [0.25, 0.1, 1]], ['outer', [1, 0.0, 0.15]], ['inner', [-0.6, -0.2, 0.5]]]) {
    await p.evaluate(([s, pose, dir]) => { const v = flareInspector.viewer, T = window.__toonT; __drill.applyAt(s, 0.0, null); __setHighlight({ groups: [] });
      if (pose === 'rest') __v2p.restHands(); else __v2p.setHandPose('left', pose); v.coach.updateMatrixWorld(true);
      const h = v.coach.getObjectByName('leftHand').getWorldPosition(new T.Vector3()); const c = h.clone().lerp(__v2p.bones.v2p_L_middle1.getWorldPosition(new T.Vector3()), 0.8);
      __aim(new T.Box3().setFromCenterAndSize(c, new T.Vector3(0.22, 0.22, 0.22)), dir, 0.9); __props.update?.(); }, [spec, pose, dir]);
    await shot(`pose-${pose}-${side}.png`); }
}
log('done'); await b.close();
