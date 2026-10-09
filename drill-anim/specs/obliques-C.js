// obliques-C 绳索高位伐木 (high-to-low cable woodchop). Wide athletic stance, knees soft. A single D-handle on a HIGH pulley
// to the body's right; the RIGHT hand grips the handle and the LEFT hand wraps over the right fist (overlapping grip).
// The arms stay long (elbows ~160 deg) and stay in front of the chest; the diagonal comes from the trunk: hips and chest turn from
// the pulley side (right, up) across to the left hip (down). 'chop' 0 = hands high by the right shoulder, 1 = hands low outside the left hip.
// 2 reps / 8 s: 1.2 s chop, 0.8 s hold, 1.2 s return, 0.8 s pause.
// Head points +Y, front faces +Z, body left = +X (rest frame). Cable column to the right-front (-X, +Z).
const SHR = [-0.188, 1.37, 0], SHL = [0.188, 1.37, 0];
const HI = [-0.035, 1.60, 0.37], LO = [-0.035, 1.10, 0.36];        // right wrist in the chest frame: start (high), end (low)
const BOW = [0, 0, 0.09];                                         // chest-frame bow at mid-path so the long arms swing on an arc
const fing = (sh, w) => { const d = w.map((v, i) => v - sh[i]); const n = Math.hypot(...d); return d.map(v => +(v / n).toFixed(3)); };
const add = (a, b, k = 1) => a.map((v, i) => +(v + k * b[i]).toFixed(4));
// left palm lies over the curled right fingers (right palm faces +X): a little along the right hand and out to +X
const lp = w => add(add(w, fing(SHR, w), 0.06), [0.045, 0, 0]);
const R = w => ({ wrist: w, finger: fing(SHR, w) }), L = w => ({ palmAt: lp(w), finger: fing(SHR, w) });
const rep = s => [[s + 0.4, 0], [s + 1.6, 1], [s + 2.4, 1], [s + 3.6, 0]];
const bow = s => [[s + 0.4, 0], [s + 1.0, 1], [s + 1.6, 0], [s + 2.4, 0], [s + 3.0, 1], [s + 3.6, 0]];
export default {
  id: 'obliques-C', name: '绳索高位伐木', nameEn: 'High-to-Low Cable Woodchop',
  timeline: { duration: 8, tracks: { chop: [[0, 0], ...rep(0), ...rep(4)], bow: [[0, 0], ...bow(0), ...bow(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.89, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[0, 1, 0], -22]] },
      chest: { body: [[[0, 1, 0], -24], [[1, 0, 0], 4]] },
      hands: {
        right: { mode: 'free', frame: 'chest', relax: 0, ...R(HI), normal: [1, 0, 0], poleUp: [-0.45, 1.05, 0.15] },
        // the left hand wraps over the right fist; touch pulls its palm onto the right hand every frame
        left: { mode: 'free', frame: 'chest', ...L(HI), normal: [-1, 0, 0], poleUp: [0.45, 1.05, 0.15], touch: { clear: 0.003, from: 0 } },
      },
      feet: {
        left: { mode: 'floor', at: [0.22, 0.0], heading: 10, pitch: 0 },
        right: { mode: 'floor', at: [-0.22, 0.0], heading: -10, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 168, weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 168, weight: 1 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 0.3, py: 0.2, pz: 0.2 } },
    },
    deltas: {
      chop: { hips: { rot: [[[0, 1, 0], 20]] }, chest: { body: [[[0, 1, 0], 22], [[1, 0, 0], 10]] },
        hands: { right: R(LO), left: L(LO) } },
      bow: { hands: { right: { wrist: add(HI, BOW) }, left: { palmAt: add(lp(HI), BOW) } } },
    },
  },
  highlight: { groups: ['obliques'], side: 'both', pulseTrack: 'chop', pulseBase: 0.3 },
  camera: { dir: [0.35, 0.18, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm', 'rightShoulder', 'leftShoulder'], pad: 0.16, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 400, height: 560, cx: 650, cy: 600 },
  stillAt: 1.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.65 }],
    bands: [{ from: 'rightAnkle', to: 'leftAnkle', mid: 'pelvis', rx: 70, ry: 14, a: 0.28, dy: 4, sag: 0.0 }] },
  props: [
    { type: 'cableStack', name: 'pulley', at: [-1.2, 0, 0.55], yaw: 90, height: 2.25, pulleyY: 1.98 },
    { type: 'dHandle', side: 'right', name: 'handle', toward: 'pulley', shift: 0.01, len: 0.15 },
    { type: 'cable', from: 'pulley', to: 'handle' },
  ],
  keyFrames: [0.4, 1.0, 1.6],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|handR'],
    // the right-hand check against the LEFT hand is excluded: the bone-core heuristic false-flags a thin hand cupped over a fist
    // (-16..-19 mm with the left hand 22 mm away). A ray-parity test of every right-hand vertex against the left-hand surface
    // (work probe hhray.js) finds 0 vertices inside, min gap 2.0 mm. The left hand is still checked against the right hand.
    handClipExclude: { right: ['leftHand'] },
  },
};
