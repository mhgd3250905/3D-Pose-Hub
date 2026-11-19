// t-pbar-support-swing 双杠支撑摆动 (parallel-bar support swing) · Thomas supplement r1 (2026-11-19), derived from lats-C.
// Straight-arm support on the dip bars (lats-C bars, grip and hand targets), shoulders held down, body straight; the whole body
// swings like a pendulum about the shoulders, forward and back, arms locked; the feet never rise above the bars (front/back swing
// 24 deg -> toes ~0.35 m below the bar line). Head up (+Y), body faces +Z, body left = +X.
// Changes from lats-C: no shoulders.shift (V5 copies bone rotations only, a shift would slide the V5 hands off the bars); the
// shrug track is replaced by the swing track 'sw' (-1 back .. +1 front) on the hip pitch; solver px/py/pz keeps both arms at
// 178.5 deg on the pinned grips and the shoulder centre over the bars (z).
// Loop 8 s = 2 swings of 4 s (one forward + back = 1 rep): sinusoidal, slowing at each end.
// r2 (precision pass, standard tools/thomas-sup/standards/t-pbar-support-swing.md):
//  - solver warning on every r1 frame ("ankle limited to the real leg length"): the lats-C ankle targets sat 0.4 mm beyond the
//    straight armfix leg (0.8269 m vs 0.8265 m max), so every frame clamped them. The ankles are now placed on the same lines at the
//    leg length of a 178 deg knee (reach(178)), so the legs solve without clamping (knees 178, straight);
//  - shoulders held down the whole set (support with the shoulder blades depressed, shoulders.shift -15 mm, drawn by V5 through
//    v5.scapulaShift, which moves the V5 scapulae with the hub's; the hands stay on the bars). The hub then reports
//    "wrist limited to what the original arm can reach" on every frame: its metric wrist point is not carried by shoulders.shift
//    (15 mm high), while the hand bones that V5 draws stay exactly on the r1 grip (same as t-pushup-plus / t-planche-lean r2);
//  - slight hollow body (waist +4 deg), and the swing centred on the vertical (r1 rested 2.2 deg feet-forward: +23 / -19 deg).
import base from './lats-C.js';
import { R, reach } from './_thomas-armfix-r1.mjs';
const s = structuredClone(base);
s.id = 't-pbar-support-swing'; s.name = '双杠支撑摆动'; s.nameEn = 'Parallel-Bar Support Swing';
const A = 24, N = 240, ARM = 178.5, ITERS = 60;
const sw = Array.from({ length: N }, (_, i) => { const t = i / 30; return [+t.toFixed(4), +Math.sin(2 * Math.PI * t / 4).toFixed(5), 'linear']; });
s.timeline = { duration: 8, tracks: { sw, hl: sw.map(([t, v]) => [t, +Math.abs(v).toFixed(5), 'linear']) } };
const b = s.pose.base;
s.v5 = { scapulaShift: true };
b.shoulders = { shift: [0, -0.015, 0] };   // chest frame: 15 mm scapular depression (shoulders away from the ears)
b.chest = { waist: [[[1, 0, 0], 4]] };      // slight hollow
const PITCH0 = 2.2;                          // hip pitch that centres the swing on the vertical (r1 rest: feet 2.2 deg forward)
b.hips.rot = [[[1, 0, 0], PITCH0]];
for (const side of ['left', 'right']) {      // same leg lines as lats-C, ankle at the 178 deg knee leg length (no clamp)
  const f = b.feet[side], h = R.hip[side], d = f.ankle.map((x, i) => x - h[i]), k = reach(178) / Math.hypot(...d);
  f.ankle = h.map((x, i) => +(x + d[i] * k).toFixed(6));
}
b.constraints = [
  { type: 'reach', limb: 'rightArm', angle: ARM, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: ARM, weight: 10 },
  { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: 0.0, weight: 2 },
];
b.solve = { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.02, pz: 0.02 }, iters: ITERS };
s.pose.deltas = { sw: { hips: { rot: [[[1, 0, 0], PITCH0 - A]] } }, hl: {} };   // sw = +1: legs forward (hip pitch -A), -1: legs back
s.highlight = { groups: ['triceps', 'deltoids'], side: 'both', pulseTrack: 'hl', pulseBase: 0.35 };
s.keyFrames = [0, 1, 3]; s.stillAt = 0;
s.camera = { ...s.camera, dir: [1, 0.15, 0.05], drift: 0 };
s.qa = { ...s.qa, straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }] };
s.thomasSupplement = { version: 'r2', item: '11', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
