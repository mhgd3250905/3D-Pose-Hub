// t-frog-stand 蛙立 (frog stand) · Thomas supplement r2 (2026-11-19). Head up (+Y), body faces +Z, body left = +X (t-* convention).
// Deep squat on the toes, hands flat on the mat shoulder-width, fingers spread and pointing forward; elbows bent and pointing back;
// the inner knees press on the outside/back of the upper arms a hand's width above the elbows; the body leans forward until the shoulders are
// a little in front of the wrists, the weight moves onto the hands and the feet come off the mat; hold, lean back, toes down.
// r2 (precision pass, standard tools/thomas-sup/standards/t-frog-stand.md): the body leans until the centre of mass is over the palms
// (r1: 8-13 cm behind the wrists with the feet up = would fall back); shoulders ~23 cm past the wrists, hips above the shoulders, elbows
// ~120 deg pointing back (r1 152, flared), the knees actually rest on the outside of the upper arms above the elbows, t~0.65 shoulder->elbow (r1: 22-33 mm
// gap, at the elbow), toes stay planted during the lean and lift only after it, shoulders pressed down (shoulders.shift depression,
// drawn by V5 via v5.scapulaShift). Built with the armfix floorDrill helper (t-tuck-planche-r5).
// Loop 8 s: 0.6 s crouch on the toes, 1.4 s lean (toes down), 0.5 s feet up, 3.6 s hold, 0.5 s feet down, 1.4 s lean back.
import { floorDrill, curve, qaStd } from './_thomas-armfix-r1.mjs';
const T = 8;
// lean (trunk + arms) 0.6 -> 2.0 s with the toes planted; feet lift 2.0 -> 2.5 s only once the centre of mass is over the palms;
// hold 2.5 -> 6.1 s; feet down 6.1 -> 6.6 s; lean back 6.6 -> 8.0 s.
const lean = curve([[0, 0], [0.6, 0], [2.0, 1], [6.6, 1]], T), lift = curve([[0, 0], [2.0, 0], [2.5, 1], [6.1, 1], [6.6, 0]], T);
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const lerp = (a, b, u) => a + (b - a) * u;
// trunk/arm state at lean 0 (crouched behind the hands) and lean 1 (centre of mass over the palms, ~2 cm in front of the wrists)
const S0 = { pitch: 78, waist: 0, py: 0.44, pz: -0.30, elbow: 150, shift: 0.006 };
const S1 = { pitch: 105, waist: 6, py: 0.50, pz: -0.14, elbow: 120, shift: 0.015 };
// legs (left; right mirrored). PLANT = toes planted on the mat while the body leans: per lean weight 0, 0.1 .. 1 the hip -> ankle
// offset (world), the knee direction and the foot plantar flexion, from tools/thomas-sup/frog-legs.py --pf-sign -1 --t-arm 0.65
// --off 0.092 (2026-11-19) on the V5 joints of this spec: knee centre 92 mm out from the upper-arm axis at 65 % shoulder -> elbow
// (inner knee pressing on the outside of the upper arm, a hand's width above the elbow), toe tips fixed on the mat; ankle raised
// 3.5 mm x lean weight so the toe tips do not sink into the mat at full lean. HOLD = feet off the mat (same knee contact, shin as
// in the r2 hold, ankles tucked up behind).
// r2 fix (2026-11-19): at 80 % / 84 mm the elbow dug into the distal thigh (capsule forearm|thigh -36 mm, mesh ~20-25 mm);
// at 65 % / 92 mm: capsule -3 mm, mesh: forearm vertices not inside the thigh/shin in the hold.
const PLANT = [
  [0.0918, -0.1793, -0.0242, 0.397, 0.08, 0.914, -22.05],
  [0.0944, -0.1924, -0.0301, 0.396, 0.051, 0.917, -20.13],
  [0.0972, -0.2046, -0.0366, 0.395, 0.023, 0.918, -18.2],
  [0.0999, -0.2165, -0.0448, 0.395, -0.007, 0.919, -16.4],
  [0.1026, -0.2275, -0.0533, 0.394, -0.037, 0.918, -14.7],
  [0.1052, -0.2381, -0.0628, 0.394, -0.068, 0.917, -13.19],
  [0.1077, -0.2481, -0.0731, 0.393, -0.098, 0.914, -11.88],
  [0.1098, -0.2577, -0.0844, 0.394, -0.129, 0.91, -10.85],
  [0.1117, -0.267, -0.0964, 0.394, -0.16, 0.905, -10.07],
  [0.1132, -0.2757, -0.1088, 0.395, -0.19, 0.899, -9.55],
  [0.1145, -0.2841, -0.1218, 0.396, -0.22, 0.892, -9.3]];
const HOLD = { rel: [0.0764, -0.1554, -0.1120], kneeUp: [0.427, -0.381, 0.820], pf: -28 };
const planted = u => { const x = Math.min(PLANT.length - 1.000001, Math.max(0, u * (PLANT.length - 1))), i = Math.floor(x), f = x - i;
  const r = mix(PLANT[i], PLANT[i + 1], f); return { rel: r.slice(0, 3), kneeUp: r.slice(3, 6), pf: r[6] }; };
const leg = (sg, u, w) => { const p = planted(u), r = mix(p.rel, HOLD.rel, w), k = mix(p.kneeUp, HOLD.kneeUp, w); r[0] *= sg; k[0] *= sg;
  return { rel: r, pf: lerp(p.pf, HOLD.pf, w), kneeUp: k }; };
const spec = floorDrill({
  id: 't-frog-stand', name: '蛙立', nameEn: 'Frog Stand', T,
  hands: { left: [0.18, 0, [0.12, 1]], right: [-0.18, 0, [-0.12, 1]] },
  poleUp: sg => [sg * 0.35, 0.2, -0.9],
  fn: t => { const u = lean(t), w = lift(t), st = k => lerp(S0[k], S1[k], u);
    return { pitch: st('pitch'), waist: st('waist'), py: st('py'), pw: 1, pz: st('pz'), pzw: 0.6, shift: st('shift'), elbow: st('elbow'),
      legs: { left: leg(1, u, w), right: leg(-1, u, w) } }; },
  solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.05 }, iters: 80 },
  extra: () => ({ 'constraints.0.weight': 20, 'constraints.1.weight': 20 }),
  tags: { up: lean, lift },
  highlight: { groups: ['forearms', 'deltoids'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [1, 0.18, 0.12], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.22, k: 1, drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, at: 4, fitTimeline: true },
  keyFrames: [0.3, 1.5, 4],
  qa: qaStd({ straightLegs: [], straightArms: [], more: { hipFlexMax: 150 }, allow: ['torso|thighL', 'torso|thighR', 'upperArmL|thighL', 'upperArmR|thighR'] }),
});
spec.fps = 30; spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.runtimeModel = { profile: 'training-human-v3-armfix', version: '0.1.0-r2' };
spec.nativeHands = { twistShare: 1 };
spec.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
spec.v5 = { scapulaShift: true };
spec.alignClavicles = false; spec.breath = 0;
spec.shadow = { joints: [], blobs: [], bands: [] };
spec.thomasSupplement = { version: 'r2', item: '2', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default spec;
