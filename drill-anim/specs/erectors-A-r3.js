// erectors-A-r3 (pose fix 2026-11-08 r2, user review: BOTH elbows of the reverse plank still pinched into a thin
// "candy-wrapper" neck after r2). Cause: r2/et1 put the whole hand roll into elbowTwist (forearm roll about its own axis,
// +-180 deg) while the upper arm kept its default roll, so the skin across the elbow was twisted 172-180 deg
// (elbow min cross-section 29-31 mm vs 80 mm on the rest pose = 0.37-0.38).
// Fix: roll the whole arm at the shoulder instead. upperArmTwist rotates the humerus so the elbow pit faces the feet
// (+X, slightly medial: pit dir (0.92,-0.19,0.35) left / mirror right), elbowTwist follows it so the elbow stays a pure hinge;
// the remaining hand roll (~60 deg) is split by the runtime twistShare between forearm and wrist.
// Measured (pose-batch-1108/elbow.js, t 0.2/1.0/2.6): elbow min width >= 0.95 of rest on both arms, forearm-vs-upper-arm
// twist ~36 deg, hand-vs-forearm ~25 deg. Bone roll only: wrist/elbow positions, palms, poles, timing, camera unchanged.
import base from './erectors-A-r2.js';
const s = structuredClone(base);
s.id = 'erectors-A-r3';
s.pose.base.hands.left.upperArmTwist = 105;
s.pose.base.hands.left.elbowTwist = 75;
s.pose.base.hands.right.upperArmTwist = -105;
s.pose.base.hands.right.elbowTwist = -75;
export default s;
