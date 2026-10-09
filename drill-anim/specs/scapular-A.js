// scapular-A 俯卧 Y-T-W 举 (prone Y-T-W raise). Prone on the mat, head +X, face down (-Y), body left = -Z (same frame as
// forearms-A); legs straight with the toes pointed. One 12 s loop = Y, T, W (4 s each): the arms lift off the mat (scapulae
// set), hold, lower, then slide along the mat into the next letter. Arm geometry is computed here per frame and fed through
// "coordinate tracks" (base 0, delta = unit vector, so the track value IS the coordinate; deltas add), so the straight arms keep
// their exact length on the arc and the W bends only at the elbow.
const S = [0.1879, 1.3702, -0.0042], UA = 0.2568, FA = 0.2280 * 0.9995;   // rest shoulder; upper arm; forearm (≈ straight 175°+)
const DEG = Math.PI / 180;
const LET = { Y: [40, 40, -12.4], T: [90, 90, -10.25], W: [125, 25, -15.2] };   // [.., .., arm elevation on the mat (hand just on the mat)]              // [upper arm, forearm] angle from rest +Y (head) toward +X (out)
const PH0 = -12.4, PH1 = 9;                                             // arm elevation: on the mat / lifted (deg toward rest -Z = back)
const DUR = 12, FPS = 30;
const SEQ = [['Y', 0], ['T', 4], ['W', 8]];
// slides between letters lift the hands on a small arc (2.2° sin) so they skim the mat
const sm = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const state = t => {   // -> [thetaU, thetaF, liftPhi]
  const i = Math.floor(t / 4), L = SEQ[i][0], N = SEQ[(i + 1) % 3][0], u = t - 4 * i;
  let lift = 0; if (u < 0.3) lift = 0; else if (u < 1.1) lift = sm((u - 0.3) / 0.8); else if (u < 2.3) lift = 1; else if (u < 3.1) lift = 1 - sm((u - 2.3) / 0.8);
  const k = u < 3.1 ? 0 : sm((u - 3.1) / 0.9);
  const a = LET[L], b = LET[N]; const p0 = a[2] + (b[2] - a[2]) * k + 2.2 * Math.sin(Math.PI * k); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, p0 + (PH1 - p0) * lift];
};
const rot = (v, phi) => { const r = Math.hypot(v[0], v[1]); return [v[0] * Math.cos(phi * DEG), v[1] * Math.cos(phi * DEG), -Math.hypot(v[0], v[1]) * Math.sin(phi * DEG) + v[2]]; };
const geo = t => { const [tu, tf, ph] = state(t);
  const u = [Math.sin(tu * DEG), Math.cos(tu * DEG), 0], f = [Math.sin(tf * DEG), Math.cos(tf * DEG), 0];
  const el = rot(u.map(x => x * UA), ph), wr = rot(u.map(x => x * UA).map((x, i) => x + f[i] * FA), ph);
  const fin = rot(f, ph), nrm = [-f[1], f[0], 0];               // palm faces along the in-plane normal (thumb up)
  const pole = [el[0] + 0.0 * u[0], el[1], el[2] - 0.15];         // elbow pole: behind the elbow (rest -Z = toward the ceiling)
  return { w: wr.map((x, i) => x + S[i]), e: [el[0] + S[0], el[1] + S[1], pole[2] + S[2] + (tu === tf ? 0 : 0)], fin, nrm }; };
const TS = Array.from({ length: DUR * FPS }, (_, k) => k / FPS), G = TS.map(geo);
const tr = fn => TS.map((t, k) => [+t.toFixed(4), +fn(G[k]).toFixed(5), 'linear']);
const tracks = { wx: tr(g => g.w[0]), wy: tr(g => g.w[1]), wz: tr(g => g.w[2]), fx: tr(g => g.fin[0]), fy: tr(g => g.fin[1]), fz: tr(g => g.fin[2]),
  nx: tr(g => g.nrm[0]), ny: tr(g => g.nrm[1]), ex: tr(g => g.e[0]), ey: tr(g => g.e[1]), ez: tr(g => g.e[2]),
  sa: TS.map(t => { const [u, f] = state(t); return [+t.toFixed(4), Math.abs(u - f) < 0.5 ? 1 : 0, 'hold']; }) };   // QA marker only (no delta): 1 = straight-arm letter (Y, T, Y<->T)
const Z = [0, 0, 0], h = (k, s) => { const v = [0, 0, 0]; v[k] = s; return v; };
const D = (key, k) => ({ hands: { left: { [key]: h(k, 1) }, right: { [key]: h(k, k === 0 ? -1 : 1) } } });
const deltas = { wx: D('wrist', 0), wy: D('wrist', 1), wz: D('wrist', 2), fx: D('finger', 0), fy: D('finger', 1), fz: D('finger', 2),
  nx: { hands: { left: { normal: [1, 0, 0] }, right: { normal: [-1, 0, 0] } } }, ny: { hands: { left: { normal: [0, 1, 0] }, right: { normal: [0, 1, 0] } } },   // mirror x only
  ex: D('poleUp', 0), ey: D('poleUp', 1), ez: D('poleUp', 2) };
const hand0 = { mode: 'free', frame: 'chest', wrist: Z, finger: Z, normal: Z, poleUp: Z };
export default {
  id: 'scapular-A', name: '俯卧 Y-T-W 举', nameEn: 'Prone Y-T-W Raise',
  timeline: { duration: DUR, tracks },
  pose: {
    base: {
      pelvis: [-0.45, 0.132, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 0]] },
      hands: { left: { ...hand0 }, right: { ...hand0 } },
      feet: {
        left: { mode: 'free', frame: 'hips', ankle: [0.083, 0.09, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [0.09, 0.5, -0.6] },
        right: { mode: 'free', frame: 'hips', ankle: [-0.083, 0.09, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [-0.09, 0.5, -0.6] },
      },
      constraints: [
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.132, weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.172, weight: 1 },
      ],
      solve: { vars: ['py', 'h0'], reg: { py: 0.3, h0: 0.01 } },
    },
    deltas,
  },
  highlight: { groups: ['scapular'], side: 'both', pulseAt: [1.7, 5.7, 9.7], pulseWidth: 0.8, pulseBase: 0.3 },
  camera: { dir: [-0.6, 1, 0], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.1, k: 0.8, drift: 0.9, at: 5.7 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 5.7,
  shadow: { joints: ['pelvis', 'shoulderCenter', 'leftPalm', 'rightPalm'], blobs: [{ j: 'shoulderCenter', rx: 110, ry: 30, a: 0.45 }, { j: 'pelvis', rx: 90, ry: 26, a: 0.45 }], bands: [] },
  props: [{ type: 'mat', at: [-0.5, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [1.7, 5.7, 9.7],
  qa: {
    pins: [],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.sa>0.5' }, { j: 'elbow.left', min: 176, when: 'params.sa>0.5' }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
