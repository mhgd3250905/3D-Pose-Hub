// lats-C 双杠支撑耸肩下压 (dip-bar scapular depression). Head up (+Y), body faces +Z, body left = +X.
// Dip bars along Z at x = +-BX, bar centre height BH; hands in the triceps-C neutral grip, world-pinned, elbows locked straight the
// whole loop. Legs hang straight (knees 178.5 deg), feet together, toes pointed. Only the shoulder girdle moves: 'e' = 1 lets the
// shoulders rise toward the ears (body sinks between the arms), 'e' = 0 presses the shoulders down (body rises, 1 s hold at the top).
// Loop 8 s = 2 even reps of 4 s: 1.5 s slow shrug down / 0.3 s bottom / 1.0 s press / 1.2 s top hold.
const BX = 0.25, BH = 1.15, BR = 0.02;
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035 + (BR - 0.016);
const fdir = sg => [sg * Math.cos(A), -Math.sin(A), 0], ndir = sg => [-sg * Math.sin(A), -Math.cos(A), 0];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * BX - f[0] * GF - n[0] * GN, BH - f[1] * GF - n[1] * GN, 0]; };
const hand = sg => ({ mode: 'free', frame: 'world', wrist: wristAt(sg), finger: fdir(sg), normal: ndir(sg), poleUp: [sg * 0.45, 1.1, -0.6] });
// straight legs: ankle at the hip-ankle distance of a 178.5 deg knee, slightly inward and forward of the hip (rest-frame coords)
const LT = 0.353, LS = 0.41, KA = 178.5 * Math.PI / 180, LEG = Math.sqrt(LT * LT + LS * LS - 2 * LT * LS * Math.cos(KA));
const ankle = sg => { const d = [-sg * 0.035, -1, 0.05], n = Math.hypot(...d); return [sg * 0.082 + d[0] / n * LEG, 0.852 + d[1] / n * LEG, 0.006 + d[2] / n * LEG]; };
const foot = sg => ({ mode: 'free', frame: 'hips', ankle: ankle(sg), rot: [[[1, 0, 0], 38]], poleLow: [sg * 0.08, 0.5, 0.8] });
const rep = s => [[s, 0], [s + 1.5, 1], [s + 1.8, 1], [s + 2.8, 0]];
const hl = s => [[s, 1], [s + 1.5, 0], [s + 1.8, 0], [s + 2.8, 1]];   // highlight: brightest with the shoulders pressed down
export default {
  id: 'lats-C', name: '双杠支撑耸肩下压', nameEn: 'Dip-Bar Scapular Depression',
  timeline: { duration: 8, tracks: { e: [...rep(0), ...rep(4)], hl: [...hl(0), ...hl(4)] } },
  pose: {
    base: {
      pelvis: [0, 1.2, -0.01],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
      shoulders: { shift: [0, -0.03, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.05 } },
    },
    deltas: { e: { shoulders: { shift: [0, 0.045, 0] } } },
  },
  highlight: { groups: ['lats'], side: 'both', pulseTrack: 'hl', pulseBase: 0.45 },
  camera: { dir: [0.35, 0.22, -1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.16, k: 1.0, drift: 6, at: 0 },
  frame: { mode: 'fit', width: 560, height: 800, cx: 512, cy: 480 },
  stillAt: 0,
  shadow: { joints: ['rightToe', 'leftToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 90, ry: 14, a: 0.3 }], bands: [] },
  props: [{ type: 'dipBars', at: [0, 0, 0], height: BH, gap: 2 * BX, length: 0.8, r: BR }],
  keyFrames: [0.6, 1.65, 3.4],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: [],
  },
};
