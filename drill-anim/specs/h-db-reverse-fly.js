// h-db-reverse-fly 哑铃俯身飞鸟 (bent-over dumbbell reverse fly) · H 居家小器械力量系列.
// Feet hip-width, knees soft, hips hinged back until the trunk is ~35 deg above level with a long flat back (held still the
// whole set). A light dumbbell in each hand hanging under the shoulders, palms facing each other, elbows slightly bent (~15 deg)
// and fixed. Raise both arms out to the sides in a wide arc until they are about level with the back, squeezing the shoulder
// blades together, pause, lower slowly. No swinging, no shrugging. 2 reps / 8 s: 1.4 s up, 0.5 s pause, 1.7 s down, 0.4 s rest.
// Facing +Z, head up (+Y), body left = +X. No solver: fixed hinge (lean); each arm is a planar two-bone chain in the plane of
// world-down and the body's lateral axis (chest frame), fists round the handles with the thumbs pointing forward (world +Z).
// Knee poles are world points in front of the knees (a hips-frame poleLow rotates with the hinge and flips the knee).
// Added in place of h-goblet-squat (dropped: the cupped-palm goblet hold could not be made convincing with the fixed hand mesh).
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
const DUR = 8, LEAN = 55, PEL = [0, 0.822, -0.16], A0 = 8, A1 = 80, ELB = 15;
const p = keys([[0, 0], [0.3, 0], [1.7, 1], [2.2, 1], [3.9, 0], [4.3, 0], [5.7, 1], [6.2, 1], [7.9, 0]], DUR);
const DOWN = [0, -Math.cos(LEAN * DEG), Math.sin(LEAN * DEG)];        // world vertical, in the chest frame
const FWD = [0, Math.sin(LEAN * DEG), Math.cos(LEAN * DEG)];          // world +Z, in the chest frame
const arm = (side, t) => { const S = REST.shoulder(side), out = [sg(side), 0, 0], a = A0 + (A1 - A0) * p(t);
  const dirAt = x => add(mul(DOWN, Math.cos(x * DEG)), mul(out, Math.sin(x * DEG)));
  return { S, E: add(S, mul(dirAt(a), UA)), f: dirAt(a - ELB) }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, FWD); };
  const pole = t => { const A = arm(side, t), W = add(A.E, mul(A.f, FA)); return r4(add(A.E, mul(nrm(sub(A.E, mul(add(A.S, W), 0.5))), 0.3))); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: PEL,
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], LEAN]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 5, pitch: 0, pole: [0.2, 0.5, 0.9] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -5, pitch: 0, pole: [-0.2, 0.5, 0.9] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { fly: p });
export default {
  id: 'h-db-reverse-fly', name: '哑铃俯身飞鸟', nameEn: 'Bent-Over Dumbbell Reverse Fly',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['deltoids', 'scapular'], side: 'both', pulseTrack: 'fly', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.55, -1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.15, k: 0.9, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 820, cx: 512, cy: 520 },
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
    straight: [],
    allowContact: [],
  },
};
