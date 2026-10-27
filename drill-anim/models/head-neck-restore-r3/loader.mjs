// Restore only the P2 head/neck seam after a two-material GLB import.
// The two primitives retain their materials and original bone objects.
import * as THREE from 'three';

export function restoreHeadNeck(root, { seamCount = 162 } = {}) {
  const group = root.getObjectByName('V3_Head_Neck_Topological_R1');
  const parts = [];
  group?.traverse(o => { if (o.isSkinnedMesh && o.visible) parts.push(o); });
  if (parts.length !== 2) throw new Error(`head-neck-restore-r3: expected two visible material primitives, got ${parts.length}`);
  if (parts[0].parent !== parts[1].parent || parts.some(o => Array.isArray(o.material)))
    throw new Error('head-neck-restore-r3: unsupported primitive hierarchy or material');
  root.updateMatrixWorld(true); parts.forEach(o => o.skeleton.update());
  const closeMatrix = (a, b) => a.elements.every((x, i) => Math.abs(x - b.elements[i]) <= 1e-6);
  if (!closeMatrix(parts[0].matrixWorld, parts[1].matrixWorld) || !closeMatrix(parts[0].bindMatrix, parts[1].bindMatrix))
    throw new Error('head-neck-restore-r3: primitive bind spaces differ');
  const sk0 = parts[0].skeleton, sk1 = parts[1].skeleton;
  if (sk0.bones.length !== sk1.bones.length || sk0.bones.some((bone, i) =>
    bone !== sk1.bones[i] || !closeMatrix(sk0.boneInverses[i], sk1.boneInverses[i])))
    throw new Error('head-neck-restore-r3: primitive skeletons differ');
  const attributes = parts.map(o => o.geometry.attributes), markers = attributes.map(a => a._phvertexid);
  if (markers.some(m => !m) || parts.some(o => !o.geometry.index))
    throw new Error('head-neck-restore-r3: missing source IDs or indexed triangles');
  const names = Object.keys(attributes[0]).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(attributes[1]).sort()) || names.some(n =>
    attributes[0][n].itemSize !== attributes[1][n].itemSize))
    throw new Error('head-neck-restore-r3: primitive attributes differ');
  const used = parts.map(o => [...new Set(o.geometry.index.array)]);
  const seams = used.map((ids, p) => {
    const map = new Map();
    for (const id of ids) {
      const marker = markers[p].getX(id);
      if (!Number.isInteger(marker) || marker < 0) throw new Error('head-neck-restore-r3: invalid source ID');
      if (marker < seamCount) {
        if (map.has(marker)) throw new Error(`head-neck-restore-r3: duplicate seam ID ${marker} within one primitive`);
        map.set(marker, id);
      }
    }
    return map;
  });
  if (seams.some(map => map.size !== seamCount)) throw new Error('head-neck-restore-r3: incomplete seam');
  for (let id = 0; id < seamCount; id++) {
    const i = seams[0].get(id), j = seams[1].get(id);
    for (const name of names) {
      const a = attributes[0][name], b = attributes[1][name];
      for (let c = 0; c < a.itemSize; c++) {
        if (Math.abs(a.getComponent(i, c) - b.getComponent(j, c)) > 1e-5)
          throw new Error(`head-neck-restore-r3: seam attribute mismatch ${name} at ${id}`);
      }
    }
  }
  // The first 162 vertices are the shared seam; all non-seam primitive
  // vertices are retained independently, including intentional UV/normal splits.
  const source = [], maps = [new Map(), new Map()], reverse = [[], []];
  for (let id = 0; id < seamCount; id++) {
    source.push([0, seams[0].get(id)]);
    for (let p = 0; p < 2; p++) { maps[p].set(seams[p].get(id), id); reverse[p][id] = seams[p].get(id); }
  }
  for (let p = 0; p < 2; p++) for (const id of used[p]) {
    if (maps[p].has(id)) continue;
    const target = source.length; source.push([p, id]); maps[p].set(id, target); reverse[p][target] = id;
  }
  const geometry = new THREE.BufferGeometry();
  for (const name of names) {
    const size = attributes[0][name].itemSize, buffer = name === 'skinIndex'
      ? new Uint16Array(source.length * size) : new Float32Array(source.length * size);
    source.forEach(([p, id], i) => { for (let c = 0; c < size; c++) buffer[i * size + c] = attributes[p][name].getComponent(id, c); });
    geometry.setAttribute(name, new THREE.BufferAttribute(buffer, size));
  }
  const originalIndices = parts.map(o => o.geometry.index.array);
  const index = new Uint32Array(originalIndices[0].length + originalIndices[1].length);
  let offset = 0;
  originalIndices.forEach((list, p) => {
    for (const id of list) index[offset++] = maps[p].get(id);
  });
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.addGroup(0, originalIndices[0].length, 0);
  geometry.addGroup(originalIndices[0].length, originalIndices[1].length, 1);
  // If the caller installs a gl_VertexID-based material, its source texture is
  // indexed in each primitive's old vertex space. Remap those data textures.
  const materials = parts.map((part, p) => {
    const original = part.material, material = original.clone(), compile = original.onBeforeCompile;
    material.onBeforeCompile = function(shader, renderer) {
      compile.call(this, shader, renderer);
      for (const name of ['uVT', 'uVR', 'uMMT', 'uV2pT', 'uNeckSeamSkin']) {
        const uniform = shader.uniforms[name], texture = uniform?.value;
        if (!texture?.image?.data) continue;
        const width = texture.image.width, height = Math.ceil(source.length / width), input = texture.image.data;
        if (input.length < texture.image.width * texture.image.height * 4) throw new Error(`head-neck-restore-r3: non-RGBA ${name}`);
        const output = new input.constructor(width * height * 4);
        reverse[p].forEach((old, current) => {
          if (old !== undefined) for (let c = 0; c < 4; c++) output[current * 4 + c] = input[old * 4 + c];
        });
        const replacement = new THREE.DataTexture(output, width, height, texture.format, texture.type);
        replacement.magFilter = texture.magFilter; replacement.minFilter = texture.minFilter;
        replacement.wrapS = texture.wrapS; replacement.wrapT = texture.wrapT; replacement.colorSpace = texture.colorSpace;
        replacement.needsUpdate = true; uniform.value = replacement;
      }
    };
    material.customProgramCacheKey = () => `${original.customProgramCacheKey()}-head-neck-restore-r3-${p}`;
    return material;
  });
  // Verify that every logical seam edge is an actual shared two-face edge.
  const edges = new Map();
  for (let i = 0; i < index.length; i += 3) for (const [a, b] of [[index[i], index[i + 1]], [index[i + 1], index[i + 2]], [index[i + 2], index[i]]]) {
    if (a >= seamCount || b >= seamCount) continue;
    const key = `${Math.min(a, b)},${Math.max(a, b)}`, list = edges.get(key) || [];
    list.push([a, b]); edges.set(key, list);
  }
  for (let i = 0; i < seamCount; i++) {
    const j = (i + 1) % seamCount, pair = edges.get(`${Math.min(i, j)},${Math.max(i, j)}`) || [];
    if (pair.length !== 2 || pair[0][0] !== pair[1][1] || pair[0][1] !== pair[1][0])
      throw new Error(`head-neck-restore-r3: seam edge ${i} is not oriented manifold`);
  }
  const merged = new THREE.SkinnedMesh(geometry, materials), parent = parts[0].parent;
  merged.name = 'V3_Head_Neck_Restored_R1'; merged.frustumCulled = false;
  merged.position.copy(parts[0].position); merged.quaternion.copy(parts[0].quaternion); merged.scale.copy(parts[0].scale);
  parent.add(merged); merged.updateMatrixWorld(true); merged.bind(sk0, parts[0].bindMatrix);
  parts.forEach(o => { o.visible = false; });
  return { mesh: merged, parts, localToMerged: maps, seamCount, materials: materials.length };
}
