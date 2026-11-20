// t-planche-lean-hold 前倾支撑 (planche lean hold, static) · Flare 2.0 练后 专项补强 / Flare2, r3 batch 2a (2026-11-21).
// Standard: tools/flare2-moves-r3/standards/t-planche-lean-hold.md. New id; t-planche-lean (lean in, hold, lean out) is not touched.
// Straight-arm plank on the toes, fingers turned OUT to the sides (~65 deg from forward, never backward), elbows locked, shoulder blades
// pushed apart and down (shoulders.shift drawn by V5 v5.scapulaShift), the straight body leans forward so the shoulders sit ~10-11 cm in
// front of the wrists, and that position is HELD (static). The pose is the held position of t-planche-lean r2 (its lean = 1 values,
// written out here so this spec does not depend on that file). Head points -X, body faces the floor, body left = +Z.
// Loop 8 s, static: the body does not move; the muscle highlight pulses slowly as the "keep holding" cue.
import { SHAPES, perFrame } from '../lib/flare2-r3.mjs';
const DUR = 8;
const HZ = 0.20, HX = -0.03, FZ = 0.10;
const FX = 1.0968780701897884, FP = 96;   // t-planche-lean lean = 1 (toes tucked, feet rolled forward over the toe tips)
const hand = (z, side) => ({ mode: 'floor', at: [HX, z], finger: [-0.45, Math.sign(z) * 1], poleUp: [side === 'right' ? -0.15 : 0.15, 0.95, Math.sign(z) * 0.35] });
export default {
  id: 't-planche-lean-hold', name: '前倾支撑', nameEn: 'Planche Lean Hold',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { hold: [[0, 1]] } },
  pose: {
    base: {
      pelvis: [0.42, 0.4, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -13]] },
      chest: { waist: [[[0, 0, 1], 3]] },
      shoulders: { shift: [0, -0.01, 0.02] },
      hands: { right: hand(-HZ, 'right'), left: hand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: FP }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: FP } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.08 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.08 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0, weight: 0.08 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: {},
  },
  v5r2: { fps: 30, hands: { left: perFrame(DUR, () => SHAPES.flat), right: perFrame(DUR, () => SHAPES.flat) } },
  highlight: { groups: ['deltoids', 'serratus'], side: 'both', pulseAt: [2, 6], pulseWidth: 1.2, pulseBase: 0.45 },
  camera: { dir: [-0.55, 0.42, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 0.6, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 800, cx: 512, cy: 520 },
  stillAt: 4,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.5, 4, 7.5],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso'],
  },
  flare2: { version: 'r3', batch: '2a', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
