// glute-max-A-r3 (pose fix 2026-11-08, user review: the RIGHT hand/forearm of the single-leg glute bridge looks twisted).
// Measured on glute-max-A-r2-gc1-et1 (v3 armfix, elbow-audit scan-fast 4 Hz): left elbowTwist +120 -> hand-vs-forearm 3..17 deg, but
// right -205 (not the mirror) -> right hand twisted 68-82 deg against its forearm. Scan of right +150/+200/+240 and -90/-120/-150:
// +240 (= -120, the mirror of the left +120) gives right hand-vs-forearm -17..-3 deg, the mirror of the left side.
// Only the right elbowTwist changes; hand positions/orientations, poles, timing, camera and the ground-contact fix unchanged.
import base from './glute-max-A-r2-gc1-et1.js';
const s = structuredClone(base);
s.id = 'glute-max-A-r3';
s.pose.base.hands.right.elbowTwist = 240;
export default s;
