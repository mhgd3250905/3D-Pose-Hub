// h-db-rdl 哑铃罗马尼亚硬拉 (dumbbell Romanian deadlift) · H 居家小器械力量系列.
// Standing tall, feet hip-width, a dumbbell in each hand in front of the thighs (palms toward the body). Knees unlock a little
// and stay soft; the hips push straight back while the trunk hinges forward with a long, neutral back until it is ~30 deg above
// level and the dumbbells hang just below the knees (hamstrings stretch); pause, then drive the hips forward to stand tall.
// Arms hang straight under the shoulders the whole time; no rounding, no squatting. 2 reps / 8 s: 1.8 s down, 0.4 s pause,
// 1.4 s up, 0.4 s stand.
// Knee poles are world points in front of the knees (a hips-frame poleLow rotates with the hinge and flips the knee).
// Facing +Z, head up (+Y), body left = +X. No solver: pelvis and hip-hinge lean are functions of the rep phase; the arms are
// set in the chest frame at flexion = lean (+ a little) so they hang vertically in the world; pronated fists round the handles.
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
const p = keys([[0, 0], [0.3, 0], [2.1, 1], [2.5, 1], [3.9, 0], [4.3, 0], [6.1, 1], [6.5, 1], [7.9, 0]], DUR);
const TOP = [0, 0.884, 0.006], BOT = [0, 0.812, -0.19];
const lean = t => 4 + 58 * p(t);
const arm = (side, t) => { const S = REST.shoulder(side), l = lean(t);
  const E = add(S, mul(armDir(side, l + 9, 2), UA)), f = armDir(side, l + 15, 0);   // a little forward so the dumbbells clear the thighs
  return { S, E, f, a: [-sg(side), 0, 0] }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => { const A = arm(side, t); return r4(add(A.E, mul(armDir(side, lean(t) - 80, 15), 0.3))); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: t => r4(TOP.map((x, i) => x + (BOT[i] - x) * p(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 5, pitch: 0, pole: [0.2, 0.5, 0.9] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -5, pitch: 0, pole: [-0.2, 0.5, 0.9] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { hinge: p });
export default {
  id: 'h-db-rdl', name: '哑铃罗马尼亚硬拉', nameEn: 'Dumbbell Romanian Deadlift',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hamstrings', 'glute-max'], side: 'both', pulseTrack: 'hinge', pulseBase: 0.3 },
  camera: { dir: [1, 0.25, -0.2], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 0.9, drift: 3, at: 2.3, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 860, cx: 512, cy: 510 },
  stillAt: 0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 1.2, 2.3],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 165 }, { j: 'elbow.right', min: 165 }],
    allowContact: [],
  },
};
