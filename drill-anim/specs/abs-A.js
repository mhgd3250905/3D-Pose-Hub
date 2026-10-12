// abs-A 空心体支撑 (hollow body hold). Supine on the mat, head -X, face up (+Y), body left = -Z (same frame as glute-max-A).
// Arms straight overhead by the ears (rigid with the chest), legs straight and together. 'hollow' 0..1 curls the upper torso
// off the mat (waist bend) while both straight legs rise ~22 deg; the low back stays pressed into the mat (waist joint pinned in
// height, pelvis tilt solved). The leg ankles move on the arc around the hip ('bow' track adds the sagitta back).
// 2 reps / 8 s: 1.0 s up, 1.8 s hold, 0.8 s down, 0.4 s rest.
const HIP = [0.852, 0.0057], LEG = [-0.762, -0.0243];      // rest hip (y, z) and hip->ankle (y, z), rest hips frame
const ank = (x, th) => { const r = th * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [x, +(HIP[0] + LEG[0] * c + LEG[1] * s).toFixed(4), +(HIP[1] + LEG[1] * c - LEG[0] * s).toFixed(4)]; };
const T0 = 2, T1 = 22, CURL = -30;
const AR = 0.4847, AA0 = -3, AA1 = 6;                       // shoulder->wrist reach (≈177° elbow); arm angle off the torso line: on the mat / raised in front of the ears
const wr = (x, a) => { const r = a * Math.PI / 180; return [x, +(1.3702 + AR * Math.cos(r)).toFixed(4), +(-0.0042 + AR * Math.sin(r)).toFixed(4)]; };
const bowW = x => { const a = wr(x, AA0), b = wr(x, AA1), m = wr(x, (AA0 + AA1) / 2); return a.map((v, i) => +(v + m[i] - (a[i] + b[i]) / 2).toFixed(4)); };
const hand = (x, a) => ({ mode: 'free', frame: 'chest', wrist: wr(x, a), finger: [0, 1, 0.12], normal: [0, 0, 1], poleUp: [Math.sign(x) * 0.6, 1.6, -0.3] });
const DUR = 8, K = [[0, 0], [0.3, 0], [1.3, 1], [3.1, 1], [3.9, 0], [4.3, 0], [5.3, 1], [7.1, 1], [7.9, 0]];
const pAt = t => { for (let i = 0; i < K.length; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1] || [DUR, K[0][1]];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return K[0][1]; };
const TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const P = TS.map(t => [+t.toFixed(4), +pAt(t).toFixed(5), 'linear']);
const BOW = TS.map(t => { const p = pAt(t); return [+t.toFixed(4), +(4 * p * (1 - p)).toFixed(5), 'linear']; });
const bowOf = x => { const a = ank(x, T0), b = ank(x, T1), m = ank(x, (T0 + T1) / 2); return a.map((v, i) => +(v + m[i] - (a[i] + b[i]) / 2).toFixed(4)); };
const foot = (x, th, pl) => ({ mode: 'free', frame: 'hips', ankle: ank(x, th), rot: [[[1, 0, 0], -th]], poleLow: pl });
export default {
  id: 'abs-A', name: '空心体支撑', nameEn: 'Hollow Body Hold',
  timeline: { duration: DUR, tracks: { hollow: P, bow: BOW } },
  pose: {
    base: {
      pelvis: [0.0, 0.115, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], 0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: {
        left: hand(0.19, AA0), right: hand(-0.19, AA0),
      },
      feet: { left: foot(0.075, T0, [0.09, 0.5, 0.6]), right: foot(-0.075, T0, [-0.09, 0.5, 0.6]) },
      constraints: [
        { type: 'joint', joint: 'waist', axis: [0, 1, 0], value: 0.125, weight: 1 },      // low back on the mat
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.137, weight: 0.4 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 3, py: 0.5, h0: 0.02 } },
    },
    deltas: {
      hollow: { constraints: [{ value: 0.113 }, { value: 0.125 }], chest: { waist: [[[0, 0, 1], CURL]] }, hands: { left: { wrist: wr(0.19, AA1), normal: [-1, 0, 0.15] }, right: { wrist: wr(-0.19, AA1), normal: [1, 0, 0.15] } }, feet: { left: { ankle: ank(0.075, T1), rot: [[[1, 0, 0], -T1]] }, right: { ankle: ank(-0.075, T1), rot: [[[1, 0, 0], -T1]] } } },
      bow: { feet: { left: { ankle: bowOf(0.075) }, right: { ankle: bowOf(-0.075) } }, hands: { left: { wrist: bowW(0.19) }, right: { wrist: bowW(-0.19) } } },
    },
  },
  highlight: { groups: ['abs'], side: 'both', pulseAt: [2.2, 6.2], pulseWidth: 0.9, pulseBase: 0.3 },
  camera: { dir: [0.15, 0.38, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee'], pad: 0.12, k: 0.7, drift: 0.9, at: 2.2 },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 560 },
  stillAt: 2.2,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'leftAnkle', 'rightAnkle', 'head'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 12, a: 0.22, dy: 4, sag: 0.6 }] },
  props: [{ type: 'mat', at: [-0.12, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.15, 0.8, 2.2],
  qa: {
    pins: [],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }, { j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    allowContact: ['upperArmR|head', 'upperArmL|head', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
