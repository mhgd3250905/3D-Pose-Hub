// Optional rest-pose normal candidate for the v3 GLB. Inject after boot-v3
// and before selecting a pose, then call __fixBodyV3ArmNormalsR1().
// This is an in-memory operation: no GLB or frozen source is overwritten.
(function () {
  function smooth(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  window.__fixBodyV3ArmNormalsR1 = function () {
    const T = window.__toonT;
    const viewer = window.flareInspector?.viewer;
    if (!T || !viewer?.coach || !viewer.motion) throw new Error('v3 arm normals: viewer not ready');
    if (viewer.__bodyV3ArmNormalsR1) return { already: true };
    viewer.motion.reset();
    const coach = viewer.coach;
    coach.updateMatrixWorld(true);

    // Collect face normals in the *skinned rest world* space. Quantized GLB
    // positions and per-vertex bind matrices make bind-space face normals
    // unsuitable for the warped geometry.
    const pieces = [];
    const slots = new Map();
    const tmp = new T.Vector3();
    coach.traverse(mesh => {
      if (!mesh.isSkinnedMesh || /^V2P_/.test(mesh.name)) return;
      const g = mesh.geometry;
      const P = g.attributes.position, N = g.attributes.normal;
      const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
      if (!P || !N || !SI || !SW || P.count !== N.count) return;
      const armBones = new Set();
      mesh.skeleton.bones.forEach((bone, i) => {
        if (/^(left|right)(UpperArm|Forearm)$/.test(bone.name)) armBones.add(i);
      });
      if (!armBones.size) return;
      const count = P.count;
      const arm = new Float32Array(count);
      let affected = 0;
      for (let i = 0; i < count; i++) {
        let w = 0;
        for (let k = 0; k < 4; k++) if (armBones.has(SI.getComponent(i, k))) w += SW.getComponent(i, k);
        arm[i] = w;
        if (w > 0.05) affected++;
      }
      if (!affected) return;
      mesh.skeleton.update();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(i, tmp).applyMatrix4(mesh.matrixWorld);
        positions.set([tmp.x, tmp.y, tmp.z], i * 3);
      }
      const sum = new Float64Array(count * 3);
      const index = g.index;
      const len = index ? index.count : count;
      const vertex = i => index ? index.getX(i) : i;
      for (let f = 0; f + 2 < len; f += 3) {
        const a = vertex(f), b = vertex(f + 1), c = vertex(f + 2);
        if (arm[a] <= 0.05 && arm[b] <= 0.05 && arm[c] <= 0.05) continue;
        const ax = positions[b * 3] - positions[a * 3], ay = positions[b * 3 + 1] - positions[a * 3 + 1], az = positions[b * 3 + 2] - positions[a * 3 + 2];
        const bx = positions[c * 3] - positions[a * 3], by = positions[c * 3 + 1] - positions[a * 3 + 1], bz = positions[c * 3 + 2] - positions[a * 3 + 2];
        const x = ay * bz - az * by, y = az * bx - ax * bz, z = ax * by - ay * bx;
        if (x * x + y * y + z * z < 1e-24) continue;
        for (const i of [a, b, c]) { sum[i * 3] += x; sum[i * 3 + 1] += y; sum[i * 3 + 2] += z; }
      }
      const piece = { mesh, original: N, positions, arm, sum, affected };
      pieces.push(piece);
      for (let i = 0; i < count; i++) {
        if (arm[i] <= 0.05 || sum[i * 3] ** 2 + sum[i * 3 + 1] ** 2 + sum[i * 3 + 2] ** 2 < 1e-24) continue;
        // Merge duplicate UV / piece seam vertices only when their original
        // normals agree; opposite or deliberately sharp surfaces stay apart.
        const key = [0, 1, 2].map(k => Math.round(positions[i * 3 + k] * 100000)).join(',');
        let bucket = slots.get(key); if (!bucket) slots.set(key, bucket = []);
        bucket.push({ piece, i });
      }
    });

    const skin = new T.Matrix4(), bone = new T.Matrix4(), skin3 = new T.Matrix3();
    const normalWorld = new T.Matrix3(), worldToObjectNormal = new T.Matrix3();
    const originalWorld = new T.Vector3(), candidate = new T.Vector3(), target = new T.Vector3();
    function matrices(piece, i) {
      const m = piece.mesh, g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      const e = skin.elements.fill(0), bm = m.skeleton.boneMatrices;
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k); if (!w) continue;
        bone.fromArray(bm, si.getComponent(i, k) * 16);
        for (let j = 0; j < 16; j++) e[j] += w * bone.elements[j];
      }
      skin.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix);
      skin3.setFromMatrix4(skin);
      normalWorld.getNormalMatrix(m.matrixWorld);
      worldToObjectNormal.setFromMatrix4(m.matrixWorld).transpose();
    }
    function oldWorld(piece, i, out) {
      matrices(piece, i);
      return out.fromBufferAttribute(piece.original, i).applyMatrix3(skin3).applyMatrix3(normalWorld).normalize();
    }

    const output = new Map();
    for (const piece of pieces) {
      const n = piece.original.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        a[i * 3] = piece.original.getX(i); a[i * 3 + 1] = piece.original.getY(i); a[i * 3 + 2] = piece.original.getZ(i);
      }
      output.set(piece, a);
    }
    let changed = 0, welded = 0, skipped = 0;
    for (const bucket of slots.values()) {
      for (const rec of bucket) {
        const { piece, i } = rec;
        oldWorld(piece, i, originalWorld);
        target.set(0, 0, 0);
        let shared = 0;
        for (const other of bucket) {
          oldWorld(other.piece, other.i, candidate);
          if (originalWorld.dot(candidate) < 0.9) continue;
          const s = other.piece.sum, j = other.i * 3;
          target.x += s[j]; target.y += s[j + 1]; target.z += s[j + 2]; shared++;
        }
        if (target.lengthSq() < 1e-24) { skipped++; continue; }
        target.normalize();
        // Avoid replacing intentionally authored hard edges or reversed faces.
        if (target.dot(originalWorld) < 0.5) { skipped++; continue; }
        target.lerp(originalWorld, 1 - smooth(0.05, 0.5, piece.arm[i])).normalize();
        // Three's skinning shader multiplies the normal by skinMatrix before
        // applying the object's normalMatrix. Reverse those exact transforms.
        matrices(piece, i);
        target.applyMatrix3(worldToObjectNormal);
        if (Math.abs(skin3.determinant()) < 1e-12) { skipped++; continue; }
        target.applyMatrix3(skin3.invert()).normalize();
        if (![target.x, target.y, target.z].every(Number.isFinite)) { skipped++; continue; }
        output.get(piece).set([target.x, target.y, target.z], i * 3);
        changed++; if (shared > 1) welded++;
      }
    }
    if (!changed) throw new Error('v3 arm normals: no eligible arm vertices');
    for (const piece of pieces) {
      piece.mesh.geometry.setAttribute('normal', new T.BufferAttribute(output.get(piece), 3));
    }
    viewer.__bodyV3ArmNormalsR1 = { pieces, changed, welded, skipped };
    return { meshes: pieces.map(p => p.mesh.name), changed, welded, skipped };
  };
})();
