import * as THREE from 'three';

/**
 * Segmented spine for the Snow coach.
 *
 * The exported rig has a single torso bone from the pelvis to the shoulders:
 * every vertex between the belt and the chest is 100 % torso, and the whole
 * pelvis→torso bend happens in a 15 cm band at the waistband. In a flare the
 * torso swings and twists hard against the hips, so the waist folds like a
 * hinge.
 *
 * This adds two hidden helper bones (lower and upper spine). They are not
 * posed or saved: every frame each one takes an interpolated rigid transform
 * between the pelvis and torso bones (rotation slerp around its own pivot), so
 * the 20 editable joints, saved poses and storage format are unchanged. Skin
 * weights that belonged to pelvis/torso in the abdomen are spread over the
 * four-bone chain, turning the hinge into a smooth curve.
 */
const BAND = [0.80, 1.27];          // rest height (m) of the blended abdomen
const SHARES = [1 / 3, 2 / 3];      // where the two helpers sit in the chain
const smooth = x => x * x * (3 - 2 * x);

export function installSpineHelpers({ model, meshes, skeletons, landmarks }) {
  const pelvis = findBone(model, 'pelvis'), torso = findBone(model, 'torso');
  if (!pelvis || !torso || !landmarks?.pelvis || !landmarks?.torso) return null;
  const armature = pelvis.parent;
  model.updateMatrixWorld(true);

  const pelvisRestWorld = pelvis.matrixWorld.clone(), torsoRestWorld = torso.matrixWorld.clone();
  const pelvisInverse = pelvisRestWorld.clone().invert(), torsoInverse = torsoRestWorld.clone().invert();
  const pelvisRest = new THREE.Vector3(...landmarks.pelvis).applyMatrix4(model.matrixWorld);
  const torsoRest = new THREE.Vector3(...landmarks.torso).applyMatrix4(model.matrixWorld);
  const helpers = SHARES.map((share, index) => {
    const bone = new THREE.Bone();
    bone.name = index ? 'spineUpper' : 'spineLower';
    bone.matrixAutoUpdate = false;
    bone.matrixWorldAutoUpdate = false;
    armature.add(bone);
    // Pivot at the centre of the helper's weight band, on the pelvis→torso line.
    const pivot = pelvisRest.clone().lerp(torsoRest, share);
    pivot.y = THREE.MathUtils.lerp(BAND[0], BAND[1], share);
    return { bone, share, pivot };
  });

  // Rebind every skinned mesh to a skeleton that also carries the helpers.
  const replaced = new Map();
  for (const mesh of meshes) {
    let next = replaced.get(mesh.skeleton);
    if (!next) {
      const old = mesh.skeleton;
      // A skin's inverse bind matrices may carry a per-mesh offset (for example
      // KHR_mesh_quantization). The helpers' world matrices are deltas in the
      // canonical rest frame, so each skeleton gets that same offset as the
      // helpers' inverse: Q = pelvisRestWorld · pelvisInverse(this skin).
      const offset = pelvisRestWorld.clone().multiply(old.boneInverses[old.bones.indexOf(pelvis)]);
      next = new THREE.Skeleton(
        [...old.bones, ...helpers.map(item => item.bone)],
        [...old.boneInverses, ...helpers.map(() => offset.clone())],
      );
      replaced.set(old, next);
    }
    const pelvisIndex = next.bones.indexOf(pelvis), torsoIndex = next.bones.indexOf(torso);
    const helperIndex = helpers.map(item => next.bones.indexOf(item.bone));
    redistribute(mesh, [pelvisIndex, helperIndex[0], helperIndex[1], torsoIndex]);
    mesh.bind(next, mesh.bindMatrix);
  }
  skeletons.clear();
  for (const skeleton of replaced.values()) skeleton.bones.length && skeletons.add(skeleton);

  const dp = new THREE.Matrix4(), dt = new THREE.Matrix4();
  const qp = new THREE.Quaternion(), qt = new THREE.Quaternion(), qm = new THREE.Quaternion();
  const tp = new THREE.Vector3(), tt = new THREE.Vector3(), scale = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const rotation = new THREE.Matrix4();

  /** Call after the 20 deform bones have their world matrices. */
  function update() {
    dp.multiplyMatrices(pelvis.matrixWorld, pelvisInverse);
    dt.multiplyMatrices(torso.matrixWorld, torsoInverse);
    dp.decompose(tp, qp, scale);
    dt.decompose(tt, qt, scale);
    for (const { bone, share, pivot } of helpers) {
      qm.slerpQuaternions(qp, qt, share);
      a.copy(pivot).applyMatrix4(dp);
      b.copy(pivot).applyMatrix4(dt);
      a.lerp(b, share);
      rotation.makeRotationFromQuaternion(qm);
      // D = T(target) · R · T(−pivot)
      bone.matrixWorld.makeTranslation(-pivot.x, -pivot.y, -pivot.z).premultiply(rotation);
      bone.matrixWorld.elements[12] += a.x;
      bone.matrixWorld.elements[13] += a.y;
      bone.matrixWorld.elements[14] += a.z;
    }
  }
  update();
  return { update, helpers: helpers.map(item => item.bone.name) };
}

function findBone(root, name) {
  let found = null;
  root.traverse(object => { if (!found && object.isBone && object.name === name) found = object; });
  return found;
}

function redistribute(mesh, chain) {
  const [pelvisIndex, , , torsoIndex] = chain;
  const geometry = mesh.geometry;
  const position = geometry.getAttribute('position');
  const indices = geometry.getAttribute('skinIndex');
  const weights = geometry.getAttribute('skinWeight');
  if (!position || !indices || !weights) return;
  const vertex = new THREE.Vector3();
  let changed = false;
  for (let i = 0; i < position.count; i++) {
    // Rest height through the bind pose (works for quantized / offset meshes too).
    mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld);
    if (vertex.y < BAND[0] - 0.02 || vertex.y > BAND[1] + 0.05) continue;
    let share = 0;
    const others = [];
    for (let k = 0; k < 4; k++) {
      const index = indices.getComponent(i, k), weight = weights.getComponent(i, k);
      if (weight <= 0) continue;
      if (index === pelvisIndex || index === torsoIndex) share += weight;
      else others.push([index, weight]);
    }
    if (share < 0.02) continue;
    const u = smooth(THREE.MathUtils.clamp((vertex.y - BAND[0]) / (BAND[1] - BAND[0]), 0, 1)) * 3;
    const segment = Math.min(2, Math.floor(u)), fraction = u - segment;
    const chainWeights = [[chain[segment], share * (1 - fraction)], [chain[segment + 1], share * fraction]];
    others.sort((x, y) => y[1] - x[1]);
    const influences = [...chainWeights, ...others].filter(item => item[1] > 1e-5).slice(0, 4);
    const total = influences.reduce((sum, item) => sum + item[1], 0);
    for (let k = 0; k < 4; k++) {
      const item = influences[k];
      indices.setComponent(i, k, item ? item[0] : 0);
      weights.setComponent(i, k, item ? item[1] / total : 0);
    }
    changed = true;
  }
  if (changed) { indices.needsUpdate = true; weights.needsUpdate = true; }
}
