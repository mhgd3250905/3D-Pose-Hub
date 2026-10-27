// Experimental body-v3 ankle candidate. R2 first makes the ankle band follow
// the foot, then this version clears the shoe tongue with a smooth rest fit.
import {applyAnkleR6Fit} from './ankle-r6-fit.mjs';

export async function applyAnkleR6Shape(page) {
  const prior = await applyAnkleR6Fit(page);
  const fit = await page.evaluate(() => {
    const T = window.__toonT, v = window.flareInspector.viewer;
    const body = v.coach.getObjectByName('Coach_Body');
    if (!body?.userData.ankleR6Fit || window.__v2p?.on) throw new Error('ankle-r6-shape requires the r2 reset state');
    v.motion.reset(); v.coach.updateMatrixWorld(true); body.skeleton.update();
    const g = body.geometry, P = g.attributes.position, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
    const matrices = body.skeleton.boneMatrices, S = new T.Matrix4(), B = new T.Matrix4(), M = new T.Matrix4();
    const q = new T.Vector3(), smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const fp = v.coach.getObjectByName('leftFoot').getWorldPosition(new T.Vector3());
    const positions = new Float32Array(P.count * 3); let moved = 0, maxMove = 0;
    for (let i = 0; i < P.count; ++i) {
      positions.set([P.getX(i), P.getY(i), P.getZ(i)], 3 * i);
      body.getVertexPosition(i, q); q.applyMatrix4(body.matrixWorld);
      // At rest the shoe tongue crosses the front of the foot. The vertical
      // transition ends below the existing ankle-to-limbs seam at y≈0.178 m.
      const height = q.y - fp.y;
      const w = smooth((height + 0.030020765) / 0.02) *
        (1 - smooth((height - 0.024979235) / 0.055)) *
        smooth((q.z + 0.02) / 0.04) * (Math.abs(q.x) < 0.16 ? 1 : 0);
      const dz = 0.012 * w;
      if (dz < 1e-7) continue;
      q.z -= dz;
      const e = S.elements.fill(0);
      for (let k = 0; k < 4; ++k) { const weight = W.getComponent(i, k); if (!weight) continue;
        B.fromArray(matrices, J.getComponent(i, k) * 16); for (let h = 0; h < 16; ++h) e[h] += B.elements[h] * weight; }
      M.copy(body.matrixWorld).multiply(body.bindMatrixInverse).multiply(S).multiply(body.bindMatrix).invert();
      q.applyMatrix4(M); positions.set(q.toArray(), i * 3); moved++; maxMove = Math.max(maxMove, dz);
    }
    g.setAttribute('position', new T.BufferAttribute(positions, 3));
    if (!window.__v2p.pristine?.[0] || window.__v2p.pristine[0].length !== positions.length)
      throw new Error('ankle-r6-shape: missing pristine position snapshot');
    window.__v2p.pristine[0].set(positions);
    g.computeBoundingBox(); g.computeBoundingSphere();
    return {vertices: moved, maxPosteriorMoveMm: maxMove * 1000};
  });
  return {prior, fit};
}
