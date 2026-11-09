// h-crossbody-r10 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-crossbody-r9-mv2.
// Cross-body shoulder stretch: left upperArmTwist -30 elbowTwist -60.
import base from './h-crossbody-r9-mv2.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-crossbody-r10';
fixSide(s, 'left', -30, -60);
export default s;
