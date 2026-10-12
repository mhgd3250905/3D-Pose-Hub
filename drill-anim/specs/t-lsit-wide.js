import { floorDrill, curve, qaStd } from './_thomas.mjs';
// t-lsit-wide 宽腿 L 撑 (wide-leg L-sit hold on the floor). Head up (+Y), body faces +Z, body left = +X.
// Hands flat beside the hips (outside the thighs), arms locked, shoulders pressed down; lift the hips and both straight legs,
// legs held apart at about 45 deg, hold, sit back down. Loop 8 s.
const T = 8, up = curve([[0, 0], [0.7, 0], [1.7, 1], [6.5, 1], [7.5, 0]], T), br = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 2.4);
const leg = (u, b) => ({ elev: -1.2 + 9 * u + b, spread: 26 + 2 * u, pf: 8 + 35 * u });
export default floorDrill({
  id: 't-lsit-wide', name: '宽腿 L 撑', nameEn: 'Wide-Leg L-Sit', T,
  hands: { left: [0.34, 0.10, [0.15, 1]], right: [-0.34, 0.10, [-0.15, 1]] },
  fn: t => { const u = up(t), b = br(t) * u; return { pitch: 6 + 6 * u, py: 0.134 + 0.03 * u, pw: 3 - 2 * u,  shift: 0.06 * u, elbow: 145 + 32.5 * Math.min(1, u * 1.6), legs: { left: leg(u, b), right: leg(u, b) } }; },
  highlight: { groups: ['hip-flexors', 'abs'], panels: ['quadRect'], side: 'both', pulseAt: [2.5, 5.0], pulseWidth: 1.2, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 4, at: 3.5 },
  keyFrames: [0.3, 1.2, 3.5],
  qa: qaStd(),
});
