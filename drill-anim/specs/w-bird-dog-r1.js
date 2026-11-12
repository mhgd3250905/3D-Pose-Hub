// w-bird-dog-r1 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on w-bird-dog-gc1.
// Bird dog: left upperArmTwist -10 elbowTwist +0.
import base from './w-bird-dog-gc1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'w-bird-dog-r1';
fixSide(s, 'left', -10, 0);
export default s;
