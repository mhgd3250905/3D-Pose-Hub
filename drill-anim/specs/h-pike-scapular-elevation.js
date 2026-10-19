// Home bodyweight, not office. Single goal: controlled shoulder-girdle elevation with nearly straight elbows.
// 1 easy set of 4-6 slow reps; prior painless pike support required; stop for wrist/shoulder discomfort.
// No independent upper-trapezius highlight; no claim to show anatomical scapular upward rotation.
// Candidate: closed-chain shoulder elevation with straight elbows, not pike elbow flexion.
// Fixed model uses shoulder-girdle translation, not anatomical scapular upward rotation.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HZ = 0.17, FX = 0.90, FZ = 0.10;
const p = keys([[0, 0], [0.6, 0], [2.1, 1], [2.4, 1], [3.6, 0], [4.6, 0], [6.1, 1], [6.4, 1], [7.6, 0]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * -0.15], poleUp: [side === 'right' ? -0.5 : 0.5, 0.85, 0.05] });
export default {
  id: 'h-pike-scapular-elevation', name: '派克位直臂肩带提压', nameEn: 'Straight-Arm Pike Shoulder Elevation',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false, solveShoulders: true,
  timeline: { duration: DUR, tracks: { down: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.42, 0.95, 0],
      shoulders: {shift:[0,0,0]},
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 62]] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 42, floor: .006 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 42, floor: .006 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 172 }, { type: 'reach', limb: 'leftArm', angle: 172 },
        { type: 'reach', limb: 'rightLeg', angle: 174 }, { type: 'reach', limb: 'leftLeg', angle: 174 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.03, weight: 0.3 },
        
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 0.01, py: 0.01, h0: 0.001 }, iters: 80 },
    },
    deltas: { down: { shoulders: {shift:[0,0.035,0]} } },
  },
  highlight: { groups: [], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [-0.45, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.8, drift: 0, at: 2.2 },
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
    straight: [{ j: 'elbow.right', min: 170, when: 'always' }, { j: 'elbow.left', min: 170, when: 'always' }, { j: 'knee.right', min: 170 }, { j: 'knee.left', min: 170 }],
    allowContact: [],
  },
};
