// h-band-row 弹力带坐姿划船 (seated band row) · H 居家小器械力量系列.
// Sitting tall on a mat, legs long, a resistance band looped round the soles of both feet, one end in each hand (neutral grip,
// thumbs up). Start with the arms long toward the feet and the shoulder blades forward; pull the elbows back close to the ribs
// until the hands reach the lower ribs, squeeze the shoulder blades together and down, pause, return slowly to long arms.
// Trunk stays upright and still (no rocking). 2 reps / 8 s: 1.3 s pull, 0.6 s squeeze, 1.7 s return, 0.4 s rest.
// Head points +Y, front faces +Z, body left = +X. Sitting pose and leg solve from a-seated-fold (state C: pelvis tilt 5 deg,
// heels fixed, legs straight); arms in the chest frame, shoulders.shift adds shoulder-blade retraction at the pull.
import { build, keys, sg, r4, REST, armDir, armWrist } from '../lib/home-anim.mjs';
import { UA, FA, DEG } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;   // wrist -> fist centre along the forearm (gripPose geometry)
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8;
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.2, 1], [3.9, 0], [4.3, 0], [5.6, 1], [6.2, 1], [7.9, 0]], DUR);
const SHIFT = t => r4([0, -0.004 * p(t), -0.014 * p(t)]);
const arm = (side, t) => { const q = p(t), S = add(REST.shoulder(side), SHIFT(t));   // wrist solved from the shifted shoulder
  const E = add(S, mul(armDir(side, 72 - 100 * q, 6 + 8 * q), UA)), f = armDir(side, 89 - 7 * q, 6 + 4 * q);
  return { S, E, f, a: [0, 1, 0] }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => { const A = arm(side, t); return r4(add(A.E, [sg(side) * 0.1, -0.05, -0.3])); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: [0, 0.134, 0.009],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 5], [[0, 0, 1], 0]] },
  chest: { waist: [[[1, 0, 0], 2]] },
  shoulders: { shift: SHIFT },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'free', frame: 'world', ankle: [0.10, 0.075, 0.760], rot: [[[1, 0, 0], -67.5]], pole: [0.10, 1.0, 0.4] },
    right: { mode: 'free', frame: 'world', ankle: [-0.10, 0.075, 0.760], rot: [[[1, 0, 0], -67.5]], pole: [-0.10, 1.0, 0.4] },
  },
  constraints: [{ type: 'reach', limb: 'leftLeg', angle: 179, weight: 2 }, { type: 'reach', limb: 'rightLeg', angle: 179, weight: 2 },
    { type: 'joint', joint: 'leftHip', axis: [0, 1, 0], value: 0.087, weight: 2 }],
  solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.1 } },
}, { pull: p });
const SOLE = side => ({ bone: side + 'Foot', offset: [0, -0.02, 0.10] });
export default {
  id: 'h-band-row', name: '弹力带坐姿划船', nameEn: 'Seated Band Row',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats', 'scapular'], side: 'both', pulseTrack: 'pull', pulseBase: 0.3 },
  camera: { dir: [1, 0.35, 0.25], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 1.0, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 560, cx: 512, cy: 545 },
  stillAt: 2.0,
  shadow: { joints: ['pelvis', 'leftKnee', 'leftAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 50, ry: 10, a: 0.45 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.45 }], bands: [] },
  props: [
    { type: 'mat', at: [0, 0, 0.3], size: [0.61, 1.6, 0.006], yaw: 0 },
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: GRIP.left.c }, to: SOLE('left'), r: 0.009, sag: 0.0, colour: '#b5523f' },
    { type: 'band', from: { bone: 'rightHand', offset: GRIP.right.c }, to: SOLE('right'), r: 0.009, sag: 0.0, colour: '#b5523f' },
    { type: 'band', from: SOLE('left'), to: SOLE('right'), r: 0.009, sag: 0.0, colour: '#b5523f' },
  ],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'knee.left', min: 170 }, { j: 'knee.right', min: 170 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
