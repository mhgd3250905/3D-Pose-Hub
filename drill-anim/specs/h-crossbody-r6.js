// r6 extends only the shoulder-relative wrist radius to retain original elbow QA >=168 degrees.
// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-crossbody-r3.js';
// h-crossbody 交叉臂肩后侧拉伸 (cross-body shoulder stretch) · H 居家肩部系列.
// Standing tall, the right arm straight and level at shoulder height. Bring it across the chest; the left palm presses on the
// right upper arm just above the elbow and draws it closer to the chest until the back of the right shoulder stretches. Keep the
// right shoulder down (no shrug) and the trunk square - don't twist to fake range. Hold, breathe, ease off a little.
// 8 s loop: 2 s draw in, 3 s hold with a breath, 2 s ease, 1 s rest.
// Facing +Z, head up (+Y), body left = +X. Hands in the chest frame (rest coordinates). The right wrist swings on a circle of
// radius AR about the right shoulder (horizontal adduction PHI from straight ahead); the left palm sits on the front of the right
// upper arm (palmAt, offset along the arm's outward normal). No solver.
import { REST, r4 } from './_home-armfix-r1.mjs';
import { build, keys } from './_home-armfix-r1.mjs';
const DUR = 8, F0 = 40, F1 = 58, AR = 0.4696, UP = -0.24, QD = 0.215, OFF = 0.085, DEG = Math.PI / 180;
const p = keys([[0, 0], [0.4, 0], [2.4, 1], [5.4, 1], [7.4, 0]], DUR);
const br = t => (1 - Math.cos(2 * Math.PI * Math.max(0, Math.min(1, (t - 2.4) / 3)))) / 2;
const phi = t => (F0 + (F1 - F0) * p(t) + 1.0 * br(t)) * DEG;
const SR = REST.shoulder('right');
const dir = t => { const f = phi(t); return [Math.sin(f), UP, Math.cos(f)]; };
const front = t => { const f = phi(t); const v = [-Math.cos(f), -0.75, Math.sin(f)]; const l = Math.hypot(...v); return v.map(x => x / l); };   // front-and-under the arm
const sh = t => [0, 0, 0];                     // right shoulder blade wraps forward (protraction)
const rWrist = t => r4(SR.map((x, i) => x + sh(t)[i] + dir(t)[i] * AR));
const lPalm = t => r4(SR.map((x, i) => x + sh(t)[i] + dir(t)[i] * QD + front(t)[i] * OFF));
const P = build(DUR, {
  pelvis: [0, 0.956970171859, 0.004045798312],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 1]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  shoulders: { right: t => r4(sh(t)) },
  hands: {
    right: { mode: 'free', frame: 'chest', wrist: rWrist, finger: t => r4(dir(t)), normal: [0, -1, 0], poleUp: [-0.2, 1.1, -0.5] },
    left: { mode: 'free', frame: 'chest', palmAt: lPalm, finger: t => r4(dir(t).map(x => -x)), normal: t => r4(front(t).map(x => -x)), poleUp: [0.35, 0.95, 0.35] },
  },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { pull: p });
const spec = {
  id: 'h-crossbody', name: '交叉臂肩后侧拉伸', nameEn: 'Cross-Body Shoulder Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: [], panels: ['deltRear', 'infraspinatus'], side: 'right', pulseTrack: 'pull', pulseBase: 0.35 },
  camera: { dir: [-0.6, 0.25, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'rightElbow', 'leftElbow', 'rightShoulder'], pad: 0.14, k: 0.85, drift: 3, at: 3.8 },
  frame: { mode: 'fit', width: 700, height: 860, cx: 512, cy: 515 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [],
  keyFrames: [0.2, 1.4, 3.8],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }],
    allowContact: ['handL|upperArmR', 'forearmL|upperArmR', 'upperArmR|torso', 'forearmR|torso', 'handL|forearmR', 'forearmL|torso', 'upperArmL|torso', 'handL|torso', 'forearmL|forearmR', 'handR|torso', 'handR|upperArmL'],
  },
};

spec.id = "h-crossbody-r6";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
