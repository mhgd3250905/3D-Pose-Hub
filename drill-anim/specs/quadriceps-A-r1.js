// quadriceps-A-r1 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on quadriceps-A-et1.
// Quadriceps A: right upperArmTwist +0 elbowTwist -20.
import base from './quadriceps-A-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'quadriceps-A-r1';
fixSide(s, 'right', 0, -20);
export default s;
