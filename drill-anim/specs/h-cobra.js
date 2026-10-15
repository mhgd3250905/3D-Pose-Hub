// h-cobra 眼镜蛇式 (cobra stretch, low-to-half cobra) · H 居家核心拉伸系列.
// Prone on the mat, legs long with the tops of the feet down, palms flat beside the chest, elbows bent and tucked. Press gently
// through the hands to peel the chest up (thoracic + lumbar extension to ~40 deg) while the hips and thighs stay on the mat and
// the shoulders stay down; hold and breathe into the front of the belly, then lower slowly. 2 reps / 8 s: 1.5 s up, 1.3 s hold,
// 1.0 s down, 0.2 s rest. Head points +X, face down (-Y), body left = -Z (frame of w-prone-swimmer). No solver: the waist bend
// is prescribed and the palms stay pinned on the mat (arm IK finds the elbows).
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, W0 = 7, W1 = 40, HX = -0.03, HZ = 0.25;
const p = keys([[0, 0], [0.1, 0], [1.6, 1], [2.9, 1], [3.9, 0], [4.1, 0], [5.6, 1], [6.9, 1], [7.9, 0]], DUR);
const floorHand = z => ({ mode: 'floor', at: [HX, z], finger: [1, Math.sign(z) * 0.12], poleUp: [Math.sign(z) * -0.35, 0.9, 0.0] });
const P = build(DUR, {
  pelvis: [-0.45, 0.141, 0],
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], t => 1.5 * p(t)]] },
  chest: { waist: [[[0, 0, 1], t => W0 + (W1 - W0) * p(t)]] },
  hands: { right: floorHand(HZ), left: floorHand(-HZ) },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: [0.083, 0.093, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [0.09, 0.5, -0.6] },
    right: { mode: 'free', frame: 'hips', ankle: [-0.083, 0.093, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [-0.09, 0.5, -0.6] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { up: p });
export default {
  id: 'h-cobra', name: '眼镜蛇式', nameEn: 'Cobra Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'up', pulseBase: 0.35 },
  camera: { dir: [1, 0.18, -0.75], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.75, drift: 3, at: 2.2 },
  frame: { mode: 'fit', width: 880, cx: 512, cy: 560 },
  stillAt: 2.2,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 15, a: 0.6 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.45 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 14, a: 0.25, dy: 5, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.5, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 1.0, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmR|torso', 'forearmL|torso', 'thighL|thighR'],
  },
};
