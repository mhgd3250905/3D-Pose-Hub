// s-frog 青蛙式 (frog stretch) · S 档髋部拉伸系列.
// Prone on forearms and knees: forearms flat on the mat (elbows under the shoulders), knees spread wide to the sides, knees ~90 deg,
// shins pointing back in line with the knees, inner ankles/feet on the mat, back flat. 'open' 0 = hips over the knees,
// 1 = hips rock back and sink a little, stretching the inner thighs. One slow rep / 8 s.
// Head points +Z, front (chest) faces -Y (down), body left = +X.
export default {
  id: 's-frog', name: '青蛙式', nameEn: 'Frog Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.30, 0.0],
      hips: { up: [0, 0, 1], front: [0, -1, 0], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'floor', at: [0.13, 0.66], finger: [-0.15, 1], poleUp: [0.5, 0.2, -0.4] },
        right: { mode: 'floor', at: [-0.13, 0.66], finger: [0.15, 1], poleUp: [-0.5, 0.2, -0.4] },
      },
      feet: {
        left: { mode: 'free', frame: 'world', ankle: [0.42, 0.07, -0.38], rot: [[[0, 1, 0], -90], [[0, 0, 1], -80]], pole: [0.40, 0.0, 0.3] },
        right: { mode: 'free', frame: 'world', ankle: [-0.42, 0.07, -0.38], rot: [[[0, 1, 0], 90], [[0, 0, 1], 80]], pole: [-0.40, 0.0, 0.3] },
      },
      constraints: [
        { type: 'mid', limb: 'leftArm', at: [0.17, 0.045, 0.40], weight: 6 },
        { type: 'mid', limb: 'rightArm', at: [-0.17, 0.045, 0.40], weight: 6 },
      ],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { pelvis: [0, 0.298, -0.05] } },
  },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.6, 0.8, -0.55], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe', 'leftElbow'], pad: 0.16, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 720, height: 600, cx: 512, cy: 530 },
  stillAt: 3.8,
  shadow: { joints: ['leftKnee', 'rightKnee', 'leftElbow', 'rightElbow', 'pelvis'],
    blobs: [{ j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'leftElbow', rx: 40, ry: 10, a: 0.5 }, { j: 'rightElbow', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'leftKnee', to: 'rightKnee', mid: 'pelvis', rx: 90, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.2], size: [1.0, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    jointPins: [{ j: 'leftElbow' }, { j: 'rightElbow' }],
    allowContact: ['forearmL|upperArmL', 'forearmR|upperArmR'],
  },
};
