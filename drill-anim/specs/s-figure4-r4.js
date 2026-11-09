// s-figure4-r4 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces s-figure4-r3.
// Supine figure-4 stretch: upper arms untouched (s-figure4-r3 rolled them and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: left -90, right +90.
import base from './s-figure4-r2-et1-sc2-fa1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 's-figure4-r4';
fixSide(s, 'left', 0, -90);
fixSide(s, 'right', 0, 90);
export default s;
