// w-chair-hip-thrust 椅子臀推 (chair hip thrust). Upper back (lower shoulder blades) resting across the front edge of a sturdy
// chair seat, feet flat on the floor about hip width, hands on the hips. 'up' drives the hips from the bottom (hips low, trunk
// angled ~30 deg) to the top: thighs and trunk level, shins vertical, knees ~90 deg, squeeze, lower. The back pivots on the seat
// edge (solver keeps a rest-frame back point on the edge). 2 reps / 8 s: 1.0 s up, 1.3 s hold, 1.2 s down, 0.5 s rest.
// The chair stands side-on (backrest on the far side, -Z) so the head clears it. Head points -X (toward the chair), face up (+Y), body left = -Z.
const H = 0.42, XE = -0.55;                 // seat top height, seat front edge x
const BACK = [0, 1.22, -0.089];             // rest-frame back point below the shoulder blades (on the shirt surface)
const FX = 0.175, FZ = 0.115;
const handOnHip = s => { const g = s === 'left' ? 1 : -1;
  return { mode: 'free', frame: 'hips', palmAt: [g * 0.152, 1.05, 0.05], finger: [-g * 0.05, -0.35, 0.94], normal: [-g, 0, 0], poleUp: [g * 0.6, 1.15, -0.3],
    touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } }; };
export default {
  id: 'w-chair-hip-thrust', name: '椅子臀推', nameEn: 'Chair Hip Thrust',
  timeline: { duration: 8, tracks: { up: [[0, 0], [0.3, 0], [1.3, 1], [2.6, 1], [3.8, 0], [4.3, 0], [5.3, 1], [6.6, 1], [7.8, 0]] } },
  pose: {
    base: {
      pelvis: [-0.31, 0.33, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], -42]] },
      chest: { waist: [[[0, 0, 1], 12]] },
      hands: { left: handOnHip('left'), right: handOnHip('right') },
      feet: {
        left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 0, poleLow: [0.12, 0.5, 0.8] },
        right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 0, poleLow: [-0.12, 0.5, 0.8] },
      },
      constraints: [
        { type: 'point', frame: 'chest', at: BACK, axis: [0, 1, 0], value: H + 0.002, weight: 1 },
        { type: 'point', frame: 'chest', at: BACK, axis: [1, 0, 0], value: XE - 0.03, weight: 1 },
      ],
      solve: { vars: ['px', 'py'], reg: { px: 0.2, py: 0.2 }, iters: 60 },
    },
    deltas: { up: { pelvis: [-0.25, 0.52, 0], hips: { rot: [[[0, 0, 1], 0]] }, chest: { waist: [[[0, 0, 1], -6]] } } },
  },
  highlight: { groups: ['glute-max'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [0.25, 0.1, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'shoulderCenter', 'leftElbow'], pad: 0.16, k: 0.8, drift: 4, at: 2.0 },
  frame: { mode: 'fit', width: 760, cx: 540, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'pelvis', rx: 80, ry: 16, a: 0.4 }],
    bands: [] },
  props: [{ type: 'chair', at: [XE - 0.22, 0, -0.02], yaw: 0, height: H, width: 0.44, depth: 0.42 }],   // side edge of the seat under the back, backrest on the far side (-Z)
  keyFrames: [0.15, 0.8, 2.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    touch: [{ side: 'left', when: 'always' }, { side: 'right', when: 'always' }],
    allowContact: ['handL|torso', 'handR|torso', 'forearmL|torso', 'forearmR|torso', 'handL|thighL', 'handR|thighR'],
  },
};
