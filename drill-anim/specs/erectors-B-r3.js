// erectors-B-r3 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on erectors-B-r2.
// Erectors B: left upperArmTwist +45 elbowTwist +0, right upperArmTwist -45 elbowTwist +0.
import base from './erectors-B-r2.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'erectors-B-r3';
fixSide(s, 'left', 45, 0);
fixSide(s, 'right', -45, 0);
export default s;
