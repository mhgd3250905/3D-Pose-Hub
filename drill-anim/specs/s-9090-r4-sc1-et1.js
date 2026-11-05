// s-9090-r4-sc1-et1 (pose-fix r9, 2026-11-05): hand sat rolled 90-120 deg against its forearm for the whole loop (fixed hand-vs-forearm
// twist, docs/reviews/pose-fix-r1 r9). Only a constant forearm roll (elbowTwist, deg) is added so the same hand orientation is reached
// with the roll split between forearm and hand: {"left": 50}. Hand positions/orientations, poles, timing, props, camera unchanged.
import base from './s-9090-r4-sc1.js';
const s = structuredClone(base);
s.id = 's-9090-r4-sc1-et1';
s.pose.base.hands.left.elbowTwist = (s.pose.base.hands.left.elbowTwist ?? 0) + (50);
export default s;
