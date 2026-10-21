// Dump the v2 coach rest geometry (reset pose, CPU skinned world positions), skin weights and bone frames -> <out>/rest.json
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const OUT = path.resolve(process.argv[2]); fs.mkdirSync(OUT, { recursive: true });
const { b, p } = await boot({ size: 400, pr: 1, theme: loadTheme(null), bakeHands: [] });
const r = await p.evaluate(() => { const v = flareInspector.viewer, T = window.__toonT; v.motion.reset(); v.coach.updateMatrixWorld(true);
  const out = { meshes: {}, bones: {} }; const q = new T.Vector3();
  v.coach.traverse(o => { if (!o.isSkinnedMesh) return; const g = o.geometry, n = g.attributes.position.count; const bones = o.skeleton.bones.map(b => b.name);
    const P = new Array(n * 3), N = new Array(n * 3), J = new Array(n * 4), W = new Array(n * 4); const nm3 = new T.Matrix3().getNormalMatrix(o.matrixWorld);
    const R = new Array(n * 3);
    for (let i = 0; i < n; i++) { o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld); P[i*3] = +q.x.toFixed(6); P[i*3+1] = +q.y.toFixed(6); P[i*3+2] = +q.z.toFixed(6);
      const nn = new T.Vector3().fromBufferAttribute(g.attributes.normal, i).applyMatrix3(nm3).normalize(); N[i*3] = +nn.x.toFixed(4); N[i*3+1] = +nn.y.toFixed(4); N[i*3+2] = +nn.z.toFixed(4);
      for (let k = 0; k < 4; k++) { J[i*4+k] = g.attributes.skinIndex.getComponent(i, k); W[i*4+k] = +g.attributes.skinWeight.getComponent(i, k).toFixed(5); } }
    out.meshes[o.name] = { n, visible: o.visible, bones, P, N, J, W, index: g.index ? Array.from(g.index.array) : null };
  });
  const sk = v.coach.getObjectByName('Coach_Body').skeleton;
  for (const bn of sk.bones) out.bones[bn.name] = { parent: bn.parent?.name, p: bn.getWorldPosition(new T.Vector3()).toArray(), q: bn.getWorldQuaternion(new T.Quaternion()).toArray() };
  out.landmarks = v.motion.getMetrics().joints; return out; });
fs.writeFileSync(path.join(OUT, 'rest.json'), JSON.stringify(r)); console.log('ok', Object.entries(r.meshes).map(([k, m]) => k + ':' + m.n + (m.visible ? '' : '(hidden)')).join(' '));
await b.close();
