// Attach the independently versioned P2 GLB fragment to an existing v3 rig.
// The caller provides live theme/muscle/v2plus uniforms and the objects to hide.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { restoreHeadNeck } from '../head-neck-restore-r3/loader.mjs';
import { attachIndependentV3Toon } from '../head-neck-toon-r4/loader.mjs';

export async function attachHeadNeckFragment({ binary, parent, skeleton, toonAsset, uniforms, hide = [] }) {
  if (!(binary instanceof ArrayBuffer) || !parent?.isObject3D || !(skeleton instanceof THREE.Skeleton) || !Array.isArray(hide))
    throw new Error('head-neck-fragment-r3: expected GLB ArrayBuffer, target parent, v3 skeleton and hide list');
  const gltf = await new GLTFLoader().parseAsync(binary, ''), restored = restoreHeadNeck(gltf.scene);
  const mesh = restored.mesh, skin = mesh.skeleton;
  if (skin.bones.length !== 52 || skeleton.bones.length !== 52)
    throw new Error(`head-neck-fragment-r3: expected 52 bones, fragment ${skin.bones.length}, target ${skeleton.bones.length}`);
  const targetByName = new Map(skeleton.bones.map(bone => [bone.name, bone]));
  if (targetByName.size !== skeleton.bones.length) throw new Error('head-neck-fragment-r3: duplicate v3 bone names');
  const mapped = skin.bones.map(bone => {
    const target = targetByName.get(bone.name);
    if (!target) throw new Error(`head-neck-fragment-r3: missing v3 bone ${bone.name}`);
    const originalParent = bone.parent?.isBone ? bone.parent.name : null;
    const targetParent = target.parent?.isBone ? target.parent.name : null;
    if (originalParent !== targetParent) throw new Error(`head-neck-fragment-r3: hierarchy mismatch at ${bone.name}`);
    return target;
  });
  attachIndependentV3Toon(mesh, toonAsset, uniforms);
  const inverse = skin.boneInverses.map(matrix => matrix.clone()), bind = mesh.bindMatrix.clone();
  const visibility = hide.map(object => {
    if (!object?.isObject3D || object === mesh) throw new Error('head-neck-fragment-r3: invalid hide object');
    return [object, object.visible];
  });
  // Preserve the fragment's imported world placement while parenting it under
  // the supplied v3 scene. This changes no existing bone or inverse matrix.
  gltf.scene.updateMatrixWorld(true); parent.updateWorldMatrix(true, false);
  parent.attach(mesh); mesh.bind(new THREE.Skeleton(mapped, inverse), bind);
  visibility.forEach(([object]) => { object.visible = false; });
  return { mesh, materials: mesh.material.length, seamEdges: restored.seamCount, bones: mapped.length,
    dispose() { mesh.removeFromParent(); visibility.forEach(([object, visible]) => { object.visible = visible; });
      mesh.geometry.dispose(); mesh.material.forEach(material => material.dispose()); } };
}
