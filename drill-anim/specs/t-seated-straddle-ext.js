import { floorDrill, curve, qaStd, dirW, norm, cross, dot, TH, SH } from './_thomas.mjs';
// R10: palms stay in the middle in FRONT of the pelvis; chest faces forward, feet remain airborne.
// Head up (+Y), body faces +Z, body left = +X. Fold and extend with the knees still opening to the sides,
// rather than moving the hands behind the body and reclining into a narrow seated tuck.
// These model coordinates match the reference's visible relationships; the single view is not a 3D measurement.
const T = 8, ext = t => curve([[0, 0], [0.1, 0], [0.5, 1], [0.6, 1], [1.0, 0]], 1)(((t % 2) / 2));
// Keep the original shoulder/arm roll. Only the leg bones follow the authored
// knee plane: a wide folded leg otherwise bends across the skin's hinge axis.
// Rest segment vectors are from public/coach/coach-rig.json; no mesh/scale edits.
const legRoll = (from, to, restNormal, wantedNormal) => {
  const a = norm(from), b = norm(to), cr = cross(a, b), sn = Math.hypot(...cr), ax = sn > 1e-8 ? cr.map(v => v / sn) : [1, 0, 0];
  const cs = dot(a, b), n = norm(restNormal), rotCross = cross(ax, n), along = dot(ax, n);
  const carried = n.map((v, i) => v * cs + rotCross[i] * sn + ax[i] * along * (1 - cs));
  return Math.atan2(dot(b, cross(carried, wantedNormal)), dot(carried, wantedNormal)) * 180 / Math.PI;
};
const leg = (sg, e) => {
  // Set the thigh/knee direction first so extending the feet cannot pull the knees inward.
  // At the folded end the feet are about [sg*0.20,0.045,0.50] from the hip, with the knees higher and farther out.
  const thigh = dirW(sg, 16 - 7 * e, 69), end = dirW(sg, 9, 69), start = norm([-sg * 0.26, -0.24, 0.94]);
  // Keep a small (~2.5 degree) knee bend at extension, rather than locking the two-bone solver at its singular full reach.
  end[1] -= 0.045;
  const shinEnd = norm(end), shin = norm(start.map((v, i) => v + (shinEnd[i] - v) * e));
  const rel = thigh.map((v, i) => TH * v + SH * shin[i]);
  const restThigh = [sg * 0.0003627, -0.3529181, 0.0010463], restShin = [sg * 0.000858, -0.4090259, -0.0252573];
  const restNormal = cross(restThigh, restShin), wantedNormal = norm(cross(thigh, shin));
  return { rel, pf: 0, kneeUp: thigh,
    thighTwist: legRoll(restThigh, thigh, restNormal, wantedNormal),
    kneeTwist: legRoll(restShin, shin, restNormal, wantedNormal) };
};
export default floorDrill({
  id: 't-seated-straddle-ext', name: '坐姿分腿屈伸', nameEn: 'Seated Straddle Extension', T,
  hands: { left: [0.15, 0.32, [0.1, 1]], right: [-0.15, 0.32, [-0.1, 1]] },
  fn: t => {
    const e = ext(t);
    // Support and chest stay fixed while the legs move; fix root depth to avoid
    // warm-start drift along the almost degenerate arm-reach arc.
    return { pitch: 0, waist: 44.3, py: 0.134, pw: 0.01, rootZ: 0.10266, shift: 0, elbow: 177.5, legs: { left: leg(1, e), right: leg(-1, e) } };
  },
  solve: { vars: ['py'], reg: { py: 0.3 }, iters: 80 },
  extra: () => ({ 'constraints.0.weight': 20, 'constraints.1.weight': 20 }),
  tags: { ext },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'ext', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.25, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 2, driftPeriod: 8, at: 1.1, fitTimeline: false },
  keyFrames: [0.1, 0.6, 1.1],
  qa: qaStd({
    straightArms: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    straightLegs: [{ j: 'knee.right', min: 176, when: 'params.ext>0.999' }, { j: 'knee.left', min: 176, when: 'params.ext>0.999' }],
  }),
});
