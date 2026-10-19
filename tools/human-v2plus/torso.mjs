// training-human-v2plus sculpted torso: compression outfit (current PR) vs sculpted torso stills (same spec, same solve, same
// camera as tools/human-v2plus/compare.mjs / outfit.mjs), standing front/side/back plain + with highlights, and close-ups (neck
// seam, armpit/shoulder, hip crease in the deep squat). Run through run.sh (private Vite + one Chromium):
//   tools/human-v2plus/run.sh tools/human-v2plus/torso.mjs <outdir> [--only drills,stand,close] [--drills id,id]
// Writes raw PNGs to <outdir>/raw; tools/human-v2plus/torso_sheet.py composes the JPG sheets.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus-torso'); fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
const ONLY = opt('--only', 'drills,stand,close').split(','); const SZ = +opt('--size', '900');
const DRILLS = [{ id: 'triceps-A', t: [0.0, 2.1] }, { id: 'scapular-B', t: [0.4, 1.9] }, { id: 'h-squat', t: [0.2, 1.2] }];
const theme = loadTheme(null); const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const meta = R('training-human-v2plus-hands.json'), outfit = R('training-human-v2plus-outfit.json'), torso = R('training-human-v2plus-torso.json');
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
let b, p;
async function start() {
  if (b) await b.close(); ({ b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] })); log('boot ok');
  await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
  log('v2plus load', JSON.stringify(await p.evaluate(([m, o]) => __v2p.load(m, o), [meta, outfit])));
  log('torso load', JSON.stringify(await p.evaluate(d => __v2p.loadTorso(d), torso)));
  await p.evaluate(() => { window.__aim = (box, dir, k) => { const v = flareInspector.viewer, T = window.__toonT; const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
    v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
    v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld();
    __drill.cam0 = { pos: v.camera.position.clone(), tgt: v.controls.target.clone() }; }; });
}
const save = (file, d) => fs.writeFileSync(path.join(OUT, 'raw', file), Buffer.from(d.split(',')[1], 'base64'));
const shot = async file => save(file, await p.evaluate(() => { const v = flareInspector.viewer; v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); }));
const loadSpec = async id => (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
const prof = (s, torso) => Object.assign({}, s, { modelProfile: 'training-human-v2plus', v2plus: Object.assign({}, s.v2plus || {}, { outfit: 'compression' }, torso ? { torso: 'sculpted' } : {}) });
async function setupDrill(spec) {
  await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
    __setHighlight(spec.highlight); __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
  for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
}
const DSEL = opt('--drills', null);
if (ONLY.includes('drills')) for (const d of DRILLS.filter(d => !DSEL || DSEL.split(',').includes(d.id))) {
  await start(); const spec0 = await loadSpec(d.id); const sa = prof(spec0, false), sb = prof(spec0, true);
  await setupDrill(sa);
  for (const t of d.t) {
    const tag = `${d.id}-t${t.toFixed(2)}`;
    await p.evaluate(([s, t]) => { const v = flareInspector.viewer, T = window.__toonT; __drill.applyAt(s, t, null);
      const box = new T.Box3(); const J = Object.assign({}, v.motion.getMetrics().joints, __drill._jo || {}); for (const k in J) box.expandByPoint(new T.Vector3(...J[k]));
      box.expandByScalar(0.08); __aim(box, s.camera.dir, 1.0); }, [sa, t]);
    const ra = await p.evaluate(([s, t, SZ]) => { const r = __drill.frame(s, t, -1, null, { size: SZ, full: false }); return { main: r.main, J: r.M.J, o: __v2p.outfitState }; }, [sa, t, SZ]);
    save(`${tag}-compression.png`, ra.main);
    const rb = await p.evaluate(([s, t, SZ]) => { const r = __drill.frame(s, t, -1, null, { size: SZ, full: false }); return { main: r.main, J: r.M.J, o: __v2p.outfitState }; }, [sb, t, SZ]);
    save(`${tag}-torso.png`, rb.main);
    let maxJ = 0; for (const k in ra.J) { const a = ra.J[k], q = rb.J[k]; if (a && q) maxJ = Math.max(maxJ, Math.hypot(a[0] - q[0], a[1] - q[1], a[2] - q[2])); }
    log(tag, 'maxJointDiffMm', (maxJ * 1000).toFixed(3), JSON.stringify(ra.o), JSON.stringify(rb.o));
  }
}
// hip crease / armpit in the deepest squat frame (h-squat t=1.2), both versions, close camera on the hip
if (ONLY.includes('squatclose')) {
  await start(); const spec0 = await loadSpec('h-squat');
  for (const o of [false, true]) { const s = prof(spec0, o); await setupDrill(s);
    for (const [cn, jn, dir, sz, g] of [['hip', 'leftHip', [0.9, 0.15, 0.6], 0.36, ['glute-max', 'quadriceps', 'hip-flexors']], ['hip-back', 'leftHip', [0.6, 0.2, -1], 0.40, ['glute-max', 'hamstrings']], ['shoulder', 'leftShoulder', [0.8, 0.3, 0.7], 0.32, ['deltoids', 'chest']]]) {
      await p.evaluate(([s, jn, dir, sz, SZ]) => { __drill.applyAt(s, 1.2, null); const v = flareInspector.viewer, T = window.__toonT; const J = v.motion.getMetrics().joints;
        __aim(new T.Box3().setFromCenterAndSize(new T.Vector3(...J[jn]), new T.Vector3(sz, sz, sz)), dir, 0.9); }, [s, jn, dir, sz, SZ]);
      const r = await p.evaluate(([s, g, SZ]) => { __setHighlight({ groups: g, side: 'both' }); const rr = __drill.frame(s, 1.2, -1, null, { size: SZ, full: false }); return rr.main; }, [s, g, SZ]);
      save(`squatclose-${cn}-${o ? 'torso' : 'compression'}.png`, r); } } }
const STAND_HL = { front: ['chest', 'abs', 'deltoids', 'quadriceps'], side: ['deltoids', 'obliques', 'glute-max', 'quadriceps'], back: ['lats', 'scapular', 'glute-max', 'hamstrings', 'triceps'] };
const VIEWS = { front: [0, 0.04, 1], side: [1, 0.04, 0.08], back: [0, 0.04, -1] };
if (ONLY.includes('stand') || ONLY.includes('close')) {
  await start(); const spec0 = await loadSpec('h-squat');
  for (const o of [false, true]) {
    const spec = prof(spec0, o); const nm = o ? 'torso' : 'compression'; await setupDrill(spec);
    await p.evaluate(([s]) => { __drill.applyAt(s, 0.0, null); const v = flareInspector.viewer, T = window.__toonT; v.coach.updateMatrixWorld(true);
      const box = new T.Box3(); const J = v.motion.getMetrics().joints; for (const k in J) box.expandByPoint(new T.Vector3(...J[k])); box.expandByScalar(0.12);
      window.__standBox = box; __toonUni.uPulse.value = 1; }, [spec]);
    if (ONLY.includes('stand')) for (const [view, dir] of Object.entries(VIEWS)) for (const hl of [false, true]) {
      await p.evaluate(([dir, g]) => { __aim(__standBox, dir, 0.86); __setHighlight(g ? { groups: g, side: 'both' } : { groups: [] }); __toonUni.uPulse.value = 1; }, [dir, hl ? STAND_HL[view] : null]);
      await shot(`stand-${view}-${hl ? 'hl' : 'plain'}-${nm}.png`); }
    if (ONLY.includes('close')) {
      const C = [['neck', [0.0, 1.36, 0.04], [0.35, 0.2, 1], 0.26, ['chest', 'deltoids', 'neck']], ['neck-back', [0.0, 1.37, -0.04], [-0.35, 0.25, -1], 0.26, ['traps-upper', 'scapular', 'deltoids']],
        ['shoulder', [0.17, 1.27, 0.0], [1, 0.1, 0.55], 0.26, ['deltoids', 'chest', 'triceps']], ['armpit', [0.16, 1.24, -0.01], [0.55, -0.2, -1], 0.26, ['lats', 'deltoids', 'triceps']],
        ['waist', [0.0, 0.95, 0.03], [0.6, 0.1, 1], 0.40, ['abs', 'obliques', 'hip-flexors']], ['hip-back', [0.0, 0.84, -0.02], [-0.5, 0.0, -1], 0.36, ['glute-max', 'hamstrings', 'erectors']]];
      for (const [cn, c, dir, sz, g] of C) {
        await p.evaluate(([c, dir, sz, g]) => { const T = window.__toonT; __setHighlight({ groups: g, side: 'both' }); __toonUni.uPulse.value = 1;
          __aim(new T.Box3().setFromCenterAndSize(new T.Vector3(...c), new T.Vector3(sz, sz, sz)), dir, 0.9); }, [c, dir, sz, g]);
        await shot(`close-${cn}-${nm}.png`); }
    }
  }
}
log('done'); await b.close();
