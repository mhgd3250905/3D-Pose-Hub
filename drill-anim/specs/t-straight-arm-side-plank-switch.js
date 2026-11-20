// t-straight-arm-side-plank-switch 直臂侧桥转换 (straight-arm plank to side plank, alternating) · Flare 2.0 练后 专项补强 / Flare2,
// r3 batch 2a (2026-11-21). Standard: tools/flare2-moves-r3/standards/t-straight-arm-side-plank-switch.md.
// Straight-arm plank (hands under the shoulders, elbows LOCKED, body one line, on the toes). Keeping the support elbow locked, the whole
// body turns as one piece onto one hand into a straight-arm side plank (support shoulder stacked over its hand, top arm reaching to the
// ceiling, hips high, feet pivoting onto their edges, staggered), holds briefly, turns back to the plank, then the same to the other
// side. No push-up: the chest never dips (both arms straight the whole time).
// Loop 12 s = one turn to each side: 0-0.65 plank, 0.65-2.3 turn onto the LEFT hand, 2.3-3.3 hold, 3.3-4.85 back, 4.85-6.0 plank; 6-12 the
// same onto the RIGHT hand. Head points -X, body faces the floor in the plank, body left = +Z.
// Body roll about the long axis is set per frame (hips.rot[0] about +X: +90 = left side down); the solver (px, py, pz, h1 = incline, h2 = yaw)
// keeps the support arm locked with its shoulder over the hand and both legs straight to the planted feet. Feet stay on their spots
// (floor mode) and turn rigidly with the body (heading / pitch / roll = YXZ Euler of roll(X) * plank foot), so they pivot from the
// tucked toes onto their edges; the floor height comes from the foot's lowest point every frame.
import { build, keys } from '../lib/home-anim.mjs';
import { SHAPES, mix, perFrame } from '../lib/flare2-r3.mjs';
const DUR = 12, HX = 0.0, HZ = 0.19, FX = 1.21, FZ = 0.10, FP = 64, PITCH0 = -17;
// roll: + = onto the left hand, - = onto the right hand
// (the turn starts 0.15 s after the top hand starts to leave and ends 0.15 s before it is down: a hand the engine still treats as
// locked on the floor must not have to turn with the body)
const roll = keys([[0, 0], [0.65, 0], [2.3, 90], [3.3, 90], [4.85, 0], [6.0, 0], [6.65, 0], [8.3, -90], [9.3, -90], [10.85, 0]], DUR);
// top hand off the floor (w: 0 planted .. 1 reaching up): it leaves the floor as the turn starts (both hands planted cannot turn with
// locked arms) and lands as the turn ends
const wR = keys([[0, 0], [0.5, 0], [2.0, 1], [3.6, 1], [5.0, 0]], DUR);
const wL = t => wR(t - 6);
const supL = t => Math.min(1, Math.max(0, roll(t) / 30)), supR = t => Math.min(1, Math.max(0, -roll(t) / 30));
// shoulder-over-hand weight: light while both hands are down, firm on the support side, off on the side whose hand has left the floor
const shW = (sup, w) => +((0.3 + 0.7 * sup) * (1 - Math.min(1, 20 * w))).toFixed(4);
// plank foot: toes toward the head (heading -90), tipped down FP (toes tucked); turned with the body about +X by the roll
const D2R = Math.PI / 180;
const mmul = (A, B) => A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const Rx = a => { const c = Math.cos(a * D2R), s = Math.sin(a * D2R); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
const Ry = a => { const c = Math.cos(a * D2R), s = Math.sin(a * D2R); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
const footHPR = t => { const M = mmul(Rx(roll(t)), mmul(Ry(-90), Rx(FP)));
  // three.js Euler 'YXZ' (engine floor foot: Ry(heading) * Rx(pitch) * Rz(roll)) from the rotation matrix
  const x = Math.asin(Math.max(-1, Math.min(1, -M[1][2]))), y = Math.atan2(M[0][2], M[2][2]), z = Math.atan2(M[1][0], M[1][1]);
  return [+(y / D2R).toFixed(3), +(x / D2R).toFixed(3), +(z / D2R).toFixed(3)]; };
// top arm in the chest frame: straight out of the shoulder sideways (= to the ceiling in the side plank), palm facing the front
const SH = s => [s === 'left' ? 0.1879 : -0.1879, 1.3702, -0.0042];
const TILT = 17 * Math.PI / 180;   // body incline: the incline tips the body's lateral axis toward the feet by it, so the top arm leans toward the head by it
const UPD = s => [(s === 'left' ? 1 : -1) * Math.cos(TILT), Math.sin(TILT), 0];
const upWrist = s => SH(s).map((x, i) => +(x + UPD(s)[i] * 0.4845).toFixed(4));
const floorHand = (z, side) => ({ mode: 'floor', at: [HX, z], finger: [-1, 0], poleUp: [side === 'right' ? -0.15 : 0.15, 0.95, Math.sign(z) * 0.35] });
// the lifting hand sweeps out to the side (arc away from the body) instead of straight through the shoulder
const freeHand = side => ({ mode: 'free', frame: 'chest', wrist: upWrist(side), finger: UPD(side).map(x => +x.toFixed(4)), normal: [0, 0, 1], poleUp: [side === 'left' ? 0.3 : -0.3, 1.0, -0.6] });
const P = build(DUR, {
  pelvis: [0.42, 0.40, 0],
  hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[1, 0, 0], roll], [[0, 0, 1], PITCH0], [[0, 1, 0], 0]] },
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: {
    left: { plant: floorHand(HZ, 'left'), free: freeHand('left'), w: wL, arc: 0.40, arcDir: [0, 0.2, 1] },
    right: { plant: floorHand(-HZ, 'right'), free: freeHand('right'), w: wR, arc: 0.40, arcDir: [0, 0.2, -1] },
  },
  feet: {
    left: { mode: 'floor', at: [FX, FZ], heading: t => footHPR(t)[0], pitch: t => footHPR(t)[1], roll: t => footHPR(t)[2] },
    right: { mode: 'floor', at: [FX, -FZ], heading: t => footHPR(t)[0], pitch: t => footHPR(t)[1], roll: t => footHPR(t)[2] },
  },
  constraints: [
    { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 },
    { type: 'reach', limb: 'leftLeg', angle: 178, weight: 10 }, { type: 'reach', limb: 'rightLeg', angle: 178, weight: 10 },
    { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 1.5 }, { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 1.5 },
    // shoulder over its hand: both lightly in the plank, the support side firmly in the side plank
    { type: 'point', frame: 'chest', at: SH('left'), axis: [1, 0, 0], value: HX, weight: t => shW(supL(t), wL(t)) },
    { type: 'point', frame: 'chest', at: SH('left'), axis: [0, 0, 1], value: HZ, weight: t => shW(supL(t), wL(t)) },
    { type: 'point', frame: 'chest', at: SH('right'), axis: [1, 0, 0], value: HX, weight: t => shW(supR(t), wR(t)) },
    { type: 'point', frame: 'chest', at: SH('right'), axis: [0, 0, 1], value: -HZ, weight: t => shW(supR(t), wR(t)) },
  ],
  solve: { vars: ['px', 'py', 'pz', 'h1', 'h2'], reg: { px: 0.01, py: 0.01, pz: 0.01, h1: 0.001, h2: 0.001 }, iters: 200 },
}, { turn: t => Math.abs(roll(t)) / 90 });
export default {
  id: 't-straight-arm-side-plank-switch', name: '直臂侧桥转换', nameEn: 'Straight-Arm Plank to Side Plank Switch',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  v5r2: { fps: 30, hands: { left: perFrame(DUR, t => mix({ flat: 1 - wL(t), rest: wL(t) })), right: perFrame(DUR, t => mix({ flat: 1 - wR(t), rest: wR(t) })) } },
  highlight: { groups: ['obliques', 'deltoids'], side: 'both', pulseTrack: 'turn', pulseBase: 0.3 },
  camera: { dir: [-0.75, 0.6, 0.25], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1, drift: 0, at: 0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 520 },
  stillAt: 2.8,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.3, 2.8, 8.8],
  qa: { pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }], straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }], allowContact: ['upperArmR|torso', 'upperArmL|torso'] },
  flare2: { version: 'r3', batch: '2a', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
