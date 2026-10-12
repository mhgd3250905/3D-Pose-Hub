import { floorDrill, curve, qaStd } from './_thomas.mjs';
// t-seated-straddle-lift-1leg 坐姿分腿单腿抬起 (seated straddle lifts, one leg). Head up (+Y), body faces +Z, body left = +X.
// Sitting in a wide straddle, hands on the floor between the thighs; lift ONE straight leg off the floor and lower it while the
// other stays down, alternating left / right. 4 even reps per 8 s loop (2 per side).
const T = 8, rep = t => curve([[0, 0], [0.05, 0], [0.35, 1], [0.55, 1], [0.85, 0]], 1)(((t % 2) / 2));
const side = t => (Math.floor(t / 2) % 2 === 0) ? 'left' : 'right';
const liftL = t => side(t) === 'left' ? rep(t) : 0, liftR = t => side(t) === 'right' ? rep(t) : 0;
const leg = r => ({ elev: -1.2 + 15 * r, spread: 44, pf: 10 + 25 * r });
export default floorDrill({
  id: 't-seated-straddle-lift-1leg', name: '坐姿分腿单腿抬起', nameEn: 'Seated Straddle Lifts (1 Leg)', T,
  hands: { left: [0.075, 0.24, [0.25, 1]], right: [-0.075, 0.24, [-0.25, 1]] },
  fn: t => { const l = liftL(t), r = liftR(t); return { pitch: 14 + 2 * (l + r), roll: 2.5 * (r - l), py: 0.134, pw: 3, shift: 0.015 * (l + r), elbow: 170, legs: { left: leg(l), right: leg(r) } }; },
  solve: { vars: ['py', 'pz', 'px', 'c0'], reg: { py: 0.3, pz: 0.05, px: 0.05, c0: 0.05 }, iters: 60 },
  tags: { liftL, liftR },
  highlight: { groups: ['hip-flexors'], panels: ['quadRect'], side: 'both', pulseAt: [0.9, 2.9, 4.9, 6.9], pulseWidth: 0.4, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.13, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.08, k: 1.0, drift: 2, driftPeriod: 8, at: 0.9 },
  keyFrames: [0.0, 0.9, 2.9],
  qa: qaStd({ more: { pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.liftR<0.001' }, { c: 'footL', when: 'params.liftL<0.001' }] } }),
});
