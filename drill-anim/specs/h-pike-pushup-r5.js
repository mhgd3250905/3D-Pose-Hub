// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-pike-pushup-r3.js';
// h-pike-pushup 派克俯卧撑 (pike push-up) · H 居家徒手全身系列.
// Inverted-V: hands shoulder-width on the mat, legs straight with the hips piked high, weight on the balls of the feet. The elbows
// bend (angled ~45 deg back from the body) and the head travels down and slightly forward of the hands toward the mat while the
// hips stay high; press back up to straight arms. 2 reps / 8 s: 0.6 s top, 1.5 s down, 0.3 s bottom, 1.2 s press, 0.4 s top.
// Head points -X, body faces the floor, body left = +Z (frame of triceps-A). Solver: px, py, h0 keep the arms at the driven
// elbow angle, the legs straight, the hip angle near 80 deg and the shoulders over / ahead of the hands.
import { keys } from './_home-armfix-r1.mjs';
import { track } from './_home-armfix-r1.mjs';
const DUR = 8, HZ = 0.17, FX = 0.96, FZ = 0.10;
const p = keys([[0, 0], [0.6, 0], [2.1, 1], [2.4, 1], [3.6, 0], [4.6, 0], [6.1, 1], [6.4, 1], [7.6, 0]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * -0.15], poleUp: [side === 'right' ? -0.5 : 0.5, 0.85, 0.05] });
const spec = {
  id: 'h-pike-pushup', name: '派克俯卧撑', nameEn: 'Pike Push-Up',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { down: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.45, 0.97, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 62]] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 42 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 42 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 176 }, { type: 'reach', limb: 'leftArm', angle: 176 },
        { type: 'reach', limb: 'rightLeg', angle: 174 }, { type: 'reach', limb: 'leftLeg', angle: 174 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.03, weight: 0.3 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.92, weight: 0.02 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { down: { constraints: [{ angle: 96 }, { angle: 96 }, {}, {}, { value: -0.12 }, { value: 0.90 }] } },
  },
  highlight: { groups: ['deltoids', 'triceps'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [-0.45, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.8, drift: 3, at: 2.2 },
  frame: { mode: 'fit', width: 800, height: 800, cx: 512, cy: 520 },
  stillAt: 0.2,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter', 'head'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 },
      { j: 'head', rx: 40, ry: 10, a: 0.4, fade: [0.15, 0.5] }],
    bands: [] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.4, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 170, when: 'params.down<0.001' }, { j: 'elbow.left', min: 170, when: 'params.down<0.001' }, { j: 'knee.right', min: 170 }, { j: 'knee.left', min: 170 }],
    allowContact: [],
  },
};

spec.id = "h-pike-pushup-r5";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
