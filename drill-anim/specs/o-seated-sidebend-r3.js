// o-seated-sidebend-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces o-seated-sidebend-r2.
// Seated side bend, right arm overhead: elbow pit forward, palm facing in (same as the untouched left side). -r2 rolled the humerus
// 125 deg and widened the cross-shoulder twist (38 -> 87 deg). Now: upper arm untouched, forearm roll elbowTwist -225 only.
import base from './o-seated-sidebend-rr2-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'o-seated-sidebend-r3';
fixSide(s, 'right', 0, -225);
export default s;
