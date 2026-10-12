import { floorDrill, qaStd } from './_thomas.mjs';

// Reference 0bce...gif: both knees stay straight in a nearly transverse split,
// with a small pelvis/foot clearance and palms close to the pelvis. At least
// one shoe is clearly unsupported; the compressed source does not establish
// whether the opposite heel lightly touches. Use a low suspended hold instead
// of the previous two planted heels and repeated hip presses. The source's
// camera cuts do not establish a continuous torso turn, so the palms stay planted.
const T = 8;
const breath = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 4);
const D = Math.PI / 180;
const handAt = (sg, yaw) => {
  const a = yaw * D;
  return [sg * 0.10 * Math.cos(a) + 0.082 * Math.sin(a),
    0.087 + 0.082 * Math.cos(a) - sg * 0.10 * Math.sin(a)];
};

export default floorDrill({
  id: 't-half-straddle', name: '半分腿支撑', nameEn: 'Half Straddle Support', T,
  hands: { left: [0.10, 0.169, [0.25, 1]], right: [-0.10, 0.169, [-0.25, 1]] },
  solve: { vars: ['px', 'py', 'pz'], reg: { px: 0.3, py: 0.3, pz: 0.05 }, iters: 80 },
  fn: t => {
    const b = breath(t), yaw = 0, elev = 0.8 + 0.35 * b;
    return { pitch: 24, waist: -15, waistYaw: yaw,
      py: 0.17 + 0.002 * b, pw: 0.01, pz: 0, pzw: 0.15, shift: 0.09,
      elbow: 178, hands: { left: handAt(1, yaw), right: handAt(-1, yaw) },
      legs: {
        left: { elev, spread: 72, pf: 6, knee: 178, kneeUp: [0, 1, 0] },
        right: { elev, spread: 72, pf: 6, knee: 178, kneeUp: [0, 1, 0] },
      } };
  },
  tags: { up: () => 1 },
  highlight: { groups: ['triceps'], side: 'both', pulseAt: [2, 6], pulseWidth: 1.2, pulseBase: 0.3 },
  camera: { dir: [0.20, 0.18, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 3, at: 5.5 },
  keyFrames: [0.3, 2, 5.5],
  qa: qaStd({
    straightArms: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
  }),
});
