// forearms-B-r4 (ROM fix r1, 2026-11-10): brings forearm total twist (foreTot) within ROM.md r1.1 limits, based on forearms-B-r3.
// Forearms B: left upperArmTwist +15 elbowTwist +0.
import base from './forearms-B-r3.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'forearms-B-r4';
fixSide(s, 'left', 15, 0);
export default s;
