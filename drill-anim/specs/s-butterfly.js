// s-butterfly 蝴蝶式 (seated butterfly / bound angle) · S 档髋部拉伸系列.
// Sitting on the mat, soles pressed together close to the groin, knees dropped open to the sides, both hands holding the feet.
// 'open' 0 = trunk tall, 1 = hinge forward from the hips with a long back while the knees sink a little further toward the mat,
// stretching the inner thighs. One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X.
export default {
  id: 's-butterfly', name: '蝴蝶式', nameEn: 'Seated Butterfly Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.1235, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0, palmAt: [0.112, 0.192, 0.348], finger: [-0.15, -0.35, 0.92], normal: [-0.6, -0.8, 0], pole: [0.6, 0.4, 0.1] },
        right: { mode: 'free', frame: 'world', relax: 0, palmAt: [-0.112, 0.192, 0.348], finger: [0.15, -0.35, 0.92], normal: [0.6, -0.8, 0], pole: [-0.6, 0.4, 0.1] },
      },
      feet: {
        left: { mode: 'free', frame: 'world', ankle: [0.06, 0.09, 0.36], rot: [[[0, 0, 1], -75], [[0, 1, 0], -15]], pole: [0.7, 0.25, 0.3], thighTwist: -105.0 },
        right: { mode: 'free', frame: 'world', ankle: [-0.06, 0.09, 0.36], rot: [[[0, 0, 1], 75], [[0, 1, 0], 15]], pole: [-0.7, 0.25, 0.3], thighTwist: 105.0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: {
      pelvis: [0, 0.1315, 0.02],
      hips: { rot: [[[1, 0, 0], 22]] }, chest: { waist: [[[1, 0, 0], 12]] },
      feet: { left: { pole: [0.7, 0.05, 0.3] }, right: { pole: [-0.7, 0.05, 0.3] } },
      hands: { left: { palmAt: [0.105, 0.14, 0.43] }, right: { palmAt: [-0.105, 0.14, 0.43] } },
    } },
  },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.12, 0.32, 1], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe'], pad: 0.2, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 640, height: 600, cx: 512, cy: 540 },
  stillAt: 3.8,
  shadow: { joints: ['leftKnee', 'rightKnee', 'pelvis', 'leftAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.5 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'leftKnee', to: 'rightKnee', mid: 'pelvis', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.15], size: [0.61, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    allowContact: ['handL|footL', 'handR|footR', 'handL|footR', 'handR|footL', 'footL|footR', 'shinL|shinR', 'handL|shinL', 'handR|shinR', 'forearmL|shinL', 'forearmR|shinR', 'forearmL|thighL', 'forearmR|thighR', 'thighL|shinL', 'thighR|shinR'],
  },
};
