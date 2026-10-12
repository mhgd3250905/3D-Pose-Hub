// w-prone-swimmer 俯卧游泳式 (prone swimmers). Prone on the mat, legs long, chest held slightly lifted (upper back extension).
// Straight arms hover just off the mat and sweep in a wide arc from overhead (Y) out to the sides and down to the hips, the arm
// rotating so the palms face up at the hips, then sweep back. 2 reps / 8 s (1.5 s down, 0.5 s hold, 1.5 s up, 0.5 s hold).
// Head points +X, face down (-Y), body left = -Z (frame of scapular-A). Arm geometry per frame -> coordinate tracks (scapular-A).
import { REST, r4, frames, sampler } from '../lib/ss-geo.mjs';
const S = REST.shoulder('left'), AR = 0.4845, DEG = Math.PI / 180;
const TH0 = 28, TH1 = 166, LIFT = 11, DUR = 8;              // arm angle from rest +Y toward +X (out); elevation off the mat
const K = [[0, 0], [1.5, 1], [2.0, 1], [3.5, 0], [4.0, 0], [5.5, 1], [6.0, 1], [7.5, 0]];
const pAt = sampler(K, DUR);
const lift = (v, phi) => [v[0] * Math.cos(phi * DEG), v[1] * Math.cos(phi * DEG), -Math.hypot(v[0], v[1]) * Math.sin(phi * DEG) + v[2]];   // tilt toward rest -Z (= up, prone)
const geo = t => { const p = pAt(t), th = TH0 + (TH1 - TH0) * p, ps = 180 * p;
  const u = [Math.sin(th * DEG), Math.cos(th * DEG), 0], nip = [Math.cos(th * DEG), -Math.sin(th * DEG), 0].map(x => -x);   // in-plane normal (toward the head side)
  const n = [0, 1, 2].map(i => Math.cos(ps * DEG) * [0, 0, 1][i] + Math.sin(ps * DEG) * nip[i]);                            // palm down (+Z rest) -> forward -> up
  const w = lift(u.map(x => x * AR), LIFT), f = lift(u, LIFT), nn = lift(n, LIFT);
  const e = lift(u.map(x => x * 0.26), LIFT);
  return { w: [w[0] + S[0], w[1] + S[1], w[2] + S[2]], f, n: nn, pole: [e[0] + S[0], e[1] + S[1], e[2] + S[2] - 0.2] }; };
const TS = frames(DUR), G = TS.map(geo);
const tr = fn => TS.map((t, k) => [+t.toFixed(4), +fn(G[k]).toFixed(5), 'linear']);
const tracks = { sw: TS.map(t => [+t.toFixed(4), +pAt(t).toFixed(5), 'linear']) };
const deltas = {};
const keyOf = { w: 'wrist', f: 'finger', n: 'normal', pole: 'poleUp' };
for (const [g, key] of Object.entries(keyOf)) for (let i = 0; i < 3; i++) {
  const nm = g + 'xyz'[i]; tracks[nm] = tr(G0 => G0[g][i]);
  const L = [0, 0, 0], R = [0, 0, 0]; L[i] = 1; R[i] = i === 0 ? -1 : 1;           // right arm = mirror in rest x
  deltas[nm] = { hands: { left: { [key]: L }, right: { [key]: R } } };
}
const Z = [0, 0, 0], hand0 = { mode: 'free', frame: 'chest', wrist: Z, finger: Z, normal: Z, poleUp: Z };
export default {
  id: 'w-prone-swimmer', name: '俯卧游泳式', nameEn: 'Prone Swimmers',
  timeline: { duration: DUR, tracks },
  pose: {
    base: {
      pelvis: [-0.45, 0.141, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 0]] },
      chest: { waist: [[[0, 0, 1], 9]] },
      hands: { left: { ...hand0 }, right: { ...hand0 } },
      feet: {
        left: { mode: 'free', frame: 'hips', ankle: [0.083, 0.093, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [0.09, 0.5, -0.6] },
        right: { mode: 'free', frame: 'hips', ankle: [-0.083, 0.093, 0.059], rot: [[[0, 0, 1], -80]], poleLow: [-0.09, 0.5, -0.6] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas,
  },
  highlight: { groups: ['scapular', 'erectors'], side: 'both', pulseTrack: 'sw', pulseBase: 0.35 },
  camera: { dir: [-0.3, 0.75, -1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 0.0 },
  frame: { mode: 'fit', width: 880, cx: 520, cy: 540 },
  stillAt: 0.0,
  shadow: { joints: ['pelvis', 'shoulderCenter', 'leftPalm', 'rightPalm'], blobs: [{ j: 'shoulderCenter', rx: 110, ry: 30, a: 0.4 }, { j: 'pelvis', rx: 90, ry: 26, a: 0.45 }], bands: [] },
  props: [{ type: 'mat', at: [-0.3, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.0, 0.75, 1.75],
  qa: {
    pins: [],
    straight: [{ j: 'elbow.right', min: 175 }, { j: 'elbow.left', min: 175 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'handL|thighL', 'handR|thighR'],
  },
};
