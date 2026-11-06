// h-supine-bilateral-leg-raise-gc2-et1 (pose-fix r8 gc-overlap, 2026-11-05): built on the ground-contact spec h-supine-bilateral-leg-raise-gc2 (fix/ground-contact-r1), NOT on the
// PR #29 version. The hand sat rolled >90 deg against its forearm for the whole loop on armfix-r2 (fixed hand-vs-forearm twist,
// see docs/reviews/pose-fix-r1). Only a constant forearm roll (elbowTwist, deg) is added so the same hand orientation is
// reached with an even split between forearm roll and hand-vs-forearm: {"left": 95, "right": -190}.
// Hand positions/orientations, poles, timing, camera and the ground-contact fix unchanged.
import base from './h-supine-bilateral-leg-raise-gc2.js';
const s = structuredClone(base);
s.id = 'h-supine-bilateral-leg-raise-gc2-et1';
s.pose.base.hands.left.elbowTwist = (s.pose.base.hands.left.elbowTwist ?? 0) + (95);
s.pose.base.hands.right.elbowTwist = (s.pose.base.hands.right.elbowTwist ?? 0) + (-190);
export default s;
