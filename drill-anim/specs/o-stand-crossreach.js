// o-stand-crossreach 扶椅站姿交叉侧伸 (standing cross-leg side reach, hand on the chair) · S2 办公室久坐拉伸系列.
// Standing with the office chair on the LEFT, left hand on the backrest. The RIGHT leg crosses behind the left, right arm overhead.
// 'open' 0 = tall, 1 = the right hip pushes out to the right while the trunk leans left toward the chair (stretch along the outer
// right hip / glute medius and the right side of the waist). One slow rep / 8 s. Head +Y, front +Z, body left = +X.
export default {
  id: 'o-stand-crossreach', name: '扶椅站姿交叉侧伸', nameEn: 'Chair-Supported Cross-Leg Side Reach',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.89, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: {
        right: { mode: 'free', frame: 'chest', wrist: [-0.07, 1.96, 0.02], finger: [0.25, 1, 0], normal: [1, -0.2, 0], pole: [-0.7, 1.7, -0.1] },
        left: { mode: 'free', frame: 'world', palmAt: [0.40, 1.065, 0.04], wrist: [0.37, 1.08, -0.02], finger: [0.4, -0.2, 1], normal: [0, -1, 0], pole: [0.7, 1.1, -0.3] },
      },
      feet: {
        left: { mode: 'floor', at: [0.08, 0.02], heading: 5, pitch: 0 },
        right: { mode: 'floor', at: [0.13, -0.17], heading: -8, pitch: 0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { pelvis: [-0.06, 0.875, 0.0], hips: { rot: [[[0, 0, 1], 6]] }, chest: { waist: [[[0, 0, 1], -24]] } } },
  },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-0.1, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightWrist', 'leftWrist'], pad: 0.16, k: 1.1, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 520, height: 760, cx: 512, cy: 520 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'officeChair', at: [0.72, 0, 0.05], yaw: 90, seatY: 0.46 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], allowContact: ['thighL|thighR', 'shinL|shinR'] },
};
