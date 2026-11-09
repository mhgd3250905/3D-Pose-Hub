// h-tabletop-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-tabletop-r3.
// Tabletop: left upperArmTwist +60 elbowTwist +0, right upperArmTwist -60 elbowTwist +0.
import base from './h-tabletop-r3.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-tabletop-r4';
fixSide(s, 'left', 60, 0);
fixSide(s, 'right', -60, 0);
export default s;
