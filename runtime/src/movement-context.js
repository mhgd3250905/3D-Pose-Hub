import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = '/anatomy/muscle-reference.glb';
const METADATA_URL = '/anatomy/muscle-reference.json';
const SLOT_ALIASES = { shoulders: 'shoulder-arm-support', scapular: 'shoulder-arm-support', arms: 'shoulder-arm-support',
  support: 'shoulder-arm-support', core: 'core-coordination', hipFlexors: 'hip-leg-swing', glutes: 'hip-leg-swing',
  adductors: 'hip-leg-swing', hips: 'hip-leg-swing' };
const SLOTS = new Set(['shoulder-arm-support', 'core-coordination', 'hip-leg-swing']);

// This independently loaded reference owns its resources. It does not borrow
// Skin or eye buffers from the main atlas, or geometry from Snow. Its body and
// the muscle overlay use the original atlas's metre/Y-up coordinates.
function releaseModel(model) {
  if (!model) return;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
  model.removeFromParent();
}

/** An intact, modestly dressed same-source body reference. Changing the muscle
 * selection never crops the head, limbs, or body. Only the inspector camera
 * changes its framing; its miniature uses this same complete 3D scene. */
export function createMovementContext({ reference, requestRender, onReady } = {}) {
  if (!reference?.add) throw new TypeError('Body context requires a reference group.');
  const group = new THREE.Group();group.name = 'movement-body-context';group.visible = false;
  group.userData.source = 'BodyParts3D';group.userData.geometryOwnership = 'owned';reference.add(group);
  let model = null, metadata = null, bounds = null, pending = null, disposed = false, loading = false;
  let error = null, checksumValidated = false, generation = 0, currentSlot = null, currentSide = null;
  let vertexCount = 0, triangleCount = 0, meshCount = 0;
  const notify = () => { if (!disposed) requestRender?.(); };

  function load() {
    if (disposed) return Promise.resolve(false);
    if (model) return Promise.resolve(true);
    if (pending) return pending;
    const token = generation;loading = true;error = null;
    pending = (async () => {
      let created = null;
      try {
        const reads = await Promise.allSettled([fetch(METADATA_URL), fetch(MODEL_URL)]);
        if (reads.some(read => read.status !== 'fulfilled' || !read.value.ok)) throw new Error('Local body reference unavailable.');
        const [metadataResponse, modelResponse] = reads.map(read => read.value);
        const [nextMetadata, buffer] = await Promise.all([metadataResponse.json(), modelResponse.arrayBuffer()]);
        if (nextMetadata.source !== 'BodyParts3D' || nextMetadata.sourceId !== 'FJ2810' ||
            nextMetadata.units !== 'meters' || nextMetadata.referencePose !== true) throw new Error('Invalid body reference provenance.');
        if (buffer.byteLength < 20 || new DataView(buffer).getUint32(0, true) !== 0x46546c67) throw new Error('Invalid body reference GLB.');
        let checked = false;
        if (nextMetadata.glbSha256 && globalThis.crypto?.subtle) {
          const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
          const actual = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
          if (actual !== nextMetadata.glbSha256.toLowerCase()) throw new Error('Body reference checksum mismatch.');
          checked = true;
        }
        const gltf = await new GLTFLoader().parseAsync(buffer, '/anatomy/');created = gltf.scene;
        created.updateMatrixWorld(true);
        const nextBounds = new THREE.Box3().setFromObject(created);
        if (nextBounds.isEmpty() || nextBounds.min.y < -.05 || nextBounds.max.y < 1.6 || nextBounds.max.y > 2.2 ||
            nextBounds.getSize(new THREE.Vector3()).x > 1) throw new Error('Body reference coordinate mismatch.');
        if (disposed || token !== generation) { releaseModel(created);return false; }
        model = created;metadata = nextMetadata;bounds = nextBounds.clone();checksumValidated = checked;
        vertexCount = 0;triangleCount = 0;meshCount = 0;
        model.traverse(object => {
          if (!object.isMesh) return;
          meshCount++;vertexCount += object.geometry.getAttribute('position')?.count ?? 0;
          triangleCount += (object.geometry.index?.count ?? object.geometry.getAttribute('position')?.count ?? 0) / 3;
          object.userData.contextOnly = true;object.userData.geometryOwnership = 'owned';object.raycast = () => {};
          object.renderOrder = 0;
          if (object.userData.partRole === 'body-surface') {
            // The teaching reference has a deliberately plain mannequin face.
            // Calm its small scan/cap shading creases without moving vertices
            // or changing the shoulder, torso, or muscle reference geometry.
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
              material.onBeforeCompile = shader => {
                const faceVaryings = 'varying float vPlainFace; varying vec3 vPlainFaceNormal;\n';
                shader.vertexShader = faceVaryings + shader.vertexShader;
                shader.fragmentShader = faceVaryings + shader.fragmentShader;
                shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
                  #include <beginnormal_vertex>
                  float plainFace = smoothstep(1.485, 1.53, position.y)
                    * (1.0 - smoothstep(1.67, 1.71, position.y))
                    * smoothstep(0.006, 0.035, position.z)
                    * (1.0 - smoothstep(0.055, 0.085, abs(position.x)));
                  vec3 plainFaceNormal = normalize(vec3(position.x / 0.005625,
                    (position.y - 1.60) / 0.0144, max(position.z + 0.02, 0.01) / 0.005625));
                  vPlainFace = plainFace;
                  vPlainFaceNormal = normalize(normalMatrix * plainFaceNormal);
                `);
                shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', `
                  #include <normal_fragment_begin>
                  normal = normalize(mix(normal, vPlainFaceNormal, vPlainFace));
                `);
              };
              material.customProgramCacheKey = () => 'movement-plain-face-v2';
            }
          }
        });
        group.add(model);loading = false;
        try { onReady?.(); } catch { /* Keep the successfully loaded body available. */ }
        notify();return true;
      } catch (reason) {
        if (created && created !== model) releaseModel(created);
        if (!disposed && token === generation) error = reason instanceof Error ? reason.message : 'Body reference load failed.';
        return false;
      } finally {
        if (token === generation) { pending = null;loading = false; }
      }
    })();
    return pending;
  }
  function clear() {
    group.visible = false;currentSlot = null;currentSide = null;notify();
  }
  function show(slotId, targetMeshes) {
    clear();
    const slot = SLOT_ALIASES[slotId] ?? slotId;
    if (disposed || !model || !SLOTS.has(slot) || !Array.isArray(targetMeshes) || !targetMeshes.length) return null;
    const sides = new Set(targetMeshes.map(mesh => mesh.userData?.part?.side).filter(side => side === 'left' || side === 'right'));
    currentSlot = slot;currentSide = sides.size === 1 ? [...sides][0] : 'both';group.visible = true;notify();return bounds.clone();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;generation++;loading = false;clear();releaseModel(model);model = null;metadata = null;bounds = null;group.removeFromParent();
  }
  return { load, show, clear, dispose,
    get state() { return { loaded: Boolean(model), loading, disposed, visible: group.visible && Boolean(model), meshCount,
      slotId: currentSlot, side: currentSide, source: 'BodyParts3D', sourceId: metadata?.sourceId ?? null,
      sourceCommit: metadata?.sourceCommit ?? null, sourceVertices: vertexCount, sourceTriangles: triangleCount,
      triangleCount, checksumValidated, bounds: bounds ? [bounds.min.toArray(), bounds.max.toArray()] : null,
      geometryOwnership: 'owned', referencePose: true, completeBody: true, modelUrl: MODEL_URL,
      modifications: metadata?.modifications ?? metadata?.adaptations ?? [], error }; } };
}
