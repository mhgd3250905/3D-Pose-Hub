// Standalone P2 toon material reconstruction. The caller supplies the live v3
// theme, muscle and v2plus uniform groups; no original reference mesh is used.
import * as THREE from 'three';

function decodeValue(entry, ids) {
  const { type, value } = entry;
  if (type === 'null') return null;
  if (type === 'scalar') return value;
  if (type === 'array') return value.map(v => decodeValue(v, ids));
  if (type === 'color') return new THREE.Color().fromArray(value);
  const typeName = type.replace(/^_/, '');
  const classes = { Vector2: THREE.Vector2, Vector3: THREE.Vector3, Vector4: THREE.Vector4,
    Matrix3: THREE.Matrix3, Matrix4: THREE.Matrix4 };
  if (classes[typeName]) return new classes[typeName]().fromArray(value);
  if (type !== 'texture') throw new Error(`head-neck-toon-r4: unsupported uniform type ${type}`);
  const arrays = { Float32Array, Uint8Array, Uint16Array, Uint32Array };
  const ArrayType = arrays[entry.arrayType];
  if (!ArrayType) throw new Error(`head-neck-toon-r4: unsupported texture array ${entry.arrayType}`);
  const raw = atob(entry.data), bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  if (bytes.byteLength % ArrayType.BYTES_PER_ELEMENT) throw new Error('head-neck-toon-r4: malformed texture');
  const source = new ArrayType(bytes.buffer), width = entry.width, height = Math.ceil(ids.length / width);
  if (source.length < width * entry.height * 4) throw new Error('head-neck-toon-r4: undersized RGBA data');
  const remapped = new ArrayType(width * height * 4);
  for (let i = 0; i < ids.length; i++) for (let c = 0; c < 4; c++) remapped[i * 4 + c] = source[ids[i] * 4 + c];
  const texture = new THREE.DataTexture(remapped, width, height, entry.format, entry.dataType);
  texture.magFilter = entry.magFilter; texture.minFilter = entry.minFilter;
  texture.wrapS = entry.wrapS; texture.wrapT = entry.wrapT; texture.colorSpace = entry.colorSpace;
  texture.needsUpdate = true; return texture;
}

export function attachIndependentV3Toon(restored, asset, uniformGroups) {
  const mesh = restored?.mesh || restored;
  if (!mesh?.isSkinnedMesh || !Array.isArray(mesh.material) || mesh.material.length !== 2 ||
      mesh.geometry.groups.length !== 2 || asset?.version !== 1 || asset.materials?.length !== 2)
    throw new Error('head-neck-toon-r4: expected a restored two-material P2 mesh and matching asset');
  const marker = mesh.geometry.attributes._phvertexid, count = mesh.geometry.attributes.position.count;
  if (!marker || marker.count !== count) throw new Error('head-neck-toon-r4: missing source IDs');
  const ids = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    const id = marker.getX(i);
    if (!Number.isInteger(id) || id < 0 || id >= asset.sourceVertices) throw new Error(`head-neck-toon-r4: invalid source ID at ${i}`);
    ids[i] = id;
  }
  const materials = asset.materials.map((item, part) => {
    const material = new THREE.MeshToonMaterial(), decoded = {};
    Object.assign(material, item.settings);
    for (const [name, entry] of Object.entries(item.constants)) decoded[name] = { value: decodeValue(entry, ids) };
    for (const [name, group] of Object.entries(item.dynamic)) {
      if (!uniformGroups?.[group]?.[name] || !Object.hasOwn(uniformGroups[group][name], 'value'))
        throw new Error(`head-neck-toon-r4: missing live uniform ${group}.${name}`);
    }
    material.onBeforeCompile = shader => {
      shader.vertexShader = item.vertexShader; shader.fragmentShader = item.fragmentShader;
      Object.assign(shader.uniforms, decoded);
      for (const [name, group] of Object.entries(item.dynamic)) shader.uniforms[name] = uniformGroups[group][name];
    };
    material.customProgramCacheKey = () => `head-neck-toon-r4-${part}`;
    return material;
  });
  mesh.material = materials;
  return { mesh, materials: materials.length, vertices: count, sourceVertices: asset.sourceVertices };
}
