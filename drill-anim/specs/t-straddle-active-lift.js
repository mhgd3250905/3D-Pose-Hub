// t-straddle-active-lift 主动分腿压抬腿 (active straddle pancake leg lift-off) · Thomas supplement r1 (2026-11-19).
// Seated straddle on the mat (legs 40 deg out each side), back tall, fingertips resting on the mat beside the thighs; one straight leg, knee
// cap and toes pointing up, lifts 4-5 cm off the mat, holds 2 s and lowers; then the other leg. Head up (+Y), body faces +Z, left = +X.
// Built with the armfix floorDrill helper (seated straddle family: t-seated-straddle-lift-1leg); the pelvis stays on the mat (no
// solver vars), the arms only rest (fingertips, elbows free). Loop 8 s: left leg 0.4-3.8 s, right leg 4.4-7.8 s
// (0.8 s up, 2.0 s hold, 0.6 s down).
import { floorDrill, curve, qaStd } from './_thomas-armfix-r1.mjs';
const T = 8, SP = 40, E0 = -1.2, LIFT = 3.6;
const lift = t0 => curve([[0, 0], [t0, 0], [t0 + 0.8, 1], [t0 + 2.8, 1], [t0 + 3.4, 0]], T);
const uL = lift(0.4), uR = lift(4.4);
// The armfix arm (shoulder->wrist <= 0.485 m) cannot put a flat palm on the mat beside the thighs of a tall seated body (a locked palm
// pulls the torso into the mat), so the hands are free, fingertips resting on the mat (wrist 12 cm up, fingers pointing down-forward).
const tip = sg => ({ mode: 'free', frame: 'world', wrist: [sg * 0.19, 0.132, 0.30], finger: [sg * 0.1, -0.75, 0.65], normal: [sg * 0.1, -0.65, -0.75], relax: 0.4, poleUp: [sg * 0.8, 0.3, -0.5] });
const spec = floorDrill({
  id: 't-straddle-active-lift', name: '主动分腿压抬腿', nameEn: 'Active Straddle Leg Lift', T,
  handsDesc: { left: tip(1), right: tip(-1) },
  fn: t => ({ pitch: 14, waist: -4, py: 0.134, pw: 1, shift: 0, elbow: 170,
    legs: { left: { elev: E0 + LIFT * uL(t), spread: SP, pf: 8, kneeUp: [0, 1, 0] }, right: { elev: E0 + LIFT * uR(t), spread: SP, pf: 8, kneeUp: [0, 1, 0] } } }),
  solve: { vars: [], reg: {}, iters: 1 },
  tags: { upL: uL, upR: uR, up: t => Math.max(uL(t), uR(t)) },
  highlight: { groups: ['adductors', 'hip-flexors'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [0, 0.28, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 1, drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, at: 2, fitTimeline: true },
  keyFrames: [0.2, 2, 6],
  qa: qaStd({ straightLegs: [{ j: 'knee.right', min: 174 }, { j: 'knee.left', min: 174 }], straightArms: [], allow: [] }),
});
spec.fps = 30; spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.runtimeModel = { profile: 'training-human-v3-armfix', version: '0.1.0-r2' };
spec.nativeHands = { twistShare: 1 };
spec.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
spec.alignClavicles = false; spec.breath = 0;
spec.shadow = { joints: [], blobs: [], bands: [] };
spec.thomasSupplement = { version: 'r1', item: '9', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default spec;
