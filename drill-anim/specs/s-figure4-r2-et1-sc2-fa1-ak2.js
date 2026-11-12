// s-figure4 ak2 (2026-11-07): user on device: with ak1 the crossed right foot still read as floating. ak1 put the outer ankle on
// top of the left thigh, so the foot stood straight up over the knee and the shin never lay across it. ak2 moves the right ankle
// past the outer (+X) side of the left thigh, so the lower right shin lies across the left thigh just above the knee and the foot
// hangs off the outside (classic figure 4). Base ankle +[0.05,-0.016,0], open ankle +[0.05,0.064,0] over ak1: shin-on-thigh
// contact through the whole loop (gap t0.3 -1.2 / t1.0 +0.9 / t3.8 -0.6 mm, ~6-10 cm from the knee). Foot rotation, left leg,
// arms, poles and timing are ak1's. The recipe camera moves to the planted-leg side so the crossing is not foreshortened.
import base from './s-figure4-r2-et1-sc2-fa1-ak1.js';
const s = structuredClone(base);
s.id = 's-figure4-r2-et1-sc2-fa1-ak2';
const add = (a, b) => a.map((x, i) => +(x + b[i]).toFixed(4));
s.pose.base.feet.right.ankle = add(s.pose.base.feet.right.ankle, [0.05, -0.016, 0]);
s.pose.deltas.open.feet.right.ankle = add(s.pose.deltas.open.feet.right.ankle, [0.05, 0.064, 0]);
export default s;
