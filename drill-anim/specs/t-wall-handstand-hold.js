// t-wall-handstand-hold 面墙靠墙倒立保持 (chest-to-wall handstand hold) · Flare 2.0 new moves r1 (2026-11-20), P1.
// Standard: tools/flare2-moves/standards/t-wall-handstand-hold.md.
// World: the wall face is the plane z = 0 (wall prop at the origin, facing +Z); the trainee is upside down in front of it, chest and
// belly toward the wall, back toward the room. Hands flat on the mat about a fist from the wall (fingertips ~10 cm), fingers toward the
// wall and turned out a little, shoulder-width. Arms locked, shoulders fully open (arms in line with the trunk, ears between the
// arms), body one straight line from wrists to toes leaning ~4 deg into the wall, only the toe tips touching the wall.
// "直臂顶肩": the shoulders push tall toward the floor-side of the ears (scapular elevation, shoulders.shift +Y in the chest frame,
// drawn on V5 by v5.scapulaShift). Loop 8 s: 0.8 s set, 1.0 s push tall, 5.4 s hold, 0.8 s ease (the static hold is the action; the
// push makes the "顶肩" visible).
// Rig frame: pelvis 'up' (rest +Y, toward the head) = world -Y; 'front' (rest +Z) = world -Z (toward the wall); body left = +X.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HX = 0.175, HZ = 0.28, LEAN = -7.35;
const p = keys([[0, 0], [0.8, 0], [1.8, 1], [7.2, 1]], DUR);
const floorHand = (sg) => ({ mode: 'floor', at: [sg * HX, HZ], finger: [sg * 0.25, -1], poleUp: [sg * 0.9, 0, 0.35] });
// legs straight in line with the pelvis (rest standing ankles, carried by the pelvis), feet pointed (toes away from the shins)
const foot = (sg) => ({ mode: 'free', frame: 'hips', ankle: [sg * 0.075, 0.09, -0.02], rot: [[[1, 0, 0], 62]], poleLow: [sg * 0.05, 0.5, 1.0] });
export default {
  id: 't-wall-handstand-hold', name: '面墙靠墙倒立', nameEn: 'Chest-to-Wall Handstand Hold',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { push: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0, 1.30, 0.12],
      hips: { up: [0, -1, 0], front: [0, 0, -1], rot: [[[1, 0, 0], LEAN]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, 0.006, 0] },
      hands: { left: floorHand(1), right: floorHand(-1) },
      feet: { left: foot(1), right: foot(-1) },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 0, 1], value: HZ - 0.045, weight: 2 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.2 } },
    },
    deltas: { push: { shoulders: { shift: [0, 0.026, 0] } } },
  },
  highlight: { groups: ['deltoids', 'triceps'], side: 'both', pulseTrack: 'push', pulseBase: 0.3 },
  camera: { dir: [1, 0.12, 0.35], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 760, height: 820, cx: 520, cy: 520 },
  stillAt: 4,
  shadow: { joints: ['leftPalm', 'rightPalm', 'head'], blobs: [], bands: [] },
  props: [
    { type: 'mat', at: [0, 0, 0.55], size: [1.0, 1.0, 0.006] },
    { type: 'wall', at: [0, 0, 0], yaw: 0, size: [1.8, 2.4, 0.12] },
  ],
  keyFrames: [0.4, 1.8, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso'],
  },
  flare2: { version: 'r1', priority: 'P1', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
