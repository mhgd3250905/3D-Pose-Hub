// h-chair-step-up 椅子上步 (chair step-up) · H 居家徒手后链系列.
// Standing tall a short step in front of a sturdy backless chair (stool) against the wall, hands on the hips. The lead foot steps
// up and lands flat on the middle of the seat; leaning the trunk a little forward and pressing through the whole lead foot, the
// lead leg drives the body up until standing tall on the seat, the trailing foot following up beside it; then the trailing foot
// steps back down to the floor while the lead leg lowers the body under control, and the lead foot steps down to standing.
// Rep 1 leads with the RIGHT leg, rep 2 with the LEFT. Per 4 s rep: 0.2 s stand, 0.75 s lead foot up, 1.0 s drive up (trailing
// foot follows), 0.45 s tall on the seat, 0.85 s lower (trailing foot down first), 0.6 s lead foot down.
// Head +Y, front faces +Z (toward the chair), body left = +X. No solver: the pelvis and both feet are functions of time; every
// foot is a floor-mode foot whose floor height is the floor or the seat top (lift), so a planted sole is flat and exact; the
// knee poles are world points in front of the knees (carried with the pelvis).
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, FX = 0.105, SEAT = 0.45, CZ = 0.43, D = 0.42, ZS = 0.34, SOLE = 0.002;
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const local = t => ((t % DUR) + DUR) % DUR;
const lead = t => (local(t) < 4 ? 'right' : 'left');
const ph = K => { const f = keys(K, 4); return t => f(local(t) % 4); };
const U = ph([[0, 0], [0.2, 0], [0.95, 1], [3.4, 1], [3.95, 0]]);      // lead foot floor -> seat
const B = ph([[0, 0], [0.95, 0], [2.05, 1], [2.4, 1], [3.2, 0]]);      // body drive (pelvis up onto the chair)
const C = ph([[0, 0], [1.1, 0], [2.0, 1], [2.5, 1], [3.3, 0]]);      // trailing foot floor -> seat
const E = ph([[0, 0], [0.85, 0], [1.12, 1], [1.4, 1], [1.7, 0], [2.95, 0], [3.2, 1], [3.35, 1], [3.6, 0]]);   // trailing heel rise (push-off / toe-first landing)
// a foot travelling floor -> seat (v 0..1): it rises first, then moves forward over the seat edge, then sets down flat
const path = v => ({ z: ZS * sm((v - 0.35) / 0.65), lift: (SEAT + SOLE) * sm(v / 0.5) + 0.055 * Math.sin(Math.PI * sm(v)) });
const foot = s => {
  const v = t => (lead(t) === s ? U(t) : C(t));
  const heel = t => (lead(t) === s ? 0 : E(t));
  // heel rise pivots on the toes: the ankle slides back so the toe tip stays put (toe 0.16 m ahead, 0.075 m below the ankle)
  const toeFix = t => { const q = 26 * heel(t) * Math.PI / 180; return 0.16 - (-0.075 * Math.sin(q) + 0.16 * Math.cos(q)); };
  return { mode: 'floor', at: t => r4([sg(s) * FX, path(v(t)).z + toeFix(t)]), heading: sg(s) * 4, pitch: t => +(26 * heel(t)).toFixed(3), lift: t => +path(v(t)).lift.toFixed(4),
    pole: t => r4([sg(s) * 0.14, 0.62 + SEAT * B(t), path(v(t)).z + 1.0]) };
};
const TOP = [0, 0.884, 0.006];
const lean = t => 3 + 12 * Math.sin(Math.PI * B(t)) + 6 * U(t) * (1 - B(t));
const P = build(DUR, {
  pelvis: t => r4([0, TOP[1] - 0.035 * U(t) * (1 - B(t)) + SEAT * B(t), TOP[2] + 0.04 * U(t) + (ZS - 0.04) * B(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: {
    left: { mode: 'free', frame: 'hips', palmAt: [0.134, 1.10, -0.02], finger: [-0.05, -0.35, 0.94], normal: [-1, 0, 0], poleUp: [0.6, 1.1, -0.65] },
    right: { mode: 'free', frame: 'hips', palmAt: [-0.134, 1.10, -0.02], finger: [0.05, -0.35, 0.94], normal: [1, 0, 0], poleUp: [-0.6, 1.1, -0.65] },
  },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { up: B, onR: t => (lead(t) === 'right' ? U(t) : C(t)), onL: t => (lead(t) === 'left' ? U(t) : C(t)),
  // 0 only while that foot is flat on the floor at home (not travelling, heel down): the floor pin's QA window
  freeR: t => (lead(t) === 'right' ? U(t) : Math.max(C(t), E(t))), freeL: t => (lead(t) === 'left' ? U(t) : Math.max(C(t), E(t))) });
export default {
  id: 'h-chair-step-up', name: '椅子上步', nameEn: 'Chair Step-Up',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['quadriceps', 'glute-max'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [1, 0.2, 0.3], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.12, k: 1.0, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 900, height: 660, cx: 500, cy: 395 },   // placed on the tall pose on the seat (stillAt); the floor poses sit 45 cm lower in frame
  stillAt: 2.2,   // comp placement is fitted to standing tall on the seat (the highest pose)
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6, fade: [0.09, 0.25] }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6, fade: [0.09, 0.25] }], bands: [] },
  // backless chair (back: 0 = stool); seat front edge faces -Z (yaw 180) at z = CZ - D/2
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 180, height: SEAT, width: 0.44, depth: D, back: 0 }],
  keyFrames: [0.1, 0.95, 2.2],
  qa: {
    pins: [{ c: 'footL', when: 'params.freeL<0.001' }, { c: 'footR', when: 'params.freeR<0.001' }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handL|torso', 'forearmL|torso', 'thighL|shinL', 'thighR|shinR'],
  },
};
