import { floorDrill, curve, qaStd } from './_thomas.mjs';
// t-lsit-open-close L 撑开合腿 (L-sit, legs open and close). Head up (+Y), body faces +Z, body left = +X.
// Press up into an L-sit with the legs together, then open the straight legs wide and close them again (2 reps per loop), sit down. Loop 8 s.
const T = 8, up = curve([[0, 0], [0.6, 0], [1.4, 1], [7.0, 1], [7.7, 0]], T);
const open = curve([[0, 0], [1.6, 0], [2.6, 1], [3.1, 1], [4.1, 0], [4.6, 0], [5.6, 1], [6.1, 1], [7.1, 0]], T);
const leg = (u, o) => ({ elev: -1.2 + 9 * u + 2 * o, spread: 2 + 22 * o, pf: 8 + 35 * u });
export default floorDrill({
  id: 't-lsit-open-close', name: 'L 撑开合腿', nameEn: 'L-Sit Open & Close', T,
  hands: { left: [0.30, 0.10, [0.15, 1]], right: [-0.30, 0.10, [-0.15, 1]] },
  fn: t => { const u = up(t), o = open(t); return { pitch: 6 + 6 * u, py: 0.134 + 0.03 * u, pw: 3 - 2 * u,  shift: 0.06 * u, elbow: 145 + 32.5 * Math.min(1, u * 1.6), legs: { left: leg(u, o), right: leg(u, o) } }; },
  highlight: { groups: ['hip-flexors', 'adductors'], side: 'both', pulseAt: [2.85, 5.85], pulseWidth: 0.6, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.25, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 4, at: 2.85 },
  keyFrames: [1.5, 2.85, 4.4],
  qa: qaStd(),
});
