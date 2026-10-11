// hip-abductors-B 仰卧弹力带 V 字开腿 (supine banded V-leg abduction). Supine on the mat, head -X, face up (+Y),
// body left = -Z (frame of abs-A). Both legs straight and raised to vertical (hip flexion 90 deg), a mini loop band round the
// ankles. 'open' spreads the straight legs into a wide V (each leg AB deg out) against the band, holds 2 s, and closes slowly.
// Each ankle moves on the circle round its hip (chord + 'bow' sagitta track), so the knees stay locked the whole way.
// Arms lie on the mat out to the sides, palms down; low back stays on the mat. 2 reps / 8 s.
const HIPX = 0.081543, HIPY = 0.85197, HIPZ = 0.00565;
const TH = 0.35292, SH = 0.40981, REACH = Math.sqrt(TH * TH + SH * SH + 2 * TH * SH * Math.cos(2 * Math.PI / 180)); // 178 deg knee
const FL = 88, AB = 40;
// hips rest frame: leg flexed FL deg forward (toward +Z), then abducted ab deg out to its own side (sg = +1 left, -1 right)
const ank = (sg, ab) => { const f = FL * Math.PI / 180, a = ab * Math.PI / 180;
  const d = [sg * Math.sin(a), -Math.cos(f) * Math.cos(a), Math.sin(f) * Math.cos(a)];
  return [+(sg * HIPX + REACH * d[0]).toFixed(4), +(HIPY + REACH * d[1]).toFixed(4), +(HIPZ + REACH * d[2]).toFixed(4)]; };
const bowOf = sg => { const a = ank(sg, 0), b = ank(sg, AB), m = ank(sg, AB / 2); return a.map((v, i) => +(v + m[i] - (a[i] + b[i]) / 2).toFixed(4)); };
const DUR = 8, K = [[0, 0], [0.3, 0], [1.2, 1], [3.2, 1], [4.0, 0], [4.3, 0], [5.2, 1], [7.2, 1], [8.0, 0]];
const pAt = t => { for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return 0; };
const TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const P = TS.map(t => [+t.toFixed(4), +pAt(t).toFixed(5), 'linear']);
const BOW = TS.map(t => { const p = pAt(t); return [+t.toFixed(4), +(4 * p * (1 - p)).toFixed(5), 'linear']; });
const foot = sg => ({ mode: 'free', frame: 'hips', ankle: ank(sg, 0), rot: [[[0, 0, 1], -FL], [[1, 0, 0], 0]], poleLow: [sg * 0.2, 1.3, 0.9] });
// arms on the mat, ~50 deg out from the trunk, palms down (chest rest frame; shoulder joint ~(+-0.18, 1.37, -0.004))
const AR = 0.4847, AO = 35 * Math.PI / 180;
const hand = sg => ({ mode: 'free', frame: 'chest', wrist: [+(sg * (0.18 + AR * Math.sin(AO))).toFixed(4), +(1.37 - AR * Math.cos(AO)).toFixed(4), -0.075],
  finger: [sg * Math.sin(AO), -Math.cos(AO), 0.0], normal: [0, 0, -1], poleUp: [sg * 0.5, 1.3, 0.4] });
export default {
  id: 'hip-abductors-B', name: '仰卧弹力带 V 字开腿', nameEn: 'Supine Banded V-Leg Abduction',
  timeline: { duration: DUR, tracks: { open: P, bow: BOW } },
  pose: {
    base: {
      pelvis: [0.0, 0.115, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], 0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: { left: hand(1), right: hand(-1) },
      feet: { left: foot(1), right: foot(-1) },
      constraints: [
        { type: 'joint', joint: 'waist', axis: [0, 1, 0], value: 0.125, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.130, weight: 0.4 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 3, py: 0.5, h0: 0.02 } },
    },
    deltas: {
      open: { feet: { left: { ankle: ank(1, AB), rot: [[[0, 0, 1], -FL], [[1, 0, 0], -AB]] }, right: { ankle: ank(-1, AB), rot: [[[0, 0, 1], -FL], [[1, 0, 0], AB]] } } },
      bow: { feet: { left: { ankle: bowOf(1) }, right: { ankle: bowOf(-1) } } },
    },
  },
  highlight: { groups: ['hip-abductors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-0.8, 0.6, 0.08], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.7, drift: 5, at: 2.2 },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 540 },
  stillAt: 2.2,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 80, ry: 14, a: 0.5 }],
    bands: [] },
  props: [
    { type: 'mat', at: [-0.30, 0, 0], size: [1.83, 0.61, 0.006] },
    { type: 'band', from: { bone: 'rightFoot', offset: [0, 0.035, 0.03] }, to: { bone: 'leftFoot', offset: [0, 0.035, 0.03] }, r: 0.007, sag: 0.0, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightFoot', offset: [0, 0.035, -0.035] }, to: { bone: 'leftFoot', offset: [0, 0.035, -0.035] }, r: 0.007, sag: 0.0, colour: '#7a4a32' },
  ],
  keyFrames: [0.15, 0.8, 2.2],
  qa: {
    pins: [],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
