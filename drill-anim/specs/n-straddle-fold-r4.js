// n-straddle-fold-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on n-straddle-fold-r3.
// Straddle fold: left upperArmTwist +0 elbowTwist +30, right upperArmTwist +0 elbowTwist -30.
import base from './n-straddle-fold-r3.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'n-straddle-fold-r4';
fixSide(s, 'left', 0, 30);
fixSide(s, 'right', 0, -30);
export default s;
