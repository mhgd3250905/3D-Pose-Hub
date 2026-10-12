// triceps-C 双杠臂屈伸 (parallel bar dips). Head up (+Y), body faces +Z, body left = +X.
// Dip bars run along Z at x = +-BX, bar centre height BH. Both hands rest on the bars in the triceps-B neutral grip (fingers down
// and out, palm down and in, bar in the finger-root crease) and never move (world-pinned wrists). Knees bent, feet off the floor.
// 'd' = dip depth: elbows 178.5 -> 90 deg (upper arm about parallel to the floor), torso leans forward 6 -> 26 deg, shoulders
// travel forward of the hands. 'dep' = shoulder depression at the locked top (1 s hold, cue: lock the elbows, push the shoulders down).
// Loop 8 s = 2 even reps of 4 s: 1.2 s top (0.4 depress, 0.5 hold, 0.3 release) / 1.3 s down / 0.2 s bottom / 1.3 s press.
const BX = 0.25, BH = 1.15, BR = 0.02;
// grip: hand tilt A and the bar centre in the hand frame (GF along the fingers from the wrist, GN along the palm normal)
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035 + (BR - 0.016);
const fdir = sg => [sg * Math.cos(A), -Math.sin(A), 0], ndir = sg => [-sg * Math.sin(A), -Math.cos(A), 0];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * BX - f[0] * GF - n[0] * GN, BH - f[1] * GF - n[1] * GN, 0]; };
const hand = sg => ({ mode: 'free', frame: 'world', wrist: wristAt(sg), finger: fdir(sg), normal: ndir(sg), poleUp: [sg * 0.32, 1.15, -0.8] });
// legs: thighs 10 deg forward, knees bent ~80 deg, shins back, ankles close together, toes pointed
const foot = sg => ({ mode: 'free', frame: 'hips', ankle: [sg * 0.065, 0.37, -0.31], rot: [[[1, 0, 0], 55]], poleLow: [sg * 0.08, 0.5, 0.7] });
const rep = s => [[s + 1.2, 0], [s + 2.5, 1], [s + 2.7, 1], [s + 4.0, 0]];
const drep = s => [[s, 0], [s + 0.4, 1], [s + 0.9, 1], [s + 1.2, 0]];
export default {
  id: 'triceps-C', name: '双杠臂屈伸', nameEn: 'Parallel Bar Dips',
  timeline: { duration: 8, tracks: { d: [[0, 0], ...rep(0), ...rep(4)], dep: [...drep(0), ...drep(4)] } },
  pose: {
    base: {
      pelvis: [0, 1.18, -0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 6]] },
      shoulders: { shift: [0, 0, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.05 } },
    },
    deltas: {
      d: { hips: { rot: [[[1, 0, 0], 26]] }, constraints: [{ angle: 90 }, { angle: 90 }, { value: 0.07 }] },
      dep: { shoulders: { shift: [0, -0.025, 0] } },
    },
  },
  highlight: { groups: ['triceps'], side: 'both', pulseTrack: 'd', pulseBase: 0.35 },
  camera: { dir: [1, 0.3, -0.45], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow'], pad: 0.2, k: 1.0, drift: 5, at: 0.6 },
  frame: { mode: 'fit', width: 640, height: 700, cx: 512, cy: 450 },
  stillAt: 0.6,
  shadow: { joints: ['rightToe', 'leftToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 110, ry: 16, a: 0.3 }], bands: [] },
  props: [{ type: 'dipBars', at: [0, 0, 0], height: BH, gap: 2 * BX, length: 0.8, r: BR }],
  keyFrames: [0.6, 2.6, 3.4],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.d<0.001' }, { j: 'elbow.left', min: 176, when: 'params.d<0.001' }],
    allowContact: [],
  },
};
