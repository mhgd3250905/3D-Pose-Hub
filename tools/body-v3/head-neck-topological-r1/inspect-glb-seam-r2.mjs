// Inspect Blender round-trip P2 glTF primitives before choosing how to weld.
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const [source, output] = process.argv.slice(2);
if (!source || !output || fs.existsSync(output)) throw new Error('Expected input GLB and new report path');
const bytes = fs.readFileSync(source);
const root = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
root.updateMatrixWorld(true);
const group = root.getObjectByName('V3_Head_Neck_Topological_R1');
const meshes = [];
group?.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
if (meshes.length !== 2) throw new Error(`Expected two skinned material primitives, got ${meshes.length}`);
const seamCount = 162;
const maps = meshes.map(mesh => {
  const g = mesh.geometry, marker = g.attributes._phvertexid, map = new Map();
  if (!marker || !g.index) throw new Error('Missing vertex IDs or indices');
  for (const id of new Set(g.index.array)) {
    const key = marker.getX(id);
    if (!Number.isInteger(key)) throw new Error('Non-integer source ID');
    if (key < seamCount) { const list = map.get(key) || []; list.push(id); map.set(key, list); }
  }
  mesh.skeleton.update();
  return map;
});
const counts = new Map(), positionDiff = [], normalDiff = [], weightDiff = [], uvDiff = [], colorDiff = [];
const A = new THREE.Vector3(), B = new THREE.Vector3();
const weighted = (mesh, id) => {
  const g = mesh.geometry, map = new Map();
  for (let k = 0; k < 4; k++) {
    const name = mesh.skeleton.bones[g.attributes.skinIndex.getComponent(id, k)].name;
    map.set(name, (map.get(name) || 0) + g.attributes.skinWeight.getComponent(id, k));
  }
  return map;
};
function world(mesh, id, normal) {
  const g = mesh.geometry, q = new THREE.Vector3().fromBufferAttribute(g.attributes.position, id);
  if (normal) q.addScaledVector(new THREE.Vector3().fromBufferAttribute(g.attributes.normal, id), .002);
  mesh.applyBoneTransform(id, q); return q.applyMatrix4(mesh.matrixWorld);
}
for (let id = 0; id < seamCount; id++) {
  const x = maps[0].get(id) || [], y = maps[1].get(id) || [];
  const key = `${x.length}/${y.length}`; counts.set(key, (counts.get(key) || 0) + 1);
  if (x.length !== 1 || y.length !== 1) continue;
  const a = x[0], b = y[0], pa = world(meshes[0], a, false), pb = world(meshes[1], b, false);
  positionDiff.push(pa.distanceTo(pb) * 1000);
  A.copy(world(meshes[0], a, true)).sub(pa).normalize(); B.copy(world(meshes[1], b, true)).sub(pb).normalize();
  normalDiff.push(THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(A.dot(B), -1, 1))));
  const wa = weighted(meshes[0], a), wb = weighted(meshes[1], b);
  weightDiff.push(Math.max(0, ...[...new Set([...wa.keys(), ...wb.keys()])].map(n => Math.abs((wa.get(n) || 0) - (wb.get(n) || 0)))));
  const ua = meshes[0].geometry.attributes.uv, ub = meshes[1].geometry.attributes.uv;
  if (ua && ub) uvDiff.push(Math.hypot(ua.getX(a) - ub.getX(b), ua.getY(a) - ub.getY(b)));
  const ca = meshes[0].geometry.attributes.color, cb = meshes[1].geometry.attributes.color;
  if (ca && cb) colorDiff.push(Math.max(...[0, 1, 2].map(k => Math.abs(ca.getComponent(a, k) - cb.getComponent(b, k)))));
}
const max = xs => xs.length ? Math.max(...xs) : null;
const report = { source, seamCount, multiplicity: Object.fromEntries(counts),
  positionDifferenceMaxMm: max(positionDiff), normalDifferenceMaxDegrees: max(normalDiff),
  weightDifferenceMax: max(weightDiff), uvDifferenceMax: max(uvDiff), colorDifferenceMax: max(colorDiff),
  primitives: meshes.map(o => ({ name: o.name, parent: o.parent?.name, vertices: o.geometry.attributes.position.count,
    material: o.material.name, materialType: o.material.type, vertexColors: o.material.vertexColors, bones: o.skeleton.bones.length,
    attributes: Object.keys(o.geometry.attributes), matrixWorld: o.matrixWorld.toArray(), bindMatrix: o.bindMatrix.toArray() })) };
fs.writeFileSync(output, JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report));
