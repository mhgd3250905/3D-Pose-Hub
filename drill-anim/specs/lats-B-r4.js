// lats-B-r4 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces lats-B-r3.
// Band straight-arm pulldown: upper arms untouched (lats-B-r3 rolled them and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: right +60.
import base from './lats-B-r2.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'lats-B-r4';
fixSide(s, 'right', 0, 60);
export default s;
