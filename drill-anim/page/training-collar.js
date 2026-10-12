// Optional collar deformation profile for the existing Flare training human.
// Reuses its native shirt and skin: no vertex positions, topology, UVs, normals,
// rig pivots or posed joint targets are replaced. The profile is opt-in.
(function () {
  let cache = null, active = false;
  const smooth = (v, a, b) => { const u = Math.min(1, Math.max(0, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
  const report = enabled => ({ enabled, profileId: enabled ? 'training-human-v2' : 'legacy-v7', restSource: 'CPU-skinned world positions after neutral reset', meshes: cache?.report || [] });

  function prepare() {
    const v = flareInspector.viewer, T = __toonT, meshes = [], materials = new Map(), rows = [];
    v.motion.reset(); window.__setRelax(0, 0); v.coach.updateMatrixWorld(true);
    v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
    v.coach.traverse(mesh => {
      if (!mesh.isSkinnedMesh || !['Mesh005', 'Mesh005_1', 'Mesh001', 'Coach_Body'].includes(mesh.name)) return;
      const g = mesh.geometry, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
      const count = g.attributes.position.count, p = new T.Vector3();
      // Quantized GLB attributes can share an interleaved backing buffer with
      // positions/normals. Cache the four logical components, never .array:
      // copying a deinterleaved clone into that backing array corrupts the mesh.
      const joints = new Float64Array(count * 4), weights = new Float64Array(count * 4);
      for (let i = 0; i < count; i++) for (let k = 0; k < 4; k++) {
        joints[i * 4 + k] = J.getComponent(i, k); weights[i * 4 + k] = W.getComponent(i, k);
      }
      const nextJ = joints.slice(), nextW = weights.slice();
      const names = mesh.skeleton.bones.map(b => b.name), index = Object.fromEntries(names.map((n, i) => [n, i]));
      const rest = new Float32Array(g.attributes.position.count * 3);
      let changed = 0;
      for (let i = 0; i < g.attributes.position.count; i++) {
        mesh.getVertexPosition(i, p).applyMatrix4(mesh.matrixWorld); rest.set(p.toArray(), i * 3);
        const x = p.x, y = p.y, z = p.z;
        if (y < 1.30 || y > 1.53 || Math.abs(x) > 0.28 || z < -0.13 || z > 0.16) continue;
        const own = {};
        for (let k = 0; k < 4; k++) { const n = names[J.getComponent(i, k)], w = W.getComponent(i, k); own[n] = (own[n] || 0) + w; }
        // Head and neck share the upper-body rigid transform, but the tee's
        // current collar also carries head weights. Include those weights so
        // the collar can join the depressed shoulder without a rigid shelf.
        const affected = ['torso', 'neck', 'head', 'leftScapula', 'rightScapula'];
        const mass = affected.reduce((sum, n) => sum + (own[n] || 0), 0);
        if (mass < 0.05) continue;
        const blend = smooth(y, 1.30, 1.36) * (1 - smooth(y, 1.49, 1.53)) * (1 - smooth(Math.abs(x), 0.225, 0.28));
        if (blend < 1e-5) continue;
        const side = x >= 0 ? 'left' : 'right', beta = smooth(Math.abs(x), 0.055, 0.225);
        const neck = smooth(y, 1.39, 1.48) * (1 - smooth(Math.abs(x), 0.055, 0.11));
        const target = { torso: mass * (1 - beta) * (1 - neck), neck: mass * (1 - beta) * neck, [side + 'Scapula']: mass * beta };
        const next = { ...own };
        for (const n of affected) next[n] = (1 - blend) * (own[n] || 0) + blend * (target[n] || 0);
        const top = Object.entries(next).filter(([n, w]) => index[n] !== undefined && w > 1e-7).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const sum = top.reduce((s, [, w]) => s + w, 0); if (!sum) continue;
        const values = top.map(([, w]) => w / sum);
        if (W.normalized && W.array instanceof Uint8Array) {
          const quantized = values.map(w => Math.round(w * 255)); quantized[0] += 255 - quantized.reduce((s, w) => s + w, 0);
          quantized.forEach((w, k) => { values[k] = w / 255; });
        }
        for (let k = 0; k < 4; k++) { nextJ[i * 4 + k] = top[k] ? index[top[k][0]] : 0; nextW[i * 4 + k] = values[k] || 0; }
        changed++;
      }
      meshes.push({ J, W, joints, weights, nextJ, nextW, rest });
      rows.push({ mesh: mesh.name, changedVertices: changed });
      if (mesh.name === 'Mesh001') for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (materials.has(material)) continue;
        const hook = material.onBeforeCompile, key = material.customProgramCacheKey;
        const nextHook = function (shader, renderer) {
          hook.call(this, shader, renderer);
          if (shader.uniforms.uCollar) {
            // Keep the real tee, lighting, rim and alpha. Remove the second
            // painted shirt that otherwise appears as a band on native skin.
            shader.uniforms.uCollar.value = 0;
            shader.fragmentShader = shader.fragmentShader.replace('vec3 alb=vec3(0.0)', 'W4=vec4(1.0,0.0,0.0,0.0);vec3 alb=vec3(0.0)');
          }
        };
        const nextKey = function () { return key.call(this) + '|trainingNativeCollar1'; };
        materials.set(material, { hook, key, nextHook, nextKey });
      }
    });
    return { meshes, materials, report: rows };
  }

  window.__setTrainingCollar = function (enabled) {
    enabled = enabled === true;
    if (enabled === active) return window.__trainingCollarReport || report(active);
    if (enabled && !cache) cache = prepare();
    for (const m of cache.meshes) {
      const joints = enabled ? m.nextJ : m.joints, weights = enabled ? m.nextW : m.weights;
      for (let i = 0; i < joints.length / 4; i++) for (let k = 0; k < 4; k++) {
        m.J.setComponent(i, k, joints[i * 4 + k]); m.W.setComponent(i, k, weights[i * 4 + k]);
      }
      m.J.needsUpdate = true; m.W.needsUpdate = true;
      if (m.J.isInterleavedBufferAttribute) m.J.data.needsUpdate = true;
      if (m.W.isInterleavedBufferAttribute) m.W.data.needsUpdate = true;
    }
    for (const [material, m] of cache.materials) {
      material.onBeforeCompile = enabled ? m.nextHook : m.hook;
      material.customProgramCacheKey = enabled ? m.nextKey : m.key;
      material.needsUpdate = true;
    }
    active = enabled;
    if (window.__drill) window.__drill._mc = null;
    window.__trainingCollarReport = report(active);
    return window.__trainingCollarReport;
  };
})();
