// Read-only numerical smoke check against the v3-warped source GLB. This is
// not a visual acceptance test and does not export or alter the source GLB.
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { warpModelV3 } from '../../runtime/src/body-warp-v3.js';
import { createCoachMotion } from '../../runtime/src/coach-motion.js';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root));
const data = read('runtime/public/coach/flare-coach.glb');
const { scene: model } = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
const oldRig = JSON.parse(read('runtime/public/coach/coach-rig.json'));
const newRig = JSON.parse(read('runtime/public/coach-v3/coach-rig-v3.json'));
const warp = warpModelV3(THREE, model, oldRig, newRig);
const motion = createCoachMotion({ model, rigData: newRig });
motion.reset(); model.updateMatrixWorld(true);
const before = new Map();
model.traverse(o => {
  if (!o.isSkinnedMesh || !o.geometry.attributes.normal) return;
  const n = o.geometry.attributes.normal;
  before.set(o, Array.from({ length: n.count * 3 }, (_, i) => n.getComponent(Math.floor(i / 3), i % 3)));
});
const window = { __toonT: THREE, flareInspector: { viewer: { coach: model, motion } } };
new Function('window', read('tools/body-v3/arm-normals-r1.js').toString('utf8'))(window);
const report = window.__fixBodyV3ArmNormalsR1();
let changed = 0, nonFinite = 0, maxLengthError = 0, zero = 0;
const bindAngles = [];
model.traverse(o => {
  if (!before.has(o)) return;
  const n = o.geometry.attributes.normal, old = before.get(o);
  for (let i = 0; i < n.count; i++) {
    const v = [n.getX(i), n.getY(i), n.getZ(i)];
    if (v.some(x => !Number.isFinite(x))) { nonFinite++; continue; }
    if (v.some((x, k) => Math.abs(x - old[i * 3 + k]) > 1e-7)) {
      changed++;
      const length = Math.hypot(...v);
      if (length < 1e-10) zero++;
      maxLengthError = Math.max(maxLengthError, Math.abs(1 - length));
      const previous = old.slice(i * 3, i * 3 + 3);
      const prevLength = Math.hypot(...previous);
      if (prevLength > 1e-10 && length > 1e-10) {
        const dot = v.reduce((sum, x, k) => sum + x * previous[k], 0) / (length * prevLength);
        bindAngles.push(Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI);
      }
    }
  }
});
if (!report.changed || changed !== report.changed || nonFinite || zero || maxLengthError > 1e-5) {
  throw new Error('v3 arm normals numerical check failed: ' + JSON.stringify({ report, changed, nonFinite, zero, maxLengthError }));
}
bindAngles.sort((a, b) => a - b);
const quantile = p => bindAngles[Math.min(bindAngles.length - 1, Math.floor(p * bindAngles.length))];
console.log(JSON.stringify({ warp, report, changed, nonFinite, zero, maxLengthError,
  bindNormalChangeDegrees: { p50: quantile(0.5), p95: quantile(0.95), max: quantile(1) } }, null, 2));
