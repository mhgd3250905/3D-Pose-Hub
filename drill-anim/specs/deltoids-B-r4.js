// deltoids-B-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on deltoids-B-r3.
// Deltoids B: left upperArmTwist +15 elbowTwist +0.
import base from './deltoids-B-r3.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'deltoids-B-r4';
fixSide(s, 'left', 15, 0);
export default s;
