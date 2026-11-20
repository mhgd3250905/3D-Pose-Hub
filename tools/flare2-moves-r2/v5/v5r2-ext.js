/* Flare 2.0 moves r2 (2026-11-21): opt-in V5 extension for the r2 actions ONLY (spec field `v5r2`). Loaded by
 * tools/flare2-moves-r2/v5/render-masters-v5r2.mjs and tools/flare2-moves-r2/check.mjs after tools/v5/runtime/v5-hub.js installV5;
 * tools/v5 itself is untouched, so every existing action renders exactly as before.
 *
 * Why: the hub rig keeps the head rigid with the chest and the V5 hand is one rigid open-hand mesh (no finger bones), so neck rolls,
 * a head tilted to the shoulder, a fist / spread hand, fingers pulled back and interlaced fingers cannot be drawn. This module wraps
 * window.__v5.pose(): after V5 has copied the hub pose,
 *  1) head (spec v5r2.head = per-frame [flexDeg, latDeg, rotDeg], 30 fps, looped): extra neck + head rotation in the torso frame,
 *     split neck 45 % / head 55 %, both about the bones' own pivots (rest frame: +X body left, +Y up, +Z front).
 *     flex + = chin toward the chest (same sign as v5.headFlexDeg), lat + = right ear toward the right shoulder, rot + = face turns left.
 *  2) hands (spec v5r2.hands.{left,right} = per-frame 19-number finger pose, see FINGER below): the rigid V5 hand vertices
 *     (hand-bone weight >= 0.999, i.e. palm + fingers, not the wrist blend ring) are re-posed every frame in the hand bone's bind
 *     frame: per finger MCP / PIP / DIP flexion (chain, distal first, each joint a smooth 8-14 mm bend zone so the skin arcs instead
 *     of tearing) and MCP abduction; thumb CMC flexion / adduction + MCP/IP flexion. Web vertices between two fingers blend the two
 *     fingers' transforms by lateral distance. Normals and the toon shading normals (toonN) are rotated with them; the ink outline
 *     shells share the geometry, so they follow. No bone or skin weight is added.
 * setTime(t) must be called before pose() (render-masters-v5r2 / check do); t is looped over the spec's frame count.
 * Joint centres below are measured once on coach-v3r3-wristfix.glb (right hand bind frame, metres: wrist pivot 0, fingers -X,
 * palm -Y, thumb +Z; the left hand is its mirror in x), install checks the vertex counts per finger so a different model fails loudly. */
import * as THREE from 'three';

// finger axis: point C (on the finger centreline), unit direction D (toward the tip); joints as distances along D from C
const FINGERS = [
  { n: 'index', C: [-0.1233, -0.0035, 0.0275], D: [-0.9874, -0.0446, 0.1521], mcp: -0.0439, pip: -0.0059, dip: 0.0137, tip: 0.0265, sgnAbd: 1 },
  { n: 'middle', C: [-0.1312, 0.0031, -0.003], D: [-0.9916, 0.0954, -0.0876], mcp: -0.0516, pip: -0.0087, dip: 0.0136, tip: 0.0279, sgnAbd: 1 },
  { n: 'ring', C: [-0.1214, 0.0067, -0.026], D: [-0.9645, 0.0716, -0.2541], mcp: -0.045, pip: -0.0072, dip: 0.0124, tip: 0.025, sgnAbd: -1 },
  { n: 'little', C: [-0.1071, 0.0111, -0.0452], D: [-0.9053, 0.1105, -0.4102], mcp: -0.0366, pip: -0.0109, dip: 0.0024, tip: 0.011, sgnAbd: -1 },
];
// thumb: CMC centre, direction toward the tip; MCP / IP along it
const THUMB = { C: [-0.034, -0.013, 0.027], D: [-0.80, -0.06, 0.60], mcp: 0.036, ip: 0.054, tip: 0.075 };
const MIN_VERTS = { index: 600, middle: 600, ring: 500, little: 300, thumb: 300 };
export const FINGER = 'per frame per hand: [iM,iP,iD,iA, mM,mP,mD,mA, rM,rP,rD,rA, lM,lP,lD,lA, tF,tA,tI] deg; M/P/D = MCP/PIP/DIP flexion (+ toward the palm), A = MCP abduction (+ away from the middle finger; middle + toward the index), tF = thumb CMC flexion toward the palm, tA = thumb adduction toward the index (+), tI = thumb MCP+IP flexion';

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export function installR2({ head = null, hands = null, fps = 30 } = {}) {
  const V = window.__v5; if (!V || !V.pose) throw Error('v5r2 needs installV5 first');
  const bones = V.bones; const meshes = []; V.root.traverse(o => { if (o.isSkinnedMesh && !o.userData.__outline) meshes.push(o); });
  const info = { head: !!head, hands: hands ? Object.keys(hands).filter(k => hands[k]) : [] };
  // ---- head
  let headFrames = null;
  if (head) { headFrames = head; if (!Array.isArray(head) || !head.length || head.some(r => !Array.isArray(r) || r.length !== 3 || r.some(x => !Number.isFinite(x) || Math.abs(x) > 60))) throw Error('bad v5r2.head (per-frame [flex,lat,rot], |deg| <= 60)'); }
  // ---- hands
  const rigs = {};
  for (const side of info.hands) {
    const fr = hands[side]; if (!Array.isArray(fr) || !fr.length || fr.some(r => !Array.isArray(r) || r.length !== 19 || r.some(x => !Number.isFinite(x) || Math.abs(x) > 120))) throw Error('bad v5r2.hands.' + side + ' (per-frame 19 numbers, |deg| <= 120)');
    const sx = side === 'left' ? -1 : 1, hand = side + 'Hand', sets = [];
    const F = FINGERS.map(f => { const C = v3(f.C), D = v3(f.D).normalize(), M = C.clone().addScaledVector(D, f.mcp), K = D.clone().cross(new THREE.Vector3(0, -1, 0)).normalize();
      return { ...f, C, D, M, K, P: C.clone().addScaledVector(D, f.pip), Dj: C.clone().addScaledVector(D, f.dip), L: f.tip - f.mcp }; });
    const TC = v3(THUMB.C), TD = v3(THUMB.D).normalize(), TK = TD.clone().cross(new THREE.Vector3(0, -1, 0)).normalize();
    const T = { C: TC, D: TD, K: TK, Mj: TC.clone().addScaledVector(TD, THUMB.mcp), Ij: TC.clone().addScaledVector(TD, THUMB.ip) };
    const counts = { index: 0, middle: 0, ring: 0, little: 0, thumb: 0 };
    for (const m of meshes) {
      const names = m.skeleton.bones.map(b => b.name), hi = names.indexOf(hand); if (hi < 0) continue;
      const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, TN = g.attributes.toonN, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
      const toL = m.skeleton.boneInverses[hi].clone().multiply(m.bindMatrix), toM = toL.clone().invert();
      const nL = new THREE.Matrix3().setFromMatrix4(toL), nM = new THREE.Matrix3().setFromMatrix4(toM);
      const idx = [], rest = [], nrest = [], tnrest = [], wts = []; const v = new THREE.Vector3();
      for (let i = 0; i < P.count; i++) {
        let w = 0; for (let k = 0; k < 4; k++) if (J.getComponent(i, k) === hi) w += W.getComponent(i, k);
        if (w < 0.999) continue;
        v.fromBufferAttribute(P, i).applyMatrix4(toL); v.x *= sx;   // canonical (right-hand) frame
        // finger / thumb weights: lateral distance to each axis, only where past the joint's bend zone start
        const cand = [];
        F.forEach((f, k) => { const r = v.clone().sub(f.M), u = r.dot(f.D); if (u < -0.012) return; const lat = r.addScaledVector(f.D, -u).length(); cand.push([k, lat, u]); });
        { const r = v.clone().sub(T.C), u = r.dot(T.D); if (u > -0.004 && u < THUMB.tip + 0.01) { const lat = r.addScaledVector(T.D, -u).length(); cand.push([4, lat, u]); } }
        if (!cand.length) continue;
        const lmin = Math.min(...cand.map(c => c[1])); if (lmin > 0.016) continue;
        const ws = cand.map(c => [c[0], Math.exp(-(c[1] - lmin) / 0.0015)]); const s = ws.reduce((a, c) => a + c[1], 0);
        const wl = ws.map(c => [c[0], c[1] / s]).filter(c => c[1] > 0.01);
        const best = wl.reduce((a, c) => c[1] > a[1] ? c : a, wl[0]); counts[best[0] === 4 ? 'thumb' : FINGERS[best[0]].n]++;
        idx.push(i); rest.push(v.clone()); wts.push(wl);
        const n = new THREE.Vector3().fromBufferAttribute(N, i).applyMatrix3(nL); n.x *= sx; nrest.push(n.normalize());
        if (TN) { const tn = new THREE.Vector3().fromBufferAttribute(TN, i).applyMatrix3(nL); tn.x *= sx; tnrest.push(tn.normalize()); }
      }
      if (idx.length) sets.push({ m, P, N, TN, toM, nM, idx, rest, nrest, tnrest, wts });
    }
    for (const k in MIN_VERTS) if (counts[k] < MIN_VERTS[k]) throw Error(`v5r2 hand rig: ${side} ${k} has ${counts[k]} vertices (< ${MIN_VERTS[k]}): not the coach-v3r3-wristfix hand`);
    rigs[side] = { sx, F, T, sets, frames: fr, last: null, counts };
  }
  info.handVerts = Object.fromEntries(Object.entries(rigs).map(([s, r]) => [s, r.counts]));
  // transform of one finger / the thumb for params p: returns function (vec) -> {pos, quat}
  const rotAbout = (p, c, axis, ang, q) => { if (!ang) return; const qq = new THREE.Quaternion().setFromAxisAngle(axis, ang); p.sub(c).applyQuaternion(qq).add(c); q.premultiply(qq); };
  const D2R = Math.PI / 180, Y = new THREE.Vector3(0, 1, 0);
  function fingerXf(f, pm, pp, pd, pa, v, out, q) {
    const u = v.clone().sub(f.M).dot(f.D); out.copy(v); q.identity();
    rotAbout(out, f.Dj, f.K, pd * D2R * ss((u - f.dip + 0.004) / 0.008), q);
    rotAbout(out, f.P, f.K, pp * D2R * ss((u - f.pip + 0.005) / 0.010), q);
    rotAbout(out, f.M, f.K, pm * D2R * ss((u + 0.007) / 0.014), q);
    rotAbout(out, f.M, Y, f.sgnAbd * pa * D2R * ss((u + 0.010) / 0.020), q);
  }
  function thumbXf(T, tf, ta, ti, v, out, q) {
    const u = v.clone().sub(T.C).dot(T.D); out.copy(v); q.identity();
    rotAbout(out, T.Ij, T.K, ti * D2R * ss((u - THUMB.ip + 0.004) / 0.008), q);
    rotAbout(out, T.Mj, T.K, 0.6 * ti * D2R * ss((u - THUMB.mcp + 0.005) / 0.010), q);
    rotAbout(out, T.C, T.K, tf * D2R * ss((u + 0.002) / 0.014), q);
    rotAbout(out, T.C, Y, -ta * D2R * ss((u + 0.002) / 0.014), q);
  }
  function applyHand(side, p) {
    const R = rigs[side]; const key = p.join(','); if (R.last === key) return; R.last = key;
    const o = new THREE.Vector3(), q = new THREE.Quaternion(), acc = new THREE.Vector3(), nq = new THREE.Vector3(), out = new THREE.Vector3();
    for (const S of R.sets) {
      S.idx.forEach((i, k) => {
        const v = S.rest[k]; acc.set(0, 0, 0); let bq = null, bw = -1;
        for (const [fi, w] of S.wts[k]) {
          if (fi === 4) thumbXf(R.T, p[16], p[17], p[18], v, o, q); else { const b = fi * 4; fingerXf(R.F[fi], p[b], p[b + 1], p[b + 2], p[b + 3], v, o, q); }
          acc.addScaledVector(o, w); if (w > bw) { bw = w; bq = q.clone(); }
        }
        out.copy(acc); out.x *= R.sx; out.applyMatrix4(S.toM); S.P.setXYZ(i, out.x, out.y, out.z);
        nq.copy(S.nrest[k]).applyQuaternion(bq); nq.x *= R.sx; nq.applyMatrix3(S.nM).normalize(); S.N.setXYZ(i, nq.x, nq.y, nq.z);
        if (S.TN) { nq.copy(S.tnrest[k]).applyQuaternion(bq); nq.x *= R.sx; nq.applyMatrix3(S.nM).normalize(); S.TN.setXYZ(i, nq.x, nq.y, nq.z); }
      });
      S.P.needsUpdate = true; S.N.needsUpdate = true; if (S.TN) S.TN.needsUpdate = true; S.m.geometry.computeBoundingSphere();
    }
  }
  let t = 0;
  const frameOf = (arr) => arr[((Math.round(t * fps) % arr.length) + arr.length) % arr.length];
  const pose0 = V.pose;
  const _q = new THREE.Quaternion(), e = new THREE.Euler();
  V.pose = function () {
    const d = pose0();
    if (headFrames) {
      const [fl, la, ro] = frameOf(headFrames);
      const qa = (k) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ro * k * D2R)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), la * k * D2R))
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), fl * k * D2R));
      // the copy left neck / head (local) = torso-relative rest; post-multiply the extra rotation (rest axes = torso axes)
      bones.neck.quaternion.multiply(qa(0.45)); bones.head.quaternion.multiply(qa(0.55));
      V.root.updateMatrixWorld(true); d.v5r2Head = [fl, la, ro];
    }
    for (const s in rigs) { const p = frameOf(rigs[s].frames); applyHand(s, p); (d.v5r2Hands || (d.v5r2Hands = {}))[s] = p; }
    return d;
  };
  // hand-vs-hand clash (world): for each vertex of hand A the nearest vertex of hand B (8 mm grid), depth = -(pA - pB) . nB
  // (> 0 = A inside B's surface), plus how many A vertices lie within 3 mm of B (contact). mm.
  function handWorld(side) {
    const out = []; const hand = bones[side + 'Hand'];
    for (const m of meshes) {
      const names = m.skeleton.bones.map(b => b.name), hi = names.indexOf(side + 'Hand'); if (hi < 0) continue;
      const sk = m.skeleton; hand.updateMatrixWorld(true); m.updateMatrixWorld(true);
      const M = new THREE.Matrix4().copy(m.matrixWorld).multiply(m.bindMatrixInverse).multiply(sk.bones[hi].matrixWorld).multiply(sk.boneInverses[hi]).multiply(m.bindMatrix);
      const NM = new THREE.Matrix3().getNormalMatrix(M);
      const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
      for (let i = 0; i < P.count; i++) { let w = 0; for (let k = 0; k < 4; k++) if (J.getComponent(i, k) === hi) w += W.getComponent(i, k); if (w < 0.999) continue;
        out.push([new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(M), new THREE.Vector3().fromBufferAttribute(N, i).applyMatrix3(NM).normalize()]); }
    }
    return out;
  }
  function clash(a = 'left', b = 'right') {
    const A = handWorld(a), B = handWorld(b), G = new Map(), c = 0.008, key = (p) => `${Math.floor(p.x / c)},${Math.floor(p.y / c)},${Math.floor(p.z / c)}`;
    for (const e of B) { const k = key(e[0]); (G.get(k) || G.set(k, []).get(k)).push(e); }
    let worst = -1e9, n2 = 0, contact = 0, at = null;
    for (const [p] of A) {
      const ix = Math.floor(p.x / c), iy = Math.floor(p.y / c), iz = Math.floor(p.z / c); let best = null, bd = 1e9;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (const e of (G.get(`${ix + dx},${iy + dy},${iz + dz}`) || [])) { const d = p.distanceTo(e[0]); if (d < bd) { bd = d; best = e; } }
      if (!best) continue; if (bd < 0.003) contact++;
      const depth = -p.clone().sub(best[0]).dot(best[1]);
      if (depth > 0 && bd < 0.012) { if (depth > worst) { worst = depth; at = p.toArray().map(x => +x.toFixed(4)); } if (depth > 0.002) n2++; }
    }
    return { maxDepthMm: worst > -1e8 ? +(worst * 1000).toFixed(1) : 0, over2mm: n2, contact3mm: contact, verts: A.length, at };
  }
  window.__v5r2 = { setTime(x) { t = x; }, clash, info };
  return info;
}
