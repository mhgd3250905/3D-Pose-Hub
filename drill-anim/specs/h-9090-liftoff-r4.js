// h-9090-liftoff-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-9090-liftoff-r3-et1.
// 90/90 lift-off: left upperArmTwist +15 elbowTwist +0.
import base from './h-9090-liftoff-r3-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-9090-liftoff-r4';
fixSide(s, 'left', 15, 0);
export default s;
