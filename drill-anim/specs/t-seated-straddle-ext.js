import { floorDrill, curve, qaStd, dirW, norm, TH, SH } from './_thomas.mjs';
// R10: palms stay in the middle in FRONT of the pelvis; chest faces forward, feet remain airborne.
// Head up (+Y), body faces +Z, body left = +X. Fold and extend with the knees still opening to the sides,
// rather than moving the hands behind the body and reclining into a narrow seated tuck.
// These model coordinates match the reference's visible relationships; the single view is not a 3D measurement.
const T = 8, ext = t => curve([[0, 0], [0.1, 0], [0.5, 1], [0.6, 1], [1.0, 0]], 1)(((t % 2) / 2));
const leg = (sg, e) => {
  // Set the thigh/knee direction first so extending the feet cannot pull the knees inward.
  // At the folded end the feet are about [sg*0.20,0.045,0.50] from the hip, with the knees higher and farther out.
  const thigh = dirW(sg, 16 - 7 * e, 69), end = dirW(sg, 9, 69), start = norm([-sg * 0.26, -0.24, 0.94]);
  // Keep a small (~2.5 degree) knee bend at extension, rather than locking the two-bone solver at its singular full reach.
  end[1] -= 0.045;
  const shinEnd = norm(end), shin = norm(start.map((v, i) => v + (shinEnd[i] - v) * e));
  const rel = thigh.map((v, i) => TH * v + SH * shin[i]);
  return { rel, pf: 0, kneeUp: thigh, thighTwist: 0, kneeTwist: 0 };
};
export default floorDrill({
  id: 't-seated-straddle-ext', name: '坐姿分腿屈伸', nameEn: 'Seated Straddle Extension', T,
  hands: { left: [0.11, 0.32, [0.1, 1]], right: [-0.11, 0.32, [-0.1, 1]] },
  fn: t => {
    const e = ext(t);
    return { pitch: 0, waist: 38, py: 0.134, pw: 8, shift: 0.06, elbow: 177.5, legs: { left: leg(1, e), right: leg(-1, e) } };
  },
  solve: { vars: ['pz'], reg: { pz: 0.01 }, iters: 80 },
  tags: { ext },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'ext', pulseBase: 0.3 },
  camera: { dir: [0.10, 0.20, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.14, k: 1.0, drift: 2, driftPeriod: 8, at: 1.1 },
  keyFrames: [0.1, 0.6, 1.1],
  qa: qaStd({
    straightArms: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    straightLegs: [{ j: 'knee.right', min: 176, when: 'params.ext>0.999' }, { j: 'knee.left', min: 176, when: 'params.ext>0.999' }],
  }),
});
