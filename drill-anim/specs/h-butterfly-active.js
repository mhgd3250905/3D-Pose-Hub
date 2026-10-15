// h-butterfly-active 仰卧蝴蝶主动开合 (supine butterfly, active open-close) · H 居家开胯系列.
// Lying on the back, knees bent, soles of the feet pressed together on the mat close to the hips (supine butterfly). The knees
// slowly lower out to the sides as far as is comfortable (inner thighs stretch, hip external rotation), pause, then the inner
// thighs actively draw the knees back up together without the feet sliding (adductors work through the range). Arms rest on
// the mat. 2 reps / 8 s: 1.8 s open, 0.6 s hold, 1.2 s close, 0.4 s rest.
// Head points -X, face up (+Y), body left = -Z (frame of h-knee-hug). No solver: each knee orbits its own hip-ankle line.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg, legAboutHA, rotAbout, restToWorld, footRotW } from '../lib/ss-geo.mjs';
const DUR = 8, F = 58, KF = 117, OPEN0 = 14, OPEN1 = 68;
const p = keys([[0, 0], [0.2, 0], [2.0, 1], [2.6, 1], [3.8, 0], [4.2, 0], [6.0, 1], [6.6, 1], [7.8, 0]], DUR);
const hips = { up: [-1, 0, 0], front: [0, 1, 0], rot: [] };
// base leg 58/120, swung toward the midline about the rest up-axis so the ankles sit ~4 cm off centre (soles together)
const base = s => { const L = leg(s, F, KF); const a0 = Math.atan2(L.ankle[0], 0.852 - L.ankle[1]) * 180 / Math.PI;
  const want = Math.atan2(sg(s) * 0.05, 0.852 - L.ankle[1]) * 180 / Math.PI;
  return leg(s, F, KF, [[[0, 0, 1], (want - a0)]]); };
const B = { left: base('left'), right: base('right') };
const ang = t => OPEN0 + (OPEN1 - OPEN0) * p(t);
const knee = (s, t) => { const L = B[s]; const ax = L.ankle.map((x, i) => x - L.hip[i]); return rotAbout(L.knee, L.hip, ax, -sg(s) * ang(t)); };
const poleOf = (s, t) => { const L = B[s], K = knee(s, t), m = L.ankle.map((x, i) => (x + L.hip[i]) / 2); return r4(K.map((x, i) => x + 2 * (x - m[i]))); };
const g = F - KF;
const footRot = s => { const L = B[s]; const ax = L.ankle.map((x, i) => x - L.hip[i]);
  return [[restToWorld(hips, [1, 0, 0]), -g - 6], [restToWorld(hips, ax), t => -sg(s) * (ang(t) * 0.8)]]; };
const legDesc = s => ({ mode: 'free', frame: 'hips', ankle: t => r4([B[s].ankle[0], B[s].ankle[1], B[s].ankle[2] + 0.029 + 0.0085 * (1 - p(t))]), rot: footRot(s), poleLow: t => poleOf(s, t) });
// arms: relaxed on the mat beside the body (~25 deg out), palms down, palm joint at y 0.027, elbows soft (no lock)
const SH = s => [-0.47, 0.122, -sg(s) * 0.19];
const hand = s => ({ mode: 'free', frame: 'world', palmAt: [0.0, 0.027, -sg(s) * 0.438], finger: [1, 0, -sg(s) * 0.3], normal: [0, -1, 0], pole: [-0.22, 0.05, -sg(s) * 0.6], relax: 0.6 });
const P = build(DUR, {
  pelvis: [0, 0.114, 0],
  hips,
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legDesc('left'), right: legDesc('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
export default {
  id: 'h-butterfly-active', name: '仰卧蝴蝶主动开合', nameEn: 'Supine Butterfly Active Open-Close',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.9, 0.85, 0.35], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 3, at: 2.3, fitTimeline: true },
  frame: { mode: 'fit', width: 780, height: 640, cx: 512, cy: 560 },
  stillAt: 2.3,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftAnkle', rx: 36, ry: 10, a: 0.5 }, { j: 'rightAnkle', rx: 36, ry: 10, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'waist', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.1, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.2, 2.3],
  qa: {
    pins: [],
    allowContact: ['handL|torso', 'handR|torso', 'forearmL|torso', 'forearmR|torso', 'footL|footR', 'shinL|shinR'],
  },
};
