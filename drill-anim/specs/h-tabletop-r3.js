// h-tabletop-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-tabletop-r2.
// Reverse tabletop: the upper arms already match the untouched right side (elbow pits forward-out, fingers to the feet). The left
// pinch came from the 11-05 et1 forearm roll (-180) that put the whole roll across the elbow. -r2 rolled the humerus 135 deg instead
// and folded the shoulder (0.89 -> 0.43). Now: upper arm untouched (upperArmTwist +0), forearm roll elbowTwist -160 so the roll sits
// at the wrist like the right side (runtime spreads hand-vs-forearm twist along the forearm). Joints/palms/poles/timing/camera unchanged.
import base from './h-tabletop-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-tabletop-r3';
fixSide(s, 'left', 0, -160);
export default s;
