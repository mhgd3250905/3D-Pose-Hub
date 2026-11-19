// t-straddle-active-lift 主动分腿压抬腿 (active straddle leg lift-off) · Thomas supplement r2 (2026-11-19).
// Seated straddle on the mat (legs 40 deg out each side), back straight, pelvis tipped forward (hip hinge, no rounding), palms flat on
// the mat between the legs, arms resting straight (they do not push the hips up); one straight leg, knee cap and toes pointing up,
// lifts off the mat (heel ~4 cm above the mat), holds 2 s and lowers under control; then the other leg. Head up (+Y), body faces +Z, left = +X.
// Measurable standard: tools/thomas-sup/standards/t-straddle-active-lift.md.
// r1 -> r2: r1 sat nearly upright (pitch 14) with fingertips on the mat because the armfix arm (shoulder -> wrist <= 0.485 m) cannot
// reach a flat palm beside the hips of an upright seated body; r2 tips the pelvis forward 30 deg (hip hinge, back straight), puts the
// palms flat on the mat between the legs in front of the hips (fingertips hand mode on the 6 mm mat; z 0.385 keeps the elbow ~170: at
// 0.39 the arm reaches full length and the solver starts pulling the torso), and depresses the shoulder blades 15 mm (V5 v5.scapulaShift).
// Knee caps: the hub swings each straight leg from rest by the shortest arc in the pelvis frame, which for a pitched pelvis and a 40 deg
// straddle rolls the thigh and shin ~65 deg inward (knee caps facing the other leg) while the foot is aligned toes-up on its own;
// thighTwist / kneeTwist -65 (left) / +65 (right) undo that roll (knee caps and toes up, <= 4 deg). The pelvis height is scripted
// directly (extra pelvis.1; solve.vars is empty): 0.129 m seats the buttocks / backs of the thighs on the mat (-2 mm) instead of 10 mm above.
// Loop 8 s: left leg up 0.05-1.05 s, hold 1.05-3.05, down 3.05-3.95; right leg the same from 4.05 s.
import { floorDrill, curve, qaStd } from './_thomas-armfix-r1.mjs';
const T = 8, SP = 40, E0 = -1.45, LIFT = 2.5, PITCH = 30, HX = 0.18, HZ = 0.385, SHIFT = 0.015, PY = 0.129, MAT = 0.006, TW = -65;
const FG = sg => [sg * 0.25, 0, 1];
const lift = t0 => curve([[0, 0], [t0, 0], [t0 + 1.0, 1], [t0 + 3.0, 1], [t0 + 3.9, 0]], T);
const uL = lift(0.05), uR = lift(4.05);
const spec = floorDrill({
  id: 't-straddle-active-lift', name: '主动分腿压抬腿', nameEn: 'Active Straddle Leg Lift', T,
  hands: { left: [HX, HZ], right: [-HX, HZ] },
  handsDesc: { left: { mode: 'fingertips', at: [HX, HZ], floor: MAT, clear: 0.004, finger: FG(1), normal: [0, -1, 0], poleUp: [0.6, 0.3, -0.8] },
    right: { mode: 'fingertips', at: [-HX, HZ], floor: MAT, clear: 0.004, finger: FG(-1), normal: [0, -1, 0], poleUp: [-0.6, 0.3, -0.8] } },
  elbow: 178,
  fn: t => ({ pitch: PITCH, waist: 0, py: PY, pw: 1, shift: SHIFT, elbow: 178,
    legs: { left: { elev: E0 + LIFT * uL(t), spread: SP, pf: 8, kneeUp: [0, 1, 0], thighTwist: TW, kneeTwist: TW }, right: { elev: E0 + LIFT * uR(t), spread: SP, pf: 8, kneeUp: [0, 1, 0], thighTwist: -TW, kneeTwist: -TW } } }),
  extra: () => ({ 'pelvis.1': PY }),   // solve.vars is empty: the pelvis height is scripted directly
  solve: { vars: [], reg: {}, iters: 1 },
  tags: { upL: uL, upR: uR, up: t => Math.max(uL(t), uR(t)) },
  highlight: { groups: ['adductors', 'hip-flexors'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [0, 0.28, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 1, drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, at: 2, fitTimeline: true },
  keyFrames: [0.02, 2, 6],
  qa: qaStd({ straightLegs: [{ j: 'knee.right', min: 174 }, { j: 'knee.left', min: 174 }], straightArms: [], allow: [] }),
});
spec.fps = 30; spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.runtimeModel = { profile: 'training-human-v3-armfix', version: '0.1.0-r2' };
spec.nativeHands = { twistShare: 1 };
spec.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
spec.alignClavicles = false; spec.breath = 0;
spec.shadow = { joints: [], blobs: [], bands: [] };
spec.v5 = { scapulaShift: true };
spec.thomasSupplement = { version: 'r2', item: '9', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default spec;
