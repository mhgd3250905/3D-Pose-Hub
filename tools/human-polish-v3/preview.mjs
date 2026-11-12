// Recipe-bound comparison, including production hand adapters and approved skin.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { inspectModelVersion } from '../model-version.mjs';
import { loadRecipe, openScene, stageAt } from '../action-package-v3/recipe-scene.mjs';
import { loadSkin } from '../action-package-v3/profile.mjs';
import { installPumpHighlight } from '../action-package-v3/native-highlight.mjs';
import { config, loadTheme } from '../../drill-anim/lib/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = value => createHash('sha256').update(value).digest('hex');
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--recipe', '--out', '--frames'].includes(args[i]) || !args[i + 1]) throw Error('Expected --recipe, --out, --frames');
  options[args[i].slice(2)] = args[i + 1];
}
if (!options.recipe || !options.out) throw Error('--recipe and --out required');
const version = await inspectModelVersion(options.recipe);
const loaded = await loadRecipe(path.resolve(root, options.recipe));
const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.json', import.meta.url)));
for (const [file, expected] of Object.entries(manifest.sources)) {
  if (sha(fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n')) !== expected) throw Error('Appearance source drift: ' + file);
}
const skin = loadSkin('realistic');
if (skin.sha256 !== manifest.baseSkinSha256) throw Error('Approved skin changed');
const out = path.resolve(options.out);
if (fs.existsSync(out)) throw Error('Use a new output directory');
const frames = (options.frames || '0,36').split(',').map(Number);
if (!frames.every((n, i) => Number.isInteger(n) && n >= 0 && n <= loaded.source.timeline.duration * 30 && (!i || n > frames[i - 1]))) throw Error('Invalid frames');
const lock = path.join(config().work_dir, 'package-v3-render.lock');
for (const name of ['completion-render.lock', 'completion-render-lane2.lock', 'remote-keyframes-r1.lock', 'package-v3-render.lock']) {
  if (fs.existsSync(path.join(config().work_dir, name))) throw Error('Active render lock: ' + name);
}
fs.mkdirSync(path.dirname(lock), { recursive: true });
fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, out }), { flag: 'wx' });
const report = { version, appearance: manifest, skin, pageErrors: [], frames: [], sampledOnly: true, userAccepted: false };
let browser;
try {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'source-manifest.json'), JSON.stringify(loaded.pinned, null, 2));
  fs.writeFileSync(path.join(out, 'effective-spec.json'), JSON.stringify(loaded.source, null, 2));
  fs.copyFileSync(loaded.prepared.recipeFile, path.join(out, 'recipe.snapshot.json'));
  const scene = await openScene(loaded, { size: 900, theme: loadTheme(), report });
  browser = scene.browser;
  const page = scene.page;
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'tools/action-package-v3/browser-package-layers.js'), 'utf8') });
  await page.evaluate(() => __pkgLayers.patch());
  report.highlight = await installPumpHighlight(page);
  await page.addScriptTag({ content: fs.readFileSync(new URL('./runtime.js', import.meta.url), 'utf8') });
  let warm = null;
  for (const frame of frames) {
    const staged = await stageAt(page, loaded.source, frame / 30, warm);
    warm = staged.x;
    const pair = [];
    for (const enabled of [false, true]) {
      const result = await page.evaluate(([enabled, skin]) => {
        __bodyPolish.enable(enabled);
        const viewer = flareInspector.viewer;
        const previous = viewer.scene.onAfterRender;
        let actual;
        viewer.scene.onAfterRender = function (...args) {
          const meshes = [];
          viewer.scene.traverse(mesh => {
            if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;
            let visible = true;
            for (let p = mesh; p; p = p.parent) visible &&= p.visible;
            if (!visible || mesh.geometry.drawRange.count === 0 || mesh.geometry.index?.count === 0) return;
            if (!/Hand|hand|Torso|Limbs|Head|Coach_|Mesh00|Wrist|wrist/i.test(mesh.name)) return;
            const a = mesh.geometry.attributes.position;
            const points = [];
            for (let i = 0; i < a.count; i += Math.max(1, Math.floor(a.count / 12))) {
              const point = new __toonT.Vector3();
              mesh.getVertexPosition(i, point);
              points.push(point.applyMatrix4(mesh.matrixWorld).toArray());
            }
            meshes.push({ name: mesh.name, vertices: a.count, points });
          });
          actual = { model: window.__armfixR2, handPoses: { ...__v2p.cur }, meshes };
          return previous?.apply(this, args);
        };
        let images;
        try { images = __pkgLayers.render(['body', 'body-highlight', 'mask'], [{ id: 'realistic', look: skin.look }]); }
        finally { viewer.scene.onAfterRender = previous; }
        return { images, actual, polish: __bodyPolish.report(), highlightErrors: window.__pkgPumpErr || [] };
      }, [enabled, skin]);
      const label = enabled ? 'candidate' : 'baseline';
      for (const [layer, data] of Object.entries(result.images)) {
        fs.writeFileSync(path.join(out, `${frame}-${label}-${layer.replace('/', '-')}.png`), Buffer.from(data.split(',')[1], 'base64'), { flag: 'wx' });
      }
      const mask = sha(Buffer.from(result.images.mask.split(',')[1], 'base64'));
      const { images, ...evidence } = result;
      pair.push({ label, mask, ...evidence });
      if (result.polish.errors.length || result.highlightErrors.length) throw Error('Shader hook verification failed');
    }
    if (pair[0].mask !== pair[1].mask) throw Error('Highlight coverage changed');
    if (JSON.stringify(pair[0].actual) !== JSON.stringify(pair[1].actual)) throw Error('Rendered model/hand geometry changed');
    const names = pair[1].actual.meshes.map(mesh => mesh.name);
    const fixed = loaded.prepared.handSetup.adapter === 'webxr-dumbbell-wrist-r1';
    if (fixed ? !names.some(name => name.startsWith('WebXR_Clipped_Hand_')) : !names.includes('V2P_Base_Hands')) throw Error('Expected hand mesh not rendered');
    report.frames.push({ frame, staged, maskUnchanged: true, sampledGeometryUnchanged: true, pair });
    console.log(JSON.stringify({ frame, handAdapter: loaded.prepared.handSetup.adapter, maskUnchanged: true }));
  }
  if (report.pageErrors.length) throw Error(report.pageErrors.join('\n'));
  if ((await loadRecipe(loaded.prepared.recipeFile)).pinned.sha256 !== loaded.pinned.sha256) throw Error('Recipe sources changed during capture');
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = String(error.stack || error);
  throw error;
} finally {
  if (fs.existsSync(out)) fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  fs.unlinkSync(lock);
}
