import { floorDrill, curve, qaStd, rotX, rotY, norm, dot, cross, dirW } from './_thomas.mjs';
// v3 (2026-10-30, user review #19): for the training-human-v3-armfix body. Straight arms with straight
// fingers on the floor, legs straddled and straight, the working leg lifts straight from the hip (12 deg).
// The old source used v2 thigh/shin lengths and a 6.4 cm higher shoulder, which bent knees ~45 deg and elbows ~52 deg on v3.
// R18: seated wide straddle; straight fingers touch the floor on either side of the working thigh.
// Head up (+Y), body faces +Z, body left = +X. These are model angles chosen to reproduce the visible shape,
// not measurements of the demonstrator's 3D hip or waist angles from the single camera.
const T = 10, wrap = t => ((t % T) + T) % T;
// Raise the hands first, turn with both palms clear, then replant before the next lift.
const turn = curve([[0, 1], [3.5, 1], [4.7, -1], [8.5, -1], [9.7, 1]], T);
const handLift = curve([[0, 0], [3.2, 0], [3.5, 1], [4.7, 1], [5, 0], [8.2, 0], [8.5, 1], [9.7, 1]], T);
const rep = curve([[0, 0], [0.15, 0], [0.45, 1], [0.75, 1], [1.25, 0]], 1.6);
// Two lifts per side. The legs settle before the hands and chest change sides.
const leftSet = t => wrap(t) < 3.2 ? 1 : 0;
const rightSet = t => wrap(t) >= 5 && wrap(t) < 8.2 ? 1 : 0;
const liftL = t => leftSet(t) ? rep(wrap(t)) : 0;
const liftR = t => rightSet(t) ? rep(wrap(t) - 5) : 0;
// v3 leg: measured thigh 0.410 + shin 0.417 m; ask for a hip->ankle chord at full length so the knee stays straight.
const LEG_V3 = 0.84, REST_ELEV = -1.2, LIFT_DEG = 12;   // rest elev as the original source: heels on the floor
const leg = (r, sg) => { const e = REST_ELEV + LIFT_DEG * r; return { elev: e, spread: 66, pf: 0, knee: 178, kneeUp: [0, 1, 0], thighTwist: 0, kneeTwist: 0,
  rel: dirW(sg, e, 66).map(x => x * LEG_V3) }; };
// Original Snow rest landmarks, bone lengths and native fingertip, measured without
// changing the mesh. The hand follows the FOREARM, rather than staying vertical
// while the forearm leans forward. Wrist height and horizontal reach are coupled.
const armLengths = { left: [0.256780513668, 0.228046537247], right: [0.256780546115, 0.228046355327] };
// Lowest native fingertip in its hand frame (long axis, palm normal, cross axis).
// It remains the extreme point over this drill's full -68..+68-degree hand turn.
const tip = { left: [0.222652190982, 0.000841853935, 0.002467969823], right: [0.222653010539, 0.000841904626, -0.002468118457] };
// Use the author's native shoulder-to-neck shape. A seated finger support does
// not require the 30 mm scapular depression added during our reference repair.
const shoulderDepression = 0;
// v3 body: the drawn shoulder sits 6.4 cm lower and 0.5 cm further back than the v2 landmark used to aim the arm.
const SHOULDER_V3 = [0, -0.0639, -0.0054];
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]);
const scaled = (a, k) => a.map(x => x * k);
const forearm = (side, s, w) => {
  const [a, b] = armLengths[side], sg = side === 'left' ? 1 : -1;
  const u = norm(sub(w, s)), d = Math.min(Math.hypot(...sub(w, s)), a + b - 1e-7);
  const ap = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - ap * ap));
  const p = sub([sg * 0.7, 0.4, -0.40], s), n = norm(sub(p, scaled(u, dot(p, u))));
  return norm(sub(w, add(s, add(scaled(u, ap), scaled(n, h)))));
};
const supportPose = q => {
  const yaw = 8 * q, a = 68 * q * Math.PI / 180;
  const upper = v => rotY(rotX(rotY(rotX(v, 5), yaw), 4), 35 * q);
  const waist = rotY(rotX([0, 0.14120757, -0.00431367], 5), yaw);
  return Object.fromEntries(['left', 'right'].map(side => {
    const sg = side === 'left' ? 1 : -1;
    const s = upper([sg * 0.1879072, 0.32948433 - shoulderDepression, -0.01006523]).map((v, i) => v + waist[i] + (i === 1 ? 0.134 : 0) + SHOULDER_V3[i]);
    const [ua, fa] = armLengths[side], reach = Math.sqrt(ua * ua + fa * fa - 2 * ua * fa * Math.cos(177.5 * Math.PI / 180));
    const normal = [-Math.sin(a), 0, -Math.cos(a)], lateral = 0.055;
    const candidate = y => {
      const dy = s[1] - y, forward = Math.sqrt(Math.max(0, reach * reach - dy * dy - lateral * lateral));
      const wrist = [s[0] + forward * Math.sin(a) + sg * lateral * Math.cos(a), y, s[2] + forward * Math.cos(a) - sg * lateral * Math.sin(a)];
      const finger = forearm(side, s, wrist), pn = norm(sub(normal, scaled(finger, dot(normal, finger))));
      const tx = cross(finger, pn), tp = tip[side];
      return { wrist, finger, error: y + tp[0] * finger[1] + tp[1] * pn[1] + tp[2] * tx[1] - 0.001 };
    };
    let lo = 0.10, hi = 0.26;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (candidate(mid).error < 0) lo = mid; else hi = mid; }
    const { wrist, finger } = candidate((lo + hi) / 2);
    return [side, { shoulder: s, wrist, finger, at: [wrist[0], wrist[2]] }];
  }));
};
const hand = (sg, at) => ({
  plant: { mode: 'fingertips', at, finger: [0, -1, 0], normal: [-0.927, 0, -0.375], pole: [sg * 0.7, 0.4, -0.40] },
  free: { mode: 'free', frame: 'world', relativeToPlant: true, wrist: [0, 0, 0], finger: [0, -1, 0], normal: [-0.927, 0, -0.375], pole: [sg * 0.7, 0.4, -0.40] },
  w: 0, keepReach: 0, blendPole: true, relax: 0,
});
const spec = floorDrill({
  id: 't-seated-straddle-lift-1leg-v3', name: '坐姿分腿单腿抬起', nameEn: 'Seated Straddle Lifts (1 Leg)', T,
  hands: { left: [0.324, -0.064, [0.927, 0.375]], right: [0.211, 0.214, [0.927, 0.375]] },
  handsDesc: { left: hand(1, [0.324, -0.064]), right: hand(-1, [0.211, 0.214]) },
  fn: t => {
    const q = turn(t), l = liftL(t), r = liftR(t), yaw = 8 * q;
    // At each end, the hands sit on opposite sides of the lifted thigh. Their stable end positions
    // are separate support phases; the connecting hand change is not a pinned contact.
    // Use the working leg's WORLD direction, rather than the chest heading, to find its two sides.
    // The 8-degree pelvis turn keeps the leg's true abduction below the existing 75-degree QA limit.
    return {
      pitch: 5, yaw, waist: 4, waistYaw: 35 * q, py: 0.134, px: 0, rootZ: 0, pw: 8, shift: shoulderDepression, elbow: 177.5,
      hands: Object.fromEntries(Object.entries(supportPose(q)).map(([side, h]) => [side, h.at])),
      legs: { left: leg(l, 1), right: leg(r, -1) },
    };
  },
  extra: (t, s) => {
    const q = turn(t), a = 68 * q * Math.PI / 180, pose = supportPose(q);
    const o = {}, h = handLift(t), late = Math.max(0, Math.min(1, (h - 0.55) / 0.45));
    // Vertical clearance comes before any forward travel. The old diagonal
    // ground-to-front chord crossed the working thigh during lift/landing.
    const forward = 0.04 * late * late * (3 - 2 * late), clear = 0.09 * Math.sin(Math.PI * h);
    for (const side of ['left', 'right']) {
      o[`hands.${side}.w`] = h > 0.000001 ? 1 : 0;
      o[`hands.${side}.plant.normal.0`] = -Math.sin(a);
      o[`hands.${side}.plant.normal.2`] = -Math.cos(a);
      const sg = side === 'left' ? 1 : -1;
      const offset = [sg * clear * Math.cos(a), 0.23 * h, forward - sg * clear * Math.sin(a)];
      const liftedFinger = forearm(side, pose[side].shoulder, add(pose[side].wrist, offset));
      for (let i = 0; i < 3; i++) {
        o[`hands.${side}.plant.finger.${i}`] = pose[side].finger[i];
        o[`hands.${side}.free.finger.${i}`] = liftedFinger[i];
        o[`hands.${side}.free.wrist.${i}`] = offset[i];
      }
      o[`hands.${side}.free.normal.0`] = -Math.sin(a);
      o[`hands.${side}.free.normal.2`] = -Math.cos(a);
    }
    return o;
  },
  solve: { vars: [], reg: {}, iters: 1 },
  tags: { liftL, liftR, leftSet, rightSet, handLift },
  // Restore the PR106 preview's muscle selection; pulses follow the retained new lifts.
  highlight: { groups: ['hip-flexors'], panels: ['quadRect'], side: 'both', pulseAt: [0.6, 2.2, 5.6, 7.2], pulseWidth: 0.3, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.13, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.08, k: 1.0, drift: 2, driftPeriod: T, at: 0.9, fitTimeline: false },
  keyFrames: [0.0, 0.6, 4.1, 5.6],
  qa: qaStd({
    straightArms: [
      { j: 'elbow.right', min: 176, when: 'params.leftSet>0.999' }, { j: 'elbow.left', min: 176, when: 'params.leftSet>0.999' },
      { j: 'elbow.right', min: 176, when: 'params.rightSet>0.999' }, { j: 'elbow.left', min: 176, when: 'params.rightSet>0.999' },
    ],
    more: { pins: [
      { c: 'handR', when: 'params.leftSet>0.999' }, { c: 'handL', when: 'params.leftSet>0.999' },
      { c: 'handR', when: 'params.rightSet>0.999' }, { c: 'handL', when: 'params.rightSet>0.999' },
      { c: 'footR', when: 'params.leftSet>0.999' }, { c: 'footL', when: 'params.rightSet>0.999' },
    ] },
  }),
});
export default { ...spec, alignClavicles: false, modelProfile: 'training-human-v2plus' };
