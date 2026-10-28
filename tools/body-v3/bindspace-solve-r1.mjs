// Math helpers for a geometry-only editing probe. Input positions/normals are
// in the current skinned world pose; outputs are in the original mesh bind
// space. They do not mutate a GLB, skeleton, indices, or weights.
import * as THREE from 'three';

export function influencesAt(mesh, index) {
  const { skinIndex, skinWeight } = mesh.geometry.attributes;
  if (!skinIndex || !skinWeight || index < 0 || index >= skinIndex.count) throw new Error('invalid skin vertex');
  const out = [];
  for (let k = 0; k < 4; k++) {
    const weight = skinWeight.getComponent(index, k);
    if (!weight) continue;
    const bone = mesh.skeleton.bones[skinIndex.getComponent(index, k)];
    if (!bone) throw new Error('invalid bone index');
    out.push({ name: bone.name, weight });
  }
  return out;
}

export function skinMatrices(mesh, influences) {
  if (!mesh.isSkinnedMesh || !Array.isArray(influences) || !influences.length || influences.length > 4) throw new Error('expected a skinned mesh and one to four influences');
  const sum = new THREE.Matrix4(); sum.elements.fill(0);
  const names = new Set(); let total = 0;
  for (const { name, weight } of influences) {
    if (names.has(name) || !Number.isFinite(weight) || weight <= 0) throw new Error('invalid influence');
    names.add(name); total += weight;
    const index = mesh.skeleton.bones.findIndex(b => b.name === name);
    if (index < 0) throw new Error('unknown bone: ' + name);
    const bone = mesh.skeleton.bones[index];
    const matrix = new THREE.Matrix4().multiplyMatrices(bone.matrixWorld, mesh.skeleton.boneInverses[index]);
    for (let j = 0; j < 16; j++) sum.elements[j] += weight * matrix.elements[j];
  }
  if (Math.abs(total - 1) > 1e-5) throw new Error('skin weights must sum to one');
  const skin = new THREE.Matrix4().copy(mesh.bindMatrixInverse).multiply(sum).multiply(mesh.bindMatrix);
  const worldFromBind = new THREE.Matrix4().copy(mesh.matrixWorld).multiply(skin);
  if (!Number.isFinite(worldFromBind.determinant()) || Math.abs(worldFromBind.determinant()) < 1e-12) throw new Error('singular skin transform');
  return { skin, worldFromBind };
}

export function solveBindPosition(mesh, influences, worldPosition) {
  const position = new THREE.Vector3(...worldPosition);
  if (![position.x, position.y, position.z].every(Number.isFinite)) throw new Error('invalid world position');
  return position.applyMatrix4(skinMatrices(mesh, influences).worldFromBind.invert());
}

export function solveBindNormal(mesh, influences, worldNormal) {
  const normal = new THREE.Vector3(...worldNormal);
  if (![normal.x, normal.y, normal.z].every(Number.isFinite) || normal.lengthSq() < 1e-20) throw new Error('invalid world normal');
  const skin = new THREE.Matrix3().setFromMatrix4(skinMatrices(mesh, influences).skin);
  if (!Number.isFinite(skin.determinant()) || Math.abs(skin.determinant()) < 1e-12) throw new Error('singular normal transform');
  // Three's skinning chunk applies mat3(skin), followed by normalMatrix.
  return normal.applyMatrix3(new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld).transpose()).applyMatrix3(skin.invert()).normalize();
}
