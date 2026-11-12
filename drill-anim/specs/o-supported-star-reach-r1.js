// o-supported-star-reach-r1 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on o-supported-star-reach-et1.
// Supported star reach: left upperArmTwist +15 elbowTwist +0.
import base from './o-supported-star-reach-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'o-supported-star-reach-r1';
fixSide(s, 'left', 15, 0);
export default s;
