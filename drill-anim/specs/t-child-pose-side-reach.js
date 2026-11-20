// t-child-pose-side-reach 婴儿式侧伸 (child's pose with side reach) · Flare 2.0 cool-down, r2 batch 1 (2026-11-21).
// Standard: tools/flare2-moves-r2/standards/t-child-pose-side-reach.md.
// Kneeling on the mat, knees hip-width, tops of the feet on the mat, hips sitting back on the heels; the trunk folds forward over
// the thighs, forehead toward the mat, arms long in front with the palms on the mat. Then both hands slide (one after the other)
// far to the LEFT and the trunk side-bends with them, so the RIGHT side of the back (lats / side of the trunk) stretches; hips stay
// on the heels; static hold; hands come back to the middle and the same to the right. 16 s loop: centre 0-1, hands to the left
// 1-2.6 (left hand leads), hold to 6.5, back 6.5-8, hands to the right 8-9.6, hold to 13.5, back 13.5-15, centre to 16.
// Frame of t-kneeling-wrist-flexor-stretch: head points +X, the body faces the floor (-Y), body left = -Z. Solver keeps the arms
// long, the knees on their marks and the hips on the heels.
import { build } from '../lib/home-anim.mjs';
import { win } from '../lib/flare2-r2.mjs';
// r2 attempt 2 (2026-11-21): attempt 1 solved the pelvis (px/py) with the pelvis lying flat (hips up = +X): the solver dragged the hips
// 79 cm off the heels and the body ended prone / sitting up. Now the pelvis is placed (hips on the heels, tilted 55 deg forward), only
// the chest fold is solved so the long arms reach the mat.
const DUR = 16, KX = -0.01, KY = 0.045, KZ = 0.10, FX = -0.42, FZ = 0.075, PX = -0.40, PY = 0.22, TILT = 55, SIDE = 26;
const HX = 0.58, HZ = 0.15, SX = 0.48, SZ = 0.34;      // hands: centre at x HX, z +-HZ; side reach to x SX, z -+SZ (both to one side)
// side weight: + = hands to the body left (-Z), - = to the right; r / l = each hand's own progress (right hand leads going out)
const go = (t, a, b) => win(t, a, b);
// the hand on the side being reached toward moves first, the other follows ("walking" the hands over)
const sideL = t => go(t, 1.0, 1.9) * (1 - go(t, 6.5, 7.4)) - go(t, 8.7, 9.6) * (1 - go(t, 14.1, 15.0));
const sideR = t => go(t, 1.7, 2.6) * (1 - go(t, 7.1, 8.0)) - go(t, 8.0, 8.9) * (1 - go(t, 13.5, 14.4));
const side = t => (sideR(t) + sideL(t)) / 2;
// hand target on the mat: centre (HX, +-HZ) -> side (SX, base z shifted by -+SZ), fingers turned toward the reach
const handAt = (s, t) => { const k = s === 'right' ? sideR(t) : sideL(t), z0 = s === 'right' ? HZ : -HZ;   // right hand at +Z (body right)
  return [+(HX + (SX - HX) * Math.abs(k)).toFixed(4), +(z0 - SZ * k).toFixed(4)]; };
const fingerAt = (s, t) => { const k = s === 'right' ? sideR(t) : sideL(t); return [1, +(-0.55 * k).toFixed(4)]; };
const hand = s => ({ mode: 'floor', at: t => handAt(s, t), finger: t => fingerAt(s, t), poleUp: [s === 'right' ? -0.3 : 0.3, 1.1, -0.2] });
const P = build(DUR, {
  pelvis: [PX, PY, 0],
  hips: { up: [+Math.sin(TILT * Math.PI / 180).toFixed(4), +Math.cos(TILT * Math.PI / 180).toFixed(4), 0], front: [+Math.cos(TILT * Math.PI / 180).toFixed(4), -Math.sin(TILT * Math.PI / 180).toFixed(4), 0], rot: [[[0, 0, 1], 0]] },
  chest: { waist: [[[0, 0, 1], -40], [[0, 1, 0], t => +(SIDE * side(t)).toFixed(3)]] },
  hands: { right: hand('right'), left: hand('left') },
  feet: {
    right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 172, pole: [KX, KY, KZ] },
    left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 172, pole: [KX, KY, -KZ] },
  },
  constraints: [
    { type: 'reach', limb: 'rightArm', angle: 172, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 172, weight: 10 },
  ],
  solve: { vars: ['c0'], reg: { c0: 0.05 }, iters: 60 },
}, { side: t => Math.abs(side(t)) });
export default {
  id: 't-child-pose-side-reach', name: '婴儿式侧伸', nameEn: "Child's Pose Side Reach",
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats'], side: 'both', pulseTrack: 'side', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.95, 0.45], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 900, cx: 512, cy: 540 },
  stillAt: 4,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.5, 4.0, 11.5],
  qa: { pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }], allowContact: ['thighR|shinR', 'thighL|shinL', 'torso|thighR', 'torso|thighL', 'thighL|thighR'] },
  flare2: { version: 'r2', batch: 1, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
