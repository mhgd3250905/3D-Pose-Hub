// scapular-A-r4 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces scapular-A-r3.
// Prone Y-T-W raise: orientation-first, smaller upper-arm roll than scapular-A-r3 (which lost shoulder width): left upperArmTwist -20 elbowTwist +60, right upperArmTwist +30 elbowTwist -170.
import base from './scapular-A-r2-gc1-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'scapular-A-r4';
fixSide(s, 'left', -20, 60);
fixSide(s, 'right', 30, -170);
export default s;
