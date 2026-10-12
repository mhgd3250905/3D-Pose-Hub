import { floorDrill, curve, qaStd } from './_thomas.mjs';
// t-vsit V 撑 (V-sit hold on the hands). Head up (+Y), body faces +Z, body left = +X.
// Hands flat on the floor just behind the hips, arms locked; lean back, lift the hips and raise both straight legs together
// high in front into a V, hold, lower. Side-ish camera so the V reads. Loop 8 s.
const T = 8, up = curve([[0, 0], [0.7, 0], [1.9, 1], [6.3, 1], [7.4, 0]], T), br = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 2.4);
const leg = (u, b) => ({ elev: -1.2 + 52 * u + 1.5 * b, spread: 3, pf: 8 + 40 * u });
export default floorDrill({
  id: 't-vsit', name: 'V 撑', nameEn: 'V-Sit', T,
  hands: { left: [0.22, -0.06, [0.2, 1]], right: [-0.22, -0.06, [-0.2, 1]] },
  fn: t => { const u = up(t), b = br(t) * u; return { pitch: -24 - 8 * u, py: 0.134 + 0.025 * u, pw: 3 - 1.5 * u, shift: 0.06 * u, elbow: 145 + 32.5 * Math.min(1, u * 1.6), legs: { left: leg(u, b), right: leg(u, b) } }; },
  highlight: { groups: ['abs', 'hip-flexors'], side: 'both', pulseAt: [3.0, 5.2], pulseWidth: 1.2, pulseBase: 0.3 },
  camera: { dir: [1, 0.2, 0.35], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 4, at: 4 },
  keyFrames: [0.3, 1.3, 4],
  qa: qaStd(),
});
