// s-figure4-r2-et1-sc2-fa1: crossed (right) foot angle fix of s-figure4-r2-et1-sc2 (foot-angle r1, 2026-11-06). User: in the supine
// figure-4 the raised/crossed foot and shoe were at a clearly wrong angle. Same root cause as o-seated-fig4 (ft1, 0bce78a): the source
// feet.right.rot [[Y,90],[Z,15]] is a fixed WORLD rotation that laid the shoe flat with the toes along the shin = ~90 deg plantar
// flexion relative to the real solved shin (anatomical max ~50). After: the foot follows the solved right shin (its delta from bind at
// the mid frame t=1.45) with 5 deg dorsiflexion ("flexed foot" cue for figure-4): toes point up to the ceiling, sole faces the left
// side past the left thigh, lateral ankle rests on the left thigh. Built with /workspace/work/foot-angle/design-fig4.mjs 5 0.
// Only the right foot rotation changes: ankle placement (sc1), open pole (sc2), arms (et1), left leg, timing and camera unchanged.
import base from './s-figure4-r2-et1-sc2.js';
const s = structuredClone(base);
s.id = 's-figure4-r2-et1-sc2-fa1';
s.pose.base.feet.right.rot = [[[-0.4505, 0.5615, 0.6941], 134.7695]];
export default s;
