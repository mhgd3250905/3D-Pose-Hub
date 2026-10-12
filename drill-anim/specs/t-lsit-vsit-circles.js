import { floorDrill, curve, qaStd } from './_thomas.mjs';
// t-lsit-vsit-circles L 撑到 V 撑画圈 (L-sit to V-sit leg circles). Head up (+Y), body faces +Z, body left = +X.
// From an L-sit the straight legs rise together to a V, open wide at the top, sweep down apart and close again at the L (2 circles per loop). Loop 9 s.
const T = 9, up = curve([[0, 0], [0.6, 0], [1.4, 1], [7.8, 1], [8.5, 0]], T);
const ph = t => (t < 1.4 || t >= 7.8) ? 0 : ((t - 1.4) / 3.2) % 1;   // circle phase 0..1, 3.2 s per circle
const leg = (u, p) => { const rise = p < 0.5 ? (1 - Math.cos(2 * Math.PI * p)) / 2 : (1 + Math.cos(2 * Math.PI * (p - 0.5))) / 2 * 1;
  const sp = p < 0.5 ? 0 : Math.sin(2 * Math.PI * (p - 0.5)); return { elev: -1.2 + 9 * u + 30 * rise * u, spread: 2 + 16 * sp, pf: 8 + 35 * u }; };
export default floorDrill({
  id: 't-lsit-vsit-circles', name: 'L 撑到 V 撑画圈', nameEn: 'L-Sit to V-Sit Circles', T,
  hands: { left: [0.33, 0.06, [0.15, 1]], right: [-0.33, 0.06, [-0.15, 1]] },
  fn: t => { const u = up(t), p = ph(t), l = leg(u, p), rise = (l.elev + 1.2 - 9 * u) / 30;
    return { pitch: 6 + 4 * u - 6 * rise * u, py: 0.134 + 0.03 * u, pw: 3 - 2 * u,  shift: 0.06 * u, elbow: 145 + 32.5 * Math.min(1, u * 1.6), legs: { left: l, right: l } }; },
  highlight: { groups: ['abs', 'hip-flexors'], side: 'both', pulseAt: [2.2, 5.4], pulseWidth: 1.0, pulseBase: 0.3 },
  camera: { dir: [0.35, 0.25, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 3, driftPeriod: 9, at: 3.0 },
  keyFrames: [1.5, 3.0, 3.8],
  qa: qaStd(),
});
