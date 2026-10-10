// s-9090 90/90 坐姿换髋 (90/90 hip stretch) · S 档髋部拉伸系列.
// Sitting on the mat. RIGHT leg in front: thigh straight ahead, knee 90 deg, shin across the front of the body (hip external rotation).
// LEFT leg to the side: thigh out to the left, knee 90 deg, shin pointing back (hip internal rotation). Pelvis faces between the
// two thighs, chest turned square over the front shin, hands resting lightly on the front knee and the mat-side knee.
// 'open' 0 = trunk tall, 1 = hinge forward from the hips over the front shin with a long back, stretching the outer right hip
// (glute / piriformis). One slow rep / 8 s.
// Head points +Y, front shin points +X, body left = +X.
export default {
  id: 's-9090', name: '90/90坐姿换髋', nameEn: '90/90 Hip Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.14, 0],
      hips: { up: [0, 1, 0], front: [0.6, 0, 0.8], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0], [[0, 1, 0], -20]] },
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0, palmAt: [0.25, 0.17, 0.0], finger: [0.3, 0, 1], normal: [0, -1, 0], pole: [0.6, 0.3, -0.3], relax: 1, touch: { solve: 'bisect', clear: 0.0008, toward: 'leftKnee' } },
        right: { mode: 'free', frame: 'world', relax: 0, palmAt: [-0.09, 0.17, 0.24], finger: [0.3, 0, 1], normal: [0, -1, 0], pole: [-0.6, 0.3, -0.3], relax: 1, touch: { solve: 'bisect', clear: 0.0008, toward: 'rightKnee' } },
      },
      feet: {
        right: { mode: 'free', frame: 'world', ankle: [0.33, 0.085, 0.36], rot: [[[0, 1, 0], 90]], pole: [-0.3, 0.1, 1.0], thighTwist: 60 },
        left: { mode: 'free', frame: 'world', ankle: [0.45, 0.085, -0.33], rot: [[[0, 1, 0], 180]], pole: [1.0, 0.1, 0.1], thighTwist: 40 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: {
      pelvis: [0, 0.145, 0.01],
      hips: { rot: [[[1, 0, 0], 20]] }, chest: { waist: [[[1, 0, 0], 12], [[0, 1, 0], -20]] },
      hands: { left: { palmAt: [0.27, 0.17, 0.04] }, right: { palmAt: [-0.07, 0.17, 0.28] } },
    } },
  },
  highlight: { groups: ['glute-max'], panels: ['gluteMed'], side: 'right', pulseTrack: 'open', pulseBase: 0.7 },
  camera: { dir: [0.0, 0.85, 1], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe'], pad: 0.18, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 600, height: 540, cx: 512, cy: 580 },
  stillAt: 3.8,
  shadow: { joints: ['leftKnee', 'rightKnee', 'pelvis', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.5 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'leftKnee', to: 'rightKnee', mid: 'pelvis', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0.15, 0, -0.25], size: [0.61, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handR|thighR', 'handR|shinR', 'handL|thighL', 'handL|shinL', 'footR|shinL', 'footR|thighL', 'shinR|thighL', 'thighR|shinR', 'thighL|shinL'],
  },
};
