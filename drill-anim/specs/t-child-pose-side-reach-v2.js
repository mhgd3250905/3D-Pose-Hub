// t-child-pose-side-reach-v2 婴儿式侧伸 (child's pose with side reach) · Flare 2.0 r3 batch 2b (2026-11-21), new id = retry of the r2
// draft t-child-pose-side-reach (deferred in r2 after two failed sandbox self-checks: knees through the mat, hips off the heels, bent
// arms; that file is not touched). Standard: tools/flare2-moves-r3/standards/t-child-pose-side-reach-v2.md.
// Kneeling on the mat, knees hip-width, tops of the feet on the mat, hips sitting back on the heels; the trunk folds forward over
// the thighs, head toward the mat, arms long in front with the palms on the mat. Then both hands walk (one after the other) far to
// the LEFT and the trunk side-bends with them, so the RIGHT side of the back (lats / side of the trunk) stretches; hips stay on the
// heels; static hold; hands come back to the middle and the same to the right. Both sides in one loop (no mirror).
// 16 s loop: centre 0-1, hands to the left 1-2.6 (left hand leads), hold to 6.5, back 6.5-8, hands to the right 8-9.6, hold to 13.5,
// back 13.5-15, centre to 16. Frame of the r2 draft: head points +X, the body faces the floor (-Y), body left = -Z.
// r3 fix: the legs are PLACED from the v2plus leg lengths (thigh 0.4103 m, shin 0.4168 m measured on V5; the r2 draft's pelvis put the
// hip joints too far from the knees, so the knee IK went under the mat): shins flat on the mat (knee joints KY above the mat), hip
// joints just in front of / above the ankles at exactly one thigh length from the knees, knee poles below the mat. The pelvis is
// computed from those hip joints. Only the trunk is solved: forward fold b0 and side bend b1 of the whole upper body about the pelvis
// (chest.body; no waist rotation, r3 attempt 2) so both arms reach their hands at elbow 168 deg.
import { build } from '../lib/home-anim.mjs';
import { restToWorld } from '../lib/ss-geo.mjs';
import { win } from '../lib/flare2-r3.mjs';
const DUR = 16, LT = 0.4103, LS = 0.4168;
const FX = -0.42, FZ = 0.075, KY = 0.044, KZ = 0.10, AY = 0.058;         // ankles (x, +-z), knee joint height, knees +-z, ankle height
const HOFF = 0.035;                                                     // hip joints this far in front of the ankles (x)
const KX = FX + Math.sqrt(LS * LS - (AY - KY) ** 2 - (KZ - FZ) ** 2);   // knee x: shin flat from the ankle
const HXJ = FX + HOFF, HYJ = KY + Math.sqrt(LT * LT - (KX - HXJ) ** 2 - (KZ - 0.0815) ** 2);   // hip joints (x, y)
const TILT = 12;                                                        // pelvis up axis above horizontal (toward the head, +X), deg
const hips = { up: [+Math.cos(TILT * Math.PI / 180).toFixed(5), +Math.sin(TILT * Math.PI / 180).toFixed(5), 0], front: [+Math.sin(TILT * Math.PI / 180).toFixed(5), -Math.cos(TILT * Math.PI / 180).toFixed(5), 0], rot: [] };
const HIPMID = [0, 0.852 - 0.8996, 0.0057 - 0.0102];                     // rest hip-joint midpoint relative to the rest pelvis (lib/ss-geo REST)
const PELVIS = (() => { const o = restToWorld(hips, HIPMID); return [HXJ - o[0], HYJ - o[1], -o[2]].map(x => +x.toFixed(5)); })();
// knee pole: from the hip-ankle midpoint out through the designed knee (so the two-bone IK puts the knee on its mark on the mat)
const KPOLE = sg => { const H = [HXJ, HYJ, sg * 0.0815], A = [FX, AY, sg * FZ], K = [KX, KY, sg * KZ], M = H.map((x, i) => (x + A[i]) / 2); return K.map((x, i) => +(x + 2 * (x - M[i])).toFixed(4)); };
const LIFT = 0.010;   // V5 instep sits ~14 mm deeper than the hub foot points with the foot flat on its top (sandbox)
const HX = 0.48, HZ = 0.14, SX = 0.40, SZ = 0.32;      // hands: centre at x HX, z +-HZ; side reach to x SX, z shifted -+SZ (both to one side)
const go = (t, a, b) => win(t, a, b);
// the hand on the side being reached toward moves first, the other follows ("walking" the hands over); + = to the body left (-Z)
const sideL = t => go(t, 1.0, 1.9) * (1 - go(t, 6.5, 7.4)) - go(t, 8.7, 9.6) * (1 - go(t, 14.1, 15.0));
const sideR = t => go(t, 1.7, 2.6) * (1 - go(t, 7.1, 8.0)) - go(t, 8.0, 8.9) * (1 - go(t, 13.5, 14.4));
const side = t => (sideR(t) + sideL(t)) / 2;
const handAt = (s, t) => { const k = s === 'right' ? sideR(t) : sideL(t), z0 = s === 'right' ? HZ : -HZ;   // right hand at +Z (body right)
  return [+(HX + (SX - HX) * Math.abs(k)).toFixed(4), +(z0 - SZ * k).toFixed(4)]; };
const fingerAt = (s, t) => { const k = s === 'right' ? sideR(t) : sideL(t); return [1, +(-0.55 * k).toFixed(4)]; };
const hand = s => ({ mode: 'floor', at: t => handAt(s, t), finger: t => fingerAt(s, t), poleUp: [s === 'right' ? -0.3 : 0.3, 1.1, -0.2] });
const SIDE = 30;   // waist side bend toward the reach (about world Y), deg (solver c1 adds to it)
const P = build(DUR, {
  pelvis: PELVIS,
  hips,
  chest: { body: [[[0, 0, 1], -8], [[0, 1, 0], t => +(SIDE * side(t)).toFixed(3)]] },
  hands: { right: hand('right'), left: hand('left') },
  feet: {
    right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 172, lift: LIFT, pole: KPOLE(1) },
    left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 172, lift: LIFT, pole: KPOLE(-1) },
  },
  constraints: [
    { type: 'reach', limb: 'rightArm', angle: 170, weight: 10 }, { type: 'reach', limb: 'leftArm', angle: 170, weight: 10 },
  ],
  solve: { vars: ['b0', 'b1'], reg: { b0: 0.05, b1: 0.05 }, iters: 60 },
}, { side: t => Math.abs(side(t)) });
export default {
  id: 't-child-pose-side-reach-v2', name: '婴儿式侧伸', nameEn: "Child's Pose Side Reach",
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats'], side: 'both', pulseTrack: 'side', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.95, 0.45], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 900, cx: 512, cy: 540 },
  stillAt: 4,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.5, 4.0, 11.5],
  qa: { pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }], allowContact: ['thighR|shinR', 'thighL|shinL', 'torso|thighR', 'torso|thighL', 'thighL|thighR'] },
  flare2: { version: 'r3', batch: '2b', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false,
    doseBrief: '表：静态，左右各一次；草稿每侧 30 秒（与 r2 练后拉伸一致，待定）', doseStatus: 'draft (AI, 开哥 to confirm)' },
};
