// h-chair-dip 椅子臂屈伸 (chair dip, bent-knee beginner version) · H 居家徒手全身系列.
// Back to a sturdy chair, heels of the hands on the front edge of the seat (fingers forward, shoulder-width), hips just in front
// of the seat, knees bent ~90 deg with the feet flat. Bend the elbows straight back (not flaring) until the upper arms are about
// parallel to the floor, the hips sliding down close to the seat edge, then press back up to straight arms; shoulders stay down
// away from the ears, chest open. 2 reps / 8 s: 0.5 s top, 1.6 s down, 0.3 s bottom, 1.2 s press, 0.4 s top.
// Head +Y, front faces +Z (away from the chair), body left = +X. Solver: px/py/pz keep both arms at the driven elbow angle with the
// pelvis just in front of the seat edge; hands and feet stay planted.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, SEAT = 0.45, EDGE = 0.0, HX = 0.20;
const p = keys([[0, 0], [0.5, 0], [2.1, 1], [2.4, 1], [3.6, 0], [4.5, 0], [6.1, 1], [6.4, 1], [7.6, 0]], DUR);
const seatHand = (s) => ({ mode: 'free', frame: 'world', wrist: [s * HX, SEAT + 0.035, EDGE - 0.035], finger: [0, -0.25, 1], normal: [0, -1, 0.1],
  poleUp: [s * 0.25, 0.7, -1], keepReach: 1, relax: 0 });
export default {
  id: 'h-chair-dip', name: '椅子臂屈伸', nameEn: 'Chair Dip',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { down: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0, 0.47, 0.22],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 4]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: { left: seatHand(1), right: seatHand(-1) },
      feet: {
        left: { mode: 'floor', at: [0.13, 0.76], heading: 4, pitch: 0, poleLow: [0.25, 0.9, 1.2] },
        right: { mode: 'floor', at: [-0.13, 0.76], heading: -4, pitch: 0, poleLow: [-0.25, 0.9, 1.2] },
      },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: 176, weight: 1 }, { type: 'reach', limb: 'rightArm', angle: 176, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: 0.21, weight: 0.6 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 0.6 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { down: { constraints: [{ angle: 92 }, { angle: 92 }, { value: 0.17 }, {}], hips: { rot: [[[1, 0, 0], 8]] } } },
  },
  highlight: { groups: ['triceps'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [1, 0.25, 0.12], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow', 'leftPalm'], pad: 0.14, k: 1.0, drift: 3, at: 2.2 },
  frame: { mode: 'fit', width: 760, height: 820, cx: 520, cy: 520 },
  stillAt: 0.2,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, EDGE - 0.21], yaw: 0, height: SEAT, width: 0.44, depth: 0.42 }],
  keyFrames: [0.2, 1.3, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168, when: 'params.down<0.001' }, { j: 'elbow.left', min: 168, when: 'params.down<0.001' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmR|torso', 'forearmL|torso'],
  },
};
