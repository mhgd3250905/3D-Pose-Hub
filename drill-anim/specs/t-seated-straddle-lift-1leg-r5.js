// t-seated-straddle-lift-1leg-r5 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces t-seated-straddle-lift-1leg-r4.
// Seated straddle lifts: the 11-05 ht1 time-varying forearm-roll table (on top of the gc1 ground-contact spec) swung the forearm
// roll by up to 245 deg and pinched the elbows (0.42); -r4 pushed that roll into the shoulder (0.78 -> 0.35). Now: back to the gc1
// pose with no ht1 table; hand-vs-forearm twist is spread along the forearm by the runtime. Arms, hands, ground contact unchanged.
import base from './t-seated-straddle-lift-1leg-r3-gc1.js';
const s = structuredClone(base);
s.id = 't-seated-straddle-lift-1leg-r5';
export default s;
