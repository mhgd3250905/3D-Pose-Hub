/* V5 render skin for the 3D-Pose-Hub recipe scene (browser side; injected by tools/v5/render-masters-v5.mjs).
 * V5 = Pose Studio v3r7 定版 日漫三渲二 (coach-v3r3 + toon r5 look: screen-space thick coloured outline, two-tone hard-edge
 * flat shading, no rim) + v3r8b wrist fix (coach-v3r3-wristfix.glb: 6 forearm twist + 2 wrist bend helper bones per side,
 * driven by wristfix-r2.js). hair = none (bald), no fx.js effects, hard-edge ground shadow (PCF shadow map + ShadowMaterial).
 *
 * The hub scene keeps doing everything it does for V4: recipe solve (applyAt), props, fixed camera. This module only
 *  1) adds the V5 model to the same scene and hides the hub body (coach meshes + WebXR fixed hand / wrist bridge meshes;
 *     prop meshes such as dumbbell shafts/plates, kettlebells, mats, benches stay visible),
 *  2) per frame copies the hub's solved bone WORLD rotations onto the V5 rig (rest world rotations are identity in both rigs and
 *     pivots coincide), except spineLower/spineUpper, which are re-fitted so the torso pivot lands on the hub torso pivot
 *     (the hub torso pivot does not follow spine FK; up to 7 cm off on bridges),
 *  3) drives the wrist helper bones from the full hand-vs-forearm twist (hub wrist-twist share is never applied to V5 bones = 0).
 * Shadow: only the V5 sun casts. The hub viewer's key light also has castShadow (ortho frustum ±1.9) and, once the shadow map is on,
 * threw a second long shadow onto the V5 plane, cut hard at its frustum edge and off the canvas; it is muted (2026-11-17).
 * extent() gives the analytic shadow/body screen box and light-space reach per frame; render-masters-v5.mjs fails a frame whose
 * shadow comes within 4 px of the canvas edge or leaves the sun frustum, and records the border alpha of every frame.
 * scapulaShift (opt-in per action, default off; Thomas supplement r2, 2026-11-19): the hub moves the shoulder blades by translating
 * the scapula bones (spec shoulders.shift, engine.js shiftShoulders); plain V5 copies rotations only, so that translation was lost
 * (shoulders stayed put, hands slid). With scapulaShift the V5 scapula pivots are also placed at the hub's scapula pivots (offset
 * from the torso pivot, in the torso frame) every frame; the arm chain below follows by FK. Off = the code path is never entered,
 * so every action that does not ask for it renders exactly as before.
 * headFlexDeg (opt-in per action, default 0 = off; Thomas supplement r2 batch 2, 2026-11-19): the hub rig keeps the head rigid with
 * the chest, so on reclined bodies (seated back support) the face points at the ceiling. With headFlexDeg the V5 head bone gets that
 * extra flexion (chin toward the chest, + = flex) about its own pivot after the copy, so the head pivot and every other bone stay
 * on the hub's; 0/absent = the code path is never entered.
 * groundShadow (opt-in per action, default true = unchanged; Thomas supplement r2 batch 3, 2026-11-19): close-up shots (forearm +
 * hand, recipe camera fitted to the arm) cut the body at the canvas edge, so the ground shadow under the body always runs off the
 * canvas too and the render guard fails. With groundShadow === false the V5 sun casts nothing and the shadow plane is hidden, and
 * extent() reports no shadow points (body box and light-space reach as before). true/absent = the code path is never entered.
 * grip (opt-in per action, default null = off; Thomas supplement r2 add-on, 2026-11-19): V5 hands are one rigid open-hand mesh
 * (no finger bones). With grip = { side: 'right', dumbbell: true, ... } the fingers and thumb of that hand are wrapped, in the hand
 * bone's bind frame, around a handle cylinder (axis = hand +Z, across the palm; centre / radius from the grip object, defaults below)
 * once at install, before the toon pass (outline shells share the geometry), so the hand holds the handle without any new bone or
 * skin weight; with dumbbell true a one-ended dumbbell (handle + one head on the thumb side) in two-tone toon + ink shell is attached
 * to the V5 hand bone, so it turns with the hand. null/absent = the code path is never entered.
 * hubGraspHands (opt-in per action, default null = off; Thomas supplement r3, 2026-11-19, 开哥「抓握的都用专门的抓握手模」): for the
 * listed sides ('left' / 'right') V5 shows the hub's accepted fixed grasp hand (WebXR_Clipped_Hand_<side>, the fist the recipe hand
 * modes bar-grasp / dumbbell-grasp / fixed-grasp install; its props such as the fixed dumbbell stay as in every V5 dumbbell action)
 * instead of the V5 open hand. The hub fist keeps its own placement (rigid with the hub hand bone = the V5 hand bone, same pivot and
 * world rotation) and gets the V5 look: the V5 skin toon material and the V5 ink outline shell (same material objects, skin region,
 * hand outline weight 0.5). The V5 hand on that side is cut once at install, before the toon pass (outlines share the geometry):
 * triangles past 10 mm inside the fist's open wrist end are dropped, the last 12 mm of the V5 wrist before that end are blended
 * onto the fist's wrist cross-section and the part inside the fist onto the fist's own surface (0.6 mm under it, by ray from the axis) and bound rigidly to the hand bone, so the seam is closed on every frame with
 * no gap and no second wrist. The bridge band the hub draws to its own (hidden) forearm stays hidden. The fist casts the V5 ground
 * shadow (extent() places it with the posed hub matrix). null/absent = the code path is never entered.
 * Files toon-r6.js / wristfix-r2.js / model glb are verbatim copies of the v3r8b candidate (see tools/v5/runtime/SOURCES.md). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';
import { applyToon } from './toon-r6.js';
import { installWristFix } from './wristfix-r2.js';

const PARENT = {
  spineLower: 'pelvis', spineUpper: 'spineLower', torso: 'spineUpper', neck: 'torso', head: 'neck',
  leftScapula: 'torso', leftUpperArm: 'leftScapula', leftForearm: 'leftUpperArm', leftHand: 'leftForearm',
  rightScapula: 'torso', rightUpperArm: 'rightScapula', rightForearm: 'rightUpperArm', rightHand: 'rightForearm',
  leftThigh: 'pelvis', leftShin: 'leftThigh', leftPatella: 'leftShin', leftFoot: 'leftShin',
  rightThigh: 'pelvis', rightShin: 'rightThigh', rightPatella: 'rightShin', rightFoot: 'rightShin',
};
for (const s of ['left', 'right']) for (let k = 1; k <= 8; k++) { PARENT[s + 'ForearmTwist' + k] = s + 'Forearm'; PARENT[s + 'WristBend' + k] = s + 'Forearm'; }
export const NAMES = ['pelvis', 'spineLower', 'spineUpper', 'torso', 'neck', 'head', 'leftScapula', 'leftUpperArm', 'leftForearm', 'leftHand', 'rightScapula', 'rightUpperArm', 'rightForearm', 'rightHand', 'leftThigh', 'leftShin', 'leftFoot', 'rightThigh', 'rightShin', 'rightFoot'];
const SHADOW = { color: 0x2a1a12, opacity: 0.14, mapSize: 2048, half: 2.4, sun: [0.6, 5, 1.2] };   // sample geometry (2026-11-16); colour = warm near-black at 0.14 so it reads like the sample on the light theme and does not glow on the dark theme

export async function installV5({ glb, scapulaShift = false, headFlexDeg = 0, groundShadow = true, grip = null, hubGraspHands = null }) {
  const v = flareInspector.viewer, scene = v.scene, renderer = v.renderer, camera = v.camera;
  // ---- model
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb, '');
  const root = gltf.scene; root.name = 'V5_CoachV3r3_Wristfix'; scene.add(root); root.updateMatrixWorld(true);
  const bones = {}, skinned = [];
  root.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isSkinnedMesh) { skinned.push(o); o.frustumCulled = false; } });
  for (const n of NAMES) if (!bones[n]) throw Error('V5 model lacks bone ' + n);
  for (const [c, p] of Object.entries(PARENT)) if (bones[c] && bones[p]) bones[p].attach(bones[c]);
  root.updateMatrixWorld(true);
  for (const b of Object.values(bones)) b.quaternion.identity();
  root.updateMatrixWorld(true);
  const REST = {}; for (const n in bones) REST[n] = bones[n].position.clone();   // parent/child rest world rotations are identity → local offset
  const gripInfo = grip ? installGrip(grip, { bones, skinned }) : null;   // opt-in (see header): before the toon pass
  if (grip && hubGraspHands && hubGraspHands.includes(grip.side)) throw Error('v5.grip and v5.hubGraspHands on the same hand');
  const hubGrasp = hubGraspHands ? cutForHubGrasp(hubGraspHands, { v, skinned }) : null;   // opt-in (see header): before the toon pass
  // ---- look (toon r6 = r5 look + wrist outline weights); hair none because the page URL has no ?hair
  const bg = scene.background;
  const toon = applyToon({ scene, root, bones, skinned, grid: null, floor: null, renderer, camera });
  scene.background = bg;   // keep the hub's transparent background
  if (toon.hair !== 'none') throw Error('V5 must be bald; got hair ' + toon.hair);
  if (hubGrasp) styleHubGrasp(hubGrasp, groundShadow);   // opt-in (see header): V5 skin + outline on the hub fist
  const wf = installWristFix({ bones, renderer: { render() { } } });   // drive manually (no hub render wrapper involved)
  if (!wf || wf.sides.length !== 2) throw Error('wristfix helper bones missing');
  // ---- hide the hub body, keep props
  const inCoach = o => { for (let q = o; q; q = q.parent) if (q === v.coach) return true; return false; };
  const hubHand = o => { for (let q = o; q; q = q.parent) if (/^WebXR_(Clipped_Hand|Wrist_Bridge)/.test(q.name || '')) return true; return false; };
  const keepHub = hubGrasp ? (o => { for (let q = o; q; q = q.parent) { const m = /^WebXR_Clipped_Hand_(left|right)$/.exec(q.name || ''); if (m) return hubGrasp.sides.includes(m[1]); } return false; }) : (() => false);
  const hidden = [];
  function hideHub() {
    scene.traverse(o => { if (!(o.isMesh || o.isLine || o.isPoints) || !o.visible) return; for (let q = o; q; q = q.parent) if (q === root) return;
      if (inCoach(o) || (hubHand(o) && !keepHub(o))) { o.visible = false; hidden.push(o.name || o.type); } });
  }
  hideHub();
  // ---- hard-edge ground shadow
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const sun = new THREE.DirectionalLight(0xffffff, 0); sun.position.set(...SHADOW.sun); sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW.mapSize, SHADOW.mapSize);
  Object.assign(sun.shadow.camera, { left: -SHADOW.half, right: SHADOW.half, top: SHADOW.half, bottom: -SHADOW.half, near: 0.1, far: 12 }); sun.shadow.bias = -0.0005;
  sun.name = 'V5_ShadowSun'; scene.add(sun); scene.add(sun.target);
  // The hub viewer's own key light (DirectionalLight at (-2.5,4,4), castShadow, ortho shadow frustum ±1.9) would also cast onto the
  // V5 shadow plane once the shadow map is on: a second, long shadow toward screen-right that is cut hard by that ±1.9 frustum and
  // runs off the 1080 canvas (h-squat, h-forward-lunge, ...). V5 has exactly one shadow: the V5 sun's. Every other light: no shadow.
  const otherShadowLights = [];
  const muteOtherShadows = () => scene.traverse(o => { if (o.isLight && o !== sun && o.castShadow) { o.castShadow = false; otherShadowLights.push(o.name || o.type); } });
  muteOtherShadows();
  const plane = new THREE.Mesh(new THREE.CircleGeometry(6, 96).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: SHADOW.color, opacity: SHADOW.opacity }));
  plane.name = 'V5_ShadowPlane'; plane.receiveShadow = true; plane.position.y = 0.0005; scene.add(plane);
  // mat present: the shadow lands on the mat top instead of under it
  let matTop = null; scene.traverse(o => { if (o.name === 'prop_mat') { const b = new THREE.Box3().setFromObject(o); if (isFinite(b.max.y)) matTop = Math.max(matTop ?? -1, b.max.y); } });
  if (matTop !== null && matTop > 0 && matTop < 0.05) plane.position.y = matTop + 0.0005;
  root.traverse(o => { if (o.isMesh && !o.userData.__outline && !o.userData.__eye) o.castShadow = true; });
  if (groundShadow === false) { sun.castShadow = false; plane.visible = false; }   // opt-in close-up: no ground shadow (see header)

  // ---- pose transfer
  const hubBones = {}; v.coach.traverse(o => { if (o.isBone && NAMES.includes(o.name) && !hubBones[o.name]) hubBones[o.name] = o; });
  for (const n of NAMES) if (!hubBones[n]) throw Error('hub rig lacks bone ' + n);
  const _q = new THREE.Quaternion(), _p = new THREE.Vector3();
  const expQ = (r, q = new THREE.Quaternion()) => { const a = Math.hypot(r[0], r[1], r[2]); if (a < 1e-12) return q.identity(); const s = Math.sin(a / 2) / a; return q.set(r[0] * s, r[1] * s, r[2] * s, Math.cos(a / 2)); };
  let prevAB = [1 / 3, 2 / 3];
  const stretchOff = {};
  // spine: torso pivot must equal the hub torso pivot. 1) best slerp split (a,b) of the pelvis→torso world rotation over
  // spineLower/spineUpper (grid, then continuous refine, damped toward the previous frame); 2) stretch for the unreachable rest.
  // Pelvis and torso-and-above world rotations are unchanged.
  function fitSpine(W, P, T) {
    const d1 = REST.spineLower, d2 = REST.spineUpper, d3 = REST.torso;
    const fk = (qa, qb) => P.clone().add(d1.clone().applyQuaternion(W.pelvis)).add(d2.clone().applyQuaternion(qa)).add(d3.clone().applyQuaternion(qb));
    const e0 = fk(W.spineLower, W.spineUpper).distanceTo(T);
    if (e0 < 0.0002) return { e0, e: e0, fitted: false };
    let best = null;
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) {
      const a = i / 40, b = j / 40, qa = W.pelvis.clone().slerp(W.torso, a), qb = W.pelvis.clone().slerp(W.torso, b), e = fk(qa, qb).distanceTo(T);
      const c = e * e + 1e-5 * ((a - 1 / 3) ** 2 + (b - 2 / 3) ** 2) + 1e-5 * ((a - prevAB[0]) ** 2 + (b - prevAB[1]) ** 2);
      if (!best || c < best.c) best = { c, e, a, b, qa, qb };
    }
    // refine (a,b) continuously (coordinate search, step halving) so the split does not jump between grid cells
    const cost = (a, b) => { const qa = W.pelvis.clone().slerp(W.torso, a), qb = W.pelvis.clone().slerp(W.torso, b), e = fk(qa, qb).distanceTo(T);
      return { c: e * e + 1e-5 * ((a - 1 / 3) ** 2 + (b - 2 / 3) ** 2) + 1e-5 * ((a - prevAB[0]) ** 2 + (b - prevAB[1]) ** 2), e, a, b, qa, qb }; };
    for (let h = 1 / 80; h > 1e-5; h /= 2) for (let moved = true, n = 0; moved && n < 20; n++) { moved = false;
      for (const [da, db] of [[h, 0], [-h, 0], [0, h], [0, -h]]) { const a = Math.min(1, Math.max(0, best.a + da)), b = Math.min(1, Math.max(0, best.b + db)), c = cost(a, b); if (c.c < best.c - 1e-14) { best = c; moved = true; } } }
    prevAB = [best.a, best.b];
    // blend weight from the hub's own spine (kept when it already fits) to the fitted split: continuous in e0, so no frame jumps
    const wgt = Math.min(1, Math.max(0, (e0 - 0.0002) / 0.0028)), sw = wgt * wgt * (3 - 2 * wgt);
    W.spineLower = W.spineLower.clone().slerp(best.qa, sw); W.spineUpper = W.spineUpper.clone().slerp(best.qb, sw);
    const at = () => fk(W.spineLower, W.spineUpper).sub(T);
    // 3) what rotation cannot reach (hub spine longer than the V5 chain, e.g. bridges: ~5 mm) is taken up by lengthening the two
    //    spine segments equally (bone offsets only; capped at 3 cm), so the torso pivot - and everything above it - lands on the hub's.
    const res = at(), e = res.length(); let stretch = 0;
    if (e > 0.0002) { const r = res.clone().multiplyScalar(-1); if (r.length() > 0.03) r.setLength(0.03); stretch = r.length();
      stretchOff.spineUpper = r.clone().multiplyScalar(0.5).applyQuaternion(W.spineLower.clone().invert());
      stretchOff.torso = r.clone().multiplyScalar(0.5).applyQuaternion(W.spineUpper.clone().invert()); }
    return { e0, eRot: e, e: Math.max(0, e - stretch), stretch: +stretch.toFixed(5), fitted: true, blend: +sw.toFixed(4), a: best.a, b: best.b };
  }
  const wp = n => bones[n].getWorldPosition(new THREE.Vector3());
  const ang = (a, b, c) => a.clone().sub(b).angleTo(c.clone().sub(b)) * 180 / Math.PI;
  /** Pose V5 from the hub's current solved pose (call after stageAt), drive wrist helpers. Returns per-frame diagnostics. */
  function pose() {
    v.coach.updateMatrixWorld(true);
    const W = {}, HP = {};
    for (const n of NAMES) { W[n] = hubBones[n].getWorldQuaternion(new THREE.Quaternion()).normalize(); HP[n] = hubBones[n].getWorldPosition(new THREE.Vector3()); }
    for (const k in stretchOff) delete stretchOff[k];
    const sp = fitSpine(W, HP.pelvis, HP.torso);
    for (const n of ['spineUpper', 'torso']) bones[n].position.copy(REST[n]).add(stretchOff[n] || new THREE.Vector3());
    for (const n of NAMES) { const p = PARENT[n]; bones[n].quaternion.copy(p ? _q.copy(W[p]).invert().multiply(W[n]) : W[n]); }
    if (headFlexDeg) bones.head.quaternion.multiply(_q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), headFlexDeg * Math.PI / 180));   // opt-in (see header)
    bones.pelvis.position.copy(HP.pelvis);   // root has identity transform: pelvis local = world
    root.updateMatrixWorld(true);
    let scap = null;
    if (scapulaShift) {   // opt-in: scapula translation (see header). Torso pivot of V5 already sits on the hub's (fitSpine).
      const tp = wp('torso'), tqi = W.torso.clone().invert(); scap = {};
      for (const n of ['leftScapula', 'rightScapula']) { bones[n].position.copy(HP[n].clone().sub(tp).applyQuaternion(tqi)); scap[n] = bones[n].position.clone().sub(REST[n]).toArray().map(x => +x.toFixed(5)); }
      root.updateMatrixWorld(true);
    }
    wf.update(); for (const s of ['left', 'right']) bones[s + 'Forearm'].updateMatrixWorld(true);
    let posErr = 0, posErrBone = '';
    for (const n of NAMES) { if (n === 'spineLower' || n === 'spineUpper') continue;   // hub spine pivots are not anatomical (not comparable)
      const e = wp(n).distanceTo(HP[n]); if (e > posErr) { posErr = e; posErrBone = n; } }
    const A = {}, H = {};
    for (const s of ['left', 'right']) {
      A[s + 'Elbow'] = ang(wp(s + 'UpperArm'), wp(s + 'Forearm'), wp(s + 'Hand')); A[s + 'Knee'] = ang(wp(s + 'Thigh'), wp(s + 'Shin'), wp(s + 'Foot'));
      H[s + 'Elbow'] = ang(HP[s + 'UpperArm'], HP[s + 'Forearm'], HP[s + 'Hand']); H[s + 'Knee'] = ang(HP[s + 'Thigh'], HP[s + 'Shin'], HP[s + 'Foot']);
    }
    const q = {}; for (const n of NAMES) q[n] = bones[n].quaternion.toArray().map(x => +x.toFixed(7));
    return { p: bones.pelvis.position.toArray().map(x => +x.toFixed(6)), q, spine: sp, posErr: +posErr.toFixed(5), posErrBone, angV5: A, angHub: H,
      wrist: { theta: { ...wf.stats.theta }, swing: { ...wf.stats.swing }, wraps: wf.stats.wraps, seeks: wf.stats.seeks }, ...(scap ? { scapulaShift: scap } : {}), ...(headFlexDeg ? { headFlexDeg } : {}) };
  }
  // ---- analytic shadow / body extent (call after pose()): sampled skinned vertices of every shadow caster, each projected along
  // the sun direction onto the shadow plane. Returns screen px boxes of the size x size master canvas as rendered (with the
  // camera's view offset when render-masters-v5.mjs sets a per-action view window; none for every other action, where this is the
  // recipe camera's own view) and the light-space reach of casters + shadow points (must stay inside the shadow camera's ortho frustum).
  const sampleIdx = new Map();
  const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  const castersNow = () => { const c = []; scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.castShadow || !o.geometry?.attributes?.position || o === plane || !shown(o)) return;
    let idx = sampleIdx.get(o); if (!idx) { const n = o.geometry.attributes.position.count, st = Math.max(1, Math.floor(n / 4000)); idx = []; for (let i = 0; i < n; i += st) idx.push(i); sampleIdx.set(o, idx); }
    c.push({ o, idx }); }); return c; };
  const _v = new THREE.Vector3(), _s = new THREE.Vector3();
  // hub fist (hubGraspHands): outside a render the hub keeps it at its neutral place, so its posed matrix = V5 hand bone frame x rel
  const worldOf = hubGrasp ? (o => hubGrasp.posedMatrix(o, bones) || o.matrixWorld) : (o => o.matrixWorld);
  // margin > 0: also the span, along each canvas side, of the shadow points that come within margin px of that side
  // (edgeSpan.left = [yMin, yMax] in px, ...; only sides that are reached). render-masters-v5.mjs then requires the rendered
  // border to be opaque body/prop over that span: the shadow may leave the canvas only where the surface it lies on (e.g. the
  // exercise mat, which V4 already cuts at the same edge) leaves it too.
  function extent(size, margin = 0) {
    hideHub(); muteOtherShadows(); scene.updateMatrixWorld(true); camera.updateMatrixWorld(); const casters = castersNow();
    sun.updateMatrixWorld(); sun.target.updateMatrixWorld();
    const sp = sun.getWorldPosition(new THREE.Vector3()), tp = sun.target.getWorldPosition(new THREE.Vector3());
    const L = tp.clone().sub(sp).normalize(), R = L.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), U = R.clone().cross(L);
    const py = plane.position.y, bb = () => [1e9, 1e9, -1e9, -1e9], sh = bb(), bo = bb(); let lmax = 0, dmin = 1e9, dmax = -1e9, nAbove = 0;
    const span = {}, edge = (k, t) => { const e = span[k] || (span[k] = [1e9, -1e9]); e[0] = Math.min(e[0], t); e[1] = Math.max(e[1], t); };
    const px = (p, b) => { _s.copy(p).project(camera); const x = (_s.x + 1) / 2 * size, y = (1 - _s.y) / 2 * size; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); };
    const ls = p => { const d = p.clone().sub(sp); lmax = Math.max(lmax, Math.abs(d.dot(R)), Math.abs(d.dot(U))); const z = d.dot(L); dmin = Math.min(dmin, z); dmax = Math.max(dmax, z); };
    for (const { o, idx } of casters) for (const i of idx) {
      o.getVertexPosition(i, _v); _v.applyMatrix4(worldOf(o)); px(_v, bo); ls(_v);
      if (groundShadow !== false && _v.y > py) { nAbove++; const s = _v.clone().addScaledVector(L, (_v.y - py) / -L.y); px(s, sh); ls(s);
        if (margin > 0) { const x = (_s.x + 1) / 2 * size, y = (1 - _s.y) / 2 * size;
          if (x < margin) edge('left', y); if (x > size - margin) edge('right', y); if (y < margin) edge('top', x); if (y > size - margin) edge('bottom', x); } }
    }
    const r = a => a.map(x => +x.toFixed(1));
    return { shadow: r(sh), body: r(bo), lightHalfNeeded: +lmax.toFixed(4), lightHalf: SHADOW.half, depth: [+dmin.toFixed(3), +dmax.toFixed(3)], casterMeshes: casters.length, casterSamples: casters.reduce((s, c) => s + c.idx.length, 0), shadowPoints: nAbove, otherShadowLights: otherShadowLights.length,
      ...(margin > 0 ? { edgeSpan: Object.fromEntries(Object.entries(span).map(([k, e]) => [k, r(e)])) } : {}) };
  }
  function render() {
    // hub install steps may re-show meshes; keep the hub body hidden on every frame
    hideHub(); muteOtherShadows();
    renderer.render(scene, camera);
    edge = edgeAlpha();
    return renderer.domElement.toDataURL('image/png');
  }
  // alpha on the 1-px border of the drawing buffer just rendered: {side: [pixels with alpha > 0, max alpha]} (nothing may reach the edge)
  let edge = null;
  function edgeAlpha() {
    const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, out = {};
    for (const [k, x, y, cw, ch] of [['bottom', 0, 0, w, 1], ['top', 0, h - 1, w, 1], ['left', 0, 0, 1, h], ['right', w - 1, 0, 1, h]]) {
      const b = new Uint8Array(cw * ch * 4); gl.readPixels(x, y, cw, ch, gl.RGBA, gl.UNSIGNED_BYTE, b);
      let n = 0, m = 0; for (let i = 3; i < b.length; i += 4) if (b[i] > 0) { n++; if (b[i] > m) m = b[i]; } out[k] = [n, m];
    }
    return out;
  }
  // alpha along one canvas side of the drawing buffer just rendered, in screen order (left/right: top to bottom; top/bottom: left
  // to right), on the border line (inset 0) or `inset` px further in. Index i = screen px i of a size x size master.
  function borderAlpha(side, inset = 0) {
    const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, vert = side === 'left' || side === 'right';
    const x = side === 'left' ? inset : side === 'right' ? w - 1 - inset : 0, y = side === 'bottom' ? inset : side === 'top' ? h - 1 - inset : 0;
    const n = vert ? h : w, b = new Uint8Array(n * 4); gl.readPixels(x, y, vert ? 1 : w, vert ? h : 1, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const a = new Array(n); for (let i = 0; i < n; i++) a[i] = b[(vert ? n - 1 - i : i) * 4 + 3]; return a;
  }
  window.__v5 = { pose, render, extent, borderAlpha, get edge() { return edge; }, sun, plane, bones, root, toon, hidden, ...(gripInfo ? { grip: gripInfo } : {}), ...(hubGrasp ? { hubGrasp } : {}), info: { hiddenHub: hidden.slice(), mutedShadowLights: otherShadowLights.slice(), shadowPlaneY: plane.position.y, matTop, outlines: toon.outlines, hair: toon.hair, outfit: toon.outfit, toonN: toon.toonN, wristSides: wf.sides, ...(scapulaShift ? { scapulaShift: true } : {}), ...(headFlexDeg ? { headFlexDeg } : {}), ...(groundShadow === false ? { groundShadow: false } : {}), ...(gripInfo ? { grip: gripInfo.info } : {}), ...(hubGrasp ? { hubGraspHands: hubGrasp.info } : {}) } };
  return window.__v5.info;
}

// ---- grip (opt-in, see header). Hand bind frame (metres): wrist pivot at 0, fingers along -X (right hand; mirrored for left),
// palm toward -Y, thumb toward +Z (rest world rotations are identity, so this is also the bone's local frame).
const GRIP = { cx: -0.085, cy: -0.0265, r: 0.0145, xs: -0.085, ramp: 0.02, thumbZ: 0.036, thumbLift: 0.012, thumbL0: -0.055, thumbL1: -0.07, thumbXs: -0.075,
  bands: [0.036, 0.011, -0.012, -0.037], z0: -0.065, z1: 0.10, head: { z0: 0.10, z1: 0.145, r: 0.034 }, cap: { z: -0.072, r: 0.019, t: 0.008 } };
function installGrip(opt, { bones, skinned }) {
  const g = { ...GRIP, ...opt }, side = g.side === 'left' ? 'left' : 'right', sx = side === 'left' ? -1 : 1, hand = side + 'Hand';
  const ss = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
  const band = z => z > g.bands[0] ? 4 : z > g.bands[1] ? 0 : z > g.bands[2] ? 1 : z > g.bands[3] ? 2 : 3;
  const out = { side, verts: 0, meshes: 0, gap: null };
  // collect the hand's rigid vertices (hand weight >= 0.999) of every skinned mesh in the hand bind frame (x mirrored for the left)
  const sets = [];
  for (const m of skinned) {
    const names = m.skeleton.bones.map(b => b.name), hi = names.indexOf(hand); if (hi < 0) continue;
    const g0 = m.geometry, P = g0.attributes.position, N = g0.attributes.normal, J = g0.attributes.skinIndex, W = g0.attributes.skinWeight;
    const toL = m.skeleton.boneInverses[hi].clone().multiply(m.bindMatrix), toM = toL.clone().invert(), idx = [], L = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { let w = 0; for (let k = 0; k < 4; k++) if (J.getComponent(i, k) === hi) w += W.getComponent(i, k);
      if (w < 0.999) continue; v.fromBufferAttribute(P, i).applyMatrix4(toL); if (sx * v.x > -0.03) continue; idx.push(i); L.push([sx * v.x, v.y, v.z]); }
    if (idx.length) sets.push({ m, P, N, toM, idx, L });
  }
  const all = sets.flatMap(S => S.L), isThumb = p => p[2] > g.thumbZ;
  for (const p of all) if (isThumb(p)) p[1] += g.thumbLift * ss((g.thumbL0 - p[0]) / (g.thumbL0 - g.thumbL1));   // thumb lifted onto the handle
  const xsOf = p => isThumb(p) ? g.thumbXs : g.xs, bandOf = p => isThumb(p) ? 4 : band(p[2]);
  const gap = [0, 0, 0, 0, 0], gapSet = [false, false, false, false, false];
  for (const p of all) { const f = bandOf(p), xs = xsOf(p); if (Math.abs(p[0] - xs) < 0.006) { const r = Math.hypot(p[0] - g.cx, p[1] - g.cy) - g.r; if (!gapSet[f] || r < gap[f]) { gap[f] = r; gapSet[f] = true; } } }
  const wrapR = (p, f, extra) => { const s = xsOf(p) - p[0], r0 = Math.hypot(xsOf(p) - g.cx, p[1] - g.cy), gv = gap[f], c = gv < 0 ? gv : gv * ss(s / g.ramp); return r0 - c - extra * ss(s / g.ramp); };
  // second pass: each finger's lowest palmar point past the ramp lands on the handle surface
  const extra = [0, 0, 0, 0, 0];
  { const lo = [1e9, 1e9, 1e9, 1e9, 1e9]; for (const p of all) { const f = bandOf(p), s = xsOf(p) - p[0]; if (s > g.ramp) lo[f] = Math.min(lo[f], wrapR(p, f, 0) - g.r); }
    for (let f = 0; f < 5; f++) if (lo[f] < 1e8) extra[f] = lo[f]; }
  let n = 0;
  for (const S of sets) {
    const v = new THREE.Vector3(), q = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1), nv = new THREE.Vector3();
    S.idx.forEach((i, k) => {
      const p = S.L[k], f = bandOf(p), xs = xsOf(p); let ang = 0;
      if (p[0] < xs) { const s = xs - p[0], r = wrapR(p, f, extra[f]), a0 = Math.atan2(p[1] - g.cy, xs - g.cx), phi = s / Math.max(r, 0.005);
        p[0] = g.cx + r * Math.cos(a0 + phi); p[1] = g.cy + r * Math.sin(a0 + phi); ang = phi; }
      v.set(sx * p[0], p[1], p[2]).applyMatrix4(S.toM); S.P.setXYZ(i, v.x, v.y, v.z);
      if (ang && S.N) { q.setFromAxisAngle(Z, sx * ang); nv.fromBufferAttribute(S.N, i).applyQuaternion(q).normalize(); S.N.setXYZ(i, nv.x, nv.y, nv.z); }
      n++;
    });
    S.P.needsUpdate = true; if (S.N) S.N.needsUpdate = true; S.m.geometry.computeBoundingSphere(); out.meshes++;
  }
  out.verts = n; out.gapMm = gap.map((x, f) => +((x + extra[f]) * 1000).toFixed(1));
  // grip measure in the hand frame (rigid with the hand bone, so it holds on every frame): deepest hand vertex inside the handle, and
  // hand vertices within 2 mm of the handle surface per finger band (index, middle, ring, little, thumb)
  let pen = -1e9; const contact = [0, 0, 0, 0, 0];
  for (const S of sets) S.L.forEach(p => { if (p[2] < g.z0 || p[2] > g.z1) return; const d = g.r - Math.hypot(p[0] - g.cx, p[1] - g.cy); pen = Math.max(pen, d); if (d > -0.002) contact[bandOf(p)]++; });
  out.handlePenMm = +(pen * 1000).toFixed(2); out.contact = contact;
  // dumbbell (child of the V5 hand bone; local = hand bind frame)
  let mesh = null;
  if (g.dumbbell) {
    const light = new THREE.Vector3(-0.45, 0.75, 0.55).normalize();
    const mk = (base, shade) => new THREE.ShaderMaterial({ name: 'v5-grip-toon', uniforms: { uBase: { value: new THREE.Color(base) }, uShade: { value: new THREE.Color(shade) }, uLight: { value: light } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uBase; uniform vec3 uShade; uniform vec3 uLight; varying vec3 vN; void main(){ gl_FragColor = vec4(dot(normalize(vN), uLight) > 0.15 ? uBase : uShade, 1.0); }' });
    const ink = new THREE.ShaderMaterial({ name: 'v5-grip-ink', side: THREE.BackSide, uniforms: { uInk: { value: new THREE.Color(0x2a1a12) }, uW: { value: 0.0016 } },
      vertexShader: 'uniform float uW; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uW, 1.0); }',
      fragmentShader: 'uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0); }' });
    const grp = new THREE.Group(); grp.name = 'V5_GripDumbbell'; grp.position.set(sx * g.cx, g.cy, 0);
    const part = (geo, mat, z) => { geo.rotateX(Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.z = z; m.frustumCulled = false;
      const o = new THREE.Mesh(geo, ink); o.frustumCulled = false; o.userData.__outline = true; o.renderOrder = -1; m.add(o); grp.add(m); return m; };
    const steel = mk(0x9aa3ad, 0x667079), rubber = mk(0x3b4048, 0x24282e);
    part(new THREE.CylinderGeometry(g.r, g.r, g.head.z0 - g.cap.z, 32), steel, (g.head.z0 + g.cap.z) / 2);
    part(new THREE.CylinderGeometry(g.head.r, g.head.r, g.head.z1 - g.head.z0, 6), rubber, (g.head.z0 + g.head.z1) / 2);
    part(new THREE.CylinderGeometry(g.cap.r, g.cap.r, g.cap.t, 32), steel, g.cap.z - g.cap.t / 2);
    bones[hand].add(grp); mesh = grp;
  }
  out.dumbbell = !!mesh;
  const handle = { cx: sx * g.cx, cy: g.cy, r: g.r, z0: g.cap.z - g.cap.t, z1: g.head.z0, head: g.head };
  return { info: out, mesh, handle, bone: hand };
}

// ---- hub grasp hands (opt-in, see header). Hand bone frame (metres, unit scale): wrist pivot at 0, fingers along -X (right hand;
// mirrored for the left: sx), palm toward -Y, thumb toward +Z. The hub rig and the V5 rig share it (rest world rotations identity,
// V5 copies the hub hand's world rotation, pivots coincide), so a point rigid with the hub hand has the same hand-frame coordinates on V5.
const HG = { inShell: 0.001, fistShell: 0.0015, cut: 0.010, ramp: 0.012, rigid0: 0.010, rigid1: 0.002, inset: 0.0006, bins: 36, ring: 0.004, olW: 0.5 };   // olW = toon-r6 OL2.hand
const unitFrame = (o, m = new THREE.Matrix4()) => { const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); o.matrixWorld.decompose(p, q, s); return m.compose(p, q, new THREE.Vector3(1, 1, 1)); };
function cutForHubGrasp(sidesIn, { v, skinned }) {
  const sides = [...new Set(sidesIn)];
  if (!sides.length || sides.some(s => s !== 'left' && s !== 'right')) throw Error('bad v5.hubGraspHands (left/right)');
  const J = window.__webxrWristJoin;
  if (!J || !J.active || !J.meshes?.hands) throw Error('v5.hubGraspHands needs the hub fixed grasp hands (recipe hands bar-grasp / dumbbell-grasp / fixed-grasp)');
  const hubBone = {}; v.coach.traverse(o => { if (o.isBone && /^(left|right)Hand$/.test(o.name) && !hubBone[o.name]) hubBone[o.name] = o; });
  // rel = hub fist mesh in its hand bone frame, read inside a real hub render (the hub places the fist only during a render)
  const rel = {};
  J.sample(() => { for (const s of sides) { const hm = J.meshes.hands[s]; if (!hm) throw Error('no hub fixed hand ' + s); hm.updateMatrixWorld(true);
    rel[s] = unitFrame(hubBone[s + 'Hand']).invert().multiply(hm.matrixWorld); } });
  const info = { sides, perSide: {} }, ring = {}, seamIdx = new Map(), inside = new Map();
  for (const side of sides) {
    const sx = side === 'left' ? -1 : 1, hm = J.meshes.hands[side], P = hm.geometry.attributes.position, v3 = new THREE.Vector3();
    const H = []; for (let i = 0; i < P.count; i++) { v3.fromBufferAttribute(P, i).applyMatrix4(rel[side]); H.push([sx * v3.x, v3.y, v3.z]); }
    const x0 = Math.max(...H.map(p => p[0]));   // the fist's open wrist end (a plane in the hand frame)
    const R = H.filter(p => p[0] > x0 - HG.ring), cy = R.reduce((a, p) => a + p[1], 0) / R.length, cz = R.reduce((a, p) => a + p[2], 0) / R.length;
    // fist surface radius about the ring axis, by ray from the axis (hand frame, x mirrored by sx), first hit; null = no hit
    const fist = new THREE.Mesh(hm.geometry.clone().applyMatrix4(rel[side]), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })), rc = new THREE.Raycaster();
    fist.updateMatrixWorld(true);
    const fistR = (x, a) => { rc.set(new THREE.Vector3(sx * x, cy, cz), new THREE.Vector3(0, Math.cos(a), Math.sin(a))); const h = rc.intersectObject(fist, false)[0]; return h ? h.distance : null; };
    // ring profile just inside the open end (bins of 10 deg, linear between bin centres)
    const prof = Array.from({ length: HG.bins }, (_, b) => fistR(x0 - 0.0005, ((b + 0.5) / HG.bins) * 2 * Math.PI - Math.PI));
    for (let b = 0; b < HG.bins; b++) if (prof[b] === null) { let l = 1, r = 1; while (prof[(b - l + HG.bins) % HG.bins] === null && l < HG.bins) l++; while (prof[(b + r) % HG.bins] === null && r < HG.bins) r++;
      const a = prof[(b - l + HG.bins) % HG.bins], c = prof[(b + r) % HG.bins]; if (a === null || c === null) throw Error('v5.hubGraspHands: fist wrist ring not found ' + side); prof[b] = a + (c - a) * l / (l + r); }
    const rAt = (y, z) => { const a = (Math.atan2(z - cz, y - cy) + Math.PI) / (2 * Math.PI) * HG.bins - 0.5, b0 = Math.floor(a), f = a - b0, i0 = ((b0 % HG.bins) + HG.bins) % HG.bins, i1 = (i0 + 1) % HG.bins; return prof[i0] * (1 - f) + prof[i1] * f; };
    let rayMiss = 0;
    ring[side] = { x0, cy, cz, prof: prof.slice(), rAt, sx };
    const st = { fistX0Mm: +(x0 * 1000).toFixed(2), fistRingMm: [Math.min(...prof), Math.max(...prof)].map(x => +(x * 1000).toFixed(1)), cut: 0, blended: 0, rebound: 0, meshes: 0, tris: 0 };
    const ss = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
    for (const m of skinned) {
      const names = m.skeleton.bones.map(b => b.name), hi = names.indexOf(side + 'Hand'); if (hi < 0) continue;
      const chain = new Set(names.map((n, i) => (n === side + 'Hand' || n.startsWith(side + 'WristBend') || n.startsWith(side + 'Forearm')) ? i : -1).filter(i => i >= 0));
      const g = m.geometry, Pm = g.attributes.position, Nm = g.attributes.normal, Ji = g.attributes.skinIndex, Wi = g.attributes.skinWeight;
      const toL = m.skeleton.boneInverses[hi].clone().multiply(m.bindMatrix), toM = toL.clone().invert(), drop = new Uint8Array(Pm.count), p = new THREE.Vector3();
      let touched = 0;
      for (let i = 0; i < Pm.count; i++) {
        let w = 0; for (let k = 0; k < 4; k++) if (chain.has(Ji.getComponent(i, k))) w += Wi.getComponent(i, k); if (w < 0.5) continue;
        p.fromBufferAttribute(Pm, i).applyMatrix4(toL); const x = sx * p.x; if (x > x0 + HG.ramp) continue;
        if (x < x0 - HG.cut) { drop[i] = 1; st.cut++; touched++; continue; }
        // blend the cross-section onto the fist's wrist ring (radially about the ring centre), 0 at x0+ramp .. 1 at x0; inside the fist
        // (x < x0) onto the fist's own surface at that x, so the V5 wrist end stays just under the fist
        const t = ss((x0 + HG.ramp - x) / HG.ramp), r = Math.hypot(p.y - cy, p.z - cz);
        let rT = rAt(p.y, p.z) - HG.inset;
        if (x < x0) { const fr = fistR(x, Math.atan2(p.z - cz, p.y - cy)); if (fr === null) rayMiss++; else rT = Math.min(rT + HG.inset, fr) - HG.inset; }
        if (r > 1e-6) { const k = (r + (rT - r) * t) / r; p.y = cy + (p.y - cy) * k; p.z = cz + (p.z - cz) * k; }
        p.applyMatrix4(toM); Pm.setXYZ(i, p.x, p.y, p.z); st.blended++; touched++;
        // rigid with the hand bone from x0+rigid1 on (ramped from x0+rigid0), so the seam follows the fist on every frame
        const u = ss((x0 + HG.rigid0 - x) / (HG.rigid0 - HG.rigid1));
        if (u > 0) { const W = [0, 1, 2, 3].map(k => [Ji.getComponent(i, k), Wi.getComponent(i, k)]); let slot = W.findIndex(e => e[0] === hi && e[1] > 0);
          if (slot < 0) { slot = W.reduce((b, e, k) => e[1] < W[b][1] ? k : b, 0); W[slot] = [hi, 0]; }
          for (let k = 0; k < 4; k++) W[k][1] = k === slot ? W[k][1] + (1 - W[k][1]) * u : W[k][1] * (1 - u);
          const sum = W.reduce((a, e) => a + e[1], 0); for (let k = 0; k < 4; k++) { Ji.setComponent(i, k, W[k][0]); Wi.setComponent(i, k, W[k][1] / sum); }
          st.rebound++; }
        if (Math.abs(x - x0) <= 0.001) { const l = seamIdx.get(m) || []; l.push([i, side]); seamIdx.set(m, l); }
        if (x < x0) { const l = inside.get(m) || []; l.push([i, (x0 - x) / HG.inShell]); inside.set(m, l); }
      }
      if (!touched) continue;
      const I = g.index.array, keep = []; for (let t = 0; t < I.length; t += 3) { if (drop[I[t]] || drop[I[t + 1]] || drop[I[t + 2]]) { st.tris++; continue; } keep.push(I[t], I[t + 1], I[t + 2]); }
      g.setIndex(keep); Pm.needsUpdate = true; Ji.needsUpdate = true; Wi.needsUpdate = true; if (Nm) Nm.needsUpdate = true; g.computeBoundingSphere(); st.meshes++;
      info.handMesh = info.handMesh || m;
    }
    st.rayMiss = rayMiss; fist.geometry.dispose();
    if (!st.cut || !st.blended) throw Error('v5.hubGraspHands: V5 hand ' + side + ' not found past the fist wrist end');
    info.perSide[side] = st;
  }
  const handMesh = info.handMesh; delete info.handMesh;
  const posedMatrix = (o, bones) => { for (const s of sides) if (o === J.meshes.hands[s]) return unitFrame(bones[s + 'Hand']).multiply(rel[s]); return null; };
  // seam measure (call after pose()): V5 seam vertices (within 1 mm of the fist's open end) in the posed V5 hand frame vs the fist ring:
  // step = V5 radius - fist radius at that angle (mm; - = inside the fist, + = a ledge outside it)
  const seam = bones => { const out = {}; const p = new THREE.Vector3();
    for (const s of sides) out[s] = { min: 1e9, max: -1e9, n: 0 };
    for (const [m, list] of seamIdx) { m.skeleton.update(); m.updateMatrixWorld(true);
      const inv = {}; for (const s of sides) inv[s] = unitFrame(bones[s + 'Hand']).invert();
      for (const [i, s] of list) { m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld).applyMatrix4(inv[s]); const R = ring[s];
        const d = Math.hypot(p.y - R.cy, p.z - R.cz) - R.rAt(p.y, p.z), o = out[s]; o.min = Math.min(o.min, d); o.max = Math.max(o.max, d); o.n++; } }
    for (const s of sides) { out[s].min = +(out[s].min * 1000).toFixed(2); out[s].max = +(out[s].max * 1000).toFixed(2); }
    return out; };
  return { sides, rel, ring, inside, info, J, handMesh, posedMatrix, seam };
}
function styleHubGrasp(hg, groundShadow) {
  const mat = hg.handMesh.material, ol = hg.handMesh.children.find(c => c.userData.__outline)?.material;
  if (!mat || !ol) throw Error('v5.hubGraspHands: V5 toon materials missing');
  for (const s of hg.sides) {
    const hm = hg.J.meshes.hands[s], g = hm.geometry, n = g.attributes.position.count, N = g.attributes.normal;
    const tw = new Float32Array(n * 4); for (let i = 0; i < n; i++) tw[4 * i] = 1;   // skin region
    g.setAttribute('toonW', new THREE.BufferAttribute(tw, 4));
    g.setAttribute('toonN', new THREE.BufferAttribute(Float32Array.from(N.array), 3));   // shading normals = the fist's own smooth normals
    // outline weight = the V5 hand weight 0.5, ramped up from 0 over the first 1.5 mm of the fist's open wrist ring (the ring's shell then
    // lies on the surface); the V5 wrist inside the fist has no shell (below), so the silhouette line passes from the V5 wrist to the fist
    const P = g.attributes.position, R = hg.ring[s], w = new Float32Array(n), q = new THREE.Vector3();
    for (let i = 0; i < n; i++) { q.fromBufferAttribute(P, i).applyMatrix4(hg.rel[s]); const u = Math.min(1, Math.max(0, (R.x0 - R.sx * q.x) / HG.fistShell)); w[i] = HG.olW * u * u * (3 - 2 * u); }
    g.setAttribute('olW', new THREE.BufferAttribute(w, 1));
    hm.material = mat; hm.castShadow = groundShadow !== false;
    const o = new THREE.Mesh(g, ol); o.name = 'V5_HubGraspOutline_' + s; o.userData.__outline = true; o.frustumCulled = false; o.renderOrder = -1; o.raycast = () => { };
    hm.add(o);
  }
  // V5 wrist inside the fist (0.6 mm under its surface): no outline shell there (it would poke through the fist on close shots)
  for (const [m, list] of hg.inside) { const A = m.geometry.attributes.olW; if (!A) continue;
    for (const [i, u0] of list) { const u = Math.min(1, u0); A.setX(i, A.getX(i) * (1 - u * u * (3 - 2 * u))); } A.needsUpdate = true; }
  hg.info.style = { material: mat.name, outline: ol.name, outlineWeight: HG.olW };
}
