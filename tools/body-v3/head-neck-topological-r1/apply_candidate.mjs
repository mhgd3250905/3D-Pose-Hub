// Experimental single-mesh weld. Apply after the P2 r4 paired-seam candidate.
// The two source meshes remain in memory hidden; no source assets are changed.
export async function applyTopologicalWeld(page, topology) {
  return page.evaluate(data => {
    const T = window.__toonT, v = flareInspector.viewer;
    const neck = v.coach.getObjectByName('Mesh001');
    const head = v.coach.getObjectByName('Toon_Mannequin_Head_v5');
    if (!neck?.isSkinnedMesh || !head?.isSkinnedMesh || !head.userData.neckWeldR4 || neck.skeleton !== head.skeleton)
      throw new Error('head-neck-topological-r1: apply P2 r4 on one skeleton first');
    if (v.coach.getObjectByName('V3_Head_Neck_Topological_R1')) throw new Error('head-neck-topological-r1: already applied');
    const ng = neck.geometry, hg = head.geometry;
    if (ng.attributes.position.count !== data.originalNeckVertexCount || hg.attributes.position.count !== data.originalHeadVertexCount)
      throw new Error('head-neck-topological-r1: input vertex counts changed');
    const count = data.neckSource.length;
    if (data.headSource.length !== count || !data.seamCount || data.seamEdgesWithTwoFaces !== data.seamCount)
      throw new Error('head-neck-topological-r1: invalid topology manifest');
    v.motion.reset(); v.coach.updateMatrixWorld(true); neck.skeleton.update();
    const a = new T.Vector3(), b = new T.Vector3();
    for (let i = 0; i < data.seamCount; i++) {
      const ni = data.neckSource[i], hi = data.headSource[i];
      neck.getVertexPosition(ni, a); a.applyMatrix4(neck.matrixWorld);
      head.getVertexPosition(hi, b); b.applyMatrix4(head.matrixWorld);
      if (a.distanceTo(b) > 1e-5) throw new Error(`head-neck-topological-r1: seam mismatch at ${i}`);
      const weights = (g, id) => {
        const out = new Map();
        for (let k = 0; k < 4; k++) {
          const j = g.attributes.skinIndex.getComponent(id, k), w = g.attributes.skinWeight.getComponent(id, k);
          out.set(j, (out.get(j) || 0) + w);
        }
        return out;
      };
      const nw = weights(ng, ni), hw = weights(hg, hi);
      for (const j of new Set([...nw.keys(), ...hw.keys()]))
        if (Math.abs((nw.get(j) || 0) - (hw.get(j) || 0)) > 1e-5)
          throw new Error(`head-neck-topological-r1: seam weights differ at ${i}`);
    }
    const geometry = new T.BufferGeometry(), names = new Set([...Object.keys(ng.attributes), ...Object.keys(hg.attributes)]);
    for (const name of names) {
      const na = ng.attributes[name], ha = hg.attributes[name], template = na || ha;
      if (na && ha && na.itemSize !== ha.itemSize) throw new Error(`head-neck-topological-r1: incompatible attribute ${name}`);
      const size = template.itemSize, array = name === 'skinIndex' ? new Uint16Array(count * size) : new Float32Array(count * size);
      for (let i = 0; i < count; i++) {
        const fromNeck = data.neckSource[i] >= 0, source = fromNeck ? na : ha, id = fromNeck ? data.neckSource[i] : data.headSource[i];
        if (!source) continue;
        for (let c = 0; c < size; c++) array[i * size + c] = source.getComponent(id, c);
      }
      geometry.setAttribute(name, new T.BufferAttribute(array, size));
    }
    const indices = new Uint32Array(data.neckIndices.length + data.headIndices.length);
    indices.set(data.neckIndices); indices.set(data.headIndices, data.neckIndices.length);
    geometry.setIndex(new T.BufferAttribute(indices, 1));
    geometry.addGroup(0, data.neckIndices.length, 0);
    geometry.addGroup(data.neckIndices.length, data.headIndices.length, 1);
    const remapMaterial = (original, mapping, label) => {
      const material = original.clone(), compile = original.onBeforeCompile;
      material.onBeforeCompile = function(shader, renderer) {
        compile.call(this, shader, renderer);
        for (const name of ['uVT', 'uVR', 'uMMT', 'uV2pT', 'uNeckSeamSkin']) {
          const uniform = shader.uniforms[name], source = uniform?.value;
          if (!source?.image?.data) continue;
          const width = source.image.width, height = Math.ceil(count / width), old = source.image.data;
          if (old.length < source.image.width * source.image.height * 4) throw new Error(`head-neck-topological-r1: non-RGBA ${name}`);
          const dest = new old.constructor(width * height * 4);
          for (let i = 0; i < count; i++) {
            const originalIndex = mapping[i];
            if (originalIndex >= 0 && originalIndex * 4 + 3 < old.length)
              for (let c = 0; c < 4; c++) dest[i * 4 + c] = old[originalIndex * 4 + c];
          }
          const texture = new T.DataTexture(dest, width, height, source.format, source.type);
          texture.magFilter = source.magFilter; texture.minFilter = source.minFilter;
          texture.wrapS = source.wrapS; texture.wrapT = source.wrapT; texture.colorSpace = source.colorSpace;
          texture.needsUpdate = true; uniform.value = texture;
        }
      };
      material.customProgramCacheKey = () => `${original.customProgramCacheKey()}-head-neck-topological-r1-${label}`;
      return material;
    };
    const materials = [remapMaterial(neck.material, data.neckSource, 'neck'), remapMaterial(head.material, data.headSource, 'head')];
    const mesh = new T.SkinnedMesh(geometry, materials);
    mesh.name = 'V3_Head_Neck_Topological_R1'; mesh.frustumCulled = false;
    mesh.castShadow = false; mesh.receiveShadow = false;
    head.parent.add(mesh); mesh.position.copy(head.position); mesh.quaternion.copy(head.quaternion); mesh.scale.copy(head.scale);
    mesh.updateMatrixWorld(true); mesh.bind(head.skeleton, head.bindMatrix);
    neck.visible = false; head.visible = false;
    return { vertices: count, neckFaces: data.neckIndices.length / 3, headFaces: data.headIndices.length / 3,
      weldedEdges: data.seamEdgesWithTwoFaces, materials: materials.length };
  }, topology);
}
