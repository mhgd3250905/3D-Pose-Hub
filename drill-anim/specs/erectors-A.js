// erectors-A 反向平板（后撑抬髋） reverse plank. Supine, hands flat under the shoulders with fingers toward the feet,
// arms locked straight, heels on the floor with straight legs. 'lift' 0 = hips sagging ~13 cm below the line, 1 = one straight
// line from shoulders to heels (squeeze + hold). 2 reps / 8 s: 1.2 s up, 2.0 s hold, 1.2 s down, short rest at the bottom.
// Head points -X, front (chest) faces up (+Y), body left = -Z.
const TH = -20;
const HZ = 0.205, FX = 1.30, FZ = 0.10;
const floorHand = (z, side) => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [side === 'right' ? -0.30 : 0.30, 1.05, -0.35] });
export default {
  id: 'erectors-A', name: '反向平板（后撑抬髋）', nameEn: 'Reverse Plank',
  timeline: { duration: 8, tracks: { lift: [[0, 0], [0.4, 0], [1.6, 1], [3.6, 1], [4.8, 0], [5.2, 0], [6.4, 1], [7.6, 1]] } },
  pose: {
    base: {
      pelvis: [0.45, 0.30, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], TH]] },
      hands: { right: floorHand(HZ, 'right'), left: floorHand(-HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: -62 }, left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: -62 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.0 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.0 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.25, weight: 0.4 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 0.2, h0: 0.01 } },
    },
    deltas: { lift: { constraints: [{}, {}, {}, {}, { weight: 0.1 }, { weight: 0.1 }, { weight: 0 }] } },
  },
  highlight: { groups: ['erectors'], side: 'both', pulseAt: [2.6, 6.6], pulseWidth: 0.9, pulseBase: 0.25 },
  camera: { dir: [-0.62, -0.03, 1], driftPeriod: 4, driftPhase: 0.628, fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder', 'leftAnkle'], pad: 0.12, k: 0.7, drift: 22, at: 2.6 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 2.6,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 12, a: 0.7 }, { j: 'rightAnkle', rx: 36, ry: 10, a: 0.6 }, { j: 'leftAnkle', rx: 36, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightAnkle', mid: 'pelvis', rx: 70, ry: 14, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.6, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.0, 2.6],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: [],
  },
};
