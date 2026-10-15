// h-calf-raise 扶墙提踵 (wall-supported standing calf raise) · H 居家小腿系列.
// Standing tall facing a wall, feet hip width and parallel, fingertips resting on the wall at chest height for balance only.
// Rise straight up onto the balls of the feet (heels ~9 cm off the floor, ankles not rolling out), pause at the top, lower
// slowly until the heels just kiss the floor. Knees stay long, body moves as one straight line up and slightly forward.
// 2 reps / 8 s: 1.2 s up, 0.8 s squeeze, 1.4 s slow lowering, 0.6 s reset.
// Facing +Z, head up (+Y), body left = +X. Wall face at z = WZ (yaw 180, facing the athlete). No solver: the foot pitches about the
// ball of the foot (toe joint 0.18 m ahead of the ankle at ankle height), so the ankle slides forward 0.18(1-cos) to keep the ball put.
import { build, keys, r4 } from '../lib/home-anim.mjs';
const DUR = 8, TH = 30, TOE = 0.18, WZ = 0.46, PY = 0.893, PZ = 0.006;
const p = keys([[0, 0], [0.3, 0], [1.5, 1], [2.3, 1], [3.7, 0], [4.3, 0], [5.5, 1], [6.3, 1], [7.7, 0]], DUR);
const th = t => TH * p(t) * Math.PI / 180;
const az = t => TOE * (1 - Math.cos(th(t)));
const lift = t => TOE * Math.sin(th(t));
const wallHand = s => ({ mode: 'free', frame: 'world', wrist: [s * 0.2, 1.27, WZ - 0.028], finger: [0, 1, 0.0], normal: [0, 0, 1],
  poleUp: [s * 0.55, 0.95, -0.1] });
const P = build(DUR, {
  pelvis: t => r4([0, PY + lift(t) + 0.0085 * p(t), PZ + az(t) + 0.015 * p(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 1 + 1.5 * p(t)]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: wallHand(1), right: wallHand(-1) },
  feet: {
    left: { mode: 'floor', at: t => r4([0.1, az(t)]), heading: 0, pitch: t => TH * p(t), poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: t => r4([-0.1, az(t)]), heading: 0, pitch: t => TH * p(t), poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { up: p });
export default {
  id: 'h-calf-raise', name: '扶墙提踵', nameEn: 'Wall-Supported Calf Raise',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['calves'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [-1, 0.12, -0.45], fit: ['head', 'leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis', 'leftKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 0.95, drift: 3, at: 1.9 },
  frame: { mode: 'fit', width: 700, height: 860, cx: 520, cy: 515 },
  stillAt: 1.9,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftToe', rx: 40, ry: 10, a: 0.6 }, { j: 'rightToe', rx: 40, ry: 10, a: 0.6 }, { j: 'leftAnkle', rx: 36, ry: 9, a: 0.45, fade: [0.09, 0.2] }, { j: 'rightAnkle', rx: 36, ry: 9, a: 0.45, fade: [0.09, 0.2] }], bands: [] },
  props: [{ type: 'wall', at: [0, 0, WZ], yaw: 180, size: [1.3, 2.2, 0.12] }],
  keyFrames: [0.2, 1.0, 1.9],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    jointPins: [{ j: 'leftToe', axes: 'xz' }, { j: 'rightToe', axes: 'xz' }],
    straight: [{ j: 'knee.left', min: 166 }, { j: 'knee.right', min: 166 }],
    allowContact: [],
  },
};
