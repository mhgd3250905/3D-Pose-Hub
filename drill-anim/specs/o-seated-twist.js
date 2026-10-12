// o-seated-twist 坐姿扭转 (seated spinal twist, hand on the backrest) · S2 办公室久坐拉伸系列.
// Sitting tall on an office chair, feet flat, knees together-ish. 'open' 0 = facing forward, hands on the thighs; 1 = the trunk
// turns to the RIGHT, right hand holds the right edge of the backrest, left hand on the outside of the right knee.
// One slow rep / 8 s. Head points +Y, front faces +Z, body left = +X.
export default {
  id: 'o-seated-twist', name: '坐姿扶椅扭转', nameEn: 'Seated Chair Twist',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.2, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]],
    clearance: [[0, 0], [0.6, 0], [1.4, 1], [2.2, 0], [5.6, 0], [6.3, 1], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.57, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[0, 1, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', palmAt: [0.11, 0.585, 0.24], wrist: [0.12, 0.60, 0.17], finger: [0, -0.25, 1], normal: [0, -1, 0], pole: [0.5, 0.8, -0.3] },
        right: { mode: 'free', frame: 'world', palmAt: [-0.11, 0.585, 0.24], wrist: [-0.12, 0.60, 0.17], finger: [0, -0.25, 1], normal: [0, -1, 0], pole: [-0.5, 0.8, -0.3] },
      },
      feet: {
        left: { mode: 'floor', at: [0.11, 0.42], heading: 3, pitch: 0 },
        right: { mode: 'floor', at: [-0.11, 0.42], heading: -3, pitch: 0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { chest: { waist: [[[0, 1, 0], -42]] },
      hands: {
        left: { palmAt: [-0.05, 0.64, 0.36], wrist: [0.0, 0.66, 0.31], finger: [-0.8, -0.3, 0.5], normal: [-0.6, 0, -0.8], pole: [0.5, 0.8, 0.3] },
        right: { palmAt: [-0.245, 0.93, -0.25], wrist: [-0.27, 0.92, -0.18], finger: [0.15, 0, -1], normal: [1, 0, 0], pole: [-0.7, 1.0, -0.5] } } },
      // Move around the torso while changing from the knee to the backrest; endpoints stay on their original surfaces.
      clearance: { hands: { right: { palmAt: [-0.19, 0.585, 0.24], wrist: [-0.20, 0.60, 0.17] } } },
    },
  },
  highlight: { groups: ['obliques', 'erectors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.55, 0.22, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightWrist'], pad: 0.2, k: 1.15, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 560, height: 700, cx: 512, cy: 540 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'officeChair', at: [0, 0, 0.03], yaw: 0, seatY: 0.43 }],
  keyFrames: [0.3, 2.2, 3.8],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], allowContact: ['handL|thighL', 'handR|thighR', 'handL|thighR', 'handL|shinR'] },
};
