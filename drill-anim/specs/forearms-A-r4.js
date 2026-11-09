// forearms-A-r4 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces -r3.
// Quadruped wrist rocking: the hands turn palm-down fingers-forward / sideways / back on the mat, a large time-varying forearm roll
// (ht2 elbowTwist table). The upper arms hung with the elbow pits facing each other (internally rotated), so every hand turn rolled
// the forearm against them (cross-elbow twist L 116 / R 174 deg, elbow ratio L 0.65 / R 0.36). -r3 moved 100% of the time-varying
// roll to the shoulder: the elbows were fixed but the shoulders folded (user 2026-11-09; deltoid band ratio R 0.76 -> 0.31,
// shoulder roll range 21 -> 182 deg).
// Now: a static 45 deg external humerus roll so the elbow pits face forward (toward the head) as when weight-bearing on the hands,
// elbowTwist -45 on both sides, and the time-varying roll stays in the forearm/wrist (c = 0, nothing time-varying at the shoulder).
// Elbow ratio improves but does not reach 0.85 (see the commit message); shoulder band not worse than the original.
import base from './forearms-A-r2-gc1-ht2.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'forearms-A-r4';
fixSide(s, 'left', -45, -45, 0);
fixSide(s, 'right', 45, -45, 0);
export default s;
