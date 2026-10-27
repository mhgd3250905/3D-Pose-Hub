// Capture the actual v3 reset-pose surfaces after head and profile setup.
// Start the configured Vite server first; supply a new output JSON path.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const destination = process.argv[2];
if (!destination) throw new Error('Usage: node capture_rest.mjs <new-output.json>');
const output = path.resolve(destination);
if (fs.existsSync(output)) throw new Error(`Refusing to replace existing output: ${output}`);
const imp = f => import(pathToFileURL(path.join(repo, f)).href);
const { loadTheme } = await imp('drill-anim/lib/config.mjs');
const loader = await imp('drill-anim/models/training-human-v3/loader.mjs');
const { default: squat } = await imp('drill-anim/specs/h-squat.js');
const spec = { ...structuredClone(squat), modelProfile: 'training-human-v2plus-hands-native',
  nativeHands: { version: '1.0.0-r3' },
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };

const { b, p } = await loader.boot({ size: 400, pr: 1, theme: loadTheme() });
try {
  await loader.applyV3(p, spec, {});
  await p.evaluate(s => { __drill.selectModelProfile(s); flareInspector.viewer.motion.reset(); }, spec);
  const result = await p.evaluate(() => {
    const v = flareInspector.viewer, T = window.__toonT;
    v.coach.updateMatrixWorld(true);
    v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
    const out = { meshes: {}, bones: {} };
    v.coach.traverse(o => {
      if (!o.isSkinnedMesh || !['Mesh001', 'Toon_Mannequin_Head_v5', 'V2P_Base_Torso'].includes(o.name)) return;
      const g = o.geometry, n = g.attributes.position.count, bones = o.skeleton.bones.map(b => b.name);
      const P = [], J = [], W = [], q = new T.Vector3();
      for (let i = 0; i < n; i++) {
        o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld); P.push(q.x, q.y, q.z);
        for (let k = 0; k < 4; k++) {
          J.push(g.attributes.skinIndex.getComponent(i, k)); W.push(g.attributes.skinWeight.getComponent(i, k));
        }
      }
      out.meshes[o.name] = { n, bones, P, J, W, index: g.index ? Array.from(g.index.array) : null,
        drawRange: g.drawRange };
    });
    for (const bone of v.coach.getObjectByName('Coach_Body').skeleton.bones) {
      out.bones[bone.name] = { p: bone.getWorldPosition(new T.Vector3()).toArray(),
        q: bone.getWorldQuaternion(new T.Quaternion()).toArray() };
    }
    return out;
  });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result), { flag: 'wx' });
  console.log('Captured', Object.fromEntries(Object.entries(result.meshes).map(([name, mesh]) => [name, mesh.n])));
} finally {
  await b.close();
}
