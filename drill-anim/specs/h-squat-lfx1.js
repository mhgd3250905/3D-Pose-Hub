// h-squat-lfx1 (legacy-fix r1, 2026-11-21, codex/legacy-fix-r1): built on h-squat-r2-sc1-kn1 (unchanged file).
// Audit (tools/legacy-audit-r1) S1: at the bottom both knees sat 15 cm outside the feet (knee ~39 deg out while the toes point
// 10 deg out), shins slanting inward, patella vs flexion direction 70 deg, knee hinge axis off 52 deg. Cause: the knee poles were
// points in the hips frame ([+-0.42, 0.55, 1]); the pelvis tips forward during the squat and carries those points down and sideways,
// so the IK bent the knees far outward. Correct bodyweight squat (NSCA / ACE): knees track over the toes (2nd-3rd toe), shins near
// vertical seen from the front, whole foot down.
// Change: toes turned out 10 -> 20 deg (NSCA/ACE: feet slightly turned out 15-30 deg, knees follow) and each knee pole is a fixed
// world point far ahead along its foot's heading, so the knee bends in the toe plane through the whole squat. (With 10 deg and knees
// over the toes the thighs closed in and the V5 crotch bulge rose 38 -> 51 mm; 20 deg keeps the thighs apart.) Foot positions,
// pelvis path, depth, hands, timing and camera unchanged.
import base from './h-squat-r2-sc1-kn1.js';
const s = structuredClone(base);
s.id = 'h-squat-lfx1';
const HD = 20, H = HD * Math.PI / 180, D = 2;
for (const [side, sx] of [['left', 1], ['right', -1]]) {
  const f = s.pose.base.feet[side];
  delete f.poleLow; f.heading = sx * HD;
  f.pole = [+(sx * (Math.abs(f.at[0]) + D * Math.sin(H))).toFixed(4), 0.5, +(D * Math.cos(H)).toFixed(4)];
}
export default s;
