// t-elevated-pike-hold 脚垫高派克支撑 (feet-elevated pike hold, feet on a chair) · Flare 2.0 new moves r1 (2026-11-20), P2.
// Standard: tools/flare2-moves/standards/t-elevated-pike-hold.md. Frame of h-pike-pushup: head points -X, body faces the floor,
// body left = +Z. t-pike-hold (floor version) imports this spec and only changes the feet, so both use the same camera.
// Balls of the feet on a chair seat (chair against the wall in real life; seat 45 cm, front edge toward the hands), hands flat on the
// mat shoulder-width, fingers forward. Inverted V with the hips high: arms locked and in line with the trunk (ears between the arms),
// hip angle about 90 deg, legs straight. The shoulders push the floor away toward the ears ("直臂顶肩": scapular elevation,
// shoulders.shift +Y in the chest frame, drawn on V5 by v5.scapulaShift) and the position is held.
// Loop 8 s: 0.8 s set, 1.0 s push tall, 5.4 s hold, 0.8 s ease.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HZ = 0.17;
const p = keys([[0, 0], [0.8, 0], [1.8, 1], [7.2, 1]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * 0.12], poleUp: [side === 'right' ? -0.6 : 0.6, 0.2, 0.3] });
export const SEAT = 0.45, FX = 1.13, FZ = 0.10, SH_X = 0.17;
export const foot = (sg, fx = FX, floor = SEAT, pitch = 48) => ({ mode: 'floor', at: [fx, sg * FZ], floor, heading: -90, pitch });
export default {
  id: 't-elevated-pike-hold', name: '脚垫高派克支撑', nameEn: 'Feet-Elevated Pike Hold',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { push: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.45, 0.85, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 64]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      shoulders: { shift: [0, 0.006, 0] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 },
        { type: 'reach', limb: 'rightLeg', angle: 177 }, { type: 'reach', limb: 'leftLeg', angle: 177 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: SH_X, weight: 1 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { push: { shoulders: { shift: [0, 0.026, 0] } } },
  },
  highlight: { groups: ['deltoids', 'triceps'], side: 'both', pulseTrack: 'push', pulseBase: 0.3 },
  camera: { dir: [0.05, 0.15, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 800, height: 800, cx: 512, cy: 520 },
  stillAt: 4,
  shadow: { joints: ['rightPalm', 'leftPalm', 'head'], blobs: [], bands: [] },
  props: [
    { type: 'mat', at: [0.25, 0, 0], size: [1.2, 0.61, 0.006] },
    { type: 'chair', at: [FX + 0.06, 0, 0], yaw: -90, height: SEAT, width: 0.44, depth: 0.42 },
  ],
  keyFrames: [0.4, 1.8, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 170 }, { j: 'knee.left', min: 170 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso'],
  },
  flare2: { version: 'r1', priority: 'P2', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
