import { floorDrill, curve, qaStd } from './_thomas.mjs';
// R18: seated wide straddle; both palms straddle the working thigh and the chest turns toward it.
// Head up (+Y), body faces +Z, body left = +X. These are model angles chosen to reproduce the visible shape,
// not measurements of the demonstrator's 3D hip or waist angles from the single camera.
const T = 10, wrap = t => ((t % T) + T) % T;
// Raise the hands first, turn with both palms clear, then replant before the next lift.
const turn = curve([[0, 1], [3.8, 1], [4.4, -1], [8.8, -1], [9.4, 1]], T);
const handLift = curve([[0, 0], [3.2, 0], [3.8, 1], [4.4, 1], [5, 0], [8.2, 0], [8.8, 1], [9.4, 1]], T);
const rep = curve([[0, 0], [0.15, 0], [0.45, 1], [0.75, 1], [1.25, 0]], 1.6);
// Two lifts per side. The legs settle before the hands and chest change sides.
const leftSet = t => wrap(t) < 3.2 ? 1 : 0;
const rightSet = t => wrap(t) >= 5 && wrap(t) < 8.2 ? 1 : 0;
const liftL = t => leftSet(t) ? rep(wrap(t)) : 0;
const liftR = t => rightSet(t) ? rep(wrap(t) - 5) : 0;
const leg = r => ({ elev: -1.2 + 7 * r, spread: 66, pf: 0, knee: 178, kneeUp: [0, 1, 0], thighTwist: 0, kneeTwist: 0 });
const hand = (sg, at) => ({
  plant: { mode: 'floor', at, finger: [0.927, 0.375], pole: [sg * 0.7, 0.4, 0.40] },
  free: { mode: 'free', frame: 'world', wrist: [at[0], 0.03102, at[1]], finger: [0.927, 0, 0.375], normal: [0, -1, 0], pole: [sg * 0.7, 0.4, 0.40] },
  w: 0, keepReach: 0, blendPole: true, relax: 0,
});
export default floorDrill({
  id: 't-seated-straddle-lift-1leg', name: '坐姿分腿单腿抬起', nameEn: 'Seated Straddle Lifts (1 Leg)', T,
  hands: { left: [0.324, -0.064, [0.927, 0.375]], right: [0.211, 0.214, [0.927, 0.375]] },
  handsDesc: { left: hand(1, [0.324, -0.064]), right: hand(-1, [0.211, 0.214]) },
  fn: t => {
    const q = turn(t), l = liftL(t), r = liftR(t), yaw = 8 * q;
    // At each end, the hands sit on opposite sides of the lifted thigh. Their stable end positions
    // are separate support phases; the connecting hand change is not a pinned contact.
    // Use the working leg's WORLD direction, rather than the chest heading, to find its two sides.
    // The 8-degree pelvis turn keeps the leg's true abduction below the existing 75-degree QA limit.
    const a = 68 * q * Math.PI / 180, dx = 0.15 * Math.cos(a), dz = 0.15 * Math.sin(a);
    // Snow's shorter arms need a more proximal wrist placement; fingers extend along the thigh from here.
    // This fits the support without translating the seated pelvis twenty centimetres to either side.
    const legA = 68 * Math.PI / 180, x = q * (0.082 + 0.20 * Math.sin(legA));
    const z = 0.20 * Math.cos(legA);
    return {
      pitch: 25, yaw, waist: 22, waistYaw: 35 * q, py: 0.134, px: 0.053 * q, rootZ: 0.045685, pw: 8, shift: 0.045, elbow: 177.5,
      hands: { left: [x + dx, z - dz], right: [x - dx, z + dz] },
      legs: { left: leg(l), right: leg(r) },
    };
  },
  extra: (t, s) => {
    const a = 68 * turn(t) * Math.PI / 180;
    const o = {}, h = handLift(t), late = Math.max(0, Math.min(1, (h - 0.55) / 0.45));
    // Vertical clearance comes before any forward travel. The old diagonal
    // ground-to-front chord crossed the working thigh during lift/landing.
    const forward = 0.25 * late * late * (3 - 2 * late), clear = 0.09 * Math.sin(Math.PI * h);
    for (const side of ['left', 'right']) {
      o[`hands.${side}.w`] = h > 0.000001 ? 1 : 0;
      o[`hands.${side}.plant.finger.0`] = Math.sin(a);
      o[`hands.${side}.plant.finger.1`] = Math.cos(a);
      const sg = side === 'left' ? 1 : -1;
      o[`hands.${side}.free.wrist.0`] = s.hands[side][0] + sg * clear * Math.cos(a);
      o[`hands.${side}.free.wrist.1`] = 0.03102 + 0.23 * h;
      o[`hands.${side}.free.wrist.2`] = s.hands[side][1] + forward - sg * clear * Math.sin(a);
      o[`hands.${side}.free.finger.0`] = Math.sin(a);
      o[`hands.${side}.free.finger.2`] = Math.cos(a);
    }
    return o;
  },
  solve: { vars: ['pz', 'px'], reg: { pz: 0.05, px: 3 }, iters: 60 },
  tags: { liftL, liftR, leftSet, rightSet, handLift },
  highlight: { groups: ['abs'], panels: ['quadRect'], side: 'both', pulseAt: [0.6, 2.2, 5.6, 7.2], pulseWidth: 0.3, pulseBase: 0.3 },
  camera: { dir: [0.15, 0.18, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.10, k: 1.0, drift: 2, driftPeriod: 10, at: 0.6 },
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
