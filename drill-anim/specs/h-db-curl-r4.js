// h-db-curl-r4 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-db-curl-r3.
// Alternating dumbbell curl: upper arms untouched (h-db-curl-r3 rolled them and lost shoulder width); only the forearm roll
// (elbowTwist) moves the roll from the elbow toward the wrist: left +60, right -60.
import base from './h-db-curl-r2-ht1-kn1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-db-curl-r4';
fixSide(s, 'left', 0, 60);
fixSide(s, 'right', 0, -60);
export default s;
