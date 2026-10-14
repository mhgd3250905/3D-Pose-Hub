// h-forearm-plank 前臂平板支撑 (forearm plank) · H 居家核心力量系列.
// Elbows under the shoulders, forearms flat on the mat pointing forward (hands relaxed, palms down), on the balls of the feet,
// body in one straight line from head to heels. Isometric hold: twice per loop the plank braces (knees lock straight, glutes
// and abs squeeze, hips settle level, ~4 mm) and relaxes slightly again. 2 braces / 8 s with breathing.
// Head points -X, body faces the floor, body left = +Z (frame of serratus-A). Solver: px, py, h0 (body incline) with both elbows
// pinned on the mat (mid constraints) and straight legs in line with the hips.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, EZ = 0.165, FX = 1.282, FZ = 0.085;
const p = keys([[0, 0], [0.4, 0], [1.8, 1], [2.4, 1], [3.6, 0], [4.4, 0], [5.8, 1], [6.4, 1], [7.6, 0]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [-0.215, z * 0.82], finger: [-1, -Math.sign(z) * 0.1], poleUp: [side === 'right' ? -0.2 : 0.2, 0.95, 0.1] });
export default {
  id: 'h-forearm-plank', name: '前臂平板支撑', nameEn: 'Forearm Plank',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { rock: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.55, 0.36, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -12]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: { right: floorHand(-EZ, 'right'), left: floorHand(EZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 64 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 64 } },
      constraints: [
        { type: 'mid', limb: 'rightArm', at: [0.0, 0.05, -EZ], weight: 1 }, { type: 'mid', limb: 'leftArm', at: [0.0, 0.05, EZ], weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.4 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.4 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.012, weight: 0.6 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { rock: { constraints: [{}, {}, {}, {}, {}, {}, { value: 0.004 }] } },
  },
  highlight: { groups: ['abs', 'obliques'], side: 'both', pulseTrack: 'rock', pulseBase: 0.45 },
  camera: { dir: [-0.5, 0.4, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.62, drift: 3, at: 0 },
  frame: { mode: 'fit', width: 900, cx: 512, cy: 530 },
  stillAt: 2.1,
  shadow: { joints: ['rightElbow', 'leftElbow', 'rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightElbow', rx: 44, ry: 12, a: 0.7 }, { j: 'leftElbow', rx: 44, ry: 12, a: 0.7 }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 },
      { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.3, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.6, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 2.1, 4.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'leftElbow' }, { j: 'rightElbow' }],
    straight: [{ j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmL|forearmR', 'handL|handR'],
  },
};
