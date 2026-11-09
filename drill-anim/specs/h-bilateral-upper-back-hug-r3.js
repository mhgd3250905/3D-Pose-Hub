// h-bilateral-upper-back-hug-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-bilateral-upper-back-hug-r2.
// Bilateral upper-back hug stretch: upper arms untouched (h-bilateral-upper-back-hug-r2 rolled them and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: right -120.
import base from './h-bilateral-upper-back-hug-rr3-et3-sc1-kn1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-bilateral-upper-back-hug-r3';
fixSide(s, 'right', 0, -120);
export default s;
