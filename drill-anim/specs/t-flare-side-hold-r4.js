import { floorDrill, qaStd, norm, leg, legFields, dirW } from './_thomas-armfix-r1.mjs';
import { mirrorSpec } from './_thomas-mirror.mjs';

// Reference 3c541c...gif: the lower foot and the same-side palm bear the load.
// The trunk is almost horizontal, the upper leg is lifted, and the free arm
// reaches upward. Author one hold precisely; its left-side demo is a true
// skeleton mirror, because the source cuts between sides rather than changing
// support continuously. Body front is +Z, body left is +X.
const T = 8;
const breath = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 4);
const shoulderL = [0.1879, 1.3702, -0.0042], armLength = 0.4846;
const armUp = norm([0.965, 0.257, 0.025]);
const wristL = shoulderL.map((v, i) => v + armLength * armUp[i]);

const rightSide = floorDrill({
  id: 't-flare-side-hold', name: '托马斯侧撑定格', nameEn: 'Flare Side Hold', T,
  alignBendPlanes: true,
  handsDesc: {
    right: { mode: 'floor', at: [-0.50, 0.02], finger: [-0.6, 0.8], poleUp: [-0.2, -0.3, -1] },
    left: { mode: 'free', frame: 'chest', wrist: wristL, finger: armUp, normal: [0, 0, 1], poleUp: [0.3, 1.0, -1] },
  },
  feetDesc: {
    // These Euler angles approximate a shin tilted 53 degrees from -Y with
    // plantar flexion, while floor mode places the actual shoe surface at y=0.
    right: { mode: 'floor', at: [0.635, 0.035], heading: 29.2, pitch: 20.2, roll: 58.3, pole: [0.36, 0.38, 0.6] },
    left: { mode: 'free', frame: 'hips' },
  },
  elbow: 178,
  constraints: [{ type: 'reach', limb: 'rightLeg', angle: 178, weight: 1 }],
  solve: { vars: ['px', 'py', 'pz'], reg: { px: 0.05, py: 0.05, pz: 0.3 }, iters: 80 },
  fn: t => {
    const b = breath(t);
    return { pitch: 3, roll: 80 + 0.6 * b, py: 0.64 + 0.003 * b, pw: 0.01,
      pz: 0, pzw: 0.01, shift: 0, waist: 0, elbow: 178, elbowL: 178 };
  },
  extra: (t, s) => ({
    // The upper leg is a world-space target, not an abduction vector rotated
    // twice with the side-lying pelvis. Only the lower leg is floor-constrained.
    ...legFields('left', leg('left', dirW(1, 40 + 0.5 * breath(t), 87), s.pitch, 32, 178, [0, 0, 1], null, s.roll, 0)),
    'constraints.1.weight': 0,
  }),
  highlight: { groups: ['obliques', 'deltoids'], side: 'right', pulseAt: [2, 6], pulseWidth: 1.2, pulseBase: 0.35 },
  camera: { dir: [0.08, 0.10, 1], fit: ['head', 'leftWrist', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 3, at: 2 },
  shadow: { joints: ['rightPalm', 'rightAnkle', 'pelvis'], blobs: [{ j: 'rightPalm', rx: 40, ry: 12, a: 0.7 }, { j: 'pelvis', rx: 110, ry: 18, a: 0.3 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.6 }], bands: [] },
  props: [{ type: 'mat', at: [0.06, 0, 0.12], size: [1.83, 1.1, 0.006] }],
  keyFrames: [0, 2, 4],
  qa: qaStd({
    straightArms: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    more: { pins: [{ c: 'handR', when: 'always' }, { c: 'footR', when: 'always' }] },
  }),
});
const authored = rightSide;


// Current-body template candidate; fixed support anchors and action identity retained.
const current = structuredClone(authored);
current.id = 't-flare-side-hold-r4';
current.fps = 30; current.size = 1080;
current.runtimeModel = {profile:'training-human-v3-armfix',version:'0.1.0-r2'};
current.modelProfile = 'training-human-v2plus-hands-native';
current.nativeHands = {twistShare:1};
current.v2plus = {outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'};
current.alignClavicles = false;
current.camera = {...current.camera,fitTimeline:true,drift:0,orbitDegrees:0,frontSweepDegrees:0};
current.shadow = {joints:[],blobs:[],bands:[]};
current.templateAdaptation = {status:'retargeted-awaiting-gpu-review',source:'t-flare-side-hold.js',legGeometry:'armfix-r2 bind pivots and two-bone lengths',contacts:'authored world floor anchors retained',reviewed:false,releaseEligible:false};
export default current;
