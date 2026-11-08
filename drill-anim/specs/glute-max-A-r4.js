// glute-max-A-r4 (pose fix 2026-11-08 r2, user review: BOTH elbows of the single-leg bridge still pinched into a thin
// "candy-wrapper" neck after r3). Cause: r3 aligned hand vs forearm with elbowTwist +-120 only, so the forearm was rolled
// ~134 deg against the upper arm across the elbow (elbow min cross-section 40 mm vs 80 mm on the rest pose = 0.50).
// Fix: roll the whole arm at the shoulder. upperArmTwist turns the humerus so the elbow pit faces up and in toward the
// body (left pit dir (0.24,0.72..0.84,0.48..0.65), right mirrored), elbowTwist 15 keeps the elbow a near-pure hinge, and the
// remaining palm-down pronation (~45 deg) is split by the runtime twistShare between forearm and wrist.
// Measured (pose-batch-1108/elbow.js, t 0/0.8/2.1): elbow min width >= 0.98 of rest on both arms, forearm-vs-upper-arm
// twist 17-22 deg, hand-vs-forearm 21-28 deg. Bone roll only: wrist/elbow positions, palms, ground fix, timing, camera unchanged.
import base from './glute-max-A-r3.js';
const s = structuredClone(base);
s.id = 'glute-max-A-r4';
s.pose.base.hands.left.upperArmTwist = 60;
s.pose.base.hands.left.elbowTwist = 15;
s.pose.base.hands.right.upperArmTwist = -60;
s.pose.base.hands.right.elbowTwist = -15;
export default s;
