// Standing light dumbbell front raise: fixed soft elbows, shoulder flexion only. No trunk lean or leg drive.
// Home small equipment; 1 easy set of 6 slow reps, stop for discomfort. Not an office movement without weights and clear space.
import { build, keys, sg, r4, REST } from '../lib/home-anim.mjs';
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
const DUR = 8, PLANE = 82, TH0 = 18, TH1 = 78, ELB = 12;
const p = keys([[0, 0], [0.3, 0], [1.7, 1], [2.2, 1], [3.9, 0], [4.3, 0], [5.7, 1], [6.2, 1], [7.9, 0]], DUR);
const th = t => TH0 + (TH1 - TH0) * p(t);
const arm = (side, t) => { const S = REST.shoulder(side), down = [0, -1, 0], out = [sg(side) * Math.cos(PLANE * DEG), 0, Math.sin(PLANE * DEG)];
  const dirAt = a => add(mul(down, Math.cos(a * DEG)), mul(out, Math.sin(a * DEG)));
  const E = add(S, mul(dirAt(th(t)), UA)), f = dirAt(th(t) + ELB);   // elbow bend keeps the forearm slightly forward of the upper arm
  const n = nrm(cross(down, out)).map(x => x * sg(side));            // plane normal, pointing forward for both sides
  return { S, E, f, n }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, [sg(side), 0, 0]); };
  const pole = t => { const A = arm(side, t), W = add(A.E, mul(A.f, FA)); return r4(add(A.E, mul(nrm(sub(A.E, mul(add(A.S, W), 0.5))), 0.3))); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: [0, 0.888, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { raise: p });
export default {
  id: 'h-db-front-raise', name: '站姿双哑铃前平举', nameEn: 'Standing Dumbbell Front Raise',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['deltoids'], side: 'both', pulseTrack: 'raise', pulseBase: 0.3 },
  camera: { dir: [-1, 0.15, 0.8], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 0, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, height: 880, cx: 512, cy: 505 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0, 1, 2, 3, 4, 5, 6, 7],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
