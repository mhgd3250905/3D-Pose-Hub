// h-sumo-pry 相扑深蹲肘推膝停留 (sumo squat hold with elbow pry) · H 居家开胯系列.
// Feet about twice hip width, toes turned out ~35 deg, heels flat throughout. From a half squat the hips sink straight down
// to a deep sumo squat (thighs a little below parallel) with the chest tall; the palms press together in front of the
// sternum and the elbows push the knees out over the toes (inner thighs / adductors and the hip external rotators open).
// Hold and breathe, then rise back to the half squat. 2 reps / 8 s: 1.6 s down, 1.4 s hold (knees pressed a little wider),
// 1.0 s up. Facing +Z, head up (+Y), body left = +X. No solver.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.2, 0], [1.8, 1], [3.2, 1], [4.0, 0], [4.2, 0], [5.8, 1], [7.2, 1]], DUR);
const pry = keys([[0, 0], [1.8, 0], [2.4, 1], [3.0, 1], [3.6, 0], [5.8, 0], [6.4, 1], [7.0, 1], [7.6, 0]], DUR);
const FX = 0.36, TOE = 38;
const TOP = [0, 0.70, 0.02], BOT = [0, 0.47, -0.02];
const lean = t => 12 + 20 * p(t);
// prayer hands in the chest frame (rest coordinates): palms together in front of the lower sternum
const hand = s => ({ mode: 'free', frame: 'chest', palmAt: t => r4([sg(s) * 0.0345, 1.14 - 0.04 * p(t), 0.24 + 0.05 * p(t)]),
  finger: [0, 0.85, 0.53], normal: [-sg(s), 0, 0], poleLow: t => r4([sg(s) * (0.6 + 0.08 * pry(t)), 0.75 - 0.2 * p(t), 0.25]) });
const knee = s => t => r4([sg(s) * (0.95 + 0.12 * pry(t)), 0.5, 0.85]);
const P = build(DUR, {
  pelvis: t => r4(TOP.map((x, i) => x + (BOT[i] - x) * p(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], t => -4 * p(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.0], heading: TOE, pitch: 0, poleLow: knee('left') },
    right: { mode: 'floor', at: [-FX, 0.0], heading: -TOE, pitch: 0, poleLow: knee('right') },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { down: p, pry });
export default {
  id: 'h-sumo-pry', name: '相扑深蹲肘推膝停留', nameEn: 'Sumo Squat Hold with Elbow Pry',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'glute-max'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [0.55, 0.25, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.2, k: 0.85, drift: 3, at: 2.6, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 680, cx: 512, cy: 580 },
  stillAt: 2.6,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 90, ry: 14, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.05], size: [0.61, 1.4, 0.006], yaw: 90 }],
  keyFrames: [0.2, 1.2, 2.6],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|handR', 'forearmL|forearmR', 'upperArmL|thighL', 'upperArmR|thighR', 'forearmL|thighL', 'forearmR|thighR', 'upperArmL|kneeL', 'upperArmR|kneeR'],
  },
};
