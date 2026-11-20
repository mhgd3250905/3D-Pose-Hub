// t-chair-support-hold 双椅直臂支撑（肩胛下压） (straight-arm support between two chairs, shoulder-blade depression hold)
// · Flare 2.0 new moves r1 (2026-11-20), P0. Standard: tools/flare2-moves/standards/t-chair-support-hold.md.
// Two equal-height chairs side by side, seats facing forward, the trainee between them. One hand flat on each seat (fingers forward),
// arms locked straight the whole set. Knees bent forward, toes under the hips: relaxed, the toe tips lightly touch the floor
// ("脚尖轻点地"); pressing the shoulders down lifts the body ~4 cm and the toes come just off the floor for the hold ("双脚离地").
// (With 45 cm seats the hips hang at about seat height, so the legs must bend; feet further back made the knees almost touch the floor.)
// The movement is the shoulder blades: from relaxed (shoulders up toward the ears) the trainee pushes the seats away and pulls the
// shoulders DOWN (scapular depression) - the arms stay straight, so the whole body rises ~4 cm - holds there, then relaxes back.
// Implemented with shoulders.shift (chest frame -Y = depression), drawn on V5 by v5.scapulaShift (opt-in, tools/v5/runtime/v5-hub.js).
// Hands: 'fingertips' hand mode on the seat top (flat straight hand, lowest point on the seat), same mode as t-seated-shoulder-ext-slide.
// Loop 8 s: 0.8 s relaxed, 1.2 s press down, 4.6 s hold, 1.4 s relax. Facing +Z, head up (+Y), body left = +X.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, SEAT = 0.45, CW = 0.40, CX = 0.43, HX = 0.29, HZ = -0.03, HAND_CLEAR = 0.0055;
const p = keys([[0, 0], [0.8, 0], [2.0, 1], [6.6, 1]], DUR);
// chest frame: relaxed = shoulders 12 mm up toward the ears; pressed = 30 mm down. LIFT: the feet follow the body up as the shoulders
// press down, so the toes leave the floor in the hold.
const UP = [0, 0.012, 0], DOWN = [0, -0.030, 0], LIFT = 0.035;
const seatHand = (sg) => ({ mode: 'fingertips', at: [sg * HX, HZ], floor: SEAT, clear: HAND_CLEAR, finger: [sg * 0.08, 0, 1], normal: [0, -1, 0],
  poleUp: [sg * 0.35, 0.4, -1] });
const foot = (sg) => ({ mode: 'floor', at: [sg * 0.10, -0.12], heading: sg * 4, pitch: 78, lift: 0, poleLow: [sg * 0.12, 0.6, 1.2] });
export default {
  id: 't-chair-support-hold', name: '双椅直臂支撑', nameEn: 'Chair Support Hold (Shoulder Depression)',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { press: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0, 0.50, -0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      shoulders: { shift: UP },
      hands: { left: seatHand(1), right: seatHand(-1) },
      feet: { left: foot(1), right: foot(-1) },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: -0.03, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.2 } },
    },
    deltas: { press: { shoulders: { shift: DOWN }, feet: { left: { lift: LIFT }, right: { lift: LIFT } } } },
  },
  highlight: { groups: ['triceps', 'deltoids'], side: 'both', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [0.45, 0.12, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 760, height: 820, cx: 520, cy: 520 },
  stillAt: 4,
  shadow: { joints: ['leftToe', 'rightToe', 'pelvis'], blobs: [{ j: 'leftToe', rx: 30, ry: 9, a: 0.5 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }], bands: [] },
  props: [
    { type: 'chair', at: [CX, 0, 0], yaw: 0, height: SEAT, width: CW, depth: 0.42 },
    { type: 'chair', at: [-CX, 0, 0], yaw: 0, height: SEAT, width: CW, depth: 0.42 },
  ],
  keyFrames: [0.4, 2.0, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso'],
  },
  flare2: { version: 'r1', priority: 'P0', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
