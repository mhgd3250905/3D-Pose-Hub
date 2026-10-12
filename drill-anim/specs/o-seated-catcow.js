// o-seated-catcow 坐姿猫牛式 (seated cat-cow) · S2 办公室久坐拉伸系列（一把办公椅，不坐地不躺）.
// Sitting near the front of an office chair, feet flat hip-width, hands resting on the knees. 'cat' = pelvis tucks back and the
// back rounds (chin follows), 'cow' = pelvis tips forward and the chest lifts. One slow cycle / 8 s: cat in 1.6 s, hold, through
// neutral to cow, hold, back to neutral. Head points +Y, front faces +Z, body left = +X.
const hand = (sg) => ({ mode: 'free', frame: 'world', palmAt: [sg * 0.12, 0.575, 0.27], wrist: [sg * 0.12, 0.595, 0.21], finger: [0, -0.35, 1], normal: [0, -1, 0.05], pole: [sg * 0.55, 0.8, -0.2] });
export default {
  id: 'o-seated-catcow', name: '坐姿猫牛式', nameEn: 'Seated Cat-Cow',
  timeline: { duration: 8, tracks: {
    cat: [[0, 0], [0.4, 0], [2.0, 1], [3.2, 1], [4.2, 0]],
    cow: [[3.6, 0], [4.4, 0], [5.8, 1], [6.8, 1], [7.8, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.57, 0.04],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: { left: hand(1), right: hand(-1) },
      feet: {
        left: { mode: 'floor', at: [0.13, 0.43], heading: 6, pitch: 0 },
        right: { mode: 'floor', at: [-0.13, 0.43], heading: -6, pitch: 0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      cat: { pelvis: [0, 0.565, 0.02], hips: { rot: [[[1, 0, 0], -20]] }, chest: { waist: [[[1, 0, 0], 44]] }, hands: { left: { palmAt: [0.13, 0.53, 0.44], wrist: [0.13, 0.56, 0.38] }, right: { palmAt: [-0.13, 0.53, 0.44], wrist: [-0.13, 0.56, 0.38] } } },
      cow: { pelvis: [0, 0.57, 0.05], hips: { rot: [[[1, 0, 0], 14]] }, chest: { waist: [[[1, 0, 0], -12]] } },
    },
  },
  highlight: { groups: ['erectors'], side: 'both', pulseTrack: 'cat', pulseBase: 0.35 },
  camera: { dir: [1, 0.2, -0.5], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.2, k: 1.15, drift: 0.9, at: 2.6 },
  frame: { mode: 'fit', width: 560, height: 700, cx: 512, cy: 540 },
  stillAt: 2.6,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'officeChair', at: [0, 0, 0.06], yaw: 0, seatY: 0.43 }],
  keyFrames: [0.3, 2.6, 6.3],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], allowContact: ['handL|thighL', 'handR|thighR'] },
};
