// h-db-row 扶椅单臂哑铃划船 (chair-supported one-arm dumbbell row), right arm · H 居家小器械力量系列.
// Split stance beside a sturdy chair: left foot forward, right foot back, knees soft. Hinge until the trunk is ~22 deg above
// level with a long flat back; the straight left arm rests on the chair seat (palm flat, under the shoulder). The right hand
// holds a dumbbell hanging under the shoulder (neutral grip, thumb toward the head). Pull the elbow up and back along the ribs
// until the upper arm is in line with the trunk and the dumbbell is beside the lower ribs, squeeze the shoulder blade back,
// pause, lower slowly to a long arm. Trunk still, no twisting. 2 reps / 8 s: 1.3 s pull, 0.5 s squeeze, 1.8 s lower, 0.4 s rest.
// The other side is the mirror image (App mirrors; this loop shows the right arm).
// Knee poles are world points in front of the knees (a hips-frame poleLow rotates with the hinge and flips the knee).
// Facing +Z, head up (+Y), body left = +X. No solver: fixed hinge (lean); the rowing arm is set in the chest frame with the
// forearm hanging vertically in the world (chest-frame flexion = lean); the left palm is a world-pinned flat hand (palmAt) on the seat (y 0.44).
import { build, keys, sg, r4, REST, armDir } from '../lib/home-anim.mjs';
import { UA, FA, DEG, restPtW } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;   // wrist -> fist centre along the forearm (gripPose geometry)
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8, LEAN = 68, PEL = [0, 0.775, -0.12], SEAT = 0.44, CX = 0.12, CZ = 0.42;
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.1, 1], [3.9, 0], [4.3, 0], [5.6, 1], [6.1, 1], [7.9, 0]], DUR);
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], LEAN]] };
const SHL = restPtW(hips, PEL, REST.shoulder('left'));                 // left shoulder in the world: the palm goes under it
const arm = t => { const q = p(t), S = REST.shoulder('right');
  const E = add(S, mul(armDir('right', LEAN + 4 - 84 * q, 10 + 6 * q), UA)), f = armDir('right', LEAN + 9 - 9 * q, 2);
  return { S, E, f, a: [0, 1, 0] }; };
const g = t => { const A = arm(t); return dbGrip('right', A.E, A.f, A.a); };
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: {
    right: { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal,
      poleUp: t => r4(add(arm(t).E, [-0.08, 0.0, -0.3])) },
    left: { mode: 'free', frame: 'world', relax: 0, palmAt: r4([SHL[0] + 0.005, SEAT + 0.016, SHL[2] + 0.06]), finger: [-0.1, 0, 1], normal: [0, -1, 0], poleUp: [0.45, 1.2, -0.3] },
  },
  feet: {
    left: { mode: 'floor', at: [0.14, 0.08], heading: 6, pitch: 0, pole: [0.22, 0.5, 0.9] },
    right: { mode: 'floor', at: [-0.15, -0.40], heading: -4, pitch: 0, pole: [-0.22, 0.5, 0.5] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { row: p });
export default {
  id: 'h-db-row', name: '扶椅单臂哑铃划船', nameEn: 'Chair-Supported One-Arm Dumbbell Row',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats', 'scapular'], side: 'right', pulseTrack: 'row', pulseBase: 0.3 },
  camera: { dir: [-1, 0.45, 0.3], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'rightElbow', 'leftKnee'], pad: 0.15, k: 0.9, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, height: 760, cx: 512, cy: 520 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'chair', at: [CX, 0, CZ], yaw: 180, height: SEAT, width: 0.44, depth: 0.42 },
    { type: 'gripHand', side: 'right' },
    { type: 'dumbbell', length: 0.30, plate: 0.045, attach: 'rightHand', ...DB('right') },
  ],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 160 }],
    allowContact: [],
  },
};
