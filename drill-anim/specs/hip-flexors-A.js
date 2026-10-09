// hip-flexors-A 坐姿直腿抬腿（压缩）(seated pike leg lifts, compression). Long sit, legs straight and together, hands flat on the
// floor beside the hips, arms locked straight; both straight legs lift off the mat (heels ~9 cm up), hold, lower.
// The torso leans back ~34° like lats-A (the rig's straight arms are short of the floor in an upright long sit).
// Front (legs) points +X, up +Y, body left = -Z.
const HX = -0.09, HZ = 0.235, FX = 0.83, FZ = 0.07, LIFT = 0.09;
const floorHand = (z, side) => ({ mode: 'floor', at: [HX, z], finger: [1, Math.sign(z) * 0.12], poleUp: [side === 'right' ? -0.30 : 0.30, 1.1, -0.45] });
export default {
  id: 'hip-flexors-A', name: '坐姿直腿抬腿（压缩）', nameEn: 'Seated Pike Leg Lifts',
  timeline: { duration: 8, tracks: { lift: [[0, 0], [0.4, 0], [1.2, 1], [2.6, 1], [3.4, 0], [4.4, 0], [5.2, 1], [6.6, 1], [7.4, 0]] } },
  pose: {
    base: {
      pelvis: [0.0, 0.165, 0],
      hips: { up: [0, 1, 0], front: [1, 0, 0], rot: [[[0, 0, 1], 34]] },
      shoulders: { shift: [0, -0.04, 0] },
      hands: { right: floorHand(HZ, 'right'), left: floorHand(-HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: -60, lift: 0 }, left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: -60, lift: 0 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 178.5, weight: 2 }, { type: 'reach', limb: 'leftLeg', angle: 178.5, weight: 2 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.163, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 0.2, h0: 3 } },
    },
    deltas: { lift: { feet: { right: { lift: LIFT }, left: { lift: LIFT } } } },
  },
  highlight: { groups: ['hip-flexors'], side: 'both', pulseAt: [1.9, 5.9], pulseWidth: 0.8, pulseBase: 0.25 },
  camera: { dir: [0.25, 0.3, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee'], pad: 0.14, k: 0.75, drift: 0.9, at: 1.9 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 560 },
  stillAt: 1.9,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis'],
    blobs: [{ j: 'rightPalm', rx: 45, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 45, ry: 12, a: 0.7 }, { j: 'pelvis', rx: 90, ry: 22, a: 0.55 }],
    bands: [{ from: 'pelvis', to: 'rightAnkle', mid: 'pelvis', rx: 50, ry: 12, a: 0.25, dy: 4, sag: 0.2 }] },
  props: [{ type: 'mat', at: [0.35, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 0.8, 1.9],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.lift<0.001' }, { c: 'footL', when: 'params.lift<0.001' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['forearmR|torso', 'forearmL|torso', 'upperArmR|torso', 'upperArmL|torso', 'handR|thighR', 'handL|thighL', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
