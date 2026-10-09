// drill-anim engine (page side). Data-driven pose builder + small LM solver + per-frame QA metrics.
// A spec (specs/<id>.js) is plain data; see README.md for the schema. Units: metres / degrees, floor y=0, up +Y.
(function(){
const E = window.__drill = {};
const T = () => window.__toonT;
const V = a => new (T().Vector3)(...a);
const DEG = Math.PI / 180;
const ease = {
  cos: u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2,
  linear: u => Math.min(1, Math.max(0, u)),
  hold: u => 0,
  smooth: u => { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (u * 6 - 15) + 10); },
};
E.ease = ease;

// ---------- timeline: tracks {name:[[t,v,ease?],...]} piecewise; value at duration wraps to t=0 for a seamless loop
E.sample = function(tl, t) {
  const out = {};
  for (const [k, keys] of Object.entries(tl.tracks || {})) {
    let v = keys[0][1];
    for (let i = 0; i < keys.length; i++) {
      const [ta, va] = keys[i], nx = keys[i + 1] || [tl.duration, keys[0][1]];
      const [tb, vb] = nx;
      if (t >= ta && t < tb) { const e = ease[nx[2] || keys[i][2] || 'cos'] || ease.cos; v = va + (vb - va) * e((t - ta) / Math.max(tb - ta, 1e-6)); break; }
      if (t >= tb) v = vb;
    }
    out[k] = v;
  }
  return out;
};
E.pulseAt = function(hl, tl, t) {
  if (hl.pulseTrack) { const p = E.sample(tl, t)[hl.pulseTrack] ?? 0; return (hl.pulseBase ?? 0.25) + (1 - (hl.pulseBase ?? 0.25)) * p; }
  const TL = tl.duration; let g = 0; const w = hl.pulseWidth || 0.45;
  for (const tp of hl.pulseAt || []) for (const s of [-TL, 0, TL]) g = Math.max(g, Math.exp(-(((t - tp - s) / w) ** 2)));
  return (hl.pulseBase ?? 0.25) + (1 - (hl.pulseBase ?? 0.25)) * g;
};

// ---------- descriptor blending: base + sum_k p_k * (delta_k - base); deltas give ABSOLUTE values at p=1
function blend(base, deltas, params) {
  const walk = (b, ds) => {
    if (typeof b === 'number') { let v = b; for (const [d, p] of ds) if (typeof d === 'number') v += p * (d - b); return v; }
    if (Array.isArray(b)) return b.map((x, i) => walk(x, ds.map(([d, p]) => [Array.isArray(d) ? d[i] : undefined, p]).filter(z => z[0] !== undefined)));
    if (b && typeof b === 'object') { const o = {}; for (const k of Object.keys(b)) o[k] = walk(b[k], ds.filter(([d]) => d && typeof d === 'object' && k in d).map(([d, p]) => [d[k], p])); return o; }
    return b;
  };
  const ds = Object.entries(deltas || {}).filter(([k]) => params[k]).map(([k, d]) => [d, params[k]]);
  return walk(base, ds);
}
E.blend = blend;

// ---------- rest data
E.init = function() {
  if (E.R) return E;
  const v = flareInspector.viewer, m = v.motion; m.reset(); v.coach.updateMatrixWorld(true);
  const M = m.getMetrics(); E.R = M.joints; E.L = M.expectedLengths;
  // foot point clouds (shoe verts on the foot bone, rest, relative to the rest ankle)
  E.footPts = {}; E.handPts = {};
  const q = new (T().Vector3)();
  for (const side of ['left', 'right']) { E.footPts[side] = []; E.handPts[side] = []; }
  v.coach.traverse(o => { if (!o.isSkinnedMesh || !o.visible) return; const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bs = o.skeleton.bones;
    const isShoe = /Sneakers|Soles/.test(o.name), isBody = o.name === 'Coach_Body';
    if (!isShoe && !isBody) return;
    for (let i = 0; i < g.attributes.position.count; i += 2) { let bi = -1, bw = -1; for (let k = 0; k < 4; k++) if (sw.getComponent(i, k) > bw) { bw = sw.getComponent(i, k); bi = si.getComponent(i, k); }
      const bn = bs[bi].name; o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld);
      if (isShoe && /Foot/.test(bn)) { const s = bn.startsWith('left') ? 'left' : 'right'; E.footPts[s].push(q.clone().sub(V(E.R[s + 'Ankle']))); }
      if (isBody && /Hand$/.test(bn) && bw > 0.9) { const s = bn.startsWith('left') ? 'left' : 'right'; E.handPts[s].push(q.clone().sub(V(E.R[s + 'Wrist']))); } } });
  return E;
};

// ---------- frames / orientations
function rotList(list) { const Q = T().Quaternion; const q = new Q(); for (const [ax, deg] of list || []) q.premultiply(new Q().setFromAxisAngle(V(ax).normalize(), deg * DEG)); return q; }
function basisQ(up, front) { // rest +Y -> up, rest +Z -> front
  const y = V(up).normalize(), z = V(front); z.addScaledVector(y, -z.dot(y)).normalize(); const x = y.clone().cross(z).normalize();
  return new (T().Quaternion)().setFromRotationMatrix(new (T().Matrix4)().makeBasis(x, y, z)); }
function orient(o) { if (!o) return new (T().Quaternion)(); const q = o.up ? basisQ(o.up, o.front) : new (T().Quaternion)(); return rotList(o.rot).multiply(q); }
function palmFrame(side) { const s = side === 'left' ? 1 : -1; return [V([s * 0.98253144, 0.05483374, 0.17783482]), V([s * 0.06068526, -0.99777448, -0.02762938])]; }
function frameQ(f, n) { f = f.clone().normalize(); const z = n.clone().addScaledVector(f, -n.dot(f)).normalize(); return new (T().Quaternion)().setFromRotationMatrix(new (T().Matrix4)().makeBasis(f.clone().cross(z).normalize(), f, z)); }
E.handQ = function(side, fingerW, normalW) { const [pl, pn] = palmFrame(side); return frameQ(fingerW, normalW).multiply(frameQ(pl, pn).invert()); };

// body state from descriptor + solver vars
function body(D, x) {
  const R = E.R, rp = V(R.pelvis);
  const P = V(D.pelvis).add(V([x.px || 0, x.py || 0, x.pz || 0]));
  const hipsO = structuredClone(D.hips || {}); (hipsO.rot || []).forEach((r, i) => { r[1] += x['h' + i] || 0; });
  const qP = orient(hipsO);
  const bodyRot = structuredClone(D.chest?.body || []); bodyRot.forEach((r, i) => { r[1] += x['b' + i] || 0; });
  const waistRot = structuredClone(D.chest?.waist || []); waistRot.forEach((r, i) => { r[1] += x['c' + i] || 0; });
  const qB = rotList(bodyRot).multiply(qP);
  const qWw = rotList(waistRot); const qT = qB.clone().invert().multiply(qWw).multiply(qB); // waist bend given in world axes
  const waistRest = V(R.waist);
  const hasT = waistRot.length > 0;
  const up = src => hasT ? waistRest.clone().sub(rp).applyQuaternion(qB).add(V(src).sub(waistRest).applyQuaternion(qB.clone().multiply(qT))).add(P)
                         : V(src).sub(rp).applyQuaternion(qB).add(P);
  const low = src => V(src).sub(rp).applyQuaternion(qP).add(P);
  const qUpper = hasT ? qB.clone().multiply(qT) : qB.clone();
  return { P, qP, qB, qT: hasT ? qT : null, qUpper, up, low };
}
E.body = body;

function footPose(side, F, B) {
  // F: {mode:'floor', at:[x,z], heading:deg (0 = toes +Z), pitch:deg (+ = toes down), roll:deg, pole:[x,y,z] world | poleRel:[...] in hips frame}
  //    {mode:'free', frame:'hips'|'world', ankle:[rest or world xyz], rot:[[axis,deg]...] (world, applied to the carried rest foot), pole...}
  const Q = T().Quaternion;
  if (F.mode === 'floor') {
    const q = new Q().setFromAxisAngle(V([0, 1, 0]), (F.heading || 0) * DEG).multiply(new Q().setFromAxisAngle(V([1, 0, 0]), (F.pitch || 0) * DEG)).multiply(new Q().setFromAxisAngle(V([0, 0, 1]), (F.roll || 0) * DEG));
    let mn = 9; for (const p of E.footPts[side]) { const y = p.clone().applyQuaternion(q).y; if (y < mn) mn = y; }
    const ankle = V([F.at[0], (F.floor ?? 0) + (F.lift || 0) - mn, F.at[1]]);
    return { ankle, q };
  }
  const carry = F.frame === 'world' ? null : B.qP;
  const ankle = carry ? V(F.ankle).sub(V(E.R.pelvis)).applyQuaternion(carry).add(B.P) : V(F.ankle);
  const q = rotList(F.rot).multiply(carry ? carry.clone() : new Q());
  return { ankle, q };
}
function handPose(side, H, B) {
  // H: {mode:'floor', at:[x,z], finger:[dx,dz]} | {mode:'free', frame:'chest'|'hips'|'world', wrist:[rest xyz], finger:[rest dir], normal:[rest dir]}
  const m = flareInspector.viewer.motion;
  if (H.mode === 'floor') { const g = m.getGroundHandPose(side, [H.finger[0], 0, H.finger[1]], [H.at[0], 0, H.at[1]]); return { wrist: V(g.wrist), q: new (T().Quaternion)(...g.handQuaternion), floor: true }; }
  const qC = H.frame === 'world' ? new (T().Quaternion)() : H.frame === 'hips' ? B.qP : B.qUpper;
  const toW = a => H.frame === 'world' ? V(a) : H.frame === 'hips' ? B.low(a) : B.up(a);
  const q = E.handQ(side, V(H.finger).applyQuaternion(qC), V(H.normal).applyQuaternion(qC));
  // palmAt: place the palm joint (not the wrist) at a rest-frame point, e.g. a body-surface point + offset along its normal
  if (H.palmAt) return { wrist: toW(H.palmAt).sub(V(E.R[side + 'Palm']).sub(V(E.R[side + 'Wrist'])).applyQuaternion(E.restBQ[side + 'Hand'].clone().invert()).applyQuaternion(q)), q, floor: false };
  return { wrist: toW(H.wrist), q, floor: false };
}
function poleW(L, B, def) { if (L.pole) return V(L.pole); if (L.poleUp) return B.up(L.poleUp); if (L.poleLow) return B.low(L.poleLow); return def; }

// resolve limbs for a body state (hands mix between plant & free with an arc)
function limbs(D, B) {
  const out = {};
  for (const side of ['left', 'right']) {
    const HD = D.hands[side]; const w = ease.smooth(HD.w || 0);
    const a = handPose(side, HD.plant || HD, B); let hw = a.wrist, hq = a.q, locked = !!(a.floor && w < 1e-4);
    if (HD.free && w > 0) { const b = handPose(side, HD.free, B); hw = a.wrist.clone().lerp(b.wrist, w); hq = a.q.clone().slerp(b.q, w);
      if (HD.arc) hw.add(V(HD.arcDir || [0, 1, 0]).multiplyScalar(HD.arc * Math.sin(Math.PI * w))); }
    const sh = B.up(E.R[side + 'Shoulder']); const shift = D.shoulders?.[side] || D.shoulders?.shift; if (shift) sh.add(V(shift).applyQuaternion(B.qUpper));
    const ep = poleW(HD.free && w > 0.5 ? HD.free : (HD.plant || HD), B, sh.clone().add(V([0, -0.3, -0.3])));
    const FD = D.feet[side]; const f = footPose(side, FD, B);
    const hip = B.low(E.R[side + 'Hip']);
    const kp = poleW(FD, B, hip.clone().add(f.ankle).multiplyScalar(0.5).add(V([0, 0, 0.4]).applyQuaternion(B.qP)));
    out[side] = { shift: shift ? V(shift).applyQuaternion(B.qUpper) : null, wrist: hw, hq, locked, elbowPole: ep, ankle: f.ankle, fq: f.q, kneePole: kp, shoulder: sh, hip, relax: HD.relax ?? (HD.plant && HD.plant.mode === 'floor' && HD.free ? ease.smooth(Math.min(1, w * 2.5)) : (locked ? 0 : 1)) };
  }
  return out;
}

// straight-limb reach for an elbow/knee angle
function reachFor(a, b, ang) { return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(ang * DEG)); }

// ---------- solver: vars (names) minimise residuals of D.constraints, regularised
function residuals(D, x, names) {
  const B = body(D, x), Lm = limbs(D, B), r = [];
  for (const c of D.constraints || []) {
    const w = c.weight ?? 1; if (!w) continue;
    if (c.type === 'reach') {
      const [side, kind] = c.limb.split(/(?=[A-Z])/); const s = side, arm = kind === 'Arm';
      if (arm && (D.hands[s].w || 0) > 1e-4) continue; // a lifted hand no longer constrains the body
      const p0 = arm ? Lm[s].shoulder : Lm[s].hip, p1 = arm ? Lm[s].wrist : Lm[s].ankle;
      const L = arm ? reachFor(E.L[s + 'UpperArm'], E.L[s + 'Forearm'], c.angle) : reachFor(E.L[s + 'Thigh'], E.L[s + 'Shin'], c.angle);
      r.push((p0.distanceTo(p1) - L) * 1000 * w);
    } else if (c.type === 'joint') {
      const src = E.R[c.joint]; const isLow = /Hip|pelvis/.test(c.joint); const p = isLow ? B.low(src) : B.up(src);
      r.push((p.dot(V(c.axis || [0, 1, 0])) - c.value) * 1000 * w);
    } else if (c.type === 'legAlign') { // keep hip->ankle along the hips-frame direction (flex deg forward of the rest leg line): rigid-body plank/push-up
      const s = c.limb.startsWith('left') ? 'left' : 'right'; const d = Lm[s].ankle.clone().sub(Lm[s].hip).normalize();
      const f = (c.flex || 0) * DEG; const want = V([0, -Math.cos(f), Math.sin(f)]).applyQuaternion(B.qP);
      const e = d.sub(want); r.push(e.x * 1000 * w * 0.3, e.y * 1000 * w * 0.3, e.z * 1000 * w * 0.3);
    } else if (c.type === 'mid') { // elbow / knee position (analytic two-bone with the limb's pole) at a world point; axes: which coords count
      const s = c.limb.startsWith('left') ? 'left' : 'right', arm = /Arm$/.test(c.limb); const l = Lm[s];
      const R0 = arm ? l.shoulder : l.hip, T0 = arm ? l.wrist : l.ankle, P0 = arm ? l.elbowPole : l.kneePole;
      const a = arm ? E.L[s + 'UpperArm'] : E.L[s + 'Thigh'], b = arm ? E.L[s + 'Forearm'] : E.L[s + 'Shin'];
      const M = E.twoBoneMid(R0, T0, a, b, P0); const ax = c.axes || [1, 1, 1];
      for (let k = 0; k < 3; k++) if (ax[k]) r.push((M.getComponent(k) - c.at[k]) * 1000 * w);
    } else if (c.type === 'point') { // a rest-frame body point (chest or hips frame) at a world height
      const p = c.frame === 'hips' ? B.low(c.at) : B.up(c.at); r.push((p.dot(V(c.axis || [0, 1, 0])) - c.value) * 1000 * w);
    }
  }
  const reg = D.solve?.reg || {}; for (const n of names) r.push((x[n] || 0) * (reg[n] ?? (n.startsWith('p') ? 30 : 0.3)));
  return r;
}
E.twoBoneMid = function(R0, T0, a, b, P0) { const u = T0.clone().sub(R0); let d = u.length(); u.normalize(); d = Math.min(d, a + b - 1e-6);
  const ap = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - ap * ap)); const n = P0.clone().sub(R0); n.addScaledVector(u, -n.dot(u)).normalize();
  return R0.clone().addScaledVector(u, ap).addScaledVector(n, h); };
E.solve = function(D, warm) {
  // Levenberg-Marquardt with adaptive damping and a per-step clamp (positions 2 cm, angles 3 deg) so it cannot jump branches
  const names = D.solve?.vars || []; let x = {}; for (const n of names) x[n] = warm?.[n] ?? 0;
  if (!names.length) return x;
  const nV = names.length; const cost = r => r.reduce((a, v) => a + v * v, 0);
  let r0 = residuals(D, x, names), c0 = cost(r0), lam = 1e-3;
  for (let it = 0; it < (D.solve.iters || 40); it++) {
    const J = [];
    for (const n of names) { const h = n.startsWith('p') ? 1e-5 : 1e-3; const y = { ...x, [n]: x[n] + h }; const r1 = residuals(D, y, names); J.push(r1.map((v, i) => (v - r0[i]) / h)); }
    const A0 = [...Array(nV)].map(() => Array(nV).fill(0)), b0 = Array(nV).fill(0);
    for (let i = 0; i < nV; i++) { for (let j = 0; j < nV; j++) for (let q = 0; q < r0.length; q++) A0[i][j] += J[i][q] * J[j][q]; for (let q = 0; q < r0.length; q++) b0[i] -= J[i][q] * r0[q]; }
    let improved = false;
    for (let tries = 0; tries < 8 && !improved; tries++) {
      const A = A0.map((row, i) => row.map((v, j) => v + (i === j ? lam * (A0[i][i] + 1e-6) : 0))), b = b0.slice();
      for (let i = 0; i < nV; i++) { let p = i; for (let j = i + 1; j < nV; j++) if (Math.abs(A[j][i]) > Math.abs(A[p][i])) p = j; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
        for (let j = i + 1; j < nV; j++) { const f = A[j][i] / A[i][i]; for (let k = i; k < nV; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; } }
      const dx = Array(nV).fill(0); for (let i = nV - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < nV; k++) s -= A[i][k] * dx[k]; dx[i] = s / A[i][i]; }
      names.forEach((n, i) => { const lim = n.startsWith('p') ? 0.02 : 3; dx[i] = Math.max(-lim, Math.min(lim, dx[i])); });
      const y = { ...x }; names.forEach((n, i) => { y[n] += dx[i]; }); const r1 = residuals(D, y, names), c1 = cost(r1);
      if (c1 < c0) { x = y; r0 = r1; const dc = c0 - c1; c0 = c1; lam = Math.max(lam / 3, 1e-7); improved = true; if (dc < 1e-10) it = 1e9; } else lam *= 4;
    }
    if (!improved) break;
  }
  E.lastCost = c0; return x;
};
// ---------- apply a spec pose for params
E.pose = function(spec, params, warm) {
  E.init(); const v = flareInspector.viewer, m = v.motion;
  const D = blend(spec.pose.base, spec.pose.deltas, params);
  const x = E.solve(D, warm); const B = body(D, x), Lm = limbs(D, B);
  const pose = { version: 1, pelvis: B.P.toArray(), bodyQuaternion: B.qB.toArray(), pelvisQuaternion: B.qP.toArray(), groundLock: false, limbs: {} };
  if (B.qT) pose.torsoQuaternion = B.qT.toArray();
  for (const s of ['left', 'right']) { const l = Lm[s];
    pose.limbs[s] = { wrist: l.wrist.toArray(), handQuaternion: l.hq.toArray(), elbowPole: l.elbowPole.toArray(), ankle: l.ankle.toArray(), kneePole: l.kneePole.toArray(), footQuaternion: l.fq.toArray(), handLocked: l.locked && !l.shift };
    for (const k of ['upperArmTwist', 'elbowTwist']) if (D.hands[s][k] !== undefined) pose.limbs[s][k] = D.hands[s][k] * DEG;
    for (const k of ['thighTwist', 'kneeTwist']) if (D.feet[s][k] !== undefined) pose.limbs[s][k] = D.feet[s][k] * DEG; }
  m.applyPose(pose, { playback: false }); v.coach.updateMatrixWorld(true); E._jo = null;
  if (Lm.left.shift || Lm.right.shift) E.shiftShoulders(Lm, pose);
  window.__setRelax(Lm.left.relax, Lm.right.relax);
  // surface contact for free hands that touch the body (hands.<side>.touch = {clear, pull, from}): push the wrist out along the
  // surface normal while the hand penetrates, and (while w > from) pull it in until it rests `clear` above the surface.
  const touch = {};
  for (const s of ['left', 'right']) { const HD = D.hands[s], tc = HD.touch; if (!tc) continue; const w = HD.free ? (HD.w || 0) : 1; if (!(w > 1e-3)) continue;
    touch[s] = E.touchResolve(pose, s, tc, w, () => { if (Lm.left.shift || Lm.right.shift) E.shiftShoulders(Lm, pose); window.__setRelax(Lm.left.relax, Lm.right.relax); }); }
  window.__toonUni.uRelax.value = [Lm.left.relax, Lm.right.relax]; window.__setRelax(Lm.left.relax, Lm.right.relax);
  return { x, D, touch, warn: m.getMetrics().warnings || [], locked: { left: Lm.left.locked, right: Lm.right.locked } };
};

// ---------- QA metrics for the current pose
E.metrics = function(spec, full) {
  const v = flareInspector.viewer, m = v.motion, M = m.getMetrics(), J = Object.assign({}, M.joints, E._jo || {});
  const ang = (a, b, c) => V(J[a]).sub(V(J[b])).angleTo(V(J[c]).sub(V(J[b]))) / DEG;
  const out = { joints: J, warn: M.warnings || [] };
  out.elbow = { left: ang('leftShoulder', 'leftElbow', 'leftWrist'), right: ang('rightShoulder', 'rightElbow', 'rightWrist') };
  out.knee = { left: ang('leftHip', 'leftKnee', 'leftAnkle'), right: ang('rightHip', 'rightKnee', 'rightAnkle') };
  // joint direction sanity in each bone's rest frame (world rest -> current rotation of the parent bone)
  const bq = n => { const b = v.coach.getObjectByName(n); return b.getWorldQuaternion(new (T().Quaternion)()); };
  if (!E.restBQ) { E.restBQ = {}; }
  const rel = n => bq(n).multiply(E.restBQ[n].clone().invert());
  const lim = {};
  for (const s of ['left', 'right']) {
    // knee must flex backwards, elbow forwards (rest frame of the proximal bone)
    const shin = V(J[s + 'Ankle']).sub(V(J[s + 'Knee'])).applyQuaternion(rel(s + 'Thigh').invert()).normalize();
    const fore = V(J[s + 'Wrist']).sub(V(J[s + 'Elbow'])).applyQuaternion(rel(s + 'UpperArm').invert()).normalize();
    const thigh = V(J[s + 'Knee']).sub(V(J[s + 'Hip'])).applyQuaternion(rel('pelvis').invert()).normalize();
    const sg = s === 'left' ? 1 : -1;
    lim[s] = { kneeFlexDirZ: +shin.z.toFixed(3), elbowFlexDirZ: +fore.z.toFixed(3), hipFlexDeg: +(Math.atan2(thigh.z, -thigh.y) / DEG).toFixed(1), hipAbdDeg: +(Math.atan2(thigh.x * sg, -thigh.y) / DEG).toFixed(1) };
  }
  const tq = M.torsoQuaternion ? new (T().Quaternion)(...M.torsoQuaternion) : null; lim.waistBendDeg = tq ? +(2 * Math.acos(Math.min(1, Math.abs(tq.w))) / DEG).toFixed(1) : 0;
  const pq = new (T().Quaternion)(...M.pelvisQuaternion), bqq = new (T().Quaternion)(...M.bodyQuaternion);
  lim.pelvisToChestDeg = +(pq.angleTo(bqq) / DEG).toFixed(1); lim.neckDeg = 0; // head/neck are rigid with the chest in this rig
  out.limits = lim;
  // contact centroids
  const p = new (T().Vector3)(); let minY = 9, minName = ''; const cen = {};
  const keys = { rightHand: 'handR', leftHand: 'handL', rightFoot: 'footR', leftFoot: 'footL' };
  for (const k of Object.values(keys)) cen[k] = [0, 0, 0, 0];
  v.coach.traverse(o => { if (!o.isSkinnedMesh || !o.visible) return; const g = o.geometry, n = g.attributes.position.count, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bs = o.skeleton.bones;
    for (let i = 0; i < n; i += 3) { o.getVertexPosition(i, p); p.applyMatrix4(o.matrixWorld); if (p.y < minY) { minY = p.y; minName = o.name; }
      let bi = -1, bw = -1; for (let k = 0; k < 4; k++) if (sw.getComponent(i, k) > bw) { bw = sw.getComponent(i, k); bi = si.getComponent(i, k); }
      const c = cen[keys[bs[bi].name]]; if (c && bw > 0.9) { c[0] += p.x; c[1] += p.y; c[2] += p.z; c[3]++; } } });
  for (const k in cen) { const c = cen[k]; cen[k] = c[3] ? [c[0] / c[3], c[1] / c[3], c[2] / c[3]] : null; }
  out.minY = minY; out.minYMesh = minName; out.cen = cen;
  // capsule self-clip (non-adjacent pairs); gap < 0 = overlap of the capsule hulls
  const seg = { torso: ['pelvis', 'shoulderCenter', 0.115], head: ['neck', 'head', 0.095] };
  for (const s of ['left', 'right']) { const S = s[0].toUpperCase();
    Object.assign(seg, { ['upperArm' + S]: [s + 'Shoulder', s + 'Elbow', 0.042], ['forearm' + S]: [s + 'Elbow', s + 'Wrist', 0.034], ['hand' + S]: [s + 'Wrist', s + 'Palm', 0.028],
      ['thigh' + S]: [s + 'Hip', s + 'Knee', 0.068], ['shin' + S]: [s + 'Knee', s + 'Ankle', 0.048], ['foot' + S]: [s + 'Ankle', s + 'Toe', 0.045] }); }
  const adj = new Set(['torso|head', 'torso|upperArmL', 'torso|upperArmR', 'torso|thighL', 'torso|thighR', 'thighL|thighR', 'upperArmL|forearmL', 'upperArmR|forearmR', 'forearmL|handL', 'forearmR|handR', 'thighL|shinL', 'thighR|shinR', 'shinL|footL', 'shinR|footR']);
  for (const a of spec.qa?.allowContact || []) adj.add(a);
  const segDist = (a0, a1, b0, b1) => { const d1 = a1.clone().sub(a0), d2 = b1.clone().sub(b0), r = a0.clone().sub(b0); const aa = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
    let s2, t2; const c = d1.dot(r), b = d1.dot(d2), den = aa * e - b * b; s2 = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t2 = (b * s2 + f) / e;
    if (t2 < 0) { t2 = 0; s2 = Math.min(1, Math.max(0, -c / aa)); } else if (t2 > 1) { t2 = 1; s2 = Math.min(1, Math.max(0, (b - c) / aa)); }
    return a0.clone().addScaledVector(d1, s2).distanceTo(b0.clone().addScaledVector(d2, t2)); };
  const ks = Object.keys(seg); let worst = { gap: 9 }; const pairs = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const A = ks[i], Bk = ks[j]; if (adj.has(A + '|' + Bk) || adj.has(Bk + '|' + A)) continue;
    const [a0, a1, ra] = seg[A], [b0, b1, rb] = seg[Bk]; const gap = segDist(V(J[a0]), V(J[a1]), V(J[b0]), V(J[b1])) - ra - rb;
    if (gap < 0.02) pairs.push([A + '|' + Bk, +(gap * 1000).toFixed(1)]); if (gap < worst.gap) worst = { pair: A + '|' + Bk, gap }; }
  out.clip = { worstPair: worst.pair, worstGapMm: +(worst.gap * 1000).toFixed(1), near: pairs };
  return out;
};
// scapular protraction/retraction/elevation/depression: the rig's shoulder joint is rigid with the chest, so after applyPose the
// scapula bone is moved by the shift and the arm is re-solved (two-bone, same bend plane) from the shifted shoulder to the same wrist.
// surface contact for a free hand that touches the body ({clear, pull, from, iters, exclude}): push the wrist out along the surface
// normal while the hand penetrates and (while w > from) pull it in until it rests `clear` above the surface. Returns the shift (mm).
E.touchResolve = function(pose, s, tc, w, after) {
  const v = flareInspector.viewer, m = v.motion;
  const clear = tc.clear ?? 0.002, from = tc.from ?? 0.75, pull = (tc.pull ?? 1) * ease.smooth((w - from) / (1 - from)); let shift = 0;
  for (let it = 0; it < (tc.iters ?? 12); it++) { const c = E.handClip([s], { exclude: tc.exclude })[s]; if (!c.normal) break;
    const gap = c.minMm / 1000; let d = 0; if (gap < clear) d = clear - gap; else if (pull > 0) d = -(gap - clear) * pull;
    if (Math.abs(d) < 0.0002) break; const n = V(c.normal); // radial surface normal; push out (d > 0) or pull in (d < 0) along it
    pose.limbs[s].wrist = V(pose.limbs[s].wrist).addScaledVector(n, d).toArray(); shift += d;
    m.applyPose(pose, { playback: false }); v.coach.updateMatrixWorld(true); after && after(); }
  return +(shift * 1000).toFixed(2);
};
E.shiftShoulders = function(Lm, pose) {
  const t = T(), v = flareInspector.viewer, M = v.motion.getMetrics(), J = M.joints; E._jo = {};
  const setW = (b, pos, q) => { const par = b.parent; par.updateMatrixWorld(true); const pq = par.getWorldQuaternion(new t.Quaternion());
    b.position.copy(par.worldToLocal(pos.clone())); b.quaternion.copy(pq.invert().multiply(q)); b.updateMatrixWorld(true); };
  const wq = b => b.getWorldQuaternion(new t.Quaternion());
  for (const s of ['left', 'right']) { const sh = Lm[s].shift; if (!sh) continue;
    const S0 = V(J[s + 'Shoulder']), E0 = V(J[s + 'Elbow']), W0 = V(J[s + 'Wrist']), W = V(pose.limbs[s].wrist), S1 = S0.clone().add(sh);
    const L1 = E.L[s + 'UpperArm'], L2 = E.L[s + 'Forearm']; let d = S1.distanceTo(W); d = Math.min(d, L1 + L2 - 1e-6);
    const ax = W.clone().sub(S1).normalize(); // bend plane from the limb's elbow pole (stable when the arm is straight)
    const pv = Lm[s].elbowPole.clone().sub(S1); const pn = pv.addScaledVector(ax, -pv.dot(ax)).normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const E1 = S1.clone().addScaledVector(ax, a).addScaledVector(pn, h);
    const sc = v.coach.getObjectByName(s + 'Scapula'), ua = v.coach.getObjectByName(s + 'UpperArm'), fa = v.coach.getObjectByName(s + 'Forearm'), hd = v.coach.getObjectByName(s + 'Hand');
    const qs = wq(sc), qu = wq(ua), qf = wq(fa), qh = wq(hd), ps = sc.getWorldPosition(new t.Vector3()), pu = ua.getWorldPosition(new t.Vector3()), pf = fa.getWorldPosition(new t.Vector3()), ph = hd.getWorldPosition(new t.Vector3());
    const du = new t.Quaternion().setFromUnitVectors(E0.clone().sub(S0).normalize(), E1.clone().sub(S1).normalize());
    const df = new t.Quaternion().setFromUnitVectors(W0.clone().sub(E0).normalize(), W.clone().sub(E1).normalize());
    setW(sc, ps.clone().add(sh), qs);
    setW(ua, S1.clone().add(pu.clone().sub(S0).applyQuaternion(du)), du.clone().multiply(qu));
    setW(fa, E1.clone().add(pf.clone().sub(E0).applyQuaternion(df)), df.clone().multiply(qf));
    setW(hd, ph.clone().add(W.clone().sub(W0)), qh);
    E._jo[s + 'Shoulder'] = S1.toArray(); E._jo[s + 'Elbow'] = E1.toArray(); E._jo[s + 'Wrist'] = W.toArray(); E._jo[s + 'Palm'] = V(J[s + 'Palm']).add(W.clone().sub(W0)).toArray(); }
  v.coach.updateMatrixWorld(true);
};
E.captureRestBoneQ = function() { const v = flareInspector.viewer; v.motion.reset(); v.coach.updateMatrixWorld(true); E.restBQ = {};
  for (const n of ['pelvis', 'leftThigh', 'rightThigh', 'leftUpperArm', 'rightUpperArm', 'leftHand', 'rightHand']) E.restBQ[n] = v.coach.getObjectByName(n).getWorldQuaternion(new (T().Quaternion)()); };
})();
// ---------- per-frame driver (camera, uniforms, solver dispatch, passes)
(function(){
const E = window.__drill; const T = () => window.__toonT; const V = a => new (T().Vector3)(...a);
E.applyAt = function(spec, t, warm) {
  const params = E.sample(spec.timeline, t);
  if (spec.solver === 'sideplank-v7') { // deltoids-A: the approved v7 solver, unchanged (anim-sideplank.js __pose6)
    const so = __pose6(window.__toonCfg, params.dip || 0, spec.solverArgs.HC, warm); window.__toonUni.uRelax.value = [0, 0];
    const touch = {}; if (spec.solverArgs.touch) touch.left = E.touchResolve(window.__lastPose6, 'left', spec.solverArgs.touch, 1, null);
    return { params, x: so.x, warn: so.warn, beta: so.beta, touch, locked: { left: false, right: true } };
  }
  const r = E.pose(spec, params, warm); return { params, x: r.x, warn: r.warn, locked: r.locked, touch: r.touch };
};
E.setupCamera = function(spec, size) {
  const v = flareInspector.viewer, c = spec.camera; E.applyAt(spec, c.at ?? 0, null);
  const J = Object.assign({}, v.motion.getMetrics().joints, E._jo || {}); const box = new (T().Box3)();
  for (const j of c.fit) box.expandByPoint(V(J[j]));
  box.expandByScalar(c.pad ?? 0.1); v.fitBounds(box, V(c.dir), c.k ?? 1.0); v.camera.aspect = 1; v.camera.updateProjectionMatrix();
  if (c.fov) { v.camera.fov = c.fov; v.camera.updateProjectionMatrix(); }
  E.cam0 = { pos: v.camera.position.clone(), tgt: v.controls.target.clone() }; v.playing = false; return true;
};
E.frame = function(spec, t, f, warm, opts) {
  const v = flareInspector.viewer, U = window.__toonUni;
  const r = E.applyAt(spec, t, warm);
  const TL = spec.timeline.duration;
  U.uBreath.value = (spec.breath ?? 0.0018) * Math.sin(2 * Math.PI * t / (TL / 2));
  U.uPulse.value = E.pulseAt(spec.highlight, spec.timeline, t);
  const drift = f < 0 ? 0 : Math.sin(2 * Math.PI * t / (spec.camera.driftPeriod ?? TL) + (spec.camera.driftPhase ?? 0)) * (spec.camera.drift ?? 0.9) * Math.PI / 180; // yaw sway (deg) about the target; driftPeriod must divide the loop
  const c0 = E.cam0; const off = c0.pos.clone().sub(c0.tgt).applyAxisAngle(V([0, 1, 0]), drift); v.camera.position.copy(c0.tgt).add(off); v.camera.lookAt(c0.tgt); v.camera.updateMatrixWorld();
  window.__props?.update();
  const M = E.metrics(spec, opts.full); const J = M.joints;
  const hc = E.handClip(['left', 'right'], { exclude: spec.qa?.handClipExclude }); M.handClip = { left: hc.left.minMm, right: hc.right.minMm, leftBone: hc.left.bone || null, rightBone: hc.right.bone || null }; M.touch = r.touch || {};
  M.hipMid = V(J.rightHip).add(V(J.leftHip)).multiplyScalar(0.5).toArray(); M.locked = r.locked; M.x = r.x; M.solverWarn = r.warn; M.params = r.params; M.pulse = U.uPulse.value;
  if (r.beta !== undefined) M.beta = r.beta;
  const proj = {}; const S = opts.size;
  for (const k of new Set([...(spec.shadow?.joints || []), 'pelvis', 'head'])) { const a = J[k] || J[k.replace('headJ', 'head')]; const q = V([a[0], 0, a[2]]).project(v.camera); proj[k] = [(q.x + 1) / 2 * S, (1 - q.y) / 2 * S]; }
  M.proj = proj; delete M.joints; M.J = J;
  const shot = () => v.renderer.domElement.toDataURL('image/png');
  if (opts.mask) { window.__glowU.value = 6; v.renderer.render(v.scene, v.camera); const d = shot(); window.__glowU.value = 0; return { mask: d, M }; }
  window.__glowU.value = 0; v.renderer.render(v.scene, v.camera); const main = shot();
  window.__glowU.value = 1; v.renderer.render(v.scene, v.camera); const glow = shot(); window.__glowU.value = 0;
  return { main, glow, M };
};
})();
// ---------- hand-vs-body mesh penetration (signed distance of each hand vertex to the nearest vertex of each outer layer, along that vertex's skinned normal)
// Fast CPU skinning: rest positions/normals, skin indices/weights cached once as typed arrays; bone matrices from skeleton.boneMatrices.
(function(){
const E = window.__drill; const T = () => window.__toonT;
const LAYERS = ['Coach_Body', 'Mesh001', 'Mesh005', 'Mesh005_1', 'Coach_Training_Shorts', 'Toon_Mannequin_Head_v5'];
E.meshCache = function() {
  if (E._mc) return E._mc; const v = flareInspector.viewer; const L = [];
  v.coach.traverse(o => { if (!o.isSkinnedMesh || !LAYERS.includes(o.name)) return; const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bs = o.skeleton.bones, n = g.attributes.position.count;
    const P = g.attributes.position, N = g.attributes.normal; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint8Array(n * 4), wt = new Float32Array(n * 4), dom = new Array(n), domI = new Uint8Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = P.getX(i); pos[i * 3 + 1] = P.getY(i); pos[i * 3 + 2] = P.getZ(i); nor[i * 3] = N.getX(i); nor[i * 3 + 1] = N.getY(i); nor[i * 3 + 2] = N.getZ(i);
      let bi = -1, bw = -1; for (let k = 0; k < 4; k++) { idx[i * 4 + k] = si.getComponent(i, k); wt[i * 4 + k] = sw.getComponent(i, k); if (wt[i * 4 + k] > bw) { bw = wt[i * 4 + k]; bi = idx[i * 4 + k]; } } dom[i] = [bs[bi].name, bw]; domI[i] = bi; }
    L.push({ o, dom, domI, pos, nor, idx, wt, n }); });
  E._mc = L; return L; };
// skinned world position (and optionally normal) of vertex i; live=true reads the (morphed) position attribute
function skin(l, i, out, nout, live) { const o = l.o, sk = o.skeleton, bm = sk.boneMatrices, B = o.bindMatrix.elements, Bi = o.bindMatrixInverse.elements, W = o.matrixWorld.elements;
  let x, y, z; if (live) { const P = o.geometry.attributes.position; x = P.getX(i); y = P.getY(i); z = P.getZ(i); } else { x = l.pos[i * 3]; y = l.pos[i * 3 + 1]; z = l.pos[i * 3 + 2]; }
  const bx = B[0] * x + B[4] * y + B[8] * z + B[12], by = B[1] * x + B[5] * y + B[9] * z + B[13], bz = B[2] * x + B[6] * y + B[10] * z + B[14];
  let sx = 0, sy = 0, sz = 0, nx = 0, ny = 0, nz = 0; const r0 = l.nor[i * 3], r1 = l.nor[i * 3 + 1], r2 = l.nor[i * 3 + 2];
  const n0 = B[0] * r0 + B[4] * r1 + B[8] * r2, n1 = B[1] * r0 + B[5] * r1 + B[9] * r2, n2 = B[2] * r0 + B[6] * r1 + B[10] * r2;
  for (let k = 0; k < 4; k++) { const w = l.wt[i * 4 + k]; if (!w) continue; const m = l.idx[i * 4 + k] * 16;
    sx += w * (bm[m] * bx + bm[m + 4] * by + bm[m + 8] * bz + bm[m + 12]); sy += w * (bm[m + 1] * bx + bm[m + 5] * by + bm[m + 9] * bz + bm[m + 13]); sz += w * (bm[m + 2] * bx + bm[m + 6] * by + bm[m + 10] * bz + bm[m + 14]);
    if (nout) { nx += w * (bm[m] * n0 + bm[m + 4] * n1 + bm[m + 8] * n2); ny += w * (bm[m + 1] * n0 + bm[m + 5] * n1 + bm[m + 9] * n2); nz += w * (bm[m + 2] * n0 + bm[m + 6] * n1 + bm[m + 10] * n2); } }
  const qx = Bi[0] * sx + Bi[4] * sy + Bi[8] * sz + Bi[12], qy = Bi[1] * sx + Bi[5] * sy + Bi[9] * sz + Bi[13], qz = Bi[2] * sx + Bi[6] * sy + Bi[10] * sz + Bi[14];
  out[0] = W[0] * qx + W[4] * qy + W[8] * qz + W[12]; out[1] = W[1] * qx + W[5] * qy + W[9] * qz + W[13]; out[2] = W[2] * qx + W[6] * qy + W[10] * qz + W[14];
  if (nout) { const ax = Bi[0] * nx + Bi[4] * ny + Bi[8] * nz, ay = Bi[1] * nx + Bi[5] * ny + Bi[9] * nz, az = Bi[2] * nx + Bi[6] * ny + Bi[10] * nz;
    let wx = W[0] * ax + W[4] * ay + W[8] * az, wy = W[1] * ax + W[5] * ay + W[9] * az, wz = W[2] * ax + W[6] * ay + W[10] * az; const L = Math.hypot(wx, wy, wz) || 1; nout[0] = wx / L; nout[1] = wy / L; nout[2] = wz / L; } }
E.skinVertex = skin;
// returns {left|right: {minMm, bone, layer, at, normal, deep}} ; minMm < 0 = penetration depth
E.handClip = function(sides, opts = {}) {
  const v = flareInspector.viewer; v.coach.updateMatrixWorld(true); const L = E.meshCache(); for (const l of L) l.o.skeleton.update();
  const res = {}; const p = [0, 0, 0], nn = [0, 0, 0];
  const body = L.find(l => l.o.name === 'Coach_Body'); const bones = body.o.skeleton.bones;
  const J = Object.assign({}, v.motion.getMetrics().joints, E._jo || {});
  const AX = { pelvis: ['pelvis', 'waist'], spineLower: ['pelvis', 'waist'], spineUpper: ['waist', 'shoulderCenter'], torso: ['waist', 'shoulderCenter'], neck: ['neck', 'head'], head: ['neck', 'head'] };
  for (const sd of ['left', 'right']) Object.assign(AX, { [sd + 'Scapula']: ['shoulderCenter', sd + 'Shoulder'], [sd + 'UpperArm']: [sd + 'Shoulder', sd + 'Elbow'], [sd + 'Forearm']: [sd + 'Elbow', sd + 'Wrist'], [sd + 'Hand']: [sd + 'Wrist', sd + 'Palm'],
    [sd + 'Thigh']: [sd + 'Hip', sd + 'Knee'], [sd + 'Patella']: [sd + 'Hip', sd + 'Knee'], [sd + 'Shin']: [sd + 'Knee', sd + 'Ankle'], [sd + 'Foot']: [sd + 'Ankle', sd + 'Toe'] });
  const axisOf = bn => AX[bn] ? [J[AX[bn][0]], J[AX[bn][1]]] : null;
  const segFoot = (q, [a0, a1]) => { const d = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]]; const L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] || 1e-9;
    const t = Math.max(0, Math.min(1, ((q[0] - a0[0]) * d[0] + (q[1] - a0[1]) * d[1] + (q[2] - a0[2]) * d[2]) / L2)); return [a0[0] + d[0] * t, a0[1] + d[1] * t, a0[2] + d[2] * t]; };
  const segD = (q, ax) => { const f = segFoot(q, ax); return Math.hypot(q[0] - f[0], q[1] - f[1], q[2] - f[2]); };
  for (const side of sides) {
    const ex = new Set([side + 'Hand', side + 'Forearm', ...(opts.exclude?.[side] || [])]);
    const H = []; for (let i = 0; i < body.n; i++) if (body.dom[i][0] === side + 'Hand' && body.dom[i][1] > 0.5) { skin(body, i, p, null, true); H.push([p[0], p[1], p[2]]); }
    const bx = [9, 9, 9, -9, -9, -9]; for (const h of H) for (let k = 0; k < 3; k++) { bx[k] = Math.min(bx[k], h[k]); bx[k + 3] = Math.max(bx[k + 3], h[k]); }
    const R = 0.05, C = 0.024, cen = [(bx[0] + bx[3]) / 2, (bx[1] + bx[4]) / 2, (bx[2] + bx[5]) / 2];
    // bone-level cull: a vertex is never further than ~0.45 m from its dominant bone origin
    const wp = new (T().Vector3)(); const near = new Map();
    let best = { minMm: 99 };
    for (const l of L) { if (opts.layers && !opts.layers.includes(l.o.name)) continue; const g = new Map(); const tb = [9, 9, 9, -9, -9, -9]; const bs = l.o.skeleton.bones; const live = l.o.name === 'Coach_Body';
      const okB = bs.map(b => { if (ex.has(b.name)) return false; b.getWorldPosition(wp); return Math.hypot(wp.x - cen[0], wp.y - cen[1], wp.z - cen[2]) < 0.6; });
      for (let i = 0; i < l.n; i++) { if (!okB[l.domI[i]]) continue; const isHand = live && /Hand$/.test(l.dom[i][0]);
        skin(l, i, p, null, isHand);
        if (p[0] < bx[0] - R || p[1] < bx[1] - R || p[2] < bx[2] - R || p[0] > bx[3] + R || p[1] > bx[4] + R || p[2] > bx[5] + R) continue;
        const key = ((Math.floor(p[0] / C) + 512) * 1024 + Math.floor(p[1] / C) + 512) * 1024 + Math.floor(p[2] / C) + 512; tb[0] = Math.min(tb[0], p[0]); tb[1] = Math.min(tb[1], p[1]); tb[2] = Math.min(tb[2], p[2]); tb[3] = Math.max(tb[3], p[0]); tb[4] = Math.max(tb[4], p[1]); tb[5] = Math.max(tb[5], p[2]); let a = g.get(key); if (!a) g.set(key, a = []); a.push([p[0], p[1], p[2], i, l.dom[i][0], isHand]); }
      if (!g.size) continue;
      for (const h of H) { const M = 0.046; if (h[0] < tb[0] - M || h[1] < tb[1] - M || h[2] < tb[2] - M || h[0] > tb[3] + M || h[1] > tb[4] + M || h[2] > tb[5] + M) continue;
        const cx = Math.floor(h[0] / C) + 512, cy = Math.floor(h[1] / C) + 512, cz = Math.floor(h[2] / C) + 512; const K = 6, kn = [];
        for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) { const a = g.get(((cx + dx) * 1024 + cy + dy) * 1024 + cz + dz); if (!a) continue;
          for (const q of a) { const d = (q[0] - h[0]) ** 2 + (q[1] - h[1]) ** 2 + (q[2] - h[2]) ** 2; if (kn.length < K || d < kn[kn.length - 1][0]) { kn.push([d, q]); kn.sort((u, w) => u[0] - w[0]); if (kn.length > K) kn.pop(); } } }
        if (!kn.length || kn[0][0] > 0.045 * 0.045) continue;
        // inside/outside by radial distance from the nearest body segment's core line (robust to the shorts' mixed/double-sided
        // normals): the hand vertex is inside when it sits closer to the bone axis than the K nearest surface vertices do.
        const ax = axisOf(kn[0][1][4]); if (!ax) continue;
        let rs = 0; const c3 = [0, 0, 0]; for (const [, q] of kn) { rs += segD(q, ax); c3[0] += q[0]; c3[1] += q[1]; c3[2] += q[2]; } rs /= kn.length; for (let k = 0; k < 3; k++) c3[k] /= kn.length;
        const rh = segD(h, ax); const inside = rh < rs;
        const sd = inside ? rh - rs : Math.sqrt(kn[0][0]);
        if (sd * 1000 < best.minMm) { const f = segFoot(h, ax); const n3 = [h[0] - f[0], h[1] - f[1], h[2] - f[2]]; const nl = Math.hypot(...n3) || 1;
          best = { minMm: +(sd * 1000).toFixed(2), bone: kn[0][1][4], layer: l.o.name, at: c3, normal: n3.map(x => x / nl), deep: h }; } } }
    res[side] = best;
  }
  return res;
};
})();
