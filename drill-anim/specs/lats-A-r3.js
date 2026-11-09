// lats-A-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces lats-A-r2.
// Seated hip lift with hands on floor: orientation-first, smaller upper-arm roll than lats-A-r2 (which lost shoulder width): left upperArmTwist +60 elbowTwist +0, right upperArmTwist -60 elbowTwist +0.
import base from './lats-A-wb-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'lats-A-r3';
fixSide(s, 'left', 60, 0);
fixSide(s, 'right', -60, 0);
export default s;
