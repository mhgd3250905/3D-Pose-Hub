// Measure the currently posed v2plus seams without resetting the pose.
(function () {
  window.__measurePieceSeamsMotionR1 = function (seams) {
    const T = window.__toonT, V = window.__v2p, v = window.flareInspector.viewer;
    if (!V?.torso?.on || !V?.limbs?.on || !V?.hands?.on) throw new Error('full v2plus profile is required');
    v.coach.updateMatrixWorld(true);
    v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
    const n = new T.Vector3(), p = new T.Vector3(), matrix = new T.Matrix4(), bone = new T.Matrix4();
    function normal(mesh, i) {
      const e = matrix.elements.fill(0), bm = mesh.skeleton.boneMatrices, g = mesh.geometry;
      for (let k = 0; k < 4; k++) {
        const w = g.attributes.skinWeight.getComponent(i, k); if (!w) continue;
        bone.fromArray(bm, g.attributes.skinIndex.getComponent(i, k) * 16);
        for (let j = 0; j < 16; j++) e[j] += w * bone.elements[j];
      }
      matrix.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix);
      return n.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(new T.Matrix3().setFromMatrix4(matrix)).applyMatrix3(new T.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize().clone();
    }
    const angles = [], gaps = []; let invalid = 0;
    for (const name of ['torso', 'limbs', 'hands']) {
      const piece = V[name].mesh, seam = seams[name];
      seam.vid.forEach((id, k) => {
        const source = v.coach.getObjectByName(seam.mesh[k]), a = normal(source, id), b = normal(piece, seam.first + k);
        if (!a.lengthSq() || !b.lengthSq() || ![...a.toArray(), ...b.toArray()].every(Number.isFinite)) { invalid++; return; }
        angles.push(Math.acos(T.MathUtils.clamp(a.dot(b), -1, 1)) * 180 / Math.PI);
        const x = source.getVertexPosition(id, p).applyMatrix4(source.matrixWorld).clone();
        const y = piece.getVertexPosition(seam.first + k, p).applyMatrix4(piece.matrixWorld);
        gaps.push(x.distanceTo(y) * 1000);
      });
    }
    const stats = a => { a.sort((x, y) => x - y); return { p95: a[Math.floor(a.length * .95)], max: a.at(-1) }; };
    return { count: angles.length, invalid, normalDegrees: stats(angles), gapMm: stats(gaps) };
  };
})();
