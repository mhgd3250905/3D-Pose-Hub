// h-band-face-pull-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces -r2.
// Face pull start = arms reaching forward to the band. The upper arms already had the right orientation (elbow pits facing each
// other, inner arms facing) but the grip had the palms turned UP, a forearm roll the elbow cannot carry (cross-elbow twist 90 deg,
// elbow skin pinched to 0.79-0.80 of rest). -r2 compensated by rolling the humerus 90-100 deg EXTERNALLY at the shoulder, which turned
// the arms out ("外翻", user 2026-11-09) and folded the deltoid (shoulder band width ratio 0.85 -> 0.57).
// Now: upper arms untouched (pits face each other), both grips rolled 90 deg about the finger axis so the palms face each other
// (neutral grip). Elbow min width ratio L 0.80 -> 0.95 / R 0.79 -> 0.95, cross-elbow twist 90 -> 46 deg, hand-vs-forearm 69 -> 24 deg,
// shoulder band ratio unchanged (L 0.83 / R 0.85). Wrists, poles, timing, camera unchanged; the palm point (and the band ends tied to
// the hand bone) turns with the hand about the wrist (up to 35 mm).
import base from './h-band-face-pull-rr1-kn1.js';
import { rollHand } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-band-face-pull-r3';
rollHand(s, 'left', 90);
rollHand(s, 'right', -90);
export default s;
