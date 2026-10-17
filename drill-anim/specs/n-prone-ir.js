// n-prone-ir 俯卧小腿外摆（髋内旋） (prone hip internal rotation, shins fall out) · N HipLab 开胯 MVP 新增.
// Lying face down, forehead low, palms flat beside the chest, thighs on the mat hip-width apart, both knees bent 90 deg with the
// shins upright. Keeping the knees and the pelvis on the mat, both shins open OUT to the sides like the hands of a clock (the
// thighs turn inward in their sockets = hip internal rotation), pause, and come back up to vertical. The feet never cross.
// 2 reps / 8 s: 1.4 s out, 0.9 s hold, 1.3 s back, 0.4 s rest.
// Head points +X, face down (-Y), body left = -Z (frame of h-cobra). No solver: each shin turns about its own thigh axis.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg, restToWorld } from '../lib/ss-geo.mjs';
const DUR = 8, IR = 38, KN = 88, FL = -2;
const p = keys([[0, 0], [0.2, 0], [1.6, 1], [2.5, 1], [3.8, 0], [4.2, 0], [5.6, 1], [6.5, 1], [7.8, 0]], DUR);
const hips = { up: [1, 0, 0], front: [0, -1, 0], rot: [] };
const L = (s, t) => leg(s, FL, KN, [[[0, 1, 0], -sg(s) * IR * p(t)], [[0, 0, 1], sg(s) * 2]]);
const floorHand = z => ({ mode: 'floor', at: [-0.03, z], finger: [1, Math.sign(z) * 0.12], poleUp: [Math.sign(z) * -0.35, 0.9, 0.0] });
const foot = s => ({ mode: 'free', frame: 'hips', ankle: t => L(s, t).ankle,
  rot: [[[0, 0, 1], -150], [restToWorld(hips, [0, 1, 0]), t => -sg(s) * IR * p(t)]],
  poleLow: t => { const K = L(s, t).knee; return r4([K[0], K[1] - 0.5, K[2] + 0.3]); } });
const P = build(DUR, {
  pelvis: [-0.45, 0.141, 0],
  hips,
  chest: { waist: [[[0, 0, 1], 7]] },
  hands: { right: floorHand(0.25), left: floorHand(-0.25) },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { turn: p });
export default {
  id: 'n-prone-ir', name: '俯卧小腿外摆（髋内旋）', nameEn: 'Prone Hip Internal Rotation',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors', 'glute-max'], side: 'both', pulseTrack: 'turn', pulseBase: 0.3 },
  camera: { dir: [-1, 1.5, -0.25], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftAnkle', 'rightAnkle', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.8, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 720, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 15, a: 0.6 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'leftKnee', rx: 36, ry: 10, a: 0.5 }, { j: 'rightKnee', rx: 36, ry: 10, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 14, a: 0.25, dy: 5, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.5, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmR|torso', 'forearmL|torso'],
  },
};
