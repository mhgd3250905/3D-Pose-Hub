// rotator-cuff-C 绳索 90/90 外旋 (cable 90/90 external rotation). Standing tall facing the cable column, feet hip-width.
// The RIGHT upper arm is held out at shoulder height in the scapular plane (30 deg forward of the frontal plane), elbow at 90 deg.
// 'rot' 0 = forearm pointing forward (horizontal, palm down, cable in line with the forearm), 1 = forearm vertical (palm forward).
// The forearm turns about the upper-arm axis, so the wrist travels a quarter circle around the elbow (plant -> free with an arc).
// 2 reps / 8 s: 1.2 s up, 0.8 s hold, 1.2 s down, 0.8 s pause. Left arm hangs relaxed. Shoulder blade down and back, trunk still.
// Head points +Y, front faces +Z, body left = +X (rest frame). Cable column in front of the body at +Z.
const SH = [-0.188, 1.37, -0.004];                       // rest right shoulder
const UA = 0.25678, FA = 0.22805, AB = 30 * Math.PI / 180;
const u = [-Math.cos(AB), 0, Math.sin(AB)];                // upper-arm direction (out to the right, 30 deg forward)
const h = [Math.sin(AB), 0, Math.cos(AB)];                 // forearm 'forward' direction, perpendicular to u
const E = SH.map((s, i) => s + UA * u[i] + (i === 1 ? -0.02 : 0));  // elbow, a touch below the shoulder line
const at = th => { const c = Math.cos(th), s = Math.sin(th); return [0, 1, 2].map(i => +(E[i] + FA * (c * h[i] + s * (i === 1 ? 1 : 0))).toFixed(4)); };
const W0 = at(0), W1 = at(Math.PI / 2);
const n2 = Math.SQRT1_2, ARC = +(FA * (n2 - 0.5) * Math.SQRT2).toFixed(4);  // chord midpoint -> arc midpoint
const pole = d => [0, 1, 2].map(i => +(E[i] + 0.2 * u[i] - 0.12 * d[i]).toFixed(4));
const rep = s => [[s + 0.4, 0], [s + 1.6, 1], [s + 2.4, 1], [s + 3.6, 0]];
export default {
  id: 'rotator-cuff-C', name: '绳索 90/90 外旋', nameEn: 'Cable 90/90 External Rotation',
  timeline: { duration: 8, tracks: { rot: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.92, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1] },
      hands: {
        right: {
          relax: 0, w: 0, arc: ARC, arcDir: [h[0] * n2, n2, h[2] * n2],
          plant: { mode: 'free', frame: 'chest', wrist: W0, finger: h, normal: [0, -1, 0], poleUp: pole(h) },
          free: { mode: 'free', frame: 'chest', wrist: W1, finger: [0, 1, 0], normal: h, poleUp: pole([0, 1, 0]) },
        },
        left: { mode: 'free', frame: 'chest', wrist: [0.262, 0.905, 0.02], finger: [-0.05, -1, 0.05], normal: [-1, 0, 0.1], poleUp: [0.3, 1.1, -0.5] },
      },
      feet: {
        left: { mode: 'floor', at: [0.11, 0.0], heading: 4, pitch: 0 },
        right: { mode: 'floor', at: [-0.11, 0.0], heading: -4, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 174, weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 174, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { rot: { hands: { right: { w: 1 } } } },
  },
  highlight: { groups: ['rotator-cuff'], side: 'right', pulseTrack: 'rot', pulseBase: 0.45 },
  camera: { dir: [-0.85, 0.18, -0.5], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'rightElbow', 'leftShoulder'], pad: 0.16, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 530, height: 720, cx: 490, cy: 540 },
  stillAt: 1.6,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.65 }],
    bands: [{ from: 'rightAnkle', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 14, a: 0.28, dy: 4, sag: 0.0 }] },
  props: [
    { type: 'cableStack', name: 'pulley', at: [0.02, 0, 1.75], yaw: 180, height: 2.15, pulleyY: 1.3 },
    { type: 'dHandle', side: 'right', name: 'handle', toward: 'pulley', shift: 0.01, len: 0.15 },
    { type: 'cable', from: 'pulley', to: 'handle' },
  ],
  keyFrames: [0.4, 1.6, 3.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|thighL'],
  },
};
