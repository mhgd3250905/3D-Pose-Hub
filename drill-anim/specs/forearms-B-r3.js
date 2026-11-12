// forearms-B-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces forearms-B-r2.
// Seated dumbbell wrist curl + extension: forearm on the thigh, elbow pit forward. The left forearm roll took the long way round
// (about 170 deg across the elbow). -r2 rolled the humerus -135 deg (shoulder 0.98 -> 0.53). Now: upper arm untouched, left
// elbowTwist -220 (the short way); palm/hand/dumbbell unchanged.
import base from './forearms-B-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'forearms-B-r3';
fixSide(s, 'left', 0, -220);
export default s;
