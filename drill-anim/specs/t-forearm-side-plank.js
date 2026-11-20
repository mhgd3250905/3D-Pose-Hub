// t-forearm-side-plank 前臂侧桥（直腿）(straight-leg forearm side plank, static) · Flare 2.0 练后 专项补强, r3 batch 2a (2026-11-21).
// Standard: tools/flare2-moves-r3/standards/t-forearm-side-plank.md. New id, distinct from h-short-side-plank (bent knees, short lever).
// Lying on the LEFT side, propped on the left forearm: elbow directly under the shoulder, forearm flat on the mat pointing forward
// (palm down), legs straight and stacked (feet together, the bottom foot on its outer edge), hips lifted HIGH so head, trunk and legs
// form one straight line; top (right) arm reaches straight up to the ceiling. Static hold. One side shown (left side down); the app
// mirrors for the other side.
// Frame (as h-short-side-plank): body up (cranial) -> +X tilted up by the hip roll about +Z, body front -> +Z (toward the camera),
// body left -> down. Solver: px, py, h0 put the left elbow on its floor point (mid constraint) and the bottom ankle at its height above the
// mat with the legs straight in line with the trunk (feet carried rigidly by the hips frame, so the hips cannot sag or pike).
// Loop 8 s, static (the muscle highlight pulses as the "keep holding" cue).
import { SHAPES, perFrame } from '../lib/flare2-r3.mjs';
const DUR = 8;
const TH0 = 18.2;                     // body incline (deg) from the analytic set-up (shoulder over the elbow, ankle on the mat); h0 refines it
const EY = 0.048, WY = 0.031, EZ = -0.014, FAL = 0.228;   // elbow / wrist centre heights on the mat, elbow z (under the shoulder), forearm length
const ANK_Y = 0.086;                  // bottom (left) ankle centre above the mat, foot on its outer edge
const AX = 0.045;                     // ankles 9 cm apart across the body (feet stacked, legs together)
// top arm straight up (world): rest-frame direction for the incline TH0 (body left = (sin, -cos, 0), up = (cos, sin, 0) in the world)
const c = Math.cos(TH0 * Math.PI / 180), s = Math.sin(TH0 * Math.PI / 180);
const UPR = [-c, s, 0];
const SHR = [-0.1879, 1.3702, -0.0042];
const wristR = SHR.map((x, i) => +(x + UPR[i] * 0.482).toFixed(4));
export default {
  id: 't-forearm-side-plank', name: '前臂侧桥（直腿）', nameEn: 'Forearm Side Plank (Straight Legs)',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: { hold: [[0, 1]] } },
  pose: {
    base: {
      pelvis: [-0.506, 0.341, 0],
      hips: { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], TH0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', wrist: [0, WY, EZ + FAL], finger: [0, 0, 1], normal: [0, -1, 0], pole: [0, -0.6, -0.4] },
        right: { mode: 'free', frame: 'chest', wrist: wristR, finger: UPR, normal: [0, 0, 1], poleUp: [-0.5, 1.1, -0.4] },
      },
      feet: {
        left: { mode: 'free', frame: 'hips', ankle: [AX, 0.0892, 0.0057], poleLow: [0.07, 0.5, 0.4], rot: [] },
        right: { mode: 'free', frame: 'hips', ankle: [-AX, 0.0892, 0.0057], poleLow: [-0.07, 0.5, 0.4], rot: [] },
      },
      constraints: [
        { type: 'mid', limb: 'leftArm', at: [0, EY, EZ], weight: 1 },
        { type: 'point', frame: 'hips', at: [AX, 0.0892, 0.0057], axis: [0, 1, 0], value: ANK_Y, weight: 1 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 0.01, py: 0.01, h0: 0.001 }, iters: 60 },
    },
    deltas: {},
  },
  v5r2: { fps: 30, hands: { left: perFrame(DUR, () => SHAPES.flat), right: perFrame(DUR, () => SHAPES.rest) } },
  highlight: { groups: ['obliques'], side: 'left', pulseAt: [2, 6], pulseWidth: 1.2, pulseBase: 0.45 },
  camera: { dir: [0.18, 0.12, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis'], pad: 0.14, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 4,
  shadow: { joints: ['leftElbow', 'leftPalm', 'leftToe', 'rightToe', 'pelvis'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [-0.45, 0, 0.05], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.5, 4, 7.5],
  qa: { pins: [{ c: 'handL', when: 'always' }], jointPins: [{ j: 'leftElbow' }, { j: 'leftAnkle' }], allowContact: [] },
  flare2: { version: 'r3', batch: '2a', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
