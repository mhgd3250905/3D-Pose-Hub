// training-human-v2plus baked muscle regions (DRAFT, v2plus.regions:'baked'): standing front / back, plain atlas look + one
// highlighted example. Key frames only. Run through run.sh (private Vite + one Chromium):
//   tools/human-v2plus/run.sh tools/human-v2plus/regions.mjs <outdir> [--size 640] [--hl obliques] [--limbs] [--dump]
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus-regions'); fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
const SZ = +opt('--size', '640'), HL = opt('--hl', 'obliques').split(',');
const theme = loadTheme(null); const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
const { b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] }); log('boot ok');
p.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text().slice(0, 400)); });
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
log('v2plus', JSON.stringify(await p.evaluate(([m, o]) => __v2p.load(m, o), [R('training-human-v2plus-hands.json'), R('training-human-v2plus-outfit.json')])));
log('torso', JSON.stringify(await p.evaluate(d => __v2p.loadTorso(d), R('training-human-v2plus-torso-base.json'))));
const LIMBS = A.includes('--limbs');   // --limbs: v2plus.limbs:'base' (base-mesh arms + legs) on top of torso:'base'
if (LIMBS) log('limbs', JSON.stringify(await p.evaluate(d => __v2p.loadLimbs(d), R('training-human-v2plus-limbs-base.json'))));
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8') });
log('regions', JSON.stringify(await p.evaluate(d => __v2p.loadRegions(d), R('training-human-v2plus-regions.json'))));
const spec0 = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs/h-squat.js')).href)).default;
const spec = Object.assign({}, spec0, { modelProfile: 'training-human-v2plus', v2plus: Object.assign({ outfit: 'compression', torso: 'base', regions: 'baked' }, LIMBS ? { limbs: 'base' } : {}) });
await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
  __setHighlight({ groups: [] }); __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
log('bake', JSON.stringify(await p.evaluate(() => { const r = __v2p.regions; return { meshes: r.meshInfo, on: r.on, key: r.key, info: r.bakeInfo && { channels: r.bakeInfo.channels, maxDeg: r.bakeInfo.maxDeg, present: r.bakeInfo.present, verts: r.bakeInfo.verts } }; })));
if (A.includes('--dump')) fs.writeFileSync(path.join(OUT, 'dump.json'), JSON.stringify(await p.evaluate(() => { const out = []; for (const [o, e] of __v2p.regions.bakeInfo.tex) out.push({ name: o.name, n: e.lab.length, lab: Array.from(e.lab), rd: Array.from(e.rd).map(v => +v.toFixed(5)), idx: o.geometry.index ? Array.from(o.geometry.index.array) : null, dr: [o.geometry.drawRange.start, o.geometry.drawRange.count] }); return out; })));
await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT;
  window.__aim = (box, dir, k) => { const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
    v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
    v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld(); }; });
await p.evaluate(([s]) => { __drill.applyAt(s, 0.0, null); const v = flareInspector.viewer, T = window.__toonT; v.coach.updateMatrixWorld(true);
  const box = new T.Box3(); const J = v.motion.getMetrics().joints; for (const k in J) box.expandByPoint(new T.Vector3(...J[k])); box.expandByScalar(0.12); window.__standBox = box; __toonUni.uPulse.value = 1; }, [spec]);
const save = (file, d) => fs.writeFileSync(path.join(OUT, 'raw', file), Buffer.from(d.split(',')[1], 'base64'));
const VIEWS = { front: [0, 0.04, 1], back: [0, 0.04, -1] };
const EXTRA = (opt('--extra', '') || '').split(';').filter(Boolean); // name:x,y,z:size:dirx,diry,dirz[:hl groups (comma) | dbgN]
for (const [view, dir] of Object.entries(VIEWS)) for (const hl of [false, true]) {
  const n = await p.evaluate(([dir, g]) => { __aim(__standBox, dir, 0.86); const n = __setHighlight(g ? { groups: g, side: 'both' } : { groups: [] }); __toonUni.uPulse.value = 1;
    const v = flareInspector.viewer; v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); }, [dir, hl ? HL : null]);
  save(`stand-${view}-${hl ? 'hl' : 'plain'}.png`, n); }
for (const e of EXTRA) { const [nm, c, sz, d, hx] = e.split(':'); const dbg = /^dbg\d$/.test(hx || '') ? +hx[3] : 0, hg = hx && !dbg ? hx.split(',') : [];
  const n = await p.evaluate(([c, sz, d, hg, dbg]) => { const T = window.__toonT; __setHighlight({ groups: hg, side: 'both' }); __v2p.regions.uni.uV2pRDbg.value = dbg; __toonUni.uPulse.value = 1; __aim(new T.Box3().setFromCenterAndSize(new T.Vector3(...c), new T.Vector3(sz, sz, sz)), d, 0.9);
    const v = flareInspector.viewer; v.renderer.render(v.scene, v.camera); __v2p.regions.uni.uV2pRDbg.value = 0; return v.renderer.domElement.toDataURL('image/png'); }, [c.split(',').map(Number), +sz, d.split(',').map(Number), hg, dbg]);
  save(`close-${nm}.png`, n); }
log('done'); await b.close();
