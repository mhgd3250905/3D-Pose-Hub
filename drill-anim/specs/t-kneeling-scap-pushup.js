// t-kneeling-scap-pushup 跪姿肩胛俯卧撑 (kneeling scapular push-up, beginner push-up plus) · Thomas supplement r1 (2026-11-19).
// Knee-supported push-up top position of h-kneeling-pushup-gc2 (its t = 0 frame: pelvis [0.42404, 0.26142, 0], hip pitch -32.26,
// hands flat under the shoulders, knees and feet on the mat). Arms stay locked; only the shoulder blades move, shown as in
// t-pushup-plus (upper back sinks -9 deg / rounds +9 deg at the waist; V5 does not carry shoulders.shift). The solver keeps both
// arms at 178 deg (px, py, hip pitch h0), the knees stay on the mat (joint constraints) and the feet stay planted.
// Head points -X, body faces the floor, body left = +Z. Loop 8 s = 2 reps of 4 s (same timing as t-pushup-plus).
import base from './h-kneeling-pushup-gc2.js';
const s = structuredClone(base);
s.id = 't-kneeling-scap-pushup'; s.name = '跪姿肩胛俯卧撑'; s.nameEn = 'Kneeling Scapular Push-Up';
const rep = t0 => [[t0, 0], [t0 + 0.4, 0], [t0 + 1.5, -1], [t0 + 2.8, 1], [t0 + 3.8, 1]];
s.timeline = { duration: 8, tracks: { scap: [...rep(0), ...rep(4)] } };
const b = s.pose.base;
const KNEE = [0.826, 0.057];   // knee joint centre (x, height) resting on the mat: skin just on the mat top (CPU probe, 2026-11-19)
b.pelvis = [0.42404, 0.26142, 0];
b.hips.rot = [[[0, 0, 1], -32.25971]];
b.chest = { waist: [[[0, 0, 1], 0]] };
b.constraints = [
  { type: 'reach', limb: 'rightArm', angle: 178, weight: 20 }, { type: 'reach', limb: 'leftArm', angle: 178, weight: 20 },
  ...['leftKnee', 'rightKnee'].flatMap(j => [{ type: 'joint', joint: j, axis: [0, 1, 0], value: KNEE[1], weight: 20 }, { type: 'joint', joint: j, axis: [1, 0, 0], value: KNEE[0], weight: 20 }]),
];
b.solve = { vars: ['px', 'py', 'h0'], reg: { px: 0.01, py: 0.01, h0: 0.001 }, iters: 60 };
for (const side of ['left', 'right']) { const h = b.hands[side]; h.at = [-0.04, h.at[1]]; h.clear = 0.011; }   // hands 4 cm further forward (straight knee-hip-shoulder line, no sag) and 14 mm lower (V5 palm on the mat)
s.pose.deltas = { scap: { chest: { waist: [[[0, 0, 1], 9]] } } };

s.highlight = { groups: ['serratus'], side: 'both', pulseAt: [3.3, 7.3], pulseWidth: 0.8, pulseBase: 0.25 };
s.keyFrames = [0.2, 1.5, 3.3]; s.stillAt = 0.2;
s.qa = { ...s.qa, straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }] };
s.thomasSupplement = { version: 'r1', item: '1 (beginner)', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
