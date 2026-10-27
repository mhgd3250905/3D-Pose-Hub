// Experimental P2 bridge r4. Call only after the normal v3 loader has selected a
// reset profile. This changes in-memory geometry only; original assets remain
// untouched. The candidate still requires posed and visual acceptance.
export async function applyNeckWeld(page, topology) {
  return page.evaluate(data => {
    const T = window.__toonT, v = flareInspector.viewer;
    const neck = v.coach.getObjectByName('Mesh001');
    const head = v.coach.getObjectByName('Toon_Mannequin_Head_v5');
    if (!neck?.isSkinnedMesh || !head?.isSkinnedMesh || neck.skeleton !== head.skeleton)
      throw new Error('neck-weld-r1: expected original head and neck on one skeleton');
    const ng = neck.geometry, hg = head.geometry;
    if (ng.attributes.position.count !== data.neckVertexCount || hg.attributes.position.count !== data.headVertexCount ||
        ng.index.count !== data.neckOriginalIndexCount || hg.index.count !== data.headOriginalIndexCount)
      throw new Error('neck-weld-r1: topology does not match captured source');
    const matrixError = (a, b) => Math.max(...a.elements.map((x, i) => Math.abs(x - b.elements[i])));
    neck.updateMatrixWorld(true); head.updateMatrixWorld(true);
    if (matrixError(neck.matrixWorld, head.matrixWorld) > 1e-6 || matrixError(neck.bindMatrix, head.bindMatrix) > 1e-6)
      throw new Error('neck-weld-r1: head and neck bind spaces differ');
    if (head.userData.neckWeldR1 || head.userData.neckWeldR2 || head.userData.neckWeldR3 || head.userData.neckWeldR4)
      throw new Error('neck-weld-r4: already applied');
    v.motion.reset(); v.coach.updateMatrixWorld(true); head.skeleton.update();
    let nidx = ng.attributes.skinIndex, nw = ng.attributes.skinWeight;
    const hidx = hg.attributes.skinIndex, hw = hg.attributes.skinWeight;
    const hp = hg.attributes.position, hn = hg.attributes.normal;
    const indices = new Uint16Array(hp.count * 4), weights = new Float32Array(hp.count * 4);
    for (let i = 0; i < hp.count; i++) for (let k = 0; k < 4; k++) {
      indices[i * 4 + k] = hidx.getComponent(i, k); weights[i * 4 + k] = hw.getComponent(i, k);
    }
    const boneMatrices = head.skeleton.boneMatrices;
    const skinMatrix = (mesh, js, ws) => {
      const sum = new T.Matrix4(), bone = new T.Matrix4(); sum.elements.fill(0);
      for (let k = 0; k < 4; k++) {
        if (!ws[k]) continue;
        bone.fromArray(boneMatrices, js[k] * 16);
        for (let j = 0; j < 16; j++) sum.elements[j] += bone.elements[j] * ws[k];
      }
      return new T.Matrix4().copy(mesh.matrixWorld).multiply(mesh.bindMatrixInverse).multiply(sum).multiply(mesh.bindMatrix);
    };
    const normalMatrix = new T.Matrix3(), world = new T.Vector3(), normal = new T.Vector3(), rest = [];
    // The cut ring inherits the original neck skin's strongly varying weights.
    // Fade those weights to the same neck-bone influence across 25 mm below
    // the ring so the bridge does not twist between mismatched bone frames.
    // Re-solve each rest-space vertex and normal after changing its weights.
    const neckBone = neck.skeleton.bones.findIndex(b => b.name === 'neck');
    if (neckBone < 0) throw new Error('neck-weld-r2: neck bone missing');
    const oldPos = ng.attributes.position, oldNormal = ng.attributes.normal, nCount = oldPos.count;
    const np = new Float32Array(nCount * 3), nn = new Float32Array(nCount * 3);
    const nj = new Uint16Array(nCount * 4), nweight = new Float32Array(nCount * 4);
    for (let i = 0; i < nCount; i++) {
      for (let c = 0; c < 3; c++) { np[i * 3 + c] = oldPos.getComponent(i, c); nn[i * 3 + c] = oldNormal.getComponent(i, c); }
      for (let c = 0; c < 4; c++) { nj[i * 4 + c] = nidx.getComponent(i, c); nweight[i * 4 + c] = nw.getComponent(i, c); }
    }
    let ringMinY = Infinity;
    for (const id of data.neckRing) { neck.getVertexPosition(id, world); world.applyMatrix4(neck.matrixWorld); ringMinY = Math.min(ringMinY, world.y); }
    let neckAdjusted = 0;
    for (let i = 0; i < nCount; i++) {
      const oldJs = Array.from(nj.slice(i * 4, i * 4 + 4));
      const oldWs = Array.from(nweight.slice(i * 4, i * 4 + 4));
      const oldMatrix = skinMatrix(neck, oldJs, oldWs);
      world.fromBufferAttribute(oldPos, i).applyMatrix4(oldMatrix);
      if (world.y <= ringMinY - data.transitionM || world.y >= data.cutY + .01) continue;
      const t = Math.max(0, Math.min(1, (world.y - (ringMinY - data.transitionM)) / data.transitionM));
      const blend = t * t * (3 - 2 * t), influences = new Map();
      for (let k = 0; k < 4; k++) influences.set(oldJs[k], (influences.get(oldJs[k]) || 0) + oldWs[k] * (1 - blend));
      influences.set(neckBone, (influences.get(neckBone) || 0) + blend);
      const sorted = [...influences].filter(([, w]) => w > 1e-8).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = sorted.reduce((a, item) => a + item[1], 0);
      const js = [0, 0, 0, 0], ws = [0, 0, 0, 0];
      sorted.forEach(([j, w], k) => { js[k] = j; ws[k] = w / total; });
      normal.fromBufferAttribute(oldNormal, i).applyMatrix3(normalMatrix.getNormalMatrix(oldMatrix)).normalize();
      const next = skinMatrix(neck, js, ws), local = world.clone().applyMatrix4(next.clone().invert());
      const localNormal = normal.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(next).transpose()).normalize();
      np.set([local.x, local.y, local.z], i * 3); nn.set([localNormal.x, localNormal.y, localNormal.z], i * 3);
      nj.set(js, i * 4); nweight.set(ws, i * 4); neckAdjusted++;
    }
    ng.setAttribute('position', new T.BufferAttribute(np, 3));
    ng.setAttribute('normal', new T.BufferAttribute(nn, 3));
    ng.setAttribute('skinIndex', new T.Uint16BufferAttribute(nj, 4));
    ng.setAttribute('skinWeight', new T.BufferAttribute(nweight, 4));
    nidx = ng.attributes.skinIndex; nw = ng.attributes.skinWeight;
    for (const id of data.neckRing) {
      neck.getVertexPosition(id, world); world.applyMatrix4(neck.matrixWorld);
      rest.push({ id, point: world.clone() });
    }
    let minY = Infinity;
    for (const id of data.headRing) { head.getVertexPosition(id, world); world.applyMatrix4(head.matrixWorld); minY = Math.min(minY, world.y); }
    let adjusted = 0;
    for (let i = 0; i < hp.count; i++) {
      const oldJs = Array.from(indices.slice(i * 4, i * 4 + 4));
      const oldWs = Array.from(weights.slice(i * 4, i * 4 + 4));
      const oldMatrix = skinMatrix(head, oldJs, oldWs);
      world.fromBufferAttribute(hp, i).applyMatrix4(oldMatrix);
      if (world.y >= minY + data.transitionM) continue;
      const s0 = Math.max(0, Math.min(1, (world.y - minY) / data.transitionM));
      const s = s0 * s0 * (3 - 2 * s0);
      let best = rest[0], distance = Infinity;
      for (const candidate of rest) {
        const d = (world.x - candidate.point.x) ** 2 + (world.z - candidate.point.z) ** 2;
        if (d < distance) { distance = d; best = candidate; }
      }
      const merged = new Map();
      for (let k = 0; k < 4; k++) {
        const j = nidx.getComponent(best.id, k), w = nw.getComponent(best.id, k) * (1 - s);
        merged.set(j, (merged.get(j) || 0) + w);
        merged.set(oldJs[k], (merged.get(oldJs[k]) || 0) + oldWs[k] * s);
      }
      const sorted = [...merged].filter(([, w]) => w > 1e-8).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = sorted.reduce((a, item) => a + item[1], 0);
      const js = [0, 0, 0, 0], ws = [0, 0, 0, 0];
      sorted.forEach(([j, w], k) => { js[k] = j; ws[k] = w / total; });
      // Preserve the original rest position and rest normal when changing the
      // skin weights: solve back into the new weighted bind space.
      normal.fromBufferAttribute(hn, i).applyMatrix3(normalMatrix.getNormalMatrix(oldMatrix)).normalize();
      const next = skinMatrix(head, js, ws), inverse = next.clone().invert();
      const local = world.clone().applyMatrix4(inverse);
      const localNormal = normal.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(next).transpose()).normalize();
      hp.setXYZ(i, local.x, local.y, local.z); hn.setXYZ(i, localNormal.x, localNormal.y, localNormal.z);
      indices.set(js, i * 4); weights.set(ws, i * 4); adjusted++;
    }
    const originalCount = hp.count, count = originalCount + data.neckRing.length;
    const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3);
    const ji = new Uint16Array(count * 4), jw = new Float32Array(count * 4);
    ji.set(indices); jw.set(weights);
    for (let i = 0; i < originalCount; i++) for (let c = 0; c < 3; c++) {
      pos[i * 3 + c] = hp.getComponent(i, c); nor[i * 3 + c] = hn.getComponent(i, c);
    }
    const copyNeck = (id, out) => {
      for (let c = 0; c < 3; c++) {
        pos[out * 3 + c] = ng.attributes.position.getComponent(id, c);
        nor[out * 3 + c] = ng.attributes.normal.getComponent(id, c);
      }
      for (let c = 0; c < 4; c++) {
        ji[out * 4 + c] = ng.attributes.skinIndex.getComponent(id, c);
        jw[out * 4 + c] = ng.attributes.skinWeight.getComponent(id, c);
      }
    };
    data.neckRing.forEach((id, i) => copyNeck(id, originalCount + i));
    const combined = new Uint32Array(hg.index.count + data.bridgeIndex.length);
    combined.set(hg.index.array);
    data.bridgeIndex.forEach((id, i) => {
      combined[hg.index.count + i] = id < data.neckRing.length
        ? originalCount + id : data.headRing[id - data.neckRing.length];
    });
    ng.setIndex(new T.BufferAttribute(new ng.index.array.constructor(data.neckKeepIndex), 1));
    hg.setAttribute('position', new T.BufferAttribute(pos, 3));
    hg.setAttribute('normal', new T.BufferAttribute(nor, 3));
    hg.setAttribute('skinIndex', new T.Uint16BufferAttribute(ji, 4));
    hg.setAttribute('skinWeight', new T.BufferAttribute(jw, 4));
    hg.setIndex(new T.BufferAttribute(combined, 1));
    const originalMaterial = head.material, material = originalMaterial.clone();
    const originalCompile = originalMaterial.onBeforeCompile;
    material.onBeforeCompile = function(shader, renderer) {
      originalCompile.call(this, shader, renderer);
      const original = shader.uniforms.uVT.value, width = original.image.width;
      const height = Math.ceil(count / width), texels = new Float32Array(width * height * 4);
      texels.set(original.image.data.subarray(0, originalCount * 4));
      for (let i = originalCount; i < count; i++) texels[i * 4] = 1;
      const tone = new T.DataTexture(texels, width, height, T.RGBAFormat, T.FloatType);
      tone.magFilter = tone.minFilter = T.NearestFilter; tone.needsUpdate = true;
      shader.uniforms.uVT = { value: tone };
    };
    material.customProgramCacheKey = () => `${originalMaterial.customProgramCacheKey()}-neck-weld-r4`;
    head.material = material;
    // Head uses skin-only shading (uCollar=0), while Mesh001 uses its
    // collar-dependent garment/skin shader. Fade the neck side to the same
    // skin colour and highlight gate over a 25 mm band around the weld.
    const bandSize = data.transitionM, bandWidth = 1024, bandHeight = Math.ceil(nCount / bandWidth);
    const bandData = new Float32Array(bandWidth * bandHeight * 4), tmpPoint = new T.Vector3();
    let painted = 0;
    for (let i = 0; i < nCount; i++) {
      neck.getVertexPosition(i, tmpPoint); tmpPoint.applyMatrix4(neck.matrixWorld);
      if (tmpPoint.y < ringMinY - bandSize || tmpPoint.y > data.cutY + .004) continue;
      let distance = bandSize;
      for (const sample of rest) distance = Math.min(distance, tmpPoint.distanceTo(sample.point));
      const t = Math.max(0, Math.min(1, distance / bandSize));
      const strength = 1 - t * t * (3 - 2 * t);
      if (strength > 0) { bandData[i * 4] = strength; painted++; }
    }
    const band = new T.DataTexture(bandData, bandWidth, bandHeight, T.RGBAFormat, T.FloatType);
    band.magFilter = band.minFilter = T.NearestFilter; band.needsUpdate = true;
    const oldNeckMaterial = neck.material, neckMaterial = oldNeckMaterial.clone(), oldNeckCompile = oldNeckMaterial.onBeforeCompile;
    neckMaterial.onBeforeCompile = function(shader, renderer) {
      oldNeckCompile.call(this, shader, renderer);
      shader.uniforms.uNeckSeamSkin = { value: band };
      shader.vertexShader = 'uniform sampler2D uNeckSeamSkin; varying float vNeckSeamSkin;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n vNeckSeamSkin=texelFetch(uNeckSeamSkin,ivec2(gl_VertexID%1024,gl_VertexID/1024),0).r;');
      shader.fragmentShader = 'varying float vNeckSeamSkin;\n' + shader.fragmentShader;
      const colourPoint = 'vec3 alb=vec3(0.0),shc=vec3(0.0),rimc=vec3(0.0);';
      if (!shader.fragmentShader.includes(colourPoint)) throw new Error('neck-weld-r4: unknown colour shader');
      shader.fragmentShader = shader.fragmentShader.replace(colourPoint,
        'W4=mix(W4,vec4(1.0,0.0,0.0,0.0),vNeckSeamSkin);\n' + colourPoint);
      const highlightPoint = 'd*=1.0-uSkipBottomHL*clamp(W4.b,0.0,1.0);';
      if (shader.fragmentShader.includes(highlightPoint)) shader.fragmentShader = shader.fragmentShader.replace(highlightPoint,
        highlightPoint + '\n d*=1.0-vNeckSeamSkin;');
    };
    neckMaterial.customProgramCacheKey = () => `${oldNeckMaterial.customProgramCacheKey()}-neck-weld-r4`;
    neck.material = neckMaterial;
    head.userData.neckWeldR4 = true;
    return { neckRing: data.neckRing.length, headRing: data.headRing.length,
      bridgeFaces: data.bridgeIndex.length / 3, headAdjusted: adjusted, neckAdjusted, painted };
  }, topology);
}
