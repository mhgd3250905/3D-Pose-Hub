// o-stand-sidebend 站姿举手侧屈 (standing overhead side bend) · S2 办公室久坐拉伸系列.
// Standing tall, feet hip-width, office chair parked behind-left. RIGHT arm reaches overhead, left hand on the left thigh.
// 'open' 0 = tall, arm overhead; 1 = trunk bends to the LEFT, hips shift slightly right (stretch along the right side of the waist).
// One slow rep / 8 s. Head +Y, front +Z, body left = +X.
export default {
  id: 'o-stand-sidebend', name: '站姿举手侧屈', nameEn: 'Standing Overhead Side Bend',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.90, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: {
        right: { mode: 'free', frame: 'chest', wrist: [-0.07, 1.96, 0.02], finger: [0.25, 1, 0], normal: [1, -0.2, 0], pole: [-0.7, 1.7, -0.1] },
        left: { mode: 'free', frame: 'hips', wrist: [0.215, 0.86, 0.03], finger: [-0.05, -1, 0.05], normal: [-1, 0, 0.1], pole: [0.6, 1.1, -0.3] },
      },
      feet: {
        left: { mode: 'floor', at: [0.11, 0.0], heading: 5, pitch: 0 },
        right: { mode: 'floor', at: [-0.11, 0.0], heading: -5, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 179, weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 179, weight: 1 },
      ],
      solve: { vars: ['py'], reg: { py: 0.2 } },
    },
    deltas: { open: { pelvis: [-0.035, 0.90, 0.0], chest: { waist: [[[0, 0, 1], -26]] }, hands: { left: { wrist: [0.225, 0.74, 0.04] } } } },
  },
  highlight: { groups: ['obliques'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightWrist', 'leftWrist'], pad: 0.16, k: 1.1, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 480, height: 760, cx: 512, cy: 520 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'officeChair', at: [0.75, 0, -0.55], yaw: 20, seatY: 0.46 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], allowContact: ['handL|thighL'] },
};
