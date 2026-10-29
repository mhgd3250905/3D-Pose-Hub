// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-mountain-climber-r3.js';
// h-mountain-climber 慢速登山跑 (slow mountain climber) · H 居家核心力量系列.
// High plank on straight arms (hands under the shoulders), body in one line on the balls of the feet. Slowly drive the RIGHT knee
// in toward the chest (foot hovering a few cm off the mat), pause with the abs braced and the hips level - no piking - and step
// it back to the plank; then the LEFT knee. Per 4 s rep: 0.3 s plank, 1.3 s knee in, 0.6 s hold, 1.3 s back, 0.5 s plank.
// Head points -X, body faces the floor, body left = +Z (frame of triceps-A). The driving foot is a floor-mode foot whose
// position, lift and pitch follow the drive; solver px, py, h0 keep the arms straight, the support leg long, the hips level.
import { keys, sg, r4 } from './_home-armfix-r1.mjs';
import { build } from './_home-armfix-r1.mjs';
const DUR = 8, HZ = 0.165, FX = 1.27, FZ = 0.10, XIN = 0.74, LIFT = 0.07;
const U = keys([[0, 0], [0.3, 0], [1.6, 1], [2.2, 1], [3.5, 0], [4.0, 0]], 4);
const local = t => ((t % DUR) + DUR) % DUR;
const uR = t => (local(t) < 4 ? U(local(t)) : 0), uL = t => (local(t) >= 4 ? U(local(t) - 4) : 0);
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * -0.12], poleUp: [side === 'right' ? -0.21 : 0.21, 0.90, 0.02] });
// body left = +Z: right foot at -FZ
const foot = (s, u) => ({ mode: 'floor', at: t => r4([FX - (FX - XIN) * u(t), sg(s) * FZ]), heading: -90, pitch: t => +(64 - 40 * u(t)).toFixed(3),
  lift: t => +(LIFT * Math.sin(Math.PI * Math.min(1, u(t) * 1.6)) * 0.6 + 0.045 * u(t)).toFixed(4), pole: [-0.3, 0.05, sg(s) * 0.13] });
const P = build(DUR, {
  pelvis: [0.45, 0.40, 0],
  hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -17]] },
  hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
  feet: { right: foot('right', uR), left: foot('left', uL) },
  constraints: [
    { type: 'reach', limb: 'rightArm', angle: 177 }, { type: 'reach', limb: 'leftArm', angle: 177 },
    { type: 'reach', limb: 'rightLeg', angle: t => 174 - 0 * uR(t), weight: t => +(Math.max(0, 1 - 6 * uR(t))).toFixed(4) },
    { type: 'reach', limb: 'leftLeg', angle: 174, weight: t => +(Math.max(0, 1 - 6 * uL(t))).toFixed(4) },
    { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: t => +(0.05 * Math.max(0, 1 - 6 * uR(t))).toFixed(4) },
    { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: t => +(0.05 * Math.max(0, 1 - 6 * uL(t))).toFixed(4) },
    { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.3 },
    { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: t => +(0.40 + 0.015 * Math.max(uR(t), uL(t))).toFixed(4), weight: 0.05 },
  ],
  solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
}, { uR, uL, drive: t => Math.max(uR(t), uL(t)) });
const spec = {
  id: 'h-mountain-climber', name: '慢速登山跑', nameEn: 'Slow Mountain Climber',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['abs', 'hip-flexors'], side: 'both', pulseTrack: 'drive', pulseBase: 0.3 },
  camera: { dir: [-0.5, 0.3, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.65, drift: 3, at: 1.9 },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 520 },
  stillAt: 0.2,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter', 'waist'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6, fade: [0.03, 0.12] }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6, fade: [0.03, 0.12] }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.0, 1.9],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.uR<0.001' }, { c: 'footL', when: 'params.uL<0.001' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 170, when: 'params.uR<0.001' }, { j: 'knee.left', min: 170, when: 'params.uL<0.001' }],
    allowContact: ['thighR|torso', 'thighL|torso'],
  },
};

spec.id = "h-mountain-climber-r5";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
