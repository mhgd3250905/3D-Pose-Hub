// h-catcow-quad 四足猫牛式 (quadruped cat-cow) · H 居家核心拉伸系列.
// On hands and knees (hands under the shoulders, knees under the hips, toes tucked - the quadruped of w-bird-dog). CAT: the
// pelvis tucks, the back rounds up toward the ceiling and the head drops; COW: the pelvis tips forward, the belly sinks and the
// chest and head lift. Hands, knees and feet stay put; the shoulders stay stacked over the hands. 2 cycles / 8 s.
// Head points +X, face down (-Y), body right = +Z, body left = -Z. Solver: px, py and the waist c0 keep the knees pinned on the
// mat and the shoulders over the hands while the pelvis tilt and the spine bend are prescribed.
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, TILT = 12.778;
const c = keys([[0, 0], [1.0, 1], [1.6, 1], [2.8, -1], [3.4, -1], [4.0, 0], [5.0, 1], [5.6, 1], [6.8, -1], [7.4, -1]], DUR);   // +1 cat, -1 cow
const PT = 16, SP = 28;                                       // pelvis tilt and waist bend amplitude (deg)
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
const P = build(DUR, {
  pelvis: [-0.4559, 0.3975, -0.0041],
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], t => TILT + PT * c(t)]] },
  chest: { waist: [[[0, 0, 1], t => -SP * c(t)]] },
  hands: { right: floorHand(0.19), left: floorHand(-0.19) },
  feet: {
    left: { mode: 'floor', at: [-0.868, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
    right: { mode: 'floor', at: [-0.868, 0.0771], heading: 90, pitch: 62, pole: [-0.515, 0.0407, 0.0771] },
  },
  constraints: [
    { type: 'mid', limb: 'leftLeg', at: [-0.5101, 0.0385, -0.0857], weight: 1 },
    { type: 'mid', limb: 'rightLeg', at: [-0.51, 0.0385, 0.0771], weight: 1 },
    { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.8 },
    { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.5157, weight: 0.8 },
  ],
  solve: { vars: ['px', 'py', 'c0'], reg: { px: 1, py: 1, c0: 0.01 }, iters: 40 },
}, { cat: t => Math.abs(c(t)) });
export default {
  id: 'h-catcow-quad', name: '四足猫牛式', nameEn: 'Quadruped Cat-Cow',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['erectors', 'abs'], side: 'both', pulseTrack: 'cat', pulseBase: 0.35 },
  camera: { dir: [-0.15, 0.3, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'shoulderCenter'], pad: 0.14, k: 0.8, drift: 3, at: 1.3 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 1.3,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'leftToe', 'rightToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'rightKnee', rx: 40, ry: 11, a: 0.65 },
      { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 1.3, 3.1],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'rightKnee' }],
    straight: [{ j: 'elbow.right', min: 170 }, { j: 'elbow.left', min: 170 }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};
