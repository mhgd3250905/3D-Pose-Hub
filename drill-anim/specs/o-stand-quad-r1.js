// o-stand-quad-r1 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on o-stand-quad.
// Standing quad stretch: left upperArmTwist +15 elbowTwist +0.
import base from './o-stand-quad.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'o-stand-quad-r1';
fixSide(s, 'left', 15, 0);
export default s;
