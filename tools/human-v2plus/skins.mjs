// skins (M9) comparison: the 5 skins on one frame (h-squat t=0 standing 3/4 front) + h-db-rdl t=1.2 with glute / hamstring highlight
// (rear 3/4); torso / limbs / hands:'base'. Writes transparent PNGs + skins.json (each skin's bg); skins_sheet.py composes compare.jpg.
//   tools/human-v2plus/run.sh tools/human-v2plus/skins.mjs <outdir> [--size 400] [--only tech-white,...] [--rows stand,rdl]
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus-skins'); fs.mkdirSync(OUT, { recursive: true });
const SZ = +opt('--size', '400'), ONLY = opt('--only', null)?.split(','), ROWS = opt('--rows', 'stand,rdl').split(',');
const theme = loadTheme(null); const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
const { b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] }); log('boot ok');
p.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text().slice(0, 600)); });
p.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 600)));
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
await p.evaluate(([m, o]) => __v2p.load(m, o), [R('training-human-v2plus-hands.json'), R('training-human-v2plus-outfit.json')]);
await p.evaluate(d => __v2p.loadTorso(d), R('training-human-v2plus-torso-base.json'));
await p.evaluate(d => __v2p.loadLimbs(d), R('training-human-v2plus-limbs-base.json'));
await p.evaluate(d => __v2p.loadHands(d), R('training-human-v2plus-hands-base.json'));
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8') });
log('regions', JSON.stringify(await p.evaluate(d => __v2p.loadRegions(d), R('training-human-v2plus-regions.json'))));
await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT;
  window.__aim = (box, dir, k) => { const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
    v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
    v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld(); }; });
const SK = ['tech-white', 'neon-night', 'hologram', 'plaster', 'realistic'].filter(s => !ONLY || ONLY.includes(s));
const ROW = { stand: ['h-squat', 0.0, [0.55, 0.08, 1], { groups: [] }], rdl: ['h-db-rdl', 1.2, [-0.75, 0.15, -1], { groups: ['glutes', 'hamstrings'], side: 'both' }] };
const meta = { skins: {}, rows: ROWS };
for (const rk of ROWS) { const [id, t, dir, hl] = ROW[rk]; const s0 = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
  for (const sk of SK) {
    const spec = Object.assign({}, s0, { modelProfile: 'training-human-v2plus', v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: sk }, highlight: hl });
    await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
      __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
    for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
    const img = await p.evaluate(([s, t, dir, hl, SZ]) => { __drill.frame(s, t, -1, null, { size: SZ, full: false }); __setHighlight(hl); __toonUni.uPulse.value = 1;
      const v = flareInspector.viewer, T = window.__toonT; const J = v.motion.getMetrics().joints; const box = new T.Box3(); for (const k in J) box.expandByPoint(new T.Vector3(...J[k])); box.expandByScalar(0.1);
      __aim(box, dir, 0.95); v.renderer.setSize(SZ, SZ, false); v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); }, [spec, t, dir, hl, SZ]);
    fs.writeFileSync(path.join(OUT, `${rk}-${sk}.png`), Buffer.from(img.split(',')[1], 'base64'));
    const st = await p.evaluate(() => __v2p.skinState()); meta.skins[sk] = st; log(rk, sk, JSON.stringify(st)); } }
// default (no skin) must leave the shader uniforms as before: compare the regions uniforms + highlight colour after a no-skin frame
meta.defaultCheck = await p.evaluate(() => { __v2p.setSkin(null); const U = __v2p.regions.uni; return { skin: __v2p.skinState().skin, grey: U.uV2pRGrey.value.toArray(), la: U.uV2pRLa.value, holo: U.uV2pRHolo.value, hi: __toonUni.uHiC.value.toArray() }; });
log('default', JSON.stringify(meta.defaultCheck));
fs.writeFileSync(path.join(OUT, 'skins.json'), JSON.stringify(meta, null, 1)); log('done'); await b.close();
