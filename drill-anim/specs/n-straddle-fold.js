// n-straddle-fold 坐姿分腿体前屈 (seated straddle forward fold, hands on blocks) · N HipLab 开胯 MVP 新增.
// Sitting on the mat, legs straight and wide (~50 deg each side), toes and kneecaps up. Both palms rest on two yoga blocks (or
// thick books) between the legs. From a tall seat the trunk hinges forward from the hips with a long back, chest toward the
// floor ahead, to ~30-40 deg of lean (not lying down), breathes into the inner thighs, and comes back up a little.
// One slow rep / 8 s. Beginner / desk-worker variant: the rig's waist (< 45) and hip limits cannot fold flat, so the blocks
// carry the hands. Head +Y, front faces +Z, body left = +X. No solver: world ankles on the floor, prescribed pelvis tilt and
// waist bend, palms placed on the blocks (arm IK finds the elbows).
import { build, keys, sg, r4, DEG } from '../lib/home-anim.mjs';
const DUR = 8, SP = 50, LEGR = 0.751, BLK = 0.1594;
const p = keys([[0, 0], [0.5, 0], [2.6, 1], [4.6, 1], [6.8, 0]], DUR);
const pitch = t => 10 + 6 * p(t), bend = t => 20 + 8 * p(t);
const HIP = s => [sg(s) * 0.0815, 0.086, 0.0];
const ankle = s => { const h = HIP(s), a = sg(s) * SP * DEG; return r4([h[0] + LEGR * Math.sin(a), 0.076, h[2] + LEGR * Math.cos(a)]); };
const foot = s => ({ mode: 'free', frame: 'world', ankle: ankle(s), rot: [[[1, 0, 0], -78], [[0, 1, 0], sg(s) * SP]],
  pole: r4([sg(s) * 0.25, 0.9, 0.3]) });
const hand = s => ({ mode: 'free', frame: 'world', palmAt: [sg(s) * 0.13, BLK + 0.002, 0.47], finger: [sg(s) * 0.12, 0, 1], normal: [0, -1, 0], pole: [sg(s) * 0.7, 0.4, 0.1], relax: 0.4 });
const P = build(DUR, {
  pelvis: [0, 0.134, 0],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], pitch]] },
  chest: { waist: [[[1, 0, 0], bend]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { fold: p });
export default {
  id: 'n-straddle-fold', name: '坐姿分腿体前屈', nameEn: 'Seated Straddle Forward Fold',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'hamstrings'], side: 'both', pulseTrack: 'fold', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.75, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.9, drift: 2, at: 3.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, height: 700, cx: 512, cy: 540 },
  stillAt: 3.0,
  shadow: { joints: ['pelvis', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.45 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.45 }, { j: 'leftAnkle', rx: 34, ry: 10, a: 0.45 }, { j: 'rightAnkle', rx: 34, ry: 10, a: 0.45 }],
    bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.25], size: [1.5, 1.1, 0.006], yaw: 0 },
    { type: 'mat', at: [0.13, BLK, 0.48], size: [0.11, 0.23, BLK] },
    { type: 'mat', at: [-0.13, BLK, 0.48], size: [0.11, 0.23, BLK] }],
  keyFrames: [0.3, 2.6, 4.0],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    straight: [{ j: 'knee.left', min: 168 }, { j: 'knee.right', min: 168 }],
    allowContact: ['forearmL|thighL', 'forearmR|thighR'],
  },
};
