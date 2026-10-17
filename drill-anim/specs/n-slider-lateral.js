// n-slider-lateral 滑垫侧向滑 (standing lateral slider: slide out, pull back in) · N HipLab 开胯 MVP 新增.
// Standing tall, feet hip-width, the RIGHT foot on a slider (or a towel on a smooth floor), palms together in front of the chest.
// The right foot glides straight out to the side with the leg long while the LEFT knee bends and the hips sit back a little
// (inner right thigh lengthens toward the end of hip abduction), pause, then the right inner thigh pulls the slider back in
// under the hip. Active control at the end of the side-split range. 2 reps / 8 s: 1.5 s out, 0.6 s hold, 1.4 s in, 0.5 s rest.
// Facing +Z, head +Y, body left = +X. No solver: pelvis path prescribed, both feet on the floor (right on the slider).
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, XOUT = -0.46, X0 = -0.13;
// pelvis height keeps the sliding leg's hip-ankle chord at 0.993 of its length (knee ~168 deg, never over-reached), measured
// on this rig: hip-ankle 0.763 m; right hip = pelvis + [-0.082, -0.047 + 0.011 q, -0.008 - 0.017 q]; slider (4 mm) ankle y 0.088 + 0.004 q.
// At q = 0 this also keeps the standing left leg just short of full reach (0.762 m).
const RL = 0.7585, dX = q => 0.048 + 0.428 * q, dZ = q => 0.008 + 0.077 * q;
const PY = q => Math.sqrt(RL * RL - dX(q) ** 2 - dZ(q) ** 2) + 0.088 + 0.004 * q + 0.047 - 0.011 * q;
const p = keys([[0, 0], [0.2, 0], [1.7, 1], [2.3, 1], [3.7, 0], [4.2, 0], [5.7, 1], [6.3, 1], [7.7, 0]], DUR);
const hand = s => ({ mode: 'free', frame: 'chest', palmAt: [sg(s) * 0.0345, 1.14, 0.25], finger: [0, 0.85, 0.53], normal: [-sg(s), 0, 0], poleLow: [sg(s) * 0.6, 0.75, 0.2] });
const P = build(DUR, {
  pelvis: t => r4([0.10 * p(t), PY(p(t)), 0.0 - 0.06 * p(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 4 + 22 * p(t)], [[0, 0, 1], t => -3 * p(t)]] },
  chest: { waist: [[[1, 0, 0], t => -2 * p(t)], [[0, 0, 1], t => 3 * p(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.25, 0.5, 1] },
    right: { mode: 'floor', at: t => [X0 + (XOUT - X0) * p(t), 0.0], heading: -8, pitch: 0, floor: 0.004, poleLow: [-0.3, 0.45, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { out: p });
export default {
  id: 'n-slider-lateral', name: '滑垫侧向滑', nameEn: 'Standing Lateral Slider',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors'], side: 'right', pulseTrack: 'out', pulseBase: 0.3 },
  camera: { dir: [-0.2, 0.3, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.22, k: 0.9, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 760, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 80, ry: 14, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [{ type: 'sliders', colour: '#8c929c', attach: 'rightFoot', flat: true, offset: [0, -0.09, 0.02], r: 0.09 }],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.right', min: 165 }],
    allowContact: ['handL|handR', 'forearmL|forearmR'],
  },
};
