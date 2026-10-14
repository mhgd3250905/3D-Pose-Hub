// h-bulgarian 椅子保加利亚分腿蹲 (Bulgarian split squat, rear foot on a chair) · H 居家臀腿系列.
// Standing in front of a sturdy chair, the top of the RIGHT foot rests on the seat behind, the LEFT foot ~70 cm in front, hands on
// the hips. Lower straight down until the front thigh is about parallel to the floor and the back knee points at the mat (front
// knee tracks over the toes, heel stays down, trunk tall with a slight forward lean), then drive up through the front heel.
// 2 reps / 8 s: 0.4 s top, 1.6 s down, 0.3 s bottom, 1.3 s up, 0.4 s top.
// Head +Y, front faces +Z (away from the chair), body left = +X. No solver: the pelvis path is prescribed, the front foot is a
// floor foot, the rear foot is a world-frame foot lying laces-down on the seat; leg IK finds the knees.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, SEAT = 0.45, EDGE = -0.30, FZ = 0.37;
const d = keys([[0, 0], [0.4, 0], [2.0, 1], [2.3, 1], [3.6, 0], [4.4, 0], [6.0, 1], [6.3, 1], [7.6, 0]], DUR);
const TOP = [0.0, 0.84, 0.11], BOT = [0.0, 0.52, -0.01];
const hipHand = s => ({ mode: 'free', frame: 'hips', palmAt: [sg(s) * 0.152, 1.045, 0.035], finger: [-sg(s) * 0.05, -0.35, 0.94], normal: [-sg(s), 0, 0],
  poleUp: [sg(s) * 0.6, 1.1, -0.35], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } });
const P = build(DUR, {
  pelvis: t => r4(TOP.map((x, i) => x + (BOT[i] - x) * d(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 8 + 8 * d(t)]] },
  chest: { waist: [[[1, 0, 0], t => -2 - 2 * d(t)]] },
  hands: { left: hipHand('left'), right: hipHand('right') },
  feet: {
    left: { mode: 'floor', at: [0.11, FZ], heading: 4, pitch: 0, poleLow: [0.2, 0.6, 1.4] },
    right: { mode: 'free', frame: 'world', ankle: [-0.10, SEAT + 0.045, EDGE - 0.035], rot: [[[1, 0, 0], 168], [[0, 1, 0], 4]], poleLow: [-0.12, -0.3, 0.05] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { down: d });
export default {
  id: 'h-bulgarian', name: '椅子保加利亚分腿蹲', nameEn: 'Bulgarian Split Squat',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['quadriceps', 'glute-max'], side: 'left', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [1, 0.18, 0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.14, k: 1.0, drift: 3, at: 2.1 },
  frame: { mode: 'fit', width: 900, height: 800, cx: 520, cy: 500 },
  stillAt: 0.2,
  shadow: { joints: ['leftToe', 'leftAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [-0.05, 0, EDGE - 0.21], yaw: 0, height: SEAT, width: 0.44, depth: 0.42 }],
  keyFrames: [0.2, 1.2, 2.1],
  qa: {
    pins: [{ c: 'footL', when: 'always' }],
    touch: [{ side: 'right', when: 'always' }, { side: 'left', when: 'always' }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handL|torso', 'forearmL|torso', 'thighR|shinR'],
  },
};
