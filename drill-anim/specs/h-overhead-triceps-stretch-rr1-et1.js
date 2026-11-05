// h-overhead-triceps-stretch-rr1-et1 (pose-fix r1, 2026-11-05; user device mark r2-v1 2.6 s "left forearm twisted").
// On armfix-r2 the bend-plane forearm frames and rr1's fixed hand orientations disagree for the whole loop: the left hand
// sits 134 deg rolled against its forearm (forearm itself -30 deg), the right hand -167 deg (forearm +123 deg), so the
// wrists/forearms read as wrung even though nothing moves (the roll-range scan cannot see a constant twist).
// et1 only adds a constant forearm roll (elbowTwist, degrees) so the same hand orientation is reached with a physiological
// split: left +60 (hand-vs-forearm 134 -> 74), right -110 (-167 -> -57). Hand positions/orientations, poles, timing,
// camera unchanged.
import base from './h-overhead-triceps-stretch-rr1.js';
const s = structuredClone(base);
s.id = 'h-overhead-triceps-stretch-rr1-et1';
s.pose.base.hands.left.elbowTwist = 60;
s.pose.base.hands.right.elbowTwist = -110;
export default s;
