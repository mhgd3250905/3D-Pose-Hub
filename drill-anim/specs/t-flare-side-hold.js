import { floorDrill, curve, qaStd, norm, reach } from './_thomas.mjs';
// t-flare-side-hold 托马斯侧撑定格 (flare side hold). Body faces +Z (the camera), body left = +X, head points toward -X here:
// the trunk is rolled ~80 deg onto its right side, balanced on the locked right arm (right hand flat on the floor under the
// right shoulder). The legs are split wide in the frontal plane (left leg high, right leg low, feet off the floor), the left
// arm reaches straight up. Static hold with a slow breathing sway. Loop 8 s.
const T = 8, br = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 4);
const D = Math.PI / 180;
// leg in the body (rest) frame: abduction a deg out to its side, plus a little forward flexion f deg
const legRel = (sg, a, f) => norm([sg * Math.sin(a * D) * Math.cos(f * D), -Math.cos(a * D) * Math.cos(f * D), Math.sin(f * D)]).map(v => v * reach(179));
// raised left arm in the chest rest frame: straight out to the body's left (= up in the world when rolled 80 deg)
const SH = [0.1879, 1.3702, -0.0042], AL = 0.4846, adir = norm([0.906, 0.423, 0.05]);
const wristL = SH.map((v, i) => v + AL * adir[i]);
export default floorDrill({
  id: 't-flare-side-hold', name: '托马斯侧撑定格', nameEn: 'Flare Side Hold', T,
  handsDesc: {
    right: { mode: 'floor', at: [-0.50, 0.02], finger: [-0.6, 0.8], poleUp: [-0.2, -0.3, -1] },
    left: { mode: 'free', frame: 'chest', wrist: wristL, finger: adir, normal: [0, 0, 1], poleUp: [0.3, 1.0, -1] },
  },
  elbow: 179,
  solve: { vars: ['px', 'py', 'pz'], reg: { px: 0.05, py: 0.05, pz: 0.3 }, iters: 80 },
  fn: t => { const b = br(t);
    return { pitch: 4, roll: 65 + 2 * b, py: 0.52 + 0.01 * b, pw: 0.6, shift: 0, elbow: 177.5, elbowL: 179,
      legs: { left: { rel: legRel(1, 70 + 2 * b, 8), pf: 35, kneeUp: [0, 0, 1] }, right: { rel: legRel(-1, -18 - 2 * b, 8), pf: 35, kneeUp: [0, 0, 1] } } }; },
  highlight: { groups: ['obliques', 'deltoids'], side: 'right', pulseAt: [2, 6], pulseWidth: 1.2, pulseBase: 0.35 },
  camera: { dir: [0.15, 0.12, 1], fit: ['head', 'leftWrist', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 5, at: 2 },
  shadow: { joints: ['rightPalm', 'rightAnkle', 'pelvis'], blobs: [{ j: 'rightPalm', rx: 40, ry: 12, a: 0.7 }, { j: 'pelvis', rx: 110, ry: 18, a: 0.3 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.4, fade: [0.08, 0.4] }], bands: [] },
  keyFrames: [0, 2, 4],
  qa: qaStd({ more: { pins: [{ c: 'handR', when: 'always' }] } }),
});
