// Load a two-material GLB, restore its ID seam, and compare source/restored
// skinning in three independent local neck/head rotations.
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { restoreHeadNeck } from '../../../drill-anim/models/head-neck-restore-r3/loader.mjs';

const [source, output] = process.argv.slice(2);
if (!source || !output || fs.existsSync(output)) throw new Error('Expected a GLB and a new JSON report');
const bytes = fs.readFileSync(source);
const root = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
root.updateMatrixWorld(true);
const group = root.getObjectByName('V3_Head_Neck_Topological_R1'), primitives = [];
group?.traverse(o => { if (o.isSkinnedMesh) primitives.push(o); });
if (primitives.length !== 2) throw new Error('Expected two P2 material primitives');
const bones = new Map(); root.traverse(o => { if (o.isBone) { if (bones.has(o.name)) throw new Error('Duplicate bone'); bones.set(o.name, o); } });
const rest = new Map([...bones].map(([name, bone]) => [name, { parent: bone.parent?.name, p: bone.position.clone(),
  q: bone.quaternion.clone(), s: bone.scale.clone(), local: bone.matrix.toArray(), world: bone.matrixWorld.toArray() }]));
const sourceMaterial = primitives.map(o => ({ name: o.material.name, type: o.material.type, vertexColors: o.material.vertexColors,
  color: o.material.color?.toArray(), roughness: o.material.roughness, metalness: o.material.metalness, side: o.material.side }));
// Instrument a synthetic per-vertex data texture. The GLB materials themselves
// are standard PBR; this checks the restoration wrapper's gl_VertexID mapping
// without claiming the original runtime toon shader was included in the GLB.
const testTextures = primitives.map((o, p) => {
  const n = o.geometry.attributes.position.count, width = 1024, height = Math.ceil(n / width), data = new Float32Array(width * height * 4);
  for (let i = 0; i < n; i++) { data[i * 4] = p + i / 100000; data[i * 4 + 1] = i % 17; }
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  o.material.onBeforeCompile = shader => { shader.uniforms.uVT = { value: tex }; };
  return tex;
});
const restored = restoreHeadNeck(root), merged = restored.mesh;
const materialChecks = restored.parts.map((o, p) => ({ name: merged.material[p].name, type: merged.material[p].type,
  vertexColors: merged.material[p].vertexColors, color: merged.material[p].color?.toArray(),
  roughness: merged.material[p].roughness, metalness: merged.material[p].metalness, side: merged.material[p].side }));
if (JSON.stringify(sourceMaterial) !== JSON.stringify(materialChecks)) throw new Error('Material properties changed');
let remapMax = 0;
for (let p = 0; p < 2; p++) {
  const shader = { uniforms: {} }; merged.material[p].onBeforeCompile(shader, null);
  const actual = shader.uniforms.uVT.value.image.data, expected = testTextures[p].image.data;
  for (const [old, target] of restored.localToMerged[p]) for (let c = 0; c < 4; c++)
    remapMax = Math.max(remapMax, Math.abs(actual[target * 4 + c] - expected[old * 4 + c]));
}
if (remapMax !== 0) throw new Error('gl_VertexID texture remap changed source values');
root.updateMatrixWorld(true);
let matrixDifference = 0, hierarchyUnchanged = bones.size === rest.size;
for (const [name, bone] of bones) {
  const old = rest.get(name); hierarchyUnchanged &&= old?.parent === bone.parent?.name;
  for (let k = 0; k < 16; k++) matrixDifference = Math.max(matrixDifference,
    Math.abs(old.local[k] - bone.matrix.elements[k]), Math.abs(old.world[k] - bone.matrixWorld.elements[k]));
}
if (!hierarchyUnchanged || matrixDifference > 1e-9) throw new Error('Skeleton changed during restoration');
const poses = [
  ['rest', []],
  ['neckFlexLocal', [['neck', [1, 0, 0], 20], ['head', [1, 0, 0], 40]]],
  ['neckExtensionLocal', [['neck', [1, 0, 0], -17.5], ['head', [1, 0, 0], -35]]],
  ['neckRotationLocal', [['neck', [0, 1, 0], 32.5], ['head', [0, 1, 0], 65]]],
];
const q = new THREE.Vector3(), r = new THREE.Vector3(), results = [];
for (const [label, rotations] of poses) {
  for (const [name, original] of rest) { const bone = bones.get(name); bone.position.copy(original.p); bone.quaternion.copy(original.q); bone.scale.copy(original.s); }
  for (const [name, axis, degrees] of rotations)
    bones.get(name).quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis), degrees * Math.PI / 180));
  root.updateMatrixWorld(true); merged.skeleton.update(); primitives.forEach(o => o.skeleton.update());
  let maxMm = 0, compared = 0, maxNormalDegrees = 0;
  for (let p = 0; p < 2; p++) for (const [old, id] of restored.localToMerged[p]) {
    const part = primitives[p];
    part.getVertexPosition(old, q).applyMatrix4(part.matrixWorld);
    merged.getVertexPosition(id, r).applyMatrix4(merged.matrixWorld);
    maxMm = Math.max(maxMm, q.distanceTo(r) * 1000);
    const n1 = new THREE.Vector3().fromBufferAttribute(part.geometry.attributes.position, old)
      .addScaledVector(new THREE.Vector3().fromBufferAttribute(part.geometry.attributes.normal, old), .002);
    const n2 = new THREE.Vector3().fromBufferAttribute(merged.geometry.attributes.position, id)
      .addScaledVector(new THREE.Vector3().fromBufferAttribute(merged.geometry.attributes.normal, id), .002);
    part.applyBoneTransform(old, n1); n1.applyMatrix4(part.matrixWorld).sub(q).normalize();
    merged.applyBoneTransform(id, n2); n2.applyMatrix4(merged.matrixWorld).sub(r).normalize();
    maxNormalDegrees = Math.max(maxNormalDegrees, THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(n1.dot(n2), -1, 1)))); compared++;
  }
  results.push({ name: label, verticesCompared: compared, positionDifferenceMaxMm: maxMm, normalDifferenceMaxDegrees: maxNormalDegrees });
}
const report = { source, materials: sourceMaterial, sourceVertices: primitives.map(o => o.geometry.attributes.position.count),
  restoredVertices: merged.geometry.attributes.position.count, groups: merged.geometry.groups.length,
  seamEdgesTwoFaces: restored.seamCount, bones: bones.size, hierarchyUnchanged, matrixDifferenceMax: matrixDifference,
  glVertexIdSyntheticRemapMax: remapMax, poses: results,
  limitations: 'Independent local joint rotations only; runtime toon shader is not encoded in the input GLB. Visual render and app motion solver remain separate checks.' };
fs.writeFileSync(output, JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report));
