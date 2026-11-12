// n-straddle-fold-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces n-straddle-fold-r2.
// Seated straddle fold: arms reach down inside the legs: upper arms untouched (n-straddle-fold-r2 rolled them and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: left -150, right +150.
import base from './n-straddle-fold-gc-int1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'n-straddle-fold-r3';
fixSide(s, 'left', 0, -150);
fixSide(s, 'right', 0, 150);
export default s;
