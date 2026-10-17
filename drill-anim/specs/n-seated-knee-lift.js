// n-seated-knee-lift 坐姿抬膝悬停 (seated knee lift and hover, office chair) · N HipLab 开胯 MVP 新增.
// Sitting tall on a chair, knees 90 deg, feet flat, hands resting on the thighs. Without leaning back, the
// RIGHT knee lifts the thigh 4-5 cm off the seat (the foot leaves the floor), hovers, and lowers slowly; then the LEFT. Hip
// flexor activation for the desk. One cycle (both sides) / 8 s: each side 0.8 s up, 1.8 s hover, 0.9 s down, 0.5 s rest.
// Head +Y, front faces +Z, body left = +X (frame of h-band-hip-ir). No solver: the lifting leg turns about its hip's lateral
// axis (thigh and shin move as one, knee angle kept), the other foot stays planted.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { REST, restPtW, rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, LIFT = 11, SEAT = 0.45, CZ = -0.03;
const PEL = [0, 0.588, 0.02];
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
const sub = (a, b) => a.map((x, i) => x - b[i]), add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const kneeOf = (H, A, Pp) => { const d = sub(A, H), L = Math.hypot(...d), u = mul(d, 1 / L), T = 0.353, S = 0.4098;
  const x = (T * T - S * S + L * L) / (2 * L), r = Math.sqrt(Math.max(0, T * T - x * x)); const c = add(H, mul(u, x));
  let w = sub(Pp, c); w = nrm(sub(w, mul(u, dot(w, u)))); return add(c, mul(w, r)); };
const R = keys([[0, 0], [0.2, 0], [1.0, 1], [2.8, 1], [3.7, 0]], DUR);
const L = keys([[0, 0], [4.2, 0], [5.0, 1], [6.8, 1], [7.7, 0]], DUR);
const lift = s => s === 'right' ? R : L;
const leg = s => { const H = restPtW(hips, PEL, REST.hip(s)), A0 = [sg(s) * 0.12, 0.086, 0.40], K0 = kneeOf(H, A0, [sg(s) * 0.12, 1.2, 0.9]); return { H, A0, K0 }; };
const G = { left: leg('left'), right: leg('right') };
const ank = (s, t) => rotAbout(G[s].A0, G[s].H, [1, 0, 0], -LIFT * lift(s)(t));
const kne = (s, t) => rotAbout(G[s].K0, G[s].H, [1, 0, 0], -LIFT * lift(s)(t));
const pole = (s, t) => { const A = ank(s, t), K = kne(s, t), m = mul(add(A, G[s].H), 0.5); return r4(add(K, mul(sub(K, m), 2))); };
const foot = s => ({ mode: 'free', frame: 'world', ankle: t => r4(ank(s, t)), rot: [[[0, 1, 0], -sg(s) * 4], [[1, 0, 0], t => -LIFT * lift(s)(t)]], pole: t => pole(s, t) });
// hands rest lightly on the thighs near the hips (surface contact; they ride up with the lifting thigh)
const hand = s => ({ mode: 'free', frame: 'world', palmAt: [sg(s) * 0.13, 0.615, 0.22], finger: [0.06 * sg(s), -0.25, 0.96], normal: [0, -1, 0], pole: [0.65 * sg(s), 0.85, 0.15], relax: 1,
  touch: { solve: 'bisect', clear: 0.0008, toward: s === 'left' ? 'leftKnee' : 'rightKnee' } });
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: t => Math.max(R(t), L(t)) });
export default {
  id: 'n-seated-knee-lift', name: '坐姿抬膝悬停', nameEn: 'Seated Knee Lift Hover',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-flexors'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-1, 0.35, 0.55], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 760, cx: 512, cy: 530 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'rightToe', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6, fade: [0.09, 0.2] }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6, fade: [0.09, 0.2] }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 0, height: SEAT, width: 0.44, depth: 0.42 }],
  keyFrames: [0.2, 2.0, 6.0],
  qa: {
    pins: [],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
