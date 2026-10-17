// n-prone-hip-ext 俯卧屈膝抬腿 (prone bent-knee hip extension lift) · N HipLab 开胯 MVP 新增.
// Lying face down, palms flat beside the chest, the LEFT leg long on the mat, the RIGHT knee bent 90 deg with the sole facing the
// ceiling. Squeezing the right buttock (not arching the lower back) the right thigh lifts a few centimetres off the mat (hip
// extension ~12 deg), holds 2 s and lowers. End-range active hip extension for sitters and for the back leg of the splits.
// 2 reps / 8 s: 1.0 s up, 2.0 s hold, 0.8 s down, 0.2 s rest.
// Head points +X, face down (-Y), body left = -Z (frame of h-cobra). No solver: the bent right leg turns about the hip.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';
const DUR = 8, EXT = 13, KN = 88;
const p = keys([[0, 0], [0.1, 0], [1.1, 1], [3.1, 1], [3.9, 0], [4.1, 0], [5.1, 1], [7.1, 1], [7.9, 0]], DUR);
const hips = { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], t => 1.2 * p(t)]] };
const LR = t => leg('right', -2 - EXT * p(t), KN, [[[0, 0, 1], -2]]);
const floorHand = z => ({ mode: 'floor', at: [-0.03, z], finger: [1, Math.sign(z) * 0.12], poleUp: [Math.sign(z) * -0.35, 0.9, 0.0] });
const P = build(DUR, {
  pelvis: [-0.45, 0.141, 0],
  hips,
  chest: { waist: [[[0, 0, 1], t => 7 - 1.2 * p(t)]] },
  hands: { right: floorHand(0.25), left: floorHand(-0.25) },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: [0.083, 0.093, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [0.09, 0.5, -0.6] },
    right: { mode: 'free', frame: 'hips', ankle: t => LR(t).ankle, rot: [[[0, 0, 1], t => -120 - EXT * p(t)]],
      poleLow: t => { const K = LR(t).knee; return r4([K[0], K[1] - 0.5, K[2] + 0.3]); } },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 'n-prone-hip-ext', name: '俯卧屈膝抬腿', nameEn: 'Prone Bent-Knee Hip Extension',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.35, 0.45, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'rightAnkle', 'rightKnee'], pad: 0.12, k: 0.8, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 880, height: 640, cx: 512, cy: 560 },
  stillAt: 2.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'leftPalm', 'rightPalm', 'leftToe', 'rightKnee'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 15, a: 0.6 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.45 }, { j: 'rightKnee', rx: 36, ry: 10, a: 0.5, fade: [0.06, 0.2] }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 14, a: 0.25, dy: 5, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.5, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 1.1, 2.5],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmR|torso', 'forearmL|torso'],
  },
};
