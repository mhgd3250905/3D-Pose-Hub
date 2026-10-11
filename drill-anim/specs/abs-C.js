// abs-C 双杠直臂支撑举腿 (dip-bar support knee raise). Head up (+Y), body faces +Z, body left = +X.
// Dip bars along Z at x = +-BX, bar centre height BH; hands in the triceps-C neutral grip, world-pinned, elbows locked, shoulders
// pressed down the whole loop. 'u' raises the knees from a straight hang (hip flex 5, knee flex 10) to thighs above horizontal (hip
// flex 95, shins vertical) while the pelvis tilts back 14 deg and the waist curls 18 deg (posterior tilt + crunch). Ankles follow the
// arc of the knee raise: 'u' carries the chord, 'bow' (= 4u(1-u), sampled per frame) its sagitta, so the feet never cut across.
// Loop 8 s = 2 even reps of 4 s: 1.0 s raise / 0.8 s hold / 1.6 s slow lower / 0.6 s hang.
const BX = 0.25, BH = 1.15, BR = 0.02;
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035 + (BR - 0.016);
const fdir = sg => [sg * Math.cos(A), -Math.sin(A), 0], ndir = sg => [-sg * Math.sin(A), -Math.cos(A), 0];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * BX - f[0] * GF - n[0] * GN, BH - f[1] * GF - n[1] * GN, 0]; };
const hand = sg => ({ mode: 'free', frame: 'world', wrist: wristAt(sg), finger: fdir(sg), normal: ndir(sg), poleUp: [sg * 0.45, 1.1, -0.6] });
// leg chain in the hips rest frame: thigh at phi from straight down toward +Z, knee flexion kap (shin at phi - kap)
const LT = 0.353, LS = 0.41, D = Math.PI / 180;
const ank = (sg, phi, kap) => [sg * 0.075, 0.852 - LT * Math.cos(phi * D) - LS * Math.cos((phi - kap) * D), 0.006 + LT * Math.sin(phi * D) + LS * Math.sin((phi - kap) * D)];
const add = (a, b) => a.map((v, i) => v + b[i]), sub = (a, b) => a.map((v, i) => v - b[i]), mul = (a, k) => a.map(v => v * k);
const sag = sg => sub(ank(sg, 50, 52.5), mul(add(ank(sg, 5, 10), ank(sg, 95, 95)), 0.5));   // arc midpoint minus chord midpoint
const foot = (sg, a) => ({ mode: 'free', frame: 'hips', ankle: a, rot: [[[1, 0, 0], 28]], poleLow: [sg * 0.09, 0.55, 0.9] });
// one eased raise/lower curve per rep, sampled per frame so u and bow stay consistent
const ez = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
const prof = t => { const r = ((t % 4) + 4) % 4; return r < 1.0 ? ez(r / 1.0) : r < 1.8 ? 1 : r < 3.4 ? ez(1 - (r - 1.8) / 1.6) : 0; };
const N = 240, uK = [], bK = [];
for (let i = 0; i <= N; i++) { const t = 8 * i / N, u = prof(t); uK.push([t, u, 'linear']); bK.push([t, 4 * u * (1 - u), 'linear']); }
export default {
  id: 'abs-C', name: '双杠直臂支撑举腿', nameEn: 'Dip-Bar Support Leg Raise',
  timeline: { duration: 8, tracks: { u: uK, bow: bK } },
  pose: {
    base: {
      pelvis: [0, 1.2, -0.01],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, -0.03, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1, ank(-1, 5, 10)), left: foot(1, ank(1, 5, 10)) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.05 } },
    },
    deltas: {
      u: { hips: { rot: [[[1, 0, 0], -12]] }, chest: { waist: [[[1, 0, 0], 18]] }, feet: { right: { ankle: ank(-1, 95, 95) }, left: { ankle: ank(1, 95, 95) } } },
      bow: { feet: { right: { ankle: add(ank(-1, 5, 10), sag(-1)) }, left: { ankle: add(ank(1, 5, 10), sag(1)) } } },
    },
  },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'u', pulseBase: 0.4 },
  camera: { dir: [0.4, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 6, at: 0 },
  frame: { mode: 'fit', width: 560, height: 820, cx: 512, cy: 480 },
  stillAt: 0,
  shadow: { joints: ['rightToe', 'leftToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 90, ry: 14, a: 0.3 }], bands: [] },
  props: [{ type: 'dipBars', at: [0, 0, 0], height: BH, gap: 2 * BX, length: 0.8, r: BR }],
  keyFrames: [0.3, 1.4, 2.6],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    allowContact: [],
  },
};
