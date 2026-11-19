// t-kneeling-scap-pushup 跪姿肩胛俯卧撑 (kneeling scapular push-up, beginner push-up plus) · Thomas supplement r2 (2026-11-19).
// Knee-supported push-up top position of h-kneeling-pushup-gc2 (its t = 0 frame: knees and feet on the mat). Arms stay locked;
// only the shoulder blades move: the chest sinks between the arms (retraction), then the floor is pushed away (protraction), 1 s hold
// at the top. The solver keeps both arms at 178 deg (px, py, hip pitch h0) with the knees fixed on the mat, so the straight
// knee-hip-shoulder line pivots about the knees as the chest rises and falls. Head points -X, body faces the floor, body left = +Z.
// r2 (precision pass, standard tools/thomas-sup/standards/t-kneeling-scap-pushup.md), same method as t-pushup-plus r2:
//  - real scapula translation (shoulders.shift along the chest front axis, +-20 mm) drawn by V5 (v5.scapulaShift, opt-in);
//    r1 faked it by bending the waist +-9 deg (chest travel 0, hips rocking -30..+22 mm off the knee-shoulder line);
//  - hands moved 12 cm back toward the knees: r1 had the shoulders 12.6 cm behind the wrists, r2 has them over the wrists;
//  - feet lifted by the mat thickness (r1 toes 6 mm into the mat).
// Loop 8 s = 2 reps of 4 s, starting at the top: 1.0 s hold at the top, 1.3 s sink, 0.2 s pause, 1.5 s push (as t-pushup-plus).
import base from './h-kneeling-pushup-gc2.js';
const s = structuredClone(base);
s.id = 't-kneeling-scap-pushup'; s.name = '跪姿肩胛俯卧撑'; s.nameEn = 'Kneeling Scapular Push-Up';
s.v5 = { scapulaShift: true };
const rep = t0 => [[t0, 1], [t0 + 1.0, 1], [t0 + 2.3, -1], [t0 + 2.5, -1]];
s.timeline = { duration: 8, tracks: { scap: [...rep(0), ...rep(4)] } };
const b = s.pose.base;
const KNEE = [0.826, 0.054];   // knee joint centre (x, height) resting on the mat: skin on the mat top (r1 0.057, r2 3 mm lower: thigh angle changed)
const MAT = 0.006;             // exercise mat thickness (recipe mat prop)
b.pelvis = [0.42404, 0.26142, 0];
b.hips.rot = [[[0, 0, 1], -32.25971]];
b.chest = { waist: [[[0, 0, 1], 0]] };
b.shoulders = { shift: [0, 0, 0] };
b.constraints = [
  { type: 'reach', limb: 'rightArm', angle: 178, weight: 20 }, { type: 'reach', limb: 'leftArm', angle: 178, weight: 20 },
  ...['leftKnee', 'rightKnee'].flatMap(j => [{ type: 'joint', joint: j, axis: [0, 1, 0], value: KNEE[1], weight: 20 }, { type: 'joint', joint: j, axis: [1, 0, 0], value: KNEE[0], weight: 20 }]),
];
b.solve = { vars: ['px', 'py', 'h0'], reg: { px: 0.01, py: 0.01, h0: 0.001 }, iters: 60 };
const HX = 0.08;
for (const side of ['left', 'right']) { const h = b.hands[side]; h.at = [HX, h.at[1]]; h.clear = 0.011; }
for (const side of ['left', 'right']) b.feet[side].lift = MAT;
s.pose.deltas = { scap: { shoulders: { shift: [0, 0, 0.02] } } };   // scap +1 = protraction (+20 mm, chest up), -1 = retraction

s.highlight = { groups: ['serratus'], side: 'both', pulseAt: [0.5, 4.5], pulseWidth: 0.9, pulseBase: 0.25 };
s.keyFrames = [0.5, 2.4, 3.4]; s.stillAt = 0.5;
s.qa = { ...s.qa, straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }] };
s.thomasSupplement = { version: 'r2', item: '1 (beginner)', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
