// h-bridge-march 臀桥交替踏步 (glute bridge march) · H 居家徒手后链系列.
// Lying on the back, knees bent, feet flat hip-width apart, arms long beside the body with the palms flat on the mat. The hips
// are held up in a double-leg glute bridge the whole loop (squeeze the glutes, ribs down); keeping the pelvis level and still,
// one foot peels a few centimetres off the mat with the knee drawing slightly toward the chest, pauses, and sets down softly,
// then the other foot. RIGHT, LEFT, RIGHT, LEFT / 8 s; each march 0.7 s up, 0.5 s pause, 0.6 s down, 0.2 s both feet down.
// Frame 0 is the held bridge (the drill starts from the bridge, it does not teach the lift into it).
// Head points -X, face up (+Y), body left = -Z (frame of h-bridge-overhead, whose bridge-top trunk geometry is used as is).
// No solver: pelvis/hips/waist are the constant bridge top; palms are floor-pinned beside the hips (arm IK finds the elbows);
// the stance foot is floor-pinned, the marching foot is a floor foot with lift and a short slide toward the hips.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, FX = 0.40, FZ = 0.11, SX = -0.47, LW = 0.1412, LC = 0.3294, D2R = Math.PI / 180;
const LIFT = 0.09, PULL = 0.06;
// h-bridge-overhead trunk at the top of the bridge (q = 1)
const geo = (() => { const py = 0.283, sy = 0.142, b = 9;
  const a = Math.asin(Math.max(-1, Math.min(1, (py - sy - LC * Math.sin(b * D2R)) / LW))) / D2R;
  return { a, b, px: SX + LW * Math.cos(a * D2R) + LC * Math.cos(b * D2R), py }; })();
const march = t0 => keys([[0, 0], [t0, 0], [t0 + 0.7, 1], [t0 + 1.2, 1], [t0 + 1.8, 0]], DUR);
const mR = (() => { const a = march(0.2), b = march(4.2); return t => a(t) + b(t); })();
const mL = (() => { const a = march(2.2), b = march(6.2); return t => a(t) + b(t); })();
const foot = (s, m) => ({ mode: 'floor', at: t => r4([FX - PULL * m(t), -sg(s) * FZ]), heading: 90, pitch: t => +(10 * m(t)).toFixed(3), lift: t => +(LIFT * m(t)).toFixed(4) });
// right palm 5 mm further toward the feet: its elbow stays >= 170 deg (qa's elbow-direction test is in standing +Z terms)
const floorHand = (z, x = 0.0) => ({ mode: 'floor', at: [x, z], finger: [1, Math.sign(z) * 0.05], poleUp: [-0.25, 0.05, Math.sign(z) * 0.8] });
const P = build(DUR, {
  pelvis: r4([geo.px, geo.py, 0]),
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], +geo.a.toFixed(3)]] },
  chest: { waist: [[[0, 0, 1], +(geo.b - geo.a).toFixed(3)]] },
  hands: { right: floorHand(0.245, 0.005), left: floorHand(-0.245) },
  feet: { right: foot('right', mR), left: foot('left', mL) },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { mR, mL, effort: t => Math.max(mR(t), mL(t)) });
export default {
  id: 'h-bridge-march', name: '臀桥交替踏步', nameEn: 'Glute Bridge March',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max', 'hamstrings'], side: 'both', pulseTrack: 'effort', pulseBase: 0.6 },
  camera: { dir: [0.3, 0.42, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow'], pad: 0.12, k: 0.75, drift: 4, at: 1.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 540 },
  stillAt: 0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftAnkle', rx: 40, ry: 11, a: 0.55, fade: [0.09, 0.2] }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.55, fade: [0.09, 0.2] }, { j: 'leftPalm', rx: 36, ry: 10, a: 0.45 }, { j: 'rightPalm', rx: 36, ry: 10, a: 0.45 }],
    bands: [] },
  props: [{ type: 'mat', at: [-0.22, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 1.2, 3.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'params.mL<0.001' }, { c: 'footR', when: 'params.mR<0.001' }],
    allowContact: ['thighL|shinL', 'thighR|shinR', 'handR|thighR', 'handL|thighL', 'forearmR|torso', 'forearmL|torso', 'upperArmR|torso', 'upperArmL|torso'],
  },
};
