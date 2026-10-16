// n-half-split 半跪半劈叉（扶砖） (half-kneeling half split, hands on blocks) · N HipLab 开胯 MVP 新增.
// LEFT knee down on the mat (shin flat, top of the foot down), RIGHT leg reaching forward with the heel on the mat and toes up.
// Both palms rest on two yoga blocks standing tall either side of the front leg. The hips sit back over the back knee while the
// front knee straightens and the chest hinges forward from the hips with a long back (back of the front thigh stretches, the
// first step toward the front splits); ease forward again. One slow rep / 8 s. The blocks carry the hands: the rig's long arms
// and waist < 45 limit cannot reach the floor. Head +Y, front faces +Z, body left = +X (frame of s-kneel-hipflex).
// Solver: pelvis height (py) keeps the back knee on the mat; the palms are placed on the blocks (arm IK finds the elbows).
import { build, keys, r4 } from '../lib/home-anim.mjs';
const DUR = 8, BH = 0.23, BZ = 0.47;
const p = keys([[0, 0], [0.5, 0], [2.6, 1], [4.6, 1], [6.8, 0]], DUR);
const hand = (x, s) => ({ mode: 'free', frame: 'world', palmAt: [x, BH + 0.002, BZ], finger: [0.08 * s, 0, 1], normal: [0, -1, 0], pole: [0.7 * s, 0.5, 0.2], relax: 0.5 });
const P = build(DUR, {
  pelvis: t => r4([0.0, 0.45, 0.075 - 0.025 * p(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 40 + 5 * p(t)]] },
  chest: { waist: [[[1, 0, 0], t => 23 + 4 * p(t)]] },
  hands: { left: hand(0.06, 1), right: hand(-0.30, -1) },
  feet: {
    right: { mode: 'free', frame: 'world', ankle: [-0.12, 0.078, 0.70], rot: [[[1, 0, 0], -62]], pole: [-0.12, 0.9, 0.5] },
    left: { mode: 'free', frame: 'world', ankle: [0.09, 0.0405, -0.36], rot: [[[1, 0, 0], 157.8]], pole: [0.085, 0.0, 0.40] },
  },
  constraints: [{ type: 'mid', limb: 'leftLeg', at: [0.087, 0.0488, 0.0496], axes: [0, 1, 0], weight: 3 }],
  solve: { vars: ['py'], reg: { py: 0.1 } },
}, { fold: p });
export default {
  id: 'n-half-split', name: '半跪半劈叉（扶砖）', nameEn: 'Half-Kneeling Half Split (Blocks)',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hamstrings'], side: 'right', pulseTrack: 'fold', pulseBase: 0.3 },
  camera: { dir: [-1, 0.3, 0.3], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1.0, drift: 2, at: 3.0, fitTimeline: true },
  frame: { mode: 'fit', width: 800, height: 640, cx: 512, cy: 560 },
  stillAt: 3.0,
  shadow: { joints: ['leftToe', 'rightAnkle', 'leftKnee', 'pelvis'],
    blobs: [{ j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftToe', to: 'rightAnkle', mid: 'leftKnee', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.12], size: [0.61, 1.83, 0.006], yaw: 0 },
    { type: 'mat', at: [0.06, BH, BZ + 0.01], size: [0.11, 0.1594, BH] },
    { type: 'mat', at: [-0.30, BH, BZ + 0.01], size: [0.11, 0.1594, BH] }],
  keyFrames: [0.3, 2.6, 4.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'leftAnkle' }, { j: 'rightAnkle' }],
    allowContact: ['torso|thighR', 'forearmR|thighR', 'forearmL|thighR'],
  },
};
