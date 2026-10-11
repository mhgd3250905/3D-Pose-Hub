// glute-max-C 反向背伸机 (reverse hyperextension). Body prone on a level pad, head toward +Z, body faces down (-Y), body left = +X.
// Pelvis fixed (hip-joint centre H), hips just past the pad's rear end. Hands grip two bars along Z below the front of the pad
// (dip-bar neutral grip, world-pinned). Legs straight (knees 178.5) and together swing about the hip axis from hanging straight down
// (phi = 0) up to in line with the torso (phi = 90, not higher: cue). Ankle path is the exact arc: in the hips rest frame
// ankle = hip + LEG (0, -sin phi, cos phi); track 'a' = 1 - cos phi and 'b' = sin phi carry the two components, 'f' = phi / 90 turns
// the feet with the legs (relaxed, toes pointed). An ankle cuff + strap ties the shins to the machine's pendulum lever.
// Loop 8 s = 2 even reps of 4 s: 1.0 s raise / 0.6 s hold / 1.6 s slow lower / 0.8 s hang.
const H = [0, 1.08, 0.0];
const PEL = [H[0], H[1] - 0.004, H[2] + 0.048];
const LT = 0.353, LS = 0.41, KA = 178.5 * Math.PI / 180, LEG = Math.sqrt(LT * LT + LS * LS - 2 * LT * LS * Math.cos(KA));
const ank = (sg, phi) => [sg * 0.074, 0.852 - LEG * Math.sin(phi * Math.PI / 180), 0.006 + LEG * Math.cos(phi * Math.PI / 180)];
const foot = (sg, phi, rot) => ({ mode: 'free', frame: 'hips', ankle: ank(sg, phi), rot: [[[1, 0, 0], rot]], poleLow: [sg * 0.1, 0.5, 0.9] });
// handles
const HX = 0.2, HY = 0.67, HZ = 0.88, BR = 0.016;
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035 + (BR - 0.016);
const fdir = sg => [sg * Math.cos(A), -Math.sin(A), 0], ndir = sg => [-sg * Math.sin(A), -Math.cos(A), 0];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * HX - f[0] * GF - n[0] * GN, HY - f[1] * GF - n[1] * GN, HZ]; };
const hand = sg => ({ mode: 'free', frame: 'world', wrist: wristAt(sg), finger: fdir(sg), normal: ndir(sg), poleUp: [sg * 1.0, -0.2, -0.6] });
const PADTOP = 0.935, PADREAR = 0.115, PADLEN = 0.40;
// one eased raise/lower profile per rep, sampled per frame so a, b and f stay on the same angle
const ez = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
const prof = t => { const r = ((t % 4) + 4) % 4; return r < 1.0 ? ez(r / 1.0) : r < 1.6 ? 1 : r < 3.2 ? ez(1 - (r - 1.6) / 1.6) : 0; };
const N = 240, aK = [], bK = [], fK = [];
for (let i = 0; i <= N; i++) { const t = 8 * i / N, p = prof(t), ph = p * Math.PI / 2; aK.push([t, 1 - Math.cos(ph), 'linear']); bK.push([t, Math.sin(ph), 'linear']); fK.push([t, p, 'linear']); }
const R0 = -40, R1 = 55;   // foot rot (world X) at phi = 0 and 90
export default {
  id: 'glute-max-C', name: '反向背伸机', nameEn: 'Reverse Hyperextension',
  timeline: { duration: 8, tracks: { a: aK, b: bK, f: fK } },
  pose: {
    base: {
      pelvis: PEL,
      hips: { up: [0, 0, 1], front: [0, -1, 0], rot: [[[1, 0, 0], 0]] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1, 0, R0), left: foot(1, 0, R0) },
      constraints: [],
      solve: { vars: [] },
    },
    deltas: {
      a: { feet: { right: { ankle: [-0.074, 0.852, 0.006] }, left: { ankle: [0.074, 0.852, 0.006] } } },
      b: { feet: { right: { ankle: [-0.074, 0.852 - LEG, 0.006 + LEG] }, left: { ankle: [0.074, 0.852 - LEG, 0.006 + LEG] } } },
      f: { feet: { right: { rot: [[[1, 0, 0], R1]] }, left: { rot: [[[1, 0, 0], R1]] } } },
    },
  },
  highlight: { groups: ['glute-max'], side: 'both', pulseTrack: 'f', pulseBase: 0.4 },
  camera: { dir: [1, 0.28, 0.12], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee'], pad: 0.16, k: 1.0, drift: 5, at: 1.3 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 470 },
  stillAt: 1.3,
  shadow: { joints: ['pelvis'], blobs: [{ j: 'pelvis', rx: 170, ry: 18, a: 0.25 }], bands: [] },
  props: [{ type: 'reverseHyper', top: PADTOP, rear: PADREAR, len: PADLEN, w: 0.36, handles: { x: HX, y: HY, z0: HZ - 0.1, z1: HZ + 0.12, r: BR }, pivot: [0, 0.55, 0.16], lever: 0.22 }],
  keyFrames: [0.2, 1.3, 2.4],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
