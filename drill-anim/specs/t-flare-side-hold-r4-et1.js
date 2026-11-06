// t-flare-side-hold-r4-et1 (pose-fix r2, 2026-11-05): the hand sat rolled >90 deg against its forearm for the whole loop on armfix-r2
// (fixed hand-vs-forearm twist, see docs/reviews/pose-fix-r1). Only a constant forearm roll (elbowTwist, deg) is added so
// the same hand orientation is reached with an even split between forearm roll and hand-vs-forearm: {"right": -100}.
// Hand positions/orientations, poles, timing, camera unchanged.
import base from './t-flare-side-hold-r4.js';
const s = structuredClone(base);
s.id = 't-flare-side-hold-r4-et1';
s.pose.base.hands.right.elbowTwist = (s.pose.base.hands.right.elbowTwist ?? 0) + (-100);
export default s;
