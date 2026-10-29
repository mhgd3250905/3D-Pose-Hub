// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-kb-swing-r3.js';
// h-kb-swing 单臂壶铃摆荡 (one-arm kettlebell swing), right hand · H 居家小器械力量系列.
// Feet a little wider than the hips. A kettlebell in the right hand (overhand grip). Hike: hips push back, trunk ~62 deg
// forward with a flat back, knees soft, the bell between the thighs. Drive the hips forward hard (glutes, hamstrings) so the
// straight arm floats the bell up to chest height while standing tall (glutes squeezed, ribs down), let it fall back and hinge
// into the next hike as the forearm meets the inner thigh. The arm is a pendulum; the hips do the work. Left arm relaxed.
// 3 reps / 8 s: per rep 1.0 s up, 0.35 s float, 1.1 s back into the hike, 0.22 s hike.
// The other hand is the mirror image (App mirrors). Kettlebell prop: page/props.js 'kettlebell' attached to the right hand,
// its handle through the baked fist (handle top 1.37 r above the bell centre, bell hanging distal of the fist).
// Knee poles are world points in front of the knees (a hips-frame poleLow rotates with the hinge and flips the knee).
// Facing +Z, head up (+Y), body left = +X. No solver: pelvis and lean are functions of the rep phase; the swinging arm is set
// in the chest frame from its world angle (chest-frame flexion = world angle + lean).
import { build, keys, sg, r4, REST, armDir, armWrist } from './_home-armfix-r1.mjs';
import { UA, FA, DEG } from './_home-armfix-r1.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;   // wrist -> fist centre along the forearm (gripPose geometry)
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8, R = 8 / 3;
const K = []; for (let i = 0; i < 3; i++) { const s = i * R; K.push([s, 0], [s + 0.22, 0], [s + 1.22, 1], [s + 1.57, 1]); }
const p = keys(K, DUR);                                         // 0 = hike, 1 = top (stand tall, bell at chest height)
const HIKE = [0, 0.82, -0.225], TOP = [0, 0.947970171859, 0.006045798312];
const lean = t => 62 - 58 * p(t);
const armW = t => -30 + 116 * p(t);                              // swinging arm, world angle from hanging (deg, + = forward)
const arm = t => { const S = REST.shoulder('right'), l = lean(t), w = armW(t), ps = -16 + 8 * p(t);
  return { S, E: add(S, mul(armDir('right', w + l, ps), UA)), f: armDir('right', w + l + 7, ps), a: [1, 0, 0] }; };
const gR = t => { const A = arm(t); return dbGrip('right', A.E, A.f, A.a); };
// kettlebell in the right fist: local X (handle) -> fist axis, local -Y (toward the bell) -> distal (finger direction off the axis)
const KR = 0.095, PF = [-0.98253144, 0.05483374, 0.17783482];
const KB = (() => { const a = nrm(GRIP.right.a), d = nrm(sub(PF, mul(a, dot(PF, a)))), y = mul(d, -1), z = cross(a, y);
  const M = [a, y, z];   // columns
  const tr = M[0][0] + M[1][1] + M[2][2], ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
  const ax = nrm([M[1][2] - M[2][1], M[2][0] - M[0][2], M[0][1] - M[1][0]]);
  const hy = mul(y, 1.37 * KR);   // handle top in bone coords relative to the bell centre
  return { offset: r4(sub(GRIP.right.c, hy)), rot: [[r4(ax), +(ang * 180 / Math.PI).toFixed(3)]] }; })();
const P = build(DUR, {
  pelvis: t => r4(HIKE.map((x, i) => x + (TOP[i] - x) * p(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: {
    right: { mode: 'free', frame: 'chest', relax: 0, wrist: t => gR(t).wrist, finger: t => gR(t).finger, normal: t => gR(t).normal,
      poleUp: t => r4(add(arm(t).E, [0.05, 0.05, -0.3])) },
    left: { mode: 'free', frame: 'chest', wrist: t => r4(armWrist('left', lean(t) * 0.85 + 6, 18, 0.47)), finger: t => r4(armDir('left', lean(t) * 0.85 + 8, 18)),
      normal: [-1, 0, 0], poleUp: [0.4, 1.1, -0.3] },
  },
  feet: {
    left: { mode: 'floor', at: [0.19, 0.0], heading: 10, pitch: 0, pole: [0.34, 0.5, 0.9] },
    right: { mode: 'floor', at: [-0.19, 0.0], heading: -10, pitch: 0, pole: [-0.34, 0.5, 0.9] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { swing: p });
const spec = {
  id: 'h-kb-swing', name: '单臂壶铃摆荡', nameEn: 'One-Arm Kettlebell Swing',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max', 'hamstrings'], side: 'both', pulseTrack: 'swing', pulseBase: 0.3 },
  camera: { dir: [-1, 0.2, 0.4], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightPalm', 'leftPalm'], pad: 0.18, k: 0.9, drift: 3, at: 1.4, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 860, cx: 512, cy: 505 },
  stillAt: 1.4,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'kettlebell', r: KR, attach: 'rightHand', fixedKettlebellGrasp: 'grasp-32mm' },
  ],
  keyFrames: [0.1, 0.8, 1.4],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 165 }],
    allowContact: [],
  },
};

spec.id = "h-kb-swing-r5";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.v2plus.handPose={left:'relaxed',right:'grasp-32mm'};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
