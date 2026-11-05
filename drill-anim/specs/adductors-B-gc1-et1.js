// adductors-B-gc1-et1 (pose-fix r8 gc-overlap, 2026-11-05): built on the ground-contact spec adductors-B-gc1 (fix/ground-contact-r1), NOT on the
// PR #29 version. The hand sat rolled >90 deg against its forearm for the whole loop on armfix-r2 (fixed hand-vs-forearm twist,
// see docs/reviews/pose-fix-r1). Only a constant forearm roll (elbowTwist, deg) is added so the same hand orientation is
// reached with an even split between forearm roll and hand-vs-forearm: {"left": 55}.
// Hand positions/orientations, poles, timing, camera and the ground-contact fix unchanged.
import base from './adductors-B-gc1.js';
const s = structuredClone(base);
s.id = 'adductors-B-gc1-et1';
s.pose.base.hands.left.elbowTwist = (s.pose.base.hands.left.elbowTwist ?? 0) + (55);
export default s;
