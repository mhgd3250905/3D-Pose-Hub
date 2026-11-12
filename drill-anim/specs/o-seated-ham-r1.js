// o-seated-ham-r1 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on o-seated-ham-sc1.
// Seated hamstring stretch: left upperArmTwist +10 elbowTwist +0.
import base from './o-seated-ham-sc1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'o-seated-ham-r1';
fixSide(s, 'left', 10, 0);
export default s;
