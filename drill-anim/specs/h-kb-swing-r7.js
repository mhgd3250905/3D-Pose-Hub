// h-kb-swing-r7 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-kb-swing-r6.
// Single-arm kettlebell swing: orientation-first, smaller upper-arm roll than h-kb-swing-r6 (which lost shoulder width): right upperArmTwist -25 elbowTwist +0.
import base from './h-kb-swing-r5-sc1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-kb-swing-r7';
fixSide(s, 'right', -25, 0);
export default s;
