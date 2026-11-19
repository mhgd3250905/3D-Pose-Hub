// t-frog-stand 蛙立 (frog stand) · Thomas supplement r1 (2026-11-19). Head up (+Y), body faces +Z, body left = +X (t-* convention).
// Deep squat, hands flat on the mat shoulder-width with the fingers spread and slightly turned out, elbows a little bent; the inner
// knees press on the outside of the upper arms just above the elbows; the body leans forward, the weight moves onto the hands and
// the toes come off the mat; hold, then lean back and put the toes down. Built with the armfix floorDrill helper (t-tuck-planche-r5).
// No shoulders.shift (V5 copies bone rotations only). Loop 8 s: 0.6 s crouch on the toes, 1.4 s lean + lift, 4.4 s hold, 1.6 s back.
import { floorDrill, curve, qaStd } from './_thomas-armfix-r1.mjs';
const T = 8, up = curve([[0, 0], [0.6, 0], [2.0, 1], [6.4, 1]], T);
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const legDown = [0.08, -0.172, -0.07], legUp = [0.08, -0.198, -0.09];          // hip -> ankle (world, left; mirrored for right)
const leg = (sg, u) => { const r = mix(legDown, legUp, u); r[0] *= sg; return { rel: r, pf: -28, kneeUp: [sg * 0.25, 0.3, 0.9] }; };
const spec = floorDrill({
  id: 't-frog-stand', name: '蛙立', nameEn: 'Frog Stand', T,
  hands: { left: [0.18, 0, [0.3, 1]], right: [-0.18, 0, [-0.3, 1]] },
  poleUp: sg => [sg * 0.9, 0.2, -0.6],
  fn: t => { const u = up(t); return { pitch: 78 + 10 * u, waist: 0, py: 0.44 + 0.04 * u, pw: 1, pz: -0.30 + 0.05 * u, pzw: 0.6, shift: 0, elbow: 152,
    legs: { left: leg(1, u), right: leg(-1, u) } }; },
  solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.05 }, iters: 80 },
  extra: () => ({ 'constraints.0.weight': 20, 'constraints.1.weight': 20 }),
  tags: { up },
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
spec.alignClavicles = false; spec.breath = 0;
spec.shadow = { joints: [], blobs: [], bands: [] };
spec.thomasSupplement = { version: 'r1', item: '2', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default spec;
