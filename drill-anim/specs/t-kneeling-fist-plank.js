// t-kneeling-fist-plank 跪姿拳面支撑 (kneeling knuckle plank, static) · Flare 2.0 练后 专项补强, r3 batch 2a (2026-11-21).
// Standard: tools/flare2-moves-r3/standards/t-kneeling-fist-plank.md.
// Kneeling plank (knees on the mat, knee-hip-shoulder one straight line, feet on the tucked toes) on the FISTS: knuckles of the index
// and middle fingers on the mat, palms facing each other (thumbs forward), forearms vertical under the shoulders and the WRIST
// PERFECTLY STRAIGHT (back of the hand in line with the forearm), elbows locked. Static hold.
// Kneeling set-up of t-kneeling-scap-pushup (knees pinned on the mat, arms locked, solver px / py / h0). The fist is the V5-only finger
// pose floorFist (drill-anim/lib/flare2-r3.mjs; proximal phalanges at a right angle to the back of the hand so knuckles + phalanx backs
// make the flat contact face); the hand bone points straight down, so the metacarpals continue the vertical forearm (no tilt: a tilt
// toward the index side would bend the wrist; "weight on the index + middle knuckles" is carried by the cue text).
// Head points -X, body faces the floor, body left = +Z. Loop 8 s, static (highlight pulse = "keep holding").
import { SHAPES, perFrame } from '../lib/flare2-r3.mjs';
const DUR = 8;
const KNEE = [0.826, 0.049];                // knee joint centre (x, height) on the mat (t-kneeling-scap-pushup)
const HX = 0.185, HZ = 0.19;                // fists under the shoulders (x), a little narrower than the flat-hand set-up (z)
const WY = 0.157;                           // wrist pivot height above the mat with the fist standing on its knuckles (measured on V5)
// left fist (+Z): hand bone straight down, palm facing the other fist (-Z), thumbs forward; mirrored for the right fist
// FINGER = commanded hub finger axis: the V5 hand bone's metacarpal line (wrist pivot -> MCP centre) sits ~10 deg toward the feet and
// ~3.5 deg sideways of the hub palm-frame finger axis (measured on V5 in the sandbox), so the command leans the other way and the
// V5 back of the hand comes out vertical
const FINGER = [-0.176, -0.983, 0.061];
const fist = s => { const sg = s === 'left' ? 1 : -1, f = [FINGER[0], FINGER[1], sg * FINGER[2]], l = Math.hypot(...f);
  return { mode: 'free', frame: 'world', wrist: [HX, WY, sg * HZ], finger: f.map(x => +(x / l).toFixed(5)), normal: [0, 0, -sg], relax: 0, poleUp: [sg * 0.4, 0.95, 0.13] }; };
export default {
  id: 't-kneeling-fist-plank', name: '跪姿拳面支撑', nameEn: 'Kneeling Knuckle Plank',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: { hold: [[0, 1]] } },
  pose: {
    base: {
      pelvis: [0.42404, 0.26142, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -32.25971]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: { left: fist('left'), right: fist('right') },
      feet: {
        left: { mode: 'floor', at: [1.201, 0.085], heading: -90, pitch: 62, pole: [0.8155, 0.04, 0.085] },
        right: { mode: 'floor', at: [1.201, -0.085], heading: -90, pitch: 62, pole: [0.8155, 0.04, -0.085] },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 20 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 20 },
        ...['leftKnee', 'rightKnee'].flatMap(j => [{ type: 'joint', joint: j, axis: [0, 1, 0], value: KNEE[1], weight: 20 }, { type: 'joint', joint: j, axis: [1, 0, 0], value: KNEE[0], weight: 20 }]),
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 0.01, py: 0.01, h0: 0.001 }, iters: 60 },
    },
    deltas: {},
  },
  v5r2: { fps: 30, hands: { left: perFrame(DUR, () => SHAPES.floorFist), right: perFrame(DUR, () => SHAPES.floorFist) } },
  highlight: { groups: ['forearms', 'abs'], side: 'both', pulseAt: [2, 6], pulseWidth: 1.2, pulseBase: 0.45 },
  camera: { dir: [-0.3, 0.22, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.14, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 800, height: 780, cx: 512, cy: 535 },
  stillAt: 4,
  shadow: { joints: ['leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.5, 4, 7.5],
  qa: { pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'rightKnee' }], allowContact: ['thighL|shinL', 'thighR|shinR'], straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }] },
  flare2: { version: 'r3', batch: '2a', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
