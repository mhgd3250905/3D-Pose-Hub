// scapular-C 吊环直臂支撑 (ring support hold). Head up (+Y), body faces +Z, body left = +X.
// Rings hang beside the hips: grip section at x = +-RX, height GY. Hands in the neutral ring grip (ring tangent along Z turned out
// by TO deg = slight ring turn-out, fingers down and out, palm down and in) and never move; elbows locked straight. Each ring leans
// TILT outward so its upper half and the strap clear the forearm; straps run up to anchors 3 m high.
// Hold with active shoulder depression: 'dep' presses the shoulders down (body rises 4 cm) and holds, then eases off (shoulders
// creep toward the ears) — the cue's correction, done twice per loop; 'hol' adds a slight hollow (pelvis tucks, legs a little
// forward) while depressed. Legs straight, feet together, toes pointed.
// Loop 8 s = 2 even reps of 4 s: 1.0 s press down / 2.0 s hold / 1.0 s ease off.
const RX = 0.255, GY = 1.15, BR = 0.014, TILT = 40 * Math.PI / 180, TO = 12 * Math.PI / 180;
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035 + (BR - 0.016);
// rotate a vector about +Y by angle a
const ry = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const fdir = sg => ry([sg * Math.cos(A), -Math.sin(A), 0], sg * TO), ndir = sg => ry([-sg * Math.sin(A), -Math.cos(A), 0], sg * TO);
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * RX - f[0] * GF - n[0] * GN, GY - f[1] * GF - n[1] * GN, -f[2] * GF - n[2] * GN]; };
const hand = sg => ({ mode: 'free', frame: 'world', wrist: wristAt(sg), finger: fdir(sg), normal: ndir(sg), poleUp: [sg * 0.45, 1.1, -0.6] });
const ring = sg => ({ grip: [sg * RX, GY, 0], axis: ry([0, 0, 1], sg * TO), up: ry([sg * Math.sin(TILT), Math.cos(TILT), 0], sg * TO), anchor: [sg * (RX + 0.12), 3.0, 0] });
const LT = 0.353, LS = 0.41, KA = 178.5 * Math.PI / 180, LEG = Math.sqrt(LT * LT + LS * LS - 2 * LT * LS * Math.cos(KA));
const ankle = (sg, fw) => { const d = [-sg * 0.035, -1, fw], n = Math.hypot(...d); return [sg * 0.082 + d[0] / n * LEG, 0.852 + d[1] / n * LEG, 0.006 + d[2] / n * LEG]; };
const foot = (sg, fw) => ({ mode: 'free', frame: 'hips', ankle: ankle(sg, fw), rot: [[[1, 0, 0], 38]], poleLow: [sg * 0.08, 0.5, 0.8] });
// one eased press/hold/release curve per rep, sampled per frame; 'bow' = 4u(1-u) carries the sagitta of the ankle arc (the feet swing
// forward on a circle about the hips, a straight chord would bend the knees ~4 deg mid-move)
const ez = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
const prof = t => { const r = ((t % 4) + 4) % 4; return r < 1.0 ? ez(r) : r < 3.0 ? 1 : ez(4.0 - r); };
const add = (a, b) => a.map((v, i) => v + b[i]), sub = (a, b) => a.map((v, i) => v - b[i]), mul = (a, k) => a.map(v => v * k);
const sag = sg => sub(ankle(sg, 0.075), mul(add(ankle(sg, 0.03), ankle(sg, 0.12)), 0.5));
const N = 240, uK = [], bK = [];
for (let i = 0; i <= N; i++) { const t = 8 * i / N, u = prof(t); uK.push([t, u, 'linear']); bK.push([t, 4 * u * (1 - u), 'linear']); }
export default {
  id: 'scapular-C', name: '吊环直臂支撑', nameEn: 'Ring Support Hold',
  timeline: { duration: 8, tracks: { dep: uK, bow: bK } },
  pose: {
    base: {
      pelvis: [0, 1.2, -0.01],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 1]] },
      shoulders: { shift: [0, 0.012, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1, 0.03), left: foot(1, 0.03) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.05 } },
    },
    deltas: { dep: { shoulders: { shift: [0, -0.03, 0] }, hips: { rot: [[[1, 0, 0], -4]] }, feet: { right: { ankle: ankle(-1, 0.12) }, left: { ankle: ankle(1, 0.12) } } },
      bow: { feet: { right: { ankle: add(ankle(-1, 0.03), sag(-1)) }, left: { ankle: add(ankle(1, 0.03), sag(1)) } } } },
  },
  highlight: { groups: ['scapular'], side: 'both', pulseTrack: 'dep', pulseBase: 0.4 },
  camera: { dir: [0.6, 0.22, -1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1.0, drift: 6, at: 0 },
  frame: { mode: 'fit', width: 560, height: 800, cx: 512, cy: 500 },
  stillAt: 0,
  shadow: { joints: ['rightToe', 'leftToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 90, ry: 14, a: 0.3 }], bands: [] },
  props: [{ type: 'rings', r: BR, rings: [ring(-1), ring(1)] }],
  keyFrames: [0.2, 2.0, 3.6],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: [],
  },
};
