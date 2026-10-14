// h-crunch 卷腹 (crunch) · H 居家核心力量系列.
// Supine on the mat, knees bent ~90 deg, feet flat hip-width; low back stays on the mat. The rib cage curls toward the pelvis
// until the shoulder blades leave the mat (~30 deg trunk flexion), the straight arms reach along the thighs toward the knees,
// pause, then roll back down vertebra by vertebra. 2 reps / 8 s: 1.2 s up, 0.6 s squeeze, 1.4 s down, 0.8 s rest.
// Head points -X, face up (+Y), body left = -Z (frame of w-dead-bug). No solver.
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.4, 0], [1.6, 1], [2.2, 1], [3.6, 0], [4.4, 0], [5.6, 1], [6.2, 1], [7.6, 0]], DUR);
const curl = t => -(2 + 24 * p(t));
const phi = t => 9 + 32 * p(t);                       // arm flexion in the chest frame (0 = along the body toward the feet)
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(armWrist(s, phi(t), 14, 0.4838)), finger: t => r4(armDir(s, phi(t), 14)),
  normal: [-sg(s), 0, 0], poleUp: [sg(s) * 0.5, 0.2, -1] });
const P = build(DUR, {
  pelvis: [0.0, 0.12, 0],
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], -4]] },
  chest: { waist: [[[0, 0, 1], curl]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.50, -0.105], heading: 90, pitch: 0, poleLow: [0.08, 0.6, 0.8] },
    right: { mode: 'floor', at: [0.50, 0.105], heading: 90, pitch: 0, poleLow: [-0.08, 0.6, 0.8] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { up: p });
export default {
  id: 'h-crunch', name: '卷腹', nameEn: 'Crunch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.45, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 3, at: 1.9 },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 560 },
  stillAt: 1.9,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55, fade: [0.12, 0.3] }, { j: 'head', rx: 50, ry: 12, a: 0.45, fade: [0.1, 0.3] },
      { j: 'leftAnkle', rx: 40, ry: 10, a: 0.5 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.0, 1.9],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 170 }, { j: 'elbow.left', min: 170 }],
    allowContact: ['thighL|thighR'],
  },
};
