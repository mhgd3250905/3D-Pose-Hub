// w-bird-dog 鸟狗式 (bird dog). Quadruped (glute-max-B's solved trunk baked in, no solver: the trunk stays level and still).
// The RIGHT leg extends straight back to hip height while the LEFT arm reaches forward at shoulder height (thumb up), hold,
// return to the start. One side per loop (the mirrored side is the same drill). 2 reps / 8 s: 1.2 s out, 1.4 s hold, 1.0 s back.
// Head points +X, face down (-Y), body right = +Z, body left = -Z.
import { REST, r4, sampler, track, DEG } from '../lib/ss-geo.mjs';
const DUR = 8;
const HIPR = [-0.503, 0.391, 0.077];
const AN0 = [-0.868, 0.238, 0.077];                                   // kneeling right ankle (mirror of the left, toes tucked)
const LIFT = 4 * DEG, LEG = 0.763;
const AN1 = r4([HIPR[0] - LEG * Math.cos(LIFT), HIPR[1] + LEG * Math.sin(LIFT), HIPR[2]]);   // straight leg, a touch above level
const PO0 = [-0.159, -0.512, 0.077], PO1 = [-0.88, -0.45, 0.077];       // knee poles: kneeling (down/forward) -> extended (below)
const BOW = [0, 0.07, 0];                                             // the foot rises first (knee clears the mat), then travels back
// trunk is pitched 12.78 deg (head up) by the quadruped; the reaching arm is tilted back down by that so it ends level
const TILT = 12.78 * DEG, AR = 0.4843;
const dir = [0, Math.cos(TILT), Math.sin(TILT)];
const S = REST.shoulder('left'), WR = r4([S[0] - 0.02, S[1] + AR * dir[1], S[2] + AR * dir[2]]);
const K = [[0, 0], [0.3, 0], [1.5, 1], [2.9, 1], [3.9, 0], [4.3, 0], [5.5, 1], [6.9, 1], [7.9, 0]];
const pAt = sampler(K, DUR);
const tracks = { ext: track(DUR, pAt), bow: track(DUR, t => { const p = pAt(t); return 4 * p * (1 - p); }) };
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
export default {
  id: 'w-bird-dog', name: '鸟狗式', nameEn: 'Bird Dog',
  timeline: { duration: DUR, tracks },
  pose: {
    base: {
      pelvis: [-0.4559, 0.3975, -0.0041],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 12.778]] },
      chest: { waist: [[[0, 0, 1], 0.02]] },
      hands: {
        right: floorHand(0.19),
        left: { plant: floorHand(-0.19), free: { mode: 'free', frame: 'chest', wrist: WR, finger: r4(dir), normal: [-1, 0, 0], poleUp: [0.45, 1.6, 0.3] }, w: 0, arc: 0.13, arcDir: [0.7, -0.7, 0] },
      },
      feet: {
        left: { mode: 'floor', at: [-0.868, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
        right: { mode: 'free', frame: 'world', ankle: AN0, rot: [[[1, 0, 0], 62], [[0, 1, 0], 90]], pole: PO0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      ext: { hands: { left: { w: 1 } }, feet: { right: { ankle: AN1, rot: [[[1, 0, 0], 92], [[0, 1, 0], 90]], pole: PO1 } } },
      bow: { feet: { right: { ankle: r4(AN0.map((x, i) => x + BOW[i])) } } },
    },
  },
  highlight: { groups: ['erectors'], side: 'both', pulseTrack: 'ext', pulseBase: 0.3 },
  camera: { dir: [-0.2, 0.4, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftWrist'], pad: 0.13, k: 0.8, drift: 4, at: 2.2 },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 545 },
  stillAt: 2.2,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7, fade: [0.04, 0.2] }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 },
      { j: 'rightKnee', rx: 40, ry: 11, a: 0.65, fade: [0.05, 0.2] }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.4, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 0.9, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'handL', when: 'params.ext<0.001' }],
    // The knee bends while travelling out/back; verify straightness during the
    // completed extension hold, rather than including the last bent transition.
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176, when: 'params.ext>0.9999' }, { j: 'knee.right', min: 176, when: 'params.ext>0.9999' }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};
