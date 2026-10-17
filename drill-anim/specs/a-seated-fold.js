// a-seated-fold HipLab 自测⑤ 坐姿体前屈 对比图 (stills A/B/C, same camera and light) · built from s-seated-fold.
// Sitting, legs straight and together, toes up, folding forward from the hips. Where do the hands reach?
// A 松 = hands on the toes; B 一般 = hands on the lower shins / ankles; C 紧 = hands only near the knees, trunk barely forward.
// t 0-2 / 2-4 / 4-6 s, stills at frames 15 / 45 / 75 (15 fps). Not a training animation. The fold stays within the rig's
// limits (hip flexion < 135, waist bend < 45): reaching the toes comes from the hip hinge plus the arms.
// Head points +Y, front faces +Z, body left = +X. Solver: py/pz keep the straight legs on the fixed heels, palms by contact.
import { build, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 6;
const STEP = t => { t = ((t % DUR) + DUR) % DUR; return t < 2 ? 0 : t < 4 ? 1 : 2; };
const S = [   // pelvis, hip tilt, waist, hip-height target, palm (left; right mirrors x), finger, normal
  { pel: [0, 0.122, 0.029], tilt: 41, waist: 17, hy: 0.0845, palm: [0.085, 0.215, 0.835], fin: [0.15, -0.65, 0.75], nrm: [-0.1, -0.75, -0.65] },
  { pel: [0, 0.122, 0.029], tilt: 33, waist: 6, hy: 0.0845, palm: [0.125, 0.15, 0.665], fin: [0.55, -0.55, 0.6], nrm: [-0.55, -0.8, 0.1] },
  { pel: [0, 0.134, 0.009], tilt: 5, waist: 2, hy: 0.087, palm: [0.135, 0.19, 0.43], fin: [0, -0.1, 1], nrm: [0, -1, 0] },
];
const at = (k, t) => S[STEP(t)][k];
const mir = (v, s) => [sg(s) * v[0], v[1], v[2]];
const hand = s => ({ mode: 'free', frame: 'world', palmAt: t => r4(mir(at('palm', t), s)), finger: t => r4(mir(at('fin', t), s)).map((x, i) => i === 0 ? x : x),
  normal: t => { const n = at('nrm', t); return r4([sg(s) * n[0], n[1], n[2]]); }, pole: [sg(s) * 0.5, 0.4, -0.2],
  touch: { solve: 'bisect', clear: 0.0005, exclude: { left: ['rightHand'], right: ['leftHand'] } } });
const P = build(DUR, {
  pelvis: t => at('pel', t),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => at('tilt', t)], [[0, 0, 1], 1.0]] },
  chest: { waist: [[[1, 0, 0], t => at('waist', t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'free', frame: 'world', ankle: [0.09, 0.075, 0.760], rot: [[[1, 0, 0], -67.5]], pole: [0.09, 1.0, 0.4] },
    right: { mode: 'free', frame: 'world', ankle: [-0.09, 0.075, 0.760], rot: [[[1, 0, 0], -67.5]], pole: [-0.09, 1.0, 0.4] },
  },
  constraints: [{ type: 'reach', limb: 'leftLeg', angle: 179, weight: 2 }, { type: 'reach', limb: 'rightLeg', angle: 179, weight: 2 },
    { type: 'joint', joint: 'leftHip', axis: [0, 1, 0], value: t => at('hy', t), weight: 2 }],
  solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.1 } },
}, { step: STEP, glow: t => 1 });
export default {
  id: 'a-seated-fold', name: '自测·坐姿体前屈 对比图', nameEn: 'Self-test: seated fold stills',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hamstrings'], side: 'both', pulseTrack: 'glow', pulseBase: 1.0 },
  camera: { dir: [1, 0.3, 0.12], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1.0, drift: 0, at: 5.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 520, cx: 512, cy: 560 },
  stillAt: 5.0,
  shadow: { joints: ['pelvis', 'leftKnee', 'leftAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 50, ry: 10, a: 0.45 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.45 }], bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.3], size: [0.61, 1.6, 0.006], yaw: 0 }],
  keyFrames: [1.0, 3.0, 5.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    allowContact: ['handL|footL', 'handR|footR', 'handL|shinL', 'handR|shinR', 'handL|thighL', 'handR|thighR', 'forearmL|thighL', 'forearmR|thighR', 'forearmL|shinL', 'forearmR|shinR', 'torso|thighL', 'torso|thighR', 'handL|handR', 'footL|footR', 'shinL|shinR', 'thighL|thighR'],
  },
};
