// h-squat 徒手深蹲 (bodyweight squat) · H 居家徒手系列.
// Feet a little wider than the hips, toes turned out ~10 deg, heels flat throughout. The hips sit back and down to thighs about
// parallel while the chest stays proud (pelvis/torso lean ~38 deg), knees track over the toes; the arms rise forward to shoulder
// height as a counterbalance and lower again on the way up. 2 reps / 8 s: 1.5 s down, 0.4 s hold, 1.4 s up, 0.7 s stand.
// Facing +Z, head up (+Y), body left = +X. No solver: pelvis, lean and arms are functions of the rep phase.
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.4, 0], [1.9, 1], [2.3, 1], [3.7, 0], [4.4, 0], [5.9, 1], [6.3, 1], [7.7, 0]], DUR);
const TOP = [0, 0.884, 0.012], BOT = [0, 0.535, -0.13];
const lean = t => 3 + 35 * p(t);
const armW = t => 12 + 70 * p(t);                         // world arm flexion (deg from hanging)
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(armWrist(s, armW(t) + lean(t), 4, 0.4855, 0.03)),
  finger: t => r4(armDir(s, armW(t) + lean(t), 4)), normal: [-sg(s), 0, 0], poleUp: [sg(s) * 0.35, 1.1, -0.2] });
const P = build(DUR, {
  pelvis: t => r4(TOP.map((x, i) => x + (BOT[i] - x) * p(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.15, 0.0], heading: 10, pitch: 0, poleLow: [0.42, 0.55, 1] },
    right: { mode: 'floor', at: [-0.15, 0.0], heading: -10, pitch: 0, poleLow: [-0.42, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { down: p });
export default {
  id: 'h-squat', name: '徒手深蹲', nameEn: 'Bodyweight Squat',
  modelProfile: 'training-human-v2', alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['quadriceps', 'glute-max'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [1, 0.22, 0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 0.85, drift: 3, at: 0 },
  frame: { mode: 'fit', width: 700, height: 840, cx: 512, cy: 515 },
  stillAt: 0,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [],
  keyFrames: [0.2, 1.2, 2.1],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }],
    allowContact: [],
  },
};
