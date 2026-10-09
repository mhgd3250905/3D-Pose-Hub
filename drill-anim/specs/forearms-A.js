// forearms-A 跪姿多方向腕部摇摆 (quadruped wrist rocks), fingers-forward variation. Hands flat under the shoulders (pinned),
// arms locked straight, knees pinned on the mat under the hips (two-bone knee target), toes tucked. 'rock' moves the shoulders
// forward over the wrists (+1 = ~8 cm, more wrist extension) and back (-0.6); 2 slow rocks / 8 s.
// Head points +X, body faces the floor (-Y), body left = -Z (same frame as rotator-cuff-A).
const HZ = 0.19, KX = -0.47, KZ = 0.10, FX = -0.90;
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
const ROCK = 0.08;
export default {
  id: 'forearms-A', name: '跪姿多方向腕部摇摆', nameEn: 'Quadruped Wrist Rocks',
  timeline: { duration: 8, tracks: { rock: [[0, 0], [1.1, 1], [1.6, 1], [2.9, -0.6], [3.3, -0.6], [4.0, 0], [5.1, 1], [5.6, 1], [6.9, -0.6], [7.3, -0.6]] } },
  pose: {
    base: {
      pelvis: [-0.45, 0.43, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 14]] },
      hands: { right: floorHand(HZ), left: floorHand(-HZ) },
      feet: {
        right: { mode: 'floor', at: [FX, KZ], heading: 90, pitch: 62, poleLow: [-0.09, 0.5, 0.6] },
        left: { mode: 'floor', at: [FX, -KZ], heading: 90, pitch: 62, poleLow: [0.09, 0.5, 0.6] },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'mid', limb: 'rightLeg', at: [KX, 0.055, KZ], weight: 1 }, { type: 'mid', limb: 'leftLeg', at: [KX, 0.055, -KZ], weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0'], reg: { px: 0.3, py: 0.3, pz: 1, h0: 0.01 } },
    },
    deltas: { rock: { constraints: [{}, {}, {}, {}, { value: ROCK }] } },
  },
  highlight: { groups: ['forearms'], side: 'both', pulseAt: [1.35, 5.35], pulseWidth: 0.6, pulseBase: 0.3 },
  camera: { dir: [0.35, 0.32, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder'], pad: 0.12, k: 0.75, drift: 0.9 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'rightKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'rightKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.40, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0, 1.3, 3.1],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'rightKnee' }, { j: 'leftKnee' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }],
    allowContact: ['thighR|shinR', 'thighL|shinL'],
  },
};
