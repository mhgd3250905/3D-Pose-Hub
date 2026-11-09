// h-wall-pec-r7 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-wall-pec-r6.
// Wall single-arm pec stretch: orientation-first, smaller upper-arm roll than h-wall-pec-r6 (which lost shoulder width): right upperArmTwist +20 elbowTwist +0.
import base from './h-wall-pec-r5.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-wall-pec-r7';
fixSide(s, 'right', 20, 0);
export default s;
