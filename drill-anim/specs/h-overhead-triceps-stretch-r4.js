// h-overhead-triceps-stretch-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-overhead-triceps-stretch-r3.
// Overhead triceps stretch: right upperArmTwist +30 elbowTwist +0.
import base from './h-overhead-triceps-stretch-r3.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-overhead-triceps-stretch-r4';
fixSide(s, 'right', 30, 0);
export default s;
