// s-figure4 仰卧 4 字梨状肌拉伸 (supine figure-4 / reclined pigeon) · S 档髋部拉伸系列.
// Lying on the back on the mat, head and shoulders down, arms relaxed on the mat. LEFT foot planted, left knee up. The RIGHT ankle is
// crossed over the left thigh just below the knee and the right knee falls open to the right (figure 4, beginner version - the
// rig's arms can't reach behind the thigh with the shoulders flat). 'open' 0 = left foot far, 1 = left foot walks 6 cm toward the
// hips (more hip flexion) while the right knee sinks further open, deepening the stretch in the right buttock. One slow rep / 8 s.
// Head points -Z, front (face) points +Y, body left = +X.
const add = (a, b) => a.map((x, i) => +(x + b[i]).toFixed(4));
const AR = [0.10, 0.37, 0.11];                                  // right ankle resting on the left thigh below the knee
export default {
  id: 's-figure4', name: '仰卧4字梨状肌拉伸', nameEn: 'Supine Figure-4 Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.114, 0],
      hips: { up: [0, 0, -1], front: [0, 1, 0], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0, palmAt: [0.265, 0.03, 0.073], finger: [0.05, 0, 1], normal: [0, -1, 0], pole: [0.5, 0.5, 0.0] },
        right: { mode: 'free', frame: 'world', relax: 0, palmAt: [-0.265, 0.03, 0.073], finger: [-0.05, 0, 1], normal: [0, -1, 0], pole: [-0.5, 0.5, 0.0] },
      },
      feet: {
        left: { mode: 'floor', at: [0.11, 0.50], heading: 0, pitch: 0, pole: [0.12, 1.0, 0.3] },
        right: { mode: 'free', frame: 'world', ankle: AR, rot: [[[0, 1, 0], 90], [[0, 0, 1], 15]], pole: [-0.8, 0.22, 0.2], thighTwist: 100 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { open: {
      feet: { left: { at: [0.11, 0.44] }, right: { ankle: add(AR, [0, 0.025, -0.045]), pole: [-0.9, 0.06, 0.25] } },
    } },
  },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-1, 0.7, 0.2], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe', 'leftShoulder'], pad: 0.18, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 760, height: 640, cx: 512, cy: 530 },
  stillAt: 3.8,
  shadow: { joints: ['head', 'pelvis', 'leftShoulder', 'rightShoulder'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'head', rx: 50, ry: 12, a: 0.5 }],
    bands: [{ from: 'head', to: 'pelvis', mid: 'leftShoulder', rx: 90, ry: 16, a: 0.4, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, -0.25], size: [0.61, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    pins: [{ c: 'footL', when: 'params.open<0.001' }],
    allowContact: ['handL|thighL', 'handR|thighL', 'footR|thighL', 'shinR|thighL', 'footR|kneeL', 'shinR|shinL', 'handR|thighR', 'forearmR|thighR', 'forearmR|shinR', 'handR|shinR'],
  },
};
