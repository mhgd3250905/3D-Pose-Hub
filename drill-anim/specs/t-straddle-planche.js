// t-straddle-planche 分腿俄挺 (straddle planche hold) · Thomas supplement r1 (2026-11-19). Head up (+Y), body faces +Z, body left = +X
// (t-* convention; the hips are pitched ~90 deg so the body is horizontal, face down, head toward +Z). Built with the armfix
// floorDrill helper like t-tuck-planche-r5 (the advanced step after it). Hands flat on the mat, fingers turned out, arms locked,
// shoulders well in front of the hands; the straight legs open from narrow (20 deg each side) to a wide straddle (SPREAD deg), body and
// legs level with the floor; hold, then bring the legs in. Loop 8 s: 1.4 s open, 5.0 s hold, 1.6 s close.
// r2 (precision pass, standard tools/thomas-sup/standards/t-straddle-planche.md):
//  - balance: the whole-body centre of mass sits over the palms (r1: 18-20 cm behind the wrists, i.e. the body would tip onto the
//    feet). With the arms locked and the hands fixed the lean is set by the pelvis height (PY0 + PYK * u): lower = shoulders further
//    past the wrists. Narrow legs need more lean, so the body rises 4.7 cm as the straddle opens; shoulders ~34-40 cm past the wrists;
//  - straddle 100 deg between the legs at the hold (r1 76; Calisthenics Association: >= 90 useful, 120+ ideal);
//  - shoulder blades pushed apart and down as real scapula translation (shoulders.shift +20 mm protraction, 10 mm depression,
//    drawn by V5 via v5.scapulaShift) on top of the slightly rounded upper back (waist +6 deg, posterior pelvic tilt);
//  - fingers turned further out (~75 deg, r1 ~60) so the deeper lean does not bend the wrists back further (~100 deg);
//  - palms ON the 6 mm mat (fingertips hand mode; r1 floor mode put them 4.8 mm into it).
import { floorDrill, curve, qaStd, reach } from './_thomas-armfix-r1.mjs';
const T = 8, up = curve([[0, 0], [1.4, 1], [6.4, 1], [8, 0]], T);
const D2R = Math.PI / 180, L = reach(178), SPREAD = 50, PZ0 = -0.060, PZK = -0.041, PY0 = 0.335, PYK = 0.047, MAT = 0.006;
const FX = 0.97, FZ = 0.25;   // fingers turned out ~75 deg (r1 ~60): with the ~47 deg arm lean that keeps the wrist bend near 100 deg (r1 99)
const legRel = (sg, spread, elev) => [sg * Math.sin(spread * D2R) * Math.cos(elev * D2R) * L, Math.sin(elev * D2R) * L, -Math.cos(spread * D2R) * Math.cos(elev * D2R) * L];
const spec = floorDrill({
  id: 't-straddle-planche', name: '分腿俄挺', nameEn: 'Straddle Planche', T,
  hands: { left: [0.20, 0, [0.85, 0.5]], right: [-0.20, 0, [-0.85, 0.5]] },
  handsDesc: { left: { mode: 'fingertips', at: [0.20, 0], floor: MAT, clear: 0.004, finger: [FX, 0, FZ], normal: [0, -1, 0], poleUp: [0.5, 0.2, -1] },
    right: { mode: 'fingertips', at: [-0.20, 0], floor: MAT, clear: 0.004, finger: [-FX, 0, FZ], normal: [0, -1, 0], poleUp: [-0.5, 0.2, -1] } },
  poleUp: sg => [sg * 0.5, 0.2, -1],
  fn: t => { const u = up(t), sp = 20 + (SPREAD - 20) * u;
    return { pitch: 88, waist: 6, py: PY0 + PYK * u, pw: 1, pz: PZ0 + PZK * u, pzw: 0.3, shift: 0.010, elbow: 178,
      legs: { left: { rel: legRel(1, sp, 2), pf: 40, kneeUp: [0.35, -1, 0] }, right: { rel: legRel(-1, sp, 2), pf: 40, kneeUp: [-0.35, -1, 0] } } }; },
  solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.05 }, iters: 80 },
  extra: () => ({ 'constraints.0.weight': 20, 'constraints.1.weight': 20, 'shoulders.shift.2': 0.020 }),
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
spec.v5 = { scapulaShift: true };
spec.thomasSupplement = { version: 'r2', item: '10', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default spec;
