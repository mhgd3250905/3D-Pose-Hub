// h-band-pull-apart-r3 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on h-band-pull-apart-r2-kn1.
// Band pull-apart: left upperArmTwist +0 elbowTwist +15, right upperArmTwist +0 elbowTwist -15.
import base from './h-band-pull-apart-r2-kn1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-band-pull-apart-r3';
fixSide(s, 'left', 0, 15);
fixSide(s, 'right', 0, -15);
export default s;
