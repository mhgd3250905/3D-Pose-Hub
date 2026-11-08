// erectors-A-r2 (pose fix 2026-11-08, user review: the RIGHT hand/forearm of the reverse plank looks twisted).
// Measured on erectors-A-et1 (v3 armfix, elbow-audit scan-fast 4 Hz): left elbowTwist -180 -> hand-vs-forearm -15..5 deg, but right +90
// (not the mirror) -> right hand twisted 88-103 deg against its forearm for the whole loop. Scan of right elbowTwist +150/+180/+210/-150/-180/-210:
// -180 (= mirror of the left -180) gives right hand-vs-forearm -5..15 deg, the mirror of the left side; the forearm-roll reading 167-173 deg
// vs the left 6-12 deg is the same 180 deg left/right bone-roll convention seen on glute-max-A (mesh twist elbow/mid/wrist 17/5/2 deg vs left -14/-7/-3).
// Only the right elbowTwist changes; hand positions/orientations, poles, timing, camera unchanged.
import base from './erectors-A-et1.js';
const s = structuredClone(base);
s.id = 'erectors-A-r2';
s.pose.base.hands.right.elbowTwist = -180;
export default s;
