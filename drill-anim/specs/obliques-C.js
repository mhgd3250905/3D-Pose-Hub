// obliques-C 绳索高位伐木 (high-to-low cable woodchop). Wide athletic stance, knees soft. A D-handle on a HIGH pulley to the body's
// right, held with BOTH hands stacked on the bar (right hand nearer the pulley-side end, left hand next to it, both closed power grips:
// the right via dHandle, the left via the geometry-free 'grip' prop from #23). The arms stay long and in front of the chest; the
// diagonal comes from the trunk: hips and chest turn from the pulley side (right, up) across to the left hip (down).
// The trailing (right, pulley-side) foot pivots on the ball as the trunk turns: heel turns out ~35 deg and lifts ~12 deg, ball fixed.
// 'chop' 0 = hands high by the right shoulder, 1 = hands low outside the left hip.
// 2 reps / 8 s: 1.2 s chop, 0.8 s hold, 1.2 s return, 0.8 s pause.
// Every frame is keyed (linear between frames): chop/bow follow the v1 cos-eased key times; the left hand's 9 scalars (wrist, finger,
// normal in the chest frame) are solved per frame so its grip cylinder lies exactly on the handle axis next to the right hand; the
// right foot's heading/pitch/at are keyed per frame for the ball pivot.
// Head points +Y, front faces +Z, body left = +X (rest frame). Cable column to the right-front (-X, +Z).
const FPS = 30, N = 240;
const SHR = [-0.188, 1.37, 0];
const HI = [0.03, 1.56, 0.30], LO = [0.03, 1.12, 0.30];        // right wrist in the chest frame: start (high), end (low)
const BOW = [0, 0, 0.07];                                         // chest-frame bow at mid-path so the long arms swing on an arc
const SEP = 0.11;                                                // left grip centre = right grip centre - SEP along the handle axis
// grip cylinders in the engine's finger/normal hand frame (tools: gripframe.js on the rest rig; same data as assets/grip-*.json)
const GR = { c: [-0.01646, 0.09267, 0.03555], a: [0.94419, 0.29495, 0.14666], pal: [0.4422, -0.812, -0.381] }, GL = { c: [0.01646, 0.09267, 0.03555], a: [-0.94419, 0.29495, 0.14666], pal: [-0.4422, -0.812, -0.381] };
const v3 = { add: (a, b, k = 1) => a.map((x, i) => x + k * b[i]), dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrm: a => { const n = Math.hypot(...a); return a.map(x => x / n); } };
const fing = w => v3.nrm(w.map((x, i) => x - SHR[i]));
const basis = (f, n) => { f = v3.nrm(f); const z = v3.nrm(v3.add(n, f, -v3.dot(n, f))); return [v3.cross(f, z), f, z]; };   // columns
const mul = (B, x) => [0, 1, 2].map(i => B[0][i] * x[0] + B[1][i] * x[1] + B[2][i] * x[2]);
const r4 = a => a.map(x => +x.toFixed(4));
// left hand params that put the left grip cylinder on axis A (reversed: mirrored hand), centre C, palm toward PAL
const solveL = (A, C, PAL) => { const a = v3.nrm(GL.a), pa = v3.nrm(v3.add(GL.pal, a, -v3.dot(GL.pal, a))), Ml = [a, pa, v3.cross(a, pa)];
  const Aw = v3.nrm(A), Pw = v3.nrm(v3.add(PAL, Aw, -v3.dot(PAL, Aw))), Mw = [Aw, Pw, v3.cross(Aw, Pw)];
  const R = x => { const l = [v3.dot(Ml[0], x), v3.dot(Ml[1], x), v3.dot(Ml[2], x)]; return mul(Mw, l); };   // R = Mw Ml^T
  return { wrist: v3.add(C, R(GL.c), -1), finger: R([0, 1, 0]), normal: R([0, 0, 1]) }; };
const leftFor = (w, f) => { const B = basis(f, [1, 0, 0]), C = v3.add(w, mul(B, GR.c)), A = mul(B, GR.a), P = mul(B, GR.pal);
  return solveL(A.map(x => -x), v3.add(C, A, -SEP), P); };
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const seg = (keys, t) => { for (let i = 0; i < keys.length - 1; i++) { const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; if (t >= ta && t < tb) return va + (vb - va) * cosE((t - ta) / (tb - ta)); } return keys[keys.length - 1][1]; };
const rep = s => [[s + 0.4, 0], [s + 1.6, 1], [s + 2.4, 1], [s + 3.6, 0]];
const bowK = s => [[s + 0.4, 0], [s + 1.0, 1], [s + 1.6, 0], [s + 2.4, 0], [s + 3.0, 1], [s + 3.6, 0]];
const CK = [[0, 0], ...rep(0), ...rep(4), [8, 0]], BK = [[0, 0], ...bowK(0), ...bowK(4), [8, 0]];
const FH = HI.map((x, i) => x), FR0 = fing(HI), FR1 = fing(LO);
const L0 = leftFor(HI, FR0);
// right foot ball pivot: heading -10 -> +25 deg, pitch 0 -> 12 deg (heel up), ankle slides so the ball (BALL m ahead) stays put
const RF = [-0.22, 0.0], H0 = -10, H1 = 25, PIT = 12, BALL = 0.14, DEGR = Math.PI / 180;
const ballX = RF[0] + BALL * Math.sin(H0 * DEGR), ballZ = RF[1] + BALL * Math.cos(H0 * DEGR);
const TR = { chop: [], bow: [], lw0: [], lw1: [], lw2: [], lf0: [], lf1: [], lf2: [], ln0: [], ln1: [], ln2: [], rfh: [], rfp: [], rfx: [], rfz: [] };
for (let f = 0; f < N; f++) { const t = f / FPS, q = seg(CK, t), b = seg(BK, t);
  const w = v3.add(v3.add(HI, LO.map((x, i) => x - HI[i]), q), BOW, b), fr = v3.add(FR0, FR1.map((x, i) => x - FR0[i]), q);
  const L = leftFor(w, fr), k = (n, v) => TR[n].push([t, +v.toFixed(5), 'linear']);
  k('chop', q); k('bow', b);
  [0, 1, 2].forEach(i => { k('lw' + i, L.wrist[i] - L0.wrist[i]); k('lf' + i, L.finger[i] - L0.finger[i]); k('ln' + i, L.normal[i] - L0.normal[i]); });
  const h = H0 + (H1 - H0) * q, hr = h * DEGR; k('rfh', h - H0); k('rfp', PIT * q);
  k('rfx', ballX - BALL * Math.sin(hr) - RF[0]); k('rfz', ballZ - BALL * Math.cos(hr) - RF[1]); }
const R = w => ({ wrist: w, finger: r4(fing(w)) });
const unit = (base, i) => base.map((x, j) => +(x + (i === j ? 1 : 0)).toFixed(5));
const LD = {}; [0, 1, 2].forEach(i => { LD['lw' + i] = { hands: { left: { wrist: unit(r4(L0.wrist), i) } } };
  LD['lf' + i] = { hands: { left: { finger: unit(r4(L0.finger), i) } } }; LD['ln' + i] = { hands: { left: { normal: unit(r4(L0.normal), i) } } }; });
export default {
  id: 'obliques-C', name: '绳索高位伐木', nameEn: 'High-to-Low Cable Woodchop',
  timeline: { duration: 8, tracks: TR },
  pose: {
    base: {
      pelvis: [0, 0.89, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[0, 1, 0], -22]] },
      chest: { body: [[[0, 1, 0], -24], [[1, 0, 0], 4]] },
      hands: {
        right: { mode: 'free', frame: 'chest', relax: 0, ...R(HI), normal: [1, 0, 0], poleUp: [-0.45, 1.05, 0.15] },
        // the left hand grips the same handle next to the right hand (solved per frame, see LD / lw* lf* ln* tracks)
        left: { mode: 'free', frame: 'chest', relax: 0, wrist: r4(L0.wrist), finger: r4(L0.finger), normal: r4(L0.normal), poleUp: [0.45, 1.05, 0.15] },
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
      chop: { hips: { rot: [[[0, 1, 0], 20]] }, chest: { body: [[[0, 1, 0], 22], [[1, 0, 0], 10]] }, hands: { right: R(LO) } },
      bow: { hands: { right: { wrist: r4(v3.add(HI, BOW)) } } },
      ...LD,
      rfh: { feet: { right: { heading: -9 } } }, rfp: { feet: { right: { pitch: 1 } } },
      rfx: { feet: { right: { at: [0.78, 0] } } }, rfz: { feet: { right: { at: [-0.22, 1] } } },
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
    { type: 'dHandle', side: 'right', name: 'handle', toward: 'pulley', shift: +(0.01 - SEP / 2).toFixed(4), len: 0.25, lean: 0.25 },
    { type: 'grip', side: 'left' },
    { type: 'cable', from: 'pulley', to: 'handle' },
  ],
  keyFrames: [0.4, 1.0, 1.6],
  qa: {
    pins: [{ c: 'footL', when: 'always' }],   // the right foot pivots on its ball (heading/at keyed per frame)
    straight: [],
    // hands stacked on one handle: the hands and forearms sit side by side (mesh hand_clip still checks hand vs hand, tol 0.5 mm);
    // the capsule hulls (forearm r34 mm) of the two forearms overlap by up to ~15 mm there, so those pairs are skipped.
    allowContact: ['handL|handR', 'forearmL|forearmR', 'handL|forearmR', 'handR|forearmL'],
  },
};
