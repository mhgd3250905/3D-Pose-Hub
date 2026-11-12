// h-db-front-raise-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-db-front-raise-r3.
// Dumbbell front raise: left upperArmTwist +0 elbowTwist +30, right upperArmTwist +0 elbowTwist -30.
import base from './h-db-front-raise-r3.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-db-front-raise-r4';
fixSide(s, 'left', 0, 30);
fixSide(s, 'right', 0, -30);
export default s;
