// o-stand-quad 扶椅站姿股四头肌拉伸 (standing quad stretch, hand on the chair) · S2 办公室久坐拉伸系列.
// Standing tall on the LEFT leg, left hand on the backrest of an office chair beside the body; the RIGHT knee bends fully and the
// right hand holds the right ankle behind. 'open' 0 = heel near the buttock, knees side by side; 1 = heel drawn in a little more
// and the pelvis tucks (stretch along the front of the right thigh). One slow rep / 8 s. Head +Y, front +Z, body left = +X.
export default {
  id: 'o-stand-quad', name: '扶椅站姿股四头肌拉伸', nameEn: 'Chair-Supported Standing Quad Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.90, 0.01],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', palmAt: [0.30, 1.065, 0.06], wrist: [0.29, 1.08, -0.01], finger: [0.25, -0.2, 1], normal: [0, -1, 0], pole: [0.6, 1.1, -0.4] },
        right: { mode: 'free', frame: 'world', wrist: [-0.21, 0.91, -0.09], finger: [0.3, 0.1, -1], normal: [1, 0, 0], pole: [-0.4, 1.0, -0.6] },
      },
      feet: {
        left: { mode: 'floor', at: [0.085, 0.0], heading: 4, pitch: 0 },
        right: { mode: 'free', frame: 'world', ankle: [-0.085, 0.90, -0.20], rot: [[[1, 0, 0], -140]], pole: [-0.085, 0.0, 0.4] },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 179, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { open: { hips: { rot: [[[1, 0, 0], -6]] },
      feet: { right: { ankle: [-0.085, 0.94, -0.17] } }, hands: { right: { wrist: [-0.21, 0.95, -0.06] } } } },
  },
  highlight: { groups: ['quadriceps'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-1, 0.15, 0.3], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftWrist'], pad: 0.18, k: 1.1, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 520, height: 720, cx: 512, cy: 520 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'leftAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }], bands: [] },
  props: [{ type: 'officeChair', at: [0.60, 0, 0.05], yaw: 90, seatY: 0.46 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: { pins: [{ c: 'footL', when: 'always' }], straight: [{ j: 'knee.left', min: 174 }], allowContact: ['handR|footR', 'handR|shinR', 'footR|thighR', 'shinR|thighR'] },
};
