import { floorDrill, curve, qaStd } from './_thomas.mjs';
// t-seated-straddle-lifts 坐姿分腿双腿抬起 (seated straddle lifts, both legs). Head up (+Y), body faces +Z, body left = +X.
// Sitting in a wide straddle, hands flat on the floor between the thighs, chest leaning forward; lift both straight legs a
// few cm off the floor (hips stay down), lower. 4 even reps per 8 s loop (2 s each: up 0.6, hold 0.4, down 0.6, rest 0.4).
const T = 8, rep = t => { const p = (t % 2) / 2; return curve([[0, 0], [0.05, 0], [0.35, 1], [0.55, 1], [0.85, 0]], 1)(p); };
const leg = r => ({ elev: -1.2 + 14 * r, spread: 44, pf: 10 + 25 * r });
export default floorDrill({
  id: 't-seated-straddle-lifts', name: '坐姿分腿双腿抬起', nameEn: 'Seated Straddle Lifts', T,
  hands: { left: [0.075, 0.24, [0.25, 1]], right: [-0.075, 0.24, [-0.25, 1]] },
  fn: t => { const r = rep(t); return { pitch: 14 + 3 * r, py: 0.134, pw: 3, shift: 0.02 * r, elbow: 170, legs: { left: leg(r), right: leg(r) } }; },
  tags: { lift: rep },
  highlight: { groups: ['hip-flexors'], panels: ['quadRect'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [0.3, 0.13, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.08, k: 1.0, drift: 2, driftPeriod: 8, at: 0.9 },
  keyFrames: [0.0, 0.5, 0.9],
  qa: qaStd({ more: { pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.lift<0.001' }, { c: 'footL', when: 'params.lift<0.001' }] } }),
});
