// t-tuck-lsit-hold 团身 L 撑（手垫瑜伽砖） (tuck L-sit hold, hands on yoga blocks / thick books) · Flare 2.0 new moves r1 (2026-11-20), P0.
// Standard: tools/flare2-moves/standards/t-tuck-lsit-hold.md. Facing +Z, head up (+Y), body left = +X.
// Sitting on the mat between two yoga blocks (23 x 15 x 10 cm, flat), palms flat on the blocks beside the hips, fingers forward.
// Straight arms push the blocks down and the shoulders down (scapular depression): the hips come off the mat, then the knees are
// pulled in to the chest and the feet come off the mat; hold; then the feet and the hips are set back down.
// Blocks: drawn with the mat prop (a coloured 15 x 23 x 10 cm slab, top face at at.y = 0.10; `block: true` marks it for
// tools/flare2-moves/check.mjs, which measures it as a box and keeps the floor at the real mat).
// Hands: 'fingertips' hand mode on the block top (flat straight hand, lowest point on the block), as t-chair-support-hold.
// Shoulders: shoulders.shift (chest frame -Y = depression), drawn on V5 by v5.scapulaShift (opt-in).
// Loop 8 s: 0.5 s seated (hips and heels on the mat), 0.9 s press up (hips off), 0.8 s tuck (feet off), 3.8 s hold, 0.8 s feet down,
// 0.8 s hips down, 0.4 s seated.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, ELB_SEAT = 102, BH = 0.10, HX = 0.27, HZ = 0.0, HAND_CLEAR = 0.0055;
const up = keys([[0, 0], [0.5, 0], [1.4, 1], [7.2, 1], [7.6, 0]], DUR);      // hips off the mat (arms push, shoulders down)
const tuck = keys([[0, 0], [1.4, 0], [2.2, 1], [6.0, 1], [6.8, 0]], DUR);    // knees to the chest, feet off the mat
// feet ('free', frame 'world'): seated = feet flat on the mat in front (knees bent ~90 deg); they stay there while the hips rise;
// tuck = heels pulled in under the backs of the thighs, ~4 cm off the mat, toes pointed a little.
const SEATED = { x: 0.11, y: 0.084, z: 0.60, rot: 0 }, TUCK = { x: 0.09, y: 0.188, z: 0.32, rot: 20 };
const blockHand = (sg) => ({ mode: 'fingertips', at: [sg * HX, HZ], floor: BH, clear: HAND_CLEAR, finger: [sg * 0.12, 0, 1], normal: [0, -1, 0],
  poleUp: [sg * 0.3, 0.3, -1] });
const foot = (sg, a) => ({ mode: 'free', frame: 'world', ankle: [sg * a.x, a.y, a.z], rot: [[[1, 0, 0], a.rot]], poleLow: [sg * 0.10, 1.6, 0.45] });   // knee pole above the knees
export default {
  id: 't-tuck-lsit-hold', name: '团身 L 撑', nameEn: 'Tuck L-Sit Hold (Hands on Blocks)',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { up: track(DUR, up), tuck: track(DUR, tuck) } },
  pose: {
    base: {
      pelvis: [0, 0.17, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -8]] },
      chest: { waist: [[[1, 0, 0], 6]] },
      shoulders: { shift: [0, 0.0, 0] },
      hands: { left: blockHand(1), right: blockHand(-1) },
      feet: { left: foot(1, SEATED), right: foot(-1, SEATED) },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: ELB_SEAT, weight: 10 }, { type: 'reach', limb: 'rightArm', angle: ELB_SEAT, weight: 10 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: -0.01, weight: 1 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.2 } },
    },
    deltas: {
      up: { constraints: [{ angle: 178.5 }, { angle: 178.5 }, {}, {}], shoulders: { shift: [0, -0.030, 0.008] } },
      tuck: { feet: { left: foot(1, TUCK), right: foot(-1, TUCK) }, hips: { rot: [[[1, 0, 0], -12]] }, chest: { waist: [[[1, 0, 0], 14]] } },
    },
  },
  highlight: { groups: ['abs', 'hip-flexors', 'triceps'], side: 'both', pulseTrack: 'tuck', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.2, 0.66], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 760, height: 820, cx: 520, cy: 520 },
  stillAt: 4,
  shadow: { joints: ['leftPalm', 'rightPalm', 'pelvis'], blobs: [], bands: [] },
  props: [
    { type: 'mat', at: [0, 0, 0.2], size: [1.0, 1.0, 0.006] },
    { type: 'mat', block: true, at: [HX + 0.01, BH, 0.05], size: [0.15, 0.23, BH], colour: '#c9a26a', edgeColour: '#b48d58' },   // cork yoga block
    { type: 'mat', block: true, at: [-HX - 0.01, BH, 0.05], size: [0.15, 0.23, BH], colour: '#c9a26a', edgeColour: '#b48d58' },
  ],
  keyFrames: [0.3, 1.4, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172, when: 'params.up>0.999' }, { j: 'elbow.left', min: 172, when: 'params.up>0.999' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'thighL|torso', 'thighR|torso', 'thighL|shinL', 'thighR|shinR'],
  },
  flare2: { version: 'r1', priority: 'P0', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
