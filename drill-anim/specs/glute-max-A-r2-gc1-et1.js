// glute-max-A-r2-gc1-et1 (pose-fix r8 gc-overlap, 2026-11-05): built on the ground-contact spec glute-max-A-r2-gc1 (fix/ground-contact-r1), NOT on the
// PR #29 version. The hand sat rolled >90 deg against its forearm for the whole loop on armfix-r2 (fixed hand-vs-forearm twist,
// see docs/reviews/pose-fix-r1). Only a constant forearm roll (elbowTwist, deg) is added so the same hand orientation is
// reached with an even split between forearm roll and hand-vs-forearm: {"left": 120, "right": -205}.
// Hand positions/orientations, poles, timing, camera and the ground-contact fix unchanged.
import base from './glute-max-A-r2-gc1.js';
const s = structuredClone(base);
s.id = 'glute-max-A-r2-gc1-et1';
s.pose.base.hands.left.elbowTwist = (s.pose.base.hands.left.elbowTwist ?? 0) + (120);
s.pose.base.hands.right.elbowTwist = (s.pose.base.hands.right.elbowTwist ?? 0) + (-205);
export default s;
