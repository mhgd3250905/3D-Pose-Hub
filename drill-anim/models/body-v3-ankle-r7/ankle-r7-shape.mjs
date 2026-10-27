// Experimental r7: a local forward-ankle fit on top of the r6 weight band.
// Derived from the saved pose geometry by the offline FCL experiment; visual
// acceptance and runtime validation are required before this is used.
import {applyAnkleR6Shape} from '../body-v3-ankle-r6/ankle-r6-shape.mjs';

export async function applyAnkleR7Shape(page) {
  const prior = await applyAnkleR6Shape(page);
  const fit = await page.evaluate(() => {
    const T = window.__toonT, v = window.flareInspector.viewer;
    const body = v.coach.getObjectByName('Coach_Body'), g = body.geometry;
    if (window.__v2p?.on) throw new Error('ankle-r7 requires the reset state');
    v.motion.reset(); v.coach.updateMatrixWorld(true); body.skeleton.update();
    const P = g.attributes.position, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
    const positions = new Float32Array(P.count * 3), matrices = body.skeleton.boneMatrices;
    const S = new T.Matrix4(), B = new T.Matrix4(), M = new T.Matrix4(), q = new T.Vector3();
    const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    let moved = 0, maxMove = 0;
    for (let i = 0; i < P.count; ++i) {
      positions.set([P.getX(i), P.getY(i), P.getZ(i)], i * 3);
      body.getVertexPosition(i, q); q.applyMatrix4(body.matrixWorld);
      const w = smooth((q.y - .10) / .03) * (1 - smooth((q.y - .14) / .03)) *
        smooth((q.z + .025) / .04) * (Math.abs(q.x) < .16 ? 1 : 0);
      if (w < 1e-5) continue;
      q.y += .008 * w; q.z -= .008 * w;
      const e = S.elements.fill(0);
      for (let k = 0; k < 4; ++k) { const weight = W.getComponent(i, k); if (!weight) continue;
        B.fromArray(matrices, J.getComponent(i, k) * 16); for (let h = 0; h < 16; ++h) e[h] += B.elements[h] * weight; }
      M.copy(body.matrixWorld).multiply(body.bindMatrixInverse).multiply(S).multiply(body.bindMatrix).invert();
      q.applyMatrix4(M); positions.set(q.toArray(), i * 3); moved++;
      maxMove = Math.max(maxMove, Math.sqrt(2) * .008 * w);
    }
    g.setAttribute('position', new T.BufferAttribute(positions, 3));
    if (!window.__v2p.pristine?.[0] || window.__v2p.pristine[0].length !== positions.length)
      throw new Error('ankle-r7: missing pristine position snapshot');
    window.__v2p.pristine[0].set(positions); g.computeBoundingBox(); g.computeBoundingSphere();
    return {vertices: moved, maxAdditionalMoveMm: maxMove * 1000};
  });
  return {prior, fit};
}
