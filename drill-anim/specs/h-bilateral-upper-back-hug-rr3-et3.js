// h-bilateral-upper-back-hug-rr3-et3 (pose-fix r1, 2026-11-05): et2 + a RIGHT elbowTwist compensation measured on armfix-r2
// (tools/elbow-audit-r1/scan-fast.mjs, 5 Hz, on et2-sc1): without it the right hand-vs-forearm roll drifts from -87 deg (rest) to
// -157 deg (hug hold), i.e. the right wrist reads as twisted. Track = measured roll + 75 deg, so the roll stays near -75 deg all loop.
// Everything else is et2's.
import base from './h-bilateral-upper-back-hug-rr3-et2.js';
const s = structuredClone(base);
s.id = 'h-bilateral-upper-back-hug-rr3-et3';
s.pose.base.hands.right.elbowTwist = 0;
s.pose.deltas.et3_right_elbowTwist = { hands: { right: { elbowTwist: 1 } } };
s.timeline.tracks.et3_right_elbowTwist = [[0, -12.1, "linear"], [0.2, -12.1, "linear"], [0.4, -12.1, "linear"], [0.6, -12.57, "linear"], [0.8, -16.05, "linear"], [1, -22.89, "linear"], [1.2, -32.45, "linear"], [1.4, -43.65, "linear"], [1.6, -55.16, "linear"], [1.8, -65.57, "linear"], [2, -73.56, "linear"], [2.2, -79.06, "linear"], [2.4, -81.91, "linear"], [2.6, -82.25, "linear"], [2.8, -82.25, "linear"], [3, -82.25, "linear"], [3.2, -82.25, "linear"], [3.4, -82.25, "linear"], [3.6, -82.25, "linear"], [3.8, -82.25, "linear"], [4, -82.25, "linear"], [4.2, -82.25, "linear"], [4.4, -82.25, "linear"], [4.6, -82.25, "linear"], [4.8, -82.25, "linear"], [5, -82.25, "linear"], [5.2, -82.25, "linear"], [5.4, -82.25, "linear"], [5.6, -81.98, "linear"], [5.8, -79.24, "linear"], [6, -73.73, "linear"], [6.2, -65.51, "linear"], [6.4, -55.18, "linear"], [6.6, -43.72, "linear"], [6.8, -32.37, "linear"], [7, -22.84, "linear"], [7.2, -16.1, "linear"], [7.4, -12.53, "linear"], [7.6, -12.1, "linear"], [7.8, -12.1, "linear"], [8, -12.1, "linear"]];
export default s;
