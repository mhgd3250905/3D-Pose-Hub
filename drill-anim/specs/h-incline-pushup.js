// h-incline-pushup 扶凳上斜俯卧撑 (incline push-up, hands on a sturdy stool / low table) · H 居家胸背系列.
// A sturdy backless stool (or low table / bed edge) that cannot slide; hands a little wider than the shoulders on its front edge, body one straight line
// from head to heels on the balls of the feet. Lower the chest toward the seat edge with the elbows angled ~45 deg back from the
// body (not flared), pause just above the seat, press back to straight arms. Easier than a floor push-up: chest-first beginner
// progression. 2 reps / 8 s: 0.5 s top, 1.6 s down, 0.3 s bottom, 1.2 s press, 0.4 s top.
// Head points -X, body faces the floor, body left = +Z (frame of triceps-A). Solver: px, py, h0 keep the arms at the driven elbow
// angle, the legs straight and the body line rigid (legAlign); hands are world-fixed on the seat, the balls of the feet pinned.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, SEAT = 0.45, HZ = 0.22, FX = 1.02, FZ = 0.11, EDGE = 0.0;
const p = keys([[0, 0], [0.5, 0], [2.1, 1], [2.4, 1], [3.6, 0], [4.5, 0], [6.1, 1], [6.4, 1], [7.6, 0]], DUR);
const seatHand = (z, side) => ({ mode: 'free', frame: 'world', wrist: [EDGE - 0.07, SEAT + 0.032, z], finger: [-1, -0.05, Math.sign(z) * 0.12], normal: [0, -1, 0],
  poleUp: [side === 'right' ? -0.42 : 0.42, 0.95, -0.25] });
export default {
  id: 'h-incline-pushup', name: '扶凳上斜俯卧撑', nameEn: 'Incline Push-Up (Stool)',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { down: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.36, 0.64, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -40]] },
      hands: { right: seatHand(-HZ, 'right'), left: seatHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 50 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 50 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 176 }, { type: 'reach', limb: 'leftArm', angle: 176 },
        { type: 'reach', limb: 'rightLeg', angle: 177 }, { type: 'reach', limb: 'leftLeg', angle: 177 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.08 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.08 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -0.04, weight: 0.08 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { down: { constraints: [{ angle: 84 }, { angle: 84 }, {}, {}, {}, {}, { value: -0.10 }] } },
  },
  highlight: { groups: ['chest', 'triceps'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [-0.35, 0.3, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 2.2 },
  frame: { mode: 'fit', width: 860, height: 760, cx: 512, cy: 520 },
  stillAt: 0.2,
  shadow: { joints: ['rightToe', 'leftToe', 'pelvis', 'rightAnkle', 'leftAnkle'],
    blobs: [{ j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [EDGE - 0.21, 0, 0], yaw: 90, height: SEAT, width: 0.46, depth: 0.42, back: 0.0001 }],
  keyFrames: [0.2, 1.3, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    jointPins: [{ j: 'leftToe', axes: 'xz' }, { j: 'rightToe', axes: 'xz' }],
    straight: [{ j: 'elbow.right', min: 168, when: 'params.down<0.001' }, { j: 'elbow.left', min: 168, when: 'params.down<0.001' }, { j: 'knee.right', min: 170 }, { j: 'knee.left', min: 170 }],
    allowContact: [],
  },
};
