// h-goblet-squat-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-goblet-squat-r3-et1-kn1.
// Goblet squat: left upperArmTwist +10 elbowTwist +0, right upperArmTwist -10 elbowTwist +0.
import base from './h-goblet-squat-r3-et1-kn1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-goblet-squat-r4';
fixSide(s, 'left', 10, 0);
fixSide(s, 'right', -10, 0);
export default s;
