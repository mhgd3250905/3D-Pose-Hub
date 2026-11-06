// s-figure4-r2-et1-sc1: crossed (right) ankle placement fix of s-figure4-r2-et1 (pose-fix r4, 2026-11-05). The source ankle target
// [0.10,0.37,0.11] was authored for the old leg; on the current model it sits ~9.7 cm from the solved left thigh axis, so the
// shoe heel hung ~7 cm into the left thigh (self-collision d10 69 mm). The ankle is moved off the real solved left thigh
// (hip [0.082,0.109,0.048] -> knee [0.105,0.442,0.286]) along its front normal (two measured passes, ~8 cm), so the outer ankle
// rests on top of the thigh. Foot rotation, arms (et1 twist), left leg, timing and camera are the source's.
import base from './s-figure4-r2-et1.js';
const s = structuredClone(base);
s.id = 's-figure4-r2-et1-sc1';
const OFF = [0.0090, 0.072, -0.041];
const add = (a, b) => a.map((x, i) => +(x + b[i]).toFixed(4));
s.pose.base.feet.right.ankle = add(s.pose.base.feet.right.ankle, OFF);
s.pose.deltas.open.feet.right.ankle = add(s.pose.deltas.open.feet.right.ankle, OFF);
export default s;
