// h-db-curl 哑铃交替弯举 (alternating dumbbell curl) · H 居家小器械力量系列.
// Standing tall, feet hip-width, knees soft, a dumbbell in each hand at the sides (neutral grip). Elbows stay pinned by the
// ribs; one arm curls the dumbbell up toward the shoulder, the forearm turning palm-up (supination) on the way, squeezes, then
// lowers slowly back to a long arm while the other arm waits; then the other side. Shoulders and trunk still, no swinging.
// 2 reps / 8 s (right 0-4 s, left 4-8 s): 1.3 s up, 0.4 s squeeze, 1.6 s down, 0.7 s rest.
// Facing +Z, head up (+Y), body left = +X. No solver: upper arm and forearm directions are set in the chest frame (armDir),
// the fist closes round the handle with the thumb turning from forward (neutral) to lateral (supinated) in the first half of the curl.
import { build, keys, sg, r4, REST, armDir } from '../lib/home-anim.mjs';
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
const rep = s => keys([[0, 0], [s + 0.3, 0], [s + 1.6, 1], [s + 2.0, 1], [s + 3.6, 0]], DUR);
const pR = rep(0), pL = rep(4), P_ = { right: pR, left: pL };
const arm = (side, t) => { const q = P_[side](t), S = REST.shoulder(side);
  const E = add(S, mul(armDir(side, 4 + 8 * q, 7), UA)), f = armDir(side, 16 + 122 * q, 3);
  const g = Math.min(1, q / 0.45) * 90 * DEG, a = add(mul([0, 0, 1], Math.cos(g)), mul([-sg(side), 0, 0], -Math.sin(g)));   // thumb: forward -> lateral
  return { S, E, f, a }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => { const A = arm(side, t); return r4(add(A.E, [sg(side) * 0.06, 0.02, -0.3])); };
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
}, { curlR: pR, curlL: pL, curl: t => Math.max(pR(t), pL(t)) });
export default {
  id: 'h-db-curl', name: '哑铃交替弯举', nameEn: 'Alternating Dumbbell Curl',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['biceps'], side: 'both', pulseTrack: 'curl', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.15, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 700, height: 880, cx: 512, cy: 505 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 1.0, 2.0, 6.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
