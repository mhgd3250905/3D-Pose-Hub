// o-seated-ham 坐姿腘绳肌前伸 (seated hamstring stretch, heel on the floor) · S2 办公室久坐拉伸系列.
// Sitting near the front of an office chair, RIGHT leg straight forward with the heel on the floor and toes up, left foot flat.
// 'open' 0 = trunk tall, hands on the right thigh; 1 = hinge forward from the hips with a long back, hands slide toward the knee.
// One slow rep / 8 s. Head points +Y, front faces +Z, body left = +X.
export default {
  id: 'o-seated-ham', name: '坐姿腘绳肌前伸', nameEn: 'Seated Hamstring Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.57, 0.10],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', palmAt: [-0.03, 0.55, 0.32], wrist: [-0.01, 0.58, 0.26], finger: [-0.4, -0.3, 0.85], normal: [0, -1, 0], pole: [0.5, 0.8, -0.2] },
        right: { mode: 'free', frame: 'world', palmAt: [-0.17, 0.55, 0.32], wrist: [-0.18, 0.58, 0.26], finger: [0.15, -0.3, 1], normal: [0.2, -1, 0], pole: [-0.5, 0.8, -0.2] },
      },
      feet: {
        left: { mode: 'floor', at: [0.14, 0.50], heading: 8, pitch: 0 },
        right: { mode: 'free', frame: 'world', ankle: [-0.10, 0.075, 0.74], rot: [[[1, 0, 0], -70]], pole: [-0.10, 1.2, 0.5] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { pelvis: [0, 0.565, 0.12], hips: { rot: [[[1, 0, 0], 26]] }, chest: { waist: [[[1, 0, 0], 10]] },
      hands: { left: { palmAt: [-0.04, 0.47, 0.50], wrist: [-0.02, 0.50, 0.44] }, right: { palmAt: [-0.17, 0.47, 0.50], wrist: [-0.18, 0.50, 0.44] } } } },
  },
  highlight: { groups: ['hamstrings'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-1, 0.2, 0.25], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.1, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 640, height: 600, cx: 512, cy: 560 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.6 }], bands: [] },
  props: [{ type: 'officeChair', at: [0, 0, 0.03], yaw: 0, seatY: 0.43 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: { pins: [{ c: 'footL', when: 'always' }], straight: [{ j: 'knee.right', min: 170 }], allowContact: ['handL|thighR', 'handR|thighR', 'handL|handR'] },
};
