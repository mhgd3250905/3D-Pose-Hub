// hip-flexors-C 绳索站姿直腿前抬 (standing cable straight-leg raise). Standing tall with the back to a LOW pulley; an ankle strap
// on the RIGHT ankle. 'lift' 0 = right foot just off the floor beside the left, 1 = straight right leg raised forward to 80 deg of hip
// flexion (near horizontal, like the reference). Both knees stay locked (>=176 deg), trunk upright, pelvis level. 2 reps / 8 s: 1.2 s up, 0.8 s hold, 1.2 s down, 0.8 s pause.
// Camera from the right, slightly in front (dir [-1, 0.05, 0.55]): the front of the right hip (iliopsoas highlight) faces the camera.
// Head points +Y, front faces +Z, body left = +X (rest frame). Cable column behind the body (-Z), pulley at shin height.
const DEG = Math.PI / 180;
const HIP = [-0.0815, 0.852, 0.0057], TH = 0.35292, SH = 0.40981;
const LEN = Math.sqrt(TH * TH + SH * SH - 2 * TH * SH * Math.cos(179.2 * DEG));   // straight leg, knee 179.2 deg
const ankle = (flex, out = 0) => { const a = flex * DEG; return [+(HIP[0] - out).toFixed(4), +(HIP[1] - LEN * Math.cos(a)).toFixed(4), +(HIP[2] + LEN * Math.sin(a)).toFixed(4)]; };
// the straight leg swings on an arc about the hip: 'lift' is the angle fraction q (cos-eased per phase); the ankle is the chord point
// A0 + q (A1 - A0) plus an exact in-plane correction (offY, offZ) back onto the arc, keyed every frame (linear between keys)
const F0 = 5, F1 = 80, OUT = 0.008, A0 = ankle(F0, OUT), A1 = ankle(F1, OUT);
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const qAt = t => { const r = t % 4; return r < 0.4 ? 0 : r < 1.6 ? cosE((r - 0.4) / 1.2) : r < 2.4 ? 1 : r < 3.6 ? 1 - cosE((r - 2.4) / 1.2) : 0; };
const KEYS = { lift: [], offY: [], offZ: [] };
for (let f = 0; f < 240; f++) { const t = f / 30, q = qAt(t), A = ankle(F0 + (F1 - F0) * q, OUT);
  KEYS.lift.push([t, +q.toFixed(5), 'linear']); KEYS.offY.push([t, +(A[1] - (A0[1] + q * (A1[1] - A0[1]))).toFixed(5), 'linear']); KEYS.offZ.push([t, +(A[2] - (A0[2] + q * (A1[2] - A0[2]))).toFixed(5), 'linear']); }
export default {
  id: 'hip-flexors-C', name: '绳索站姿直腿前抬', nameEn: 'Standing Cable Straight-Leg Raise',
  timeline: { duration: 8, tracks: KEYS },
  pose: {
    base: {
      pelvis: [0, 0.90, 0.01],
      hips: { up: [0, 1, 0], front: [0, 0, 1] },
      hands: {
        right: { mode: 'free', frame: 'chest', wrist: [-0.27, 0.91, -0.07], finger: [0.05, -1, 0.05], normal: [1, 0, 0.1], poleUp: [-0.3, 1.1, -0.5] },
        left: { mode: 'free', frame: 'chest', wrist: [0.255, 0.90, 0.05], finger: [-0.05, -1, 0.05], normal: [-1, 0, 0.1], poleUp: [0.3, 1.1, -0.5] },
      },
      feet: {
        left: { mode: 'floor', at: [0.085, 0.0], heading: 4, pitch: 0 },
        right: { mode: 'free', frame: 'hips', ankle: A0, rot: [[[1, 0, 0], -4]], poleLow: [-0.085, 0.5, 0.5] },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 179, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: {
      lift: { feet: { right: { ankle: A1, rot: [[[1, 0, 0], -68]], poleLow: [-0.085, 0.85, 0.6] } } },
      offY: { feet: { right: { ankle: [A0[0], A0[1] + 1, A0[2]] } } },
      offZ: { feet: { right: { ankle: [A0[0], A0[1], A0[2] + 1] } } },
    },
  },
  highlight: { groups: ['hip-flexors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.5 },
  camera: { dir: [-1, 0.05, 0.55], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightAnkle', 'leftAnkle'], pad: 0.16, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 500, height: 600, cx: 580, cy: 590 },
  stillAt: 1.6,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 50, ry: 12, a: 0.22, dy: 4, sag: 0.0 }] },
  props: [
    { type: 'cableStack', name: 'pulley', at: [-0.13, 0, -0.78], yaw: 0, height: 2.15, pulleyY: 0.14 },
    { type: 'ankleStrap', side: 'right', name: 'strap', toward: 'pulley', up: 0.07 },
    { type: 'cable', from: 'pulley', to: 'strap' },
  ],
  keyFrames: [0.4, 1.6, 3.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
