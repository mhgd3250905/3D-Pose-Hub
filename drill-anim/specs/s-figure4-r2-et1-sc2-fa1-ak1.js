// s-figure4 ak1 (2026-11-07): crossed right ankle was hanging in the air above the
// left thigh. Moved onto the thigh ~10 cm above the knee (same offset in base and
// open delta), and the foot re-oriented so the hold reads ~10 deg dorsiflexion,
// neutral inversion (fa1 rot followed the shin but drifted to ~0 deg at the hold).
import base from './s-figure4-r2-et1-sc2-fa1.js';
const s = structuredClone(base);
s.id = 's-figure4-r2-et1-sc2-fa1-ak1';
const OFF = [-0.0029, 0.0027, 0.0483];
const add = (a, b) => a.map((x, i) => +(x + b[i]).toFixed(4));
s.pose.base.feet.right.ankle = add(s.pose.base.feet.right.ankle, OFF);
s.pose.deltas.open.feet.right.ankle = add(s.pose.deltas.open.feet.right.ankle, OFF);
s.pose.base.feet.right.rot = [[[-0.4718, 0.5427, 0.6949], 154.2391]];
export default s;
