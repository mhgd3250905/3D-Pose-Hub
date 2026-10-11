// lats-A 坐姿撑地抬臀 (floor support lift / seated dip shrug). Long sit, legs straight with the heels pinned, hands flat on the
// floor just behind/beside the hips, arms locked straight the whole time. The lift comes from shoulder DEPRESSION only
// (shoulders.shift along -Y of the chest frame = shoulders pulled down away from the ears): the hips rise off the mat, hold 2 s.
// Front (legs) points +X, up +Y, body left = -Z.
const HX = -0.11, HZ = 0.245, FX = 0.83, FZ = 0.10;
const floorHand = (z, side) => ({ mode: 'floor', at: [HX, z], finger: [1, Math.sign(z) * 0.12], poleUp: [side === 'right' ? -0.30 : 0.30, 1.1, -0.45] });
export default {
  id: 'lats-A', name: '坐姿撑地抬臀', nameEn: 'Floor Support Lift (Seated Dip Shrug)',
  timeline: { duration: 8, tracks: { lift: [[0, 0], [0.4, 0], [1.3, 1], [2.9, 1], [3.8, 0], [4.4, 0], [5.3, 1], [6.9, 1], [7.8, 0]] } },
  pose: {
    base: {
      pelvis: [0.0, 0.17, 0],
      hips: { up: [0, 1, 0], front: [1, 0, 0], rot: [[[0, 0, 1], 38]] },  // torso leaned back ~38°. The rig's straight arms are ~7 cm short of the floor in an upright long sit, so the start already has the scapulae depressed (shift -0.035) and the lift depresses them further
      shoulders: { shift: [0, -0.035, 0] },
      hands: { right: floorHand(HZ, 'right'), left: floorHand(-HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: -72 }, left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: -72 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 178, weight: 0.6 }, { type: 'reach', limb: 'leftLeg', angle: 178, weight: 0.6 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.163, weight: 0.3 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 0.2, h0: 3 } },
    },
    deltas: { lift: { shoulders: { shift: [0, -0.08, 0] }, constraints: [{}, {}, {}, {}, { value: 0.215 }] } },   // v2: -0.065/0.20 lifted the hips only 3 cm
  },
  highlight: { groups: ['lats'], side: 'both', pulseAt: [2.1, 6.1], pulseWidth: 0.8, pulseBase: 0.25 },
  camera: { dir: [-0.3, 0.07, -1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.2, k: 0.75, drift: 0.9, at: 2.1 },
  frame: { mode: 'fit', width: 780, cx: 512, cy: 560 },
  stillAt: 2.1,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis'],
    blobs: [{ j: 'rightPalm', rx: 45, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 45, ry: 12, a: 0.7 }, { j: 'rightAnkle', rx: 36, ry: 10, a: 0.6 }, { j: 'leftAnkle', rx: 36, ry: 10, a: 0.6 }, { j: 'pelvis', rx: 90, ry: 22, a: 0.55 }],
    bands: [{ from: 'pelvis', to: 'rightAnkle', mid: 'pelvis', rx: 50, ry: 12, a: 0.3, dy: 4, sag: 0.2 }] },
  props: [{ type: 'mat', at: [0.35, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 0.9, 2.1],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['forearmR|torso', 'forearmL|torso', 'upperArmR|torso', 'upperArmL|torso', 'handR|thighR', 'handL|thighL'],
  },
};
