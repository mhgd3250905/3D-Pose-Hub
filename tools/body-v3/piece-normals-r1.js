// Experimental v3 rest normals for active v2plus torso/limbs/c1r2 hands.
// Install after the three pieces have been enabled. `seams` contains the
// unmodified {torso, limbs, hands} data.seam records used to build them.
// This changes runtime buffers only, not frozen source files.
(function () {
  window.__fixBodyV3PieceNormalsR1 = function (seams) {
    const T = window.__toonT, v = window.flareInspector?.viewer, V = window.__v2p;
    if (!T || !v?.coach || !V?.torso?.on || !V?.limbs?.on || !V?.hands?.on) throw new Error('v3 piece normals: enable torso, limbs and hands first');
    if (V.__pieceNormalsR1) return { already: true };
    const pieces = ['torso', 'limbs', 'hands'];
    if (pieces.some(name => !seams?.[name]?.vid || !seams[name].mesh)) throw new Error('v3 piece normals: missing seam metadata');
    v.motion.reset(); v.coach.updateMatrixWorld(true);
    const entries = new Map(), sourceNames = new Set();
    for (const name of pieces) for (const source of seams[name].mesh) sourceNames.add(source);
    for (const name of sourceNames) {
      const mesh = v.coach.getObjectByName(name);
      if (!mesh?.isSkinnedMesh) throw new Error('v3 piece normals: missing source mesh ' + name);
      entries.set('source:' + name, { mesh, piece: null });
    }
    for (const name of pieces) entries.set(name, { mesh: V[name].mesh, piece: name });
    const vec = new T.Vector3();
    function area(entry, index, respectDrawRange = true) {
      const mesh = entry.mesh, g = mesh.geometry, p = g.attributes.position, out = new Float64Array(p.count * 3), pos = new Float64Array(p.count * 3);
      mesh.skeleton.update();
      for (let i = 0; i < p.count; i++) { mesh.getVertexPosition(i, vec).applyMatrix4(mesh.matrixWorld); pos.set([vec.x, vec.y, vec.z], i * 3); }
      if (!index) throw new Error('v3 piece normals: indexed triangles required');
      const start = respectDrawRange ? g.drawRange.start : 0;
      const end = Math.min(index.count, respectDrawRange ? start + g.drawRange.count : index.count);
      for (let f = start; f + 2 < end; f += 3) {
        const a = index.getX(f), b = index.getX(f + 1), c = index.getX(f + 2);
        const ax = pos[b * 3] - pos[a * 3], ay = pos[b * 3 + 1] - pos[a * 3 + 1], az = pos[b * 3 + 2] - pos[a * 3 + 2];
        const bx = pos[c * 3] - pos[a * 3], by = pos[c * 3 + 1] - pos[a * 3 + 1], bz = pos[c * 3 + 2] - pos[a * 3 + 2];
        const x = ay * bz - az * by, y = az * bx - ax * bz, z = ax * by - ay * bx;
        if (x * x + y * y + z * z < 1e-24) continue;
        for (const i of [a, b, c]) { out[i * 3] += x; out[i * 3 + 1] += y; out[i * 3 + 2] += z; }
      }
      return out;
    }
    for (const entry of entries.values()) {
      entry.on = area(entry, entry.mesh.geometry.index);
      const swap = V.hands.swaps.find(s => s.g === entry.mesh.geometry && s.prev);
      entry.off = swap ? area(entry, swap.prev, false) : entry.on;
    }
    const groups = new Map();
    for (const name of pieces) {
      const seam = seams[name], count = V[name].mesh.geometry.attributes.position.count;
      if (seam.vid.length !== seam.mesh.length || seam.first + seam.vid.length > count) throw new Error('v3 piece normals: inconsistent seam ' + name);
      seam.vid.forEach((vid, k) => {
        const key = 'source:' + seam.mesh[k] + ':' + vid;
        let group = groups.get(key);
        if (!group) groups.set(key, group = [{ entry: entries.get('source:' + seam.mesh[k]), i: vid }]);
        group.push({ entry: entries.get(name), i: seam.first + k });
      });
    }
    const matrix = new T.Matrix4(), bone = new T.Matrix4(), skin = new T.Matrix3(), w2o = new T.Matrix3(), n = new T.Vector3();
    function bindNormal(entry, i, x, y, z) {
      const m = entry.mesh, g = m.geometry, e = matrix.elements.fill(0), bm = m.skeleton.boneMatrices;
      for (let k = 0; k < 4; k++) {
        const w = g.attributes.skinWeight.getComponent(i, k); if (!w) continue;
        bone.fromArray(bm, g.attributes.skinIndex.getComponent(i, k) * 16);
        for (let c = 0; c < 16; c++) e[c] += w * bone.elements[c];
      }
      matrix.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix); skin.setFromMatrix4(matrix);
      if (Math.abs(skin.determinant()) < 1e-12) throw new Error('v3 piece normals: singular skin matrix');
      w2o.setFromMatrix4(m.matrixWorld).transpose();
      n.set(x, y, z).normalize().applyMatrix3(w2o).applyMatrix3(skin.invert()).normalize();
      if (![n.x, n.y, n.z].every(Number.isFinite)) throw new Error('v3 piece normals: non-finite normal');
      return [n.x, n.y, n.z];
    }
    const results = new Map();
    for (const name of pieces) {
      const e = entries.get(name), a = e.mesh.geometry.attributes.normal, on = new Float32Array(a.count * 3), off = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) {
        const j = i * 3, x = e.on[j], y = e.on[j + 1], z = e.on[j + 2];
        const next = x * x + y * y + z * z > 1e-24 ? bindNormal(e, i, x, y, z) : [a.getX(i), a.getY(i), a.getZ(i)];
        on.set(next, j); off.set(next, j);
      }
      results.set(name, { entry: e, on, off });
    }
    const sourceChanges = [];
    let joined = 0;
    for (const group of groups.values()) {
      for (const mode of ['on', 'off']) {
        let x = 0, y = 0, z = 0;
        for (const { entry, i } of group) {
          if (mode === 'off' && entry.piece === 'hands') continue;
          const a = entry[mode], j = i * 3; x += a[j]; y += a[j + 1]; z += a[j + 2];
        }
        if (x * x + y * y + z * z < 1e-24) continue;
        for (const { entry, i } of group) {
          if (mode === 'off' && entry.piece === 'hands') continue;
          const value = bindNormal(entry, i, x, y, z);
          if (entry.piece) results.get(entry.piece)[mode].set(value, i * 3);
          else {
            let c = sourceChanges.find(q => q.entry === entry && q.i === i);
            if (!c) { const a = entry.mesh.geometry.attributes.normal; c = { entry, i, original: [a.getX(i), a.getY(i), a.getZ(i)] }; sourceChanges.push(c); }
            c[mode] = value;
          }
        }
      }
      joined++;
    }
    for (const name of pieces) {
      const { entry, on } = results.get(name), a = entry.mesh.geometry.attributes.normal;
      for (let i = 0; i < a.count; i++) a.setXYZ(i, on[i * 3], on[i * 3 + 1], on[i * 3 + 2]);
      a.needsUpdate = true;
    }
    const swap = V.hands.nrmSwap;
    if (swap) {
      const { on, off } = results.get('limbs');
      swap.idx.forEach((id, k) => { for (let c = 0; c < 3; c++) { swap.a1[k * 3 + c] = on[id * 3 + c]; swap.a0[k * 3 + c] = off[id * 3 + c]; } });
    }
    function updateSources() {
      const mode = V.torso?.on && V.limbs?.on ? (V.hands?.on ? 'on' : 'off') : 'original';
      for (const change of sourceChanges) {
        const a = change.entry.mesh.geometry.attributes.normal, value = change[mode] || change.original;
        a.setXYZ(change.i, ...value); a.needsUpdate = true;
        if (a.isInterleavedBufferAttribute) a.data.needsUpdate = true;
      }
    }
    const setHands = V.setHands, setOutfit = V.setOutfit;
    V.setHands = function (...args) { const result = setHands.apply(this, args); updateSources(); return result; };
    V.setOutfit = function (...args) { const result = setOutfit.apply(this, args); updateSources(); return result; };
    updateSources();
    V.__pieceNormalsR1 = { joined, sourceChanges: sourceChanges.length };
    return { joined, sourceChanges: sourceChanges.length, handSwapVertices: swap?.idx.length || 0 };
  };
})();
