// n-windshield-r4 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces n-windshield-r3.
// Supine windshield wipers: upper arms untouched (n-windshield-r3 rolled them and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: left -45, right +45.
import base from './n-windshield-r2-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'n-windshield-r4';
fixSide(s, 'left', 0, -45);
fixSide(s, 'right', 0, 45);
export default s;
