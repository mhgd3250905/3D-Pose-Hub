// h-chair-elbow-triceps-stretch-r5 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-chair-elbow-triceps-stretch-r4-kn1.
// Chair elbow triceps stretch: left upperArmTwist -30 elbowTwist +0, right upperArmTwist +30 elbowTwist +0.
import base from './h-chair-elbow-triceps-stretch-r4-kn1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-chair-elbow-triceps-stretch-r5';
fixSide(s, 'left', -30, 0);
fixSide(s, 'right', 30, 0);
export default s;
