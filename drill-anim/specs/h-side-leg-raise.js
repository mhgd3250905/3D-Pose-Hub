// h-side-leg-raise 站姿侧抬腿 (standing side leg raise) · H 居家臀腿系列.
// Standing tall on the LEFT leg (soft-locked knee), both hands resting on the hips. The straight RIGHT leg lifts out to the side
// to ~32 deg of hip abduction with the toes pointing forward (no turning out, no leaning the trunk away), holds briefly and
// lowers under control until the foot hovers just beside the standing foot. 2 reps / 8 s: 1.2 s up, 0.6 s hold, 1.4 s down, 0.8 s.
// Head +Y, front faces +Z, body left = +X. Solver: px/py/pz keep the standing leg long and the pelvis level over the left foot.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';
const DUR = 8, ABD = 32;
const p = keys([[0, 0], [0.4, 0], [1.6, 1], [2.2, 1], [3.6, 0], [4.4, 0], [5.6, 1], [6.2, 1], [7.6, 0]], DUR);
const abd = t => 3 + (ABD - 3) * p(t);
// right leg, rest frame, carried by the hips: straight leg rotated about +Z (negative = toward body right = abduction)
const ankle = t => leg('right', 0, 2, [[[0, 0, 1], -abd(t)]]).ankle;
const hipHand = s => ({ mode: 'free', frame: 'hips', palmAt: [sg(s) * 0.152, 1.045, 0.035], finger: [-sg(s) * 0.05, -0.35, 0.94], normal: [-sg(s), 0, 0],
  poleUp: [sg(s) * 0.6, 1.1, -0.35], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } });
const P = build(DUR, {
  pelvis: [0.035, 0.885, 0.0],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[0, 0, 1], 0]] },
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { left: hipHand('left'), right: hipHand('right') },
  feet: {
    left: { mode: 'floor', at: [0.105, 0.0], heading: 4, pitch: 0 },
    right: { mode: 'free', frame: 'hips', ankle: t => r4(ankle(t)), rot: [[[0, 0, 1], t => -abd(t)]], poleLow: [-0.15, 0.55, 1] },
  },
  constraints: [
    { type: 'reach', limb: 'leftLeg', angle: 177.5, weight: 1 },
    { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.04, weight: 0.5 },
  ],
  solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
}, { lift: p });
export default {
  id: 'h-side-leg-raise', name: '站姿侧抬腿', nameEn: 'Standing Side Leg Raise',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.7, 0.15, 0.7], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 1.0, drift: 3, at: 1.9 },
  frame: { mode: 'fit', width: 640, height: 840, cx: 512, cy: 510 },
  stillAt: 1.9,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.45, fade: [0.09, 0.35] }], bands: [] },
  props: [],
  keyFrames: [0.2, 1.0, 1.9],
  qa: {
    pins: [{ c: 'footL', when: 'always' }],
    touch: [{ side: 'right', when: 'always' }, { side: 'left', when: 'always' }],
    straight: [{ j: 'knee.left', min: 172 }, { j: 'knee.right', min: 172 }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handL|torso', 'forearmL|torso', 'handR|thighR', 'handL|thighL'],
  },
};
