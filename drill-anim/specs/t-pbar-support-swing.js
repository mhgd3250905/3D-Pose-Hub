// t-pbar-support-swing 双杠支撑摆动 (parallel-bar support swing) · Thomas supplement r1 (2026-11-19), derived from lats-C.
// Straight-arm support on the dip bars (lats-C bars, grip and hand targets), shoulders held down, body straight; the whole body
// swings like a pendulum about the shoulders, forward and back, arms locked; the feet never rise above the bars (front/back swing
// 24 deg -> toes ~0.35 m below the bar line). Head up (+Y), body faces +Z, body left = +X.
// Changes from lats-C: no shoulders.shift (V5 copies bone rotations only, a shift would slide the V5 hands off the bars); the
// shrug track is replaced by the swing track 'sw' (-1 back .. +1 front) on the hip pitch; solver px/py/pz keeps both arms at
// 178.5 deg on the pinned grips and the shoulder centre over the bars (z).
// Loop 8 s = 2 swings of 4 s (one forward + back = 1 rep): sinusoidal, slowing at each end.
import base from './lats-C.js';
const s = structuredClone(base);
s.id = 't-pbar-support-swing'; s.name = '双杠支撑摆动'; s.nameEn = 'Parallel-Bar Support Swing';
const A = 24, N = 240;
const sw = Array.from({ length: N }, (_, i) => { const t = i / 30; return [+t.toFixed(4), +Math.sin(2 * Math.PI * t / 4).toFixed(5), 'linear']; });
s.timeline = { duration: 8, tracks: { sw, hl: sw.map(([t, v]) => [t, +Math.abs(v).toFixed(5), 'linear']) } };
const b = s.pose.base;
b.shoulders = { shift: [0, 0, 0] };
b.hips.rot = [[[1, 0, 0], 0]];
b.constraints = [
  { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 },
  { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: 0.0, weight: 2 },
];
b.solve = { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.02, pz: 0.02 }, iters: 60 };
s.pose.deltas = { sw: { hips: { rot: [[[1, 0, 0], -A]] } }, hl: {} };   // sw = +1: legs forward (hip pitch -A), -1: legs back
s.highlight = { groups: ['triceps', 'deltoids'], side: 'both', pulseTrack: 'hl', pulseBase: 0.35 };
s.keyFrames = [0, 1, 3]; s.stillAt = 0;
s.camera = { ...s.camera, dir: [1, 0.15, 0.05], drift: 0 };
s.qa = { ...s.qa, straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }] };
s.thomasSupplement = { version: 'r1', item: '11', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
