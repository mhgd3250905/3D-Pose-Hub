// h-band-hip-ir 坐椅弹力带髋内旋 (seated banded hip internal rotation) · H 居家开胯系列.
// Sitting tall on a dining chair, knees 90 deg, feet flat. A light band runs from the RIGHT ankle across to the chair's front
// left leg. Keeping the right knee still (it points straight ahead, thigh on the seat), the right foot swings OUT to the side
// against the band - the thigh turns inward in its socket (hip internal rotation, glute med/min and the deep rotators
// working at end range) - hold, and return slowly. Hands rest on the thighs. 2 reps / 8 s: 1.2 s out, 0.8 s hold, 1.4 s back.
// Head +Y, front faces +Z, body left = +X. No solver: the right ankle orbits the right hip-knee line, the knee stays put.
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { REST, restPtW, rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, ROT = 36, SEAT = 0.45, CZ = -0.03;
const PEL = [0, 0.588, 0.02];
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
const sub = (a, b) => a.map((x, i) => x - b[i]), add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const kneeOf = (H, A, Pp) => { const d = sub(A, H), L = Math.hypot(...d), u = mul(d, 1 / L), T = 0.353, S = 0.4098;
  const x = (T * T - S * S + L * L) / (2 * L), r = Math.sqrt(Math.max(0, T * T - x * x)); const c = add(H, mul(u, x));
  let w = sub(Pp, c); w = nrm(sub(w, mul(u, dot(w, u)))); return add(c, mul(w, r)); };
const HR = restPtW(hips, PEL, REST.hip('right'));
const A0 = [-0.12, 0.086, 0.40];
const KR = kneeOf(HR, A0, [-0.12, 1.2, 0.9]);
const ax = sub(KR, HR);
const SGN = rotAbout(A0, KR, ax, 10)[0] < A0[0] ? 1 : -1;      // positive turns the foot out (toward -X) = internal rotation
const p = keys([[0, 0], [0.3, 0], [1.5, 1], [2.3, 1], [3.7, 0], [4.3, 0], [5.5, 1], [6.3, 1], [7.7, 0]], DUR);
const ank = t => rotAbout(A0, KR, ax, SGN * ROT * p(t));
const poleR = t => { const A = ank(t), m = mul(add(A, HR), 0.5); return r4(add(KR, mul(sub(KR, m), 2))); };
const thighHand = (s, x, y = 0.61) => ({ mode: 'free', frame: 'world', palmAt: [x, y, 0.28], finger: [0.06 * s, -0.25, 0.96], normal: [0, -1, 0], pole: [0.65 * s, 0.85, 0.15], relax: 1,
  touch: { solve: 'bisect', clear: 0.0008, toward: s > 0 ? 'leftKnee' : 'rightKnee' } });
const ANCH = [0.19, 0.12, CZ + 0.185];
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: thighHand(1, 0.13, 0.62), right: thighHand(-1, -0.13) },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.40], heading: 4, pitch: 0 },
    right: { mode: 'free', frame: 'world', ankle: t => r4(ank(t)), rot: [[[0, 1, 0], -4], [r4(nrm(ax)), t => SGN * ROT * p(t)]], pole: poleR },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { turn: p });
export default {
  id: 'h-band-hip-ir', name: '坐椅弹力带髋内旋', nameEn: 'Seated Banded Hip Internal Rotation',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors', 'glute-max'], side: 'right', pulseTrack: 'turn', pulseBase: 0.3 },
  camera: { dir: [-0.65, 0.45, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'rightAnkle'], pad: 0.18, k: 1.0, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 760, cx: 512, cy: 530 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.5, fade: [0.09, 0.3] }], bands: [] },
  props: [
    { type: 'chair', at: [0, 0, CZ], yaw: 0, height: SEAT, width: 0.44, depth: 0.42 },
    { type: 'band', from: ANCH, to: { bone: 'rightFoot', offset: [0, 0.035, 0.03] }, r: 0.007, sag: 0.0, colour: '#7a4a32' },
    { type: 'band', from: [ANCH[0], ANCH[1] + 0.02, ANCH[2]], to: { bone: 'rightFoot', offset: [0, 0.035, -0.035] }, r: 0.007, sag: 0.0, colour: '#7a4a32' },
  ],
  keyFrames: [0.3, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
