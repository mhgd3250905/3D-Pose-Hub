// h-band-leg-out 仰卧弹力带单腿侧落 (supine banded single-leg side lowering) · H 居家开胯系列.
// Lying on the back, a band (or towel) looped round the sole of the RIGHT foot, both ends held in the right fist. The right leg
// starts straight up; keeping the knee straight and the left leg long on the mat, the right leg lowers slowly out to the
// right side, the band taking the weight, until the inner thigh stretches (adductors, inner hamstrings); hold, then the band
// helps the leg back up. Left hand on the mat keeps the pelvis level. 1 rep / 8 s: 2.6 s out, 2.4 s hold, 2.2 s up.
// Head points -X, face up (+Y), body left = -Z, body right = +Z (frame of h-knee-hug). No solver.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg, restPtW, footRotW, REST } from '../lib/ss-geo.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, F = 84, A0 = 4, A1 = 58;
const p = keys([[0, 0], [0.3, 0], [2.9, 1], [5.3, 1], [7.5, 0]], DUR);
const PEL = [0, 0.114, 0];
const hips = { up: [-1, 0, 0], front: [0, 1, 0], rot: [] };
const ang = t => A0 + (A1 - A0) * p(t);
const LR = t => leg('right', F, 2, [[[0, 1, 0], -ang(t)]]);
const LL = leg('left', -2.5, 3);   // left leg long on the mat (hip extension kept at 2.5 deg so the calf rests on, not in, the floor)
const sub = (a, b) => a.map((x, i) => x - b[i]), add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k);
const nrm = a => mul(a, 1 / Math.hypot(...a));
const SHR = restPtW(hips, PEL, REST.shoulder('right'));
// sole point of the right foot in world (~9 cm past the ankle along the leg) and the fist on the shoulder->sole line
const sole = t => { const l = LR(t); const d = nrm(sub(l.ankle, l.hip)); return restPtW(hips, PEL, add(l.ankle, mul(d, 0.09))); };
const fistC = t => { const s = sole(t), d = nrm(sub(s, SHR)); return add(SHR, mul(d, 0.47)); };
const grip = t => { const s = sole(t), c = fistC(t), d = nrm(sub(s, c)); const axis = nrm([d[1] * 1 - d[2] * 0, d[2] * 0 - d[0] * 1, 0]);   // across the strap, ~horizontal
  return gripPose('right', c, [0, 0, 1].map((_, i) => [axis[0], axis[1], 0.0001][i]), mul(d, -1)); };
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: {
    right: { mode: 'free', frame: 'world', wrist: t => grip(t).wrist, finger: t => grip(t).finger, normal: t => grip(t).normal, poleUp: [-0.25, 0.15, 0.6] },
    left: { mode: 'free', frame: 'world', palmAt: [0.0, 0.027, -0.438], finger: [1, 0, -0.3], normal: [0, -1, 0], pole: [-0.22, 0.05, -0.6], relax: 0.6 },
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: LL.ankle, rot: footRotW(hips, [[[1, 0, 0], 3 - 5.5]]), poleLow: r4([LL.knee[0] - 0.05, LL.knee[1], LL.knee[2] + 0.5]) },
    right: { mode: 'free', frame: 'hips', ankle: t => LR(t).ankle,
      rot: footRotW(hips, [[[1, 0, 0], -F + 8], [[0, 1, 0], 0]]).map((r, i) => i === 1 ? [r[0], t => -ang(t)] : r),
      poleLow: t => { const K = LR(t).knee; return r4([K[0] - 0.1, K[1] + 0.5, K[2] + 0.05]); } },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
export default {
  id: 'h-band-leg-out', name: '仰卧弹力带单腿侧落', nameEn: 'Supine Banded Leg Lower-Out',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'hamstrings'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-0.55, 1, -0.35], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'rightAnkle'], pad: 0.12, k: 0.8, drift: 3, at: 4.0, fitTimeline: true },
  frame: { mode: 'fit', width: 780, height: 720, cx: 512, cy: 530 },
  stillAt: 4.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [
    { type: 'mat', at: [0.05, 0, 0.1], size: [1.83, 0.8, 0.006] },
    { type: 'gripHand', side: 'right' },
    { type: 'band', from: { bone: 'rightHand', offset: G.right.c }, to: { bone: 'rightFoot', offset: [0.045, -0.02, 0.09] }, r: 0.008, sag: 0.0, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightHand', offset: G.right.c }, to: { bone: 'rightFoot', offset: [-0.045, -0.02, 0.09] }, r: 0.008, sag: 0.0, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightFoot', offset: [0.045, -0.02, 0.09] }, to: { bone: 'rightFoot', offset: [-0.045, -0.02, 0.09] }, r: 0.008, sag: 0.0, colour: '#7a4a32' },
  ],
  keyFrames: [0.2, 1.6, 4.0],
  qa: {
    pins: [],
    straight: [{ j: 'knee.right', min: 168 }, { j: 'knee.left', min: 168 }],
    allowContact: ['handL|torso', 'forearmL|torso'],
  },
};
