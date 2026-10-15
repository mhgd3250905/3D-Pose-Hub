// h-bridge-overhead 臀桥过头伸臂 (glute bridge with overhead reach) · H 居家开肩系列.
// Lying on the back, knees bent, feet flat hip-width apart; both arms reach overhead and rest on the mat beside the ears, palms up,
// elbows long. Squeeze the glutes and lift the hips into a bridge while the arms stay long on the mat and the ribs stay down -
// shoulder flexion and hip extension at the same time, the two halves of a full bridge. Hold, lower slowly. 2 reps / 8 s:
// 1.2 s up, 1.4 s hold, 1.2 s down, 0.2 s rest.
// Head points -X, face up (+Y), body left = -Z (frame of h-butterfly-active). No solver: the rig has no neck, so the head stays on
// the mat only if the upper chest stays nearly flat - the lift is taken by the pelvis tilt (a) with a waist bend back to the chest
// angle (b); the shoulders stay on the mat (x fixed), the pelvis follows from the trunk geometry. Feet floor-pinned, hands fixed.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, FX = 0.40, FZ = 0.11, SX = -0.47, LW = 0.1412, LC = 0.3294, D2R = Math.PI / 180;
const p = keys([[0, 0], [0.2, 0], [1.4, 1], [2.8, 1], [4.0, 0], [4.2, 0], [5.4, 1], [6.8, 1]], DUR);
const geo = t => { const q = p(t), py = 0.118 + 0.165 * q, sy = 0.12 + 0.022 * q, b = 9 * q;
  const sa = Math.max(-1, Math.min(1, (py - sy - LC * Math.sin(b * D2R)) / LW)), a = Math.asin(sa) / D2R;
  const px = SX + LW * Math.cos(a * D2R) + LC * Math.cos(b * D2R); return { a, b, px, py }; };
const hand = s => ({ mode: 'free', frame: 'world', wrist: [-0.952, 0.034, -sg(s) * 0.25], finger: [-1, 0, -sg(s) * 0.12], normal: [0, 1, 0], pole: [-0.72, 0.4, -sg(s) * 0.55], relax: 0.6 });
const P = build(DUR, {
  pelvis: t => { const g = geo(t); return r4([g.px, g.py, 0]); },
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], t => geo(t).a]] },
  chest: { waist: [[[0, 0, 1], t => { const g = geo(t); return g.b - g.a; }]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 0 }, left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 0 } },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 'h-bridge-overhead', name: '臀桥过头伸臂', nameEn: 'Glute Bridge with Overhead Reach',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats', 'glute-max'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [0.3, 0.42, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow'], pad: 0.12, k: 0.75, drift: 4, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6, fade: [0.15, 0.32] }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'leftPalm', rx: 36, ry: 10, a: 0.45 }, { j: 'rightPalm', rx: 36, ry: 10, a: 0.45 }],
    bands: [] },
  props: [{ type: 'mat', at: [-0.22, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 0.8, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    allowContact: ['thighL|shinL', 'thighR|shinR', 'upperArmL|head', 'upperArmR|head'],
  },
};
