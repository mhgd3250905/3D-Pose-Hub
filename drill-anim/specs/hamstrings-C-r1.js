// hamstrings-C-r1 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on hamstrings-C.
// Hamstrings C: left upperArmTwist +10 elbowTwist +0, right upperArmTwist -10 elbowTwist +0.
import base from './hamstrings-C.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'hamstrings-C-r1';
fixSide(s, 'left', 10, 0);
fixSide(s, 'right', -10, 0);
export default s;
