// h-tabletop 桌面式后撑抬髋 (reverse tabletop bridge, bent knees) · H 居家开肩系列.
// Sitting on the mat, knees bent with the feet flat hip-width apart, hands flat on the mat behind the hips with the fingers
// pointing toward the feet, arms straight. Press through the hands and heels and lift the hips until the shoulders, hips and knees
// make a flat table and the shins are vertical; open the chest and draw the shoulder blades together (shoulder extension under
// load - the base of bridges, crab walks and back-support transitions). Hold, lower back to a hover. 2 reps / 8 s: 1.2 s up,
// 1.2 s hold, 1.2 s down, 0.4 s rest.
// Head points -X, chest faces up (+Y), body left = -Z (frame of erectors-A). Solver: px, py, h0 keep the arms straight and the knee
// angle on its track while the pelvis height is driven; hands and feet stay pinned.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HZ = 0.20, FX = 0.86, FZ = 0.11;
const p = keys([[0, 0], [0.2, 0], [1.4, 1], [2.6, 1], [3.8, 0], [4.2, 0], [5.4, 1], [6.6, 1], [7.8, 0]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [side === 'right' ? -0.30 : 0.30, 1.05, -0.35] });
export default {
  id: 'h-tabletop', name: '桌面式后撑抬髋', nameEn: 'Reverse Tabletop Bridge',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { lift: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.42, 0.20, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], -40]] },
      hands: { right: floorHand(HZ, 'right'), left: floorHand(-HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 0 }, left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 0 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 176 }, { type: 'reach', limb: 'leftArm', angle: 176 },
        { type: 'reach', limb: 'rightLeg', angle: 72 }, { type: 'reach', limb: 'leftLeg', angle: 72 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.19, weight: 0.6 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 0.2, h0: 0.01 }, iters: 50 },
    },
    deltas: { lift: { pelvis: [0.50, 0.48, 0], hips: { rot: [[[0, 0, 1], -2]] }, constraints: [{}, {}, { angle: 90 }, { angle: 90 }, { value: 0.47 }] } },
  },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.35, 0.3, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 6, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 12, a: 0.7 }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 11, a: 0.6 },
      { j: 'pelvis', rx: 70, ry: 14, a: 0.5, fade: [0.2, 0.45] }],
    bands: [] },
  props: [{ type: 'mat', at: [0.45, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 0.8, 2.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};
