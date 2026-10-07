import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { surfaceRegionsFor, surfaceRegionWeight } from './movement-surface-regions.js';

const MODEL_URL = '/anatomy/fitness-reference.glb', METADATA_URL = '/anatomy/fitness-reference.json';
const SOURCE = 'Blender Studio Human Base Meshes';
const SLOTS = new Set(['shoulder-arm-support', 'core-coordination', 'hip-leg-swing']);

function releaseModel(model) {
  if (!model) return;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
  model.removeFromParent();
}

/** Intact mature character. Its own surface colour locates the functional
 * region; it never borrows or pretends to contain registered atlas muscles. */
export function createFitnessMovementContext({ reference, requestRender, onReady } = {}) {
  if (!reference?.add) throw new TypeError('Body context requires a reference group.');
  const group = new THREE.Group();group.name = 'movement-fitness-context';group.visible = false;
  group.userData.source = SOURCE;group.userData.geometryOwnership = 'owned';reference.add(group);
  let model = null, metadata = null, bounds = null, pending = null, disposed = false, loading = false;
  let error = null, checksumValidated = false, generation = 0, currentSlot = null, currentSide = null, currentGroup = null;
  let vertexCount = 0, triangleCount = 0, meshCount = 0, targetBounds = null, highlightedVertices = 0;
  const surfaces = [], patches = [], currentColour = new THREE.Color('#72d6ff');
  const notify = () => { if (!disposed) requestRender?.(); };

  function prepareSurface(object) {
    const role = object.userData.partRole ?? object.userData.role;
    if (role !== 'body-surface' && role !== 'clothing') return;
    const positions = object.geometry.getAttribute('position'), normals = object.geometry.getAttribute('normal');
    const worldPositions = new Float32Array(positions.count * 3), worldNormals = new Float32Array(positions.count * 3);
    const colours = new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3);
    const weights = new THREE.BufferAttribute(new Float32Array(positions.count), 1);
    const originalMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const baseColour = originalMaterials[0]?.color?.clone() ?? new THREE.Color('#e6e9eb');
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld), point = new THREE.Vector3(), normal = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).toArray(worldPositions, i * 3);
      normal.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize().toArray(worldNormals, i * 3);
      colours.setXYZ(i, baseColour.r, baseColour.g, baseColour.b);
    }
    object.geometry.setAttribute('color', colours);object.geometry.setAttribute('mviRegionWeight', weights);
    for (const material of originalMaterials) {
      material.color.set(0xffffff);material.vertexColors = true;
      material.onBeforeCompile = shader => {
        shader.uniforms.mviAccent = { value: currentColour };
        shader.vertexShader = 'attribute float mviRegionWeight; varying float vMviRegionWeight;\n' + shader.vertexShader;
        shader.fragmentShader = 'uniform vec3 mviAccent; varying float vMviRegionWeight;\n' + shader.fragmentShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMviRegionWeight = mviRegionWeight;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += mviAccent * vMviRegionWeight * 0.13;');
      };
      material.customProgramCacheKey = () => 'fitness-location-tint-v1';material.needsUpdate = true;
    }
    surfaces.push({ mesh: object, role, baseColour, worldPositions, worldNormals, colours, weights });
  }

  function load() {
    if (disposed) return Promise.resolve(false);
    if (model) return Promise.resolve(true);
    if (pending) return pending;
    const token = generation;loading = true;error = null;
    pending = (async () => {
      let created = null;
      try {
        const reads = await Promise.allSettled([fetch(METADATA_URL), fetch(MODEL_URL)]);
        if (reads.some(read => read.status !== 'fulfilled' || !read.value.ok)) throw new Error('Local fitness reference unavailable.');
        const [metadataResponse, modelResponse] = reads.map(read => read.value);
        const [nextMetadata, buffer] = await Promise.all([metadataResponse.json(), modelResponse.arrayBuffer()]);
        if (nextMetadata.source !== SOURCE || nextMetadata.sourceId !== 'GEO-body_male_realistic' ||
            nextMetadata.units !== 'meters' || nextMetadata.referencePose !== true ||
            nextMetadata.bodyRegistration !== 'independent' || nextMetadata.upAxis !== '+Y' ||
            nextMetadata.frontAxis !== '+Z') throw new Error('Invalid fitness reference provenance.');
        if (buffer.byteLength < 20 || new DataView(buffer).getUint32(0, true) !== 0x46546c67) throw new Error('Invalid fitness reference GLB.');
        let checked = false;
        if (nextMetadata.glbSha256 && globalThis.crypto?.subtle) {
          const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
          const actual = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
          if (actual !== nextMetadata.glbSha256.toLowerCase()) throw new Error('Fitness reference checksum mismatch.');
          checked = true;
        }
        created = (await new GLTFLoader().parseAsync(buffer, '/anatomy/')).scene;created.updateMatrixWorld(true);
        const nextBounds = new THREE.Box3().setFromObject(created);
        if (nextBounds.isEmpty() || nextBounds.min.y < -.05 || nextBounds.max.y < 1.6 || nextBounds.max.y > 2.2 ||
            nextBounds.getSize(new THREE.Vector3()).x > 1) throw new Error('Fitness reference coordinate mismatch.');
        if (disposed || token !== generation) { releaseModel(created);return false; }
        model = created;metadata = nextMetadata;bounds = nextBounds.clone();checksumValidated = checked;
        vertexCount = 0;triangleCount = 0;meshCount = 0;
        model.traverse(object => {
          if (!object.isMesh) return;
          meshCount++;vertexCount += object.geometry.getAttribute('position')?.count ?? 0;
          triangleCount += (object.geometry.index?.count ?? object.geometry.getAttribute('position')?.count ?? 0) / 3;
          object.userData.contextOnly = true;object.userData.geometryOwnership = 'owned';object.renderOrder = 0;prepareSurface(object);
        });
        if (!surfaces.some(surface => surface.role === 'body-surface') || !surfaces.some(surface => surface.role === 'clothing')) {
          throw new Error('Complete dressed reference unavailable.');
        }
        group.add(model);loading = false;
        try { onReady?.(); } catch { /* A callback cannot invalidate the loaded asset. */ }
        notify();return true;
      } catch (reason) {
        if (created) releaseModel(created);
        if (created === model) { model = null;metadata = null;bounds = null;surfaces.length = 0; }
        if (!disposed && token === generation) error = reason instanceof Error ? reason.message : 'Fitness reference load failed.';
        return false;
      } finally { if (token === generation) { pending = null;loading = false; } }
    })();
    return pending;
  }
  function clear() {
    group.visible = false;currentSlot = null;currentSide = null;currentGroup = null;targetBounds = null;patches.length = 0;highlightedVertices = 0;notify();
  }
  function show(slotId, targetMeshes, { groupId, partId, colour = '#72d6ff' } = {}) {
    clear();
    if (disposed || !model || !SLOTS.has(slotId) || !Array.isArray(targetMeshes) || !targetMeshes.length) return null;
    const selected = partId ? targetMeshes.filter(mesh => mesh.userData?.part?.id === partId) : targetMeshes;
    const targets = selected.length ? selected : targetMeshes;
    const sides = [...new Set(targets.map(mesh => mesh.userData?.part?.side).filter(side => side === 'left' || side === 'right'))];
    if (!sides.length) sides.push('left', 'right');
    const regions = surfaceRegionsFor(groupId, sides, bounds.max.y);if (!regions.length) return null;
    currentSlot = slotId;currentGroup = groupId;currentSide = sides.length === 1 ? sides[0] : 'both';currentColour.set(colour);
    const hsl = currentColour.getHSL({}, THREE.SRGBColorSpace);
    currentColour.setHSL(hsl.h, .88, .48, THREE.SRGBColorSpace);
    targetBounds = new THREE.Box3();
    const patchMap = new Map(sides.map(side => [side, { side, centre: new THREE.Vector3(), weight: 0, points: [] }]));
    const tint = new THREE.Color(), point = new THREE.Vector3();
    for (const surface of surfaces) {
      const { worldPositions: positions, worldNormals: normals, colours, weights, baseColour } = surface;
      for (let i = 0; i < weights.count; i++) {
        const offset = i * 3;point.fromArray(positions, offset);let weight = 0, side = null;
        for (const region of regions) {
          const value = surfaceRegionWeight(region, point, normals[offset], normals[offset + 1], normals[offset + 2]);
          if (value > weight) { weight = value;side = region.side; }
        }
        weights.setX(i, weight);tint.copy(baseColour).lerp(currentColour, Math.min(.91, weight * .94));colours.setXYZ(i, tint.r, tint.g, tint.b);
        if (weight > .24) { targetBounds.expandByPoint(point);highlightedVertices++; }
        if (weight > .44 && side) {
          const patch = patchMap.get(side);patch.centre.addScaledVector(point, weight);patch.weight += weight;
          patch.points.push({ point: point.clone(), normal: new THREE.Vector3().fromArray(normals, offset) });
        }
      }
      colours.needsUpdate = true;weights.needsUpdate = true;
    }
    for (const patch of patchMap.values()) if (patch.weight) { patch.centre.divideScalar(patch.weight);patches.push(patch); }
    if (targetBounds.isEmpty()) targetBounds = null;
    group.visible = true;notify();return bounds.clone();
  }
  function anchors(direction) {
    const result = [];
    for (const patch of patches) {
      let best = null, distance = Infinity;
      for (const candidate of patch.points) {
        if (direction && candidate.normal.dot(direction) < .18) continue;
        const score = candidate.point.distanceToSquared(patch.centre);
        if (score < distance) { best = candidate.point;distance = score; }
      }
      if (best) result.push({ side: patch.side, position: best.clone() });
    }
    return result;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;generation++;loading = false;clear();releaseModel(model);model = null;metadata = null;bounds = null;
    surfaces.length = 0;group.removeFromParent();
  }
  return { load, show, clear, dispose, anchors,
    get targetBounds() { return targetBounds?.clone() ?? null; },
    get state() { return { loaded: Boolean(model), loading, disposed, visible: group.visible && Boolean(model), meshCount,
      slotId: currentSlot, groupId: currentGroup, side: currentSide, source: SOURCE, sourceId: metadata?.sourceId ?? null,
      sourceVertices: vertexCount, sourceTriangles: triangleCount, triangleCount, checksumValidated,
      bounds: bounds ? [bounds.min.toArray(), bounds.max.toArray()] : null,
      targetBounds: targetBounds ? [targetBounds.min.toArray(), targetBounds.max.toArray()] : null, highlightedVertices,
      geometryOwnership: 'owned', referencePose: true, completeBody: true, modelUrl: MODEL_URL,
      representation: 'surface-location', bodyRegistration: 'independent', modifications: metadata?.modifications ?? [], error }; } };
}
