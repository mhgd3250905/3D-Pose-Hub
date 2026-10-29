// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-bear-plank-r3.js';
// h-bear-plank 熊式支撑 (bear plank hold) · H 居家徒手全身系列.
// From the quadruped (hands under the shoulders, knees under the hips, toes tucked - the start of h-catcow-quad, flat back), brace
// the abs and float both knees ~3 cm off the mat; hold with a flat back and level hips (no piking), then set the knees down
// softly. 2 holds / 8 s: 0.9 s lift, 2.2 s hover, 0.6 s lower, 0.3 s rest.
// Head points +X, face down (-Y), body right = +Z, body left = -Z. Solver: px, py and the waist c0 follow the knee mid-pins
// (on the mat -> 3 cm up) with the shoulders stacked over the hands; hands and tucked toes stay planted.
import { build, keys } from './_home-armfix-r1.mjs';
const DUR = 8, TILT = 12.778, KY0 = 0.045, HOVER = 0.03;
const p = keys([[0, 0], [0.2, 0], [1.1, 1], [3.3, 1], [3.9, 0], [4.2, 0], [5.1, 1], [7.3, 1], [7.9, 0]], DUR);
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
const P = build(DUR, {
  pelvis: [-0.391929828141, 0.3975, -0.0041],
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], t => TILT - 2.5 * p(t)]] },
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { right: floorHand(0.19), left: floorHand(-0.19) },
  feet: {
    left: { mode: 'floor', at: [-0.875, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
    right: { mode: 'floor', at: [-0.875, 0.0771], heading: 90, pitch: 62, pole: [-0.515, 0.0407, 0.0771] },
  },
  constraints: [
    { type: 'mid', limb: 'leftLeg', at: [-0.5101, t => +(KY0 + HOVER * p(t)).toFixed(4), -0.0857], weight: 1 },
    { type: 'mid', limb: 'rightLeg', at: [-0.51, t => +(KY0 + HOVER * p(t)).toFixed(4), 0.0771], weight: 1 },
    { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.8 },
    { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.5128, weight: 0.8 },
  ],
  solve: { vars: ['px', 'py', 'c0'], reg: { px: 1, py: 1, c0: 0.01 }, iters: 40 },
}, { hover: p });
const spec = {
  id: 'h-bear-plank', name: '熊式支撑', nameEn: 'Bear Plank Hold',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['abs', 'quadriceps'], side: 'both', pulseTrack: 'hover', pulseBase: 0.35 },
  camera: { dir: [-0.15, 0.22, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'shoulderCenter'], pad: 0.14, k: 0.8, drift: 3, at: 2.0 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'leftToe', 'rightToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65, fade: [0.04, 0.09] }, { j: 'rightKnee', rx: 40, ry: 11, a: 0.65, fade: [0.04, 0.09] },
      { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 1.0, 2.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' , axes: 'xz' }, { j: 'rightKnee', axes: 'xz' }],
    straight: [{ j: 'elbow.right', min: 170 }, { j: 'elbow.left', min: 170 }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};

spec.id = "h-bear-plank-r4";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
