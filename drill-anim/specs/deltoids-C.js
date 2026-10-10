// deltoids-C 地雷杆半跪单臂推举 (half-kneeling single-arm landmine press). Right knee down (shin on the floor, toes tucked), left foot
// forward (both knees ~90 deg), trunk tall. The RIGHT hand grips the end of a landmine bar whose pivot sits on the floor in front.
// 'press' 0 = grip in front of the right shoulder (elbow down and slightly out), 1 = arm locked straight up and forward along the bar.
// The grip travels on the bar's sphere about the pivot (great-circle arc, exact per frame), the hand turns with the bar so the grip
// axis stays on the bar. 2 reps / 8 s: 1.2 s press, 0.8 s lockout, 1.2 s lower, 0.8 s pause. Left hand rests relaxed on the left thigh.
// Head points +Y, front faces +Z, body left = +X (world == rest axes; the body does not move).
const DEG = Math.PI / 180;
const v = { add: (a, b, k = 1) => a.map((x, i) => x + k * b[i]), sub: (a, b) => a.map((x, i) => x - b[i]), dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: a => Math.hypot(...a), unit: a => { const n = Math.hypot(...a); return a.map(x => x / n); } };
const r4 = a => a.map(x => +x.toFixed(5));
// grip, measured in the hand frame (F = finger, N = palm normal, S = F x N) for the baked right power grip: axis g, centre c (from the wrist, incl. shift 0.01)
const gL = v.unit([0.2947, 0.1471, 0.9442]), cL = [0.0923, 0.0357, -0.0167];
// hand frame for a bar direction d (pivot -> grip): rotate g onto d, then roll about d so the palm faces as close to n0 as possible
const frameFor = (d, n0) => {
  // orthonormal local basis around g: g, e1 = unit(eN - (eN.g) g), e2 = g x e1 ; world basis around d: d, w1 = unit(n0 - (n0.d) d), w2 = d x w1
  const e1 = v.unit(v.sub([0, 1, 0], gL.map(x => x * gL[1]))), e2 = v.cross(gL, e1);
  const w1 = v.unit(v.sub(n0, d.map(x => x * v.dot(n0, d)))), w2 = v.cross(d, w1);
  const R = x => { const a = v.dot(x, gL), b = v.dot(x, e1), c = v.dot(x, e2); return [0, 1, 2].map(i => a * d[i] + b * w1[i] + c * w2[i]); };
  return { F: R([1, 0, 0]), N: R([0, 1, 0]), S: R([0, 0, 1]), R };
};
let PIV = [-0.04, 0, 1.50], PIVT = v.add(PIV, [0, 0.055, 0]);         // bar pivot (top of the yoke); z solved below so start and end grips are equidistant
const SH = [-0.188, 0.930, 0.050];                                     // right shoulder (kneeling, measured)
const UA = 0.25678, FA = 0.22805, reach = ang => Math.sqrt(UA * UA + FA * FA - 2 * UA * FA * Math.cos(ang * DEG));
const N0 = v.unit([0.55, 0.15, 0.82]);                                 // palm faces forward and in
const W0 = [-0.16, 0.76, 0.23];                                     // wrist at the start (in front of the shoulder)
const U1 = v.unit([0.10, 0.55, 0.83]);                                 // locked-out arm direction
const W1 = v.add(SH, U1, reach(179.5));
const grip = (w, d) => { const f = frameFor(d, N0); return v.add(w, f.R(cL)); };
const solveD = w => { let d = v.unit(v.sub(w, PIVT)); for (let i = 0; i < 8; i++) d = v.unit(v.sub(grip(w, d), PIVT)); return d; };
let D0, C0, D1, C1;
for (let it = 0; it < 8; it++) { D0 = solveD(W0); C0 = grip(W0, D0); D1 = solveD(W1); C1 = grip(W1, D1);
  const y = PIVT[1], x = PIVT[0], n2 = a => a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
  const z = (n2(C1) - n2(C0) - 2 * x * (C1[0] - C0[0]) - 2 * y * (C1[1] - C0[1])) / (2 * (C1[2] - C0[2]));
  PIV = [PIV[0], 0, +z.toFixed(4)]; PIVT = v.add(PIV, [0, 0.055, 0]); }
const L0 = v.len(v.sub(C0, PIVT)), L1 = v.len(v.sub(C1, PIVT)), LG = (L0 + L1) / 2;   // the grip stays on the sphere |C - pivot| = LG
const slerp = (a, b, q) => { const om = Math.acos(Math.min(1, v.dot(a, b))), s = Math.sin(om); return om < 1e-6 ? a : [0, 1, 2].map(i => (Math.sin((1 - q) * om) * a[i] + Math.sin(q * om) * b[i]) / s); };
const wristAt = q => { const d = slerp(D0, D1, q), C = v.add(PIVT, d, LG), f = frameFor(d, N0); return { w: v.sub(C, f.R(cL)), f }; };
const E0 = wristAt(0), E1 = wristAt(1);
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const qAt = t => { const r = t % 4; return r < 0.4 ? 0 : r < 1.6 ? cosE((r - 0.4) / 1.2) : r < 2.4 ? 1 : r < 3.6 ? 1 - cosE((r - 2.4) / 1.2) : 0; };
const KEYS = { press: [], offX: [], offY: [], offZ: [] };
for (let k = 0; k < 240; k++) { const t = k / 30, q = qAt(t), W = wristAt(q).w;
  KEYS.press.push([t, +q.toFixed(5), 'linear']);
  ['offX', 'offY', 'offZ'].forEach((n, i) => KEYS[n].push([t, +(W[i] - (E0.w[i] + q * (E1.w[i] - E0.w[i]))).toFixed(5), 'linear'])); }
const unit = i => r4(E0.w.map((x, j) => x + (i === j ? 1 : 0)));
export const _debug = { L0, L1, LG, C0, C1, D0, D1, PIV };
export default {
  id: 'deltoids-C', name: '地雷杆半跪单臂推举', nameEn: 'Half-Kneeling Single-Arm Landmine Press',
  timeline: { duration: 8, tracks: KEYS },
  pose: {
    base: {
      pelvis: [0, 0.458, 0.065],
      hips: { up: [0, 1, 0], front: [0, 0, 1] },
      hands: {
        right: { mode: 'free', frame: 'world', relax: 0, wrist: r4(E0.w), finger: r4(E0.f.F), normal: r4(E0.f.N), pole: [-0.42, 0.62, 0.12] },
        left: { mode: 'free', frame: 'world', wrist: [0.13, 0.56, 0.20], finger: [0.0, -0.25, 1], normal: [0, -1, -0.15], pole: [0.45, 0.6, -0.1], touch: { clear: 0.003, from: 0 } },
      },
      feet: {
        left: { mode: 'floor', at: [0.12, 0.47], heading: 3, pitch: 0 },
        right: { mode: 'free', frame: 'world', ankle: [-0.09, 0.238, -0.31], rot: [[[1, 0, 0], 80]], pole: [-0.085, 0.0, 0.40] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      press: { hands: { right: { wrist: r4(E1.w), finger: r4(E1.f.F), normal: r4(E1.f.N), pole: [-0.45, 0.85, 0.25] } } },
      offX: { hands: { right: { wrist: unit(0) } } },
      offY: { hands: { right: { wrist: unit(1) } } },
      offZ: { hands: { right: { wrist: unit(2) } } },
    },
  },
  highlight: { groups: ['deltoids'], side: 'right', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [-1, 0.14, 0.42], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'rightKnee', 'leftKnee'], pad: 0.12, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 600, height: 700, cx: 470, cy: 560 },
  stillAt: 1.6,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightKnee', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'rightToe', to: 'leftAnkle', mid: 'rightKnee', rx: 70, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'landmine', side: 'right', pivot: PIV, shift: 0.01 }],
  keyFrames: [0.4, 1.6, 3.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.press>0.999' }],
    allowContact: ['handL|thighL'],
  },
};
