// h-dd-shoulder 下犬式压肩 (downward-dog shoulder press) · H 居家开肩系列.
// Downward dog on the mat: hands shoulder-width, fingers spread, arms straight; legs long, hips pushed high, heels reaching toward
// the floor. Keeping the arms locked and the back long, press the chest back toward the thighs so the armpits open and the
// shoulders go into full overhead flexion (the shoulder angle of a handstand); hold and breathe, then ease back to a neutral dog.
// Hands and feet stay put. 2 reps / 8 s: 1.4 s press, 1.4 s hold, 1.0 s release, 0.2 s rest.
// Head points -X, body faces the floor, body left = +Z (frame of h-pike-pushup). Solver: px, py, h0 keep the arms and legs straight
// with the shoulders driven back behind the hands and the hips high.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HZ = 0.17, FX = 1.00, FZ = 0.10;
const p = keys([[0, 0], [0.2, 0], [1.6, 1], [3.0, 1], [4.0, 0], [4.2, 0], [5.6, 1], [7.0, 1]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * -0.15], poleUp: [side === 'right' ? -0.5 : 0.5, 0.85, 0.05] });
export default {
  id: 'h-dd-shoulder', name: '下犬式压肩', nameEn: 'Downward Dog Shoulder Press',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { press: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.68, 0.80, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 45]] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 34 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 34 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 176 }, { type: 'reach', limb: 'leftArm', angle: 176 },
        { type: 'reach', limb: 'rightLeg', angle: 174 }, { type: 'reach', limb: 'leftLeg', angle: 174 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.25, weight: 0.3 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.80, weight: 0.15 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { press: { constraints: [{}, {}, {}, {}, { value: 0.31 }, { value: 0.79 }] } },
  },
  highlight: { groups: ['lats', 'chest'], side: 'both', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [-0.2, 0.15, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.8, drift: 4, at: 2.2 },
  frame: { mode: 'fit', width: 820, height: 760, cx: 512, cy: 520 },
  stillAt: 2.2,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter', 'head'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 },
      { j: 'head', rx: 40, ry: 10, a: 0.4, fade: [0.15, 0.5] }],
    bands: [] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 1.0, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 170 }, { j: 'elbow.left', min: 170 }, { j: 'knee.right', min: 168 }, { j: 'knee.left', min: 168 }],
    allowContact: [],
  },
};
