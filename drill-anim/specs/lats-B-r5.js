// lats-B-r5 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on lats-B-r4.
// Lats B: right upperArmTwist +0 elbowTwist -30.
import base from './lats-B-r4.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'lats-B-r5';
fixSide(s, 'right', 0, -30);
export default s;
