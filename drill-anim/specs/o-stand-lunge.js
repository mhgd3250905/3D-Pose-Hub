// o-stand-lunge 扶椅站姿弓步屈髋肌拉伸 (standing split-stance hip-flexor stretch, hand on the chair) · S2 办公室久坐拉伸系列.
// RIGHT foot forward, LEFT foot back on the ball of the foot, right hand on the backrest of an office chair beside the body, left
// hand on the hip. 'open' 0 = tall split stance, 1 = knees bend, pelvis tucks (posterior tilt) and glides forward, stretching the
// front of the LEFT hip. One slow rep / 8 s. Head points +Y, front faces +Z, body left = +X.
export default {
  id: 'o-stand-lunge', name: '扶椅站姿弓步屈髋拉伸', nameEn: 'Chair-Supported Standing Hip Flexor Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.76, -0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'hips', wrist: [0.171, 1.10, -0.02], finger: [-0.15, -0.35, 0.92], normal: [-1, 0, 0.1], pole: [0.75, 1.15, -0.35] },
        right: { mode: 'free', frame: 'world', palmAt: [-0.32, 0.985, 0.04], wrist: [-0.30, 1.00, -0.03], finger: [-0.2, -0.2, 1], normal: [0, -1, 0], pole: [-0.6, 0.9, -0.4] },
      },
      feet: {
        right: { mode: 'floor', at: [-0.11, 0.36], heading: -3, pitch: 0 },
        left: { mode: 'floor', at: [0.10, -0.42], heading: 3, pitch: 38 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { pelvis: [0, 0.70, 0.05], hips: { rot: [[[1, 0, 0], -10]] }, chest: { waist: [[[1, 0, 0], 7]] } } },
  },
  highlight: { groups: ['hip-flexors'], side: 'left', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [1, 0.15, 0.3], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightWrist'], pad: 0.18, k: 1.1, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 600, height: 700, cx: 512, cy: 520 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'leftToe', rx: 36, ry: 9, a: 0.55 }], bands: [] },
  props: [{ type: 'officeChair', at: [-0.62, 0, 0.05], yaw: -90, seatY: 0.46 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: { pins: [{ c: 'footR', when: 'always' }], allowContact: ['handL|torso'] },
};
