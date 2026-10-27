// Candidate ankle fitting patch. Apply in the reset pose after the v3 rig is
// initialized with V2P_Base_Limbs already built. The integration adapter must
// preflight and post-check every ankle seam vertex and weight. Experimental.
export async function applyAnkleR6Fit(page) {
  return page.evaluate(() => {
    const T = window.__toonT, v = window.flareInspector.viewer;
    const body = v.coach.getObjectByName('Coach_Body');
    const shoe = v.coach.getObjectByName('Coach_Sneakers');
    if (!body?.isSkinnedMesh || !shoe?.isSkinnedMesh) throw new Error('ankle-r6-fit: body or shoes missing');
    if (!v.coach.getObjectByName('V2P_Base_Limbs') || window.__v2p?.on) throw new Error('ankle integrated r1 requires constructed limbs with profile off');
    if (body.userData.ankleR6Fit) throw new Error('ankle-r6-fit already applied');
    v.motion.reset(); v.coach.updateMatrixWorld(true); body.skeleton.update(); shoe.skeleton.update();
    const worldPoint = (m, i) => m.getVertexPosition(i, new T.Vector3()).applyMatrix4(m.matrixWorld);
    const sg = shoe.geometry, sp = sg.attributes.position;
    // Recover the two open shoe-collar edge loops after merging split UV verts.
    const unique = new Map(), groups = [], keys = [], points = [];
    for (let i = 0; i < sp.count; ++i) {
      const q = worldPoint(shoe, i), key = q.toArray().map(x => Math.round(x * 1e5)).join(',');
      if (!unique.has(key)) { unique.set(key, groups.length); groups.push([]); points.push(q); }
      const k = unique.get(key); groups[k].push(i); keys[i] = k;
    }
    const edges = new Map(), idx = sg.index;
    for (let i = 0; i < idx.count; i += 3) {
      const f = [keys[idx.getX(i)], keys[idx.getX(i + 1)], keys[idx.getX(i + 2)]];
      for (let k = 0; k < 3; ++k) { const a = Math.min(f[k], f[(k + 1) % 3]), b = Math.max(f[k], f[(k + 1) % 3]); const e = `${a}:${b}`; edges.set(e, (edges.get(e) || 0) + 1); }
    }
    const boundary = new Set();
    for (const [e, count] of edges) if (count === 1) for (const k of e.split(':')) boundary.add(Number(k));
    const collars = {};
    for (const side of ['left', 'right']) {
      const foot = v.coach.getObjectByName(side + 'Foot');
      if (!foot) throw new Error('ankle-r6-fit: missing ' + side + 'Foot');
      const fp = foot.getWorldPosition(new T.Vector3()), sign = side === 'left' ? 1 : -1;
      const ring = [...boundary].map(i => points[i]).filter(q => q.x * sign > 0 && q.y > fp.y - 0.04 && q.y < fp.y + 0.04 && Math.abs(q.x - fp.x) < 0.08 && Math.abs(q.z - fp.z) < 0.11);
      if (ring.length < 16) throw new Error('ankle-r6-fit: shoe opening boundary is incomplete: ' + side);
      const center = new T.Vector3(); for (const q of ring) center.add(q); center.multiplyScalar(1 / ring.length);
      const profile = ring.map(q => ({angle: Math.atan2(q.z - center.z, q.x - center.x), radius: Math.hypot(q.x - center.x, q.z - center.z)})).sort((a, b) => a.angle - b.angle);
      const radiusAt = angle => {
        let j = profile.findIndex(q => q.angle >= angle); if (j < 0) j = 0;
        const a = profile[(j + profile.length - 1) % profile.length], b = profile[j];
        let aa = a.angle, bb = b.angle, x = angle; if (j === 0) { aa -= 2 * Math.PI; if (x > bb) x -= 2 * Math.PI; }
        return a.radius + (b.radius - a.radius) * (bb === aa ? 0 : (x - aa) / (bb - aa));
      };
      const maxGap = Math.max(...profile.map((q, i) => (profile[(i + 1) % profile.length].angle - q.angle + 2 * Math.PI) % (2 * Math.PI)));
      if (maxGap > 0.55) throw new Error('ankle-r6-fit: incomplete collar profile: ' + side);
      collars[side] = {fp, center, radiusAt, ring: ring.length};
    }
    const g = body.geometry, p = g.attributes.position, si0 = g.attributes.skinIndex, sw0 = g.attributes.skinWeight;
    const n = p.count, positions = new Float32Array(n * 3), indices = new Uint16Array(n * 4), weights = new Float32Array(n * 4), touched = [];
    for (let i = 0; i < n; ++i) {
      for (let k = 0; k < 3; ++k) positions[3 * i + k] = p.getComponent(i, k);
      for (let k = 0; k < 4; ++k) { indices[4 * i + k] = si0.getComponent(i, k); weights[4 * i + k] = sw0.getComponent(i, k); }
    }
    const names = body.skeleton.bones.map(b => b.name), skin = body.skeleton.boneMatrices;
    const M = new T.Matrix4(), B = new T.Matrix4(), A = new T.Matrix4(), q = new T.Vector3();
    const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const result = {left: {ring: collars.left.ring, vertices: 0, maxMoveMm: 0}, right: {ring: collars.right.ring, vertices: 0, maxMoveMm: 0}};
    for (let i = 0; i < n; ++i) {
      const wp = worldPoint(body, i), side = wp.x > 0 ? 'left' : 'right', c = collars[side];
      const y = wp.y - c.fp.y, dx = wp.x - c.center.x, dz = wp.z - c.center.z, radius = Math.hypot(dx, dz);
      if (y < -0.03 || y > 0.08 || radius > 0.09 || wp.z > c.center.z + 0.06 || radius < 1e-6) continue;
      const foot = names.indexOf(side + 'Foot'); if (foot < 0) throw new Error('ankle-r6-fit: missing foot in body skeleton');
      const posBlend = smooth((y + 0.03) / 0.02) * (1 - smooth((y - 0.02) / 0.06));
      const ringRadius = c.radiusAt(Math.atan2(dz, dx));
      const displacement = Math.min(0.012, Math.max(0, radius - (ringRadius - 0.008))) * posBlend;
      // End the foot-weight transition below the fragment-prone upper ankle.
      const weightBlend = (1 - smooth((y - 0.015) / 0.035)) * smooth((y + 0.03) / 0.02);
      let oldFoot = 0; const old = new Map();
      for (let k = 0; k < 4; ++k) { const j = indices[4 * i + k], w = weights[4 * i + k]; if (w) old.set(j, (old.get(j) || 0) + w * (1 - weightBlend)); if (j === foot) oldFoot += w; }
      old.set(foot, (old.get(foot) || 0) + weightBlend);
      const influences = [...old].sort((a, b) => b[1] - a[1]).slice(0, 4), total = influences.reduce((s, x) => s + x[1], 0);
      if (!(total > 0)) throw new Error('ankle-r6-fit: zero weight');
      const e = M.elements.fill(0);
      for (let k = 0; k < 4; ++k) {
        if (weightBlend > 1e-8) {
          const [j, w] = influences[k] || [0, 0];
          si0.setComponent(i, k, j); sw0.setComponent(i, k, w / total);
          indices[4 * i + k] = si0.getComponent(i, k); weights[4 * i + k] = sw0.getComponent(i, k);
        }
        const actualW = weights[4 * i + k];
        if (actualW) { B.fromArray(skin, indices[4 * i + k] * 16); for (let h = 0; h < 16; ++h) e[h] += B.elements[h] * actualW; }
      }
      if (weightBlend > 1e-8) touched.push(i);
      // Solve for the bind coordinate which has the intended rest-world position
      // under the updated weights; retain the prior rest location apart from the fit.
      wp.x -= dx / radius * displacement; wp.z -= dz / radius * displacement;
      A.copy(body.matrixWorld).multiply(body.bindMatrixInverse).multiply(M).multiply(body.bindMatrix).invert();
      q.copy(wp).applyMatrix4(A); positions.set(q.toArray(), 3 * i);
      if (displacement > 1e-7 || weightBlend * (1 - oldFoot) > 1e-5) { result[side].vertices++; result[side].maxMoveMm = Math.max(result[side].maxMoveMm, displacement * 1000); }
    }
    g.setAttribute('position', new T.BufferAttribute(positions, 3));
    // Keep the existing attribute objects: training-collar caches their references.
    const writeWeights = () => { for (const i of touched) for (let k = 0; k < 4; ++k) {
      si0.setComponent(i, k, indices[4 * i + k]); sw0.setComponent(i, k, weights[4 * i + k]);
    } si0.needsUpdate = sw0.needsUpdate = true;
      if (si0.isInterleavedBufferAttribute) si0.data.needsUpdate = true;
      if (sw0.isInterleavedBufferAttribute) sw0.data.needsUpdate = true;
    };
    writeWeights();
    const originalCollar = window.__setTrainingCollar;
    if (originalCollar) window.__setTrainingCollar = function(...args) {
      const result = originalCollar.apply(this, args); writeWeights(); return result;
    };
    // Enabling the profile restores this full snapshot, so it must contain the fit.
    if (!window.__v2p?.pristine?.[0] || window.__v2p.pristine[0].length !== positions.length)
      throw new Error('ankle-r6-fit: v2plus pristine position snapshot unavailable');
    window.__v2p.pristine[0].set(positions);
    g.computeBoundingBox(); g.computeBoundingSphere();
    body.userData.ankleR6Fit = result;
    return result;
  });
}
