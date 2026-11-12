// h-adductor-rock-r2 (pose fix 2026-11-08, user review: the side-extended right leg is visibly bent at the knee). Copy of -gc1 with:
// - measured on gc1 (v3 armfix): right knee 141.9-142.9 deg over the whole loop (hip->ankle 0.781-0.784 m vs leg 0.827 m: the foot sat
//   at [-0.50, 0.772], placed for the shorter v2 leg). The foot now sits at x -0.515 = the x of the left knee, the centre of the
//   pelvis rock arc, so the hip->foot distance stays almost constant while rocking (0.8256-0.8261 m), and z 0.8221 (leg out to the
//   side ~90 deg from the body): right knee 175-177 deg throughout, foot flat on the mat, toes forward, planted.
// - the 1 'torso position limited' solver note per frame is inherited from gc1 (straight arms at full reach); shortening the reach
//   (tested 4 / 8 mm) did not remove it and bent the elbows, so the arm/torso solve is left exactly as in gc1.
// Everything else (rock arc, pitch solve, hands, left leg, timing, camera) is gc1's.
// h-adductor-rock-gc1: ground-contact fix r1 (2026-11-03) of h-adductor-rock. Same quadruped re-seat as w-bird-dog-gc1: start pelvis +52 mm,
// start pitch 7.778 deg (the rock arc about the left knee and the shoulder-hand pitch solve are unchanged code).
// h-adductor-rock 四足单腿侧伸后摇 (quadruped adductor rock-back) · H 居家开胯系列.
// Quadruped with the hands under the shoulders and the LEFT knee under the hip (toes tucked); the RIGHT leg is straight and
// reaches out to the side, foot flat on the mat with the toes pointing forward. Keeping the back long, the hips rock back
// toward the left heel until a stretch is felt along the inner thigh of the straight leg (adductors), then rock forward
// again. Arms stay straight; the reaching foot stays planted. 2 rocks / 8 s: 1.8 s back, 0.8 s hold, 1.4 s forward.
// Head points +X, face down (-Y), body right = +Z. No solver: the pelvis follows an arc about the left knee; the trunk pitch is
// solved numerically per frame so the shoulders stay one straight-arm length from the planted hands.
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { REST, restPtW } from '../lib/ss-geo.mjs';
const DUR = 8, BACK = 22;
const p = keys([[0, 0], [0.2, 0], [2.0, 1], [2.8, 1], [4.0, 0], [4.2, 0], [6.0, 1], [6.8, 1], [7.9, 0]], DUR);
const P0 = [-0.4559, 0.4495, -0.0041], TH0 = 7.778;   // gc1: was 0.3975 / 12.778 (armfix-r2 knee 52 mm under the floor)
const KNL = [-0.515, 0.0407, -0.0857];
const HAND = [0.0, 0.0, 0.19];
const hipsAt = th => ({ up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], th]] });
const shR = (P, th) => restPtW(hipsAt(th), P, REST.shoulder('right'));
const L0 = Math.hypot(...shR(P0, TH0).map((x, i) => x - [HAND[0], shR(P0, TH0)[1] * 0 + 0.0, HAND[2]][i]));
// pelvis on an arc about the left knee (in the sagittal x-y plane), swung back by BACK deg; gc1: no sink at the back (was: sinks 1 cm) so the knee stays on y=0
const R = Math.hypot(P0[0] - KNL[0], P0[1] - KNL[1]), A0 = Math.atan2(P0[1] - KNL[1], P0[0] - KNL[0]);
const pel = t => { const a = A0 + BACK * Math.PI / 180 * p(t); return r4([KNL[0] + R * Math.cos(a), KNL[1] + R * Math.sin(a) + 0.0 * p(t), P0[2]]); };
const pitch = t => { const P = pel(t); let lo = TH0 - 10, hi = TH0 + 60;   // bisection on |shoulder - hand| = L0
  const f = th => Math.hypot(...shR(P, th).map((x, i) => x - [HAND[0], 0, HAND[2]][i])) - (L0 - 0.0012);
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; (f(lo) * f(m) <= 0) ? (hi = m) : (lo = m); }
  return +((lo + hi) / 2).toFixed(3); };
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
const FOOTR = [-0.515, 0.8221];   // r2: was [-0.50, 0.772]
const P = build(DUR, {
  pelvis: pel,
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], pitch]] },
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { right: floorHand(0.19), left: floorHand(-0.19) },
  feet: {
    left: { mode: 'floor', at: [-0.868, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
    right: { mode: 'floor', at: FOOTR, heading: 90, pitch: 0, poleLow: t => { const q = pel(t); return r4([q[0] + 0.45, 0.45, 0.42]); } },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { rock: p });
export default {
  id: 'h-adductor-rock-r2', name: '四足单腿侧伸后摇', nameEn: 'Quadruped Adductor Rock-Back',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors'], side: 'right', pulseTrack: 'rock', pulseBase: 0.3 },
  camera: { dir: [-0.85, 0.3, 0.75], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightAnkle'], pad: 0.14, k: 0.8, drift: 3, at: 2.4, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 640, cx: 512, cy: 520 },
  stillAt: 2.4,
  shadow: { joints: ['rightPalm', 'leftPalm', 'leftKnee', 'leftToe', 'rightAnkle', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 },
      { j: 'rightAnkle', rx: 40, ry: 11, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.4, 0, 0.25], size: [1.6, 1.0, 0.006] }],
  keyFrames: [0.3, 1.2, 2.4],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }, { j: 'knee.right', min: 165 }],
    allowContact: ['thighL|shinL', 'thighL|torso'],
  },
};
