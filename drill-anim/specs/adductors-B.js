// adductors-B 屈膝哥本哈根侧撑 (short-lever Copenhagen plank on a bench). Forearm side plank on the LEFT forearm (elbow
// under the shoulder, forearm flat on the mat pointing forward); the RIGHT (top) knee rests on a flat bench with the inner
// knee pressing down and the shin lying back along the bench; the bottom (left) leg hangs under the bench, knee bent.
// 'lift' drives the hips from sagging toward the floor up into one straight line shoulder-hip-knee (top-leg adductors),
// holds 2.4 s and lowers. Right hand rests on the top hip (surface contact). 2 reps / 8 s.
// Head points +X, front faces +Z (camera side), body left = -Y (down) - frame of hip-abductors-A.
const KX = -0.86, KY = 0.49, KZ = 0.0;               // right knee centre on the bench (bench top 0.44)
const rep = s => [[s + 0.2, 0], [s + 1.3, 1], [s + 3.7, 1], [s + 4.0, 0]];
export default {
  id: 'adductors-B', name: '屈膝哥本哈根侧撑', nameEn: 'Short-Lever Copenhagen Plank',
  timeline: { duration: 8, tracks: { lift: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [-0.48, 0.24, 0],
      hips: { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], 0], [[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'floor', at: [0.0, 0.215], finger: [0.15, 1], poleUp: [0.6, 1.25, -0.15] },
        right: { mode: 'free', frame: 'hips', palmAt: [-0.165, 1.06, 0.03], finger: [0.05, -0.35, 0.94], normal: [1, 0, 0], poleUp: [-0.55, 1.15, -0.25], touch: { clear: 0.0015, from: 0.0, iters: 20 } },
      },
      feet: {
        right: { mode: 'free', frame: 'world', ankle: [KX - 0.01, KY + 0.005, KZ - 0.405], rot: [[[0, 1, 0], 180], [[0, 0, 1], -90]], pole: [KX - 0.4, KY, 0.3] },
        left: { mode: 'free', frame: 'hips', ankle: [0.0815, 0.341, -0.173], rot: [[[1, 0, 0], 0]], poleLow: [0.1, 0.6, 0.9] },
      },
      constraints: [
        { type: 'mid', limb: 'leftArm', at: [0.0, 0.042, 0.0], weight: 4 },
        { type: 'joint', joint: 'leftShoulder', axis: [1, 0, 0], value: 0.0, weight: 0.3 },
        { type: 'joint', joint: 'leftShoulder', axis: [0, 0, 1], value: 0.0, weight: 0.3 },
        { type: 'mid', limb: 'rightLeg', at: [KX, KY, KZ], weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.21, weight: 0.6 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0', 'h1'], reg: { px: 0.5, py: 0.5, pz: 0.5, h0: 0.01, h1: 0.05 } },
    },
    deltas: { lift: { constraints: [{}, {}, {}, {}, { value: 0.33 }] } },
  },
  highlight: { groups: ['adductors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.1, 0.12, 1], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'rightElbow'], pad: 0.13, k: 0.75, drift: 2, at: 2.4 },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 530 },
  stillAt: 2.4,
  shadow: { joints: ['leftPalm', 'leftElbow', 'pelvis', 'leftShoulder', 'leftAnkle'],
    blobs: [{ j: 'leftElbow', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'mat', at: [-0.25, 0, 0.05], size: [1.0, 0.61, 0.006] },
    { type: 'bench', at: [KX - 0.02, 0, -0.08], yaw: 90, length: 1.0, height: 0.44 },
  ],
  keyFrames: [0.2, 1.3, 2.4],
  qa: {
    pins: [{ c: 'handL', when: 'always' }],
    straight: [],
    allowContact: ['handR|torso', 'forearmR|torso', 'thighL|shinL', 'thighR|shinR'],
  },
};
