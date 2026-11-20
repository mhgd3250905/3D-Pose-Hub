// t-kneeling-wrist-flexor-stretch 跪姿前臂拉伸（指尖朝膝） (kneeling forearm-flexor stretch, fingers toward the knees)
// · Flare 2.0 new moves r1 (2026-11-20), P1 add-on. Standard: tools/flare2-moves/standards/t-kneeling-wrist-flexor-stretch.md.
// Not the same as forearms-A (dynamic 4-direction wrist rocks): this is one static 30 s stretch.
// Hands and knees on the mat (frame and knee/foot set-up of forearms-A: head points +X, body faces the floor, body left = -Z), palms
// flat under the shoulders with the hands turned so the fingers point back toward the knees. Elbows straight, elbow creases turned
// forward (the turn is taken at the shoulder - upper-arm outward roll - and along the forearm, not across the elbow: arm-orient r2).
// The hips slowly sit back toward the heels until the inside of the forearms stretches, the heels of the hands stay down; hold; then
// come back. Loop 8 s: 0.6 s set, 1.8 s sit back, 4.4 s hold, 1.2 s return (the 30 s hold is the dose).
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HZ = 0.19, KX = -0.515, KY = 0.0407, KZ = 0.0857, FX = -0.868, BACK = -0.105;
const p = keys([[0, 0], [0.6, 0], [2.4, 1], [6.8, 1]], DUR);
// fingers toward the knees (-X), turned out a little (less forearm supination); ua/el = upper-arm / forearm roll (deg) set from the elbow-hinge metrics
const UA = 80, EL = 83;
const hand = (zs) => ({ mode: 'floor', at: [0.0, zs * HZ], finger: [-1, zs * 0.15], poleUp: [zs * -0.24, 0.95, 0.18], upperArmTwist: zs * UA, elbowTwist: zs * EL });
export default {
  id: 't-kneeling-wrist-flexor-stretch', name: '跪姿前臂拉伸', nameEn: 'Kneeling Forearm Stretch (Fingers to Knees)',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: { back: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [-0.52, 0.414, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 8]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: { right: hand(1), left: hand(-1) },
      feet: {
        right: { mode: 'floor', at: [FX, KZ], heading: 90, pitch: 62, pole: [KX, KY, KZ] },
        left: { mode: 'floor', at: [FX, -KZ], heading: 90, pitch: 62, pole: [KX, KY, -KZ] },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 },
        { type: 'mid', limb: 'rightLeg', at: [KX, KY, KZ], weight: 1 }, { type: 'mid', limb: 'leftLeg', at: [KX, KY, -KZ], weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0', 'c0'], reg: { px: 0.3, py: 0.3, pz: 1, h0: 0.01, c0: 0.3 }, iters: 80 },
    },
    deltas: { back: { constraints: [{}, {}, {}, {}, { value: BACK }] } },
  },
  highlight: { groups: ['forearms'], side: 'both', pulseTrack: 'back', pulseBase: 0.3 },
  camera: { dir: [0.35, 0.45, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder'], pad: 0.14, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 800, cx: 512, cy: 540 },
  stillAt: 4,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [-0.40, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.3, 2.4, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }],
    allowContact: ['thighR|shinR', 'thighL|shinL'],
  },
  flare2: { version: 'r1', priority: 'P1', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
