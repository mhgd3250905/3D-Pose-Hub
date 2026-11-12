// s-9090-r5 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on s-9090-r4-sc1-et1.
// 90/90 hip stretch: right upperArmTwist -40 elbowTwist +0.
import base from './s-9090-r4-sc1-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 's-9090-r5';
fixSide(s, 'right', -40, 0);
export default s;
