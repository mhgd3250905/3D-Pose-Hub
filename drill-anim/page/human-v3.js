// training-human-v3 PROTOTYPE (feat/human-v3-proto). Opt-in only: nothing in the existing render path loads this file.
// MakeHuman/MPFB2 (CC0) body + 102-bone rig (3-segment fingers, 5-segment spine, clavicles, toes, split upper-arm/forearm/
// thigh/shin twist bones) with per-vertex BodyParts3D muscle IDs (_MUSCLE_ID / _MUSCLE_DEEP, CC BY 4.0).
//
// Mapping layer: drills keep driving the legacy 20-joint coach exactly as before (engine.js, specs unchanged). After the
// legacy pose is applied, __v3.follow() reads the legacy joints / bone rotations and retargets them onto the v3 rig:
//   pelvis, chest, head  <- legacy pelvis / torso / head rotations (chest bend spread over spine05..spine01, neck01..03)
//   clavicle             <- legacy scapular shift (shoulder displacement relative to the chest)
//   arms / legs          <- legacy joint DIRECTIONS (shoulder-elbow-wrist, hip-knee-ankle); contact limbs (planted hands,
//                           world-fixed bar grips, feet on the floor) are snapped to the legacy contact with two-bone IK
//                           after a least-squares root offset (v3 proportions differ from the cartoon coach)
//   hand / foot          <- legacy hand / foot frames (palm frame calibration), twist split over the twist bones
//   fingers              <- named hand poses (open, relaxed, palm-floor, grip-bar, band-grip), chosen per hand by
//                           spec.v3.handPose[side] or inferred from the hand's mode / props
// Rendering: own toon material (theme colours, painted tee/shorts/shoes from _GARMENT fields) with a soft per-vertex muscle
// highlight from the muscle IDs (no ellipsoid guessing). Optional dual-quaternion skinning (__v3.setDQS(true)).
(function(){
const V3 = window.__v3 = {};
const T = () => window.__toonT;
const DEG = Math.PI / 180;
const V = a => new (T().Vector3)(...a);

V3.load = async function(opts = {}){
  const THREE = T(), v = flareInspector.viewer;
  const src = await (await fetch('/src/viewer.js')).text();
  const m = src.match(/import\s*\{\s*GLTFLoader\s*\}\s*from\s*["']([^"']+)["']/);
  if (!m) throw new Error('human-v3: GLTFLoader import not found in /src/viewer.js');
  const { GLTFLoader } = await import(m[1]);
  const [gltf, meta] = await Promise.all([new GLTFLoader().loadAsync(opts.url || '/coach/training-human-v3.glb'), fetch(opts.meta || '/__v3meta').then(r => r.ok ? r.json() : null).catch(() => null)]);
  V3.meta = opts.metaData || meta;
  const root = gltf.scene.getObjectByName('TrainingHumanV3') || gltf.scene;
  V3.group = gltf.scene; V3.scale = opts.scale ?? 1; // the GLB has its scale baked in (sidecar bakedScale); keep 1 for DQS gltf.scene.scale.setScalar(V3.scale);
  v.scene.add(gltf.scene);
  let mesh = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) mesh = o; });
  V3.mesh = mesh; mesh.frustumCulled = false; V3.bones = {};
  for (const b of mesh.skeleton.bones) V3.bones[b.name] = b;
  gltf.scene.updateMatrixWorld(true);
  V3.rest = {}; for (const [n, b] of Object.entries(V3.bones)) V3.rest[n] = { pos: b.position.clone(), w: b.getWorldPosition(new THREE.Vector3()) };
  V3.restOf = n => V3.rest[n].w.clone();
  buildAdjacency(); buildMaterial(); captureLegacyRest(); prepHands(); prepFeet();
  V3.setVisible(true);
  return { bones: Object.keys(V3.bones).length, verts: mesh.geometry.attributes.position.count, scale: V3.scale };
};
V3.setVisible = function(on){ const v = flareInspector.viewer; V3.group.visible = on;
  v.coach.traverse(o => { if (o.isMesh) { if (o.userData.v3vis === undefined) o.userData.v3vis = o.visible; o.visible = on ? false : o.userData.v3vis; } }); };

// ---------------- legacy rest frames ----------------
function captureLegacyRest(){
  const THREE = T(), v = flareInspector.viewer, mo = v.motion; mo.reset(); v.coach.updateMatrixWorld(true);
  V3.legacyRestQ = {}; for (const n of ['pelvis', 'torso', 'neck', 'head', 'leftHand', 'rightHand', 'leftFoot', 'rightFoot'])
    V3.legacyRestQ[n] = v.coach.getObjectByName(n).getWorldQuaternion(new THREE.Quaternion());
  V3.legacyRestJ = structuredClone(mo.getMetrics().joints);
}
const legacyDelta = n => { const THREE = T(), v = flareInspector.viewer; return v.coach.getObjectByName(n).getWorldQuaternion(new THREE.Quaternion()); }; // legacy bind = identity rotations

// ---------------- frames ----------------
function basis(y, z){ // rotation whose +Y = y, +Z = z (orthogonalised)
  const THREE = T(); const Y = y.clone().normalize(); const Z = z.clone().addScaledVector(Y, -z.dot(Y)).normalize(); const X = Y.clone().cross(Z).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); }
const mapFrame = (y0, z0, y1, z1) => basis(y1, z1).multiply(basis(y0, z0).invert()); // rotation taking (y0,z0) -> (y1,z1)
function twistAngle(q, axis){ const a = axis.clone().normalize(); const p = q.x * a.x + q.y * a.y + q.z * a.z; let ang = 2 * Math.atan2(p, q.w); if (ang > Math.PI) ang -= 2 * Math.PI; if (ang < -Math.PI) ang += 2 * Math.PI; return ang; }
const axisQ = (axis, ang) => new (T().Quaternion)().setFromAxisAngle(axis.clone().normalize(), ang);

// legacy palm frame (engine.js palmFrame, rest frame) and v3 palm frame (sidecar / rig)
function legacyPalm(side){ const s = side === 'left' ? 1 : -1; return [V([s * 0.98253144, 0.05483374, 0.17783482]), V([s * 0.06068526, -0.99777448, -0.02762938])]; }
function prepHands(){
  const THREE = T(); V3.hand = {};
  for (const [side, S] of [['left', 'L'], ['right', 'R']]) {
    const wr = V3.restOf('wrist_' + S), mid = V3.restOf('finger3-1_' + S), f = mid.clone().sub(wr).normalize();
    let n; const hm = V3.meta?.hands?.[S];
    if (hm) n = V(hm.palmNormal); else { const ac = V3.restOf('finger2-1_' + S).sub(V3.restOf('finger5-1_' + S)); n = S === 'L' ? f.clone().cross(ac) : ac.clone().cross(f); }
    n.addScaledVector(f, -n.dot(f)).normalize();
    const palm = wr.clone().lerp(mid, 0.55);
    // palm-side contact points (wrist / metacarpal dominated vertices), rest, relative to the wrist
    const g = V3.mesh.geometry, P = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = V3.mesh.skeleton.bones;
    const pts = [], q = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { let bw = 0, bn = ''; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; bn = bones[si.getComponent(i, k)].name; } }
      if ((bn === 'wrist_' + S || bn.startsWith('metacarpal') && bn.endsWith(S)) && bw > 0.5) { q.fromBufferAttribute(P, i).multiplyScalar(V3.scale); pts.push(q.clone().sub(wr)); } }
    V3.hand[side] = { f, n, wr, palm, pts };
  }
}
function prepFeet(){
  const THREE = T(); V3.foot = {};
  for (const [side, S] of [['left', 'L'], ['right', 'R']]) {
    const an = V3.restOf('foot_' + S), toe = V3.restOf('toe3-1_' + S); const f = toe.clone().sub(an); f.y = 0; f.normalize();
    const g = V3.mesh.geometry, P = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = V3.mesh.skeleton.bones;
    const pts = [], q = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).multiplyScalar(V3.scale); if (q.y > 0.06 * V3.scale) continue;
      let bw = 0, bn = ''; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; bn = bones[si.getComponent(i, k)].name; } }
      if ((bn === 'foot_' + S || bn.startsWith('toe') && bn.endsWith(S))) pts.push(q.clone().sub(an)); }
    V3.foot[side] = { f, up: V([0, 1, 0]), an, pts };
  }
}

// ---------------- pose writer: world rotations, parents first ----------------
function setWorldQ(name, qw){ const b = V3.bones[name]; const pq = b.parent.getWorldQuaternion(new (T().Quaternion)()); b.quaternion.copy(pq.invert().multiply(qw)); b.updateMatrixWorld(true); }
const worldPos = n => V3.bones[n].getWorldPosition(new (T().Vector3)());
function resetPose(){ for (const [n, b] of Object.entries(V3.bones)) { b.quaternion.identity(); b.position.copy(V3.rest[n].pos); } V3.group.updateMatrixWorld(true); }

// two-bone: elbow position from root R, target W, lengths a,b and a bend direction (pole)
function twoBone(R, W, a, b, pole){
  const u = W.clone().sub(R); let d = u.length(); u.normalize(); const reach = d; d = Math.min(Math.max(d, Math.abs(a - b) + 1e-4), a + b - 1e-5);
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
  const n = pole.clone().addScaledVector(u, -pole.dot(u)); if (n.lengthSq() < 1e-10) n.set(0, 0, -1).addScaledVector(u, -u.z); n.normalize();
  const E = R.clone().addScaledVector(u, x).addScaledVector(n, h); const Wr = R.clone().addScaledVector(u, d);
  return { E, W: Wr, bend: n, u, overreach: Math.max(0, reach - (a + b)) };
}
// limb chain rotation from the rest (S0,E0,W0) to the posed (S,E,W) with a consistent hinge
function limbRot(S0, E0, W0, S, E, W, bendNow){
  const u0 = W0.clone().sub(S0).normalize(); const b0 = E0.clone().sub(S0); b0.addScaledVector(u0, -b0.dot(u0)).normalize();
  const h0 = b0.clone().cross(u0).normalize();
  const u = W.clone().sub(S).normalize(); const b = bendNow.clone().addScaledVector(u, -bendNow.dot(u)).normalize(); const h = b.clone().cross(u).normalize();
  const d10 = E0.clone().sub(S0).normalize(), d20 = W0.clone().sub(E0).normalize(), d1 = E.clone().sub(S).normalize(), d2 = W.clone().sub(E).normalize();
  return { q1: mapFrame(d10, h0, d1, h), q2: mapFrame(d20, h0, d2, h), d10, d20 };
}

// ---------------- hand poses ----------------
V3.HAND_POSES = { open: { fingers: [0, 0, 0], thumb: [0, 0, 0], spread: 6 }, relaxed: { fingers: [18, 28, 14], thumb: [8, 10, 8], spread: 2 },
  'palm-floor': { fingers: [-6, 4, 2], thumb: [0, 0, 0], spread: 10 }, 'grip-bar': { fingers: [70, 95, 55], thumb: [35, 40, 45], spread: 0 },
  'band-grip': { fingers: [55, 85, 45], thumb: [25, 30, 35], spread: 0 } };
function applyHandPose(side, qHand, name){
  const S = side === 'left' ? 'L' : 'R', P = (V3.meta?.handPoses?.[name]) || V3.HAND_POSES[name] || V3.HAND_POSES.relaxed, hm = V3.meta?.hands?.[S];
  if (!hm) return;
  for (let k = 1; k <= 5; k++) { const chain = hm.fingers[k]; let q = qHand.clone(); const tgt = k === 1 ? P.thumb : P.fingers;
    chain.forEach((c, j) => { const flex = (tgt[j] - (j === 0 ? 0 : c.restFlexDeg)) * DEG; let local = axisQ(V(c.axis), flex);
      if (j === 0 && k > 1) local = axisQ(V(hm.palmNormal), (k - 3.3) * (P.spread || 0) * DEG * (S === 'L' ? 1 : -1)).multiply(local);
      q = q.multiply(local); setWorldQ(c.bone, q); }); }
}
V3.pickHandPose = function(spec, side, D){
  const o = spec.v3?.handPose?.[side]; if (o) return o;
  const H = D?.hands?.[side] || {}; const pl = H.plant || H; const w = H.w || 0;
  if ((pl.mode === 'floor') && w < 0.5) return 'palm-floor';
  if (pl.mode === 'fingertips') return 'open';
  if ((spec.props || []).some(p => p.type === 'gripHand' && (p.side || 'right') === side) || H.grip || pl.grip) return 'grip-bar';
  if ((spec.props || []).some(p => /band/.test(p.type))) return 'band-grip';
  return 'relaxed';
};

// ---------------- follow the legacy pose ----------------
V3.follow = function(spec){
  const THREE = T(), v = flareInspector.viewer, mo = v.motion; const s = V3.scale;
  const J0 = Object.assign({}, mo.getMetrics().joints, window.__drill?._jo || {}); const J = {}; for (const k in J0) J[k] = V(J0[k]);
  const R0 = {}; for (const k in V3.legacyRestJ) R0[k] = V(V3.legacyRestJ[k]);
  const D = window.__drill?.currentDescriptor; const lp = window.__drill?.poseTargets || null;
  resetPose();
  const qP = legacyDelta('pelvis'), qC = legacyDelta('torso'), qH = legacyDelta('head');
  // ---- root placement: hip centre to the legacy hip centre (offset refined below by contacts)
  const hipMid0 = V3.restOf('upperleg01_L').add(V3.restOf('upperleg01_R')).multiplyScalar(0.5);
  const placeRoot = off => { const hipMid = J.leftHip.clone().add(J.rightHip).multiplyScalar(0.5).add(off);
    const rootW = hipMid.clone().add(V3.restOf('root').sub(hipMid0).applyQuaternion(qP));
    V3.bones.root.position.copy(rootW.divideScalar(s)); setWorldQ('root', qP); };
  const spineChain = ['spine05', 'spine04', 'spine03', 'spine02', 'spine01'], spineW = [0.12, 0.3, 0.52, 0.76, 1.0];
  const neckChain = ['neck01', 'neck02', 'neck03', 'head'], neckW = [0.25, 0.5, 0.75, 1.0];
  const posture = () => {
    spineChain.forEach((n, i) => setWorldQ(n, qP.clone().slerp(qC, spineW[i])));
    neckChain.forEach((n, i) => setWorldQ(n, qC.clone().slerp(qH, neckW[i])));
    for (const pl of ['pelvis_L', 'pelvis_R']) setWorldQ(pl, qP);
    // clavicles follow the legacy shoulder displacement relative to the rigid chest
    for (const [side, S] of [['left', 'L'], ['right', 'R']]) {
      setWorldQ('clavicle_' + S, qC); setWorldQ('shoulder01_' + S, qC);
      const rig = J.shoulderCenter.clone().add(R0[side + 'Shoulder'].clone().sub(R0.shoulderCenter).applyQuaternion(qC));
      const dS = J[side + 'Shoulder'].clone().sub(rig);
      const C = worldPos('clavicle_' + S), S0 = worldPos('upperarm01_' + S);
      if (dS.length() > 1e-4) { const q = new THREE.Quaternion().setFromUnitVectors(S0.clone().sub(C).normalize(), S0.clone().add(dS.multiplyScalar(0.9)).sub(C).normalize());
        setWorldQ('clavicle_' + S, q.multiply(qC)); setWorldQ('shoulder01_' + S, V3.bones['clavicle_' + S].getWorldQuaternion(new THREE.Quaternion())); }
    } };
  placeRoot(V([0, 0, 0])); posture();
  // ---- limb targets
  const limb = {};
  for (const [side, S] of [['left', 'L'], ['right', 'R']]) {
    const hd = D?.hands?.[side] || {}, pl = hd.plant || hd, w = hd.w || 0, fd = D?.feet?.[side] || {};
    // hand frame
    const dh = legacyDelta(side + 'Hand'); const [lf, ln] = legacyPalm(side); const H = V3.hand[side];
    const qh = mapFrame(H.f, H.n, lf.clone().applyQuaternion(dh), ln.clone().applyQuaternion(dh));
    const dfo = legacyDelta(side + 'Foot'); const F = V3.foot[side];
    const lFoot = R0[side + 'Toe'].clone().sub(R0[side + 'Ankle']); lFoot.y = 0; lFoot.normalize();
    const qf = mapFrame(V([0, 1, 0]), F.f, V([0, 1, 0]).applyQuaternion(dfo), lFoot.clone().applyQuaternion(dfo));
    const handContact = ((pl.mode === 'floor' || pl.mode === 'fingertips') && w < 0.5) || (pl.mode === 'free' && pl.frame === 'world' && !(w > 0)) ? (pl.mode === 'free' ? 'world' : 'floor') : null;
    const footContact = fd.mode === 'floor' ? 'floor' : (fd.mode === 'free' && fd.frame === 'world') ? 'world' : null;
    limb[side] = { S, qh, qf, handContact, footContact, hp: V3.pickHandPose(spec, side, D),
      elbowPole: lp?.limbs?.[side]?.elbowPole ? V(lp.limbs[side].elbowPole) : null, kneePole: lp?.limbs?.[side]?.kneePole ? V(lp.limbs[side].kneePole) : null };
  }
  const L = n => V3.restOf(n);
  const seg = (a, b) => L(a).distanceTo(L(b));
  const armLen = S => [seg('upperarm01_' + S, 'lowerarm01_' + S), seg('lowerarm01_' + S, 'wrist_' + S)];
  const legLen = S => [seg('upperleg01_' + S, 'lowerleg01_' + S), seg('lowerleg01_' + S, 'foot_' + S)];
  const dirOf = (a, b) => J[b].clone().sub(J[a]).normalize();
  const wristTarget = (side, l) => { const H = V3.hand[side];
    const palmOff = H.palm.clone().sub(H.wr).applyQuaternion(l.qh);
    const t = J[side + 'Palm'].clone().sub(palmOff);
    if (l.handContact === 'floor') { const mn = Math.min(...H.pts.map(p => p.clone().applyQuaternion(l.qh).y)); t.y = (D?.hands?.[side]?.plant?.floor ?? D?.hands?.[side]?.floor ?? 0) + 0.002 - mn; }
    return t; };
  const ankleTarget = (side, l) => { const F = V3.foot[side]; const t = J[side + 'Ankle'].clone();
    if (l.footContact === 'floor') { const mn = Math.min(...F.pts.map(p => p.clone().applyQuaternion(l.qf).y)); t.y = (D?.feet?.[side]?.floor ?? 0) + (D?.feet?.[side]?.lift || 0) - mn; }
    return t; };
  // FK effector positions (legacy directions, v3 lengths) for the root least-squares
  const fk = () => { const out = [];
    for (const [side, l] of Object.entries(limb)) { const S = l.S;
      if (l.handContact) { const [a, b] = armLen(S); const sh = worldPos('upperarm01_' + S); const p = sh.addScaledVector(dirOf(side + 'Shoulder', side + 'Elbow'), a).addScaledVector(dirOf(side + 'Elbow', side + 'Wrist'), b);
        out.push([wristTarget(side, l).sub(p), 1]); }
      if (l.footContact) { const [a, b] = legLen(S); const hp = worldPos('upperleg01_' + S); const p = hp.addScaledVector(dirOf(side + 'Hip', side + 'Knee'), a).addScaledVector(dirOf(side + 'Knee', side + 'Ankle'), b);
        out.push([ankleTarget(side, l).sub(p), l.handContact || Object.values(limb).some(z => z.handContact) ? 0.8 : 1]); } }
    return out; };
  let off = V([0, 0, 0]);
  for (let it = 0; it < 2; it++) { const r = fk(); if (!r.length) break; const acc = V([0, 0, 0]); let ws = 0; for (const [d, w] of r) { acc.addScaledVector(d, w); ws += w; }
    off.add(acc.multiplyScalar(1 / ws)); placeRoot(off); posture(); }
  V3.lastOffset = off.toArray();
  // ---- limbs
  const solveLimbs = () => { const report = {}, over = [];
  for (const [side, l] of Object.entries(limb)) { const S = l.S;
    // arm
    { const [a, b] = armLen(S); const Sh = worldPos('upperarm01_' + S);
      let Wt; if (l.handContact) Wt = wristTarget(side, l); else Wt = Sh.clone().addScaledVector(dirOf(side + 'Shoulder', side + 'Elbow'), a).addScaledVector(dirOf(side + 'Elbow', side + 'Wrist'), b);
      const leg = J[side + 'Elbow'].clone().sub(J[side + 'Shoulder'].clone().lerp(J[side + 'Wrist'], 0.5));
      let pole = leg.lengthSq() > 4e-4 ? leg : (l.elbowPole ? l.elbowPole.clone().sub(J[side + 'Shoulder']) : V([0, -0.3, -0.3]));
      const tb = twoBone(Sh, Wt, a, b, pole);
      const r = limbRot(L('upperarm01_' + S), L('lowerarm01_' + S), L('wrist_' + S), Sh, tb.E, tb.W, tb.bend);
      // upper-arm twist: half of the humeral roll on upperarm01, all of it on upperarm02
      const sw = new (T().Quaternion)().setFromUnitVectors(r.d10, tb.E.clone().sub(Sh).normalize());
      const phi = twistAngle(sw.clone().invert().multiply(r.q1), r.d10);
      setWorldQ('upperarm01_' + S, sw.clone().multiply(axisQ(r.d10, phi * 0.5))); setWorldQ('upperarm02_' + S, r.q1);
      // forearm twist from the hand: 25% / 75% over lowerarm01 / lowerarm02, the rest at the wrist
      const th = twistAngle(r.q2.clone().invert().multiply(l.qh), r.d20);
      setWorldQ('lowerarm01_' + S, r.q2.clone().multiply(axisQ(r.d20, th * 0.25))); setWorldQ('lowerarm02_' + S, r.q2.clone().multiply(axisQ(r.d20, th * 0.75)));
      setWorldQ('wrist_' + S, l.qh); for (let k = 1; k <= 4; k++) setWorldQ(`metacarpal${k}_${S}`, l.qh);
      applyHandPose(side, l.qh, l.hp);
      if (l.handContact) over.push(Wt.clone().sub(Sh).multiplyScalar(tb.overreach / Math.max(Wt.distanceTo(Sh), 1e-6)));
      report[side + 'Hand'] = { contact: l.handContact, pose: l.hp, errMm: +(worldPos('wrist_' + S).distanceTo(Wt) * 1000).toFixed(1), overreachMm: +(tb.overreach * 1000).toFixed(1), twistDeg: +(th / DEG).toFixed(1) }; }
    // leg
    { const [a, b] = legLen(S); const Hp = worldPos('upperleg01_' + S);
      let At; if (l.footContact) At = ankleTarget(side, l); else At = Hp.clone().addScaledVector(dirOf(side + 'Hip', side + 'Knee'), a).addScaledVector(dirOf(side + 'Knee', side + 'Ankle'), b);
      const leg = J[side + 'Knee'].clone().sub(J[side + 'Hip'].clone().lerp(J[side + 'Ankle'], 0.5));
      let pole = leg.lengthSq() > 4e-4 ? leg : (l.kneePole ? l.kneePole.clone().sub(J[side + 'Hip']) : V([0, 0, 0.4]).applyQuaternion(qP));
      const tb = twoBone(Hp, At, a, b, pole);
      const r = limbRot(L('upperleg01_' + S), L('lowerleg01_' + S), L('foot_' + S), Hp, tb.E, tb.W, tb.bend);
      const sw = new (T().Quaternion)().setFromUnitVectors(r.d10, tb.E.clone().sub(Hp).normalize());
      const phi = twistAngle(sw.clone().invert().multiply(r.q1), r.d10);
      setWorldQ('upperleg01_' + S, sw.clone().multiply(axisQ(r.d10, phi * 0.5))); setWorldQ('upperleg02_' + S, r.q1);
      const th = twistAngle(r.q2.clone().invert().multiply(l.qf), r.d20);
      setWorldQ('lowerleg01_' + S, r.q2.clone().multiply(axisQ(r.d20, th * 0.3))); setWorldQ('lowerleg02_' + S, r.q2.clone().multiply(axisQ(r.d20, th * 0.7)));
      setWorldQ('foot_' + S, l.qf);
      if (l.footContact) over.push(At.clone().sub(Hp).multiplyScalar(tb.overreach / Math.max(At.distanceTo(Hp), 1e-6)));
      report[side + 'Foot'] = { contact: l.footContact, errMm: +(worldPos('foot_' + S).distanceTo(At) * 1000).toFixed(1), overreachMm: +(tb.overreach * 1000).toFixed(1) }; }
  }
  return { report, over }; };
  let res = solveLimbs();
  for (let it = 0; it < 4 && res.over.some(o => o.length() > 0.002); it++) { const acc = V([0, 0, 0]); for (const o of res.over) acc.add(o); off.addScaledVector(acc, 1 / res.over.length * 1.6); placeRoot(off); posture(); res = solveLimbs(); }
  const report = res.report;
  V3.group.updateMatrixWorld(true); V3.mesh.skeleton.update();
  return { offsetMm: off.toArray().map(x => +(x * 1000).toFixed(1)), ...report };
};

// ---------------- material: toon + painted garments + muscle-ID highlight ----------------
function buildAdjacency(){
  const g = V3.mesh.geometry, idx = g.index.array, n = g.attributes.position.count; const nb = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
  V3.adj = nb.map(s => Int32Array.from(s));
}
function buildMaterial(){
  const THREE = T(), g = V3.mesh.geometry, n = g.attributes.position.count;
  g.setAttribute('aSel', new THREE.BufferAttribute(new Float32Array(n), 1));
  const U = V3.uni = { uSelOn: { value: 0 }, uSide: { value: 0 }, uPulse: { value: 1 }, uGlowV3: { value: 0 }, uDQS: { value: 0 }, uIdView: { value: 0 } };
  const TU = window.__toonUni || {};
  const mat = new THREE.MeshToonMaterial({}); mat.toneMapped = false;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U); for (const k of ['uBase', 'uShadeC', 'uRimC', 'uHiC', 'uHiShade', 'uRim']) if (TU[k]) sh.uniforms[k] = TU[k];
    sh.vertexShader = 'attribute float _dqs_weight;attribute float _muscle_id;attribute vec4 _garment;attribute float aSel;varying vec4 vGar;varying float vSel;flat varying float vMid;varying vec3 vRestP;uniform float uDQS;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vGar=_garment; vSel=aSel; vMid=_muscle_id; vRestP=position;')
      .replace('#include <skinning_pars_vertex>', `#include <skinning_pars_vertex>
#ifdef USE_SKINNING
vec4 m2q(mat3 m){ float t=m[0][0]+m[1][1]+m[2][2]; vec4 q;
  if(t>0.0){ float s=sqrt(t+1.0)*2.0; q=vec4((m[1][2]-m[2][1])/s,(m[2][0]-m[0][2])/s,(m[0][1]-m[1][0])/s,0.25*s); }
  else if(m[0][0]>m[1][1]&&m[0][0]>m[2][2]){ float s=sqrt(1.0+m[0][0]-m[1][1]-m[2][2])*2.0; q=vec4(0.25*s,(m[1][0]+m[0][1])/s,(m[2][0]+m[0][2])/s,(m[1][2]-m[2][1])/s); }
  else if(m[1][1]>m[2][2]){ float s=sqrt(1.0+m[1][1]-m[0][0]-m[2][2])*2.0; q=vec4((m[1][0]+m[0][1])/s,0.25*s,(m[2][1]+m[1][2])/s,(m[2][0]-m[0][2])/s); }
  else { float s=sqrt(1.0+m[2][2]-m[0][0]-m[1][1])*2.0; q=vec4((m[2][0]+m[0][2])/s,(m[2][1]+m[1][2])/s,0.25*s,(m[0][1]-m[1][0])/s); }
  return q; }
vec4 qmul(vec4 a, vec4 b){ return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz), a.w*b.w-dot(a.xyz,b.xyz)); }
void dqOf(mat4 M, out vec4 r, out vec4 d){ r=m2q(mat3(M)); d=0.5*qmul(vec4(M[3].xyz,0.0), r); }
#endif`)
      .replace('#include <skinning_vertex>', `#ifdef USE_SKINNING
 if(uDQS>0.5){ vec3 tLBS; { vec4 sv=bindMatrix*vec4(transformed,1.0); vec4 sk=boneMatX*sv*skinWeight.x+boneMatY*sv*skinWeight.y+boneMatZ*sv*skinWeight.z+boneMatW*sv*skinWeight.w; tLBS=(bindMatrixInverse*sk).xyz; }
   vec4 r0,d0,r1,d1,r2,d2,r3,d3; dqOf(boneMatX,r0,d0); dqOf(boneMatY,r1,d1); dqOf(boneMatZ,r2,d2); dqOf(boneMatW,r3,d3);
   if(dot(r0,r1)<0.0){r1=-r1;d1=-d1;} if(dot(r0,r2)<0.0){r2=-r2;d2=-d2;} if(dot(r0,r3)<0.0){r3=-r3;d3=-d3;}
   vec4 R=r0*skinWeight.x+r1*skinWeight.y+r2*skinWeight.z+r3*skinWeight.w, Dd=d0*skinWeight.x+d1*skinWeight.y+d2*skinWeight.z+d3*skinWeight.w;
   float ln=length(R); R/=ln; Dd/=ln; vec3 p=(bindMatrix*vec4(transformed,1.0)).xyz;
   vec3 rp=p+2.0*cross(R.xyz,cross(R.xyz,p)+R.w*p); vec3 tr=2.0*(R.w*Dd.xyz-Dd.w*R.xyz+cross(R.xyz,Dd.xyz));
   vec3 tDQS=(bindMatrixInverse*vec4(rp+tr,1.0)).xyz; float k=uDQS>1.5?1.0:_dqs_weight; transformed=mix(tLBS,tDQS,k); }
 else {
#include <skinning_vertex>
 }
#endif`);
    sh.fragmentShader = `uniform vec3 uBase[4];uniform vec3 uShadeC[4];uniform vec3 uRimC[4];uniform vec3 uHiC;uniform float uHiShade[3];uniform float uRim;
      uniform float uSelOn;uniform float uSide;uniform float uPulse;uniform float uGlowV3;uniform float uIdView;varying vec4 vGar;varying float vSel;flat varying float vMid;varying vec3 vRestP;
      float aa(float f){ float w=max(fwidth(f),1e-5)*0.9; return smoothstep(-w,w,f); }
      vec3 idCol(float id){ float h=fract(id*0.618034); vec3 k=clamp(abs(fract(h+vec3(0.0,2.0/3.0,1.0/3.0))*6.0-3.0)-1.0,0.0,1.0); float s=mod(id,2.0)<0.5?0.85:0.6; float v=mod(id,3.0)<0.5?0.75:0.98; return v*mix(vec3(1.0),k,s); }
      ` + sh.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 Nn=normalize(normal); vec3 Vv=normalize(vViewPosition); vec3 Ld=normalize(vec3(-0.45,0.75,0.55)); float nl=dot(Nn,Ld);
      float b=smoothstep(-0.05,0.08,nl)*0.5+smoothstep(0.45,0.6,nl)*0.5;
      float top=aa(vGar.x), bot=aa(vGar.y)*(1.0-top), shoe=aa(vGar.z)*(1.0-top)*(1.0-bot); float skin=1.0-top-bot-shoe;
      vec4 W4=vec4(skin,top,bot,shoe);
      vec3 alb=vec3(0.0),shc=vec3(0.0),rimc=vec3(0.0); for(int i=0;i<4;i++){ alb+=W4[i]*uBase[i]; shc+=W4[i]*uShadeC[i]; rimc+=W4[i]*uRimC[i]; }
      vec3 lit=mix(shc,alb,b);
      float fr=pow(1.0-clamp(dot(Nn,Vv),0.0,1.0),2.6);
      float d=smoothstep(0.18,0.62,vSel)*uSelOn*(1.0-shoe);
      if(abs(uSide)>0.5) d*=smoothstep(-0.02,0.02,vRestP.x*uSide);
      float lam=clamp(0.5+0.5*nl,0.0,1.0); vec3 gl=uHiC*(0.68+0.14*lam+0.22*smoothstep(0.5,1.0,vSel))*(0.90+0.20*uPulse);
      lit=mix(lit,gl,d*0.95); lit+=uHiC*d*0.22*pow(1.0-clamp(dot(Nn,Vv),0.0,1.0),1.8)*0.6;
      lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d);
      if(uIdView>0.5) lit = vMid<0.5 ? lit*0.55 : idCol(floor(vMid+0.5))*(0.55+0.45*b);
      outgoingLight = uGlowV3>0.5 ? uHiC*d*(0.8+0.4*uPulse) : lit;
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'human-v3-proto';
  V3.mesh.material = mat;
}
// 0 = linear blend, 1 = hybrid (DQS on hinge joints via _DQS_WEIGHT), 2 = full DQS everywhere
V3.setDQS = mode => { V3.uni.uDQS.value = mode === true ? 1 : +mode || 0; };
// highlight: spec.highlight {groups, side} -> per-vertex soft selection from the muscle IDs (deep groups use _MUSCLE_DEEP)
V3.setHighlight = function(h){
  const g = V3.mesh.geometry, ids = g.attributes._muscle_id.array, deep = g.attributes._muscle_deep?.array, n = ids.length, sel = new Float32Array(n);
  const G = V3.meta?.specGroupIds || {}; const want = new Set(), wantDeep = new Set(); const dg = new Set((V3.meta?.groups || []).filter(x => x.deep).map(x => x.id));
  for (const gid of h?.groups || []) for (const id of (G[gid] || [])) { want.add(id); if (dg.has(id)) wantDeep.add(id); }
  for (const id of h?.ids || []) want.add(id);
  for (let i = 0; i < n; i++) sel[i] = want.has(Math.round(ids[i])) ? 1 : (deep && wantDeep.has(Math.round(deep[i])) ? 0.75 : 0);
  // soft edge: a few neighbourhood averages (mesh-space feather instead of the old ellipsoid guess)
  let a = sel; for (let it = 0; it < 3; it++) { const b = new Float32Array(n); for (let i = 0; i < n; i++) { const nb = V3.adj[i]; let s = a[i]; for (let k = 0; k < nb.length; k++) s += a[nb[k]]; b[i] = s / (nb.length + 1); } a = b; }
  // keep every selected vertex lit (narrow muscles survive), feather only outward
  for (let i = 0; i < n; i++) a[i] = 0.5 * sel[i] + 0.5 * a[i];
  g.attributes.aSel.array.set(a); g.attributes.aSel.needsUpdate = true;
  V3.uni.uSelOn.value = want.size ? 1 : 0; V3.uni.uSide.value = h?.side === 'left' ? 1 : h?.side === 'right' ? -1 : 0;
  return { ids: [...want], deep: [...wantDeep] };
};
})();
