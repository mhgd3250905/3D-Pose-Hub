// adductors-C 绳索站姿髋内收 (standing cable hip adduction). Facing forward, standing tall on the straight RIGHT leg; ankle strap on
// the LEFT ankle, LOW pulley out to the left. 'add' 0 = straight left leg out to the side (28 deg abduction), 1 = swept across in
// front of the standing leg (7 deg adduction, ankle ~1 cm past the midline): 35 deg of sweep. The leg keeps a fixed 15 deg of hip flexion (just enough to pass in
// front of the right leg; shoe-to-shoe mesh gap >= 3.5 mm at the hold). Camera front-right and low, so the inner left thigh (adductors) faces the camera as it crosses the midline.
// Both knees locked; pelvis level, trunk still. 2 reps / 8 s: 1.2 s in, 0.8 s hold, 1.2 s out, 0.8 s pause.
// Head points +Y, front faces +Z, body left = +X (rest frame). Cable column to the left (+X).
const DEG = Math.PI / 180;
const HIP = [0.0815, 0.852, 0.0057], TH = 0.35292, SH = 0.40981;
const LEN = Math.sqrt(TH * TH + SH * SH - 2 * TH * SH * Math.cos(179.2 * DEG));
const FLEX = 15, P0 = 28, P1 = -7;   // v2: P1 -8 / FLEX 14 put the left sneaker ~12 mm into the right one at the hold (ray-parity probe)
const ankle = phi => { const p = phi * DEG, f = FLEX * DEG; const d = [Math.sin(p), -Math.cos(p) * Math.cos(f), Math.cos(p) * Math.sin(f)]; const n = Math.hypot(...d);
  return d.map((v, i) => +(HIP[i] + LEN * v / n).toFixed(5)); };
const A0 = ankle(P0), A1 = ankle(P1);
// the straight leg swings on an arc about the hip: 'add' = angle fraction q (cos-eased per phase); the ankle is the chord point plus an
// exact correction (offX/offY/offZ) back onto the arc, keyed every frame (linear between keys)
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const qAt = t => { const r = t % 4; return r < 0.4 ? 0 : r < 1.6 ? cosE((r - 0.4) / 1.2) : r < 2.4 ? 1 : r < 3.6 ? 1 - cosE((r - 2.4) / 1.2) : 0; };
const KEYS = { add: [], offX: [], offY: [], offZ: [] };
for (let f = 0; f < 240; f++) { const t = f / 30, q = qAt(t), A = ankle(P0 + (P1 - P0) * q);
  KEYS.add.push([t, +q.toFixed(5), 'linear']);
  ['offX', 'offY', 'offZ'].forEach((k, i) => KEYS[k].push([t, +(A[i] - (A0[i] + q * (A1[i] - A0[i]))).toFixed(5), 'linear'])); }
const unit = i => A0.map((v, j) => v + (i === j ? 1 : 0));
export default {
  id: 'adductors-C', name: '绳索站姿髋内收', nameEn: 'Standing Cable Hip Adduction',
  timeline: { duration: 8, tracks: KEYS },
  pose: {
    base: {
      pelvis: [0, 0.90, 0.01],
      hips: { up: [0, 1, 0], front: [0, 0, 1] },
      hands: {
        right: { mode: 'free', frame: 'chest', wrist: [-0.30, 0.93, 0.04], finger: [-0.25, -1, 0.05], normal: [1, 0, 0.1], poleUp: [-0.4, 1.1, -0.5] },
        left: { mode: 'free', frame: 'chest', wrist: [0.30, 0.93, 0.04], finger: [0.25, -1, 0.05], normal: [-1, 0, 0.1], poleUp: [0.4, 1.1, -0.5] },
      },
      feet: {
        right: { mode: 'floor', at: [-0.095, 0.0], heading: -6, pitch: 0 },
        left: { mode: 'free', frame: 'hips', ankle: A0, rot: [[[0, 0, 1], P0], [[1, 0, 0], -FLEX + 6]], poleLow: [0.12, 0.5, 0.5] },
      },
      constraints: [
        { type: 'reach', limb: 'rightLeg', angle: 179, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: {
      add: { feet: { left: { ankle: A1, rot: [[[0, 0, 1], P1], [[1, 0, 0], -FLEX + 6]], poleLow: [-0.05, 0.5, 0.5] } } },
      offX: { feet: { left: { ankle: unit(0) } } },
      offY: { feet: { left: { ankle: unit(1) } } },
      offZ: { feet: { left: { ankle: unit(2) } } },
    },
  },
  highlight: { groups: ['adductors'], side: 'left', pulseTrack: 'add', pulseBase: 0.55 },
  camera: { dir: [-0.6, 0.0, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftAnkle', 'rightAnkle', 'leftPalm', 'rightPalm'], pad: 0.16, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 380, height: 600, cx: 430, cy: 590 },
  stillAt: 1.6,
  shadow: { joints: ['rightToe', 'rightAnkle', 'leftAnkle', 'pelvis'],
    blobs: [{ j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }],
    bands: [{ from: 'rightAnkle', to: 'leftAnkle', mid: 'pelvis', rx: 50, ry: 12, a: 0.22, dy: 4, sag: 0.0 }] },
  props: [
    { type: 'cableStack', name: 'pulley', at: [0.86, 0, 0.12], yaw: -90, height: 2.15, pulleyY: 0.14 },
    { type: 'ankleStrap', side: 'left', name: 'strap', toward: 'pulley', up: 0.07 },
    { type: 'cable', from: 'pulley', to: 'strap' },
  ],
  keyFrames: [0.4, 1.6, 3.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
