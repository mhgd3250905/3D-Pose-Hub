// Dump the accepted v2 relaxed hand (v7 relax morph at weight 1, reset pose) in left-hand-bone local coords -> <out>/relax-left.json
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const OUT = path.resolve(process.argv[2]);
const { b, p } = await boot({ size: 300, pr: 1, theme: loadTheme(null), bakeHands: [] });
const r = await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT; v.motion.reset(); __setRelax(1, 1); v.coach.updateMatrixWorld(true);
  const o = v.coach.getObjectByName('Coach_Body'); const h = v.coach.getObjectByName('leftHand'); const hp = h.getWorldPosition(new T.Vector3()), hq = h.getWorldQuaternion(new T.Quaternion()).invert();
  const ids = __relaxState.ids.left; const q = new T.Vector3(); const out = [];
  for (const i of ids) { o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld).sub(hp).applyQuaternion(hq); out.push(i, +q.x.toFixed(6), +q.y.toFixed(6), +q.z.toFixed(6)); }
  __setRelax(0, 0); return out; });
fs.writeFileSync(path.join(OUT, 'relax-left.json'), JSON.stringify(r)); console.log('ok', r.length / 4); await b.close();
