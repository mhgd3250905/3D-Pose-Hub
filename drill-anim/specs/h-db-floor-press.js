// h-db-floor-press 哑铃地板卧推 (dumbbell floor press) · H 居家小器械力量系列.
// Lying on the back on a mat, knees bent ~90 deg, feet flat. A dumbbell in each hand above the chest; upper arms ~45 deg from
// the trunk. Lower the dumbbells until the backs of the upper arms touch the floor (elbows ~90 deg, forearms vertical), pause
// lightly without bouncing, then press back up to almost straight arms over the shoulders. Wrists stacked over elbows, low back
// relaxed on the mat. 2 reps / 8 s: 1.8 s down, 0.4 s pause, 1.3 s up, 0.5 s top.
// Head points -X, face up (+Y), body left = -Z (frame of h-crunch). No solver. Arms are planar two-bone chains in the chest
// frame (rest coords: +Z = up from the floor, -Y = toward the feet), each in a vertical plane 45 deg out from the trunk; fists
// round the handles with the thumbs toward the head and the midline (semi-neutral grip, so the dumbbells clear each other).
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
const DUR = 8, B0 = -16, B1 = 90, E0 = 106, E1 = 10;
const p = keys([[0, 1], [0.3, 1], [2.1, 0], [2.5, 0], [3.8, 1], [4.3, 1], [6.1, 0], [6.5, 0], [7.8, 1]], DUR);   // 1 = arms up
const arm = (side, t) => { const S = REST.shoulder(side), q = p(t), d0 = [sg(side) * Math.SQRT1_2, -Math.SQRT1_2, 0], up = [0, 0, 1];
  const dirAt = a => add(mul(d0, Math.cos(a * DEG)), mul(up, Math.sin(a * DEG)));
  const b = B0 + (B1 - B0) * q, e = E0 + (E1 - E0) * q;
  return { S, E: add(S, mul(dirAt(b), UA)), f: dirAt(b + e), a: [-sg(side) * Math.SQRT1_2, Math.SQRT1_2, 0] }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => { const A = arm(side, t), W = add(A.E, mul(A.f, FA)); return r4(add(A.E, add(mul(nrm(sub(A.E, mul(add(A.S, W), 0.5))), 0.3), [0, -0.03, 0]))); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: [0.0, 0.12, 0],
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], -4]] },
  chest: { waist: [[[0, 0, 1], -2]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.50, -0.105], heading: 90, pitch: 0, poleLow: [0.08, 0.6, 0.8] },
    right: { mode: 'floor', at: [0.50, 0.105], heading: 90, pitch: 0, poleLow: [-0.08, 0.6, 0.8] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { press: p });
export default {
  id: 'h-db-floor-press', name: '哑铃地板卧推', nameEn: 'Dumbbell Floor Press',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'triceps'], side: 'both', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [0.9, 0.6, 0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow', 'leftKnee', 'rightKnee'], pad: 0.14, k: 0.8, drift: 3, at: 2.3, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 680, cx: 512, cy: 575 },
  stillAt: 0.2,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftAnkle', rx: 40, ry: 10, a: 0.5 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [
    { type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.9, 0.006] },
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.045, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.045, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 1.2, 2.3],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['thighL|thighR'],
  },
};
