// h-lateral-step-lunge-et1 (pose-fix r2, 2026-11-05): the hand sat rolled >90 deg against its forearm for the whole loop on armfix-r2
// (fixed hand-vs-forearm twist, see docs/reviews/pose-fix-r1). Only a constant forearm roll (elbowTwist, deg) is added so
// the same hand orientation is reached with an even split between forearm roll and hand-vs-forearm: {"left": -55, "right": 55}.
// Hand positions/orientations, poles, timing, camera unchanged.
import base from './h-lateral-step-lunge.js';
const s = structuredClone(base);
s.id = 'h-lateral-step-lunge-et1';
s.pose.base.hands.left.elbowTwist = (s.pose.base.hands.left.elbowTwist ?? 0) + (-55);
s.pose.base.hands.right.elbowTwist = (s.pose.base.hands.right.elbowTwist ?? 0) + (55);
export default s;
