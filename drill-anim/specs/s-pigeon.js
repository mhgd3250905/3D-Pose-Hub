// s-pigeon 鸽子式 (pigeon pose, upright beginner variant) · S 档髋部拉伸系列.
// RIGHT leg in front: knee forward-right, shin across the front of the body toward the left hip, outer shin/ankle on the mat.
// LEFT leg extended straight back, knee and top of the foot on the mat. Trunk tall, palms on two yoga blocks beside the hips
// (rig limits: hip flex < 135, extension > -35 -> pelvis tilted forward, low back extended). 'open' 0 = hips high,
// 1 = hips sink toward the mat, deepening the stretch in the right buttock / piriformis and the front of the left hip. One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X.
export default {
  id: 's-pigeon', name: '鸽子式', nameEn: 'Pigeon Pose',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.24, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 50]] },
      chest: { waist: [[[1, 0, 0], -40]] },
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0, palmAt: [0.37, 0.255, 0.02], finger: [0, 0, 1], normal: [0, -1, 0], pole: [0.6, 0.3, -0.4] },
        right: { mode: 'free', frame: 'world', relax: 0, palmAt: [-0.37, 0.255, 0.03], finger: [0, 0, 1], normal: [0, -1, 0], pole: [-0.6, 0.3, -0.4] },
      },
      feet: {
        right: { mode: 'free', frame: 'world', ankle: [0.08, 0.085, 0.42], rot: [[[0, 1, 0], 90]], pole: [-0.8, 0.1, 0.5], thighTwist: 60 },
        left: { mode: 'free', frame: 'world', ankle: [0.12, 0.096, -0.79], rot: [[[1, 0, 0], 167]], pole: [0.10, -0.5, 0.0] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { pelvis: [0, 0.215, -0.02], feet: { left: { ankle: [0.12, 0.096, -0.815] } } } },
  },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-0.85, 0.45, -0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 760, height: 600, cx: 512, cy: 540 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightAnkle', 'leftKnee', 'rightKnee', 'pelvis'],
    blobs: [{ j: 'pelvis', rx: 70, ry: 14, a: 0.6 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftToe', to: 'rightAnkle', mid: 'pelvis', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, -0.15], size: [0.61, 1.83, 0.006], yaw: 0 },
    { type: 'mat', at: [0.37, 0.24, 0.02], size: [0.11, 0.23, 0.24] },
    { type: 'mat', at: [-0.37, 0.24, 0.03], size: [0.11, 0.23, 0.24] }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    allowContact: ['footR|thighL', 'shinR|thighL', 'footR|kneeL', 'thighR|shinR', 'torso|thighR'],
  },
};
