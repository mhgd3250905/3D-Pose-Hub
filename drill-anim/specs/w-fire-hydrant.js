// w-fire-hydrant 四足消防栓 (quadruped fire hydrant). Hands under the shoulders (arms straight), knees under the hips, toes
// tucked (same quadruped as glute-max-B, its solved trunk baked in: no solver, the trunk stays still). The RIGHT leg keeps its
// 90-ish knee bend and lifts out to the side: knee + foot rotate about the body's long axis through the right hip, up to 45 deg
// (exact circular path, coordinate tracks). 2 reps / 8 s: 1.0 s out, 1.0 s hold, 1.2 s down, rest.
// Head points +X, face down (-Y), body right = +Z, body left = -Z.
import { rotAbout, r4, sampler, track } from '../lib/ss-geo.mjs';
const DUR = 8, AMAX = 45;
const HIPR = [-0.503, 0.391, 0.077];                       // right hip (solved quadruped, probe of glute-max-B t=0)
const KN0 = [-0.51, 0.039, 0.077], AN0 = [-0.868, 0.238, 0.077];   // kneeling right knee / ankle = mirror of the left leg
const mid = AN0.map((x, i) => (x + HIPR[i]) / 2), PO0 = KN0.map((x, i) => x + 2 * (x - mid[i]));
const K = [[0, 0], [0.4, 0], [1.4, 1], [2.4, 1], [3.6, 0], [4.4, 0], [5.4, 1], [6.4, 1], [7.6, 0]];
const pAt = sampler(K, DUR);
const at = (pt, t) => rotAbout(pt, HIPR, [1, 0, 0], -AMAX * pAt(t));   // -angle about +X lifts the right (+Z) knee outward/up
const tracks = { lift: track(DUR, pAt) };
['x', 'y', 'z'].forEach((c, i) => { tracks['a' + c] = track(DUR, t => at(AN0, t)[i]); tracks['q' + c] = track(DUR, t => at(PO0, t)[i]); });
const U = i => { const v = [0, 0, 0]; v[i] = 1; return v; };
const deltas = { lift: { feet: { right: { rot: [[[1, 0, 0], 62], [[0, 1, 0], 90], [[1, 0, 0], -AMAX]] } } } };
['x', 'y', 'z'].forEach((c, i) => { deltas['a' + c] = { feet: { right: { ankle: U(i) } } }; deltas['q' + c] = { feet: { right: { pole: U(i) } } }; });
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
export default {
  id: 'w-fire-hydrant', name: '四足消防栓', nameEn: 'Quadruped Fire Hydrant',
  timeline: { duration: DUR, tracks },
  pose: {
    base: {
      pelvis: [-0.4559, 0.3975, -0.0041],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 12.778]] },
      chest: { waist: [[[0, 0, 1], 0.02]] },
      hands: { right: floorHand(0.19), left: floorHand(-0.19) },
      feet: {
        left: { mode: 'floor', at: [-0.868, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
        right: { mode: 'free', frame: 'world', ankle: [0, 0, 0], rot: [[[1, 0, 0], 62], [[0, 1, 0], 90], [[1, 0, 0], 0]], pole: [0, 0, 0] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas,
  },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-1, 0.5, 0.3], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightAnkle'], pad: 0.14, k: 0.8, drift: 4, at: 1.9 },
  frame: { mode: 'fit', width: 640, cx: 512, cy: 500 },
  stillAt: 1.9,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 },
      { j: 'rightKnee', rx: 40, ry: 11, a: 0.65, fade: [0.05, 0.2] }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.46, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 0.9, 1.9],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};
