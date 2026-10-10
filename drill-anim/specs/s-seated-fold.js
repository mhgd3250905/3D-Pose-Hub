// s-seated-fold 坐姿体前屈 (seated forward fold, hamstring stretch) · S 档髋部拉伸系列.
// Sitting on the mat, both legs straight forward and together, toes up. 'open' 0 = trunk tall, hands on the thighs,
// 1 = hinge forward from the hips with a long back, hands slide down to the shins. One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X.
export default {
  id: 's-seated-fold', name: '坐姿体前屈', nameEn: 'Seated Forward Fold',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.139, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -5]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', palmAt: [0.11, 0.198, 0.29], wrist: [0.12, 0.215, 0.22], finger: [0, -0.1, 1], normal: [0, -1, 0], pole: [0.5, 0.4, -0.2] },
        right: { mode: 'free', frame: 'world', palmAt: [-0.11, 0.198, 0.29], wrist: [-0.12, 0.215, 0.22], finger: [0, -0.1, 1], normal: [0, -1, 0], pole: [-0.5, 0.4, -0.2] },
      },
      feet: {
        left: { mode: 'free', frame: 'world', ankle: [0.09, 0.075, 0.768], rot: [[[1, 0, 0], -80]], pole: [0.09, 1.0, 0.4] },
        right: { mode: 'free', frame: 'world', ankle: [-0.09, 0.075, 0.768], rot: [[[1, 0, 0], -80]], pole: [-0.09, 1.0, 0.4] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: {
      pelvis: [0, 0.122, 0.029],
      hips: { rot: [[[1, 0, 0], 30]] }, chest: { waist: [[[1, 0, 0], 14]] },
      hands: { left: { palmAt: [0.125, 0.15, 0.665], finger: [0.55, -0.55, 0.6], normal: [-0.55, -0.8, 0.1] }, right: { palmAt: [-0.125, 0.15, 0.665], finger: [-0.55, -0.55, 0.6], normal: [0.55, -0.8, 0.1] } },
    } },
  },
  highlight: { groups: ['hamstrings'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [1, 0.25, 0.15], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'leftWrist'], pad: 0.2, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 640, height: 440, cx: 512, cy: 560 },
  stillAt: 3.8,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'pelvis', 'leftKnee'],
    blobs: [{ j: 'pelvis', rx: 70, ry: 14, a: 0.7 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'pelvis', to: 'leftAnkle', mid: 'leftKnee', rx: 70, ry: 14, a: 0.35, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.3], size: [0.61, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    straight: [{ j: 'knee.left', min: 176 }, { j: 'knee.right', min: 176 }],
    allowContact: ['handL|thighL', 'handR|thighR', 'handL|shinL', 'handR|shinR', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'torso|thighL', 'torso|thighR'],
  },
};
