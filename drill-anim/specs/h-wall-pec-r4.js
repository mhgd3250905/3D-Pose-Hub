// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-wall-pec-r3.js';
// h-wall-pec 靠墙单臂胸肌拉伸 (single-arm wall pec stretch, straight arm) · H 居家胸背系列.
// Standing tall with the right side next to a wall. The right arm reaches back along the wall at shoulder height, palm flat on the
// wall, elbow soft. Keeping the palm planted, slowly turn the chest and hips away from the wall (to the left) until a stretch spreads
// across the front of the right chest, shoulder and biceps; shoulder stays down, ribs don't flare. Hold, breathe, ease back.
// 8 s loop: 2.2 s turn away, 2.6 s hold with a slow breath, 2 s return, 1.2 s rest.
// Facing +Z, head up (+Y), body left = +X. Wall face at x = XW (the wall stands to the athlete's right, face toward +X). No solver:
// the trunk turns about +Y (hips 35 %, waist 65 %); the right hand is fixed on the wall.
import { REST, r4 } from './_home-armfix-r1.mjs';
import { build, keys, armWrist, armDir } from './_home-armfix-r1.mjs';
const DUR = 8, Y0 = 7, Y1 = 23, XW = -0.30;
const p = keys([[0, 0], [0.4, 0], [2.6, 1], [5.2, 1], [7.2, 0]], DUR);
const br = t => (1 - Math.cos(2 * Math.PI * Math.max(0, Math.min(1, (t - 2.6) / 2.6)))) / 2;
const yaw = t => Y0 + (Y1 - Y0) * p(t) + 1.2 * br(t);
const leftHand = { mode: 'free', frame: 'chest', wrist: r4(armWrist('left', 6, 8, 0.475)), finger: r4(armDir('left', 6, 8)), normal: [-1, 0, 0.15], poleUp: [0.3, 1.1, -0.4] };
const P = build(DUR, {
  pelvis: [0.01, 0.950970171859, 0.004045798312],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[0, 1, 0], t => 0.35 * yaw(t)]] },
  chest: { waist: [[[0, 1, 0], t => 0.65 * yaw(t)]] },
  hands: {
    left: leftHand,
    right: { mode: 'free', frame: 'world', wrist: [XW + 0.032, 1.33, -0.395], finger: [0, 0.12, -1], normal: [-1, 0, 0], poleUp: [-0.12, 0.95, -0.35] },
  },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.05], heading: 8, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.10, -0.05], heading: 2, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { turn: p });
const spec = {
  id: 'h-wall-pec', name: '靠墙单臂胸肌拉伸', nameEn: 'Single-Arm Wall Pec Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'biceps'], side: 'right', pulseTrack: 'turn', pulseBase: 0.35 },
  camera: { dir: [-0.75, 0.35, 0.8], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'rightElbow', 'leftPalm'], pad: 0.14, k: 0.95, drift: 3, at: 3.8 },
  frame: { mode: 'fit', width: 760, height: 860, cx: 512, cy: 515 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'wall', at: [XW, 0, -0.42], yaw: 90, size: [0.5, 2.1, 0.12] }],
  keyFrames: [0.2, 1.5, 3.8],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};

spec.id = "h-wall-pec-r4";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
