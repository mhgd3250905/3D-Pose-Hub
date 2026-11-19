// t-straddle-planche 分腿俄挺 (straddle planche hold) · Thomas supplement r1 (2026-11-19). Head up (+Y), body faces +Z, body left = +X
// (t-* convention; the hips are pitched ~90 deg so the body is horizontal, face down, head toward +Z). Built with the armfix
// floorDrill helper like t-tuck-planche-r5 (the advanced step after it). Hands flat on the mat, fingers turned out, arms locked,
// shoulders well in front of the hands; the straight legs open from narrow (20 deg each side) to a wide straddle (38 deg), body and
// legs level with the floor; hold, then bring the legs in. No shoulders.shift (V5 copies bone rotations only); the pushed-apart
// shoulder blades are shown as a slightly rounded upper back (waist +6 deg). Loop 8 s: 1.4 s open, 5.0 s hold, 1.6 s close.
import { floorDrill, curve, qaStd, reach } from './_thomas-armfix-r1.mjs';
const T = 8, up = curve([[0, 0], [1.4, 1], [6.4, 1], [8, 0]], T);
const D2R = Math.PI / 180, L = reach(178);
const legRel = (sg, spread, elev) => [sg * Math.sin(spread * D2R) * Math.cos(elev * D2R) * L, Math.sin(elev * D2R) * L, -Math.cos(spread * D2R) * Math.cos(elev * D2R) * L];
const spec = floorDrill({
  id: 't-straddle-planche', name: '分腿俄挺', nameEn: 'Straddle Planche', T,
  hands: { left: [0.20, 0, [0.85, 0.5]], right: [-0.20, 0, [-0.85, 0.5]] },
  poleUp: sg => [sg * 0.5, 0.2, -1],
  fn: t => { const u = up(t), sp = 20 + 18 * u;
    return { pitch: 88, waist: 6, py: 0.47, pw: 1, pz: -0.30, pzw: 0.3, shift: 0, elbow: 178,
      legs: { left: { rel: legRel(1, sp, 2), pf: 40, kneeUp: [0.35, -1, 0] }, right: { rel: legRel(-1, sp, 2), pf: 40, kneeUp: [-0.35, -1, 0] } } }; },
  solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.05 }, iters: 80 },
  extra: () => ({ 'constraints.0.weight': 20, 'constraints.1.weight': 20 }),
  tags: { up },
  highlight: { groups: ['deltoids', 'serratus'], side: 'both', pulseTrack: 'up', pulseBase: 0.4 },
  camera: { dir: [1, 0.2, 0.3], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1, drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, at: 4, fitTimeline: true },
  keyFrames: [0.2, 1.4, 4],
  qa: qaStd({ straightLegs: [{ j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }], straightArms: [{ j: 'elbow.right', min: 175 }, { j: 'elbow.left', min: 175 }], allow: [] }),
});
spec.fps = 30; spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.runtimeModel = { profile: 'training-human-v3-armfix', version: '0.1.0-r2' };
spec.nativeHands = { twistShare: 1 };
spec.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
spec.alignClavicles = false; spec.breath = 0;
spec.shadow = { joints: [], blobs: [], bands: [] };
spec.thomasSupplement = { version: 'r1', item: '10', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default spec;
