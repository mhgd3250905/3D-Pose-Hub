import { scripted, leg, legFields, dirW, curve } from './_thomas.mjs';
// t-straddle-hold 分腿支撑 (straddle L-sit hold on the floor, Thomas flare prep). Head up (+Y), body faces +Z, body left = +X.
// Seated in a wide straddle with both hands flat on the floor between the thighs; press the floor away (arms locked,
// shoulders pushed down), lean forward and lift hips and both straight legs off the floor; hold; sit back down. Loop 8 s.
const T = 8;
const up = curve([[0, 0], [0.7, 0], [1.7, 1], [6.5, 1], [7.5, 0]], T);           // 0 = seated, 1 = straddle support
const breath = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 2.4);
const HX = 0.075, HZ = 0.21;
const floorHand = sg => ({ mode: 'floor', at: [sg * HX, HZ], finger: [sg * 0.25, 1], poleUp: [sg * 0.3, 1.0, -0.8] });
const fn = t => {
  const u = up(t), b = breath(t) * u;
  const pitch = 8 + 16 * u;                                  // forward lean of the pelvis
  const elev = -1.2 + 10 * u + 1.2 * b, spread = 41 + 7 * u;            // legs: on the floor -> just above horizontal
  const pf = 8 + 35 * u;
  return {
    'hips.rot.0.1': pitch,
    'constraints.2.value': 0.134 + 0.075 * u,                // pelvis height target
    'constraints.2.weight': 3 - 2.2 * u,
    'shoulders.shift.1': -0.045 * u,
    ...legFields('left', leg('left', dirW(1, elev, spread), pitch, pf)),
    ...legFields('right', leg('right', dirW(-1, elev, spread), pitch, pf)),
  };
};
const base = {
  pelvis: [0, 0.134, 0],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  shoulders: { shift: [0, 0, 0] },
  hands: { right: floorHand(-1), left: floorHand(1) },
  feet: { left: { mode: 'free', frame: 'hips' }, right: { mode: 'free', frame: 'hips' } },
  constraints: [
    { type: 'reach', limb: 'rightArm', angle: 177.5 }, { type: 'reach', limb: 'leftArm', angle: 177.5 },
    { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.134, weight: 3 },
  ],
  solve: { vars: ['py', 'pz', 'c0'], reg: { py: 0.3, pz: 0.05, c0: 0.05 }, iters: 60 },
};
const S = scripted(base, fn, T);
export default {
  id: 't-straddle-hold', name: '分腿支撑', nameEn: 'Straddle Support Hold',
  timeline: { duration: T, tracks: S.tracks },
  pose: { base, deltas: S.deltas },
  highlight: { groups: ['hip-flexors', 'abs'], panels: ['quadRect'], side: 'both', pulseAt: [2.5, 5.0], pulseWidth: 1.2, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 4, at: 3.5 },
  frame: { mode: 'fit', width: 900, height: 700, cx: 512, cy: 540 },
  stillAt: 3.5,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis'],
    blobs: [{ j: 'rightPalm', rx: 40, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 12, a: 0.7 }, { j: 'pelvis', rx: 80, ry: 20, a: 0.5 },
      { j: 'rightAnkle', rx: 36, ry: 10, a: 0.5, fade: [0.08, 0.25] }, { j: 'leftAnkle', rx: 36, ry: 10, a: 0.5, fade: [0.08, 0.25] }], bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.25], size: [1.83, 1.1, 0.006] }],
  keyFrames: [0.3, 1.2, 3.5],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['forearmR|thighR', 'forearmL|thighL', 'handR|thighR', 'handL|thighL', 'upperarmR|thighR', 'upperarmL|thighL'],
  },
};
