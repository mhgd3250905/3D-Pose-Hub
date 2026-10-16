// n-windshield 仰卧雨刷式 (supine windshield wipers, both knees side to side) · N HipLab 开胯 MVP 新增.
// Lying on the back, knees bent, feet flat on the mat a little wider than the hips, arms long beside the body, palms down on the
// mat (never on the belly). Both knees tip slowly to the RIGHT together (left hip turns in = internal rotation, right hip turns
// out = external rotation), the feet stay planted and roll onto their edges, pause, back through the centre and over to the
// LEFT. Easy, zero-fail relaxation of hip rotation. One cycle (both sides) / 8 s.
// Head points -X, face up (+Y), body left = -Z (frame of h-crunch). Floor feet, knee direction steered by poleLow rotating about
// each hip-ankle line; the pelvis rolls a few degrees with the knees.
import { build, keys, sg, r4, DEG } from '../lib/home-anim.mjs';
import { rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, DROP = 42, ROLL = 7;
const s = keys([[0, 0], [0.3, 0], [1.7, 1], [2.7, 1], [3.9, 0], [4.3, 0], [5.7, -1], [6.7, -1], [7.9, 0]], DUR);   // +1 knees to the right (+Z)
const AT = { left: [0.50, -0.2], right: [0.50, 0.2] };
const HIP = { left: [0.0, 0.12, -0.085], right: [0.0, 0.12, 0.085] };
const pole = (side, t) => { const a = [AT[side][0], 0.08, AT[side][1]], h = HIP[side];
  const m = a.map((x, i) => (x + h[i]) / 2), up = [m[0] + 0.08, m[1] + 0.8, m[2] - sg(side) * 0.15];
  return r4(rotAbout(up, h, a.map((x, i) => x - h[i]), -DROP * s(t))); };
const hand = side => ({ mode: 'free', frame: 'world', palmAt: [0.0, 0.027, -sg(side) * 0.438], finger: [1, 0, -sg(side) * 0.3], normal: [0, -1, 0], pole: [-0.22, 0.05, -sg(side) * 0.6], relax: 0.6 });
const P = build(DUR, {
  pelvis: [0.0, 0.12, 0],
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], -4], [[1, 0, 0], t => ROLL * s(t)]] },
  chest: { waist: [[[0, 0, 1], 0], [[1, 0, 0], t => -ROLL * 0.7 * s(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: AT.left, heading: 90, pitch: 0, roll: 0, pole: t => pole('left', t) },
    right: { mode: 'floor', at: AT.right, heading: 90, pitch: 0, roll: 0, pole: t => pole('right', t) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { wipe: t => Math.abs(s(t)) });
export default {
  id: 'n-windshield', name: '仰卧雨刷式', nameEn: 'Supine Windshield Wipers',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max', 'hip-abductors'], side: 'both', pulseTrack: 'wipe', pulseBase: 0.35 },
  camera: { dir: [1, 0.62, 0.22], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.8, drift: 2, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 780, height: 680, cx: 512, cy: 550 },
  stillAt: 2.2,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftAnkle', rx: 40, ry: 10, a: 0.5 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.7, 0.006] }],
  keyFrames: [0.2, 2.2, 6.2],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    allowContact: ['handL|torso', 'handR|torso', 'forearmL|torso', 'forearmR|torso', 'kneeL|kneeR', 'thighL|thighR'],
  },
};
