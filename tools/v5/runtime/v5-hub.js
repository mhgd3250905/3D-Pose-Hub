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

export async function installV5({ glb }) {
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
  // ---- look (toon r6 = r5 look + wrist outline weights); hair none because the page URL has no ?hair
  const bg = scene.background;
  const toon = applyToon({ scene, root, bones, skinned, grid: null, floor: null, renderer, camera });
  scene.background = bg;   // keep the hub's transparent background
  if (toon.hair !== 'none') throw Error('V5 must be bald; got hair ' + toon.hair);
  const wf = installWristFix({ bones, renderer: { render() { } } });   // drive manually (no hub render wrapper involved)
  if (!wf || wf.sides.length !== 2) throw Error('wristfix helper bones missing');
  // ---- hide the hub body, keep props
  const inCoach = o => { for (let q = o; q; q = q.parent) if (q === v.coach) return true; return false; };
  const hubHand = o => { for (let q = o; q; q = q.parent) if (/^WebXR_(Clipped_Hand|Wrist_Bridge)/.test(q.name || '')) return true; return false; };
  const hidden = [];
  function hideHub() {
    scene.traverse(o => { if (!(o.isMesh || o.isLine || o.isPoints) || !o.visible) return; for (let q = o; q; q = q.parent) if (q === root) return;
      if (inCoach(o) || hubHand(o)) { o.visible = false; hidden.push(o.name || o.type); } });
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
    bones.pelvis.position.copy(HP.pelvis);   // root has identity transform: pelvis local = world
    root.updateMatrixWorld(true);
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
      wrist: { theta: { ...wf.stats.theta }, swing: { ...wf.stats.swing }, wraps: wf.stats.wraps, seeks: wf.stats.seeks } };
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
      o.getVertexPosition(i, _v); _v.applyMatrix4(o.matrixWorld); px(_v, bo); ls(_v);
      if (_v.y > py) { nAbove++; const s = _v.clone().addScaledVector(L, (_v.y - py) / -L.y); px(s, sh); ls(s);
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
  window.__v5 = { pose, render, extent, borderAlpha, get edge() { return edge; }, sun, plane, bones, root, toon, hidden, info: { hiddenHub: hidden.slice(), mutedShadowLights: otherShadowLights.slice(), shadowPlaneY: plane.position.y, matTop, outlines: toon.outlines, hair: toon.hair, outfit: toon.outfit, toonN: toon.toonN, wristSides: wf.sides } };
  return window.__v5.info;
}
