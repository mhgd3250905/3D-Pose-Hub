// training-human-v2plus baked muscle regions in motion (v2plus.regions:'baked'): key frames only — h-squat t=1.2 (quads +
// glutes highlighted) and scapular-B t=1.9 (lats highlighted), whole figure + a close-up each, to check that outlines and
// highlight follow the deforming body. Run through run.sh (private Vite + one Chromium):
//   tools/human-v2plus/run.sh tools/human-v2plus/regions-poses.mjs <outdir> [--size 640]
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; };
const OUT = path.resolve(A[0] || 'output/human-v2plus-regions'); fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
const SZ = +opt('--size', '640'), HLO = opt('--hl', null)?.split(','), ANCH = A.includes('--anchors'), ONLY = opt('--only', null)?.split(',');
const VIEWS = opt('--views', null)?.split(','), LABELS = A.includes('--labels'), LANG = opt('--lang', 'zh');
// --labels: label + arrow annotation (setLabels): standing views get fixed label sets (LBL below), motion poses auto-label the
// highlighted regions; --views a,b: only these view names; --lang zh|en|both
// --hl a,b: highlight these groups / base keys in every pose instead of the defaults; --anchors: debug dots + normal sticks at the
// highlighted regions' label anchors (getRegionAnchor); --only id,...: only these poses; --stand: add the standing pose (t=0)
const theme = loadTheme(null); const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', ...a);
const { b, p } = await boot({ size: SZ, pr: 1, theme, bakeHands: [] }); log('boot ok');
p.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text().slice(0, 400)); });
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
log('v2plus', JSON.stringify(await p.evaluate(([m, o]) => __v2p.load(m, o), [R('training-human-v2plus-hands.json'), R('training-human-v2plus-outfit.json')])));
log('torso', JSON.stringify(await p.evaluate(d => __v2p.loadTorso(d), R('training-human-v2plus-torso-base.json'))));
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus-regions.js'), 'utf8') });
log('regions', JSON.stringify(await p.evaluate(d => __v2p.loadRegions(d), R('training-human-v2plus-regions.json'))));
const save = (file, d) => fs.writeFileSync(path.join(OUT, 'raw', file), Buffer.from(d.split(',')[1], 'base64'));
await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT;
  window.__aim = (box, dir, k) => { const c = box.getCenter(new T.Vector3()); const r = box.getSize(new T.Vector3()).length() / 2;
    v.camera.clearViewOffset(); v.camera.aspect = 1; v.camera.updateProjectionMatrix(); const dist = r / Math.sin(v.camera.fov * Math.PI / 360) * k;
    v.camera.position.copy(c).addScaledVector(new T.Vector3(...dir).normalize(), dist); v.controls.target.copy(c); v.camera.lookAt(c); v.camera.updateMatrixWorld(); }; });
const POSES = [ // id, t, highlight, [view name, dir, joint for close-up | null (whole figure), close size]
  ['h-squat', 1.2, ['quadriceps', 'glute-max'], [['front', [0.55, 0.15, 1], null], ['thigh', [0.8, 0.2, 0.7], 'leftKnee', 0.5], ['back', [0.4, 0.2, -1], null]]],
  ['scapular-B', 1.9, ['lats', 'scapular'], [['back', [0.25, 0.0, -1], null], ['lat', [0.7, -0.05, -0.8], 'leftShoulder', 0.5], ['front', [0.3, 0.0, 1], null]]],
];
// --demo glute-ham: h-db-rdl (dumbbell Romanian deadlift) instead of the defaults, highlighting the spec's own groups
// (hamstrings + glute-max): start, mid-hinge, bottom (hamstring stretch) from back-3/4 / side / back (the way up mirrors the
// way down: t=3.2 is the same pose as t=1.2)
const DEMO = { 'glute-ham': [
  ['h-db-rdl', 0.2, null, [['back34', [0.75, 0.2, -1], null]]],
  ['h-db-rdl', 1.2, null, [['back34', [0.75, 0.2, -1], null]]],
  ['h-db-rdl', 2.3, null, [['side', [1, 0.15, -0.5], null], ['back', [0.2, 0.35, -1], null]]],
] };
if (opt('--demo', null)) POSES.splice(0, POSES.length, ...DEMO[opt('--demo', null)]);
if (A.includes('--stand')) POSES.unshift(['h-squat', 0.0, ['chest'], [['stand-front', [0.35, 0.1, 1], null], ['stand-back', [0.35, 0.1, -1], null]]]);
if (ANCH) await p.evaluate(() => __v2p.regions.showAnchors(true));
const LBL = { 'stand-front': ['pec', 'rectus-upper', 'delt-front', 'rectus-femoris', 'sartorius'], 'stand-back': ['trap-upper', 'trap-mid', 'infraspinatus', 'lat', 'glute-max'] };
if (LABELS) { // headless Chromium here has no CJK font: register a 14 KB Noto Sans SC subset (only the table's Chinese names; SIL OFL) as
  // V2PLabelCJK, which the runtime lists first before the system CJK fonts
  const ff = path.join(REPO, 'tools/human-v2plus/regions/label-font-zh.woff2');
  if (fs.existsSync(ff)) log('font', await p.evaluate(async b64 => { const f = new FontFace('V2PLabelCJK', Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer); await f.load(); document.fonts.add(f); return f.status; }, fs.readFileSync(ff).toString('base64'))); }
for (const [id, t, hl0, views] of POSES) { if (ONLY && !ONLY.includes(id)) continue; let hl = HLO || hl0;
  const s0 = (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default;
  hl = hl || s0.highlight?.groups || [];
  const spec = Object.assign({}, s0, { modelProfile: 'training-human-v2plus', v2plus: { outfit: 'compression', torso: 'base', regions: 'baked' } });
  await p.evaluate(([spec, th, SZ]) => { (__props.list || []).forEach(o => o.parent?.remove(o)); if (__props.list) __props.list.length = 0;
    __toonUni.uSinkK.value = spec.clothSink ?? 1; for (const pr of spec.props || []) __props.add(th, pr); __drill.setupCamera(spec, SZ); }, [spec, theme, SZ]);
  for (let k = 0; k < 2; k++) await p.evaluate(([s, SZ]) => { __drill.frame(s, 0, -1, null, { size: SZ, full: false }); return 1; }, [spec, SZ]);
  for (const [vn, dir, jn, sz] of views) { if (VIEWS && !VIEWS.includes(vn)) continue;
    if (LABELS) await p.evaluate(([l, lang]) => __v2p.setLabels(l ? l.map(key => ({ key })) : null, { auto: !l, lang }), [LBL[vn] || null, LANG]);
    // frame() poses the figure (and resets the drill camera); then aim our own camera and render that
    const img = await p.evaluate(([s, t, g, dir, jn, sz, SZ]) => { __setHighlight({ groups: g, side: 'both' }); __toonUni.uPulse.value = 1; __drill.frame(s, t, -1, null, { size: SZ, full: false });
      const v = flareInspector.viewer, T = window.__toonT; const J = Object.assign({}, v.motion.getMetrics().joints, __drill._jo || {});
      let box; if (jn) box = new T.Box3().setFromCenterAndSize(new T.Vector3(...J[jn]), new T.Vector3(sz, sz, sz)); else { box = new T.Box3(); for (const k in J) box.expandByPoint(new T.Vector3(...J[k])); box.expandByScalar(0.1); }
      __aim(box, dir, jn ? 0.9 : 0.95); v.renderer.setSize(SZ, SZ, false); v.renderer.render(v.scene, v.camera); return v.renderer.domElement.toDataURL('image/png'); }, [spec, t, hl, dir, jn, sz, SZ]);
    save(`${id}-t${t.toFixed(1)}-${vn}.png`, img); log(id, t, vn, LABELS ? JSON.stringify(await p.evaluate(() => __v2p.regions.labelState.items)) : ''); } }
log('done'); await b.close();
