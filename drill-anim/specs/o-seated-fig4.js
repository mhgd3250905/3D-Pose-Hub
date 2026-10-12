// o-seated-fig4 坐姿四字前压 (seated figure-4 stretch) · S2 办公室久坐拉伸系列.
// Sitting on an office chair, left foot flat, RIGHT ankle crossed over the left knee, right knee falls open. 'open' 0 = trunk tall,
// 1 = hinge forward from the hips with a long back (stretch in the right buttock). Left hand on the right ankle, right hand on the
// right knee. One slow rep / 8 s. Head points +Y, front faces +Z, body left = +X.
export default {
  id: 'o-seated-fig4', name: '坐姿四字前压', nameEn: 'Seated Figure-4 Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.57, 0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', palmAt: [0.05, 0.66, 0.36], wrist: [0.09, 0.70, 0.31], finger: [-0.4, -0.4, 0.8], normal: [0, -1, 0], pole: [0.65, 0.85, 0.2] },
        right: { mode: 'free', frame: 'world', palmAt: [-0.30, 0.66, 0.24], wrist: [-0.26, 0.71, 0.19], finger: [-0.5, -0.4, 0.75], normal: [0, -1, 0], pole: [-0.65, 0.85, 0.2] },
      },
      feet: {
        left: { mode: 'floor', at: [0.12, 0.44], heading: 4, pitch: 0 },
        right: { mode: 'free', frame: 'world', ankle: [0.04, 0.60, 0.40], rot: [[[0, 1, 0], 80], [[0, 0, 1], -10]], pole: [-0.9, 0.7, 0.3] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { pelvis: [0, 0.565, 0.035], hips: { rot: [[[1, 0, 0], 18]] }, chest: { waist: [[[1, 0, 0], 12]] },
      hands: { left: { palmAt: [0.05, 0.66, 0.37], wrist: [0.10, 0.70, 0.33] }, right: { palmAt: [-0.30, 0.65, 0.27], wrist: [-0.25, 0.69, 0.23] } } } },
  },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-0.85, 0.2, 0.65], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.2, k: 1.15, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 560, height: 700, cx: 512, cy: 540 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'leftAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'officeChair', at: [0, 0, 0.04], yaw: 0, seatY: 0.43 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: { pins: [{ c: 'footL', when: 'always' }], allowContact: ['handL|footR', 'handL|shinR', 'handR|thighR', 'handR|shinR', 'footR|thighL', 'shinR|thighL', 'footR|shinL'] },
};
