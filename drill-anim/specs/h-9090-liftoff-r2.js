// h-9090-liftoff-r2 (HipLab media fix 2026-10-17, issue 10: feet follow the shins, see _9090-feet.mjs; the lifted back foot keeps its pose relative to the shin) · 90/90 后腿主动抬起 (90/90 back-leg lift-off, active hip internal rotation) · H 居家开胯系列.
// Sitting tall in 90/90 (the s-9090 set-up): RIGHT leg in front, shin across the body (external rotation); LEFT leg out to the
// side, knee 90 deg, shin pointing back (internal rotation). Keeping the torso tall and the left knee on the mat, the left
// foot and shin lift off the floor by turning the left thigh inward (active end-range internal rotation, glute med/min), hold
// for a beat, lower slowly. Hands rest on the knees. 2 reps / 8 s: 1.2 s up, 1.0 s hold, 1.2 s down, 0.6 s rest.
// Head points +Y, body left = +X (frame of s-9090). No solver: the left ankle orbits the left hip-knee line, the knee stays put.
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { REST, restPtW, rotAbout } from '../lib/ss-geo.mjs';
import { ROT_R, ROT_L, ANKLE_R, ANKLE_L } from './_9090-feet.mjs';
const DUR = 8, LIFT = 24;
const PEL = [0, 0.14, 0];
const hips = { up: [0, 1, 0], front: [0.6, 0, 0.8], rot: [[[1, 0, 0], 0]] };
const HL = restPtW(hips, PEL, REST.hip('left'));
const AL = ANKLE_L, POLEL = [1.0, 0.1, 0.1];
// left knee: point on the hip-ankle circle (thigh 0.353, shin 0.4098) closest to the pole
const sub = (a, b) => a.map((x, i) => x - b[i]), add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const kneeOf = (H, A, Pp) => { const d = sub(A, H), L = Math.hypot(...d), u = mul(d, 1 / L), T = 0.353, S = 0.4098;
  const x = (T * T - S * S + L * L) / (2 * L), r = Math.sqrt(Math.max(0, T * T - x * x)); const c = add(H, mul(u, x));
  let w = sub(Pp, c); w = nrm(sub(w, mul(u, dot(w, u)))); return add(c, mul(w, r)); };
const KL = kneeOf(HL, AL, POLEL);
const ax = sub(KL, HL);
const SGN = rotAbout(AL, KL, ax, 10)[1] > AL[1] ? 1 : -1;      // positive lift raises the foot
const p = keys([[0, 0], [0.3, 0], [1.5, 1], [2.5, 1], [3.7, 0], [4.3, 0], [5.5, 1], [6.5, 1], [7.7, 0]], DUR);
const ank = t => rotAbout(AL, KL, ax, SGN * LIFT * p(t));
const poleL = t => { const A = ank(t), m = mul(add(A, HL), 0.5); return r4(add(KL, mul(sub(KL, m), 2))); };
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[1, 0, 0], -3], [[0, 1, 0], -20]] },
  hands: {
    left: { mode: 'free', frame: 'world', palmAt: [0.25, 0.17, 0.0], finger: [0.3, 0, 1], normal: [0, -1, 0], pole: [0.6, 0.3, -0.3], relax: 1, touch: { solve: 'bisect', clear: 0.0008, toward: 'leftKnee' } },
    right: { mode: 'free', frame: 'world', palmAt: [-0.09, 0.17, 0.24], finger: [0.3, 0, 1], normal: [0, -1, 0], pole: [-0.6, 0.3, -0.3], relax: 1, touch: { solve: 'bisect', clear: 0.0008, toward: 'rightKnee' } },
  },
  feet: {
    right: { mode: 'free', frame: 'world', ankle: ANKLE_R, rot: ROT_R, pole: [-0.3, 0.1, 1.0], thighTwist: 60 },
    left: { mode: 'free', frame: 'world', ankle: t => r4(ank(t)), rot: [...ROT_L, [r4(nrm(ax)), t => SGN * LIFT * p(t)]], pole: poleL, thighTwist: 40 },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 'h-9090-liftoff-r2', name: '90/90后腿主动抬起', nameEn: '90/90 Back-Leg Lift-Off',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors', 'glute-max'], side: 'left', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [1, 0.6, 0.05], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe', 'leftAnkle'], pad: 0.18, k: 1.0, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 640, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['leftKnee', 'rightKnee', 'pelvis', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.5 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'leftKnee', to: 'rightKnee', mid: 'pelvis', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0.15, 0, -0.1], size: [1.2, 1.2, 0.006], yaw: 0 }],
  keyFrames: [0.3, 1.0, 2.0],
  qa: {
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handR|thighR', 'handR|shinR', 'handL|thighL', 'handL|shinL', 'footR|shinL', 'footR|thighL', 'shinR|thighL', 'thighR|shinR', 'thighL|shinL'],
  },
};
