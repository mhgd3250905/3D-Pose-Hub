import { floorDrill, curve, qaStd } from './_thomas.mjs';
// R04: hips stay seated, legs spread almost transversely, palms in front between the thighs.
// Head up (+Y), body faces +Z, body left = +X. Small straight-leg lifts; the pelvis does not rise with the feet.
// Spread/waist values are model settings for the visible reference shape, not recovered human 3D angles.
const T = 8, rep = t => { const p = (t % 2) / 2; return curve([[0, 0], [0.05, 0], [0.35, 1], [0.55, 1], [0.85, 0]], 1)(p); };
const leg = r => ({ elev: -1.2 + 6 * r, spread: 68, pf: 0, knee: 178, kneeUp: [0, 1, 0], thighTwist: 0, kneeTwist: 0 });
export default floorDrill({
  id: 't-seated-straddle-lifts', name: '坐姿分腿双腿抬起', nameEn: 'Seated Straddle Lifts', T,
  hands: { left: [0.11, 0.29, [0.1, 1]], right: [-0.11, 0.29, [-0.1, 1]] },
  fn: t => {
    const r = rep(t);
    return { pitch: 12, waist: 25, py: 0.134, pw: 8, shift: 0.044, elbow: 177.5, legs: { left: leg(r), right: leg(r) } };
  },
  solve: { vars: ['pz'], reg: { pz: 0.01 }, iters: 80 },
  tags: { lift: rep },
  highlight: { groups: ['abs'], panels: ['quadRect'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [0.10, 0.16, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.10, k: 1.0, drift: 2, driftPeriod: 8, at: 0.9 },
  keyFrames: [0.0, 0.5, 0.9],
  qa: qaStd({
    straightArms: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    more: { pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.lift<0.001' }, { c: 'footL', when: 'params.lift<0.001' }] },
  }),
});
