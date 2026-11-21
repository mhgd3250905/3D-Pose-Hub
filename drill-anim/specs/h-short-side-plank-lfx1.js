// h-short-side-plank-lfx1 (legacy-fix r1, 2026-11-21, codex/legacy-fix-r1): built on h-short-side-plank-gc1-et1 (unchanged file).
// Audit (tools/legacy-audit-r1) S1: both feet reversed (toes pointed at the back of the shin, foot vs knee 173-180 deg), shins folded
// up toward the head (knee 67 deg, foot 8 cm above the knee), top foot 175 mm off the floor. Correct bent-knee side plank
// (ACE/NASM side-bridge regression): forearm + lower knee/shin outer side on the floor, knees ~90 deg, shins straight behind the body,
// feet stacked, lower foot's outer edge on the floor, relaxed plantar-flexed feet with the toes continuing behind.
// Only the two feet change (ankle target + foot rotation): shin now perpendicular to the thigh and about level with the knee (ankle = knee
// + 0.417 m straight back, lower ankle raised 4 cm / upper 2 cm so the lower shoe edge rests on the mat and the upper shoe on it), foot turned +150 deg about the leg's lateral axis instead of -90 deg (rest frame: toes down/back).
// Pelvis, hips, chest, arms, poles, timing (8 s hold) and camera unchanged.
import base from './h-short-side-plank-gc1-et1.js';
const s = structuredClone(base);
s.id = 'h-short-side-plank-lfx1';
const AX = [0.4223, -0.9064, 0]; // world direction of the pelvis' lateral (rest +x) axis, as in the source spec
s.pose.base.feet.left = { ...s.pose.base.feet.left, ankle: [0.0455, 0.5235, -0.4008], rot: [[AX, 150]] };
s.pose.base.feet.right = { ...s.pose.base.feet.right, ankle: [-0.0510, 0.5177, -0.4018], rot: [[AX, 150]] };
export default s;
