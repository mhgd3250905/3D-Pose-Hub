import { gripPose } from '../lib/grip.mjs';
// triceps-B 平行杆直臂支撑 (parallette support hold). Head up (+Y), body faces +Z, body left = +X.
// The bars run along Z at x = +-BX, bar centre height BH. Both hands grip the bars and never move (world-pinned grip,
// arms locked straight). Loop (7 s): toes rest lightly on the floor -> 'dep' presses the shoulders down (body rises ~3 cm)
// -> 'lift' tucks the knees up off the floor -> 3 s hold -> lower the toes -> release. One rep per loop.
const BX = 0.26, BH = 0.26;
// hand tilt (fingers down-and-out, palm down-and-in) and the bar centre in the hand frame (GF along the fingers from the
// wrist, GN along the palm normal), fitted to the relaxed hand so the bar sits in the finger-root crease with a 1-2 mm gap
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035;
const fdir = sg => [sg * Math.cos(A), -Math.sin(A), 0], ndir = sg => [-sg * Math.sin(A), -Math.cos(A), 0];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * BX - f[0] * GF - n[0] * GN, BH - f[1] * GF - n[1] * GN, 0]; };
// v2: closed power grip round the bar (baked fist, lib/grip.mjs + gripHand props): wrist over the bar, palm facing in
const hand = sg => ({ mode: 'free', frame: 'world', ...gripPose(sg < 0 ? 'right' : 'left', [sg * BX, BH, 0], [0, 0, 1], [sg, 0, 0]), poleUp: [sg * 0.25, 1.1, -0.5] });
const FZ = 0.52, FX = 0.10;
export default {
  id: 'triceps-B', name: '平行杆直臂支撑', nameEn: 'Parallette Support Hold',
  timeline: { duration: 7, tracks: {
    dep: [[0, 0], [0.4, 0], [1.2, 1], [6.3, 1], [6.8, 0], [7, 0]],
    lift: [[0, 0], [1.1, 0], [2.2, 1], [5.1, 1], [6.2, 0], [7, 0]],
  } },
  pose: {
    base: {
      pelvis: [0, 0.42, -0.04],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, 0, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: {
        right: { mode: 'floor', at: [-FX, FZ], heading: 0, pitch: 20, lift: 0, poleLow: [-0.09, 1.2, 0.9] },
        left: { mode: 'floor', at: [FX, FZ], heading: 0, pitch: 20, lift: 0, poleLow: [0.09, 1.2, 0.9] },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 177.5 }, { type: 'reach', limb: 'leftArm', angle: 177.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.3 } },
    },
    deltas: {
      dep: { shoulders: { shift: [0, -0.03, 0] } },
      lift: { feet: { right: { at: [-FX, 0.47], pitch: 30, lift: 0.10 }, left: { at: [FX, 0.47], pitch: 30, lift: 0.10 } } },
    },
  },
  highlight: { groups: ['triceps'], side: 'both', pulseTrack: 'dep', pulseBase: 0.3 },
  camera: { dir: [1, 0.22, 0.3], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 6, at: 3.5 },
  frame: { mode: 'fit', width: 800, height: 800, cx: 512, cy: 510 },
  stillAt: 0,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 120, ry: 18, a: 0.35 }], bands: [] },
  props: [{ type: 'parallettes', at: [0, 0, 0], length: 0.42, height: BH, gap: 2 * BX }, { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' }],
  // prop primitives for tools/propclip.js (grip bars and the uprights' upper ends)
  qaProps: [-1, 1].flatMap(sg => [{ a: [sg * BX, BH, -0.21], b: [sg * BX, BH, 0.21], r: 0.016 }]),
  keyFrames: [0, 1.2, 3.5],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.lift<0.001' }, { c: 'footL', when: 'params.lift<0.001' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    allowContact: [],
  },
};
