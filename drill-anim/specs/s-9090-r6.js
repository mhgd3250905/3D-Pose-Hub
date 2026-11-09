// s-9090-r6 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on s-9090-r5.
// 90/90 hip switch: left upperArmTwist +25 elbowTwist +0.
import base from './s-9090-r5.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 's-9090-r6';
fixSide(s, 'left', 25, 0);
export default s;
