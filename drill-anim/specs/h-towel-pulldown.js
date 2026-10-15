// h-towel-pulldown 站姿毛巾下拉 (standing towel lat pulldown) · H 居家背部系列.
// Standing tall, a bath towel held in both fists about 80 cm apart with an overhand grip, arms reaching up in a wide V. Pull the
// towel hard outward so it stays taut the whole time, then drive the elbows down and back as if pulling a bar to the upper chest,
// squeezing the shoulder blades down and together; press back up overhead without letting the towel go slack. Ribs down, no
// arching. 2 reps / 8 s: 1.4 s pull down, 0.6 s squeeze, 1.6 s return, 0.4 s top.
// Facing +Z, head up (+Y), body left = +X. Hands world-fixed paths (fists keep the towel width), power grip (gripPose + gripHand);
// the towel is a soft band between the two fists. No solver.
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, HX = 0.39;
const p = keys([[0, 0], [0.4, 0], [1.8, 1], [2.4, 1], [4.0, 0], [4.4, 0], [5.8, 1], [6.4, 1], [8.0, 0]], DUR);
const fist = (s, t) => { const q = p(t); return [s * HX, 1.75 - 0.36 * q, 0.07 + 0.11 * q + 0.09 * Math.sin(Math.PI * q)]; };
const palm = t => { const q = p(t); return [0, -0.25 + 0.55 * q, -1]; };     // palms face forward; at the bottom the fists tip back a little
const hand = (s, side) => {
  const g = t => gripPose(side, fist(s, t), [s, 0, 0], palm(t));
  return { mode: 'free', frame: 'world', wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: [s * 0.75, 1.15, -0.25] };
};
const P = build(DUR, {
  pelvis: [0, 0.888, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 1]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand(1, 'left'), right: hand(-1, 'right') },
  feet: {
    left: { mode: 'floor', at: [0.13, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.13, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { pull: p });
export default {
  id: 'h-towel-pulldown', name: '站姿毛巾下拉', nameEn: 'Standing Towel Lat Pulldown',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats', 'scapular'], side: 'both', pulseTrack: 'pull', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.2, -0.85], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 3, at: 2.1 },
  frame: { mode: 'fit', width: 700, height: 880, cx: 512, cy: 505 },
  stillAt: 2.1,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: G.left.c }, to: { bone: 'rightHand', offset: G.right.c }, r: 0.016, sag: 0.0, colour: '#b9b2a4' },
  ],
  keyFrames: [0.2, 1.1, 2.1],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
