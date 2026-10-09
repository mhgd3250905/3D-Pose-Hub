// triceps-A 窄距俯卧撑（锁肘停顿） close-grip push-up, elbows tucked back along the ribs, 1 s lockout pause.
// Head points -X, body faces the floor, body left = +Z. Rigid body pivots about the tucked toes; elbow angle is driven by 'down'.
const TH = -17;
const HZ = 0.135, FX = 1.21, FZ = 0.10;
const rep = s => [[s + 0.7, 0], [s + 2.0, 1], [s + 2.2, 1], [s + 3.15, 0]];  // 0.7 s lockout pause, 1.3 s down, 0.2 s bottom, 0.95 s press
// right side of the body = rest -x; the elbow pole sits behind/outside the elbow so the elbows travel back along the ribs
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * -0.12], poleUp: [side === 'right' ? -0.21 : 0.21, 0.90, 0.02] });
export default {
  id: 'triceps-A', name: '窄距俯卧撑（锁肘停顿）', nameEn: 'Close-Grip Push-Up with Lockout',
  timeline: { duration: 7.2, tracks: { down: [[0, 0], ...rep(0), ...rep(3.6)] } },
  pose: {
    base: {
      pelvis: [0.42, 0.40, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], TH]] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 64 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 64 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.08 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.08 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.08 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { down: { constraints: [{ angle: 72 }, { angle: 72 }, {}, {}, {}, {}, { value: -0.06 }] } },
  },
  highlight: { groups: ['triceps'], side: 'both', pulseAt: [3.1, 6.7], pulseWidth: 0.55, pulseBase: 0.25 },
  camera: { dir: [-1, 0.33, 0.8], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 0.6, drift: 0.9 },
  frame: { mode: 'fit', width: 800, cx: 512, cy: 520 },
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0, 2.1, 3.15],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172, when: 'params.down<0.001' }, { j: 'elbow.left', min: 172, when: 'params.down<0.001' }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmR|torso', 'forearmL|torso'],
  },
};
