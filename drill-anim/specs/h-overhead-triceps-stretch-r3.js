// h-overhead-triceps-stretch-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-overhead-triceps-stretch-r2.
// Overhead triceps stretch: upper arms untouched (-r2 rolled them -80/+130 deg and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: left +210, right -170.
import base from './h-overhead-triceps-stretch-rr1-et1-kn1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-overhead-triceps-stretch-r3';
fixSide(s, 'left', 0, 210);
fixSide(s, 'right', 0, -170);
export default s;
