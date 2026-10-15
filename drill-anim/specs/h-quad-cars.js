// h-quad-cars 四足髋关节画圈 (quadruped hip CARs, controlled articular rotations) · H 居家开胯系列.
// Quadruped: hands under the shoulders (arms straight), knees under the hips, toes tucked, trunk still (the solved quadruped of
// w-fire-hydrant, baked in). The RIGHT knee lifts a few cm, then draws the biggest slow circle the hip allows without the pelvis
// or spine moving: forward toward the chest (flexion) -> out to the side and up (abduction / external rotation) -> back behind
// the hip (extension) -> home, then the same circle in reverse. Knee keeps its ~90 deg bend. Works the hip through its full
// range under control (glutes, hip rotators, hip flexors). 1 circle each way / 8 s.
// Head points +X, face down (-Y), body right = +Z. No solver: knee/ankle/pole are rotated about the right hip (flexion about +Z,
// then abduction about the long axis +X), exact circular path as coordinate tracks.
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, FL = 38, AB = 58, A0 = 10;
const HIPR = [-0.503, 0.391, 0.077];
const KN0 = [-0.51, 0.039, 0.077], AN0 = [-0.868, 0.238, 0.077];
const mid = AN0.map((x, i) => (x + HIPR[i]) / 2), PO0 = KN0.map((x, i) => x + 2 * (x - mid[i]));
// psi: 0 -> 2pi forward circle (t 0.5..3.9), back 2pi -> 0 reverse circle (t 4.3..7.7); u: knee hover 0..1
const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : (1 - Math.cos(Math.PI * x)) / 2;
const psi = t => t < 4.1 ? 2 * Math.PI * smooth((t - 0.5) / 3.4) : 2 * Math.PI * (1 - smooth((t - 4.3) / 3.4));
const u = keys([[0, 0], [0.15, 0], [0.55, 1], [7.55, 1], [7.9, 0]], DUR);
const flex = t => FL * Math.sin(psi(t)) * u(t);
const abd = t => (A0 + (AB - A0) * (1 - Math.cos(psi(t))) / 2) * u(t);
const kf = t => 1.0 * Math.max(0, flex(t));   // extra knee bend while the hip flexes so the foot tucks in and clears the mat
const at = (pt, t, shin = false) => { const q = shin ? rotAbout(pt, KN0, [0, 0, 1], -kf(t)) : pt;
  return rotAbout(rotAbout(q, HIPR, [0, 0, 1], flex(t)), HIPR, [1, 0, 0], -abd(t)); };
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
const P = build(DUR, {
  pelvis: [-0.4559, 0.3975, -0.0041],
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 12.778]] },
  chest: { waist: [[[0, 0, 1], 0.02]] },
  hands: { right: floorHand(0.19), left: floorHand(-0.19) },
  feet: {
    left: { mode: 'floor', at: [-0.868, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
    right: { mode: 'free', frame: 'world', ankle: t => r4(at(AN0, t, true)), rot: [[[1, 0, 0], 62], [[0, 1, 0], 90], [[0, 0, 1], t => flex(t) - kf(t)], [[1, 0, 0], t => -abd(t)]], pole: t => r4(at(PO0, t)) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: t => Math.min(1, abd(t) / AB + Math.abs(flex(t)) / FL * 0.5) });
export default {
  id: 'h-quad-cars', name: '四足髋关节画圈', nameEn: 'Quadruped Hip CARs',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max', 'hip-abductors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.35 },
  camera: { dir: [-1, 0.7, 0.42], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightAnkle'], pad: 0.14, k: 0.8, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 700, height: 640, cx: 512, cy: 520 },
  stillAt: 2.2,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 },
      { j: 'rightKnee', rx: 40, ry: 11, a: 0.65, fade: [0.05, 0.2] }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.46, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.3, 1.35, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 175 }, { j: 'elbow.left', min: 175 }],
    allowContact: ['thighL|shinL', 'thighR|shinR', 'thighR|torso'],
  },
};
