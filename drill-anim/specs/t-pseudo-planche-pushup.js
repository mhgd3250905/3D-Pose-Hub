// t-pseudo-planche-pushup 伪俄挺俯卧撑 (pseudo planche push-up) · Flare 2.0 new moves r1 (2026-11-20), P0.
// Standard: tools/flare2-moves/standards/t-pseudo-planche-pushup.md. Frame of serratus-A / t-planche-lean: head points -X, body faces
// the floor, body left = +Z.
// Push-up position with the hands down by the waist, fingers turned out (and slightly back). The whole straight body leans forward
// so the shoulders are well in front of the hands (~17 cm), then the elbows bend straight back along the body (tucked, not flared)
// and the chest lowers while the lean is kept (the shoulders travel further forward, ~24 cm past the hands at the bottom), and the
// arms press back up to straight. Body one line from head to heels the whole time; the feet stay on the toes and do not move (the
// body pivots about the ankles). Shoulder blades pushed apart and down at the top (shoulders.shift, drawn by v5.scapulaShift).
// Loop 8 s = 2 reps: 0.4 s top, 1.5 s down, 0.3 s bottom, 1.2 s press, 0.6 s top (x2).
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HZ = 0.19, FZ = 0.10;
const LEAD_TOP = 0.190, LEAD_BOT = 0.260;   // shoulders in front of the hands (m, along -X)
// Feet: the toe tips stay put on the mat and the feet roll over them as the body lowers (pitch FP_TOP -> FP_BOT, ankles move toward
// the head by FX_TOP - FX_BOT), so the straight body (thorax-ankle 1.28 m) fits both the high top and the low bottom without sagging.
const FX_TOP = 1.064, FP_TOP = 76.2, FX_BOT = 1.017, FP_BOT = 90;
const ELB_BOT = 88;
const p = keys([[0, 0], [0.4, 0], [1.9, 1], [2.2, 1], [3.4, 0], [4.4, 0], [5.9, 1], [6.2, 1], [7.4, 0]], DUR);
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [0.18, Math.sign(z) * 1], poleUp: [side === 'right' ? -0.12 : 0.12, -0.85, -0.5] });
export default {
  id: 't-pseudo-planche-pushup', name: '伪俄挺俯卧撑', nameEn: 'Pseudo Planche Push-Up',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { down: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0.30, 0.40, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -15]] },
      chest: { waist: [[[0, 0, 1], 3]] },
      shoulders: { shift: [0, -0.010, 0.020] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX_TOP, -FZ], heading: -90, pitch: FP_TOP }, left: { mode: 'floor', at: [FX_TOP, FZ], heading: -90, pitch: FP_TOP } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 10 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.08 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.08 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -LEAD_TOP, weight: 0.3 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { down: { constraints: [{ angle: ELB_BOT }, { angle: ELB_BOT }, {}, {}, {}, {}, { value: -LEAD_BOT }], shoulders: { shift: [0, -0.006, 0.006] },
      feet: { right: { pitch: FP_BOT, at: [FX_BOT, -FZ] }, left: { pitch: FP_BOT, at: [FX_BOT, FZ] } } } },
  },
  highlight: { groups: ['deltoids', 'serratus', 'triceps', 'chest'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [0.0, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder', 'leftElbow'], pad: 0.12, k: 1, drift: 0, at: 2 },
  frame: { mode: 'fit', width: 800, cx: 512, cy: 520 },
  stillAt: 0.2,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.45, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 2.0, 2.8],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso'],
  },
  flare2: { version: 'r1', priority: 'P0', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
