// h-db-press 站姿哑铃推举 (standing dumbbell shoulder press) · H 居家小器械力量系列.
// Standing tall, feet hip-width, knees soft, ribs down. Dumbbells start at ear level, palms forward, elbows under the wrists and
// a little in front of the body (scapular plane, ~25 deg forward). Press both dumbbells up and slightly in until the arms are
// almost straight overhead (no lock-out snap, no arching), pause, lower under control back to the start. Trunk still.
// 2 reps / 8 s: 1.3 s press, 0.5 s pause, 1.8 s lower, 0.4 s rest.
// Facing +Z, head up (+Y), body left = +X. No solver: each arm is a planar two-bone chain in its scapular plane (chest frame);
// the fist closes round the handle with the thumb toward the midline (pronated, palm forward).
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
const DUR = 8, PLANE = 25, TH0 = 62, TH1 = 164, E0 = 108, E1 = 14;
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.1, 1], [3.9, 0], [4.3, 0], [5.6, 1], [6.1, 1], [7.9, 0]], DUR);
const arm = (side, t) => { const S = REST.shoulder(side), down = [0, -1, 0], out = [sg(side) * Math.cos(PLANE * DEG), 0, Math.sin(PLANE * DEG)];
  const dirAt = a => add(mul(down, Math.cos(a * DEG)), mul(out, Math.sin(a * DEG)));
  const th = TH0 + (TH1 - TH0) * p(t), e = E0 + (E1 - E0) * p(t);
  return { S, E: add(S, mul(dirAt(th), UA)), f: dirAt(th + e), med: [-sg(side), 0, 0] }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.med); };
  const pole = t => { const A = arm(side, t), W = add(A.E, mul(A.f, FA)); return r4(add(A.E, add(mul(nrm(sub(A.E, mul(add(A.S, W), 0.5))), 0.3), [0, 0, -0.04]))); };
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
}, { press: p });
export default {
  id: 'h-db-press', name: '站姿哑铃推举', nameEn: 'Standing Dumbbell Shoulder Press',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['deltoids', 'triceps'], side: 'both', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [0.35, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 900, cx: 512, cy: 505 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 168, when: 'params.press>0.999' }, { j: 'elbow.right', min: 168, when: 'params.press>0.999' }],
    allowContact: [],
  },
};
